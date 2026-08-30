/** 连读标注渲染：‿ 连接符、*弱读、(吞音) */
import React from 'react'

const RE = /(‿|\*[\w']+|\([^)]*\))/g

export function LinkingText({ text }: { text: string }) {
  const parts = text.split(RE)
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null
        if (p === '‿') return <span key={i} className="lk">‿</span>
        if (p.startsWith('*')) return <span key={i} className="wk">{p.slice(1)}</span>
        if (p.startsWith('(')) return <span key={i} className="sw">{p}</span>
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

export function LinkingLegend() {
  return (
    <div className="legend">
      <span><span className="lk">‿</span> 连读</span>
      <span><span className="wk">小字</span> 弱读</span>
      <span><span className="sw">(吞音)</span> 省略的音</span>
    </div>
  )
}
