/** 词库加载与口语增强层合并 */
import type { DictWord } from '../types'
import { FALLBACK_DICT } from '../data/dictFallback'
import { SPOKEN_ENRICHMENT } from '../data/spokenEnrichment'

export type DictSource = 'ecdict' | 'builtin'

/** 合并口语增强字段（高频口语词叠加例句/替换/口语度） */
export function enrichWord(d: DictWord): DictWord {
  const en = SPOKEN_ENRICHMENT[d.w.toLowerCase()]
  if (!en) return d
  return { ...d, spoken: { ...d.spoken, ...en } }
}

/** 加载词库：优先生成的 dict.json（开源大词库），失败回退内置精编词库（会话内缓存） */
let dictCache: { words: DictWord[]; source: DictSource } | null = null

export async function loadDict(): Promise<{ words: DictWord[]; source: DictSource }> {
  if (dictCache) return dictCache
  try {
    const res = await fetch('dict/dict.json')
    if (res.ok) {
      const rows: unknown = await res.json()
      if (Array.isArray(rows) && rows.length > 0) {
        const words = (rows as DictWord[]).map(enrichWord)
        dictCache = { words, source: 'ecdict' }
        return dictCache
      }
    }
  } catch {
    /* 走回退 */
  }
  dictCache = { words: FALLBACK_DICT.map(enrichWord), source: 'builtin' }
  return dictCache
}

export const TAG_NAMES: Record<string, string> = {
  gk: '高考',
  cet4: '四级',
  cet6: '六级',
  ky: '考研',
  toefl: '托福',
  ielts: '雅思',
  gre: 'GRE',
}

/** 词库页筛选分组 */
export const DICT_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'spoken', label: '日常口语' },
  { key: 'freq', label: '高频词' },
  { key: 'cet4', label: '四级' },
  { key: 'cet6', label: '六级' },
  { key: 'ky', label: '考研' },
  { key: 'toefl', label: '托福' },
  { key: 'ielts', label: '雅思' },
]

export function filterDict(words: DictWord[], filterKey: string, query: string, letter: string | null): DictWord[] {
  const q = query.trim().toLowerCase()
  let out = words
  if (filterKey === 'spoken') out = out.filter((d) => !!d.spoken)
  else if (filterKey === 'freq') out = out.filter((d) => (d.freq ?? 0) >= 4)
  else if (filterKey !== 'all') out = out.filter((d) => d.tags?.includes(filterKey))
  if (letter) out = out.filter((d) => d.w[0]?.toUpperCase() === letter)
  if (q) {
    out = out.filter((d) => d.w.toLowerCase().includes(q) || d.zh.includes(q))
  }
  if (q || filterKey !== 'all') {
    // 搜索/筛选时按词频优先
    out = [...out].sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0) || a.w.localeCompare(b.w))
  } else {
    out = [...out].sort((a, b) => a.w.localeCompare(b.w))
  }
  return out
}
