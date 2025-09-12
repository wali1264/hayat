// Incrementing cache name for updates.
const CACHE_NAME = 'hayat-cache-v6';

// List of essential files for the app shell to work offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  // The console showed an error for this, so we must ensure it's cached.
  // If the build process generates a different name, our dynamic caching will handle it.
  '/index.css', 

  // Third-party scripts and styles from index.html
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  
  // Import map dependencies
  "https://aistudiocdn.com/react@^19.1.1",
  "https://aistudiocdn.com/react-dom@^19.1.1/",
  "https://aistudiocdn.com/@google/genai@^1.17.0",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
];

// Install event: Cache all critical assets.
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate new service worker immediately.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache. Caching critical assets.');
        // addAll is atomic - if one file fails, the whole operation fails.
        // This is better for ensuring the app is fully ready offline.
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
          console.error('Failed to cache critical assets during install:', err);
      })
  );
});

// Activate event: Clean up old caches.
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
      // Take control of all pages immediately.
      return self.clients.claim();
    })
  );
});

// Fetch event: Implement "Cache-first, falling back to network" strategy.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and chrome extension requests.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If the resource is in the cache, return it.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If the resource is not in the cache, fetch it from the network.
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response.
        // We only want to cache successful responses.
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Clone the response because it's a stream and can only be consumed once.
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Cache the new resource for future offline use.
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(error => {
        // This will happen if the network request fails and the resource is not in the cache.
        console.warn(`Fetch failed for: ${event.request.url}. This resource is not available offline.`);
        // For navigation requests, you could return an offline fallback page.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // For other assets, let the browser handle the failed request.
      });
    })
  );
});