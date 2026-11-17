// CropAI Service Worker — Network-First Strategy to ensure immediate updates
const CACHE_NAME = "cropguard-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Never intercept API calls or non-GET requests
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  // Network-First: Always fetch the fresh bundle from server first
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Fall back to cache only when truly offline
        return caches.match(event.request);
      })
  );
});
