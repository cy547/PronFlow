/** PDF 导出视图：卡片式排版，通过浏览器「打印 → 另存为 PDF」生成（矢量文字、可复制、体积小） */
import { useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { Material } from '../types'
import { BUNDLES } from '../data'
import { useUser } from '../store/UserDataProvider'
import { SceneIcon } from './SceneIcon'
import { LEVEL_NAME } from './MaterialCard'

const TYPE_ACCENT: Record<Material['type'], string> = {
  word: '#12b886',
  phrase: '#5c9dff',
  sentence: '#ff9f43',
}
const TYPE_LABEL: Record<Material['type'], string> = { word: '单词', phrase: '短语', sentence: '句子' }

function LevelTag({ lv }: { lv: Material['spokenLevel'] }) {
  const color = lv === 'high' ? '#0e9e73' : lv === 'ok' ? '#4a86e8' : '#d9822b'
  const bg = lv === 'high' ? '#e6f7f1' : lv === 'ok' ? '#eaf2ff' : '#fff3e4'
  return (
    <span className="p-tag" style={{ color, background: bg }}>
      {LEVEL_NAME[lv]}
    </span>
  )
}

function MaterialCard({ m }: { m: Material }) {
  return (
    <div className="pcard" style={{ borderTopColor: TYPE_ACCENT[m.type] }}>
      <div className="pcard-type">{TYPE_LABEL[m.type]}</div>
      <div className="p-en">
        {m.en}
        {m.type === 'word' && m.pos && <span className="p-pos">{m.pos}</span>}
      </div>
      {(m.type === 'word' || m.type === 'phrase') && (m.ipaUS || m.ipaUK) && (
        <div className="p-ipa">
          {m.ipaUS && <span className="us">美 {m.ipaUS}</span>}
          {m.ipaUK && <span className="uk">英 {m.ipaUK}</span>}
        </div>
      )}
      <div className="p-zh">{m.zh}</div>
      <div className="p-flags">
        <LevelTag lv={m.spokenLevel} />
        {m.custom && <span className="p-tag" style={{ color: '#7a828a', background: '#f1f3f2' }}>自定义</span>}
      </div>

      {m.examples.slice(0, 2).map((ex, i) => (
        <div className="p-ex" key={i}>
          <div className="p-ex-en">— {ex.en}</div>
          <div className="p-ex-zh">{ex.zh}</div>
        </div>
      ))}

      {m.variants.slice(0, 2).map((v, i) => (
        <div className="p-var" key={i}>
          <span className="p-ver">{v.level}</span>
          {v.en} <span className="p-var-zh">{v.zh}</span>
        </div>
      ))}

      {m.type === 'sentence' && m.breakdown.slice(0, 3).map((b, i) => (
        <div className="p-brk" key={i}>
          <b>{i + 1}</b> {b.en} <span>{b.zh}</span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  /** null = 全部场景；否则只导出指定场景 */
  sceneIds: string[] | null
  onClose: () => void
}

export function PrintView({ sceneIds, onClose }: Props) {
  const { data } = useUser()

  const bundles = useMemo(() => {
    const builtin = (sceneIds ? BUNDLES.filter((b) => sceneIds.includes(b.scene.id)) : BUNDLES).map((b) => ({
      scene: b.scene,
      // 内置场景同样合并用户补充的内容
      materials: [
        ...data.customMaterials.filter((m) => m.sceneId === b.scene.id),
        ...b.materials,
      ],
    }))
    const customs = (sceneIds ? data.customScenes.filter((s) => sceneIds.includes(s.id)) : data.customScenes).map((s) => ({
      scene: { ...s },
      materials: data.customMaterials.filter((m) => m.sceneId === s.id),
    }))
    return [...builtin, ...customs]
  }, [sceneIds, data.customScenes, data.customMaterials])

  const total = bundles.reduce((n, b) => n + b.materials.length, 0)

  useEffect(() => {
    const t = window.setTimeout(() => window.print(), 350)
    const after = () => onClose()
    window.addEventListener('afterprint', after)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('afterprint', after)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className="print-root">
      <header className="p-cover">
        <h1>PronFlow · 场景口语手册</h1>
        <p>
          生成于 {new Date().toLocaleDateString('zh-CN')} · {bundles.length} 个场景 · {total} 条素材
        </p>
        <p className="p-sub">美式/英式双音标 · 口语使用度标注 · 含自定义场景 · 每张卡片可直接裁剪随身携带</p>
      </header>

      {bundles.map((b) => {
        const counts = { word: 0, phrase: 0, sentence: 0 }
        for (const m of b.materials) counts[m.type]++
        return (
          <section className="p-scene" key={b.scene.id}>
            <div className="p-scene-head">
              <span className="p-ic">
                <SceneIcon icon={b.scene.icon} size={34} />
              </span>
              <div className="p-scene-t">
                <h2>
                  {b.scene.name} <i>{b.scene.nameEn}</i>
                  {b.scene.custom && <span className="p-tag" style={{ color: '#7a828a', background: '#f1f3f2' }}>自定义</span>}
                </h2>
                <span className="p-count">
                  单词 {counts.word} · 短语 {counts.phrase} · 句子 {counts.sentence}
                </span>
              </div>
            </div>
            <div className="pcards">
              {b.materials.map((m) => (
                <MaterialCard key={m.id} m={m} />
              ))}
            </div>
          </section>
        )
      })}

      <footer className="p-footer">PronFlow · 专治口语失语 · 由本地数据生成</footer>
    </div>,
    document.body,
  )
}
