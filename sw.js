// sw.js
const CACHE_NAME = 'b31les-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css', // если у тебя остались прямые ссылки
  './css/main.css',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/animations.css',
  './app.js',
  './app-settings.js',
  './dataManager.js',
  './auth.js',
  './theme.js',
  './rich-editor.js',
  './toast.js',
  './date-picker.js',
  './color-picker.js',
  './collapse.js',
  './empty-states.js',
  './data/icon-192.png',
  './data/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (e) => {
  // Не кэшируем запросы к Firebase и Telegram (динамика)
  if (e.request.url.includes('firebase') || e.request.url.includes('workers.dev')) return;

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