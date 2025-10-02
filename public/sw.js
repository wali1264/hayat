// Incrementing cache name for updates to trigger the 'activate' event.
const CACHE_NAME = 'hayat-cache-v16';

// List of essential files for the app shell to work offline.
// CRITICAL FIX: Added '/index.tsx' to ensure the main application logic is pre-cached.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // This is the main application entry point that was missing.
  '/manifest.json',
  '/icon.png',

  // Third-party scripts and styles from index.html
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display.swap',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  
  // Import map dependencies (matching the import map in index.html)
  'https://aistudiocdn.com/react@19.1.1',
  'https://aistudiocdn.com/react-dom@19.1.1/client',
  'https://aistudiocdn.com/@google/genai@1.17.0',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
];

// Install event: Cache all critical assets for the initial offline experience.
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Installing: Caching app shell and core assets.');
        const promises = urlsToCache.map(urlToCache => {
            // Fetch with standard CORS mode to ensure we get a proper response.
            return fetch(urlToCache, { mode: 'cors' }) // Use cors mode for resilience
                .then(response => {
                    // Only cache successful responses (status 200-299).
                    if (!response.ok) {
                        console.error(`[SW] Failed to fetch and cache ${urlToCache}. Status: ${response.status}`);
                        // Don't throw an error, just skip caching this resource.
                        // This prevents one failed resource from failing the entire install.
                        return; 
                    }
                    console.log(`[SW] Successfully cached: ${urlToCache}`);
                    return cache.put(urlToCache, response);
                })
                .catch(err => console.error(`[SW] Fetch error for ${urlToCache}:`, err));
        });
        return Promise.all(promises);
      })
      .catch(err => {
          console.error('[SW] Failed to open cache or cache assets during install:', err);
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
            console.log('[SW] Activating: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activating: Claiming clients.');
      return self.clients.claim();
    })
  );
});

// Message event: Listen for a message from the client to skip waiting.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event: Implement a robust, multi-strategy offline handling approach.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and chrome extension requests.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);

  // Strategy 1: API calls are network-only, with an immediate offline fallback.
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.warn(`[SW] Supabase API call failed: ${event.request.url}. Returning synthetic error.`);
        return new Response(JSON.stringify({ message: "Network error: You are offline." }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Strategy 2: For navigation requests (loading the app itself), use network-first to get the latest app shell.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('[SW] Navigate request failed, serving index from cache.');
        return caches.match('/'); // Fallback to the root, which should be the cached index.html
      })
    );
    return;
  }

  // Strategy 3: For all other assets (JS, CSS, fonts, etc.), use a cache-first strategy for speed and offline reliability.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a response in the cache, serve it immediately.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in the cache, fetch from the network.
      return fetch(event.request).then((networkResponse) => {
        // A valid response from the network.
        // Cache it for next time and return it to the page.
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});