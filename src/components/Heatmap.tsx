/** 学习热力图：近 90 天每日开口次数格子图 */
import { useMemo } from 'react'
import { addDays, todayStr } from '../types'

export function Heatmap({ daily }: { daily: Record<string, number> }) {
  const cells = useMemo(() => {
    const today = todayStr()
    const out: { date: string; count: number }[] = []
    for (let i = 89; i >= 0; i--) {
      const date = addDays(-i)
      out.push({ date, count: daily[date] ?? 0 })
    }
    return out
  }, [daily])

  const level = (n: number): string => (n === 0 ? '' : n <= 2 ? 'l1' : n <= 5 ? 'l2' : n <= 10 ? 'l3' : 'l4')
  const activeDays = cells.filter((c) => c.count > 0).length

  // 每周分行（90 天 ≈ 13 行 × 7）
  const rows: (typeof cells)[] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))

  return (
    <div className="heat">
      <div className="heat-head">
        <span>近 90 天开口记录</span>
        <span className="heat-active">{activeDays} 天开口</span>
      </div>
      <div className="heat-grid">
        {rows.map((row, ri) => (
          <div className="heat-row" key={ri}>
            {row.map((c) => (
              <div
                key={c.date}
                className={`heat-cell ${level(c.count)}`}
                title={`${c.date}：开口 ${c.count} 次`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-legend">
        少
        <span className="heat-cell l1" />
        <span className="heat-cell l2" />
        <span className="heat-cell l3" />
        <span className="heat-cell l4" />
        多
      </div>
    </div>
  )
}
