import type { ReactNode } from 'react'

/** 底部弹层 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-title">
          {title}
          <button className="x" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
