import { useState } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { actions, useUserData } from '../../store/useUserData'
import './index.css'

const ICONS = ['📌', '🎯', '🏠', '💼', '🎓', '✈️', '🚇', '🛒', '🏥', '🎬', '⚽', '🐱', '🍕', '🎵', '💡', '🗣️']

/** 选图 → 居中裁剪压缩成 96×96 PNG dataURL（存本机不爆容量） */
async function pickIcon(): Promise<string | null> {
  const choose = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
  const filePath = choose.tempFilePaths[0]
  if (!filePath) return null
  const canvas = Taro.createOffscreenCanvas({ type: '2d', width: 96, height: 96 })
  const ctx = canvas.getContext('2d') as any
  const img = canvas.createImage()
  return await new Promise<string | null>((resolve) => {
    img.onload = async () => {
      try {
        const s = Math.min(img.width, img.height)
        ctx.clearRect(0, 0, 96, 96)
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96)
        const tmp = (await Taro.canvasToTempFilePath({ canvas } as any)) as { tempFilePath: string }
        const b64 = Taro.getFileSystemManager().readFileSync(tmp.tempFilePath, 'base64')
        resolve(`data:image/png;base64,${b64}`)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = filePath
  })
}

export default function SceneFormPage() {
  const router = useRouter()
  const editId = router.params.id
  const data = useUserData()
  const editing = editId ? data.customScenes.find((s) => s.id === editId) : undefined

  const [name, setName] = useState(editing?.name ?? '')
  const [nameEn, setNameEn] = useState(editing?.nameEn ?? '')
  const [icon, setIcon] = useState(editing?.icon ?? '📌')
  const [desc, setDesc] = useState(editing?.desc ?? '')

  const chooseIcon = async () => {
    const dataUrl = await pickIcon()
    if (dataUrl) setIcon(dataUrl)
    else Taro.showToast({ title: '图片读取失败，换一张试试', icon: 'none' })
  }

  const save = () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请填写场景名', icon: 'none' })
      return
    }
    if (editing) actions.updateCustomScene(editing.id, { name: name.trim(), nameEn: nameEn.trim(), icon, desc: desc.trim() })
    else actions.addCustomScene({ id: `cs-${Date.now()}`, name: name.trim(), nameEn: nameEn.trim() || 'My Scene', icon, desc: desc.trim() })
    Taro.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 600)
  }

  const isImage = icon.startsWith('data:')

  return (
    <View className="sform-page">
      <View className="fi">
        <Text className="fl">场景名（中文）*</Text>
        <Input value={name} onInput={(e) => setName(e.detail.value)} placeholder="比如：健身、面试、养宠物" />
      </View>
      <View className="fi">
        <Text className="fl">英文名</Text>
        <Input value={nameEn} onInput={(e) => setNameEn(e.detail.value)} placeholder="Fitness / Interview / Pets" />
      </View>
      <View className="fi">
        <Text className="fl">图标（选 emoji 或上传图片）</Text>
        <View className="icons">
          {isImage && (
            <View className="ic-img-wrap">
              <Image src={icon} mode="aspectFill" style={{ width: '38px', height: '38px', borderRadius: '10px' }} />
              <Text className="ic-remove" onClick={() => setIcon('📌')}>移除</Text>
            </View>
          )}
          {!isImage &&
            ICONS.map((ic) => (
              <Text key={ic} className={`ic-item${icon === ic ? ' on' : ''}`} onClick={() => setIcon(ic)}>
                {ic}
              </Text>
            ))}
          <Text className="ic-upload" onClick={() => void chooseIcon()}>🖼 上传图标</Text>
        </View>
        <Text className="ftip">上传的图会自动裁成正方形并压缩到 96×96，只存本机</Text>
      </View>
      <View className="fi">
        <Text className="fl">场景说明</Text>
        <Input value={desc} onInput={(e) => setDesc(e.detail.value)} placeholder="一句话描述这个场景" />
      </View>
      <Button className="save-btn" onClick={save}>保存</Button>
      <Text className="ftip center">保存后可在此场景里添加单词 / 短语 / 句子</Text>
    </View>
  )
}
