/**
 * 词库预处理脚本：ECDICT（开源英汉词典，MIT）+ CMU 美音词典 → public/dict/dict.json
 * 用法：npm run dict
 * 产物：约 2.5~3 万分级词条（四六级/考研/雅思/托福/高考/中考/高频词），含英式音标(ECDICT)+美式音标(CMU转换)
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')

/* ---------- 定位数据文件 ---------- */
function ecdictCsvPath() {
  try {
    const pkgDir = path.dirname(require.resolve('ecdict/package.json'))
    const p = path.join(pkgDir, 'assets', 'ecdict.csv')
    if (fs.existsSync(p)) return p
  } catch {
    /* fallthrough */
  }
  throw new Error('未找到 ecdict 包，请先 npm i -D ecdict')
}

function cmuDict() {
  try {
    return require('cmu-pronouncing-dictionary').dictionary ?? {}
  } catch {
    return {}
  }
}

/* ---------- ARPAbet → IPA ---------- */
const ARPA = {
  AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', EH: 'ɛ', ER: 'ɜr',
  EY: 'eɪ', IH: 'ɪ', IY: 'i', OW: 'oʊ', OY: 'ɔɪ', UH: 'ʊ', UW: 'u',
  B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ', K: 'k',
  L: 'l', M: 'm', N: 'n', NG: 'ŋ', P: 'p', R: 'r', S: 's', SH: 'ʃ', T: 't',
  TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
}

const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'])

function arpaToIPA(s) {
  if (!s) return undefined
  let out = ''
  let onset = '' // 尚未落位的辅音串，重音符号要加在音节开头（辅音前）
  for (const p of String(s).trim().split(/\s+/)) {
    const m = p.match(/^([A-Z]+)([0-9]?)$/)
    if (!m) continue
    const base = m[1]
    const stress = m[2]
    let sym = ARPA[base]
    if (!sym) continue
    if (base === 'AH' && stress === '0') sym = 'ə'
    if (base === 'ER' && stress === '0') sym = 'ɚ'
    if (VOWELS.has(base)) {
      if (stress === '1') out += 'ˈ'
      else if (stress === '2') out += 'ˌ'
      out += onset
      onset = ''
      out += sym
    } else {
      onset += sym
    }
  }
  out += onset
  return out || undefined
}

/* ---------- 简易 CSV 行迭代器（处理引号内逗号/换行） ---------- */
function* csvRows(text) {
  let row = []
  let field = []
  let inQ = false
  const n = text.length
  for (let i = 0; i < n; i++) {
    const c = text[i]
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field.push('"')
          i++
        } else inQ = false
      } else field.push(c)
    } else if (c === '"') {
      inQ = true
    } else if (c === ',') {
      row.push(field.join(''))
      field = []
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field.join(''))
      field = []
      if (row.length > 1 || row[0] !== '') yield row
      row = []
    } else field.push(c)
  }
  if (field.length || row.length) {
    row.push(field.join(''))
    yield row
  }
}

/* ---------- 主流程 ---------- */
const KEEP_TAGS = new Set(['zk', 'gk', 'cet4', 'cet6', 'ky', 'toefl', 'ielts', 'gre'])
const WORD_RE = /^[A-Za-z][A-Za-z'’-]*$/
const CAP = 26000
const MAX_RANK = 12000

const csv = ecdictCsvPath()
const cmu = cmuDict()
console.log('读取:', csv)

const text = fs.readFileSync(csv, 'utf8')
const iter = csvRows(text)
iter.next() // skip header

const map = new Map()
let scanned = 0
let kept = 0

for (const r of iter) {
  scanned++
  const [word, phonetic, , translation, , collins, oxford, tag, bnc, frq] = r
  if (!word || !translation) continue
  if (word.length < 2 && word !== 'a' && word !== 'I') continue
  if (!WORD_RE.test(word)) continue
  const w = word.toLowerCase()

  const tags = (tag || '').split(' ').filter((t) => KEEP_TAGS.has(t))
  const rank = Number(frq) > 0 ? Number(frq) : Number(bnc) > 0 ? Number(bnc) : Infinity
  if (tags.length === 0 && rank > MAX_RANK) continue

  let zh = translation.replace(/\\n/g, '；').replace(/\n/g, '；').replace(/\s{2,}/g, ' ').trim()
  zh = zh.replace(/(\uff1b)+/g, '；').slice(0, 150)
  if (!zh) continue

  const posMatch = zh.match(/^(([a-z]{1,4}\.\s*){1,3})/)
  const pos = posMatch ? posMatch[1].trim().replace(/\s+/g, '/') : undefined

  let freq = rank <= 1500 ? 5 : rank <= 3000 ? 4 : rank <= 6000 ? 3 : rank <= MAX_RANK ? 2 : 1
  const col = Number(collins) || 0
  if (col >= 4) freq = Math.max(freq, 3)
  if (Number(oxford) === 1) freq = Math.max(freq, 3)

  const rec = {
    w: word.length <= 3 ? word : w,
    uk: phonetic ? `/${phonetic.replace(/\s/g, '')}/` : undefined,
    us: undefined,
    pos,
    zh,
    tags: tags.length ? tags : undefined,
    freq,
  }

  const prev = map.get(w)
  const better = !prev || (tags.length > 0 && !prev.tags) || (freq > (prev.freq ?? 0))
  if (better) {
    map.set(w, rec)
    kept++
  }
}

console.log(`ECDICT 扫描 ${scanned} 行，初筛保留 ${map.size} 词`)

/* 合入 CMU 美音 */
let usCount = 0
for (const [w, rec] of map) {
  const p = arpaToIPA(cmu[w])
  if (p) {
    rec.us = `/${p}/`
    usCount++
  }
  if (!rec.uk && rec.us) rec.uk = rec.us
}
console.log(`CMU 美音覆盖 ${usCount} 词`)

/* 排序 + 截断：词频优先 */
const words = [...map.values()].sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0) || a.w.localeCompare(b.w)).slice(0, CAP)

const outDir = path.join(root, 'public', 'dict')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'dict.json')
fs.writeFileSync(outPath, JSON.stringify(words))
const kb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2)
console.log(`✅ 生成 ${outPath}：${words.length} 词条，${kb} MB`)
