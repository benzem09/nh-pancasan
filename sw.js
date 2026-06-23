const CACHE_NAME = "nh-pancasan-v2.3";

const FILES_TO_CACHE = [
        '/',
        '/index.html',
        'assets/css/theme.css'
        'assets/css/layout.css'
        'assets/css/components.css'
        'assets/css/post.css'
        'assets/css/mobile.css'
        '/assets/js/main.js',
        /* CORE */
        'assets/js/core/api.js',
        'assets/js/core/config.js',
        'assets/js/core/helpers.js',
        'assets/js/core/router.js',

        /* BLOG */
        'assets/js/blog/search.js',
        'assets/js/blog/comments.js',
        'assets/js/blog/views.js',
        'assets/js/blog/bookmarks.js',
        'assets/js/blog/toc.js',
        'assets/js/blog/post-viewer.js',
        'assets/js/blog/lightbox.js',

        'assets/js/blog/sitemap.js',

        'assets/js/blog/image-upload.js',
        'assets/js/blog/ocr.js',
        'assets/js/blog/post-crud.js',

        'assets/js/blog/categories.js',
        'assets/js/blog/archive.js',
        'assets/js/blog/blog-feed.js',
        'assets/js/blog/fab.js',

        /* VENDOR / LIBRARY OUTSIDE */
        'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
        'assets/vendor/jspdf.umd.min.js',

        'assets/js/theme.js',
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