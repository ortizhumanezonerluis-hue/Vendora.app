const CACHE_NAME = 'vendora-offline-v3';
const PRECACHE_URLS = ['/', '/index.html'];

// Install: pre-cache the SPA shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of PRECACHE_URLS) {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response && response.status === 200) {
            await cache.put(url, response);
          }
        } catch (e) {
          console.warn('[SW] Could not precache:', url, e);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch dispatcher
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  // Ignore chrome-extension schemes
  if (url.protocol === 'chrome-extension:') return;

  // Do NOT intercept Supabase API or Realtime websockets - handled by IndexedDB fallbacks
  if (url.hostname.includes('supabase.co')) return;

  // 1. Navigation requests (HTML SPA Routing)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // 2. Local Static Assets (JS, CSS, Images, Fonts)
  if (url.origin === self.location.origin) {
    event.respondWith(handleAsset(request));
  }
});

/**
 * Handle SPA navigation requests:
 * Try network first. If redirected, clean the response.
 * If offline or network fails, serve the cached index.html shell.
 */
async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    // If the server responded with a redirect, clean it to avoid browser redirect mode errors
    let cleanResponse = networkResponse;
    if (networkResponse.redirected) {
      const blob = await networkResponse.blob();
      cleanResponse = new Response(blob, {
        headers: networkResponse.headers,
        status: networkResponse.status,
        statusText: networkResponse.statusText,
      });
    }

    // Cache the fresh HTML shell for offline use
    if (cleanResponse && cleanResponse.status === 200) {
      try {
        await cache.put('/index.html', cleanResponse.clone());
        await cache.put('/', cleanResponse.clone());
      } catch (e) {
        // Ignore clone/put issues safely
      }
    }

    return cleanResponse;
  } catch (error) {
    // OFFLINE: Return cached SPA shell
    const cachedShell =
      (await cache.match('/index.html')) ||
      (await cache.match('/')) ||
      (await caches.match('/index.html')) ||
      (await caches.match('/'));

    if (cachedShell) {
      return cachedShell;
    }

    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Vendora Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc"><div style="text-align:center;padding:20px"><h1 style="font-size:24px;margin-bottom:8px">📦 Vendora</h1><p style="color:#94a3b8;margin-bottom:16px">Modo Sin Conexión</p><button onclick="window.location.reload()" style="background:#3b82f6;color:white;border:none;padding:10px 20px;border-radius:6px;font-weight:600;cursor:pointer">Reintentar</button></div></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/**
 * Handle static assets (Cache-first with background network update)
 */
async function handleAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch in background to keep cache up to date
  const networkFetch = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        try {
          await cache.put(request, networkResponse.clone());
        } catch (e) {
          // Ignore cache put errors
        }
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached asset immediately if we have it
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  const response = await networkFetch;
  if (response) {
    return response;
  }

  // Fallback if neither cache nor network worked
  return new Response('', { status: 504, statusText: 'Gateway Timeout (Offline)' });
}


