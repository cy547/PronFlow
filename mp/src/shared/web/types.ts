/** 全局类型定义 —— 所有素材的统一数据标准 */

export type Accent = 'US' | 'UK'

/** 口语使用度：high=高频口语 ok=口语可用 formal=书面慎用 */
export type SpokenLevel = 'high' | 'ok' | 'formal'

/** 表达版本语气：简单 / 日常 / 地道 */
export type VersionLevel = '简单' | '日常' | '地道'

export type MaterialType = 'word' | 'phrase' | 'sentence'

export interface Example {
  en: string
  zh: string
}

/** 同义句 / 替换句 / 不同语气版本 */
export interface Variant {
  level: VersionLevel
  en: string
  zh: string
}

interface MaterialBase {
  id: string
  sceneId: string
  en: string
  /** 通俗口语化中文翻译 */
  zh: string
  /** 使用备注 / 场景提示 */
  note?: string
  spokenLevel: SpokenLevel
  /** 1-3 条真实对话例句 */
  examples: Example[]
  variants: Variant[]
  custom?: boolean
}

export interface WordMaterial extends MaterialBase {
  type: 'word'
  pos?: string
  ipaUS: string
  ipaUK: string
}

export interface PhraseMaterial extends MaterialBase {
  type: 'phrase'
  ipaUS?: string
  ipaUK?: string
}

/** 句式仿写模板：句式骨架 + 槽位 + 候选词 */
export interface SentenceTemplate {
  /** 骨架，槽位用 {slotKey} 占位 */
  pattern: string
  slots: { key: string; label: string; options: string[] }[]
}

export interface SentenceMaterial extends MaterialBase {
  type: 'sentence'
  /** 长句拆分简易版（适配零基础开口） */
  breakdown: Example[]
  /** 连读/弱读/吞音标注版文本 */
  linking?: string
  template?: SentenceTemplate
}

export type Material = WordMaterial | PhraseMaterial | SentenceMaterial

export interface Scene {
  id: string
  name: string
  nameEn: string
  icon: string
  desc?: string
  custom?: boolean
}

/* ---------- 词库（开源大词库 / 自建精编词库共用） ---------- */

export interface DictWord {
  /** 单词 */
  w: string
  /** 英式音标 */
  uk?: string
  /** 美式音标 */
  us?: string
  /** 词性（如 n. / v. / adj.） */
  pos?: string
  /** 中文释义（口语化优先） */
  zh: string
  /** 词库分级标签 */
  tags?: string[]
  /** 词频星级 1-5，5 最常用 */
  freq?: number
  /** 口语增强字段（高频口语词叠加） */
  spoken?: {
    level?: SpokenLevel
    examples?: Example[]
    variants?: Variant[]
    note?: string
  }
}

/* ---------- 用户数据 ---------- */

export type FavKind = MaterialType | 'dict'

export interface FavEntry {
  key: string
  kind: FavKind
  addedAt: number
}

/** 复习条目：带快照，不依赖收藏与词库加载 */
export interface ReviewItem {
  key: string
  en: string
  zh: string
  kind: FavKind
  sceneId?: string
  addedAt: number
  /** 下次复习日期 YYYY-MM-DD */
  next: string
  /** 当前间隔天数 */
  interval: number
  /** 连续答对次数 */
  streak: number
  /** 最近一次更新时间（云端合并用） */
  updatedAt?: number
}

export interface Settings {
  accent: Accent
  rate: 'normal' | 'slow'
}

export interface UserData {
  settings: Settings
  /** 置顶的场景 id（内置 + 自定义都可置顶） */
  pinned: string[]
  customScenes: Scene[]
  customMaterials: Material[]
  favorites: Record<string, FavEntry>
  review: Record<string, ReviewItem>
  history: string[]
  /** 统计：累计自测次数 / 累计复习次数 / 最后活跃日期 / 连续打卡天数 */
  stats: {
    tests: number
    reviews: number
    lastActive: string
    streak: number
  }
}

export const todayStr = (): string => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const addDays = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
