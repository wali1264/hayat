// Incrementing cache name for updates.
const CACHE_NAME = 'hayat-cache-v5';

// Expanded list of URLs to cache. This includes all critical assets required
// for the application to function correctly offline.
const urlsToCache = [
  // App Shell
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/index.css', // Added the main CSS file based on console errors.

  // Styles and Fonts
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap',

  // External JavaScript libraries
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',

  // Core libraries from the import map
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/client',
  'https://aistudiocdn.com/@google/genai@^1.17.0',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
];

// On install, cache the app shell and all critical assets.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened. Caching app shell and critical assets for offline use.');
        // Use individual cache.add for better error handling if one asset fails.
        const promises = urlsToCache.map(url => {
            return cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url}:`, err);
            });
        });
        return Promise.all(promises);
      })
      .catch(err => {
        console.error('Failed to open cache during install:', err);
      })
  );
});

// On fetch, use a robust "Network falling back to cache" strategy.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // 1. Try to fetch from the network first.
      return fetch(event.request)
        .then((networkResponse) => {
          // If the fetch is successful, cache the new response and return it.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // 2. If the network request fails, serve from cache.
          console.log('Network request failed. Serving from cache for:', event.request.url);
          return cache.match(event.request).then(response => {
              // If a response is found in cache, return it.
              // If not, return a generic error. This prevents the TypeError.
              return response || new Response('', { status: 404, statusText: 'Not Found in Cache' });
          });
        });
    })
  );
});

// On activation, clean up old caches.
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});
