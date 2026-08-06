/* Service worker de Jisho.
   Objectif : l'application doit s'ouvrir et rester pleinement utilisable
   sans réseau. Les appels à Google (identité, Drive) ne sont jamais mis
   en cache : ils échouent proprement hors ligne et la synchronisation
   reprend au retour de la connexion. */

var CACHE = "jisho-v1";

var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./fonts/spectral-latin-400-normal.woff2",
  "./fonts/spectral-latin-500-normal.woff2",
  "./fonts/spectral-latin-600-normal.woff2",
  "./fonts/spectral-latin-400-italic.woff2",
  "./fonts/noto-serif-jp-japanese-500-normal.woff2",
  "./fonts/noto-serif-jp-japanese-700-normal.woff2"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);

  /* Tout ce qui touche à Google passe directement par le réseau. */
  if (url.hostname.indexOf("google") !== -1 || url.hostname.indexOf("gstatic") !== -1) {
    return;
  }

  /* Navigation : on sert la page en cache d'abord, pour une ouverture
     instantanée et un démarrage possible en mode avion. */
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match("./index.html").then(function (hit) {
        return hit || fetch(req);
      })
    );
    return;
  }

  /* Ressources locales : cache d'abord, réseau en secours, et on
     rafraîchit silencieusement la copie en cache quand c'est possible. */
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        var live = fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, clone); });
          }
          return res;
        }).catch(function () { return hit; });
        return hit || live;
      })
    );
  }
});
