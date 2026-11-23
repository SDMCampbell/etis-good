/*
 * Offline support. Pages: network first, falling back to the cached copy.
 * Assets: network first too (fresh deploys stay consistent); cache only when offline.
 * Bump CACHE when the shell changes shape.
 */
var CACHE = "etis-shell-v49";
var SHELL = ["./", "assets/rain.css", "assets/rain.js", "assets/derive.js", "assets/resume-data.js", "assets/switcher.js", "versions/manifest.js", "timeline/", "timeline/timeline.css", "timeline/timeline.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match("./"); });
    }));
    return;
  }
  // assets: also network first, so a fresh deploy never pairs new HTML with stale JS; cache is the offline fallback
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () { return caches.match(req, { ignoreSearch: true }); }));
});
