const CACHE_NAME = "turnaround-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./Styles.css",
  "./script.js",
  "./dateMapping.js",
  "./logo_light.jpg",
  "./logo_dark.jpg",
  "./dino.html",
  "./memory.html",
  "./icons/icon-180-solid.png",
  "./icons/icon-192-solid.png",
  "./icons/icon-512-solid.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
