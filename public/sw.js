const CACHE_NAME = 'vendora-offline-v2';
// Core shell files to pre-cache during install
const SHELL_ASSETS = ['/index.html'];

// Install: pre-cache the HTML shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
  // Activate immediately without waiting for old SW clients to close
  self.skipWaiting();
});

// Activate: clean up old caches from previous SW versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // Take control of all open tabs/clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip browser extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip Supabase API & Realtime calls — let them fail naturally so our IndexedDB fallback handles it
  if (url.hostname.includes('supabase.co')) return;

  // Skip external CDN/API calls that shouldn't be cached
  if (!url.hostname.includes(self.location.hostname) && !url.pathname.startsWith('/')) return;

  // --- Navigation requests (reloading or navigating to any route) ---
  // Always try network first; if offline, serve the cached HTML shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache the fresh HTML shell on success
          caches.open(CACHE_NAME).then((c) => c.put(request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() =>
          caches.match('/index.html').then((cached) => {
            if (cached) return cached;
            // Last resort: return a minimal offline page
            return new Response(
              '<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc"><div style="text-align:center"><h2 style="color:#1e293b">📦 Vendora — Modo Offline</h2><p style="color:#64748b">Vuelve a conectarte para continuar</p></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          })
        )
    );
    return;
  }

  // --- Static assets (JS, CSS, fonts, images) ---
  // Stale-While-Revalidate: serve from cache instantly, update cache in background
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Return cached version immediately (if available), otherwise wait for network
        return cachedResponse || networkFetch;
      })
    )
  );
});

