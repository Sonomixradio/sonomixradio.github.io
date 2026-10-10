const CACHE = 'sonomix-player-v5';
const ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './logo-centro.png', './vinyl-ring.png', './fondo.jpg', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin === self.location.origin) event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
