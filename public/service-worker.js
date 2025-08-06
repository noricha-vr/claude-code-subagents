// Service Worker for Video to MP3 Converter PWA
const CACHE_NAME = 'vid2mp3-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Static assets will be added by Vite PWA plugin
];

// FFmpeg files that need special handling
const FFMPEG_FILES = [
  '/ffmpeg-core/ffmpeg-core.wasm',
  '/ffmpeg-core/ffmpeg-core.js',
  '/ffmpeg-core/ffmpeg-core.worker.js'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(STATIC_CACHE_FILES);
    })
  );
  // Skip waiting and take control immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle FFmpeg files with special cache strategy (cache first)
  if (FFMPEG_FILES.some(file => url.pathname.endsWith(file))) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Handle other requests with network first strategy
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Handle background sync for file processing if needed
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
});

// Handle push notifications if needed in the future
self.addEventListener('push', (event) => {
  console.log('Push event:', event);
});