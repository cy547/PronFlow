import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { BUNDLES } from '../../shared/scenes'
import { actions, useUserData, getUserData } from '../../store/useUserData'
import { IconView } from '../../components/ui'
import '../home/index.css'

export default function Home() {
  const data = useUserData()
  const [, force] = useState(0)

  const allScenes = [...data.customScenes, ...BUNDLES.map((b) => b.scene)]
  const pinnedScenes = data.pinned.map((id) => allScenes.find((s) => s.id === id)).filter(Boolean)
  const countsOf = (sceneId: string) => {
    const b = BUNDLES.find((x) => x.scene.id === sceneId)
    const c = { word: 0, phrase: 0, sentence: 0 }
    if (b) for (const m of b.materials) c[m.type]++
    for (const m of data.customMaterials) if (m.sceneId === sceneId) c[m.type]++
    return c
  }

  const open = (id: string) => Taro.navigateTo({ url: `/pages/scene/index?id=${id}` })

  const menu = (sceneId: string, isCustom: boolean) => {
    const name = allScenes.find((s) => s.id === sceneId)?.name ?? ''
    const pinned = data.pinned.includes(sceneId)
    const items = [pinned ? '取消置顶' : '置顶场景']
    if (isCustom) items.push('重命名 / 编辑', '删除场景')
    Taro.showActionSheet({
      itemList: items,
      success: (r) => {
        const choice = items[r.tapIndex]
        if (choice.includes('置顶')) actions.togglePin(sceneId)
        else if (choice.startsWith('重命名')) Taro.navigateTo({ url: `/pages/scene-form/index?id=${sceneId}` })
        else if (choice.startsWith('删除')) {
          Taro.showModal({
            title: '删除场景',
            content: `删除「${name}」及其全部内容？`,
            success: (m) => {
              if (m.confirm) {
                actions.deleteCustomScene(sceneId)
                force((n) => n + 1)
              }
            },
          })
        }
      },
      fail: () => {
        /* 用户取消菜单，忽略 */
      },
    })
  }

  const sceneCard = (s: { id: string; icon: string; name: string; nameEn: string; custom?: boolean }) => {
    const c = countsOf(s.id)
    return (
      <View className="scard" key={s.id} onClick={() => open(s.id)}>
        <View className="row">
          <IconView icon={s.icon} size={25} />
          {data.pinned.includes(s.id) && <Text className="pin">📌</Text>}
        </View>
        <Text className="name">{s.name}</Text>
        <Text className="meta">词 {c.word} · 短语 {c.phrase} · 句 {c.sentence}</Text>
        <View className="scard-menu" onClick={(e) => { e.stopPropagation(); menu(s.id, !!s.custom) }}>
          <Text>⋯</Text>
        </View>
      </View>
    )
  }

  const total = getUserData()

  return (
    <View className="home">
      <View className="head">
        <Text className="title">PronFlow</Text>
        <Text className="slogan">专治口语失语：心里有中文，开口就是英文。</Text>
      </View>

      <View className="home-search" onClick={() => Taro.switchTab({ url: '/pages/search/index' })}>
        <Text>🔍 输入你心里想说的中文，帮你找到那句英文…</Text>
      </View>

      {pinnedScenes.length > 0 && (
        <View>
          <Text className="sec">📌 置顶场景</Text>
          <View className="grid">{pinnedScenes.map((s) => sceneCard(s!))}</View>
        </View>
      )}

      <Text className="sec">全部场景</Text>
      <View className="grid">
        {BUNDLES.map((b) => sceneCard(b.scene))}
        <View className="scard add" onClick={() => Taro.navigateTo({ url: '/pages/scene-form/index' })}>
          <Text className="plus">＋</Text>
          <Text className="add-t">新建自定义场景</Text>
        </View>
      </View>

      {data.customScenes.length > 0 && (
        <View>
          <Text className="sec">✍️ 我的自定义场景</Text>
          <View className="grid">{data.customScenes.map((s) => sceneCard(s))}</View>
        </View>
      )}

      <View className="foot">
        <Text className="fs12 sub">共 {total.customScenes.length + BUNDLES.length} 个场景 · 数据存本机</Text>
      </View>
    </View>
  )
}
