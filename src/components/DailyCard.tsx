/** 首页「每日一句」卡片：每天固定抽取一句，点击进跟读 */
import { useMemo } from 'react'
import { BUNDLES } from '../data'
import { play } from '../services/tts'
import { useNav } from '../nav'
import { todayStr } from '../types'

export function DailyCard() {
  const nav = useNav()

  const daily = useMemo(() => {
    // 稳定抽取：以日期为种子，每天同一句
    const sentences: { en: string; zh: string; sceneId: string; sceneName: string }[] = []
    for (const b of BUNDLES) {
      for (const m of b.materials) {
        if (m.type === 'sentence') {
          sentences.push({ en: m.en, zh: m.zh, sceneId: b.scene.id, sceneName: b.scene.name })
        }
      }
    }
    const d = todayStr()
    let seed = 0
    for (const ch of d) seed = (seed * 31 + ch.charCodeAt(0)) % 99991
    const pick = sentences[seed % sentences.length]
    return pick
  }, [])

  if (!daily) return null

  return (
    <button
      className="daily-card"
      onClick={() => {
        play(daily.en)
        nav.push({ name: 'scene', sceneId: daily.sceneId })
      }}
    >
      <div className="daily-head">
        <span className="daily-badge">每日一句</span>
        <span className="daily-scene">{daily.sceneName}</span>
      </div>
      <div className="daily-en">{daily.en}</div>
      <div className="daily-zh">{daily.zh}</div>
      <div className="daily-tip">🔊 点击听发音 · 进入场景跟读</div>
    </button>
  )
}
