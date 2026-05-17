const CACHE_NAME = 'openmail-shell-v2'
const MODEL_CACHE = 'openmail-models-v1'
const ASSETS = ['/', '/manifest.webmanifest', '/favicon.svg']
const MODEL_HOSTS = new Set(['huggingface.co', 'cdn-lfs.huggingface.co', 'xenova.github.io'])

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET') return

  if (MODEL_HOSTS.has(url.hostname) || url.pathname.includes('/Xenova/all-MiniLM-L6-v2/')) {
    event.respondWith(
      caches.open(MODEL_CACHE).then((cache) =>
        cache.match(request).then((cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
            return response
          }),
        ),
      ),
    )
    return
  }

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy))
          return response
        })
        .catch(async () => (await caches.match('/')) || (await caches.match(request))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      }),
    ),
  )
})
