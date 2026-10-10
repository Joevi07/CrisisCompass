const SHELL_CACHE = 'crisiscompass-shell-v2';
const TILE_CACHE = 'crisiscompass-map-tiles-v1';
const SHELL_URLS = ['/', '/index.html', '/favicon.svg', '/icons.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => ![SHELL_CACHE, TILE_CACHE].includes(key)).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match(request);
      return cached || new Response(JSON.stringify({ offline: true, message: 'No saved response available.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }));
    return;
  }

  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(caches.open(TILE_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        if (keys.length > 120) await cache.delete(keys[0]);
      }
      return response;
    }).catch(() => caches.match(request)));
    return;
  }

  if (url.origin === self.location.origin && request.destination !== 'document') {
    event.respondWith(caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        // Clone before returning the response; asynchronous cache callbacks can run
        // after the browser has already consumed its body.
        const cacheCopy = response.clone();
        await caches.open(SHELL_CACHE).then((cache) => cache.put(request, cacheCopy)).catch(() => undefined);
      }
      return response;
    }));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
  }
});
