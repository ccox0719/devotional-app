const CACHE_NAME = "devotional-cache-v1";
const urlsToCache = [
  "/index.html",
  "/upload.html",
  "/style.css",
  "/main.js",
  "/upload.js",
];

self.addEventListener("install", event => {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return Promise.all(
          urlsToCache.map(url =>
            fetch(url).then(response => {
              if (!response.ok) {
                throw new Error(`Request for ${url} failed with status ${response.status}`);
              }
              return cache.put(url, response);
            })
          )
        );
      })
    );
  });
  

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
