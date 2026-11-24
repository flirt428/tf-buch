// Service Worker – Auftragsbuch (bei Änderungen VERSION hochzählen)
const VERSION = 'v14';
const CACHE = 'auftragsbuch-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'];
const FONTS = 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700;800&display=swap';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    try { await cache.put(FONTS, await fetch(new Request(FONTS, { mode: 'no-cors' }))); } catch (e) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('auftragsbuch-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !/^https?:$/.test(new URL(req.url).protocol)) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone()).catch(() => {});
        return fresh;
      } catch (e) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const net = fetch(req).then(async (res) => {
      if (res && (res.ok || res.type === 'opaque')) (await caches.open(CACHE)).put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    return cached || (await net) || Response.error();
  })());
});
