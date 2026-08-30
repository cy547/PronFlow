/** 全局搜索页：中英互搜、模糊/精准、历史、分组结果（中文搜英文应急找话） */
import { useEffect, useMemo, useState } from 'react'
import type { DictWord, Material } from '../types'
import { searchAll, type SearchMode, type SearchResults } from '../services/search'
import { loadDict } from '../services/dict'
import { useUser } from '../store/UserDataProvider'
import { useNav } from '../nav'
import { MaterialCard } from '../components/MaterialCard'
import { DictRow } from '../components/DictRow'
import { SceneIcon } from '../components/SceneIcon'

export function SearchPage() {
  const { data, pushHistory, clearHistory } = useUser()
  const nav = useNav()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<SearchMode>('fuzzy')
  const [submitted, setSubmitted] = useState('')
  const [dict, setDict] = useState<DictWord[] | null>(null)

  useEffect(() => {
    void loadDict().then((r) => setDict(r.words))
  }, [])

  const results: SearchResults | null = useMemo(() => {
    if (!submitted) return null
    return searchAll(submitted, mode, {
      customMaterials: data.customMaterials,
      customScenes: data.customScenes,
      dict,
    })
  }, [submitted, mode, data.customMaterials, data.customScenes, dict])

  const run = (q: string) => {
    const t = q.trim()
    if (!t) return
    setInput(t)
    setSubmitted(t)
    pushHistory(t)
  }

  return (
    <div className="page">
      <div className="nav">
        <div className="title">🔍 搜索</div>
      </div>

      <div className="search-bar">
        <span>🔍</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run(input)}
          placeholder="输入你心里想说的中文…"
          autoFocus
        />
        {input && (
          <button className="clr" onClick={() => { setInput(''); setSubmitted('') }}>✕</button>
        )}
        <button className="go" onClick={() => run(input)}>找话</button>
      </div>

      <div className="search-modes">
        <button className={`chip${mode === 'fuzzy' ? ' on' : ''}`} onClick={() => setMode('fuzzy')}>模糊搜</button>
        <button className={`chip${mode === 'exact' ? ' on' : ''}`} onClick={() => setMode('exact')}>精准搜</button>
        <span className="fs12 text-sub" style={{ alignSelf: 'center' }}>搜场景 / 单词 / 短语 / 句子 / 中文意思</span>
      </div>

      {!submitted && (
        <>
          {data.history.length > 0 ? (
            <>
              <div className="hist-title">
                最近搜过
                <button onClick={clearHistory}>清空</button>
              </div>
              <div className="hist-chips">
                {data.history.map((h) => (
                  <button key={h} className="chip" onClick={() => run(h)}>{h}</button>
                ))}
              </div>
            </>
          ) : (
            <div className="empty">
              <div className="ic">💬</div>
              <div className="t1">想说不会说？</div>
              <div className="t2">
                把你心里那句中文打进来，<br />我给你地道原生英文说法。<br />比如：「AA制」「我不吃辣」「改天再约」
              </div>
            </div>
          )}
        </>
      )}

      {results && (
        <div className="fade-in">
          {results.scenes.items.length > 0 && (
            <div className="search-sec">
              <div className="sec-h">🗺️ 场景 <span className="n">{results.scenes.total} 个</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.scenes.items.map((s) => (
                  <button key={s.id} className="var-row" style={{ cursor: 'pointer' }} onClick={() => nav.push({ name: 'scene', sceneId: s.id })}>
                    <SceneIcon icon={s.icon} size={20} />
                    <div style={{ flex: 1 }}>
                      <div className="v-en">{s.name} <span className="text-sub fs12">{s.nameEn}</span></div>
                      <div className="v-zh">{s.desc}</div>
                    </div>
                    <span className="arrow text-sub">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.words.items.length > 0 && (
            <div className="search-sec">
              <div className="sec-h">🔤 单词 <span className="n">{results.words.total} 条</span></div>
              {results.words.items.map((m) => (
                <MaterialCard key={m.id} m={m} onTrain={(mm) => nav.openTrain(mm.sceneId, 3, mm.id)} />
              ))}
            </div>
          )}

          {results.phrases.items.length > 0 && (
            <div className="search-sec">
              <div className="sec-h">🧷 短语 <span className="n">{results.phrases.total} 条</span></div>
              {results.phrases.items.map((m) => (
                <MaterialCard key={m.id} m={m} onTrain={(mm) => nav.openTrain(mm.sceneId, 3, mm.id)} />
              ))}
            </div>
          )}

          {results.sentences.items.length > 0 && (
            <div className="search-sec">
              <div className="sec-h">💬 句子 <span className="n">{results.sentences.total} 条</span></div>
              {results.sentences.items.map((m) => (
                <MaterialCard key={m.id} m={m} onTrain={(mm) => nav.openTrain(mm.sceneId, 3, mm.id)} />
              ))}
            </div>
          )}

          {results.dict.items.length > 0 && (
            <div className="search-sec">
              <div className="sec-h">📚 词典 <span className="n">{results.dict.total} 个</span></div>
              <div className="card">
                {results.dict.items.map((d) => (
                  <DictRow key={d.w} d={d} />
                ))}
              </div>
            </div>
          )}

          {totalAll(results) === 0 && (
            <div className="empty">
              <div className="ic">🙈</div>
              <div className="t1">没找到「{results.query}」</div>
              <div className="t2">换个说法试试，比如更口语、更短的词</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function totalAll(r: SearchResults): number {
  return r.scenes.total + r.words.total + r.phrases.total + r.sentences.total + r.dict.total
}

export type { Material }
