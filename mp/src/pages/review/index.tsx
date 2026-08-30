import { useEffect, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { FavKind, ReviewItem, UserData } from '../../shared/types'
import { findBuiltinMaterial } from '../../shared/scenes'
import { actions, dueItems, useUserData } from '../../store/useUserData'
import { PlayButton } from '../../components/ui'
import { play } from '../../services/audio'
import './index.css'

export default function ReviewPage() {
  const data = useUserData()
  const [seg, setSeg] = useState<'review' | 'fav'>('review')
  const due = dueItems()

  useEffect(() => {
    actions.touchStreak()
  }, [])

  return (
    <View className="review-page">
      <View className="seg">
        <Text className={seg === 'review' ? 'on' : ''} onClick={() => setSeg('review')}>今日复习</Text>
        <Text className={seg === 'fav' ? 'on' : ''} onClick={() => setSeg('fav')}>收藏本</Text>
      </View>
      {seg === 'review' ? <ReviewFlow due={due} streak={data.stats.streak} /> : <FavoriteBook data={data} />}
    </View>
  )
}

/* ---------- 今日复习 ---------- */
function ReviewFlow({ due, streak }: { due: ReviewItem[]; streak: number }) {
  const [queue, setQueue] = useState<ReviewItem[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState({ good: 0, again: 0 })
  const item = queue ? queue[idx] : undefined

  const rate = (result: 'good' | 'again') => {
    if (!item) return
    const id = item.key.split(':').slice(1).join(':')
    actions.rate({ kind: item.kind, id, en: item.en, zh: item.zh, sceneId: item.sceneId, result })
    setTally((t) => ({ good: t.good + (result === 'good' ? 1 : 0), again: t.again + (result === 'again' ? 1 : 0) }))
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  if (queue && item) {
    return (
      <View className="stage card">
        <View className="prog">
          <Text className="fs12 sub">{idx + 1}/{queue.length}</Text>
          <Text className="fs12 sub">✅{tally.good} 😤{tally.again}</Text>
        </View>
        {!revealed ? (
          <View className="test-zh">
            <Text className="kind">{item.kind === 'dict' ? '词典词' : item.kind} · 复习</Text>
            <Text className="zh">{item.zh}</Text>
            <Text className="tip">还记得英文怎么说吗？先开口，再看答案</Text>
            <View className="train-btn">
              <View className="btn-main" onClick={() => setRevealed(true)}><Text>👁 看答案</Text></View>
            </View>
          </View>
        ) : (
          <View className="reveal">
            <Text className="ren">{item.en}</Text>
            <View className="btn-row center">
              <View className="btn-main ghost" style={{ height: 36 }} onClick={() => play(item.en, { rate: 0.85 })}><Text>🔊 再听一遍</Text></View>
            </View>
            <View className="btn-row">
              <View className="btn-main again" onClick={() => rate('again')}><Text>😤 卡住了</Text></View>
              <View className="btn-main good" onClick={() => rate('good')}><Text>✅ 说出去了</Text></View>
            </View>
          </View>
        )}
      </View>
    )
  }

  if (queue && !item) {
    return (
      <View className="stage card done-box">
        <Text className="done-ic">🎉</Text>
        <Text className="t1">今日复习完成！</Text>
        <Text className="t2">说出来 {tally.good} 句 · 卡住 {tally.again} 句</Text>
        <View className="btn-main" style={{ width: '60%' }} onClick={() => setQueue(null)}><Text>返回</Text></View>
      </View>
    )
  }

  return (
    <View>
      <View className="summary card">
        <View className="sum-row">
          <Text className="num">{due.length}<Text className="num-s"> 条待复习</Text></Text>
          <Text className="flame">🔥{streak}</Text>
        </View>
        <Text className="desc">来自你的收藏 + 昨天卡住的句子。说出来间隔翻倍，卡住明天再来。</Text>
      </View>
      {due.length > 0 ? (
        <View
          className="btn-main"
          onClick={() => {
            setQueue(due)
            setIdx(0)
            setTally({ good: 0, again: 0 })
            setRevealed(false)
          }}
        >
          <Text>开始复习（{due.length} 条）</Text>
        </View>
      ) : (
        <View className="empty">
          <Text className="ic">☕</Text>
          <Text className="t1">今日清单已清空</Text>
          <Text className="t2">收藏的内容会自动进入每日复习</Text>
        </View>
      )}
    </View>
  )
}

/* ---------- 收藏本 ---------- */
const KIND_TABS: { key: FavKind | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'sentence', label: '句子' },
  { key: 'phrase', label: '短语' },
  { key: 'word', label: '单词' },
  { key: 'dict', label: '词典' },
]

function FavoriteBook({ data }: { data: UserData }) {
  const [kindTab, setKindTab] = useState<FavKind | 'all'>('all')
  const favs = useMemo(() => Object.values(data.favorites).sort((a, b) => b.addedAt - a.addedAt), [data.favorites])
  const shown = favs.filter((f) => kindTab === 'all' || f.kind === kindTab)

  const open = (key: string) => {
    const id = key.split(':').slice(1).join(':')
    const m = findBuiltinMaterial(id) || data.customMaterials.find((x) => x.id === id)
    if (m) Taro.navigateTo({ url: `/pages/scene/index?id=${m.sceneId}` })
  }

  return (
    <View>
      <View className="chips">
        {KIND_TABS.map((t) => (
          <Text key={t.key} className={`chip${kindTab === t.key ? ' on' : ''}`} onClick={() => setKindTab(t.key)}>{t.label}</Text>
        ))}
      </View>
      {shown.length === 0 ? (
        <View className="empty">
          <Text className="ic">⭐</Text>
          <Text className="t1">还没有收藏</Text>
          <Text className="t2">看到想说的句子点 ☆ 收进来</Text>
        </View>
      ) : (
        shown.map((f) => {
          if (f.kind === 'dict') {
            const w = f.key.slice(5)
            return (
              <View className="mat card" key={f.key}>
                <View className="mat-head">
                  <Text className="p-en">{w}</Text>
                  <PlayButton text={w} size={36} />
                </View>
              </View>
            )
          }
          const id = f.key.slice(f.kind.length + 1)
          const m = findBuiltinMaterial(id) || data.customMaterials.find((x) => x.id === id)
          if (!m) return null
          return (
            <View className="mat card" key={f.key} onClick={() => open(f.key)}>
              <View className="mat-head">
                <View className="mat-main">
                  <Text className="p-en">{m.en}</Text>
                  <Text className="p-zh">{m.zh}</Text>
                </View>
                <PlayButton text={m.en} size={36} />
              </View>
            </View>
          )
        })
      )}
    </View>
  )
}
