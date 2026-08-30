/** PWA：Service Worker 注册 + 「安装到桌面」提示管理 */

let installEvent: BeforeInstallPromptEvent | null = null
const listeners = new Set<(canInstall: boolean) => void>()

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e as BeforeInstallPromptEvent
    listeners.forEach((fn) => fn(true))
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    listeners.forEach((fn) => fn(false))
  })
}

/** 仅在生产构建注册 Service Worker（开发环境避免缓存干扰） */
export function registerPWA() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* 注册失败不影响使用 */
    })
  })
}

export function canInstall(): boolean {
  return !!installEvent
}

export function onInstallAvailable(fn: (v: boolean) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!installEvent) return 'unavailable'
  await installEvent.prompt()
  const choice = await installEvent.userChoice
  installEvent = null
  listeners.forEach((fn) => fn(false))
  return choice.outcome
}
