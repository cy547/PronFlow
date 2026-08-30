/** 云端同步服务（Taro 版，复用与网页版相同的 REST 契约） */
import Taro from '@tarojs/taro'
import type { UserData } from '../shared/types'

const AUTH_KEY = 'pronflow-auth-v1'
export const API_BASE = 'https://pronflow-dpu548yj649n.edgeone.cool/api'

export interface SyncAuth {
  token: string
  username: string
}

function readAuth(): SyncAuth | null {
  try {
    const raw = Taro.getStorageSync(AUTH_KEY)
    if (!raw) return null
    const a = typeof raw === 'string' ? JSON.parse(raw) : raw
    return a?.token && a?.username ? a : null
  } catch {
    return null
  }
}

function writeAuth(a: SyncAuth | null) {
  if (a) Taro.setStorageSync(AUTH_KEY, JSON.stringify(a))
  else Taro.removeStorageSync(AUTH_KEY)
}

/** 紧凑版 SHA-256（纯 JS），用于密码摘要；明文不出设备 */
export function sha256(ascii: string): string {
  function rightRotate(v: number, a: number) {
    return (v >>> a) | (v << (32 - a))
  }
  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  let result = ''
  const words: number[] = []
  const asciiBitLength = ascii.length * 8
  const hash: number[] = []
  const k: number[] = []
  let primeCounter = 0
  const isComposite: Record<number, number> = {}
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0
    }
  }
  ascii += '\x80'
  while ((ascii.length % 64) - 56) ascii += '\x00'
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i)
    if (j >> 8) return ''
    words[i >> 2] |= j << (((3 - i) % 4) * 8)
  }
  words[words.length] = (asciiBitLength / maxWord) | 0
  words[words.length] = asciiBitLength
  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16))
    const oldHash = hash.slice(0, 8)
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15]
      const w2 = w[i - 2]
      const a = hash[0]
      const e = hash[4]
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0)
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]))
      hash[(i + 7) % 8] = (hash[(i + 7) % 8] + temp1) | 0
      hash[(i + 3) % 8] = (hash[(i + 3) % 8] + temp1 + temp2) | 0
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255
      result += (b < 16 ? '0' : '') + b.toString(16)
    }
  }
  return result
}

export function hashPassword(username: string, password: string): string {
  return sha256(`pronflow:${username.toLowerCase()}:${password}`)
}

async function request(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown, token?: string): Promise<any> {
  const res = await Taro.request({
    url: `${API_BASE}${path}`,
    method,
    data: body as Record<string, unknown> | undefined,
    header: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  })
  return res.data ?? {}
}

export async function doAuth(mode: 'login' | 'register', username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return { ok: false, error: '用户名需 3~20 位字母/数字/下划线' }
  if (password.length < 6) return { ok: false, error: '密码至少 6 位' }
  try {
    const r = await request('POST', `/auth/${mode}`, { username, pwdHash: hashPassword(username, password) })
    if (r?.token) {
      writeAuth({ token: r.token, username: r.username })
      return { ok: true }
    }
    return { ok: false, error: r?.error ?? '操作失败' }
  } catch {
    return { ok: false, error: '网络错误，请稍后再试' }
  }
}

export function logout() {
  writeAuth(null)
}

export function getAuth(): SyncAuth | null {
  return readAuth()
}

export async function pullData(token: string): Promise<{ ok: boolean; data: UserData | null; reauth?: boolean; error?: string }> {
  try {
    const r = await request('GET', '/data', undefined, token)
    if (r?.error && !('data' in r)) return { ok: false, reauth: true, error: r.error, data: null }
    return { ok: true, data: (r?.data ?? null) as UserData | null }
  } catch {
    return { ok: false, error: '网络错误', data: null }
  }
}

export async function pushData(token: string, data: UserData): Promise<{ ok: boolean; error?: string; reauth?: boolean }> {
  try {
    const r = await request('PUT', '/data', { data, updatedAt: Date.now() }, token)
    if (r?.error) return { ok: false, error: r.error, reauth: !!r.reauth }
    return { ok: true }
  } catch {
    return { ok: false, error: '网络错误' }
  }
}

export function mergeUserData(local: UserData, cloud: UserData): UserData {
  const scenes = [...local.customScenes]
  for (const s of cloud.customScenes) if (!scenes.some((x) => x.id === s.id)) scenes.push(s)
  const mats = [...local.customMaterials]
  for (const m of cloud.customMaterials) if (!mats.some((x) => x.id === m.id)) mats.push(m)
  const favorites = { ...local.favorites }
  for (const [k, v] of Object.entries(cloud.favorites)) {
    const cur = favorites[k]
    if (!cur || v.addedAt > cur.addedAt) favorites[k] = v
  }
  const review = { ...local.review }
  for (const [k, v] of Object.entries(cloud.review)) {
    const cu = cur?.updatedAt ?? 0
    const vu = v.updatedAt ?? 0
    if (!cur || vu > cu) review[k] = v
  }
  const history = [...new Set([...local.history, ...cloud.history])].slice(0, 12)
  return {
    ...local,
    customScenes: scenes,
    customMaterials: mats,
    favorites,
    review,
    history,
    stats: {
      tests: Math.max(local.stats.tests, cloud.stats.tests),
      reviews: Math.max(local.stats.reviews, cloud.stats.reviews),
      streak: Math.max(local.stats.streak, cloud.stats.streak),
      lastActive: local.stats.lastActive > cloud.stats.lastActive ? local.stats.lastActive : cloud.stats.lastActive,
    },
  }
}
