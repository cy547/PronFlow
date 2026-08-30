/** 统一素材卡片：双音标 / 三种播放 / 口语度 / 例句 / 多版本 / 拆分 / 连读 / 仿写 */
import { useState } from 'react'
import type { Material, SpokenLevel } from '../types'
import { play } from '../services/tts'
import { useUser } from '../store/UserDataProvider'
import { AudioButton, LoopButton, SlowButton, StarButton } from './AudioButton'
import { LinkingLegend, LinkingText } from './LinkingText'

export const LEVEL_NAME: Record<SpokenLevel, string> = {
  high: '高频口语',
  ok: '口语可用',
  formal: '书面慎用',
}

export function LevelBadge({ lv }: { lv: SpokenLevel }) {
  return <span className={`badge lv-${lv}`}>{LEVEL_NAME[lv]}</span>
}

interface Props {
  m: Material
  defaultOpen?: boolean
  onTrain?: (m: Material) => void
  onEdit?: (m: Material) => void
  onDelete?: (m: Material) => void
}

export function MaterialCard({ m, defaultOpen = false, onTrain, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const { data, isFav, toggleFav } = useUser()
  const fav = isFav(m.type, m.id)
  const ipaShow = m.type === 'word' || m.type === 'phrase'

  const ipaTap = (accent: 'US' | 'UK') => (e: React.MouseEvent) => {
    e.stopPropagation()
    void play(m.en, { accent })
  }

  return (
    <div className="mat-card">
      <div className="mat-head">
        <div className="main" onClick={() => setOpen((o) => !o)}>
          <div className="en">{m.en}</div>
          {ipaShow && (m.ipaUS || m.ipaUK) && (
            <div className="ipa">
              {m.ipaUS && (
                <span className="us" onClick={ipaTap('US')}>{m.ipaUS}</span>
              )}
              {m.ipaUK && (
                <span className="uk" onClick={ipaTap('UK')}>{m.ipaUK}</span>
              )}
              {m.type === 'word' && m.pos && <span>{m.pos}</span>}
            </div>
          )}
          <div className="zh">{m.zh}</div>
          <div className="flags">
            <LevelBadge lv={m.spokenLevel} />
            {m.custom && <span className="tag">自定义</span>}
            {m.type === 'sentence' && m.template && <span className="tag">可仿写</span>}
          </div>
        </div>
        <div className="mat-actions">
          <AudioButton text={m.en} />
          <div className="mini-acts">
            <LoopButton text={m.en} />
            <SlowButton text={m.en} />
            <StarButton
              on={fav}
              onTap={() => toggleFav({ kind: m.type, id: m.id, en: m.en, zh: m.zh, sceneId: m.sceneId })}
            />
          </div>
        </div>
      </div>

      {open && (
        <div className="mat-detail">
          {m.note && (
            <div className="d-block">
              <div className="d-label">💡 口语提示</div>
              <div className="var-row" style={{ cursor: 'default' }}>
                <div className="v-en" style={{ fontWeight: 400 }}>{m.note}</div>
              </div>
            </div>
          )}

          {m.examples.length > 0 && (
            <div className="d-block">
              <div className="d-label">
                💬 对话例句 <span className="hint">点气泡听发音</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {m.examples.map((ex, i) => (
                  <div className="dlg" key={i}>
                    <div className="who">{i % 2 === 0 ? '🗣️' : '🙋'}</div>
                    <div className="bubble" onClick={() => void play(ex.en, { accent: data.settings.accent })}>
                      <div className="e">{ex.en}</div>
                      <div className="z">{ex.zh}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {m.variants.length > 0 && (
            <div className="d-block">
              <div className="d-label">
                🔄 换个说法 <span className="hint">同义 / 替换 / 不同语气</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {m.variants.map((v, i) => (
                  <div className="var-row" key={i} onClick={() => void play(v.en, { accent: data.settings.accent })}>
                    <span className="badge ver">{v.level}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="v-en">{v.en}</div>
                      <div className="v-zh">{v.zh}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {m.type === 'sentence' && m.breakdown.length > 0 && (
            <div className="d-block">
              <div className="d-label">
                ✂️ 长句拆分 <span className="hint">一小段一小段说，零基础也能开口</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {m.breakdown.map((b, i) => (
                  <div className="brk-row" key={i} onClick={() => void play(b.en, { accent: data.settings.accent, rate: 0.8 })}>
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

          {m.type === 'sentence' && m.linking && (
            <div className="d-block">
              <div className="d-label">🔊 连读弱读标注 <span className="hint">老外真实嘴里的样子</span></div>
              <div className="link-box">
                <LinkingText text={m.linking} />
              </div>
              <div className="mt8">
                <LinkingLegend />
              </div>
            </div>
          )}

          {m.type === 'sentence' && m.template && onTrain && (
            <div className="d-block">
              <div className="d-label">🧩 句式仿写</div>
              <button className="btn-main ghost" style={{ height: 38, borderRadius: 19, fontSize: 13.5 }} onClick={() => onTrain(m)}>
                用这个句式造句 →
              </button>
            </div>
          )}

          {m.custom && (onEdit || onDelete) && (
            <div className="d-block" style={{ display: 'flex', gap: 8 }}>
              {onEdit && (
                <button className="btn-main ghost" style={{ height: 36, fontSize: 13 }} onClick={() => onEdit(m)}>
                  ✏️ 编辑
                </button>
              )}
              {onDelete && (
                <button
                  className="btn-main ghost"
                  style={{ height: 36, fontSize: 13, color: 'var(--red)' }}
                  onClick={() => onDelete(m)}
                >
                  🗑 删除
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
