/** 跟读录音回放：录自己的声音，与原音对照 */
import { useEffect, useRef, useState } from 'react'

type RecState = 'idle' | 'requesting' | 'recording' | 'done' | 'denied' | 'error'

export function VoiceRecorder({ resetKey }: { resetKey: string }) {
  const [state, setState] = useState<RecState>('idle')
  const [url, setUrl] = useState<string | null>(null)
  const [secs, setSecs] = useState(0)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timer = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingMine, setPlayingMine] = useState(false)

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  /** 句子切换：丢弃上一条录音 */
  useEffect(() => {
    if (recRef.current && recRef.current.state === 'recording') recRef.current.stop()
    window.clearInterval(timer.current)
    stopTracks()
    if (url) URL.revokeObjectURL(url)
    audioRef.current?.pause()
    audioRef.current = null
    setUrl(null)
    setPlayingMine(false)
    setState('idle')
    setSecs(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  useEffect(() => () => {
    window.clearInterval(timer.current)
    stopTracks()
    if (url) URL.revokeObjectURL(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setState('error')
      return
    }
    try {
      setState('requesting')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunks.current = []
      const rec = new MediaRecorder(stream)
      recRef.current = rec
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data)
      }
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' })
        setUrl(URL.createObjectURL(blob))
        setState('done')
        stopTracks()
      }
      rec.start()
      setSecs(0)
      window.clearInterval(timer.current)
      timer.current = window.setInterval(() => setSecs((s) => s + 1), 1000)
      setState('recording')
    } catch {
      setState('denied')
    }
  }

  const stop = () => {
    window.clearInterval(timer.current)
    recRef.current?.stop()
  }

  const playMine = () => {
    if (!url) return
    audioRef.current?.pause()
    const a = new Audio(url)
    audioRef.current = a
    a.onended = () => setPlayingMine(false)
    a.onerror = () => setPlayingMine(false)
    setPlayingMine(true)
    void a.play().catch(() => setPlayingMine(false))
  }

  const redo = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingMine(false)
    if (url) URL.revokeObjectURL(url)
    setUrl(null)
    setState('idle')
  }

  if (state === 'denied' || state === 'error') {
    return (
      <div className="rec-box">
        <div className="rec-hint">
          {state === 'denied' ? '🎤 麦克风权限被拒绝：请在浏览器地址栏/系统设置里允许麦克风后重试' : '🎤 当前环境不支持录音，换 Chrome/Safari 试试'}
        </div>
        <button className="btn-main ghost" style={{ height: 38 }} onClick={() => setState('idle')}>返回</button>
      </div>
    )
  }

  return (
    <div className="rec-box">
      <div className="d-label">🎙 跟读录音 <span className="hint">录下你的声音，和原音对照（戴耳机效果更好）</span></div>

      {state === 'idle' && (
        <button className="btn-main ghost rec-start" onClick={start}>🎤 开始录音跟读</button>
      )}

      {state === 'requesting' && (
        <button className="btn-main ghost rec-start" disabled>正在申请麦克风…</button>
      )}

      {state === 'recording' && (
        <button className="btn-main rec-live" onClick={stop}>
          <span className="rec-dot" /> 停止录音 · {secs}s
        </button>
      )}

      {state === 'done' && url && (
        <div className="btn-row">
          <button className="btn-main again" onClick={playMine}>
            {playingMine ? '🔈 播放中…' : '🎙 听我的录音'}
          </button>
          <button className="btn-main ghost" onClick={redo}>↻ 重录</button>
        </div>
      )}
    </div>
  )
}
