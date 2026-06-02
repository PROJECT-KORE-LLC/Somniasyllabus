const CACHE_NAME = 'somnia-syllabus-v2';

// List all the core files your app needs to run offline.
// Make sure these filenames exactly match what is in your folder.
const APP_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './SomniaSyllabus.png',
    './icon-192x192.png',
    './icon-512x512.png'
    // Note: You can add your default audio files here later (e.g., './fire.mp3') 
    // so they are immediately available offline on first load.
];

// 1. INSTALL EVENT: Cache the app shell
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forces the waiting service worker to become the active one
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SomniaSyllabus SW] Caching App Shell');
            return cache.addAll(APP_ASSETS);
        })
    );
});

// 2. ACTIVATE EVENT: Clean up old caches if you update the version number
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SomniaSyllabus SW] Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of all pages immediately
});

// 3. FETCH EVENT: Cache-First Strategy
self.addEventListener('fetch', (event) => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return the cached file if we have it
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise, fetch it from the network
            return fetch(event.request).then((networkResponse) => {
                // Dynamically cache new assets as they are fetched from the network
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch((error) => {
                console.error('[SomniaSyllabus SW] Fetch failed; returning offline fallback.', error);
            });
        })
    );
});
