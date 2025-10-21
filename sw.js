const CACHE_NAME = 'xjson-shell-v1';
const ASSETS = ['./','./index.html','./app.js','./manifest.json','./json-asx.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE_NAME?null:caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('/os.json')) {
    e.respondWith((async()=>{
      try {
        const net = await fetch(e.request,{cache:'no-store'});
        const cache = await caches.open(CACHE_NAME);
        cache.put(e.request,net.clone());
        return net;
      } catch {
        const hit = await caches.match(e.request);
        return hit || new Response('offline',{status:503});
      }
    })());
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).catch(()=>caches.match(e.request))));
});
