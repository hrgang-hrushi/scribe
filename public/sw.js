const CACHE_NAME = 'scribe-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.disable();
        } catch {}
      }
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
    })()
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Navigation requests: Network-first, fall back to cached shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          if (event.preloadResponse) {
            const preloadResp = await event.preloadResponse;
            if (preloadResp) return preloadResp;
          }
          return await fetch(event.request);
        } catch {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return (await caches.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  // 2. Next.js chunks & scripts: ALWAYS Network-first to prevent stale code bugs
  if (event.request.url.includes('/_next/') || event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3. Static assets: Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return fetchResponse;
      });
    })
  );
});
