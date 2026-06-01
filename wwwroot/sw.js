/* SAP TAG · Service Worker */
const CACHE_NAME = 'sap-tag-v1';

const SHELL_ASSETS = [
    '/',
    '/css/app.css',
    '/js/app.js',
    '/manifest.json'
];

// Instalar: cachear el shell de la app
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activar: limpiar caches antiguas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: network-first para /api/*, cache-first para assets
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Las llamadas a la API siempre van a la red (nunca cache)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Assets: cache first, fallback a red
    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                // Guardar en cache si es una respuesta válida
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});
