import { useMemo, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { searchAll } from '../../shared/search'
import type { Material } from '../../shared/types'
import { actions, useUserData } from '../../store/useUserData'
import { PlayButton, LevelBadge, Star } from '../../components/ui'
import './index.css'

export default function SearchPage() {
  const data = useUserData()
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [mode, setMode] = useState<'fuzzy' | 'exact'>('fuzzy')

  const results = useMemo(() => {
    if (!submitted) return null
    return searchAll(submitted, mode, {
      customMaterials: data.customMaterials,
      customScenes: data.customScenes,
      dict: null,
    })
  }, [submitted, mode, data.customMaterials, data.customScenes])

  const run = (q: string) => {
    const t = q.trim()
    if (!t) return
    setInput(t)
    setSubmitted(t)
    actions.pushHistory(t)
  }

  const openMat = (m: Material) => {
    // 跳到对应场景页查看
    Taro.navigateTo({ url: `/pages/scene/index?id=${m.sceneId}` })
  }

  return (
    <View className="search-page">
      <View className="sbar card">
        <Input
          value={input}
          onInput={(e) => setInput(e.detail.value)}
          onConfirm={() => run(input)}
          placeholder="输入你心里想说的中文…"
        />
        <Text className="go" onClick={() => run(input)}>找话</Text>
      </View>

      <View className="modes">
        <Text className={`chip${mode === 'fuzzy' ? ' on' : ''}`} onClick={() => setMode('fuzzy')}>模糊搜</Text>
        <Text className={`chip${mode === 'exact' ? ' on' : ''}`} onClick={() => setMode('exact')}>精准搜</Text>
      </View>

      {!submitted && (
        data.history.length > 0 ? (
          <View className="hist">
            <View className="hist-h">
              <Text className="sub">最近搜过</Text>
              <Text className="clr" onClick={() => actions.clearHistory()}>清空</Text>
            </View>
            <View className="chips">
              {data.history.map((h) => (
                <Text key={h} className="chip" onClick={() => run(h)}>{h}</Text>
              ))}
            </View>
          </View>
        ) : (
          <View className="empty">
            <Text className="ic">💬</Text>
            <Text className="t1">想说不会说？</Text>
            <Text className="t2">把你心里那句中文打进来，{"\n"}我给你地道原生英文说法。{"\n"}比如：「AA制」「我不吃辣」「改天再约」</Text>
          </View>
        )
      )}

      {results && (
        <View className="fade-in">
          {results.scenes.items.length > 0 && (
            <Text className="sec-h">🗺️ 场景 {results.scenes.total} 个</Text>
          )}
          {results.scenes.items.map((s) => (
            <View key={s.id} className="srow card" onClick={() => Taro.navigateTo({ url: `/pages/scene/index?id=${s.id}` })}>
              <Text style={{ fontSize: 20 }}>{s.icon}</Text>
              <Text className="srow-t">{s.name} <Text className="sub fs12">{s.nameEn}</Text></Text>
            </View>
          ))}

          {(['words', 'phrases', 'sentences'] as const).map((key) => {
            const grp = results![key]
            const label = key === 'words' ? '🔤 单词' : key === 'phrases' ? '🧷 短语' : '💬 句子'
            if (!grp.items.length) return null
            return (
              <View key={key}>
                <Text className="sec-h">{label} {grp.total} 条</Text>
                {grp.items.map((m: Material) => {
                  const fav = !!data.favorites[`${m.type}:${m.id}`]
                  return (
                    <View className="mat card" key={m.id} onClick={() => openMat(m)}>
                      <View className="mat-head">
                        <View className="mat-main">
                          <Text className="p-en">{m.en}</Text>
                          <Text className="p-zh">{m.zh}</Text>
                          <View className="p-flags"><LevelBadge lv={m.spokenLevel} /></View>
                        </View>
                        <View className="mat-acts" onClick={(e) => e.stopPropagation()}>
                          <PlayButton text={m.en} size={36} />
                          <View className="mini-row">
                            <Star on={fav} onTap={() => actions.toggleFav({ kind: m.type, id: m.id, en: m.en, zh: m.zh, sceneId: m.sceneId })} />
                          </View>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )
          })}

          {results.scenes.total + results.words.total + results.phrases.total + results.sentences.total === 0 && (
            <View className="empty">
              <Text className="ic">🙈</Text>
              <Text className="t1">没找到「{results.query}」</Text>
              <Text className="t2">换个说法试试，比如更口语、更短的词</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
