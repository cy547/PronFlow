/** 词库页：分级筛选 + 查词 + 字母浏览 + 发音 + 收藏 */
import { useEffect, useMemo, useState } from 'react'
import { DICT_FILTERS, filterDict, loadDict, type DictSource } from '../services/dict'
import { DictRow } from '../components/DictRow'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function DictPage() {
  const [words, setWords] = useState<import('../types').DictWord[] | null>(null)
  const [source, setSource] = useState<DictSource>('ecdict')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState<string | null>(null)
  const [shown, setShown] = useState(80)

  useEffect(() => {
    void loadDict().then((r) => {
      setWords(r.words)
      setSource(r.source)
    })
  }, [])

  const filtered = useMemo(
    () => (words ? filterDict(words, filter, query, letter) : []),
    [words, filter, query, letter],
  )

  const availableLetters = useMemo(() => {
    if (!words) return new Set<string>()
    const s = new Set<string>()
    if (filter === 'all' && !query) {
      for (const w of words) s.add(w.w[0]?.toUpperCase() ?? '')
    } else {
      for (const w of words) if (filterDict([w], filter, query, null).length) s.add(w.w[0]?.toUpperCase() ?? '')
    }
    return s
  }, [words, filter, query])

  if (!words) {
    return (
      <div className="page">
        <div className="nav"><div className="title">📚 词库</div></div>
        <div className="empty">
          <div className="ic">📚</div>
          <div className="t1">词库加载中…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="nav">
        <div className="title">📚 词库</div>
      </div>

      <div className="search-bar" style={{ marginTop: 0 }}>
        <span>🔍</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShown(80)
          }}
          placeholder="查单词 / 输入中文意思"
        />
        {query && (
          <button className="clr" onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 16px 4px', scrollbarWidth: 'none' }}>
        {DICT_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip${filter === f.key ? ' on' : ''}`}
            onClick={() => {
              setFilter(f.key)
              setShown(80)
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="letter-nav">
        <button
          className={letter === null ? 'on' : ''}
          style={letter === null ? { background: 'var(--ink)', color: '#fff' } : {}}
          onClick={() => setLetter(null)}
        >
          全
        </button>
        {LETTERS.map((L) => (
          <button
            key={L}
            disabled={!availableLetters.has(L)}
            style={letter === L ? { background: 'var(--ink)', color: '#fff' } : {}}
            onClick={() => {
              setLetter(letter === L ? null : L)
              setShown(80)
            }}
          >
            {L}
          </button>
        ))}
      </div>

      <div className="dict-meta">
        <span>
          {source === 'ecdict' ? '开源词库' : '精编词库'} · {filtered.length} 个词条
        </span>
        <span>点词条展开音标、例句、口语用法</span>
      </div>

      <div className="card" style={{ margin: '0 16px' }}>
        {filtered.length === 0 ? (
          <div className="empty" style={{ padding: '40px 20px' }}>
            <div className="ic">🔍</div>
            <div className="t1">没找到「{query || letter}」</div>
            <div className="t2">试试其他关键词，或到搜索页全局搜</div>
          </div>
        ) : (
          filtered.slice(0, shown).map((d) => <DictRow key={d.w} d={d} />)
        )}
      </div>

      {filtered.length > shown && (
        <button className="load-more" onClick={() => setShown((s) => s + 120)}>
          再看 120 个（还剩 {filtered.length - shown}）
        </button>
      )}
    </div>
  )
}
