const CACHE_NAME = 'bela-4d-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/variables.css',
  '/assets/css/reset.css',
  '/assets/css/animations.css',
  '/assets/css/components.css',
  '/assets/css/layout.css',
  '/assets/css/forms.css',
  '/assets/css/chat.css',
  '/assets/css/recipes.css',
  '/assets/css/food-search.css',
  '/assets/css/gamification.css',
  '/assets/js/app.js',
  '/assets/js/screens/login.js',
  '/assets/js/screens/awaiting.js',
];

const NEVER_CACHE = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'cloudfunctions.net',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (NEVER_CACHE.some((domain) => url.includes(domain))) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
