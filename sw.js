const CACHE_NAME = "nh-pancasan-v1";

const urlsToCache = [
    "/ben/",
    "/ben/index.html",
    "/ben/assets/css/style.css",
    "/ben/assets/js/blog.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
