/* ============================================================================
   Service Worker — para que el juego funcione sin internet
   (todo menos el reconocimiento de voz, que necesita conexión en Android)
   ========================================================================== */

var CACHE = "blockquest-v2";

var ARCHIVOS = [
  "./",
  "./index.html",
  "./css/estilo.css",
  "./js/config.js",
  "./js/efectos.js",
  "./js/datos.js",
  "./js/nucleo.js",
  "./js/juegos.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./iconos/icono.svg",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png"
];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) {
      // addAll falla entero si un archivo falla: se agregan de a uno
      return Promise.all(ARCHIVOS.map(function (u) {
        return c.add(u).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (llaves) {
      return Promise.all(llaves.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);

  // Supabase y reconocimiento de voz: siempre de la red, nunca del caché
  if (url.hostname.indexOf("supabase") >= 0) return;

  // fuentes de Google: caché primero, es lo que más pesa
  if (url.hostname.indexOf("fonts.g") >= 0) {
    ev.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          var copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
          return res;
        }).catch(function () { return hit; });
      })
    );
    return;
  }

  // propio: red primero (para ver los cambios), caché de respaldo
  if (url.origin === location.origin) {
    ev.respondWith(
      fetch(req).then(function (res) {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
  }
});
