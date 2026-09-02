const CACHE = 'flight-alert-v2';
const OFFLINE = '/offline';
const NOTIFICATION_TRANSLATIONS = '/locales/pl/service-worker.json';
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) =>
                cache.addAll([
                    OFFLINE,
                    NOTIFICATION_TRANSLATIONS,
                    '/icons/icon-192.png',
                    '/icons/notification-96.png',
                ]),
            ),
    );
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE)
                        .map((key) => caches.delete(key)),
                ),
            ),
    );
    self.clients.claim();
});
self.addEventListener('fetch', (event) => {
    if (event.request.mode !== 'navigate') return;
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
self.addEventListener('push', (event) => {
    event.waitUntil(
        (async () => {
            const response = await caches.match(NOTIFICATION_TRANSLATIONS);
            const messages = response
                ? await response.json()
                : { notification: { title: '', body: '' } };
            let data = {
                ...messages.notification,
                url: '/',
                icon: '/icons/icon-192.png',
                badge: '/icons/notification-96.png',
                tag: 'flight-alert',
            };
            try {
                data = { ...data, ...event.data.json() };
            } catch {}
            await self.registration.showNotification(data.title, {
                body: data.body,
                icon: data.icon,
                badge: data.badge,
                tag: data.tag,
                data: { url: data.url },
                renotify: false,
            });
        })(),
    );
});
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const target = new URL(
        event.notification.data?.url || '/',
        self.location.origin,
    ).href;
    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((windows) => {
                const existing = windows.find(
                    (client) => client.url === target,
                );
                return existing ? existing.focus() : clients.openWindow(target);
            }),
    );
});
