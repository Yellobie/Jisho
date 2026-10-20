/* Service worker de Jisho.
   Objectif : l'application doit s'ouvrir et rester pleinement utilisable
   sans réseau. Les appels à Google (identité, Drive) ne sont jamais mis
   en cache : ils échouent proprement hors ligne et la synchronisation
   reprend au retour de la connexion. */

var CACHE = "jisho-v4";

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

  /* Navigation : réseau d'abord, avec un délai court, puis le cache.
     Servir le cache en priorité figerait la version installée tant que
     la version du cache n'est pas changée à la main ; ainsi une mise en
     ligne est prise en compte au rechargement suivant, et le mode avion
     reste instantané puisque la requête échoue aussitôt. */
  if (req.mode === "navigate") {
    e.respondWith(
      new Promise(function (resolve) {
        var settled = false;
        var fallback = setTimeout(function () {
          if (settled) return;
          settled = true;
          caches.match("./index.html").then(function (hit) {
            resolve(hit || fetch(req));
          });
        }, 2500);

        fetch(req).then(function (res) {
          if (settled) return;
          settled = true;
          clearTimeout(fallback);
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put("./index.html", clone); });
          }
          resolve(res);
        }).catch(function () {
          if (settled) return;
          settled = true;
          clearTimeout(fallback);
          caches.match("./index.html").then(function (hit) {
            resolve(hit || new Response("Hors ligne", { status: 503 }));
          });
        });
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
