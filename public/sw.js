// Incrementing cache name for updates to ensure new assets are fetched and cached.
const CACHE_NAME = 'hayat-cache-v4';

// Expanded list of URLs to cache. This includes all critical assets required
// for the application to function correctly offline.
const urlsToCache = [
  // App Shell - The basic HTML, manifest, and icons.
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',

  // Main application code.
  '/index.tsx',

  // Styles and Fonts - Crucial for the UI to render correctly offline.
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap',

  // External JavaScript libraries loaded via <script> tags.
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',

  // Core libraries from the import map. Pre-caching these avoids network requests on startup.
  'https://aistudiocdn.com/react@^19.1.1',
  'https://aistudiocdn.com/react-dom@^19.1.1/client', // Correctly targets the 'react-dom/client' import.
  'https://aistudiocdn.com/@google/genai@^1.17.0',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm',
];

// On install, cache the app shell and all critical assets.
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened. Caching app shell and critical assets for offline use.');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        // Log any errors during the caching process.
        console.error('Failed to cache assets during install:', err);
      })
  );
});

// On fetch, use a "Network falling back to cache" strategy.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and chrome extension requests.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      // 1. Try to fetch from the network first.
      return fetch(event.request)
        .then((networkResponse) => {
          // If the fetch is successful, cache the new response and return it.
          // This keeps the cache up-to-date.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // 2. If the network request fails (e.g., offline), serve the response from the cache.
          console.log('Network request failed. Serving from cache for:', event.request.url);
          return cache.match(event.request);
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
          // If a cache name is not in our whitelist, delete it.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open clients immediately.
      return self.clients.claim();
    })
  );
});
