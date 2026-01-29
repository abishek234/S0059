const CACHE_NAME = 'internship-dashboard-v1';
const API_CACHE = 'internship-api-v1';

// Install - cache the app shell
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache the main HTML and essential assets
      return cache.addAll([
        '/',
        '/dashboard',
        '/dashboard/app',
        '/static/js/bundle.js',
        '/static/css/main.css',
        '/manifest.json'
      ]).catch(err => {
        console.log('Cache addAll failed:', err);
        // Try to cache at least the root
        return cache.add('/');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle navigation requests (page requests)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request.url)
        .then(response => {
          if (response) {
            console.log('Serving cached page:', request.url);
            return response;
          }
          // Fallback to cached root page
          return caches.match('/');
        })
        .then(response => {
          if (response) {
            console.log('Serving cached root page for:', request.url);
            return response;
          }
          // If no cache, try network (will fail offline)
          return fetch(request);
        })
    );
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPICache(request));
  }
});

async function handleAPICache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
      console.log('Cached API:', request.url);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      console.log('Serving cached API:', request.url);
      return cached;
    }
    
    return new Response(JSON.stringify({
      error: 'Offline - data not available',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}