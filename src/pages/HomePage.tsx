/** 首页：场景列表（置顶 / 内置 / 自定义） */
import { useMemo, useState } from 'react'
import type { Scene } from '../types'
import { BUNDLES } from '../data'
import { useUser } from '../store/UserDataProvider'
import { useNav } from '../nav'
import { Sheet } from '../components/Sheet'
import { SceneForm } from '../components/forms'
import { SceneIcon } from '../components/SceneIcon'

export function HomePage() {
  const { data, togglePin, deleteCustomScene, isPinned } = useUser()
  const nav = useNav()
  const [menuScene, setMenuScene] = useState<Scene | null>(null)
  const [editScene, setEditScene] = useState<Scene | null>(null)
  const [creating, setCreating] = useState(false)

  const customIds = useMemo(() => new Set(data.customScenes.map((s) => s.id)), [data.customScenes])

  const pinnedScenes = useMemo(() => {
    const all = [...data.customScenes, ...BUNDLES.map((b) => b.scene)]
    return data.pinned.map((id) => all.find((s) => s.id === id)).filter((s): s is Scene => !!s)
  }, [data.pinned, data.customScenes])

  const countsOf = (sceneId: string) => {
    const b = BUNDLES.find((x) => x.scene.id === sceneId)
    const c = { word: 0, phrase: 0, sentence: 0 }
    if (b) for (const m of b.materials) c[m.type]++
    for (const m of data.customMaterials) if (m.sceneId === sceneId) c[m.type]++
    return c
  }

  const card = (s: Scene) => {
    const c = countsOf(s.id)
    return (
      <button key={s.id} className="scene-card" onClick={() => nav.push({ name: 'scene', sceneId: s.id })}>
        <div className="row">
          <span className="icon"><SceneIcon icon={s.icon} size={26} /></span>
          {isPinned(s.id) && <span className="pin">📌</span>}
        </div>
        <div className="name">{s.name}</div>
        <div className="meta">词 {c.word} · 短语 {c.phrase} · 句 {c.sentence}</div>
        <span
          className="menu"
          onClick={(e) => {
            e.stopPropagation()
            setMenuScene(s)
          }}
        >
          ⋯
        </span>
      </button>
    )
  }

  return (
    <div className="page">
      <div className="home-head">
        <h1>Pron<span className="en">Flow</span></h1>
        <p>专治口语失语：心里有中文，开口就是英文。</p>
      </div>

      <button className="home-search" onClick={() => nav.goTab('search')}>
        <span>🔍</span>
        <span>输入你心里想说的中文，帮你找到那句英文…</span>
      </button>

      {pinnedScenes.length > 0 && (
        <>
          <div className="section-title">📌 置顶场景</div>
          <div className="scene-grid">{pinnedScenes.map(card)}</div>
        </>
      )}

      <div className="section-title">
        全部场景
        <span className="more">按生活场景开口</span>
      </div>
      <div className="scene-grid">
        {BUNDLES.map((b) => card(b.scene))}
        <button className="scene-card add-scene" onClick={() => setCreating(true)}>
          <span className="plus">＋</span>
          新建自定义场景
        </button>
      </div>

      {data.customScenes.length > 0 && (
        <>
          <div className="section-title">✍️ 我的自定义场景</div>
          <div className="scene-grid">{data.customScenes.map(card)}</div>
        </>
      )}

      {menuScene && (
        <Sheet title={menuScene.name} onClose={() => setMenuScene(null)}>
          <button
            className="mine-row"
            onClick={() => {
              togglePin(menuScene.id)
              setMenuScene(null)
            }}
          >
            <span className="ic">📌</span>
            <span className="lb">{isPinned(menuScene.id) ? '取消置顶' : '置顶场景'}</span>
          </button>
          {customIds.has(menuScene.id) && (
            <>
              <button
                className="mine-row"
                onClick={() => {
                  setEditScene(menuScene)
                  setMenuScene(null)
                }}
              >
                <span className="ic">✏️</span>
                <span className="lb">重命名 / 编辑</span>
              </button>
              <button
                className="mine-row"
                style={{ color: 'var(--red)' }}
                onClick={() => {
                  if (confirm(`删除场景「${menuScene.name}」及其全部内容？`)) {
                    deleteCustomScene(menuScene.id)
                  }
                  setMenuScene(null)
                }}
              >
                <span className="ic">🗑</span>
                <span className="lb">删除场景</span>
              </button>
            </>
          )}
        </Sheet>
      )}

      {(creating || editScene) && (
        <SceneForm
          initial={editScene ?? undefined}
          onDone={() => {
            setCreating(false)
            setEditScene(null)
          }}
        />
      )}
    </div>
  )
}
