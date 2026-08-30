import { useEffect, useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { listVoices } from '../../services/audio'
import {
  doAuth,
  getAuth,
  logout,
  mergeUserData,
  pullData,
  pushData,
  type SyncAuth,
} from '../../services/sync'
import { actions, useUserData } from '../../store/useUserData'
import './index.css'

export default function MinePage() {
  const data = useUserData()
  const [auth, setAuth] = useState<SyncAuth | null>(getAuth())
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState<string>('')
  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    actions.touchStreak()
  }, [])

  /** 登录后首次拉取云端并合并 */
  useEffect(() => {
    if (!auth) return
    void (async () => {
      const r = await pullData(auth.token)
      if (r.reauth) {
        setAuth(null)
        logout()
        Taro.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
        return
      }
      if (r.ok && r.data) {
        actions.replaceData(mergeUserData(getCur(), r.data))
        setStatus('已从云端恢复并合并')
      } else if (r.ok) {
        await pushNow()
      } else {
        setStatus('云端连接失败，请稍后手动同步')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.token])

  const getCur = () => data

  const submit = async () => {
    setErr('')
    setBusy(true)
    const r = await doAuth(mode, username.trim(), password)
    setBusy(false)
    if (!r.ok) setErr(r.error ?? '操作失败')
    else {
      setAuth(getAuth())
      setPassword('')
      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })
    }
  }

  const pushNow = async () => {
    const a = getAuth()
    if (!a) return
    const r = await pushData(a.token, data)
    if (r.reauth) {
      logout()
      setAuth(null)
      setStatus('登录已过期')
      return
    }
    setStatus(r.ok ? `已同步 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : r.error ?? '同步失败')
    Taro.showToast({ title: r.ok ? '已同步到云端' : '同步失败', icon: r.ok ? 'success' : 'none' })
  }

  const syncNow = async () => {
    const a = getAuth()
    if (!a) return
    setBusy(true)
    const r = await pullData(a.token)
    if (r.ok && r.data) {
      actions.replaceData(mergeUserData(data, r.data))
      setStatus('已拉取云端并合并')
      const p = await pushData(a.token, data)
      if (p.ok) setStatus(`已同步 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`)
    } else if (r.ok) {
      await pushNow()
    } else {
      setStatus('云端连接失败')
    }
    setBusy(false)
  }

  const doExport = () => {
    Taro.setClipboardData({
      data: actions.exportJSON(),
      success: () => Taro.showToast({ title: '备份已复制到剪贴板，可粘贴保存', icon: 'none' }),
    })
  }

  const doImport = () => {
    const ok = actions.importJSON(importText)
    Taro.showToast({ title: ok ? '导入成功' : '内容格式不对', icon: ok ? 'success' : 'none' })
    if (ok) {
      setShowImport(false)
      setImportText('')
    }
  }

  const voices = listVoices().length

  return (
    <View className="mine-page">
      {/* 账号 */}
      <View className="mcard">
        <Text className="mc-title">账号 · 云端同步</Text>
        {!auth ? (
          <View className="auth-form">
            <Input value={username} onInput={(e) => setUsername(e.detail.value)} placeholder="用户名（3~20 位字母/数字/下划线）" />
            <Input
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
              placeholder="密码（至少 6 位）"
              password
            />
            {err && <Text className="ferr">{err}</Text>}
            <View className="pill-row">
              <Text className={`pill${mode === 'login' ? ' on' : ''}`} onClick={() => setMode('login')}>登录</Text>
              <Text className={`pill${mode === 'register' ? ' on' : ''}`} onClick={() => setMode('register')}>注册新账号</Text>
            </View>
            <Button className="abtn" disabled={busy || !username.trim() || !password} onClick={submit}>
              {busy ? '请稍候…' : mode === 'login' ? '登录并同步' : '注册并开始同步'}
            </Button>
            <Text className="ftip">注册后自定义场景/词句、收藏、复习自动同步云端；密码加密存储。</Text>
          </View>
        ) : (
          <>
            <View className="mrow">
              <Text className="ic">👤</Text>
              <View className="lb">
                <Text className="lb-t">{auth.username}</Text>
                <Text className="lb-s">{status || '已登录 · 数据变化后可在下方手动同步'}</Text>
              </View>
            </View>
            <View className="mrow tap" onClick={() => void syncNow()}>
              <Text className="ic">🔄</Text>
              <Text className="lb-t">{busy ? '同步中…' : '立即同步（拉取 + 合并 + 上传）'}</Text>
            </View>
            <View
              className="mrow tap del"
              onClick={() => {
                logout()
                setAuth(null)
                Taro.showToast({ title: '已退出登录（本机数据保留）', icon: 'none' })
              }}
            >
              <Text className="ic">🚪</Text>
              <Text className="lb-t">退出登录（本机数据保留）</Text>
            </View>
          </>
        )}
      </View>

      {/* 统计 */}
      <View className="mcard">
        <View className="stats">
          <View className="st"><Text className="st-n">{Object.keys(data.favorites).length}</Text><Text className="st-l">收藏</Text></View>
          <View className="st"><Text className="st-n">{data.stats.tests}</Text><Text className="st-l">自测开口</Text></View>
          <View className="st"><Text className="st-n">{data.stats.reviews}</Text><Text className="st-l">复习次数</Text></View>
          <View className="st"><Text className="st-n">🔥{data.stats.streak}</Text><Text className="st-l">连续打卡</Text></View>
        </View>
      </View>

      {/* 设置 */}
      <View className="mcard">
        <Text className="mc-title">发音</Text>
        <View className="mrow">
          <Text className="ic">🌎</Text>
          <Text className="lb-t">口音</Text>
          <View className="pill-row">
            <Text className={`pill${data.settings.accent === 'US' ? ' on' : ''}`} onClick={() => actions.setSettings({ accent: 'US' })}>美音</Text>
            <Text className={`pill${data.settings.accent === 'UK' ? ' on' : ''}`} onClick={() => actions.setSettings({ accent: 'UK' })}>英音</Text>
          </View>
        </View>
        <View className="mrow">
          <Text className="ic">⏱</Text>
          <Text className="lb-t">默认语速</Text>
          <View className="pill-row">
            <Text className={`pill${data.settings.rate === 'normal' ? ' on' : ''}`} onClick={() => actions.setSettings({ rate: 'normal' })}>常速</Text>
            <Text className={`pill${data.settings.rate === 'slow' ? ' on' : ''}`} onClick={() => actions.setSettings({ rate: 'slow' })}>慢速</Text>
          </View>
        </View>
        <View className="mrow">
          <Text className="ic">🗣</Text>
          <Text className="lb-t">发音走有道云端音频（需联网）</Text>
        </View>
      </View>

      {/* 数据 */}
      <View className="mcard">
        <Text className="mc-title">数据</Text>
        <View className="mrow tap" onClick={doExport}>
          <Text className="ic">📤</Text>
          <Text className="lb-t">导出备份（复制到剪贴板）</Text>
        </View>
        <View className="mrow tap" onClick={() => setShowImport(!showImport)}>
          <Text className="ic">📥</Text>
          <Text className="lb-t">导入备份（粘贴备份文本）</Text>
        </View>
        {showImport && (
          <View className="import-box">
            <Input value={importText} onInput={(e) => setImportText(e.detail.value)} placeholder="粘贴备份 JSON 文本" />
            <Button className="abtn" disabled={!importText.trim()} onClick={doImport}>导入</Button>
          </View>
        )}
        <View
          className="mrow tap del"
          onClick={() => {
            Taro.showModal({
              title: '清空本地数据',
              content: '将清空本机全部数据（收藏、自定义、复习记录），确定？',
              success: (r) => {
                if (r.confirm) {
                  actions.replaceData({
                    settings: data.settings,
                    pinned: [],
                    customScenes: [],
                    customMaterials: [],
                    favorites: {},
                    review: {},
                    history: [],
                    stats: { tests: 0, reviews: 0, lastActive: '', streak: 0 },
                  })
                  Taro.showToast({ title: '已清空', icon: 'none' })
                }
              },
            })
          }}
        >
          <Text className="ic">🗑</Text>
          <Text className="lb-t">清空本地数据</Text>
        </View>
      </View>

      {/* 关于 */}
      <View className="mcard">
        <Text className="mc-title">关于</Text>
        <View className="mrow">
          <Text className="ic">🎯</Text>
          <Text className="lb-t">PronFlow v1.0 小程序版 · 无广告 · 数据存本机+云端</Text>
        </View>
        <View className="mrow">
          <Text className="ic">🔊</Text>
          <Text className="lb-t">可用英语音源：{voices > 0 ? `${voices} 个本地` : '云端（需联网）'}</Text>
        </View>
      </View>
    </View>
  )
}
