/** 用户数据层：localStorage 持久化 + 全局 Context */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Accent, FavKind, Material, ReviewItem, Scene, UserData } from '../types'
import { addDays, todayStr } from '../types'

const KEY = 'pronflow-userdata-v1'

const DEFAULT_DATA: UserData = {
  settings: { accent: 'US', rate: 'normal', voiceSource: 'cloud' },
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
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_DATA }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_DATA, ...parsed, stats: { ...DEFAULT_DATA.stats, ...(parsed.stats || {}) } }
  } catch {
    return { ...DEFAULT_DATA }
  }
}

/** 每日复习清单上限 */
export const DAILY_REVIEW_CAP = 20

interface Ctx {
  data: UserData
  setSettings: (s: Partial<UserData['settings']>) => void
  /** 整体替换本地数据（云端合并后应用） */
  replaceData: (d: UserData) => void
  /* 场景 */
  addCustomScene: (s: Omit<Scene, 'custom'>) => Scene
  updateCustomScene: (id: string, patch: Partial<Scene>) => void
  deleteCustomScene: (id: string) => void
  togglePin: (id: string) => void
  isPinned: (id: string) => boolean
  /* 素材 */
  addCustomMaterial: (m: Material) => void
  updateCustomMaterial: (id: string, patch: Partial<Material>) => void
  deleteCustomMaterial: (id: string) => void
  /* 收藏 */
  favKey: (kind: FavKind, id: string) => string
  isFav: (kind: FavKind, id: string) => boolean
  toggleFav: (args: { kind: FavKind; id: string; en: string; zh: string; sceneId?: string }) => void
  /* 复习 */
  scheduleReview: (args: { kind: FavKind; id: string; en: string; zh: string; sceneId?: string; result: 'good' | 'again' }) => void
  dueItems: () => ReviewItem[]
  /* 搜索历史 */
  pushHistory: (q: string) => void
  clearHistory: () => void
  /* 统计 */
  bumpStat: (k: 'tests' | 'reviews') => void
  /* 数据管理 */
  exportJSON: () => string
  importJSON: (raw: string) => boolean
  resetAll: () => void
}

const UserCtx = createContext<Ctx | null>(null)

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<UserData>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
      // 通知同步层：数据有变化（登录状态下自动推送云端）
      window.dispatchEvent(new CustomEvent('pf-data-changed'))
    } catch {
      /* 容量满等情况静默 */
    }
  }, [data])

  /** 连续打卡：日期变化时更新 streak */
  useEffect(() => {
    setData((d) => {
      const today = todayStr()
      if (d.stats.lastActive === today) return d
      const yest = addDays(-1)
      const streak = d.stats.lastActive === yest ? d.stats.streak + 1 : 1
      return { ...d, stats: { ...d.stats, lastActive: today, streak } }
    })
  }, [])

  const patch = useCallback((fn: (d: UserData) => UserData) => setData((d) => fn(d)), [])

  const api = useMemo<Ctx>(() => {
    const favKey = (kind: FavKind, id: string) => `${kind}:${id}`

    const upsertReview = (d: UserData, args: { kind: FavKind; id: string; en: string; zh: string; sceneId?: string }, result?: 'good' | 'again'): UserData => {
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

    return {
      data,
      replaceData: (d) => setData(d),
      setSettings: (s) => patch((d) => ({ ...d, settings: { ...d.settings, ...s } })),

      addCustomScene: (s) => {
        const scene: Scene = { ...s, custom: true }
        patch((d) => ({ ...d, customScenes: [scene, ...d.customScenes] }))
        return scene
      },
      updateCustomScene: (id, p) =>
        patch((d) => ({ ...d, customScenes: d.customScenes.map((s) => (s.id === id ? { ...s, ...p } : s)) })),
      deleteCustomScene: (id) =>
        patch((d) => ({
          ...d,
          customScenes: d.customScenes.filter((s) => s.id !== id),
          customMaterials: d.customMaterials.filter((m) => m.sceneId !== id),
          pinned: d.pinned.filter((p) => p !== id),
        })),
      togglePin: (id) =>
        patch((d) => ({
          ...d,
          pinned: d.pinned.includes(id) ? d.pinned.filter((p) => p !== id) : [id, ...d.pinned],
        })),
      isPinned: (id) => data.pinned.includes(id),

      addCustomMaterial: (m) => patch((d) => ({ ...d, customMaterials: [m, ...d.customMaterials] })),
      updateCustomMaterial: (id, p) =>
        patch((d) => ({ ...d, customMaterials: d.customMaterials.map((m) => (m.id === id ? ({ ...m, ...p } as Material) : m)) })),
      deleteCustomMaterial: (id) => patch((d) => ({ ...d, customMaterials: d.customMaterials.filter((m) => m.id !== id) })),

      favKey,
      isFav: (kind, id) => !!data.favorites[favKey(kind, id)],
      toggleFav: (args) =>
        patch((d) => {
          const key = favKey(args.kind, args.id)
          const favorites = { ...d.favorites }
          if (favorites[key]) {
            delete favorites[key]
            return { ...d, favorites }
          }
          favorites[key] = { key, kind: args.kind, addedAt: Date.now() }
          // 收藏即进入复习体系，当天可复习
          return upsertReview({ ...d, favorites }, args)
        }),

      scheduleReview: (args) => patch((d) => bumpStats(upsertReview(d, args, args.result), 'reviews')),
      dueItems: () => {
        const today = todayStr()
        return Object.values(data.review)
          .filter((r) => r.next <= today)
          .sort((a, b) => (a.next < b.next ? -1 : a.next > b.next ? 1 : a.addedAt - b.addedAt))
          .slice(0, DAILY_REVIEW_CAP)
      },

      pushHistory: (q) =>
        patch((d) => {
          const t = q.trim()
          if (!t) return d
          const history = [t, ...d.history.filter((h) => h !== t)].slice(0, 12)
          return { ...d, history }
        }),
      clearHistory: () => patch((d) => ({ ...d, history: [] })),

      bumpStat: (k) => patch((d) => bumpStats(d, k)),

      exportJSON: () => JSON.stringify({ app: 'PronFlow', version: 1, exportedAt: new Date().toISOString(), data }, null, 2),
      importJSON: (raw) => {
        try {
          const obj = JSON.parse(raw)
          const d = obj?.data ?? obj
          if (!d || typeof d !== 'object' || !('settings' in d)) return false
          setData({ ...DEFAULT_DATA, ...d, stats: { ...DEFAULT_DATA.stats, ...(d.stats || {}) } })
          return true
        } catch {
          return false
        }
      },
      resetAll: () => setData({ ...DEFAULT_DATA }),
    }
  }, [data, patch])

  return <UserCtx.Provider value={api}>{children}</UserCtx.Provider>
}

function bumpStats(d: UserData, k: 'tests' | 'reviews'): UserData {
  return { ...d, stats: { ...d.stats, [k]: d.stats[k] + 1 } }
}

export function useUser(): Ctx {
  const ctx = useContext(UserCtx)
  if (!ctx) throw new Error('useUser must be inside UserDataProvider')
  return ctx
}
