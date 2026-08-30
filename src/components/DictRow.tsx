/** 词库词条行（词库页 & 搜索结果共用） */
import { useState } from 'react'
import type { DictWord } from '../types'
import { play } from '../services/tts'
import { useUser } from '../store/UserDataProvider'
import { AudioButton, LoopButton, SlowButton, StarButton } from './AudioButton'
import { TAG_NAMES } from '../services/dict'
import { LevelBadge, LEVEL_NAME } from './MaterialCard'

export function DictRow({ d, defaultOpen = false }: { d: DictWord; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const { data, isFav, toggleFav } = useUser()
  const fav = isFav('dict', d.w)
  const ipa = data.settings.accent === 'US' ? d.us || d.uk : d.uk || d.us

  return (
    <>
      <div className="dict-row" onClick={() => setOpen((o) => !o)}>
        <div className="w">
          <div className="en">{d.w}</div>
          <div className="p">{ipa} {d.pos}</div>
        </div>
        <div className="m">{d.zh}</div>
        <div className="mat-actions">
          <AudioButton text={d.w} size={34} />
          <div className="mini-acts">
            <StarButton
              on={fav}
              onTap={() => toggleFav({ kind: 'dict', id: d.w, en: d.w, zh: d.zh })}
            />
          </div>
        </div>
      </div>

      {open && (
        <div className="dict-detail">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {(d.us || d.uk) && (
              <>
                {d.us && <span className="badge lv-ok" onClick={() => void play(d.w, { accent: 'US' })}>美 {d.us}</span>}
                {d.uk && <span className="badge lv-formal" onClick={() => void play(d.w, { accent: 'UK' })}>英 {d.uk}</span>}
              </>
            )}
            {d.freq != null && d.freq > 0 && <span className="freq-stars">{'★'.repeat(Math.min(5, d.freq))}</span>}
            {d.tags?.map((t) => <span key={t} className="tag">{TAG_NAMES[t] ?? t}</span>)}
          </div>

          <div className="full-zh">{d.zh}</div>

          {d.spoken && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {d.spoken.level && (
                <div>
                  <span className="badge lv-high">口语度 · {LEVEL_NAME[d.spoken.level]}</span>
                </div>
              )}
              {d.spoken.note && (
                <div className="var-row" style={{ cursor: 'default' }}>
                  <div className="v-en" style={{ fontWeight: 400 }}>💡 {d.spoken.note}</div>
                </div>
              )}
              {d.spoken.examples?.map((ex, i) => (
                <div className="dlg" key={i}>
                  <div className="who">{i % 2 === 0 ? '🗣️' : '🙋'}</div>
                  <div className="bubble" onClick={() => void play(ex.en, { accent: data.settings.accent })}>
                    <div className="e">{ex.en}</div>
                    <div className="z">{ex.zh}</div>
                  </div>
                </div>
              ))}
              {d.spoken.variants && (
                <div className="d-block">
                  <div className="d-label">🔄 换个说法</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {d.spoken.variants.map((v, i) => (
                      <div className="var-row" key={i} onClick={() => void play(v.en, { accent: data.settings.accent })}>
                        <span className="badge ver">{v.level}</span>
                        <div style={{ flex: 1 }}>
                          <div className="v-en">{v.en}</div>
                          <div className="v-zh">{v.zh}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mini-acts" style={{ alignSelf: 'flex-start' }}>
            <LoopButton text={d.w} />
            <SlowButton text={d.w} />
            <StarButton
              on={fav}
              onTap={() => toggleFav({ kind: 'dict', id: d.w, en: d.w, zh: d.zh })}
            />
          </div>
        </div>
      )}
    </>
  )
}

export function DictStars({ freq }: { freq?: number }) {
  if (!freq) return null
  return <span className="freq-stars">{'★'.repeat(Math.min(5, freq))}</span>
}

export function SpokenHint({ d }: { d: DictWord }) {
  return d.spoken ? <LevelBadge lv={d.spoken.level ?? 'ok'} /> : null
}
