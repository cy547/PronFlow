import { useEffect, useId, useState } from 'react'
import { onPlayingChange, play, stopPlaying } from '../services/tts'
import { useUser } from '../store/UserDataProvider'

/** 圆形主播放按钮：单点播放 */
export function AudioButton({ text, size = 38 }: { text: string; size?: number }) {
  const myId = useId()
  const [playing, setPlaying] = useState(false)
  const { data } = useUser()

  useEffect(
    () =>
      onPlayingChange((id) => {
        setPlaying(id === myId)
      }),
    [myId],
  )

  const tap = () => {
    if (playing) {
      stopPlaying()
      return
    }
    play(text, {
      id: myId,
      accent: data.settings.accent,
      rate: data.settings.rate === 'slow' ? 0.6 : 1,
    })
  }

  return (
    <button
      className={`play-btn${playing ? ' playing' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      onClick={(e) => {
        e.stopPropagation()
        tap()
      }}
      aria-label="播放发音"
    >
      {playing ? '⏸' : '▶'}
    </button>
  )
}

/** 循环播放小按钮：点亮后循环直到再点或播别的 */
export function LoopButton({ text }: { text: string }) {
  const myId = useId()
  const [on, setOn] = useState(false)
  const { data } = useUser()

  useEffect(
    () =>
      onPlayingChange((id) => {
        if (id !== myId) setOn(false)
      }),
    [myId],
  )

  return (
    <button
      className={on ? 'on' : ''}
      title="循环播放"
      onClick={(e) => {
        e.stopPropagation()
        if (on) {
          stopPlaying()
          setOn(false)
        } else {
          setOn(true)
          void play(text, { id: myId, accent: data.settings.accent, loop: true })
        }
      }}
    >
      🔁
    </button>
  )
}

/** 慢速播放小按钮 */
export function SlowButton({ text }: { text: string }) {
  const myId = useId()
  const [playing, setPlaying] = useState(false)
  const { data } = useUser()

  useEffect(
    () =>
      onPlayingChange((id) => {
        setPlaying(id === myId)
      }),
    [myId],
  )

  return (
    <button
      className={playing ? 'on' : ''}
      title="慢速播放"
      onClick={(e) => {
        e.stopPropagation()
        if (playing) {
          stopPlaying()
          return
        }
        void play(text, { id: myId, accent: data.settings.accent, rate: 0.55 })
      }}
    >
      🐢
    </button>
  )
}

/** 收藏星标 */
export function StarButton({ on, onTap }: { on: boolean; onTap: () => void }) {
  return (
    <button
      className={on ? 'star-on' : ''}
      title={on ? '取消收藏' : '收藏'}
      onClick={(e) => {
        e.stopPropagation()
        onTap()
      }}
    >
      {on ? '★' : '☆'}
    </button>
  )
}
