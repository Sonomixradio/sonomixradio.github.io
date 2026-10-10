const CACHE = 'sonomix-player-v1';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './logo-sonomix.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin === self.location.origin) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
