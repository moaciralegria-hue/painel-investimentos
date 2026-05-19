const CACHE_VERSION = 'investimentos-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './data.js',
  './icon.svg',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

const API_CACHE = 'investimentos-api-v1';
const BCB_URLS = [
  'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4392/dados',
  'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  const isBCB = BCB_URLS.some(u => url.startsWith(u));
  if (isBCB) {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  if (url.startsWith('https://fonts.gstatic.com')) {
    event.respondWith(cacheFirst(event.request, CACHE_VERSION));
    return;
  }

  event.respondWith(cacheFirst(event.request, CACHE_VERSION));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
