/** 全局搜索：中英互搜、模糊/精准，覆盖场景名/单词/短语/句子/中文语义/例句/词库 */
import type { DictWord, Material, Scene } from '../types'
import { BUNDLES } from '../data'

export type SearchMode = 'fuzzy' | 'exact'

export interface SearchResult<T> {
  items: T[]
  total: number
}

export interface SearchResults {
  query: string
  scenes: SearchResult<Scene>
  words: SearchResult<Material>
  phrases: SearchResult<Material>
  sentences: SearchResult<Material>
  dict: SearchResult<DictWord>
}

const CAPS = { scenes: 8, words: 30, phrases: 30, sentences: 30, dict: 40 }

function normEn(s: string): string {
  return s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function normZh(s: string): string {
  return s.replace(/\s/g, '')
}

/** 拆词：中英文混合查询拆成连续中文段/英文段（如 "AA制"→["aa","制"]），多词 AND 匹配 */
function tokens(q: string): string[] {
  return q.trim().toLowerCase().match(/[a-z0-9']+|[\u4e00-\u9fff]+/g) ?? []
}

function materialText(m: Material): string {
  const parts = [m.en, m.zh, m.note ?? '']
  for (const ex of m.examples) parts.push(ex.en, ex.zh)
  for (const v of m.variants) parts.push(v.en, v.zh)
  if (m.type === 'sentence') {
    for (const b of m.breakdown) parts.push(b.en, b.zh)
    if (m.linking) parts.push(m.linking)
    if (m.template) {
      parts.push(m.template.pattern)
      for (const s of m.template.slots) parts.push(s.label, ...s.options)
    }
  }
  return parts.join('\n').toLowerCase()
}

/** 单个 token 是否命中素材（英文支持词前缀，中文支持子串） */
function hitMaterial(m: Material, toks: string[], exact: boolean): boolean {
  if (exact) {
    const q = normEn(m.en)
    const qz = normZh(m.zh)
    const input = toks.join(' ')
    return q === input || qz === normZh(input)
  }
  const text = materialText(m)
  const en = normEn(m.en)
  const zh = normZh(m.zh)
  return toks.every((t) => {
    if (/[\u4e00-\u9fff]/.test(t)) return text.includes(t)
    // 英文 token：正文包含，或主英文以它开头（词前缀）
    return text.includes(t) || en.startsWith(t) || en.split(' ').some((w) => w.startsWith(t) && w.length - t.length <= 3) || (zh.includes(t) && t.length >= 2)
  })
}

function hitScene(s: Scene, toks: string[], exact: boolean): boolean {
  const hay = `${s.name} ${s.nameEn} ${s.desc ?? ''}`.toLowerCase()
  if (exact) return normEn(hay) === normEn(toks.join(' ')) || normZh(s.name) === normZh(toks.join(' '))
  return toks.every((t) => hay.includes(t) || (s.name.includes(t) && /[\u4e00-\u9fff]/.test(t)))
}

function hitDict(d: DictWord, toks: string[], exact: boolean): boolean {
  const zh = normZh(d.zh)
  const w = normEn(d.w)
  if (exact) return w === normEn(toks.join(' ')) || w === normEn(toks[0])
  return toks.every((t) => {
    if (/[\u4e00-\u9fff]/.test(t)) return zh.includes(t)
    return w.includes(t) || d.w.toLowerCase().startsWith(t) || zh.includes(t)
  })
}

function cap<T>(arr: T[], n: number): SearchResult<T> {
  return { items: arr.slice(0, n), total: arr.length }
}

export interface SearchInput {
  customMaterials: Material[]
  customScenes: Scene[]
  dict: DictWord[] | null
}

export function searchAll(query: string, mode: SearchMode, input: SearchInput): SearchResults | null {
  const q = query.trim()
  if (!q) return null
  const exact = mode === 'exact'
  const toks = tokens(q)

  const allMaterials = [...input.customMaterials, ...BUNDLES.flatMap((b) => b.materials)]
  const allScenes = [...input.customScenes, ...BUNDLES.map((b) => b.scene)]

  const words: Material[] = []
  const phrases: Material[] = []
  const sentences: Material[] = []
  for (const m of allMaterials) {
    if (!hitMaterial(m, toks, exact)) continue
    if (m.type === 'word') words.push(m)
    else if (m.type === 'phrase') phrases.push(m)
    else sentences.push(m)
  }

  const scenes = allScenes.filter((s) => hitScene(s, toks, exact))
  const dict = (input.dict ?? []).filter((d) => hitDict(d, toks, exact))

  return {
    query: q,
    scenes: cap(scenes, CAPS.scenes),
    words: cap(words, CAPS.words),
    phrases: cap(phrases, CAPS.phrases),
    sentences: cap(sentences, CAPS.sentences),
    dict: cap(dict, CAPS.dict),
  }
}
