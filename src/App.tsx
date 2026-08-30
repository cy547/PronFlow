/** App 壳：Tab 导航 + 页面栈 */
import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { NavCtx, type PushRoute } from './nav'
import { TabBar, type TabKey } from './components/TabBar'
import { HomePage } from './pages/HomePage'
import { ScenePage } from './pages/ScenePage'
import { TrainPage } from './pages/TrainPage'
import { DictPage } from './pages/DictPage'
import { SearchPage } from './pages/SearchPage'
import { ReviewPage } from './pages/ReviewPage'
import { MinePage } from './pages/MinePage'
import { onTTSError, primeTTS } from './services/tts'

const IS_IOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

const TTS_ERR_TEXT: Record<'unsupported' | 'novoice', string> = {
  unsupported: IS_IOS
    ? '当前浏览器不支持发音：请用 Safari 打开本页；单词发音已自动切换为在线真人音频，句子需 Safari'
    : '当前浏览器不支持发音：建议安装 Chrome 或 Edge 打开；单词已自动切换在线真人发音，句子发音需受支持的浏览器',
  novoice: IS_IOS
    ? '没检测到英语语音：请到 设置→辅助功能→朗读内容→声音 检查英语声音；或用 Safari 打开'
    : '手机缺少英语语音引擎：请安装「Google 文字转语音」并下载英语语音数据；单词已自动切换在线真人发音',
}

const TAB_PAGES: Record<TabKey, ComponentType> = {
  home: HomePage,
  dict: DictPage,
  search: SearchPage,
  review: ReviewPage,
  mine: MinePage,
}

export default function App() {
  const [tab, setTab] = useState<TabKey>('home')
  const [stack, setStack] = useState<PushRoute[]>([])

  const goTab = useCallback((t: TabKey) => {
    setStack([])
    setTab(t)
    window.scrollTo(0, 0)
  }, [])

  const push = useCallback((r: PushRoute) => {
    setStack((s) => [...s, r])
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => setStack((s) => s.slice(0, -1)), [])

  const openTrain = useCallback(
    (sceneId: string, mode?: 1 | 2 | 3, focusMaterialId?: string) => push({ name: 'train', sceneId, mode, focusMaterialId }),
    [push],
  )

  /** 手机物理返回键 / 浏览器后退 */
  useEffect(() => {
    const onPop = () => {
      if (stack.length > 0) setStack((s) => s.slice(0, -1))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [stack.length])

  /** 移动端语音引擎解锁 + 发音故障提示 */
  const [ttsErr, setTtsErr] = useState<string | null>(null)
  useEffect(() => {
    primeTTS()
    return onTTSError((e) => setTtsErr(TTS_ERR_TEXT[e]))
  }, [])
  useEffect(() => {
    if (!ttsErr) return
    const t = window.setTimeout(() => setTtsErr(null), 6000)
    return () => window.clearTimeout(t)
  }, [ttsErr])

  useEffect(() => {
    history.pushState({ pf: true }, '')
  }, [stack.length])

  const top = stack[stack.length - 1]

  let content: ReactNode
  if (top?.name === 'scene') {
    content = <ScenePage key={top.sceneId} sceneId={top.sceneId} />
  } else if (top?.name === 'train') {
    content = (
      <TrainPage
        key={`${top.sceneId}-${top.mode}`}
        sceneId={top.sceneId}
        initialMode={top.mode}
        focusMaterialId={top.focusMaterialId}
      />
    )
  } else {
    const Page = TAB_PAGES[tab]
    content = <Page />
  }

  return (
    <NavCtx.Provider value={{ tab, goTab, push, back, openTrain }}>
      <div className="phone">
        {content}
        {!top && <TabBar tab={tab} onTap={goTab} />}
        {ttsErr && (
          <div className="tts-toast" onClick={() => setTtsErr(null)}>
            🔊 {ttsErr}
          </div>
        )}
      </div>
    </NavCtx.Provider>
  )
}
