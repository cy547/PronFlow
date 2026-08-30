/** 场景详情：单词 / 短语 / 句子 三 Tab + 训练入口 + 自定义内容管理 */
import { useMemo, useState } from 'react'
import type { Material } from '../types'
import { builtinMaterials, BUNDLES } from '../data'
import { useUser } from '../store/UserDataProvider'
import { useNav } from '../nav'
import { MaterialCard } from '../components/MaterialCard'
import { MaterialForm } from '../components/forms'
import { Sheet } from '../components/Sheet'
import { SceneIcon } from '../components/SceneIcon'
import { PrintView } from '../components/PrintView'

type Tab = 'word' | 'phrase' | 'sentence'

const TAB_META: { key: Tab; label: string; icon: string }[] = [
  { key: 'word', label: '单词', icon: '🔤' },
  { key: 'phrase', label: '短语', icon: '🧷' },
  { key: 'sentence', label: '句子', icon: '💬' },
]

export function ScenePage({ sceneId }: { sceneId: string }) {
  const nav = useNav()
  const { data, deleteCustomMaterial } = useUser()
  const [tab, setTab] = useState<Tab>('word')
  const [adding, setAdding] = useState<Material['type'] | null>(null)
  const [editing, setEditing] = useState<Material | null>(null)
  const [showPdf, setShowPdf] = useState(false)

  const scene = useMemo(
    () => data.customScenes.find((s) => s.id === sceneId) ?? BUILTIN_SCENE_LOOKUP[sceneId],
    [sceneId, data.customScenes],
  )

  const materials = useMemo(() => {
    const builtin = builtinMaterials(sceneId)
    const custom = data.customMaterials.filter((m) => m.sceneId === sceneId)
    return { builtin, custom, all: [...custom, ...builtin] }
  }, [sceneId, data.customMaterials])

  if (!scene) return <div className="empty">场景不存在</div>

  const filtered = materials.all.filter((m) => m.type === tab)
  const counts = { word: 0, phrase: 0, sentence: 0 }
  for (const m of materials.all) counts[m.type]++

  return (
    <div className="page">
      <div className="nav">
        <button className="back" onClick={nav.back}>←</button>
        <div className="title">
          <SceneIcon icon={scene.icon} size={22} />
          <span style={{ whiteSpace: 'nowrap' }}>{scene.name}</span>
          <span className="t-en">{scene.nameEn}</span>
        </div>
        <button className="action plain" onClick={() => setAdding('word')}>＋ 添加</button>
        <button className="action plain" title="导出本场景 PDF" onClick={() => setShowPdf(true)}>📄</button>
        <button className="action" onClick={() => nav.openTrain(sceneId)}>🎯 训练</button>
      </div>

      <div className="quick-add">
        <span className="qa-label">{scene.custom ? '快捷添加：' : '补充到这个场景：'}</span>
        <button onClick={() => setAdding('word')}>＋ 单词</button>
        <button onClick={() => setAdding('phrase')}>＋ 短语</button>
        <button onClick={() => setAdding('sentence')}>＋ 句子</button>
      </div>

      <button className="train-entry" onClick={() => nav.openTrain(sceneId)}>
        <span className="t-ic">🎯</span>
        <div className="t-main">
          <b>口语训练</b>
          <p>中文遮屏自测 · 慢速跟读 · 句式仿写</p>
        </div>
        <span className="go">→</span>
      </button>

      <div className="tab-seg">
        {TAB_META.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
            {t.icon} {t.label}
            <span className="cnt">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="ic">{TAB_META.find((t) => t.key === tab)?.icon}</div>
          <div className="t1">这个场景还没有{TAB_META.find((t) => t.key === tab)?.label}</div>
          <div className="t2">
            {scene.custom
              ? '点右上角「＋ 添加」补上你自己的表达'
              : '点「＋ 添加」把你在路上想到的表达补充进来，同样进搜索、收藏和复习'}
          </div>
        </div>
      ) : (
        filtered.map((m) => (
          <MaterialCard
            key={m.id}
            m={m}
            onTrain={(mm) => nav.openTrain(mm.sceneId, 3, mm.id)}
            onEdit={(mm) => setEditing(mm)}
            onDelete={(mm) => {
              if (confirm(`删除「${mm.en}」？`)) deleteCustomMaterial(mm.id)
            }}
          />
        ))
      )}

      {filtered.length > 0 && (
        <button className="btn-main ghost mt16" onClick={() => setAdding(tab)}>＋ 添加{TAB_META.find((t) => t.key === tab)?.label}</button>
      )}

      {(adding || editing) && (
        <MaterialForm
          sceneId={sceneId}
          initial={editing ?? undefined}
          initialType={adding ?? undefined}
          onDone={() => {
            setAdding(null)
            setEditing(null)
          }}
        />
      )}

      {showPdf && <PrintView sceneIds={[sceneId]} onClose={() => setShowPdf(false)} />}
    </div>
  )
}

const BUILTIN_SCENE_LOOKUP: Record<string, (typeof BUNDLES)[number]['scene']> = Object.fromEntries(
  BUNDLES.map((b) => [b.scene.id, b.scene]),
)
