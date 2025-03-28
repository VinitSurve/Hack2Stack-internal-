const CACHE_NAME = 'od-forms-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/src/index.css',
  '/favicon.svg'
];

// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
  // Only handle GET requests from http/https schemes
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // Try the network first
    fetch(event.request)
      .then(response => {
        // Don't cache if response is not successful
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response before using it
        const responseClone = response.clone();
        
        // Open the cache and store the new response
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          })
          .catch(err => {
            console.log('Cache error:', err);
          });
        
        return response;
      })
      .catch(() => {
        // Network failed, try the cache
        return caches.match(event.request)
          .then(response => {
            // Return cached response or offline page
            return response || caches.match('/offline.html');
          });
      })
  );
});
