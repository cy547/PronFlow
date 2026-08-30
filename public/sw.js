/* PronFlow Service Worker：离线缓存（应用壳 + 词库），版本升级自动清理 */
const VERSION = 'pronflow-v2'
const CORE = ['/', 'index.html', 'manifest.webmanifest', 'dict/dict.json', 'icons/icon-192.png', 'icons/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION)
    await Promise.allSettled(CORE.map((u) => cache.add(new Request(u, { cache: 'reload' }))))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return // 外部资源（有道发音）走网络

  // 页面导航：网络优先，断网回退到缓存的 index.html（离线可用关键）
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        return await fetch(req)
      } catch {
        const cache = await caches.open(VERSION)
        return (await cache.match('index.html')) || (await cache.match('/')) || Response.error()
      }
    })())
    return
  }

  // 静态资源 / 词库：缓存优先，词库后台静默更新
  const cacheable =
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('/dict/dict.json') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.includes('/manifest')

  if (cacheable) {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION)
      const hit = await cache.match(req)
      if (hit) {
        if (url.pathname.endsWith('dict.json')) {
          fetch(req)
            .then((r) => (r.ok ? cache.put(req, r.clone()) : undefined))
            .catch(() => {})
        }
        return hit
      }
      try {
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      } catch {
        return Response.error()
      }
    })())
  }
})
