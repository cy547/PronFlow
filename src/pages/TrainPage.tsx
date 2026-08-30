/** 口语训练页：中文遮屏自测 / 慢速跟读 / 句式仿写 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Material, SentenceMaterial } from '../types'
import { builtinMaterials } from '../data'
import { useUser } from '../store/UserDataProvider'
import { useNav } from '../nav'
import { play } from '../services/tts'
import { LinkingLegend, LinkingText } from '../components/LinkingText'
import { LoopButton, SlowButton } from '../components/AudioButton'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { LEVEL_NAME } from '../components/MaterialCard'

type Mode = 1 | 2 | 3
type KindFilter = 'all' | 'word' | 'phrase' | 'sentence'

const KIND_LABEL: Record<string, string> = { word: '单词', phrase: '短语', sentence: '句子', dict: '词库' }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function TrainPage({ sceneId, initialMode = 1, focusMaterialId }: { sceneId: string; initialMode?: Mode; focusMaterialId?: string }) {
  const nav = useNav()
  const [mode, setMode] = useState<Mode>(initialMode)

  const materials = useMemo(() => {
    const builtin = builtinMaterials(sceneId)
    return builtin
  }, [sceneId])

  const withCustom = useUser().data.customMaterials.filter((m) => m.sceneId === sceneId)
  const all = useMemo(() => [...withCustom, ...materials], [withCustom, materials])

  return (
    <div className="page">
      <div className="nav">
        <button className="back" onClick={nav.back}>←</button>
        <div className="title">🎯 口语训练</div>
      </div>

      <div className="train-modes">
        <button className={mode === 1 ? 'on' : ''} onClick={() => setMode(1)}>
          <span className="ic">🈲</span>
          中文遮屏自测
        </button>
        <button className={mode === 2 ? 'on' : ''} onClick={() => setMode(2)}>
          <span className="ic">🐢</span>
          慢速跟读
        </button>
        <button className={mode === 3 ? 'on' : ''} onClick={() => setMode(3)}>
          <span className="ic">🧩</span>
          句式仿写
        </button>
      </div>

      {mode === 1 && <SelfTest all={all} />}
      {mode === 2 && <FollowRead all={all} />}
      {mode === 3 && <Imitate all={all} focusMaterialId={focusMaterialId} />}
    </div>
  )
}

/* ================= 模式 1：中文遮屏自测 ================= */
function SelfTest({ all }: { all: Material[] }) {
  const { scheduleReview, bumpStat } = useUser()
  const [kind, setKind] = useState<KindFilter>('all')
  const [seed, setSeed] = useState(0)
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState({ good: 0, again: 0 })

  const pool = useMemo(() => {
    const base = kind === 'all' ? all : all.filter((m) => m.type === kind)
    return shuffle(base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, all, seed])

  const m = pool[idx]

  if (!m) {
    return (
      <div className="empty">
        <div className="ic">🈳</div>
        <div className="t1">没有可自测的内容</div>
        <div className="t2">换一个类型，或去场景里添加内容</div>
      </div>
    )
  }

  const rate = (result: 'good' | 'again') => {
    scheduleReview({ kind: m.type, id: m.id, en: m.en, zh: m.zh, sceneId: m.sceneId, result })
    bumpStat('tests')
    setDone((d) => ({ good: d.good + (result === 'good' ? 1 : 0), again: d.again + (result === 'again' ? 1 : 0) }))
    setRevealed(false)
    if (idx + 1 >= pool.length) setSeed((s) => s + 1)
    setIdx((i) => (idx + 1 >= pool.length ? 0 : i + 1))
  }

  const reveal = () => {
    setRevealed(true)
    void play(m.en, { rate: 0.9 })
  }

  return (
    <div className="train-stage">
      <div className="train-progress">
        <span>
          {KIND_LABEL[m.type]} {idx + 1}/{pool.length}
        </span>
        <div className="bar">
          <i style={{ width: `${((idx + 1) / pool.length) * 100}%` }} />
        </div>
        <span>✅{done.good} 😤{done.again}</span>
      </div>

      {!revealed ? (
        <div className="test-zh fade-in">
          <div className="kind">{KIND_LABEL[m.type]} · {LEVEL_NAME[m.spokenLevel]}</div>
          <div className="zh">{m.zh}</div>
          <div className="tip">🙈 英文已遮住 —— 先在心里组织，大声说出来再对答案</div>
        </div>
      ) : (
        <div className="test-reveal fade-in">
          <div className="en">{m.en}</div>
          {m.type === 'word' && <div className="ipa">{m.ipaUS} · {m.ipaUK}</div>}
          <div className="mt8" style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <LoopButton text={m.en} />
            <SlowButton text={m.en} />
          </div>
          {m.variants.length > 0 && (
            <div className="alt">
              {m.variants.slice(0, 2).map((v, i) => (
                <div className="var-row" key={i} onClick={() => void play(v.en, { rate: 0.9 })}>
                  <span className="badge ver">{v.level}</span>
                  <div style={{ flex: 1 }}>
                    <div className="v-en">{v.en}</div>
                    <div className="v-zh">{v.zh}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="train-btn">
        {!revealed ? (
          <>
            <button className="btn-main" onClick={reveal}>👁 我说完了，看答案</button>
            <button className="btn-main ghost" onClick={() => rate('again')}>想不起来，跳过这题</button>
          </>
        ) : (
          <>
            <div className="btn-row">
              <button className="btn-main again" onClick={() => rate('again')}>😤 卡住了</button>
              <button className="btn-main good" onClick={() => rate('good')}>✅ 说出来了</button>
            </div>
            <div className="fs12 text-sub" style={{ textAlign: 'center' }}>卡住的会自动进入明天复习清单</div>
          </>
        )}
      </div>
    </div>
  )
}

/* ================= 模式 2：慢速跟读 ================= */
function FollowRead({ all }: { all: Material[] }) {
  const sentences = all.filter((m) => m.type === 'sentence') as SentenceMaterial[]
  const list = sentences.length ? sentences : all
  const [idx, setIdx] = useState(0)
  const [annotated, setAnnotated] = useState(false)
  const { data } = useUser()
  const m = list[idx]

  if (!m) {
    return (
      <div className="empty">
        <div className="ic">🐢</div>
        <div className="t1">没有可跟读的内容</div>
      </div>
    )
  }

  const next = () => setIdx((i) => (i + 1) % list.length)

  return (
    <div className="train-stage">
      <div className="train-progress">
        <span>{idx + 1}/{list.length}</span>
        <div className="bar">
          <i style={{ width: `${((idx + 1) / list.length) * 100}%` }} />
        </div>
        <span>慢速跟读</span>
      </div>

      {m.type === 'sentence' && (
        <div className="follow-toggle">
          <button className={!annotated ? 'on' : ''} onClick={() => setAnnotated(false)}>原句</button>
          <button className={annotated ? 'on' : ''} onClick={() => setAnnotated(true)}>连读标注</button>
        </div>
      )}

      <div className="follow-en">
        {annotated && m.type === 'sentence' && m.linking ? <LinkingText text={m.linking} /> : m.en}
      </div>
      <div style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 13.5, marginTop: 6 }}>{m.zh}</div>

      <div className="mt16" style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn-main" style={{ flex: '0 0 auto', padding: '0 22px' }} onClick={() => void play(m.en, { rate: 0.55 })}>
          🐢 慢速
        </button>
        <button className="btn-main ghost" style={{ flex: '0 0 auto', padding: '0 18px' }} onClick={() => void play(m.en, { accent: data.settings.accent })}>
          ▶ 常速
        </button>
      </div>

      {m.type === 'sentence' && m.breakdown.length > 0 && (
        <div className="d-block mt16">
          <div className="d-label">✂️ 逐段跟读（点一段播一段）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {m.breakdown.map((b, i) => (
              <div className="brk-row" key={i} onClick={() => void play(b.en, { rate: 0.6 })}>
                <span className="idx">{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div className="e">{b.en}</div>
                  <div className="z">{b.zh}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {annotated && <div className="mt16"><LinkingLegend /></div>}

      <VoiceRecorder resetKey={m.id} />

      <div className="train-btn">
        <button className="btn-main" onClick={next}>跟读完，下一句 →</button>
      </div>
    </div>
  )
}

/* ================= 模式 3：句式仿写 ================= */
function Imitate({ all, focusMaterialId }: { all: Material[]; focusMaterialId?: string }) {
  const templates = all.filter((m) => m.type === 'sentence' && m.template) as SentenceMaterial[]
  const { data } = useUser()
  const [idx, setIdx] = useState(() => {
    const i = templates.findIndex((t) => t.id === focusMaterialId)
    return i >= 0 ? i : 0
  })
  const [sel, setSel] = useState<Record<string, string>>({})
  const initialized = useRef('')

  const m = templates[idx]

  useEffect(() => {
    if (m && initialized.current !== m.id) {
      initialized.current = m.id
      const init: Record<string, string> = {}
      for (const s of m.template!.slots) init[s.key] = s.options[0] ?? ''
      setSel(init)
    }
  }, [m])

  if (!m) {
    return (
      <div className="empty">
        <div className="ic">🧩</div>
        <div className="t1">这个场景暂无仿写句式</div>
        <div className="t2">去其他场景练，或自定义句子时填写仿写模板</div>
      </div>
    )
  }

  const tpl = m.template!
  let composed = tpl.pattern
  for (const s of tpl.slots) composed = composed.replace(`{${s.key}}`, sel[s.key] ?? `…`)

  const cycle = (key: string, dir: 1 | -1) => {
    const slot = tpl.slots.find((s) => s.key === key)!
    const cur = slot.options.indexOf(sel[key] ?? '')
    const n = (cur + dir + slot.options.length) % slot.options.length
    setSel((v) => ({ ...v, [key]: slot.options[n] }))
  }

  const next = () => setIdx((i) => (i + 1) % templates.length)

  return (
    <div className="train-stage">
      <div className="train-progress">
        <span>{idx + 1}/{templates.length}</span>
        <div className="bar">
          <i style={{ width: `${((idx + 1) / templates.length) * 100}%` }} />
        </div>
        <span>套句式 · 造自己的句子</span>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 12.5 }}>原句</div>
      <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 600, marginTop: 4 }}>{m.en}</div>
      <div style={{ textAlign: 'center', color: 'var(--sub)', fontSize: 12.5, marginTop: 3 }}>{m.zh}</div>

      <div className="mt16">
        {tpl.slots.map((s) => (
          <div key={s.key}>
            <div className="slot-row">
              <span className="slot-chip">{s.label}</span>
            </div>
            <div className="slot-opts">
              {s.options.map((op) => (
                <button key={op} className={sel[s.key] === op ? 'on' : ''} onClick={() => setSel((v) => ({ ...v, [s.key]: op }))}>
                  {op}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="compose" onClick={() => void play(composed, { accent: data.settings.accent })}>
        {composed}
        <div className="fs12" style={{ color: 'var(--brand-deep)', fontWeight: 400, marginTop: 4 }}>👆 点一下听效果</div>
      </div>

      <div className="train-btn">
        <button className="btn-main" onClick={next}>换一个句式 →</button>
      </div>
    </div>
  )
}
