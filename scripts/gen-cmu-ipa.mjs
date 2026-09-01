// 生成 CMU 全量美式音标查询表 public/cmu-ipa.json（约 134k 词）
// 用途：添加内容时短语句子的音标自动拼接（网页端懒加载）
// 用法：npm run gen-cmu-ipa
import fs from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const ARPA = {
  AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', EH: 'ɛ', ER: 'ɜr',
  EY: 'eɪ', IH: 'ɪ', IY: 'i', OW: 'oʊ', OY: 'ɔɪ', UH: 'ʊ', UW: 'u',
  B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ', K: 'k',
  L: 'l', M: 'm', N: 'n', NG: 'ŋ', P: 'p', R: 'r', S: 's', SH: 'ʃ', T: 't',
  TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
}
const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'])

function arpaToIPA(s) {
  if (!s) return ''
  let out = ''
  let onset = ''
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

const cmu = require('cmu-pronouncing-dictionary').dictionary ?? {}
const out = {}
for (const [w, pron] of Object.entries(cmu)) {
  if (!/^[a-z][a-z'-]*$/.test(w)) continue // 只保留常规英文词形
  const ipa = arpaToIPA(pron)
  if (ipa) out[w] = `/${ipa}/`
}

fs.writeFileSync('public/cmu-ipa.json', JSON.stringify(out))
console.log(`✅ public/cmu-ipa.json：${Object.keys(out).length} 词，${(fs.statSync('public/cmu-ipa.json').size / 1024 / 1024).toFixed(2)} MB`)
