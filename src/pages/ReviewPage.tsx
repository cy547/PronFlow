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
  const [seg, setSeg] = useState<'review' | 'fav' | 'weak'>('review')
  const { data } = useUser()

  /** 弱点清单：卡住过且尚未毕业（连续答对 < 3），按卡住次数排序 */
  const weakItems = useMemo(() => {
    return Object.values(data.review)
      .filter((r) => (r.stuck ?? 0) > 0 && r.streak < 3)
      .sort((a, b) => (b.stuck ?? 0) - (a.stuck ?? 0) || a.addedAt - b.addedAt)
      .slice(0, 12)
  }, [data.review])

  return (
    <div className="page">
      <div className="nav">
        <div className="title">{seg === 'review' ? '🔁 今日复习' : seg === 'weak' ? '💪 弱点训练' : '⭐ 收藏本'}</div>
      </div>

      <div className="seg-wrap tab-seg">
        <button className={seg === 'review' ? 'on' : ''} onClick={() => setSeg('review')}>今日复习</button>
        <button className={seg === 'weak' ? 'on' : ''} onClick={() => setSeg('weak')}>弱点</button>
        <button className={seg === 'fav' ? 'on' : ''} onClick={() => setSeg('fav')}>收藏本</button>
      </div>

      {seg === 'review' ? <ReviewFlow /> : seg === 'weak' ? <WeakTraining items={weakItems} /> : <FavoriteBook />}
    </div>
  )
}

