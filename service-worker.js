const CACHE_NAME = 'ibd2026-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/schedule.html',
  '/exam.html',
  '/resources.html',
  '/homework.html',
  '/extracurricular.html',
  '/teacher.html',
  '/styles.css?v=2',
  '/firebase-config.js?v=2',
  '/dataManager.js?v=2',
  '/theme.js?v=2',
  '/app-settings.js?v=2',
  '/data/icon.ico?v=2',
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