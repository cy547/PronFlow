import { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useReachBottom } from '@tarojs/taro'
import { actions, useUserData } from '../../store/useUserData'
import { PlayButton } from '../../components/ui'
import { API_BASE } from '../../services/sync'
import './index.css'

interface DItem {
  w: string
  us?: string
  uk?: string
  pos?: string
  zh: string
  freq?: number
}

export default function DictPage() {
  const data = useUserData()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<DItem[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async (query: string, off: number, append: boolean) => {
    setLoading(true)
    try {
      const res = await Taro.request({
        url: `${API_BASE}/dict?q=${encodeURIComponent(query)}&limit=30&offset=${off}`,
        method: 'GET',
      })
      const itemsNew: DItem[] = res.data?.items ?? []
      setTotal(res.data?.total ?? 0)
      setItems((prev) => (append ? [...prev, ...itemsNew] : itemsNew))
      setOffset(off + itemsNew.length)
    } catch {
      Taro.showToast({ title: '词库加载失败，请检查网络', icon: 'none' })
    }
    setLoading(false)
  }

  const run = (query: string) => {
    setQ(query)
    void load(query, 0, false)
  }

  useReachBottom(() => {
    if (total != null && items.length < total && !loading) void load(q, offset, true)
  })

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
        <Text className="sub fs12">{total != null ? `共 ${total} 个结果` : '输入单词或中文意思查询 · 支持双语'} </Text>
      </View>

      {items.length === 0 && !loading && (
        <View className="empty">
          <Text className="ic">📚</Text>
          <Text className="t1">云端词典</Text>
          <Text className="t2">输入查询后，点词条展开音标、释义{"\n"}点 ▶ 发音 · 点 ☆ 收藏进复习</Text>
        </View>
      )}

      {items.map((d) => {
        const fav = favOf(d.w)
        const open = expanded === d.w
        return (
          <View className="drow card" key={d.w}>
            <View className="drow-main" onClick={() => setExpanded(open ? null : d.w)}>
              <Text className="d-w">{d.w}</Text>
              <Text className="d-ipa">{d.us || d.uk} {d.pos}</Text>
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
                {d.us && <Text className="tag" onClick={() => void 0}>美 {d.us}</Text>}
                {d.uk && <Text className="tag">英 {d.uk}</Text>}
                <Text className="full">{d.zh}</Text>
              </View>
            )}
          </View>
        )
      })}

      {loading && <Text className="loading">加载中…</Text>}
      {total != null && items.length < total && !loading && (
        <View className="more" onClick={() => void load(q, offset, true)}><Text>加载更多</Text></View>
      )}
    </View>
  )
}
