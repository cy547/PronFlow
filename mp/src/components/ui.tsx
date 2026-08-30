import { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { onPlayingChange, play, stopAudio } from '../services/audio'
import { useUserData } from '../store/useUserData'
import type { SpokenLevel } from '../shared/types'

export const LEVEL_NAME: Record<SpokenLevel, string> = {
  high: '高频口语',
  ok: '口语可用',
  formal: '书面慎用',
}

export function LevelBadge({ lv }: { lv: SpokenLevel }) {
  return <Text className={`badge ${lv}`}>{LEVEL_NAME[lv]}</Text>
}

/** 圆形发音按钮：播放中自动高亮 */
/** 场景图标：emoji 或自定义上传图片（dataURL） */
export function IconView({ icon, size = 26 }: { icon: string; size?: number }) {
  if (icon.startsWith('data:')) {
    return <Image src={icon} mode="aspectFill" style={{ width: `${size}px`, height: `${size}px`, borderRadius: '6px' }} />
  }
  return <Text style={{ fontSize: `${size}px` }}>{icon}</Text>
}

export function PlayButton({ text, size = 40 }: { text: string; size?: number }) {
  const [playing, setPlaying] = useState(false)
  const { settings } = useUserData()
  useEffect(
    () =>
      onPlayingChange((cur) => {
        setPlaying(cur === text)
      }),
    [text],
  )
  return (
    <View
      className={`play-btn${playing ? ' playing' : ''}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onClick={(e) => {
        e.stopPropagation()
        if (playing) stopAudio()
        else play(text, { accent: settings.accent, id: text })
      }}
    >
      <Text>{playing ? '⏸' : '▶'}</Text>
    </View>
  )
}

/** 收藏星标 */
export function Star({ on, onTap }: { on: boolean; onTap: () => void }) {
  return (
    <View
      className={`mini${on ? ' star-on' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onTap()
      }}
    >
      <Text>{on ? '★' : '☆'}</Text>
    </View>
  )
}
