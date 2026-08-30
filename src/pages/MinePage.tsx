/** 我的：设置 / 统计 / 数据管理 / 关于 */
import { useEffect, useRef, useState } from 'react'
import { listVoices } from '../services/tts'
import { useUser } from '../store/UserDataProvider'
import { DAILY_REVIEW_CAP } from '../store/UserDataProvider'
import { canInstall, onInstallAvailable, promptInstall } from '../pwa'
import { PrintView } from '../components/PrintView'
import { AccountCard } from '../components/AccountCard'

export function MinePage() {
  const { data, setSettings, exportJSON, importJSON, resetAll } = useUser()
  const fileRef = useRef<HTMLInputElement>(null)
  const voices = listVoices()
  const [installable, setInstallable] = useState(canInstall())
  const [showPdf, setShowPdf] = useState(false)

  useEffect(() => onInstallAvailable(setInstallable), [])

  const doInstall = async () => {
    const r = await promptInstall()
    if (r === 'accepted') setInstallable(false)
  }

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pronflow-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importJSON(String(reader.result))
      alert(ok ? '导入成功' : '文件格式不对，导入失败')
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <div className="nav">
        <div className="title">🙂 我的</div>
      </div>

      <AccountCard />

      <div className="mine-card">
        <div className="stat-grid">
          <div className="st">
            <b>{Object.keys(data.favorites).length}</b>
            <p>收藏</p>
          </div>
          <div className="st">
            <b>{data.stats.tests}</b>
            <p>自测开口</p>
          </div>
          <div className="st">
            <b>{data.stats.reviews}</b>
            <p>复习次数</p>
          </div>
          <div className="st">
            <b>🔥{data.stats.streak}</b>
            <p>连续打卡</p>
          </div>
        </div>
      </div>

      <div className="mine-card">
        <div className="mc-title">发音</div>
        <div className="mine-row" style={{ cursor: 'default' }}>
          <span className="ic">🌎</span>
          <span className="lb">口音</span>
          <div className="radio-pill">
            <button className={data.settings.accent === 'US' ? 'on' : ''} onClick={() => setSettings({ accent: 'US' })}>美音</button>
            <button className={data.settings.accent === 'UK' ? 'on' : ''} onClick={() => setSettings({ accent: 'UK' })}>英音</button>
          </div>
        </div>
        <div className="mine-row" style={{ cursor: 'default' }}>
          <span className="ic">🎙</span>
          <span className="lb">
            音源
            <div className="form-tip">
              {data.settings.voiceSource === 'cloud'
                ? '云端真人声（自然，需联网）'
                : '系统 TTS（离线可用，部分手机偏机械）'}
            </div>
          </span>
          <div className="radio-pill">
            <button
              className={data.settings.voiceSource === 'cloud' ? 'on' : ''}
              onClick={() => setSettings({ voiceSource: 'cloud' })}
            >
              云端人声
            </button>
            <button
              className={data.settings.voiceSource === 'system' ? 'on' : ''}
              onClick={() => setSettings({ voiceSource: 'system' })}
            >
              系统人声
            </button>
          </div>
        </div>
        <div className="mine-row" style={{ cursor: 'default' }}>
          <span className="ic">⏱</span>
          <span className="lb">默认语速</span>
          <div className="radio-pill">
            <button className={data.settings.rate === 'normal' ? 'on' : ''} onClick={() => setSettings({ rate: 'normal' })}>常速</button>
            <button className={data.settings.rate === 'slow' ? 'on' : ''} onClick={() => setSettings({ rate: 'slow' })}>慢速</button>
          </div>
        </div>
        <div className="mine-row" style={{ cursor: 'default' }}>
          <span className="ic">🗣</span>
          <span className="lb">系统 TTS 可用人声</span>
          <span className="val">{voices.length} 个</span>
        </div>
        {voices.length === 0 && (
          <div className="form-tip" style={{ padding: '0 16px 12px' }}>
            用「云端人声」无需任何语音包；系统人声需要 Chrome/Edge 或系统英语语音。
          </div>
        )}
      </div>

      <div className="mine-card">
        <div className="mc-title">数据</div>
        <button className="mine-row" onClick={() => setShowPdf(true)} style={{ width: '100%', textAlign: 'left' }}>
          <span className="ic">📄</span>
          <span className="lb">
            导出全部场景 PDF（卡片版）
            <div className="form-tip">含内置 + 自定义场景全部内容，在打印对话框选「另存为 PDF」</div>
          </span>
          <span className="arrow">→</span>
        </button>
        <button className="mine-row" onClick={doExport} style={{ width: '100%', textAlign: 'left' }}>
          <span className="ic">📤</span>
          <span className="lb">导出备份（收藏 / 自定义 / 复习记录）</span>
          <span className="arrow">→</span>
        </button>
        <button className="mine-row" onClick={() => fileRef.current?.click()} style={{ width: '100%', textAlign: 'left' }}>
          <span className="ic">📥</span>
          <span className="lb">导入备份</span>
          <span className="arrow">→</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) doImport(f)
            e.target.value = ''
          }}
        />
        <button
          className="mine-row"
          style={{ width: '100%', textAlign: 'left', color: 'var(--red)' }}
          onClick={() => {
            if (confirm('清空全部本地数据（收藏、自定义、复习记录、设置）？此操作不可恢复。')) resetAll()
          }}
        >
          <span className="ic">🗑</span>
          <span className="lb">清空本地数据</span>
        </button>
      </div>

      <div className="mine-card">
        <div className="mc-title">应用</div>
        {installable && (
          <button className="mine-row" onClick={doInstall} style={{ width: '100%', textAlign: 'left' }}>
            <span className="ic">📲</span>
            <span className="lb">
              安装到桌面
              <div className="form-tip">像 APP 一样全屏打开，支持离线使用</div>
            </span>
            <span className="arrow">→</span>
          </button>
        )}
        <div className="mine-row" style={{ cursor: 'default' }}>
          <span className="ic">📶</span>
          <span className="lb">
            离线使用
            <div className="form-tip">Android：本页菜单里选「安装应用」或「添加到主屏幕」；iPhone：Safari 分享 → 添加到主屏幕。之后断网也能学（云端发音除外）。</div>
          </span>
        </div>
      </div>

      <div className="mine-card">
        <div className="mc-title">关于</div>
        <div className="mine-row" style={{ cursor: 'default' }}>
          <span className="ic">🎯</span>
          <span className="lb">
            PronFlow v1.0
            <div className="form-tip">专治口语失语：开口卡顿、想说不会说、嘴边没话。<br />所有素材口语优先、实战优先、对话优先；每日复习上限 {DAILY_REVIEW_CAP} 条。</div>
          </span>
        </div>
        <div className="mine-row" style={{ cursor: 'default' }}>
          <span className="ic">🚫</span>
          <span className="lb">无广告 · 无弹窗 · 数据全部存本机</span>
        </div>
      </div>

      {showPdf && <PrintView sceneIds={null} onClose={() => setShowPdf(false)} />}
    </div>
  )
}
