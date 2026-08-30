import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { builtinMaterials, BUNDLES } from '../../shared/scenes'
import { actions, useUserData } from '../../store/useUserData'
import { PlayButton, LevelBadge, Star, IconView } from '../../components/ui'
import { play } from '../../services/audio'
import { exportSceneLongImage } from '../../utils/longimage'
import './index.css'

export default function ScenePage() {
  const router = useRouter()
  const sceneId = router.params.id || ''
  const data = useUserData()
  const [tab, setTab] = useState<'word' | 'phrase' | 'sentence'>('word')
  const [expanded, setExpanded] = useState<string | null>(null)

  const scene = data.customScenes.find((s) => s.id === sceneId) || BUNDLES.find((b) => b.scene.id === sceneId)?.scene
  const all = [
    ...data.customMaterials.filter((m) => m.sceneId === sceneId),
    ...builtinMaterials(sceneId),
  ]
  const filtered = all.filter((m) => m.type === tab)
  const counts = { word: 0, phrase: 0, sentence: 0 }
  for (const m of all) counts[m.type]++

  if (!scene) return <View className="empty"><Text>场景不存在</Text></View>

  const saveLongImage = async () => {
    const r = await exportSceneLongImage(scene, all)
    Taro.showToast({ title: r.ok ? '已保存到相册' : r.error ?? '生成失败', icon: r.ok ? 'success' : 'none' })
  }

  const countsOf = (t: 'word' | 'phrase' | 'sentence') => all.filter((m) => m.type === t).length

  const toggleFav = (m: (typeof all)[number]) => {
    actions.toggleFav({ kind: m.type, id: m.id, en: m.en, zh: m.zh, sceneId: m.sceneId })
  }

  return (
    <View className="scene-page">
      {/* 训练入口 */}
      <View className="train-entry" onClick={() => Taro.navigateTo({ url: `/pages/train/index?id=${sceneId}` })}>
        <Text className="t-ic">🎯</Text>
        <View className="t-main">
          <Text className="t-t">口语训练</Text>
          <Text className="t-d">中文遮屏自测 · 慢速跟读 · 句式仿写</Text>
        </View>
        <Text className="t-go">→</Text>
      </View>

      {/* 类型切换 */}
      <View className="tabseg">
        {(['word', 'phrase', 'sentence'] as const).map((t) => (
          <View key={t} className={`tabseg-item${tab === t ? ' on' : ''}`} onClick={() => setTab(t)}>
            <Text>{t === 'word' ? '🔤 单词' : t === 'phrase' ? '🧷 短语' : '💬 句子'} {countsOf(t)}</Text>
          </View>
        ))}
      </View>

      {/* 素材列表 */}
      {filtered.length === 0 ? (
        <View className="empty">
          <Text className="t1">还没有相关内容</Text>
          <Text className="t2">点下方「＋ 添加」补充你自己的表达</Text>
        </View>
      ) : (
        filtered.map((m) => {
          const open = expanded === m.id
          const fav = !!data.favorites[`${m.type}:${m.id}`]
          return (
            <View className="mat card" key={m.id}>
              <View className="mat-head" onClick={() => setExpanded(open ? null : m.id)}>
                <View className="mat-main">
                  <Text className="p-en">{m.en}</Text>
                  {(m.type === 'word' || m.type === 'phrase') && (m.ipaUS || m.ipaUK) && (
                    <View className="p-ipa">
                      {m.ipaUS && <Text className="us">美 {m.ipaUS}</Text>}
                      {m.ipaUK && <Text className="uk">英 {m.ipaUK}</Text>}
                      {m.type === 'word' && m.pos && <Text>{m.pos}</Text>}
                    </View>
                  )}
                  <Text className="p-zh">{m.zh}</Text>
                  <View className="p-flags">
                    <LevelBadge lv={m.spokenLevel} />
                    {m.custom && <Text className="tag">自定义</Text>}
                  </View>
                </View>
                <View className="mat-acts">
                  <PlayButton text={m.en} />
                  <View className="mini-row">
                    <Star on={fav} onTap={() => toggleFav(m)} />
                  </View>
                </View>
              </View>

              {open && (
                <View className="mat-detail">
                  {m.note && <Text className="p-note">💡 {m.note}</Text>}
                  {m.examples.map((ex, i) => (
                    <View className="p-ex" key={i} onClick={() => play(ex.en, { rate: 0.9 })}>
                      <Text className="e">— {ex.en}</Text>
                      <Text className="z">{ex.zh}</Text>
                    </View>
                  ))}
                  {m.variants.map((v, i) => (
                    <View className="p-var" key={i} onClick={() => play(v.en, { rate: 0.9 })}>
                      <Text className="ver">{v.level}</Text>
                      <Text className="ven">{v.en}</Text>
                      <Text className="vzh">{v.zh}</Text>
                    </View>
                  ))}
                  {m.type === 'sentence' && m.breakdown.map((b, i) => (
                    <View className="p-brk" key={i} onClick={() => play(b.en, { rate: 0.6 })}>
                      <Text className="idx">{i + 1}</Text>
                      <Text className="e">{b.en}</Text>
                      <Text className="z">{b.zh}</Text>
                    </View>
                  ))}
                  {m.type === 'sentence' && m.linking && (
                    <View className="p-link">
                      <Text className="d-label">🔊 连读弱读标注（‿连读 *弱读 (吞音)）</Text>
                      <Text className="lk">{m.linking}</Text>
                    </View>
                  )}
                  {m.custom && (
                    <View className="p-acts">
                      <Text
                        className="act"
                        onClick={() => Taro.navigateTo({ url: `/pages/form/index?sceneId=${sceneId}&id=${m.id}` })}
                      >
                        ✏️ 编辑
                      </Text>
                      <Text
                        className="act del"
                        onClick={() => {
                          Taro.showModal({
                            title: '删除',
                            content: `删除「${m.en}」？`,
                            success: (r) => r.confirm && actions.deleteCustomMaterial(m.id),
                          })
                        }}
                      >
                        🗑 删除
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )
        })
      )}

      {/* 快捷添加 */}
      <View className="quick-add">
        <Text className="qa-label">{scene.custom ? '快捷添加：' : '补充到这个场景：'}</Text>
        {(['word', 'phrase', 'sentence'] as const).map((t) => (
          <Text key={t} className="qa-btn" onClick={() => Taro.navigateTo({ url: `/pages/form/index?sceneId=${sceneId}&type=${t}` })}>
            ＋ {t === 'word' ? '单词' : t === 'phrase' ? '短语' : '句子'}
          </Text>
        ))}
      </View>

      {/* 长图导出 */}
      <View className="btn-main ghost" onClick={() => void saveLongImage()}>
        <Text>📷 保存卡片长图到相册</Text>
      </View>
    </View>
  )
}
