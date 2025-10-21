// placeholder SW
const APP_CACHE = 'xjson-shell-v1';
const SHELL = ['./','./index.html','./app.js','./manifest.json','./json-asx.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k===APP_CACHE?null:caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // os.json → online-first with cache fallback
  const isOS = url.pathname.endsWith('/os.json');
  if (isOS) {
    e.respondWith((async () => {
      try {
        const net = await fetch(e.request, {cache:'no-store'});
        const cache = await caches.open(APP_CACHE);
        cache.put(e.request, net.clone());
        return net;
      } catch {
        const hit = await caches.match(e.request);
        return hit || new Response('offline', {status:503});
      }
    })());
    return;
  }
  // shell → cache-first
  if (SHELL.some(p => url.pathname.endsWith(p.replace('./','/')))) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
    return;
  }
  // default network, fallback cache
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});
