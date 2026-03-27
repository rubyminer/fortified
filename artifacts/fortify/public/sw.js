// Bump when fetch / caching rules change so clients drop old caches.
const CACHE_NAME = 'fortify-v2';

// Derive base path from the SW's own location (e.g. /fortify/ or /)
const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, '') || '';

const APP_SHELL = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        APP_SHELL.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {}
  const title = data.title || 'Fortify';
  const url = data.url || BASE_PATH + '/feed';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: BASE_PATH + '/icons/icon-192.png',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || BASE_PATH + '/feed';
  const fullUrl = new URL(url, self.location.origin).href;
  event.waitUntil(
    self.clients.openWindow
      ? self.clients.openWindow(fullUrl)
      : Promise.resolve(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // Skip Supabase and external API requests — never cache these
  if (url.hostname.includes('supabase.co') || url.hostname !== self.location.hostname) {
    return;
  }

  const path = url.pathname;
  const isNavigation =
    event.request.mode === 'navigate' || event.request.destination === 'document';
  const isConfigEnv = path.endsWith('/config-env.js');

  // Full page loads / refresh: always network-first. Cache-first index.html after deploy
  // leaves PWA (especially iOS) on a stale HTML that points at deleted hashed JS → white screen.
  if (isNavigation || isConfigEnv) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(BASE_PATH + '/index.html'))
    );
    return;
  }

  // Hashed build assets (/assets/*): cache-first is safe once HTML is current.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const cloned = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      });
    })
  );
});
