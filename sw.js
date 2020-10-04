const dynamicCacheName = 'dynamic_v1'
const staticCacheName = 'static_v1'
const staticFiles = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/ui.js',
  '/pages/fallback.html',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.gstatic.com/s/materialicons/v55/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2'
]

const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size))
      }
    })
  })
}

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(staticCacheName)
      .then(cache => {
        cache.addAll(staticFiles)
      })
  )
})

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => {
      console.log(keys)
      return Promise.all(keys
        .filter(key => key !== staticCacheName && key !== dynamicCacheName)
        .map(key => caches.delete()))
    })
  )
})

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request)
      .then(response => {
        return response || fetch(evt.request).then(response => {
          return caches.open(dynamicCacheName).then(cache => {
            if (/^https?:$/i.test(new URL(evt.request.url).protocol))
              cache.put(evt.request.url, response.clone())
              limitCacheSize(dynamicCacheName, 20)
            return response
          })
        })
      }).catch(() => {
        if (/.html/i.test(new URL(evt.request.url).pathname)) { // only for html pages
          return caches.match('/pages/fallback.html')
        }
        // in case of images or other things you could repeat the above and return a fallback image
        // more info about caching strategies: https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
      })
  )
})