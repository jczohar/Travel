const CACHE = 'travel-info-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('open-meteo') || url.hostname.includes('wikipedia') ||
      url.hostname.includes('wikimedia') || url.hostname.includes('frankfurter') ||
      url.hostname.includes('nominatim') || url.hostname.includes('restcountries') ||
      url.hostname.includes('tile') || url.hostname.includes('openstreetmap')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const clone = resp.clone();
      if (e.request.method === 'GET' && resp.status === 200) {
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});

// מיקוד חלון קיים כשפותחים שוב את ה-PWA
self.addEventListener('message', async (event) => {
  if (!event.data || event.data.type !== 'FOCUS_EXISTING') return;
  const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const c of all) {
    if (c.url && 'focus' in c) {
      try { await c.focus(); } catch (e) {}
    }
  }
});
