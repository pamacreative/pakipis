// Service Worker de Pakipis (PWA) — permite instalar la app y abrir el cascarón sin conexión.
const CACHE='pakipis-v1';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  // No cachear llamadas a Supabase ni nada que no sea GET: siempre a la red.
  if(req.method!=='GET' || req.url.includes('supabase')){return;}
  e.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(res=>{
      // cache dinámico de la propia app
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      return res;
    }).catch(()=>cached))
  );
});
