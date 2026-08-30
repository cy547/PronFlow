/** 导航上下文：Tab + 页面栈 */
import { createContext, useContext } from 'react'
import type { TabKey } from './components/TabBar'
import type { Material } from './types'

export type PushRoute =
  | { name: 'scene'; sceneId: string }
  | { name: 'train'; sceneId: string; mode?: 1 | 2 | 3; focusMaterialId?: string }

export interface Nav {
  tab: TabKey
  goTab: (t: TabKey) => void
  push: (r: PushRoute) => void
  back: () => void
  /** 从素材卡片跳到训练页指定模式 */
  openTrain: (sceneId: string, mode?: 1 | 2 | 3, focusMaterialId?: string) => void
}

export const NavCtx = createContext<Nav | null>(null)

export function useNav(): Nav {
  const ctx = useContext(NavCtx)
  if (!ctx) throw new Error('NavCtx missing')
  return ctx
}

export type { TabKey, Material }
