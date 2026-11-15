const CACHE_NAME = "madar-shell-v11";
const APP_SHELL = [
  "./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest",
  "./assets/icon-192.png", "./assets/icon-512.png",
  "./assets/madar-logo.png", "./assets/madar-logo-dark.png",
  "./assets/madar-logo-original.png", "./assets/madar-logo-fallback.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async path => {
      try { const response = await fetch(path, {cache: "reload"}); if (response.ok) await cache.put(path, response); } catch {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("madar-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isLogo = /\/assets\/madar-logo(?:-dark|-fallback)?\.png$/.test(url.pathname);

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch { return (await caches.match("./index.html")) || Response.error(); }
    })());
    return;
  }

  if (isLogo) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, {cache: "no-store"});
        if (response.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(request, response.clone()); }
        return response;
      } catch { return (await caches.match(request)) || Response.error(); }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) { const cache = await caches.open(CACHE_NAME); await cache.put(request, response.clone()); }
      return response;
    } catch { return Response.error(); }
  })());
});
