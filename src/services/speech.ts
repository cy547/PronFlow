/** 语音识别开口比对：说出句子 → 识别文字 → 与原句逐词比对
 *  网页端：浏览器原生 SpeechRecognition（Chrome/Edge，免费，国内可用）
 *  识别不可用/失败时给出明确提示，不影响录音回放功能
 */

type SRState = 'idle' | 'listening' | 'unsupported' | 'error'

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}

function getSR(): SpeechRecognitionLike | null {
  const w = window as any
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!SR) return null
  return new SR() as SpeechRecognitionLike
}

export function speechRecognitionAvailable(): boolean {
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
}

/* ---------- 词级比对（最长公共子序列，大小写/标点不敏感） ---------- */

function normWord(w: string): string {
  return w.toLowerCase().replace(/[’'",.!?;:、。，！？；：]/g, '')
}

export interface DiffToken {
  word: string
  /** ok=说对 sub=发音/用词偏差 miss=漏说 */
  status: 'ok' | 'sub' | 'miss'
}

/** 将原句与识别句逐词对齐：对上=ok，原句没对上=miss，识别多出的忽略 */
export function diffSentences(original: string, spoken: string): DiffToken[] {
  const orig = original.split(/\s+/).filter(Boolean)
  const said = spoken.split(/\s+/).map(normWord).filter(Boolean)
  const oNorm = orig.map(normWord)

  // LCS 动态规划
  const m = oNorm.length
  const n = said.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oNorm[i - 1] === said[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  // 回溯标记
  const status: ('ok' | 'miss')[] = new Array(m).fill('miss')
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (oNorm[i - 1] === said[j - 1]) {
      status[i - 1] = 'ok'
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  return orig.map((word, idx) => ({ word, status: status[idx] as DiffToken['status'] }))
}

/** 得分：说对词占比（百分比） */
export function diffScore(tokens: DiffToken[]): number {
  if (!tokens.length) return 0
  const ok = tokens.filter((t) => t.status === 'ok').length
  return Math.round((ok / tokens.length) * 100)
}

/* ---------- React Hook：封装一次识别会话 ---------- */

export interface UseSpeechRec {
  state: SRState
  transcript: string
  error: string
  start: () => void
  stop: () => void
}

export function speechRecOnce(
  onResult: (transcript: string) => void,
  onError: (msg: string) => void,
  onEnd: () => void,
): () => void {
  const sr = getSR()
  if (!sr) {
    onError('当前浏览器不支持语音识别：请用 Chrome 或 Edge')
    onEnd()
    return () => {}
  }
  sr.lang = 'en-US'
  sr.continuous = false
  sr.interimResults = false
  sr.maxAlternatives = 1
  let got = false
  sr.onresult = (e: any) => {
    const r = e.results[e.results.length - 1]
    const t = r?.[0]?.transcript ?? ''
    if (t) {
      got = true
      onResult(t)
    }
  }
  sr.onerror = (e: any) => {
    const err = String(e?.error ?? '')
    if (err === 'not-allowed' || err === 'service-not-allowed') onError('麦克风权限被拒绝：请在地址栏允许麦克风')
    else if (err === 'no-speech') onError('没听到声音，再试一次')
    else if (err !== 'aborted') onError('识别失败：' + err)
  }
  sr.onend = () => {
    if (!got) {
      /* onerror 已处理提示 */
    }
    onEnd()
  }
  try {
    sr.start()
  } catch {
    onError('识别启动失败，请重试')
  }
  return () => {
    try {
      sr.stop()
    } catch {
      /* 忽略 */
    }
  }
}
