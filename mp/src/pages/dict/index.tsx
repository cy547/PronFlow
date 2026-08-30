import { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import { useReachBottom } from '@tarojs/taro'
import { DICT } from '../../data/dictData'
import { actions, useUserData } from '../../store/useUserData'
import { PlayButton } from '../../components/ui'
import { play } from '../../services/audio'
import './index.css'

interface DItem {
  w: string
  us: string
  uk: string
  pos: string
  zh: string
  freq: number
}

const PAGE = 30

/** 本地离线检索：中文→释义包含，英文→全等/前缀/释义包含 */
function search(q: string, offset: number): { items: DItem[]; total: number } {
  const query = q.trim().toLowerCase()
  const hasZh = /[\u4e00-\u9fff]/.test(query)
  let matched: DItem[] = []
  if (!query) {
    matched = DICT.slice()
  } else {
    for (const it of DICT) {
      const w = it.w.toLowerCase()
      let hit = false
      if (hasZh) hit = it.zh.includes(query)
      else if (w === query || w.startsWith(query)) hit = true
      else if (query.length >= 3 && it.zh.toLowerCase().includes(query)) hit = true
      if (hit) matched.push(it)
    }
  }
  return { items: matched.slice(offset, offset + PAGE), total: matched.length }
}

export default function DictPage() {
  const data = useUserData()
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<DItem[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [offset, setOffset] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

  const run = (text: string) => {
    setQuery(text)
    const r = search(text, 0)
    setItems(r.items)
    setTotal(r.total)
    setOffset(PAGE)
  }

  useReachBottom(() => {
    if (total != null && items.length < total) {
      const r = search(query, offset)
      setItems((prev) => [...prev, ...r.items])
      setTotal(r.total)
      setOffset(offset + PAGE)
    }
  })

  const loadMore = () => {
    const r = search(query, offset)
    setItems((prev) => [...prev, ...r.items])
    setTotal(r.total)
    setOffset(offset + PAGE)
  }

  const favOf = (w: string) => !!data.favorites[`dict:${w}`]

  return (
    <View className="dict-page">
      <View className="sbar card">
        <Input
          value={q}
          onInput={(e) => setQ(e.detail.value)}
          onConfirm={() => run(q)}
          placeholder="查单词 / 输入中文意思"
        />
        <Text className="go" onClick={() => run(q)}>查询</Text>
      </View>

      <View className="dmeta">
        <Text className="sub fs12">
          {total != null ? `共 ${total} 个结果` : '内置离线词典 · 输入单词或中文查询'} ｜ 点 ▶ 发音 · ☆ 收藏
        </Text>
      </View>

      {items.length === 0 && (
        <View className="empty">
          <Text className="ic">📚</Text>
          <Text className="t1">{query ? '没找到相关词条' : '内置离线词典'}</Text>
          <Text className="t2">{query ? '换个关键词试试' : '8000 高频词离线可查 · 点词条展开详情'}</Text>
        </View>
      )}

      {items.map((d) => {
        const fav = favOf(d.w)
        const open = expanded === d.w
        return (
          <View className="drow card" key={d.w}>
            <View className="drow-main" onClick={() => setExpanded(open ? null : d.w)}>
              <Text className="d-w">
                {d.w}
                {d.freq >= 4 && <Text className="hot"> 热</Text>}
              </Text>
              <Text className="d-ipa">{(d.us || d.uk) ? `${d.us || d.uk}  ` : ''}{d.pos}</Text>
              <Text className="d-zh">{d.zh}</Text>
            </View>
            <View className="drow-acts">
              <PlayButton text={d.w} size={34} />
              <View
                className={`mini${fav ? ' star-on' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  actions.toggleFav({ kind: 'dict', id: d.w, en: d.w, zh: d.zh })
                }}
              >
                <Text>{fav ? '★' : '☆'}</Text>
              </View>
            </View>
            {open && (
              <View className="ddetail">
                {d.us && <Text className="tag">美 {d.us}</Text>}
                {d.uk && <Text className="tag">英 {d.uk}</Text>}
                {d.freq > 0 && <Text className="tag">词频 {'★'.repeat(d.freq)}</Text>}
                <Text className="full">{d.zh}</Text>
                <Text className="tag tip2">离线词典 · 收藏后可进复习</Text>
              </View>
            )}
          </View>
        )
      })}

      {total != null && items.length < total && (
        <View className="more" onClick={loadMore}><Text>加载更多（还剩 {total - items.length}）</Text></View>
      )}
    </View>
  )
}
