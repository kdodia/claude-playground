// Service Worker for Library of Things PWA
const CACHE_NAME = 'library-of-things-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
	'/',
	'/offline.html',
	'/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('[SW] Precaching core assets');
			return cache.addAll(PRECACHE_ASSETS);
		})
	);
	// Activate immediately
	self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => {
						console.log('[SW] Deleting old cache:', name);
						return caches.delete(name);
					})
			);
		})
	);
	// Take control of all pages immediately
	self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') return;

	// Skip external requests
	if (url.origin !== self.location.origin) return;

	// Skip API calls or dynamic routes that shouldn't be cached
	if (url.pathname.startsWith('/api/')) return;

	// For navigation requests, try network first, then cache, then offline page
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache successful responses
					if (response.ok) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(request, responseClone);
						});
					}
					return response;
				})
				.catch(() => {
					// Try cache first
					return caches.match(request).then((cachedResponse) => {
						if (cachedResponse) {
							return cachedResponse;
						}
						// Fall back to offline page
						return caches.match(OFFLINE_URL);
					});
				})
		);
		return;
	}

	// For other assets, use stale-while-revalidate strategy
	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			const fetchPromise = fetch(request)
				.then((networkResponse) => {
					// Cache the new response
					if (networkResponse.ok) {
						const responseClone = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(request, responseClone);
						});
					}
					return networkResponse;
				})
				.catch(() => {
					// Network failed, return cached or nothing
					return cachedResponse;
				});

			// Return cached response immediately, update in background
			return cachedResponse || fetchPromise;
		})
	);
});

// Handle messages from the client
self.addEventListener('message', (event) => {
	if (event.data === 'skipWaiting') {
		self.skipWaiting();
	}
});
