self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => caches.delete(cache))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png', // Small white icon for Android status bar
      vibrate: [200, 100, 200, 100, 200], // Stronger vibration often triggers heads-up
      requireInteraction: true, // Keep it visible until dismissed
      tag: 'muell-reminder', // Static tag so renotify actually triggers a new alert for the same type
      renotify: true, // Forces an alert/banner even if one is already showing
      visibility: 'public', // Forces visibility on the lock screen (overrides "hide sensitive content" in some Android versions)
      timestamp: Date.now(), // Helps Android prioritize it as a "new" event
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
