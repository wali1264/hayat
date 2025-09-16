// Incrementing cache name for updates to trigger the 'activate' event.
const CACHE_NAME = 'hayat-cache-v11';

// List of essential files for the app shell to work offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',

  // Third-party scripts and styles from index.html
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  
  // Import map dependencies (best effort based on import map)
  "https://aistudiocdn.com/react@19.1.1/",
  "https://aistudiocdn.com/react-dom@19.1.1/",
  "https://aistudiocdn.com/@google/genai@1.17.0",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
];

// Install event: Cache all critical assets for the initial offline experience.
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW Installing: Caching app shell.');
        const promises = urlsToCache.map(urlToCache => {
            // Fetch with standard CORS mode to ensure we get a proper response.
            return fetch(urlToCache)
                .then(response => {
                    // Only cache successful responses (status 200-299).
                    if (!response.ok) {
                        console.error(`[SW] Failed to fetch and cache ${urlToCache}. Status: ${response.status}`);
                        // Don't throw an error, just skip caching this resource.
                        // This prevents one failed resource from failing the entire install.
                        return; 
                    }
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
            console.log('SW Activating: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW Activating: Claiming clients.');
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

// Fetch event: Implement "Network-first, falling back to cache" strategy.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and chrome extension requests.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);

  // CRITICAL: For Supabase API calls, always go to the network. Do not cache.
  // This ensures the license check is always fresh when online.
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other requests, implement "Network first, falling back to cache" strategy.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the network request is successful, cache the response and return it.
        // We only cache valid or opaque responses.
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If the network request fails (e.g., user is offline), try to serve from the cache.
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the request is not in the cache, it's truly unavailable offline.
          console.warn(`[SW] Fetch failed for: ${event.request.url}. This resource is not available offline.`);
          
          // For navigation requests, serve the base index.html page as a fallback.
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // For other assets, return a synthetic error response to avoid a crash.
          return new Response('Network error: Resource not available offline.', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});