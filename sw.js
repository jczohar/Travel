const V='trv-shell-v2',IMG='trv-img-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==IMG).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // טעינה מהירה מהמטמון, ועדכון ברקע
    e.respondWith(caches.open(V).then(async c=>{
      const m=await c.match(r,{ignoreSearch:true});
      const net=fetch(r).then(x=>{if(x&&x.ok)c.put(r,x.clone());return x}).catch(()=>null);
      return m||(await net)||(await c.match('./index.html'))||Response.error();
    }));
    return;
  }
  if(/(^|\.)wikimedia\.org$/.test(u.hostname)){
    e.respondWith(caches.open(IMG).then(async c=>{
      const m=await c.match(r);if(m)return m;
      try{const x=await fetch(r.url,{mode:'cors',credentials:'omit'});if(x&&x.ok)c.put(r,x.clone());return x}catch(err){try{return await fetch(r)}catch(e2){return Response.error()}}
    }));
  }
});
