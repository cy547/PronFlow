/** 短语/句子音标自动拼接：逐词查 CMU 全量美音词典（懒加载，一次下载长期缓存） */

let cmu: Record<string, string> | null = null
let cmuPromise: Promise<Record<string, string>> | null = null

async function ensureCmu(): Promise<Record<string, string>> {
  if (cmu) return cmu
  if (!cmuPromise) {
    cmuPromise = (async () => {
      try {
        const res = await fetch('cmu-ipa.json')
        if (!res.ok) throw new Error(String(res.status))
        cmu = (await res.json()) as Record<string, string>
      } catch {
        cmu = {}
      }
      return cmu
    })()
  }
  return cmuPromise
}

/**
 * 按单词逐个拼接美式音标。词表外的词以「·词·」占位（需手补）。
 * 连读/弱读变化不做（拼接为逐词近似音标，供参考发音）。
 */
export async function phraseIpa(text: string): Promise<string> {
  const dict = await ensureCmu()
  const clean = text.trim().replace(/[,.!?;:]+$/g, '')
  if (!clean) return ''
  return clean
    .split(/\s+/)
    .map((w) => {
      const hit = dict[w.toLowerCase()]
      return hit || `·${w}·`
    })
    .join(' ')
}
