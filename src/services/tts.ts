/** 发音服务：双音源（有道云端真人声 / 系统 TTS），单点 / 循环 / 慢速，多级兜底 */
import type { Accent } from '../types'

type Listener = (playingId: string | null) => void
type ErrListener = (err: 'unsupported' | 'novoice') => void

const listeners = new Set<Listener>()
const errListeners = new Set<ErrListener>()
let currentId: string | null = null
let loopToken = 0
let voicesCache: SpeechSynthesisVoice[] = []
let novoiceWarned = false

const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

function loadVoices() {
  if (!synth) return
  voicesCache = synth.getVoices()
}
if (synth) {
  loadVoices()
  synth.addEventListener?.('voiceschanged', loadVoices)
  setTimeout(loadVoices, 300)
  setTimeout(loadVoices, 1200)
}

export function hasVoices(): boolean {
  if (!synth) return false
  if (!voicesCache.length) loadVoices()
  return voicesCache.some((v) => v.lang.toLowerCase().startsWith('en'))
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!voicesCache.length) loadVoices()
  return voicesCache.filter((v) => v.lang.toLowerCase().startsWith('en'))
}

export function ttsSupported(): boolean {
  return !!synth
}

/** iOS/部分安卓需要一次用户手势解锁语音引擎 */
let primed = false
export function primeTTS() {
  if (primed || !synth) return
  primed = true
  const unlock = () => {
    try {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      synth.speak(u)
      loadVoices()
    } catch {
      /* 忽略 */
    }
  }
  window.addEventListener('touchend', unlock, { once: true })
  window.addEventListener('pointerdown', unlock, { once: true })
}

function emit(id: string | null) {
  currentId = id
  listeners.forEach((fn) => fn(id))
}

function emitErr(err: 'unsupported' | 'novoice') {
  errListeners.forEach((fn) => fn(err))
}

export function onPlayingChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function onTTSError(fn: ErrListener): () => void {
  errListeners.add(fn)
  return () => errListeners.delete(fn)
}

/** 按口音挑选最自然的系统声音 */
function pickVoice(accent: Accent): SpeechSynthesisVoice | null {
  if (!voicesCache.length) loadVoices()
  const want = accent === 'US' ? 'en-US' : 'en-GB'
  const norm = (s: string) => s.replace('_', '-')
  const exact = voicesCache.filter((v) => norm(v.lang) === want)
  const same = exact.length
    ? exact
    : voicesCache.filter((v) => v.lang.toLowerCase().startsWith(accent === 'UK' ? 'en' : want.slice(0, 5)))
  const pool = same.length ? same : voicesCache.filter((v) => v.lang.toLowerCase().startsWith('en'))
  if (!pool.length) return null
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase()
    if (n.includes('natural')) return 100
    if (n.includes('neural')) return 90
    if (n.includes('google')) return 80
    if (n.includes('premium') || n.includes('enhanced')) return 70
    if (n.includes('aria') || n.includes('guy') || n.includes('jenny') || n.includes('samantha')) return 60
    if (v.localService) return 10
    return 0
  }
  return pool.sort((a, b) => score(b) - score(a))[0]
}

export interface SpeakOptions {
  accent?: Accent
  rate?: number
  onend?: () => void
}

function utter(text: string, opts: SpeakOptions, fastFailMs = 0): Promise<{ spoke: boolean; ms: number }> {
  return new Promise((resolve) => {
    if (!synth) return resolve({ spoke: false, ms: 0 })
    const u = new SpeechSynthesisUtterance(text)
    const v = pickVoice(opts.accent ?? 'US')
    if (v) u.voice = v
    u.lang = v?.lang ?? (opts.accent === 'UK' ? 'en-GB' : 'en-US')
    u.rate = opts.rate ?? 1
    u.pitch = 1
    u.volume = 1
    let done = false
    const start = Date.now()
    const finish = (spoke: boolean) => {
      if (!done) {
        done = true
        if (!spoke && synth.speaking) synth.cancel()
        resolve({ spoke, ms: Date.now() - start })
      }
    }
    u.onstart = () => finish(true)
    u.onend = () => finish(true)
    u.onerror = () => finish(false)
    if (fastFailMs > 0) {
      const ff = window.setTimeout(() => finish(synth.speaking), fastFailMs)
      void ff
    }
    const guard = window.setTimeout(() => finish(synth.speaking), Math.max(3000, text.length * 180))
    void guard
    synth.speak(u)
  })
}

/* ---------- 云端音源：单词走有道真人录音，句子走百度神经语音，互为兜底 ---------- */

let onlineAudio: HTMLAudioElement | null = null

function stopOnlineAudio() {
  if (onlineAudio) {
    onlineAudio.pause()
    onlineAudio = null
  }
}

function audioFromUrl(url: string, rate: number): Promise<boolean> {
  stopOnlineAudio()
  return new Promise<boolean>((resolve) => {
    const a = new Audio()
    onlineAudio = a
    a.playbackRate = rate < 0.8 ? 0.6 : 1
    let settled = false
    const done = (ok: boolean) => {
      if (!settled) {
        settled = true
        window.clearTimeout(timer)
        resolve(ok)
      }
    }
    // 加载兜底超时：网络差时 8 秒放弃
    const timer = window.setTimeout(() => done(false), 8000)
    a.onended = () => done(true)
    a.onerror = () => done(false)
    a.oncanplay = () => {
      void a.play().catch(() => done(false))
    }
    a.src = url
    a.load()
  })
}

