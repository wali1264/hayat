const CACHE_NAME = 'hayat-cache-v1';
// This list includes all the necessary files for the app shell to work offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
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
  // External resources
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap'
];

// Install the service worker and cache all the app's content
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// On fetch, serve from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If the request is in the cache, return it
        if (response) {
          return response;
        }
        // Otherwise, fetch from the network
        return fetch(event.request);
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
