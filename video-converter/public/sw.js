const CACHE_NAME = 'video-converter-v1.0.0';
const FFMPEG_CACHE_NAME = 'ffmpeg-core-v1';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json'
];

// FFmpeg core files (cached separately due to size)
const FFMPEG_CORE_URLS = [
  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      
      // Pre-cache FFmpeg core files
      caches.open(FFMPEG_CACHE_NAME).then(cache => {
        console.log('Service Worker: Caching FFmpeg core');
        return cache.addAll(FFMPEG_CORE_URLS);
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch(error => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Remove old caches
          if (cacheName !== CACHE_NAME && cacheName !== FFMPEG_CACHE_NAME) {
            console.log('Service Worker: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      // Take control of all pages immediately
      return self.clients.claim();
    }).catch(error => {
      console.error('Service Worker: Activation failed', error);
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    handleFetchRequest(event.request)
  );
});

async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Handle FFmpeg core files
    if (FFMPEG_CORE_URLS.includes(request.url)) {
      return await handleFFmpegRequest(request);
    }
    
    // Handle static assets
    if (url.origin === self.location.origin) {
      return await handleStaticAssetRequest(request);
    }
    
    // Handle external requests (network first)
    return await handleExternalRequest(request);
    
  } catch (error) {
    console.error('Service Worker: Fetch failed', error);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Handle FFmpeg core files with cache first strategy
async function handleFFmpegRequest(request) {
  const cache = await caches.open(FFMPEG_CACHE_NAME);
  
  // Try cache first
  let response = await cache.match(request);
  
  if (!response) {
    console.log('Service Worker: FFmpeg file not in cache, fetching:', request.url);
    
    try {
      response = await fetch(request);
      
      // Cache successful responses
      if (response.status === 200) {
        const responseClone = response.clone();
        await cache.put(request, responseClone);
        console.log('Service Worker: FFmpeg file cached:', request.url);
      }
    } catch (error) {
      console.error('Service Worker: Failed to fetch FFmpeg file:', error);
      // Return a helpful error response
      return new Response('FFmpeg core file unavailable offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
  } else {
    console.log('Service Worker: Serving FFmpeg file from cache:', request.url);
  }
  
  return response;
}

// Handle static assets with cache first strategy
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  
  // Try cache first
  let response = await cache.match(request);
  
  if (!response) {
    console.log('Service Worker: Asset not in cache, fetching:', request.url);
    
    try {
      response = await fetch(request);
      
      // Cache successful responses for static assets
      if (response.status === 200 && shouldCacheRequest(request)) {
        const responseClone = response.clone();
        await cache.put(request, responseClone);
        console.log('Service Worker: Asset cached:', request.url);
      }
    } catch (error) {
      console.error('Service Worker: Failed to fetch asset:', error);
      
      // For HTML requests, return the cached index.html (SPA fallback)
      if (request.headers.get('accept')?.includes('text/html')) {
        const indexResponse = await cache.match('/index.html');
        if (indexResponse) {
          return indexResponse;
        }
      }
      
      throw error;
    }
  } else {
    console.log('Service Worker: Serving asset from cache:', request.url);
  }
  
  return response;
}

// Handle external requests with network first strategy
async function handleExternalRequest(request) {
  try {
    // Network first for external resources
    const response = await fetch(request, {
      // Set reasonable timeout
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined
    });
    
    return response;
  } catch (error) {
    console.log('Service Worker: External request failed:', error);
    
    // Try cache as fallback for external resources
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Serving external resource from cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Determine if a request should be cached
function shouldCacheRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Don't cache API requests or dynamic content
  if (pathname.startsWith('/api/')) return false;
  
  // Cache static assets
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)) {
    return true;
  }
  
  // Cache HTML pages
  if (pathname.endsWith('/') || pathname.endsWith('.html') || !pathname.includes('.')) {
    return true;
  }
  
  return false;
}

// Handle background sync for failed uploads (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'background-conversion') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // This would handle background conversion when connection is restored
  // For now, just log that sync was requested
  console.log('Service Worker: Background sync completed');
}

// Handle push notifications (future enhancement)
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || 'Video Converter';
  const options = {
    body: data.body || 'Your conversion is complete!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'conversion-complete',
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Log service worker lifecycle
console.log('Service Worker: Script loaded');