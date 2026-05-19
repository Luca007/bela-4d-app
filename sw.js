/**
 * Service Worker — Bela 4D App
 *
 * Estratégias:
 *   - Cache-first: static assets (JS, CSS, HTML, fonts)
 *   - Network-first + cache fallback: navegação (páginas)
 *   - Network-only: Firebase API (auth, firestore, functions)
 *
 * Atualize CACHE_VERSION para forçar recache de todos os assets.
 */

const CACHE_VERSION = 'bela-4d-v3';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_NAV = `${CACHE_VERSION}-nav`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/variables.css',
  '/assets/css/reset.css',
  '/assets/css/animations.css',
  '/assets/css/components.css',
  '/assets/css/layout.css',
  '/assets/css/dashboard.css',
  '/assets/css/forms.css',
  '/assets/css/chat.css',
  '/assets/css/recipes.css',
  '/assets/css/food-search.css',
  '/assets/css/gamification.css',
  '/assets/js/app.js',
  '/assets/js/config/firebase.js',
  '/assets/js/config/constants.js',
  '/assets/js/config/data.js',
  '/assets/js/config/colors.js',
  '/assets/js/config/n8n.js',
  '/assets/js/modules/notifications.js',
  '/assets/js/modules/offline-queue.js',
  '/assets/js/modules/components.js',
  '/assets/js/modules/navigator.js',
  '/assets/js/modules/loading-states.js',
  '/assets/js/modules/connection-indicator.js',
  '/assets/js/services/auth.js',
  '/assets/js/services/firestore.js',
  '/assets/js/utils/helpers.js',
  '/assets/js/utils/icons.js',
  '/assets/js/screens/login.js',
  '/assets/js/screens/awaiting.js',
  '/assets/js/screens/dashboard-v2.js',
  '/assets/js/screens/chat.js',
  '/assets/js/screens/forms.js',
  '/assets/js/screens/exam-upload.js',
  '/assets/js/screens/health-form.js',
  '/assets/js/screens/onboarding.js',
  '/assets/js/screens/cardapio.js',
  '/assets/js/dashboard/helpers.js',
  '/assets/js/dashboard/inicio.js',
  '/assets/js/dashboard/evolucao.js',
  '/assets/js/dashboard/receitas.js',
  '/assets/js/dashboard/exames.js',
  '/assets/js/dashboard/conquistas.js',
  '/assets/js/dashboard/chat.js',
  '/assets/js/dashboard/perfil.js',
];

/** Domínios Firebase que NUNCA devem ser cacheados (apenas rede). */
const NEVER_CACHE_DOMAINS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'cloudfunctions.net',
  'firebasestorage.googleapis.com',
];

/** Verifica se uma URL deve pular o cache */
function _shouldSkipCache(url) {
  return NEVER_CACHE_DOMAINS.some(domain => url.includes(domain));
}

// ── Install ──────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache incomplete (non-critical):', err.message);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) Firebase API — rede sempre, sem cache
  if (_shouldSkipCache(url.href)) return;

  // 2) Static assets (JS, CSS, imagens, fontes) — cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // 3) Navegação (páginas HTML, navigation requests) — network-first
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 4) Outros GETs (JSON, etc) — network-first com cache dinâmico
  if (request.method === 'GET') {
    event.respondWith(networkFirst(request).catch(() => caches.match(request)));
    return;
  }
});

// ── Helpers ──────────────────────────────────────────────

function isStaticAsset(url) {
  const path = url.pathname;
  return (
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.woff2') ||
    path.endsWith('.woff') ||
    path.endsWith('.ttf') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico') ||
    path === '/' ||
    path.endsWith('.html')
  );
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const clone = response.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
    }
    return response;
  } catch (err) {
    // Se falhou e não tem cache, retorna erro
    return new Response('Offline — recurso não disponível', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const clone = response.clone();
      const cache = await caches.open(CACHE_NAV);
      cache.put(request, clone);
    }
    return response;
  } catch (err) {
    // Fallback: tenta cache existente
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback para navegação
    if (request.mode === 'navigate') {
      return offlineFallback();
    }

    throw err;
  }
}

async function offlineFallback() {
  const cached = await caches.match('/index.html');
  if (cached) return cached;

  return new Response(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline | Programa 4D</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0f;color:#e4e4e7;text-align:center;padding:20px}div{max-width:400px}h1{font-size:48px;margin:0 0 8px}p{color:#a1a1aa;line-height:1.6}.icon{font-size:64px;margin-bottom:16px}</style></head><body><div><div class="icon">📡</div><h1>Sem Conexão</h1><p>Você está offline. Alguns dados ainda estão disponíveis, mas algumas funcionalidades podem não funcionar até reconectar.</p></div></body></html>',
    { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
  );
}
