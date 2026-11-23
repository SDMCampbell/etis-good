// The old site installed an offline service worker. This replacement removes it for returning visitors:
// it clears the old caches and unregisters itself, so the browser goes back to loading the site normally.
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.registration.unregister(); }));
});
