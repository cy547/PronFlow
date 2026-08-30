/**
 * 数据同步服务（唯一后端接口层）
 *
 * 前端业务代码只依赖本文件暴露的能力；后端契约：
 *   POST /api/auth/register | /api/auth/login  {username, pwdHash} → {token, username}
 *   GET  /api/data   → {data: UserData | null, updatedAt}
 *   PUT  /api/data   {data, updatedAt}
 *
 * 平台无关：换后端平台时只需照契约重新实现服务端，本文件最多改一个 API_BASE。
 * 密码在浏览器端 PBKDF2 哈希后传输，明文不出设备。
 */
import { useEffect, useRef, useState } from 'react'
import type { UserData } from '../types'

const AUTH_KEY = 'pronflow-auth-v1'
export const API_BASE = '/api' // 未来换平台/自建服务器，改这里即可

/* ---------- 认证状态 ---------- */

export interface SyncAuth {
  token: string
  username: string
}

function readAuth(): SyncAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const a = JSON.parse(raw)
    return a?.token && a?.username ? a : null
  } catch {
    return null
  }
}

function writeAuth(a: SyncAuth | null) {
  if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a))
  else localStorage.removeItem(AUTH_KEY)
}

/* ---------- 密码哈希（浏览器端，明文不出设备） ---------- */

async function hashPassword(username: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const saltBytes = await crypto.subtle.digest('SHA-256', enc.encode(`pronflow:${username.toLowerCase()}`))
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 120000 }, key, 256)
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/* ---------- 低层请求 ---------- */

async function apiPost(path: string, body: unknown): Promise<{ ok: boolean; status: number; error?: string; token?: string; username?: string }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    const j = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, error: j?.error, token: j?.token, username: j?.username }
  } catch {
    return { ok: false, status: 0, error: '网络错误，请稍后再试' }
  }
}

async function apiGetData(token: string): Promise<{ ok: boolean; error?: string; data: UserData | null; reauth?: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/data`, { headers: { authorization: `Bearer ${token}` } })
    const j = await res.json().catch(() => ({}))
    if (res.status === 401) return { ok: false, reauth: true, error: j?.error ?? '登录已过期', data: null }
    return { ok: res.ok, error: j?.error, data: (j?.data ?? null) as UserData | null }
  } catch {
    return { ok: false, error: '网络错误', data: null }
  }
}

async function apiPutData(token: string, data: UserData, updatedAt: number): Promise<{ ok: boolean; error?: string; reauth?: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/data`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ data, updatedAt }),
    })
    const j = await res.json().catch(() => ({}))
    if (res.status === 401) return { ok: false, reauth: true, error: j?.error ?? '登录已过期' }
    return { ok: res.ok, error: j?.error }
  } catch {
    return { ok: false, error: '网络错误' }
  }
}

/* ---------- 合并策略（union + 新者胜，保证不丢任何一侧数据） ---------- */

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
    const cur = review[k]
    const cu = cur?.updatedAt ?? 0
    const vu = (v as { updatedAt?: number }).updatedAt ?? 0
    if (!cur || vu > cu) review[k] = v
  }

  const history = [...new Set([...local.history, ...cloud.history])].slice(0, 12)
  const stats = {
    tests: Math.max(local.stats.tests, cloud.stats.tests),
    reviews: Math.max(local.stats.reviews, cloud.stats.reviews),
    streak: Math.max(local.stats.streak, cloud.stats.streak),
    lastActive: local.stats.lastActive > cloud.stats.lastActive ? local.stats.lastActive : cloud.stats.lastActive,
  }
  return { ...local, customScenes: scenes, customMaterials: mats, favorites, review, history, stats }
}

/* ---------- 账号 Hook（供 UI 使用） ---------- */

export interface SyncStatus {
  at: number
  error?: string
}

export function useSyncAccount(replaceData: (d: UserData) => void, getData: () => UserData) {
  const [auth, setAuth] = useState<SyncAuth | null>(readAuth)
  const [busy, setBusy] = useState<'login' | 'register' | 'sync' | null>(null)
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const dataRef = useRef(getData())
  dataRef.current = getData()
  const startedRef = useRef(false)

  const doAuth = async (mode: 'login' | 'register', username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return { ok: false, error: '用户名需 3~20 位字母/数字/下划线' }
    if (password.length < 6) return { ok: false, error: '密码至少 6 位' }
    setBusy(mode)
    const pwdHash = await hashPassword(username, password)
    const r = await apiPost(`/auth/${mode}`, { username, pwdHash })
    setBusy(null)
    if (!r.ok) return { ok: false, error: r.error ?? '操作失败' }
    const a: SyncAuth = { token: r.token!, username: r.username! }
    writeAuth(a)
    setAuth(a)
    return { ok: true }
  }

  const logout = () => {
    writeAuth(null)
    setAuth(null)
    setStatus(null)
  }

  const pushNow = async () => {
    const a = readAuth()
    if (!a) return
    const r = await apiPutData(a.token, dataRef.current, Date.now())
    if (r.reauth) {
      logout()
      return
    }
    setStatus(r.ok ? { at: Date.now() } : { at: Date.now(), error: r.error ?? '同步失败' })
  }

  const syncNow = async () => {
    const a = readAuth()
    if (!a) return
    setBusy('sync')
    const r = await apiGetData(a.token)
    if (r.reauth) {
      logout()
      setBusy(null)
      return
    }
    if (r.ok && r.data) {
      replaceData(mergeUserData(dataRef.current, r.data))
      setStatus({ at: Date.now() })
    } else if (r.ok) {
      await pushNow()
      setStatus({ at: Date.now() })
    } else {
      setStatus({ at: Date.now(), error: r.error ?? '同步失败' })
    }
    setBusy(null)
  }

  /* 登录后：拉取云端并合并一次；之后监听数据变更自动推送 */
  useEffect(() => {
    if (!auth) return
    let cancelled = false

    if (!startedRef.current) {
      startedRef.current = true
      void (async () => {
        const r = await apiGetData(auth.token)
        if (cancelled) return
        if (r.reauth) {
          logout()
          return
        }
        if (r.ok && r.data) {
          replaceData(mergeUserData(dataRef.current, r.data))
          setStatus({ at: Date.now() })
        } else if (r.ok) {
          await pushNow()
        } else {
          setStatus({ at: Date.now(), error: r.error ?? '云端连接失败，稍后自动重试' })
        }
      })()
    }

    let timer = 0
    const onChange = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void pushNow(), 2500)
    }
    window.addEventListener('pf-data-changed', onChange)
    return () => {
      cancelled = true
      window.removeEventListener('pf-data-changed', onChange)
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token])

  return { auth, busy, status, doAuth, logout, syncNow }
}
