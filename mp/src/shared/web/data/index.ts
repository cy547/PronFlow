import type { Material, Scene } from '../types'
import { foodScene } from './scenes/food'
import { smalltalkScene } from './scenes/smalltalk'
import { subwayScene } from './scenes/subway'
import { taxiScene } from './scenes/taxi'
import { airportScene } from './scenes/airport'
import { hotelScene } from './scenes/hotel'
import { homeScene } from './scenes/home'
import { schoolScene } from './scenes/school'
import { shoppingScene } from './scenes/shopping'
import { hospitalScene } from './scenes/hospital'
import { emotionsScene } from './scenes/emotions'
import { helpScene } from './scenes/help'
import { refuseScene } from './scenes/refuse'
import { praiseScene } from './scenes/praise'
import { workScene } from './scenes/work'
import { deliveryScene } from './scenes/delivery'
import { phoneScene } from './scenes/phone'
import { weatherScene } from './scenes/weather'
import { fitnessScene } from './scenes/fitness'
import { housingScene } from './scenes/housing'

export interface SceneBundle {
  scene: Scene
  materials: Material[]
}

export const BUNDLES: SceneBundle[] = [
  foodScene,
  smalltalkScene,
  subwayScene,
  taxiScene,
  airportScene,
  hotelScene,
  homeScene,
  schoolScene,
  shoppingScene,
  hospitalScene,
  emotionsScene,
  helpScene,
  refuseScene,
  praiseScene,
  workScene,
  deliveryScene,
  phoneScene,
  weatherScene,
  fitnessScene,
  housingScene,
]

export const BUILTIN_SCENES: Scene[] = BUNDLES.map((b) => b.scene)

/** 场景固定展示顺序（新场景加入 BUNDLES 即可） */
export function builtinMaterials(sceneId: string): Material[] {
  return BUNDLES.find((b) => b.scene.id === sceneId)?.materials ?? []
}

/** 全部内置素材（搜索用） */
export function allBuiltinMaterials(): Material[] {
  return BUNDLES.flatMap((b) => b.materials)
}

export function findBuiltinMaterial(id: string): Material | undefined {
  for (const b of BUNDLES) {
    const m = b.materials.find((x) => x.id === id)
    if (m) return m
  }
  return undefined
}

/** 场景统计文案：词 x · 短语 y · 句 z */
export function sceneCounts(sceneId: string, customMaterials: Material[]): { word: number; phrase: number; sentence: number } {
  const counts = { word: 0, phrase: 0, sentence: 0 }
  for (const m of builtinMaterials(sceneId)) counts[m.type]++
  for (const m of customMaterials) if (m.sceneId === sceneId) counts[m.type]++
  return counts
}
