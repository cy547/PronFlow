/**
 * PronFlow 数据同步 API（EdgeOne Pages 边缘函数）
 *
 * REST 契约（平台无关，任何能跑 HTTP + KV 的平台都可照此实现）：
 *   POST /api/auth/register  {username, pwdHash} → {token, username}
 *   POST /api/auth/login     {username, pwdHash} → {token, username}
 *   GET  /api/data           Authorization: Bearer <token> → {data, updatedAt} | {data: null}
 *   PUT  /api/data           Authorization: Bearer <token> + {data, updatedAt} → {ok, updatedAt}
 *
 * KV 命名空间绑定变量名必须是 pf_kv（控制台项目 → KV 存储 → 绑定时填写）。
 * 密码在浏览器端已完成 PBKDF2 哈希，此函数只存/比哈希，不接触明文。
 */

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 天
const MAX_DATA_BYTES = 900 * 1024 // 边缘函数请求 body 上限 1MB，留余量
const NAME_RE = /^[A-Za-z0-9_]{3,20}$/

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })

function randomToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

async function authUser(request) {
  const header = request.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token || !/^[0-9a-f]{48}$/.test(token)) return null
  const raw = await pf_kv.get(`pf_tok_${token}`)
  if (!raw) return null
  try {
    const rec = JSON.parse(raw)
    if (!rec.u || Date.now() > rec.exp) return null
    return { username: rec.u, token }
  } catch {
    return null
  }
}

async function issueToken(username) {
  const token = randomToken()
  await pf_kv.put(`pf_tok_${token}`, JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS }))
  return token
}

export async function onRequest(context) {
  const { request, params } = context
  const route = (params.route || []).join('/')
  const method = request.method

  try {
    /* ---------- 注册 ---------- */
    if (route === 'auth/register' && method === 'POST') {
      const body = await readJson(request)
      const username = String(body?.username || '')
      const pwdHash = String(body?.pwdHash || '')
      if (!NAME_RE.test(username)) return json({ error: '用户名需 3~20 位字母/数字/下划线' }, 400)
      if (!/^[0-9a-f]{64}$/.test(pwdHash)) return json({ error: '密码哈希格式错误' }, 400)
      const key = `pf_user_${username}`
      if (await pf_kv.get(key)) return json({ error: '用户名已被注册' }, 409)
      await pf_kv.put(key, JSON.stringify({ u: username, hash: pwdHash, created: Date.now() }))
      const token = await issueToken(username)
      return json({ token, username })
    }

    /* ---------- 登录 ---------- */
    if (route === 'auth/login' && method === 'POST') {
      const body = await readJson(request)
      const username = String(body?.username || '')
      const pwdHash = String(body?.pwdHash || '')
      if (!NAME_RE.test(username) || !/^[0-9a-f]{64}$/.test(pwdHash)) return json({ error: '用户名或密码错误' }, 401)
      const raw = await pf_kv.get(`pf_user_${username}`)
      if (!raw) return json({ error: '用户名或密码错误' }, 401)
      const rec = JSON.parse(raw)
      if (rec.hash !== pwdHash) return json({ error: '用户名或密码错误' }, 401)
      const token = await issueToken(username)
      return json({ token, username })
    }

    /* ---------- 拉取数据 ---------- */
    if (route === 'data' && method === 'GET') {
      const auth = await authUser(request)
      if (!auth) return json({ error: '登录已过期，请重新登录' }, 401)
      const raw = await pf_kv.get(`pf_data_${auth.username}`)
      if (!raw) return json({ data: null, updatedAt: 0 })
      const parsed = JSON.parse(raw)
      return json({ data: parsed.data ?? null, updatedAt: parsed.updatedAt ?? 0 })
    }

    /* ---------- 推送数据 ---------- */
    if (route === 'data' && method === 'PUT') {
      const auth = await authUser(request)
      if (!auth) return json({ error: '登录已过期，请重新登录' }, 401)
      const body = await readJson(request)
      const payload = { data: body?.data, updatedAt: Number(body?.updatedAt) || Date.now() }
      if (!payload.data || typeof payload.data !== 'object') return json({ error: '数据格式错误' }, 400)
      const serialized = JSON.stringify(payload)
      if (serialized.length > MAX_DATA_BYTES) return json({ error: '数据超出云端容量限制' }, 413)
      await pf_kv.put(`pf_data_${auth.username}`, serialized)
      return json({ ok: true, updatedAt: payload.updatedAt })
    }

    /* ---------- 诊断：测试各 TTS 音源出站可达性 ---------- */
    if (route === 'ping' && method === 'GET') {
      const u = new URL(request.url)
      const text = u.searchParams.get('text') || 'hello world'
      const out = {}
      for (const [name, src] of [
        ['youdao', `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(text)}`],
        ['baidu', `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(text)}&spd=3&source=web`],
      ]) {
        try {
          const r = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0' } })
          out[name] = { status: r.status, type: r.headers.get('content-type')?.slice(0, 30), bytes: (await r.arrayBuffer()).byteLength }
        } catch (e) {
          out[name] = { error: String(e).slice(0, 100) }
        }
      }
      out.kvBound = typeof pf_kv !== 'undefined'
      return json(out)
    }

    /* ---------- 云端发音代理（解决小程序 Referer 防盗链 + 有道不支持句子） ---------- */
    if (route === 'tts' && method === 'GET') {
      const u = new URL(request.url)
      const text = (u.searchParams.get('text') || '').trim()
      const accent = u.searchParams.get('type') === 'uk' ? 1 : 2
      if (!text || text.length > 300) return json({ error: 'bad text' }, 400)
      const youdao = `https://dict.youdao.com/dictvoice?type=${accent}&audio=${encodeURIComponent(text)}`
      const baidu = `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(text)}&spd=3&source=web`
      // 单词(≤3词)→有道真人录音优先；句子→百度神经语音优先（有道不支持长句）
      const wordCount = text.split(/\s+/).length
      const sources = wordCount <= 3 ? [youdao, baidu] : [baidu, youdao]
      for (const src of sources) {
        try {
          const r = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
          const ct = r.headers.get('content-type') || ''
          if (r.ok && ct.includes('audio')) {
            const buf = await r.arrayBuffer()
            return new Response(buf, {
              headers: {
                'content-type': 'audio/mpeg',
                'cache-control': 'public, max-age=86400',
                'access-control-allow-origin': '*',
              },
            })
          }
        } catch {
          /* 尝试下一家 */
        }
      }
      return json({ error: 'tts unavailable' }, 502)
    }

    return json({ error: 'not found' }, 404)
  } catch (e) {
    return json({ error: '服务器内部错误', detail: String(e).slice(0, 120) }, 500)
  }
}
