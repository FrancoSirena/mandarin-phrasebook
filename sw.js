/**
 * Service worker — makes the site (and the offline Whisper engine) work
 * without a connection after the first visit.
 *
 * Strategy: network-first with cache fallback for same-origin assets and the
 * transformers.js library. Hugging Face model files are left to
 * transformers.js's own browser cache, which already supports offline reuse.
 */
const CACHE = 'mtp-cache-v2';
const PRECACHE = [
  './',
  './index.html',
  './assets/css/styles.css',
  './assets/js/data.js',
  './assets/js/speech.js',
  './assets/js/practice.js',
  './assets/js/offline.js',
  './assets/js/app.js'
];
const LIBRARY_HOSTS = ['cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const library = LIBRARY_HOSTS.some((h) => url.hostname === h);

  // Don't touch model downloads (huggingface.co / cdn-lfs) — transformers.js
  // manages its own cache for those.
  if (!sameOrigin && !library) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
