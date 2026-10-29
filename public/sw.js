/* ===== Critiques Services Service Worker ===== */

const CACHE_NAME = 'critiques-services-v1';
const PRECACHE_ASSETS = [
  '/critiques-services.com/',
  '/critiques-services.com/index.html',
  '/critiques-services.com/manifest.json',
  '/critiques-services.com/favicon.svg',
  '/critiques-services.com/assets/index-*.js',
  '/critiques-services.com/assets/index-*.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache incomplete:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        return response;
      }).catch(() => cached || caches.match('/critiques-services.com/index.html'));
    })
  );
});