/* ================= 弱点专项训练 ================= */
function WeakTraining({ items }: { items: ReviewItem[] }) {
  const { scheduleReview } = useUser()
  const [queue, setQueue] = useState<ReviewItem[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [tally, setTally] = useState({ good: 0, again: 0 })
  const item: ReviewItem | undefined = queue ? queue[idx] : undefined

  const rate = (result: 'good' | 'again') => {
    if (!item) return
    scheduleReview({
      kind: item.kind,
      id: item.key.split(':').slice(1).join(':'),
      en: item.en,
      zh: item.zh,
      sceneId: item.sceneId,
      result,
    })
    setTally((t) => ({ good: t.good + (result === 'good' ? 1 : 0), again: t.again + (result === 'again' ? 1 : 0) }))
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  if (queue && item) {
    return (
      <div className="train-stage">
        <div className="train-progress">
          <span>{idx + 1}/{queue.length}</span>
          <div className="bar"><i style={{ width: `${((idx + 1) / queue.length) * 100}%` }} /></div>
          <span>✅{tally.good} 😤{tally.again}</span>
        </div>
        {!revealed ? (
          <div className="test-zh fade-in">
            <div className="kind">{item.en.slice(0, 0)}弱点 · 卡过 {(item.stuck ?? 0)} 次</div>
            <div className="zh">{item.zh}</div>
            <div className="tip">这是你卡住最多的表达，这次一定拿下它</div>
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
              <button className="btn-main again" onClick={() => rate('again')}>😤 又卡了</button>
              <button className="btn-main good" onClick={() => rate('good')}>✅ 说出来了</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (queue && !item) {
    return (
      <div className="train-stage" style={{ minHeight: 260, justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>💪</div>
        <div style={{ fontSize: 19, fontWeight: 800, marginTop: 10 }}>弱点训练完成！</div>
        <div className="text-sub mt8">说出来 {tally.good} 句 · 又卡 {tally.again} 句</div>
        <div className="text-sub fs12">连续答对 3 次的表达会从弱点名单毕业</div>
        <button className="btn-main mt16" onClick={() => setQueue(null)}>返回</button>
      </div>
    )
  }

  return (
    <>
      <div className="rev-summary">
        <div className="num">
          {items.length}
          <small>个弱点</small>
        </div>
        <div className="desc">
          卡住过、且还没连续答对 3 次的表达。<br />集中火力逐个击破，练熟即毕业。
        </div>
      </div>
      {items.length > 0 ? (
        <button className="btn-main" style={{ margin: '0 16px', width: 'calc(100% - 32px)' }} onClick={() => { setQueue(items); setIdx(0); setTally({ good: 0, again: 0 }); setRevealed(false) }}>
          开始弱点训练（{items.length} 个）
        </button>
      ) : (
        <div className="empty">
          <div className="ic">🏅</div>
          <div className="t1">暂时没有弱点</div>
          <div className="t2">在自测里卡住的表达会自动进入这里，<br />专项击破它们</div>
        </div>
      )}
    </>
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
  const { data, setFavTags } = useUser()
  const nav = useNav()
  const [kindTab, setKindTab] = useState<FavKind | 'all'>('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [tagEditKey, setTagEditKey] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
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

  const allTags = useMemo(() => {
    const s = new Set<string>()
    for (const f of favs) for (const t of f.tags ?? []) s.add(t)
    return [...s]
  }, [favs])

  const shown = favs.filter((f) => {
    if (kindTab !== 'all' && f.kind !== kindTab) return false
    if (tagFilter && !(f.tags ?? []).includes(tagFilter)) return false
    return true
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
        {KIND_TABS.map((t) => (
          <button key={t.key} className={`chip${kindTab === t.key ? ' on' : ''}`} onClick={() => setKindTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 16px 12px' }}>
          <button className={`chip${tagFilter === null ? ' on' : ''}`} onClick={() => setTagFilter(null)}>
            全部标签
          </button>
          {allTags.map((t) => (
            <button key={t} className={`chip${tagFilter === t ? ' on' : ''}`} onClick={() => setTagFilter(tagFilter === t ? null : t)}>
              🏷 {t}
            </button>
          ))}
        </div>
      )}

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
                <FavTagBar fKey={f.key} tags={f.tags} tagEditKey={tagEditKey} setTagEditKey={setTagEditKey} tagInput={tagInput} setTagInput={setTagInput} setFavTags={setFavTags} />
              </div>
            )
          }
          const m = findBuiltinMaterial(f.key.slice(f.kind.length + 1)) ?? materialsById.get(f.key.slice(f.kind.length + 1))
          if (!m) return null
          return (
            <div key={f.key} style={{ margin: '0 16px 10px' }}>
              <MaterialCard
                m={m}
                onTrain={(mm) => nav.openTrain(mm.sceneId, mm.type === 'sentence' ? 2 : 1, mm.id)}
              />
              <FavTagBar fKey={f.key} tags={f.tags} tagEditKey={tagEditKey} setTagEditKey={setTagEditKey} tagInput={tagInput} setTagInput={setTagInput} setFavTags={setFavTags} />
            </div>
          )
        })
      )}
    </>
  )
}

/** 单条收藏的标签栏：展示已有标签 + 添加/删除 */
function FavTagBar({
  fKey,
  tags,
  tagEditKey,
  setTagEditKey,
  tagInput,
  setTagInput,
  setFavTags,
}: {
  fKey: string
  tags?: string[]
  tagEditKey: string | null
  setTagEditKey: (k: string | null) => void
  tagInput: string
  setTagInput: (v: string) => void
  setFavTags: (key: string, tags: string[]) => void
}) {
  const list = tags ?? []
  return (
    <div style={{ margin: '4px 16px 0', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
      {list.map((t) => (
        <span key={t} className="fav-tag" onClick={() => setFavTags(fKey, list.filter((x) => x !== t))} title="点击移除标签">
          🏷 {t} ✕
        </span>
      ))}
      {tagEditKey === fKey ? (
        <>
          <input
            autoFocus
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagInput.trim()) {
                setFavTags(fKey, [...list.filter((x) => x !== tagInput.trim()), tagInput.trim()])
                setTagInput('')
                setTagEditKey(null)
              }
            }}
            className="fav-tag-input"
            placeholder="标签名，回车确认"
          />
        </>
      ) : (
        <button className="fav-tag add" onClick={() => setTagEditKey(fKey)}>
          ＋ 标签
        </button>
      )}
    </div>
  )
}

const KIND_LABEL: Record<string, string> = {
  word: '单词',
  phrase: '短语',
  sentence: '句子',
  dict: '词典词',
}
