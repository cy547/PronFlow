/** 用户数据存储（Taro 版）：模块级单例 + 订阅，结构与网页版完全一致 */
import Taro from '@tarojs/taro'
import type { FavKind, Material, ReviewItem, Scene, UserData } from '../shared/types'
import { addDays, todayStr } from '../shared/types'

const KEY = 'pronflow-userdata-v1'

const DEFAULT: UserData = {
  settings: { accent: 'US', rate: 'normal' },
  pinned: [],
  customScenes: [],
  customMaterials: [],
  favorites: {},
  review: {},
  history: [],
  stats: { tests: 0, reviews: 0, lastActive: '', streak: 0 },
}

function load(): UserData {
  try {
    const raw = Taro.getStorageSync(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { ...DEFAULT, ...parsed, stats: { ...DEFAULT.stats, ...(parsed.stats || {}) } }
  } catch {
    return { ...DEFAULT }
  }
}

let state: UserData = load()
const subs = new Set<() => void>()

function commit(next: UserData) {
  state = next
  try {
    Taro.setStorageSync(KEY, JSON.stringify(state))
  } catch {
    /* 忽略 */
  }
  subs.forEach((fn) => fn())
}

export function getUserData(): UserData {
  return state
}

/** 订阅数据变化（供 hook 使用），返回退订函数 */
export function subscribe(fn: () => void): () => void {
  subs.add(fn)
  return () => subs.delete(fn)
}

export const favKey = (kind: FavKind, id: string) => `${kind}:${id}`

function upsertReview(d: UserData, args: { kind: FavKind; id: string; en: string; zh: string; sceneId?: string }, result?: 'good' | 'again'): UserData {
  const key = favKey(args.kind, args.id)
  const prev = d.review[key]
  let interval: number
  let streak: number
  if (!prev) {
    interval = result === 'good' ? 2 : 1
    streak = result === 'good' ? 1 : 0
  } else if (result === 'again') {
    interval = 1
    streak = 0
  } else {
    interval = Math.min((prev.interval || 1) * 2, 60)
    streak = prev.streak + 1
  }
  const next: ReviewItem = {
    key,
    en: args.en,
    zh: args.zh,
    kind: args.kind,
    sceneId: args.sceneId,
    addedAt: prev?.addedAt ?? Date.now(),
    next: result === undefined ? todayStr() : addDays(interval),
    interval,
    streak,
    updatedAt: Date.now(),
  }
  return { ...d, review: { ...d.review, [key]: next } }
}

export const actions = {
  setSettings(s: Partial<UserData['settings']>) {
    commit({ ...state, settings: { ...state.settings, ...s } })
  },
  togglePin(id: string) {
    commit({
      ...state,
      pinned: state.pinned.includes(id) ? state.pinned.filter((p) => p !== id) : [id, ...state.pinned],
    })
  },
  addCustomScene(s: Omit<Scene, 'custom'>) {
    commit({ ...state, customScenes: [{ ...s, custom: true }, ...state.customScenes] })
  },
  updateCustomScene(id: string, patch: Partial<Scene>) {
    commit({ ...state, customScenes: state.customScenes.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  },
  deleteCustomScene(id: string) {
    commit({
      ...state,
      customScenes: state.customScenes.filter((s) => s.id !== id),
      customMaterials: state.customMaterials.filter((m) => m.sceneId !== id),
      pinned: state.pinned.filter((p) => p !== id),
    })
  },
  addCustomMaterial(m: Material) {
    commit({ ...state, customMaterials: [m, ...state.customMaterials] })
  },
  updateCustomMaterial(id: string, patch: Partial<Material>) {
    commit({ ...state, customMaterials: state.customMaterials.map((m) => (m.id === id ? ({ ...m, ...patch } as Material) : m)) })
  },
  deleteCustomMaterial(id: string) {
    commit({ ...state, customMaterials: state.customMaterials.filter((m) => m.id !== id) })
  },
  toggleFav(args: { kind: FavKind; id: string; en: string; zh: string; sceneId?: string }) {
    const key = favKey(args.kind, args.id)
    const favorites = { ...state.favorites }
    if (favorites[key]) {
      delete favorites[key]
      commit({ ...state, favorites })
    } else {
      favorites[key] = { key, kind: args.kind, addedAt: Date.now() }
      commit(upsertReview({ ...state, favorites }, args))
    }
  },
  /** 自测/复习评分：卡住=明天重来，说出=间隔翻倍 */
  rate(args: { kind: FavKind; id: string; en: string; zh: string; sceneId?: string; result: 'good' | 'again'; isTest?: boolean }) {
    const next = upsertReview(state, args, args.result)
    const k: keyof UserData['stats'] = args.isTest ? 'tests' : 'reviews'
    commit({ ...next, stats: { ...next.stats, [k]: (next.stats[k] as number) + 1 } })
  },
  pushHistory(q: string) {
    const t = q.trim()
    if (!t) return
    commit({ ...state, history: [t, ...state.history.filter((h) => h !== t)].slice(0, 12) })
  },
  clearHistory() {
    commit({ ...state, history: [] })
  },
  /** 云端合并后整体替换 */
  replaceData(d: UserData) {
    commit(d)
  },
  /** 激活打卡（日期变化时刷新 streak） */
  touchStreak() {
    const today = todayStr()
    if (state.stats.lastActive === today) return
    const yesterday = addDays(-1)
    const streak = state.stats.lastActive === yesterday ? state.stats.streak + 1 : 1
    commit({ ...state, stats: { ...state.stats, lastActive: today, streak } })
  },
  exportJSON(): string {
    return JSON.stringify({ app: 'PronFlow', version: 1, exportedAt: new Date().toISOString(), data: state }, null, 2)
  },
  importJSON(raw: string): boolean {
    try {
      const obj = JSON.parse(raw)
      const d = obj?.data ?? obj
      if (!d || typeof d !== 'object' || !('settings' in d)) return false
      commit({ ...DEFAULT, ...d, stats: { ...DEFAULT.stats, ...(d.stats || {}) } })
      return true
    } catch {
      return false
    }
  },
}

/** 今日待复习清单（上限 20 条） */
export function dueItems(): ReviewItem[] {
  const today = todayStr()
  return Object.values(state.review)
    .filter((r) => r.next <= today)
    .sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : a.addedAt - b.addedAt))
    .slice(0, 20)
}
