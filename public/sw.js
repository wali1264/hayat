// Incrementing cache name for updates
const CACHE_NAME = 'hayat-cache-v3';
// Essential files for the app shell to be cached on install
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened, caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// On fetch, use a "Network falling back to cache" strategy
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and chrome extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // Try to fetch from the network first
      return fetch(event.request)
        .then((networkResponse) => {
          // If the fetch is successful, cache the response and return it
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // If the network request fails (offline), try to serve from the cache
          return cache.match(event.request);
        });
    })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});