/** 账号卡片：登录 / 注册 / 云端同步状态 */
import { useState } from 'react'
import { useUser } from '../store/UserDataProvider'
import { useSyncAccount } from '../services/sync'

function fmtTime(at: number): string {
  const d = new Date(at)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

export function AccountCard() {
  const { data, replaceData } = useUser()
  const { auth, busy, status, doAuth, logout, syncNow } = useSyncAccount(replaceData, () => data)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    const r = await doAuth(mode, username.trim(), password)
    if (!r.ok) setErr(r.error ?? '操作失败')
    else {
      setPassword('')
      if (mode === 'register') setMode('login')
    }
  }

  return (
    <div className="mine-card">
      <div className="mc-title">账号 · 云端同步</div>

      {!auth ? (
        <>
          <div className="auth-form">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名（3~20 位字母/数字/下划线）"
              autoComplete="username"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="密码（至少 6 位）"
              type="password"
              autoComplete="current-password"
            />
            {err && <div className="form-tip" style={{ color: 'var(--red)' }}>{err}</div>}
            <div className="radio-pill" style={{ width: '100%' }}>
              <button className={mode === 'login' ? 'on' : ''} style={{ flex: 1 }} disabled={!!busy} onClick={() => setMode('login')}>
                登录
              </button>
              <button className={mode === 'register' ? 'on' : ''} style={{ flex: 1 }} disabled={!!busy} onClick={() => setMode('register')}>
                注册新账号
              </button>
            </div>
            <button className="btn-main" style={{ height: 40 }} disabled={!!busy || !username.trim() || !password} onClick={submit}>
              {busy ? '请稍候…' : mode === 'login' ? '登录并同步' : '注册并开始同步'}
            </button>
            <div className="form-tip">
              注册后，自定义场景/词句、收藏、复习记录自动同步云端；密码加密后存储，明文不出设备。
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mine-row" style={{ cursor: 'default' }}>
            <span className="ic">👤</span>
            <span className="lb">
              {auth.username}
              <div className="form-tip">
                {status?.error
                  ? `⚠ 上次同步失败：${status.error}`
                  : status?.at
                    ? `✓ 已同步 · 最近 ${fmtTime(status.at)}（数据变化后自动上传）`
                    : '正在连接云端…'}
              </div>
            </span>
          </div>
          <button className="mine-row" style={{ width: '100%', textAlign: 'left' }} disabled={!!busy} onClick={() => void syncNow()}>
            <span className="ic">🔄</span>
            <span className="lb">立即同步（拉取云端 + 合并 + 上传）</span>
            <span className="arrow">{busy === 'sync' ? '…' : '→'}</span>
          </button>
          <button className="mine-row" style={{ width: '100%', textAlign: 'left', color: 'var(--red)' }} onClick={logout}>
            <span className="ic">🚪</span>
            <span className="lb">退出登录（本机数据保留）</span>
          </button>
          <div className="form-tip" style={{ padding: '0 16px 12px' }}>
            换新设备：登录同一账号即可自动恢复。建议在常用设备上删除内容（删除暂不跨设备同步）。
          </div>
        </>
      )}
    </div>
  )
}
