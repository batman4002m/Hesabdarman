const CACHE="hesabyar-v13";
const ASSETS=["./","./index.html","./style.css","./app.js","./manifest.json","./icon.svg","./icon-180.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  const sameOrigin=url.origin===location.origin;
  const isFont=url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com";
  if(!sameOrigin&&!isFont)return;
  // صفحات و فایل‌های برنامه: اول شبکه (برای گرفتن نسخه جدید)، در صورت قطع بودن از کش
  if(sameOrigin){
    e.respondWith(
      fetch(req).then(res=>{
        if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
        return res;
      }).catch(()=>caches.match(req,{ignoreSearch:true}).then(r=>r||(req.mode==="navigate"?caches.match("./index.html"):Response.error())))
    );
    return;
  }
  // فونت‌ها: اول کش
  e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;
  }).catch(()=>Response.error())));
});
