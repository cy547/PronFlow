/** 全局确认弹窗（替换原生 confirm/alert，风格与 APP 一致） */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmState {
  title: string
  content?: string
  danger?: boolean
  resolve: (ok: boolean) => void
}

let setInstance: ((s: ConfirmState | null) => void) | null = null

/** 组件树里渲染一次 */
export function ConfirmHost() {
  const [state, setState] = useState<ConfirmState | null>(null)
  useEffect(() => {
    setInstance = setState
    return () => {
      setInstance = null
    }
  }, [])

  if (!state) return null
  const close = (ok: boolean) => {
    state.resolve(ok)
    setState(null)
  }

  return createPortal(
    <div className="mask" onClick={() => close(false)}>
      <div className="cconfirm card" onClick={(e) => e.stopPropagation()}>
        <div className="cc-title">{state.title}</div>
        {state.content && <div className="cc-content">{state.content}</div>}
        <div className="cc-btns">
          <button className="btn-main ghost" onClick={() => close(false)}>取消</button>
          <button
            className="btn-main"
            style={state.danger ? { background: 'var(--red)' } : undefined}
            onClick={() => close(true)}
          >
            确定
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Promise 风格确认框：const ok = await confirmEx({title, content, danger}) */
export function confirmEx(opts: { title: string; content?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    if (!setInstance) {
      // 极端情况兜底
      resolve(window.confirm(opts.title))
      return
    }
    setInstance({ ...opts, resolve })
  })
}
