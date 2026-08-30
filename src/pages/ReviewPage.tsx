/** 复习页：今日复习（间隔重复）+ 收藏本 */
import { useEffect, useMemo, useState } from 'react'
import type { FavKind, Material, ReviewItem } from '../types'
import { findBuiltinMaterial } from '../data'
import { useUser } from '../store/UserDataProvider'
import { MaterialCard } from '../components/MaterialCard'
import { DictRow } from '../components/DictRow'
import { play } from '../services/tts'
import { loadDict } from '../services/dict'
import { useNav } from '../nav'

const KIND_TABS: { key: FavKind | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'sentence', label: '句子' },
  { key: 'phrase', label: '短语' },
  { key: 'word', label: '单词' },
  { key: 'dict', label: '词典' },
]

export function ReviewPage() {
  const [seg, setSeg] = useState<'review' | 'fav'>('review')

  return (
    <div className="page">
      <div className="nav">
        <div className="title">{seg === 'review' ? '🔁 今日复习' : '⭐ 收藏本'}</div>
      </div>

      <div className="seg-wrap tab-seg">
        <button className={seg === 'review' ? 'on' : ''} onClick={() => setSeg('review')}>今日复习</button>
        <button className={seg === 'fav' ? 'on' : ''} onClick={() => setSeg('fav')}>收藏本</button>
      </div>

      {seg === 'review' ? <ReviewFlow /> : <FavoriteBook />}
    </div>
  )
}

/* ================= 今日复习 ================= */
function ReviewFlow() {
  const { dueItems, scheduleReview, data } = useUser()
  const [queue, setQueue] = useState<ReviewItem[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState({ good: 0, again: 0 })
  const due = dueItems()
  const item: ReviewItem | undefined = queue ? queue[idx] : undefined

  const start = () => {
    setQueue(due)
    setIdx(0)
    setRevealed(false)
    setTally({ good: 0, again: 0 })
  }

  const rate = (result: 'good' | 'again') => {
    if (!item) return
    scheduleReview({ kind: item.kind, id: item.key.split(':').slice(1).join(':'), en: item.en, zh: item.zh, sceneId: item.sceneId, result })
    setTally((t) => ({ good: t.good + (result === 'good' ? 1 : 0), again: t.again + (result === 'again' ? 1 : 0) }))
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  if (queue && item) {
    return (
      <div className="train-stage">
        <div className="train-progress">
          <span>{idx + 1}/{due.length}</span>
          <div className="bar"><i style={{ width: `${((idx + 1) / due.length) * 100}%` }} /></div>
          <span>✅{tally.good} 😤{tally.again}</span>
        </div>

        {!revealed ? (
          <div className="test-zh fade-in">
            <div className="kind">{KIND_LABEL[item.kind]} · 复习</div>
            <div className="zh">{item.zh}</div>
            <div className="tip">还记得英文怎么说吗？先开口，再看答案</div>
          </div>
        ) : (
          <div className="test-reveal fade-in">
            <div className="en">{item.en}</div>
            <div className="mt8" style={{ display: 'flex', justifyContent: 'center' }}>
              <button className="btn-main ghost" style={{ height: 36, padding: '0 16px' }} onClick={() => void play(item.en, { rate: 0.85 })}>
                🔊 再听一遍
              </button>
            </div>
          </div>
        )}

        <div className="train-btn">
          {!revealed ? (
            <button className="btn-main" onClick={() => setRevealed(true)}>👁 看答案</button>
          ) : (
            <div className="btn-row">
              <button className="btn-main again" onClick={() => rate('again')}>😤 卡住了</button>
              <button className="btn-main good" onClick={() => rate('good')}>✅ 说出去了</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (queue && !item) {
    return (
      <div className="train-stage" style={{ minHeight: 260, justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>🎉</div>
        <div style={{ fontSize: 19, fontWeight: 800, marginTop: 10 }}>今日复习完成！</div>
        <div className="text-sub mt8">说出来 {tally.good} 句 · 卡住 {tally.again} 句</div>
        <div className="text-sub fs12">卡住的内容明天会再出现，说出去的间隔会越来越长</div>
        <button className="btn-main mt16" onClick={() => setQueue(null)}>
          返回
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="rev-summary">
        <div className="num">
          {due.length}
          <small>条待复习</small>
        </div>
        <div className="desc">
          来自你的收藏 + 昨天卡住的句子。<br />按间隔重复安排：说出来间隔翻倍，卡住明天再来。
        </div>
        <div className="streak-flame">
          🔥{data.stats.streak}
          <small>连续打卡</small>
        </div>
      </div>
      {due.length > 0 ? (
        <button className="btn-main" style={{ margin: '0 16px', width: 'calc(100% - 32px)' }} onClick={start}>
          开始复习（{due.length} 条）
        </button>
      ) : (
        <div className="empty">
          <div className="ic">☕</div>
          <div className="t1">今日清单已清空</div>
          <div className="t2">收藏的内容会自动进入每日复习，<br />去场景里再攒几句明天练</div>
        </div>
      )}
    </>
  )
}

/* ================= 收藏本 ================= */
function FavoriteBook() {
  const { data } = useUser()
  const nav = useNav()
  const [kindTab, setKindTab] = useState<FavKind | 'all'>('all')
  const [dictWords, setDictWords] = useState<Map<string, import('../types').DictWord> | null>(null)

  useEffect(() => {
    void loadDict().then((r) => setDictWords(new Map(r.words.map((d) => [d.w, d]))))
  }, [])

  const favs = useMemo(() => Object.values(data.favorites).sort((a, b) => b.addedAt - a.addedAt), [data.favorites])

  const materialsById = useMemo(() => {
    const map = new Map<string, Material>()
    for (const m of data.customMaterials) map.set(m.id, m)
    return map
  }, [data.customMaterials])

  const shown = favs.filter((f) => kindTab === 'all' || f.kind === kindTab)

  return (
    <>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        {KIND_TABS.map((t) => (
          <button key={t.key} className={`chip${kindTab === t.key ? ' on' : ''}`} onClick={() => setKindTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <div className="ic">⭐</div>
          <div className="t1">还没有收藏</div>
          <div className="t2">在场景里、词库里看到想说的句子，<br />点 ☆ 收进来，自动排进每日复习</div>
        </div>
      ) : (
        shown.map((f) => {
          if (f.kind === 'dict') {
            const d = dictWords?.get(f.key.slice(5))
            if (!d) return null
            return (
              <div key={f.key} style={{ margin: '0 16px 10px' }}>
                <DictRow d={d} />
              </div>
            )
          }
          const m = findBuiltinMaterial(f.key.slice(f.kind.length + 1)) ?? materialsById.get(f.key.slice(f.kind.length + 1))
          if (!m) return null
          return (
            <div key={f.key} style={{ margin: '0 16px 10px' }}>
              <MaterialCard
                m={m}
                onTrain={(mm) => nav.openTrain(mm.sceneId, 3, mm.id)}
              />
            </div>
          )
        })
      )}
    </>
  )
}

const KIND_LABEL: Record<string, string> = {
  word: '单词',
  phrase: '短语',
  sentence: '句子',
  dict: '词典词',
}
