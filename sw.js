// sw.js
const CACHE_NAME = 'b31les-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/animations.css',
  './logo-fx.js',
  './page-animations.js',
  './card-tilt.js',
  './drag-sort.js',
  './data/icon-192.png',
  './data/icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Заставляем SW обновиться сразу
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('SW cache error:', err));
    })
  );
});

self.addEventListener('activate', (e) => {
  // Удаляем старые кэши, чтобы там не висело старое говно
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Не кэшируем запросы к Firebase, API и телеге
  if (e.request.url.includes('firebase') || e.request.url.includes('workers.dev') || e.request.url.includes('googleapis')) return;

  // Для HTML/JS/CSS используем стратегию "Network First" (сначала сеть, потом кэш)
  // Чтобы когда ты обновляешь версию в index.html (v=6 на v=7), браузер не тянул старьё из кэша
  if (e.request.destination === 'document' || e.request.url.match(/\.(js|css)$/)) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Для картинок и прочего — "Cache First"
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).then((fetchRes) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});
