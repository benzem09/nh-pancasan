const CACHE_NAME = "nh-pancasan-v2.3";

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/api.js',
  '/assets/js/auth.js',

  '/assets/js/blog/config.js',
  '/assets/js/blog/helpers.js',
  '/assets/js/blog/search.js',
  '/assets/js/blog/comments.js',
  '/assets/js/blog/post-viewer.js',
  '/assets/js/blog/post-crud.js',
  '/assets/js/blog/image-upload.js',
  '/assets/js/blog/lightbox.js',
  '/assets/js/blog/categories.js',
  '/assets/js/blog/archive.js',
  '/assets/js/blog/blog-feed.js',
  '/assets/js/blog/router.js',
  '/assets/js/blog/fab.js'
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

self.addEventListener("fetch", event => {
    const url = new URL(event.request.url);

    // JSON & data → network first
    if (
        url.pathname.endsWith(".json") ||
        url.search.includes("t=")
    ) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Asset → cache first
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});