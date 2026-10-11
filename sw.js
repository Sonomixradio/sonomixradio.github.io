/* Cache the player only; live audio, chat, APIs and the main website stay online. */
const BASE = self.SONOMIX_BASE || new URL('./', self.location.href).href;
const CACHE_PREFIX = 'sonomix-pwa:' + new URL(BASE).pathname + ':';
const CACHE = CACHE_PREFIX + '2026-10-11-1';
const APP = new URL('app/', BASE).href;
const ASSETS = ['app/', 'app/index.html', 'app/style.css', 'app/app.js', 'app/manifest.webmanifest', 'app/logo-sonomix.png', 'app/fondo.jpg', 'app/icons/icon-192.png', 'app/icons/icon-512.png', 'pwa-install.js', 'pwa-install.css'].map(path => new URL(path, BASE).href);
const ALLOWED = new Set(ASSETS);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key =>
    (key.startsWith(CACHE_PREFIX) && key !== CACHE) ||
    (new URL(BASE).pathname === '/' && /^sonomix-player-v\d+$/.test(key))
  ).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  url.search = '';
  if (event.request.method !== 'GET' || !ALLOWED.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok && !response.redirected && response.type === 'basic') {
        event.waitUntil(cache.put(url.href, response.clone()));
      }
      return response;
    } catch {
      const cached = await cache.match(url.href);
      if (cached) return cached;
      if (url.href === APP) {
        const index = await cache.match(new URL('index.html', APP).href);
        if (index) return index;
      }
      return Response.error();
    }
  })());
});
