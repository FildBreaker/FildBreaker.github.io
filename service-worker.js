const CACHE_NAME = 'ibd2026-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/schedule.html',
  '/exam.html',
  '/resources.html',
  '/homework.html',
  '/extracurricular.html',
  '/teacher.html',
  '/styles.css',
  '/firebase-config.js',
  '/dataManager.js',
  '/app-settings.js',
  '/data/icon.ico',
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