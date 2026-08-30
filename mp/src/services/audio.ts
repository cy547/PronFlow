/** 发音服务（Taro 版）
 *
 * 句子音源优先级：
 *  1. 微信同声传译插件（需 mp 后台添加插件，并以 MP_PLUGIN=1 构建 —— 整句合成，最自然）
 *  2. 有道短语分段连播（每 ≤3 词一段真人录音，单段失败自动跳过）
 *  3. 百度单段兜底（开发者工具 PC 环境可用）
 */
import Taro from '@tarojs/taro'
import type { Accent } from '../shared/types'

type Listener = (playingId: string | null) => void

const listeners = new Set<Listener>()
let current: Taro.InnerAudioContext | null = null
let currentId: string | null = null
let loopToken = 0

function emit(id: string | null) {
  currentId = id
  listeners.forEach((fn) => fn(id))
}

export function onPlayingChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** 小程序环境无本地 TTS，发音一律走云端音频 */
export function listVoices(): unknown[] {
  return []
}

export function stopAudio() {
  loopToken++
  if (current) {
    try {
      current.stop()
      current.destroy()
    } catch {
      /* 忽略 */
    }
    current = null
  }
  if (currentId) emit(null)
}

const youdaoUrl = (text: string, accent: Accent) =>
  `https://dict.youdao.com/dictvoice?type=${accent === 'UK' ? 1 : 2}&audio=${encodeURIComponent(
    text.trim().replace(/[,.\!?;:]+$/g, ''),
  )}`
const baiduUrl = (text: string) =>
  `https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(text.trim())}&spd=3&source=web`

/** 把长句按 ≤3 个词切段（有道仅支持短语级合成） */
function chunkSentence(text: string): string[] {
  const words = text.trim().split(/\s+/)
  if (words.length <= 3) return [text.trim()]
  const chunks: string[] = []
  for (let i = 0; i < words.length; i += 3) chunks.push(words.slice(i, i + 3).join(' '))
  return chunks
}

/* ---------- 微信同声传译插件（可选） ---------- */

// @ts-ignore 小程序运行时全局函数
declare const requirePlugin: ((name: string) => any) | undefined

let siTTS: ((content: string) => Promise<string>) | null | undefined

/** 检测同声传译插件的整句合成能力；不可用返回 null */
function getSiTTS(): ((content: string) => Promise<string>) | null {
  if (siTTS !== undefined) return siTTS
  try {
    // @ts-ignore 运行时全局
    const plugin = typeof requirePlugin === 'function' ? requirePlugin('WechatSI') : null
    if (plugin?.textToSpeech) {
      siTTS = (content: string) =>
        new Promise<string>((resolve, reject) => {
          plugin.textToSpeech({
            lang: 'en_US',
            content,
            success: (r: { filename?: string }) => {
              if (r?.filename) resolve(r.filename)
              else reject(new Error('no file'))
            },
            fail: (e: unknown) => reject(e),
          })
        })
    } else {
      siTTS = null
    }
  } catch {
    siTTS = null
  }
  return siTTS
}

/** 播放发音（自动选择最佳可用音源） */
export function play(
  text: string,
  opts: { accent?: Accent; rate?: number; loop?: boolean; id?: string } = {},
) {
  stopAudio()
  const token = ++loopToken
  const id = opts.id ?? text
  emit(id)
  const accent = opts.accent ?? 'US'
  const rate = opts.rate ?? 1

  const finish = () => {
    if (token === loopToken) emit(null)
  }

  const startAudio = (src: string, loopEnd: () => void) => {
    const a = Taro.createInnerAudioContext()
    a.src = src
    a.playbackRate = rate < 0.8 ? 0.6 : 1
    current = a
    a.onEnded(() => {
      if (opts.loop && token === loopToken) {
        setTimeout(() => {
          if (token === loopToken) {
            a.seek(0)
            a.play()
          }
        }, 700)
      } else {
        loopEnd()
        finish()
      }
    })
    a.onError(() => {
      loopEnd()
      if (token === loopToken) finish()
    })
    a.play()
  }

  /* 1) 同声传译插件：整句合成（最自然） */
  const si = getSiTTS()
  if (si) {
    si(text)
      .then((path) => {
        if (token !== loopToken) return
        startAudio(path, () => {})
      })
      .catch(() => {
        if (token === loopToken) playChunks(text, accent, rate, opts, token, finish)
      })
    return
  }

  /* 2) 分段兜底 */
  playChunks(text, accent, rate, opts, token, finish)
}

/** 分段连播：每段 [有道, 百度] 顺序兜底，段间顺序播放 */
function playChunks(
  text: string,
  accent: Accent,
  rate: number,
  opts: { loop?: boolean; id?: string },
  token: number,
  finish: () => void,
) {
  const t = text.trim()
  const wordCount = t.split(/\s+/).length

  // 队列：短文本 [有道, 百度] 顺序兜底；长句切成多段有道短语级录音
  const queue: string[] =
    wordCount <= 3
      ? [youdaoUrl(t, accent), baiduUrl(t)]
      : chunkSentence(t).map((c) => youdaoUrl(c, accent))
  let qi = 0

  const createOnce = () => {
    if (qi >= queue.length) {
      if (wordCount <= 3) {
        Taro.showToast({ title: '发音播放失败，请检查网络', icon: 'none' })
      }
      finish()
      return
    }
    const src = `${queue[qi]}&_r=${token}-${qi}`
    startAudioChunk(src, rate, token, () => {
      // 当前段结束/失败 → 下一段
      qi++
      createOnce()
    })
  }

  const startAudioChunk = (src: string, r: number, tk: number, onDone: () => void) => {
    const a = Taro.createInnerAudioContext()
    a.src = src
    a.playbackRate = r < 0.8 ? 0.6 : 1
    current = a
    a.onEnded(() => {
      if (tk === loopToken) onDone()
    })
    a.onError(() => {
      if (tk === loopToken) onDone()
    })
    a.play()
  }

  createOnce()
}
