// sw.js — network-first for HTML, cache-first for assets
// Bump this to force old caches to be purged on deploy
const CACHE_VERSION = 'v5-2025-10-24';
const CACHE_NAME = `turnaround-cache-${CACHE_VERSION}`;

// Build absolute URLs so it works on GitHub Pages subpaths
const SCOPE = self.registration.scope; // e.g. https://username.github.io/TurnAroundCalc/
const toAbs = (p) => new URL(p, SCOPE).toString();

const ASSETS = [
  toAbs('./'),
  toAbs('./index.html'),
  toAbs('./Styles.css'),
  toAbs('./script.js'),
  toAbs('./dateMapping.js'),
  toAbs('./site.webmanifest'),
  toAbs('./icons/icon-180-solid.png'),
  toAbs('./icons/icon-192-solid.png'),
  toAbs('./icons/icon-512-solid.png'),
  toAbs('./logo_light.jpg'),
  toAbs('./logo_dark.jpg'),
  toAbs('./logo_lite.jpg'),
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS))
  );
  self.skipWaiting();           // make this SW the active one immediately
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();         // take control of open pages
});

self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  const accept = req.headers.get('accept') || '';

  // HTML / navigations -> network-first (so refresh gets latest HTML/JS)
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    evt.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Everything else (CSS/JS/img) -> cache-first with network fallback
  evt.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        return res;
      });
    })
  );
});
