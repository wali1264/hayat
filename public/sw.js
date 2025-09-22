// Incrementing cache name for updates to trigger the 'activate' event.
const CACHE_NAME = 'hayat-cache-v14';

// List of essential files for the app shell to work offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',

  // Local TSX files
  '/index.tsx',
  '/App.tsx',
  '/Inventory.tsx',
  '/Sales.tsx',
  '/Customers.tsx',
  '/Accounting.tsx',
  '/Reports.tsx',
  '/Settings.tsx',
  '/Fulfillment.tsx',
  '/Dashboard.tsx',
  '/CustomerAccounts.tsx',
  '/Suppliers.tsx',
  '/Purchasing.tsx',
  '/SupplierAccounts.tsx',
  '/RecycleBin.tsx',
  '/Checkneh.tsx',
  '/Alerts.tsx',
  '/MainWarehouse.tsx',
  '/Login.tsx',

  // Third-party scripts and styles from index.html
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap',
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

// Fetch event: Implement robust offline handling.
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests and chrome extension requests.
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);

  // Strategy: Network-first, then cache, with special handling for API calls.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the network request is successful, cache the response for non-API calls and return it.
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque') && !url.hostname.includes('supabase.co')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network request failed (offline). Now decide what to do.
        
        // CRITICAL: If it was a Supabase API call, we MUST NOT serve from cache.
        // Instead, we return a synthetic error response that the app's logic can handle.
        // This prevents the service worker from crashing.
        if (url.hostname.includes('supabase.co')) {
          console.warn(`[SW] Supabase API call failed for: ${event.request.url}. Returning synthetic network error.`);
          return new Response(JSON.stringify({ message: "Network error: You are offline." }), {
            status: 503, // Service Unavailable
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // For all other requests, try to serve from the cache.
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If the request is not in the cache, it's truly unavailable offline.
          console.warn(`[SW] Fetch failed for: ${event.request.url}. This resource is not available in the cache.`);
          
          // For navigation requests, serve the base index.html page as a fallback.
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // For other assets, return a synthetic error response.
          return new Response('Network error: Resource not available offline.', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
      })
  );
});
