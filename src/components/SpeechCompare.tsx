/** 语音识别比对面板：说出句子 → 实时识别 → 逐词高亮比对 + 得分 */
import { useRef, useState } from 'react'
import { diffSentences, diffScore, speechRecOnce, speechRecognitionAvailable } from '../services/speech'

export function SpeechCompare({ original }: { original: string }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState('')
  const stopRef = useRef<(() => void) | null>(null)
  const available = speechRecognitionAvailable()

  const start = () => {
    setError('')
    setTranscript('')
    setListening(true)
    stopRef.current = speechRecOnce(
      (t) => setTranscript((prev) => (prev ? prev + ' ' + t : t)),
      (m) => setError(m),
      () => setListening(false),
    )
  }

  const stop = () => {
    stopRef.current?.()
    setListening(false)
  }

  const tokens = transcript.trim() ? diffSentences(original, transcript) : null
  const score = tokens ? diffScore(tokens) : 0

  return (
    <div className="d-block sp-comp">
      <div className="d-label">
        🗣 开口比对 <span className="hint">说出这句英文，AI 听写并逐词比对（Chrome/Edge）</span>
      </div>
      {!available && (
        <div className="var-row" style={{ cursor: 'default' }}>
          <div className="v-en" style={{ fontWeight: 400 }}>当前浏览器不支持语音识别，用 Chrome / Edge 试试（录音回放功能不受影响）</div>
        </div>
      )}
      {available && !listening && !transcript && (
        <button className="btn-main ghost" style={{ height: 40, borderRadius: 20, fontSize: 13.5 }} onClick={start}>
          🎙 开口说出来，AI 帮你比对
        </button>
      )}
      {available && listening && (
        <button className="btn-main rec-live" style={{ height: 40, borderRadius: 20, fontSize: 13.5 }} onClick={stop}>
          <span className="rec-dot" /> 正在听…说完自动比对
        </button>
      )}
      {tokens && (
        <div className="sp-result">
          <div className="sp-score">
            <span className={score >= 80 ? 'good' : score >= 50 ? 'mid' : 'low'}>{score} 分</span>
            <span className="sp-score-tip">{score >= 80 ? '太棒了！' : score >= 50 ? '不错，注意标红词' : '再听原句多练几遍'}</span>
          </div>
          <div className="sp-tokens">
            {tokens.map((t, i) => (
              <span key={i} className={`sp-tok ${t.status}`}>
                {t.word}
              </span>
            ))}
          </div>
          <div className="sp-raw">识别：{transcript}</div>
          <button className="btn-main ghost" style={{ height: 34, borderRadius: 17, fontSize: 12.5 }} onClick={() => { setTranscript(''); setError('') }}>
            再来一次
          </button>
        </div>
      )}
      {error && <div className="sp-err">{error}</div>}
    </div>
  )
}
