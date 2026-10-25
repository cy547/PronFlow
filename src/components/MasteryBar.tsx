/** 场景熟练度进度条：掌握 = 该素材最近一次自测"说出来"过（streak ≥ 1） */
import { useMemo } from 'react'
import { useUser } from '../store/UserDataProvider'

export function MasteryBar({ sceneId, total }: { sceneId: string; total: number }) {
  const { data } = useUser()

  const mastered = useMemo(() => {
    let n = 0
    for (const r of Object.values(data.review)) {
      if (!r.sceneId || r.sceneId !== sceneId) continue
      if ((r.streak ?? 0) >= 1) n++
    }
    return n
  }, [data.review, sceneId])

  if (total === 0 || mastered === 0) return null
  const pct = Math.min(100, Math.round((mastered / total) * 100))

  return (
    <div className="mastery">
      <div className="mastery-bar">
        <i style={{ width: `${pct}%` }} />
      </div>
      <span className="mastery-num">{mastered}/{total}</span>
    </div>
  )
}
