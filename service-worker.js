const CACHE_NAME = 'ibd2026-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/schedule.html',
  '/exam.html',
  '/resources.html',
  '/homework.html',
  '/extracurricular.html',
  '/teacher.html',
  '/styles.css?v=3',
  '/firebase-config.js?v=3',
  '/dataManager.js?v=3',
  '/theme.js?v=3',
  '/app-settings.js?v=3',
  '/data/icon.ico?v=3',
  '/data/forest.gif',
  '/data/1.jpg',
  '/data/Teachers/Gaivas.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
