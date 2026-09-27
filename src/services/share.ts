/** 场景包分享：把自定义场景（含素材）编码成可复制的分享码，粘贴即可导入 */
import type { Material, Scene } from '../types'

interface ScenePack {
  v: 1
  scene: Scene
  materials: Material[]
}

/** 导出分享码（base64url） */
export function encodeScenePack(scene: Scene, materials: Material[]): string {
  const pack: ScenePack = { v: 1, scene, materials }
  const json = JSON.stringify(pack)
  const b64 = btoa(unescape(encodeURIComponent(json)))
  return ('PF1-' + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')).replace(/(.{60})/g, '$1\n')
}

/** 解析分享码；格式错误返回 null */
export function decodeScenePack(code: string): ScenePack | null {
  try {
    const clean = code.replace(/^PF1-/, '').replace(/\s+/g, '')
    const b64 = clean.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(b64)))
    const pack = JSON.parse(json) as ScenePack
    if (pack.v !== 1 || !pack.scene?.id || !Array.isArray(pack.materials)) return null
    return pack
  } catch {
    return null
  }
}

/** 导入场景包：生成新 id 避免与现有冲突，返回插入所需的场景与素材 */
export function importScenePack(
  pack: ScenePack,
  existingSceneIds: Set<string>,
): { scene: Scene; materials: Material[] } {
  const idMap = new Map<string, string>()
  const newSceneId = existingSceneIds.has(pack.scene.id) ? `cs-${Date.now()}` : pack.scene.id
  idMap.set(pack.scene.id, newSceneId)
  for (const m of pack.materials) idMap.set(m.id, `im-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)

  const scene: Scene = { ...pack.scene, id: newSceneId, custom: true }
  const materials: Material[] = pack.materials.map((m) => ({
    ...m,
    id: idMap.get(m.id)!,
    sceneId: newSceneId,
    custom: true,
  }))
  return { scene, materials }
}
