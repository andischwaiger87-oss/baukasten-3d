// Offline-Unterstützung: zuerst Netz, bei fehlender Verbindung der letzte Stand aus dem Cache
const CACHE = 'baukasten3d-v3';
const CORE = [
  './', 'index.html', 'assets/style.css', 'manifest.webmanifest', 'assets/img/logo.svg',
  'assets/js/app.js', 'assets/js/scene.js', 'assets/js/model.js', 'assets/js/catalog.js', 'assets/js/geom.js',
  'assets/js/storage.js', 'assets/js/templates.js', 'assets/js/thumbs.js', 'assets/js/icons.js',
  'vendor/three.module.min.js', 'vendor/OrbitControls.js', 'vendor/BufferGeometryUtils.js', 'vendor/RoomEnvironment.js', 'assets/js/parts-extra.js',
  'assets/fonts/dm-sans-latin-400-normal.woff2', 'assets/fonts/dm-sans-latin-500-normal.woff2',
  'assets/fonts/dm-sans-latin-600-normal.woff2', 'assets/fonts/dm-sans-latin-700-normal.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
