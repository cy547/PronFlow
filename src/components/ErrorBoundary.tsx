/** 顶层错误边界：任何渲染错误不再白屏，显示友好提示 + 重载 */
import React from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PronFlow] 渲染错误:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '80px 30px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: 44 }}>😵</div>
          <h2 style={{ margin: '14px 0 6px' }}>页面出了点问题</h2>
          <p style={{ color: '#7a828a', fontSize: 13, lineHeight: 1.7 }}>
            你的学习数据都安全地存在本机。
            <br />
            点击下方按钮重新加载即可继续。
          </p>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
            style={{
              marginTop: 18,
              height: 42,
              padding: '0 26px',
              borderRadius: 21,
              background: '#12b886',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            重新加载
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
