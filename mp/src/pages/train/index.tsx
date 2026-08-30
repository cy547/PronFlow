import { useEffect, useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { builtinMaterials } from '../../shared/scenes'
import type { Material, SentenceMaterial } from '../../shared/types'
import { actions, useUserData } from '../../store/useUserData'
import { PlayButton, LevelBadge } from '../../components/ui'
import { play, stopAudio } from '../../services/audio'
import './index.css'

const KIND_LABEL: Record<string, string> = { word: '单词', phrase: '短语', sentence: '句子', dict: '词典' }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 跟读录音回放（Taro RecorderManager） */
function Recorder({ resetKey }: { resetKey: string }) {
  const [state, setState] = useState<'idle' | 'recording' | 'done'>('idle')
  const [mine, setMine] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const recRef = useRef<Taro.RecorderManager | null>(null)
  const audioRef = useRef<Taro.InnerAudioContext | null>(null)

  useEffect(() => {
    const rec = Taro.getRecorderManager()
    rec.onStop((res) => {
      if (res.tempFilePath) {
        setMine(res.tempFilePath)
        setState('done')
      }
    })
    recRef.current = rec
    return () => {
      audioRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    audioRef.current?.destroy()
    setMine(null)
    setPlaying(false)
    setState('idle')
  }, [resetKey])

  const start = () => {
    audioRef.current?.stop()
    stopAudio()
    try {
      recRef.current?.start({ duration: 120000, format: 'mp3' })
      setState('recording')
    } catch {
      Taro.showToast({ title: '录音不可用', icon: 'none' })
    }
  }

  const stop = () => recRef.current?.stop()

  const playMine = () => {
    if (!mine) return
    audioRef.current?.destroy()
    const a = Taro.createInnerAudioContext()
    a.src = mine
    a.onEnded(() => setPlaying(false))
    a.onError(() => setPlaying(false))
    audioRef.current = a
    setPlaying(true)
    a.play()
  }

  return (
    <View className="rec-box">
      <Text className="d-label">🎙 跟读录音（录完和原音对照，戴耳机效果更好）</Text>
      {state === 'idle' && <View className="rec-btn ghost" onClick={start}><Text>🎤 开始录音跟读</Text></View>}
      {state === 'recording' && <View className="rec-btn live" onClick={stop}><Text>⏹ 停止录音</Text></View>}
      {state === 'done' && (
        <View className="btn-row">
          <View className="rec-btn again" onClick={playMine}><Text>{playing ? '🔈 播放中…' : '🎙 听我的录音'}</Text></View>
          <View className="rec-btn ghost" onClick={start}><Text>↻ 重录</Text></View>
        </View>
      )}
    </View>
  )
}

export default function TrainPage() {
  const router = useRouter()
  const sceneId = router.params.id || ''
  const focusId = router.params.focus
  const [mode, setMode] = useState<1 | 2 | 3>((Number(router.params.mode) || 1) as 1 | 2 | 3)
  const data = useUserData()

  const all: Material[] = useMemo(
    () => [...data.customMaterials.filter((m) => m.sceneId === sceneId), ...builtinMaterials(sceneId)],
    [sceneId, data.customMaterials],
  )

  return (
    <View className="train-page">
      <View className="modes">
        {([1, 2, 3] as const).map((m) => (
          <View key={m} className={`mode${mode === m ? ' on' : ''}`} onClick={() => setMode(m)}>
            <Text className="ic">{m === 1 ? '🈲' : m === 2 ? '🐢' : '🧩'}</Text>
            <Text>{m === 1 ? '中文遮屏自测' : m === 2 ? '慢速跟读' : '句式仿写'}</Text>
          </View>
        ))}
      </View>
      {mode === 1 && <SelfTest all={all} />}
      {mode === 2 && <FollowRead all={all} />}
      {mode === 3 && <Imitate all={all} focusMaterialId={focusId} />}
    </View>
  )
}

/* ---------- 模式 1：中文遮屏自测 ---------- */
function SelfTest({ all }: { all: Material[] }) {
  const { settings } = useUserData()
  const [kind, setKind] = useState<'all' | Material['type']>('all')
  const [seed, setSeed] = useState(0)
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState({ good: 0, again: 0 })

  const pool = useMemo(() => shuffle(kind === 'all' ? all : all.filter((m) => m.type === kind)), [kind, all, seed])
  const m = pool[idx]

  if (!m) {
    return <View className="empty"><Text className="t1">没有可自测的内容</Text><Text className="t2">换一个类型试试</Text></View>
  }

  const rate = (result: 'good' | 'again') => {
    actions.rate({ kind: m.type, id: m.id, en: m.en, zh: m.zh, sceneId: m.sceneId, result, isTest: true })
    setDone((d) => ({ good: d.good + (result === 'good' ? 1 : 0), again: d.again + (result === 'again' ? 1 : 0) }))
    setRevealed(false)
    if (idx + 1 >= pool.length) setSeed((s) => s + 1)
    setIdx((i) => (idx + 1 >= pool.length ? 0 : i + 1))
  }

  return (
    <View className="stage">
      <View className="prog">
        <Text className="fs12 sub">{KIND_LABEL[m.type]} {idx + 1}/{pool.length}</Text>
        <View className="bar"><View className="bar-in" style={{ width: `${((idx + 1) / pool.length) * 100}%` }} /></View>
        <Text className="fs12 sub">✅{done.good} 😤{done.again}</Text>
      </View>

      {!revealed ? (
        <View className="test-zh">
          <Text className="kind">{KIND_LABEL[m.type]} · 待开口</Text>
          <Text className="zh">{m.zh}</Text>
          <Text className="tip">🙈 英文已遮住 —— 先在心里组织，大声说出来再对答案</Text>
          <View className="train-btn">
            <View className="btn-main" onClick={() => { setRevealed(true); play(m.en, { rate: 0.9 }) }}>
              <Text>👁 我说完了，看答案</Text>
            </View>
            <View className="btn-main ghost" onClick={() => rate('again')}><Text>想不起来，跳过这题</Text></View>
          </View>
        </View>
      ) : (
        <View className="reveal">
          <Text className="ren">{m.en}</Text>
          {m.type === 'word' && <Text className="ripa">{m.ipaUS} · {m.ipaUK}</Text>}
          <View className="btn-row center">
            <PlayButton text={m.en} size={36} />
            <View className="mini" onClick={() => play(m.en, { rate: 0.55, id: m.en + '-slow' })}><Text>🐢</Text></View>
          </View>
          {m.variants.slice(0, 2).map((v, i) => (
            <View className="p-var" key={i} onClick={() => play(v.en, { rate: 0.9 })}>
              <Text className="ver">{v.level}</Text>
              <Text className="ven">{v.en}</Text>
              <Text className="vzh">{v.zh}</Text>
            </View>
          ))}
          <View className="btn-row">
            <View className="btn-main again" onClick={() => rate('again')}><Text>😤 卡住了</Text></View>
            <View className="btn-main good" onClick={() => rate('good')}><Text>✅ 说出来了</Text></View>
          </View>
          <Text className="fs12 sub center-t">卡住的会自动进入明天复习清单</Text>
        </View>
      )}
      {/* settings 引用避免未使用（口音由 play 内部读取） */}
      <Text style={{ display: 'none' }}>{settings.accent}</Text>
    </View>
  )
}

/* ---------- 模式 2：慢速跟读 ---------- */
function FollowRead({ all }: { all: Material[] }) {
  const sentences = all.filter((m) => m.type === 'sentence') as SentenceMaterial[]
  const list = sentences.length ? sentences : all
  const [idx, setIdx] = useState(0)
  const [annotated, setAnnotated] = useState(false)
  const m = list[idx]

  if (!m) {
    return <View className="empty"><Text className="t1">没有可跟读的内容</Text></View>
  }

  return (
    <View className="stage">
      <View className="prog">
        <Text className="fs12 sub">{idx + 1}/{list.length}</Text>
        <View className="bar"><View className="bar-in" style={{ width: `${((idx + 1) / list.length) * 100}%` }} /></View>
        <Text className="fs12 sub">慢速跟读</Text>
      </View>

      {m.type === 'sentence' && (
        <View className="ftoggle">
          <Text className={!annotated ? 'on' : ''} onClick={() => setAnnotated(false)}>原句</Text>
          <Text className={annotated ? 'on' : ''} onClick={() => setAnnotated(true)}>连读标注</Text>
        </View>
      )}

      {m.type === 'sentence' && annotated && m.linking ? (
        <Text className="f-link">{m.linking}</Text>
      ) : (
        <Text className="f-en">{m.en}</Text>
      )}
      <Text className="f-zh">{m.zh}</Text>

      <View className="btn-row center">
        <View className="btn-main" style={{ flex: '0 0 auto', padding: '0 22px' }} onClick={() => play(m.en, { rate: 0.55 })}><Text>🐢 慢速</Text></View>
        <View className="btn-main ghost" style={{ flex: '0 0 auto', padding: '0 18px' }} onClick={() => play(m.en)}><Text>▶ 常速</Text></View>
      </View>

      {m.type === 'sentence' && m.breakdown.length > 0 && (
        <View className="mt16">
          <Text className="d-label">✂️ 逐段跟读（点一段播一段）</Text>
          {m.breakdown.map((b, i) => (
            <View className="p-brk" key={i} onClick={() => play(b.en, { rate: 0.6 })}>
              <Text className="idx">{i + 1}</Text>
              <Text className="e">{b.en}</Text>
              <Text className="z">{b.zh}</Text>
            </View>
          ))}
        </View>
      )}

      <Recorder resetKey={m.id} />

      <View className="train-btn">
        <View className="btn-main" onClick={() => { stopAudio(); setIdx((i) => (i + 1) % list.length) }}>
          <Text>跟读完，下一句 →</Text>
        </View>
      </View>
    </View>
  )
}

/* ---------- 模式 3：句式仿写 ---------- */
function Imitate({ all, focusMaterialId }: { all: Material[]; focusMaterialId?: string }) {
  const templates = all.filter((m) => m.type === 'sentence' && m.template) as SentenceMaterial[]
  const [idx, setIdx] = useState(() => {
    const i = templates.findIndex((t) => t.id === focusMaterialId)
    return i >= 0 ? i : 0
  })
  const [sel, setSel] = useState<Record<string, string>>({})
  const m = templates[idx]

  useEffect(() => {
    if (m) {
      const init: Record<string, string> = {}
      for (const s of m.template!.slots) init[s.key] = s.options[0] ?? ''
      setSel(init)
    }
  }, [m?.id])

  if (!m) {
    return (
      <View className="empty">
        <Text className="t1">这个场景暂无仿写句式</Text>
        <Text className="t2">去其他场景练，或添加内容时填写仿写模板</Text>
      </View>
    )
  }

  const tpl = m.template!
  let composed = tpl.pattern
  for (const s of tpl.slots) composed = composed.replace(`{${s.key}}`, sel[s.key] ?? '…')

  return (
    <View className="stage">
      <View className="prog">
        <Text className="fs12 sub">{idx + 1}/{templates.length}</Text>
        <View className="bar"><View className="bar-in" style={{ width: `${((idx + 1) / templates.length) * 100}%` }} /></View>
        <Text className="fs12 sub">套句式 · 造自己的句子</Text>
      </View>

      <Text className="fs12 sub center-t">原句</Text>
      <Text className="imit-src">{m.en}</Text>

      {tpl.slots.map((s) => (
        <View key={s.key}>
          <View className="slot-chip"><Text>{s.label}</Text></View>
          <View className="slot-opts">
            {s.options.map((op) => (
              <Text key={op} className={`opt${sel[s.key] === op ? ' on' : ''}`} onClick={() => setSel((v) => ({ ...v, [s.key]: op }))}>
                {op}
              </Text>
            ))}
          </View>
        </View>
      ))}

      <View className="compose" onClick={() => play(composed)}>
        <Text className="c-text">{composed}</Text>
        <Text className="c-tip">👆 点一下听效果</Text>
      </View>

      <View className="train-btn">
        <View className="btn-main" onClick={() => setIdx((i) => (i + 1) % templates.length)}><Text>换一个句式 →</Text></View>
      </View>
      <LevelBadge lv={m.spokenLevel} />
    </View>
  )
}
