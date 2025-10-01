// Enhanced Service Worker for Stronghold Will Generation System
// Provides offline functionality, intelligent caching, and performance optimizations

const CACHE_VERSION = '2.0.0';
const CACHE_NAME = `stronghold-will-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `stronghold-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `stronghold-dynamic-v${CACHE_VERSION}`;
const AI_CACHE_NAME = `stronghold-ai-v${CACHE_VERSION}`;

// Performance optimizations
const CACHE_MAX_AGE = 86400000; // 24 hours in milliseconds
const AI_CACHE_MAX_AGE = 3600000; // 1 hour for AI responses
const PRELOAD_TIMEOUT = 5000; // 5 seconds timeout for preloading

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Add critical CSS and JS files here
];

// Enhanced API endpoints with caching strategies
const CACHEABLE_APIS = [
  { path: '/api/will/templates', strategy: 'cacheFirst', maxAge: CACHE_MAX_AGE },
  { path: '/api/legal/validation-rules', strategy: 'cacheFirst', maxAge: CACHE_MAX_AGE },
  { path: '/api/user/preferences', strategy: 'networkFirst', maxAge: 1800000 }, // 30 minutes
  { path: '/api/documents/templates', strategy: 'cacheFirst', maxAge: CACHE_MAX_AGE },
  { path: '/api/ai/responses', strategy: 'cacheFirst', maxAge: AI_CACHE_MAX_AGE },
  { path: '/api/trust-seal', strategy: 'networkFirst', maxAge: 3600000 }, // 1 hour
  { path: '/api/legal-content', strategy: 'cacheFirst', maxAge: CACHE_MAX_AGE }
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES.filter(file => file !== '/offline.html'));
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (isStaticFile(url.pathname)) {
    event.respondWith(handleStaticFile(request));
  } else if (isAPIRequest(url.pathname)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleOtherRequests(request));
  }
});

// Handle static file requests (CSS, JS, images)
function handleStaticFile(request) {
  return caches.match(request)
    .then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Return a basic offline response for static files
          return new Response('Offline - Static file not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    });
}

// Handle API requests with caching strategy
function handleAPIRequest(request) {
  const url = new URL(request.url);

  // Check if this API endpoint should be cached
  if (isCacheableAPI(url.pathname)) {
    return caches.match(request)
      .then((cachedResponse) => {
        // Return cached version immediately, then update in background
        if (cachedResponse) {
          // Update cache in background
          fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
            })
            .catch(() => {
              // Ignore background update errors
            });

          return cachedResponse;
        }

        // No cached version, fetch from network
        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Return offline API response
            return new Response(JSON.stringify({
              error: 'Offline - API not available',
              offline: true,
              cachedData: null
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
      });
  }

  // Non-cacheable API - just fetch from network
  return fetch(request)
    .catch(() => {
      return new Response(JSON.stringify({
        error: 'Network error - API unavailable',
        offline: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    });
}

// Handle page requests (HTML)
function handlePageRequest(request) {
  return fetch(request)
    .then((response) => {
      // Cache successful page responses
      if (response.status === 200) {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseClone);
          });
      }
      return response;
    })
    .catch(() => {
      // Check for cached version
      return caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return offline page
          return caches.match('/offline.html')
            .then((offlinePage) => {
              return offlinePage || new Response('Offline - Page not available', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        });
    });
}

// Handle other requests with network-first strategy
function handleOtherRequests(request) {
  return fetch(request)
    .catch(() => {
      return caches.match(request)
        .then((cachedResponse) => {
          return cachedResponse || new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    });
}

// Helper functions
function isStaticFile(pathname) {
  return pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/) ||
         pathname.startsWith('/_next/static/');
}

function isAPIRequest(pathname) {
  return pathname.startsWith('/api/');
}

function isPageRequest(request) {
  return request.headers.get('accept') &&
         request.headers.get('accept').includes('text/html');
}

function isCacheableAPI(pathname) {
  return CACHEABLE_APIS.some(api => pathname.startsWith(api));
}

// Background sync for document updates
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'document-sync') {
    event.waitUntil(syncDocuments());
  }
});

// Sync documents when back online
async function syncDocuments() {
  try {
    console.log('Syncing documents in background...');

    // Get pending document changes from IndexedDB or localStorage
    const pendingChanges = await getPendingDocumentChanges();

    for (const change of pendingChanges) {
      try {
        await syncDocumentChange(change);
        await removePendingChange(change.id);
      } catch (error) {
        console.error('Failed to sync document change:', error);
      }
    }

    console.log('Background document sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Get pending document changes (simplified - would use IndexedDB in production)
async function getPendingDocumentChanges() {
  try {
    // This would read from IndexedDB in a real implementation
    return [];
  } catch (error) {
    console.error('Failed to get pending changes:', error);
    return [];
  }
}

// Sync a single document change
async function syncDocumentChange(change) {
  const response = await fetch('/api/documents/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(change)
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return response.json();
}

// Remove pending change after successful sync
async function removePendingChange(changeId) {
  // This would remove from IndexedDB in a real implementation
  console.log('Removed pending change:', changeId);
}

// Push notifications for sync updates
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'Your documents have been updated',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'document-update',
      data: data,
      actions: [
        {
          action: 'view',
          title: 'View Changes'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'LegacyGuard Update', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app to view changes
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);

  if (event.data.type === 'CACHE_DOCUMENT') {
    cacheDocument(event.data.document)
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        console.error('Failed to cache document:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }

  if (event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus()
      .then((status) => {
        event.ports[0].postMessage({ success: true, status });
      })
      .catch((error) => {
        event.ports[0].postMessage({ success: false, error: error.message });
      });
  }
});

// Cache a document for offline access
async function cacheDocument(document) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  // Create a synthetic response for the document
  const response = new Response(JSON.stringify(document), {
    headers: { 'Content-Type': 'application/json' }
  });

  await cache.put(`/documents/${document.id}`, response);
}

// Get cache status information
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const totalSize = await calculateCacheSize();

  return {
    caches: cacheNames,
    totalSize,
    isOfflineReady: cacheNames.includes(STATIC_CACHE_NAME)
  };
}

// Calculate total cache size (approximate)
async function calculateCacheSize() {
  let totalSize = 0;

  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response && response.body) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}