const youdaoUrl = (text: string, accent: Accent) =>
  `https://dict.youdao.com/dictvoice?type=${accent === 'UK' ? 1 : 2}&audio=${encodeURIComponent(text.trim())}`
const baiduUrl = (text: string) =>
  `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(text.trim())}&spd=3&source=web`

/**
 * 云端音频地址链（网页无 Referer 限制，可直连两家）：
 *  - 短文本（≤3 词）：有道真人录音 → 百度
 *  - 句子：百度神经语音（有道不支持长句）→ 有道分段
 */
function cloudUrls(text: string, accent: Accent): string[] {
  const t = text.trim()
  const wordCount = t.split(/\s+/).length
  return wordCount <= 3
    ? [youdaoUrl(t, accent), baiduUrl(t)]
    : [baiduUrl(t), youdaoUrl(t, accent)]
}

/** 单词(≤3词)→有道真人录音优先；句子→百度神经语音优先；任一失败换下一家 */
async function playOnlineOnce(text: string, accent: Accent, rate: number): Promise<boolean> {
  const urls = cloudUrls(text, accent)
  for (const base of urls) {
    const sep = base.includes('?') ? '&' : '?'
    if (await audioFromUrl(`${base}${sep}_r=${Date.now().toString(36)}`, rate)) return true
  }
  return false
}

/** 读用户的音源偏好（直接读存储，避免循环依赖；默认云端真人声） */
function readVoiceSource(): 'cloud' | 'system' {
  try {
    const raw = localStorage.getItem('pronflow-userdata-v1')
    if (raw) {
      const s = JSON.parse(raw)?.settings?.voiceSource
      if (s === 'system' || s === 'cloud') return s
    }
  } catch {
    /* 忽略 */
  }
  return 'cloud'
}

export interface PlayHandle {
  stop: () => void
}

/**
 * 播放发音。音源偏好：
 *  - cloud（默认）：有道云端真人声，失败回退系统 TTS，再失败提示
 *  - system：系统 TTS，静默失败回退云端
 * loop=true 时循环播放直到 stopPlaying()。
 */
export async function play(text: string, opts: SpeakOptions & { loop?: boolean; id?: string } = {}): Promise<PlayHandle> {
  stopPlaying()
  const token = ++loopToken
  const id = opts.id ?? text
  emit(id)
  const accent = opts.accent ?? 'US'
  const rate = opts.rate ?? 1

  const cloudLoop = async (): Promise<boolean> => {
    let ok = await playOnlineOnce(text, accent, rate)
    if (!ok) return false
    while (opts.loop && token === loopToken) {
      await new Promise((r) => setTimeout(r, 700))
      if (token !== loopToken) break
      ok = await playOnlineOnce(text, accent, rate)
      if (!ok) break
    }
    if (token === loopToken) emit(null)
    return true
  }

  const ttsOnce = () => {
    // cancel 后立刻 speak 在 iOS/部分安卓会被吞掉，让出一步
    return new Promise<void>((r) => setTimeout(r, 60)).then(() => {
      if (token !== loopToken) return
      return utter(text, opts, 1200).then((first) => {
        const silentFail = !first.spoke && first.ms < 400
        return { silentFail }
      })
    })
  }

  const ttsLoop = async (): Promise<boolean> => {
    await utter(text, opts)
    while (opts.loop && token === loopToken) {
      await new Promise((r) => setTimeout(r, 700))
      if (token !== loopToken) break
      await utter(text, opts)
    }
    if (token === loopToken) emit(null)
    opts.onend?.()
    return true
  }

  const source = readVoiceSource()

  /* 首选云端真人声 */
  if (source === 'cloud') {
    if (await cloudLoop()) return { stop: stopPlaying }
    if (!synth) {
      emit(null)
      emitErr('unsupported')
      return { stop: stopPlaying }
    }
    const t = await ttsOnce()
    if (t && !t.silentFail) {
      await ttsLoop()
      return { stop: stopPlaying }
    }
    emit(null)
    emitErr('unsupported')
    return { stop: stopPlaying }
  }

  /* 首选系统 TTS */
  if (!synth) {
    if (await cloudLoop()) return { stop: stopPlaying }
    emit(null)
    emitErr('unsupported')
    return { stop: stopPlaying }
  }

  await new Promise((r) => setTimeout(r, 60))
  if (token !== loopToken) return { stop: stopPlaying }

  const first = await utter(text, opts, 1200)
  const silentFail = !first.spoke && first.ms < 400

  if (!silentFail) {
    while (opts.loop && token === loopToken) {
      await new Promise((r) => setTimeout(r, 700))
      if (token !== loopToken) break
      await utter(text, opts)
    }
    if (token === loopToken) emit(null)
    opts.onend?.()
    return { stop: stopPlaying }
  }

  /* 系统 TTS 静默失败 → 云端兜底 */
  if (await cloudLoop()) return { stop: stopPlaying }
  if (!novoiceWarned) {
    novoiceWarned = true
    emit(null)
    emitErr('novoice')
    return { stop: stopPlaying }
  }
  emit(null)
  return { stop: stopPlaying }
}

/** 停止一切播放 */
export function stopPlaying() {
  loopToken++
  if (synth) synth.cancel()
  stopOnlineAudio()
  if (currentId) emit(null)
}

export function isSpeaking(): boolean {
  return !!synth && synth.speaking
}
