/* Service worker de la Ludothèque.
   - Au premier passage, met tous les jeux en cache : ils marchent ensuite hors connexion.
   - Les fichiers du site passent toujours d'abord par le réseau : en ligne, on reçoit
     la dernière version publiée ; hors ligne, on retombe sur la copie en cache.
   - Changer VERSION quand on ajoute ou renomme des fichiers, pour refaire le préchargement. */
const VERSION = "ludotheque-v2";
const FONTS = "ludotheque-fonts";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png",
  "./queens/index.html", "./picross/index.html", "./injagility/index.html", "./touche-coule/index.html",
  "./tetris/index.html", "./snake/index.html", "./asteroids/index.html", "./solitaire/index.html",
  "./jeu-de-la-vie/index.html", "./jeu-de-la-vie/style.css", "./jeu-de-la-vie/app.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Polices Google : le cache d'abord, rafraîchi en arrière-plan
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Fichiers du site : le réseau d'abord, la copie en cache si on est hors ligne
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true })
        || (url.pathname.endsWith("/") && await cache.match(new Request(url.href + "index.html")))
        || (req.mode === "navigate" && await cache.match("./index.html"));
      if (hit) return hit;
      throw err;
    }
  })());
});
