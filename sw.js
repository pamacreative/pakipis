// Service Worker de Pakipis (PWA)
// Estrategia "red primero" para el HTML: siempre muestra la última versión cuando hay internet,
// y usa la copia guardada solo si no hay conexión. Así el APK se actualiza solo.
const CACHE='pakipis-v3';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  // Nunca cachear: Supabase y la tasa BCV (siempre a la red)
  if(req.method!=='GET' || req.url.includes('supabase') || req.url.includes('bcv.json')) return;
  const aceptaHTML=(req.headers.get('accept')||'').includes('text/html');
  const esPagina=req.mode==='navigate' || aceptaHTML;
  if(esPagina){
    // Red primero; si falla (sin internet), caché
    e.respondWith(
      fetch(req).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(req,c));return res;})
                .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
  }else{
    // Recursos (iconos, manifest): caché rápida, pero refresca en segundo plano
    e.respondWith(
      caches.match(req).then(cached=>{
        const red=fetch(req).then(res=>{const c=res.clone();caches.open(CACHE).then(ca=>ca.put(req,c));return res;}).catch(()=>cached);
        return cached||red;
      })
    );
  }
});
