/* Service worker de la Ludothèque.
   - Au premier passage, met tous les jeux en cache : ils marchent ensuite hors connexion.
   - Les fichiers du site passent d'abord par le réseau : en ligne, on reçoit la dernière
     version publiée ; hors ligne, on retombe sur la copie en cache. Sur un réseau lent
     (pas de réponse en NET_WAIT ms), on sert tout de suite la copie en cache : la réponse
     du réseau, quand elle arrive, met le cache à jour pour la prochaine ouverture. Après un
     tel retard, les fichiers suivants (scripts, polices…) sont servis du cache sans attendre
     pendant 10 s : la page ne s'ouvre pas étage par étage.
   - Le cache HTTP du navigateur est contourné (préchargement en « reload », réseau en « no-cache ») :
     une page neuve ne doit jamais tourner avec un script partagé resté ancien.
   - Changer VERSION quand on ajoute ou renomme des fichiers, pour refaire le préchargement. */
const VERSION = "ludotheque-v44";
const NET_WAIT = 2500;
let slowUntil = 0;   // réseau jugé lent : pendant 10 s, les copies en cache sont servies sans attendre
const FONTS = "ludotheque-fonts";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest", "./ludo-scores.js", "./icones.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-32.png",
  "./queens/index.html", "./picross/index.html", "./injagility/index.html", "./injagility/parcours.html", "./injagility/chiens32.js", "./touche-coule/index.html", "./amiral/index.html", "./escadrille/index.html", "./escadrille/avions.js", "./escadrille/sol.js", "./club/index.html", "./orbite/index.html", "./lune-rover/index.html", "./lune-rover/regles.js", "./polices/lune-rover.css", "./polices/luckiest-guy.woff2", "./polices/fredoka.woff2", "./pont-stellaire/index.html", "./sudoku/index.html", "./calculator/index.html", "./alunissage/index.html", "./nebula/index.html", "./nebula/vaisseaux.js", "./nebula/regles.js", "./nebula/evenements.js", "./nebula/sons.js", "./nebula/cartouche.jpg", "./ile/index.html", "./ile/regles.js", "./duche/regles.js", "./duche/evenements.js", "./duche/ia.js",
  "./polices/nebula.css", "./polices/michroma.woff2", "./polices/rajdhani-500.woff2", "./polices/rajdhani-600.woff2", "./polices/rajdhani-700.woff2", "./polices/share-tech-mono.woff2",
  "./lignee/index.html", "./classements/index.html", "./tetris/index.html", "./snake/index.html", "./asteroids/index.html", "./solitaire/index.html",
  "./jeu-de-la-vie/index.html", "./jeu-de-la-vie/style.css", "./jeu-de-la-vie/app.js",
  "./empilage/index.html", "./lib/three.min.js", "./polices/empilage.css",
  "./odyssee/index.html", "./odyssee/regles.js", "./odyssee/sons.js",
  "./yams/index.html", "./lib/cannon.min.js",
  "./mot-d-or/index.html", "./mot-d-or/mots.js", "./mot-d-or/jeu.js", "./capitaine-du-port/index.html", "./capitaine-du-port/style.css", "./capitaine-du-port/regles.js", "./capitaine-du-port/niveaux.js", "./capitaine-du-port/decor.js", "./capitaine-du-port/jeu.js", "./capitaine-du-port/sons.js", "./magasinier/index.html", "./magasinier/style.css", "./magasinier/regles.js", "./magasinier/niveaux.js", "./magasinier/sons.js", "./magasinier/docker.js", "./magasinier/scene.js", "./magasinier/jeu.js",
  "./accueil.css", "./accueil.js", "./alunissage/jeu.js", "./amiral/jeu.js", "./calculator/jeu.js", "./calculator/style.css", "./club/jeu.js", "./escadrille/jeu.js", "./ile/jeu.js", "./ile/style.css", "./injagility/jeu.js", "./injagility/parcours.css", "./injagility/parcours.js", "./injagility/style.css", "./lignee/jeu.js", "./lignee/style.css", "./lune-rover/jeu.js", "./nebula/jeu.js", "./odyssee/jeu.js", "./odyssee/style.css", "./orbite/jeu.js", "./picross/dessins.js", "./picross/jeu.js", "./picross/style.css", "./pont-stellaire/jeu.js", "./queens/jeu.js", "./queens/style.css", "./solitaire/jeu.js", "./solitaire/style.css", "./sudoku/jeu.js", "./touche-coule/jeu.js", "./touche-coule/style.css", "./yams/jeu.js", "./yams/style.css"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
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

  // Fichiers du site : le réseau d'abord ; la copie en cache si on est hors ligne ou si le réseau traîne
  // « no-cache » : le navigateur redemande toujours au serveur (sinon un fichier pouvait rester vieux de 10 min
  // pendant que la page, elle, était neuve : icône absente de la cartouche de Calculator le 16/10)
  const net = fetch(req, { cache: "no-cache" }).then(async res => {
    if (res && res.ok) { const cache = await caches.open(VERSION); await cache.put(req, res.clone()); }
    return res;
  });
  event.waitUntil(net.catch(() => {}));   // laisser la mise à jour du cache se terminer
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true })
      || (url.pathname.endsWith("/") && await cache.match(new Request(url.href + "index.html")));
    // page absente du cache (un jeu tout neuf) : on attend le réseau ; hors connexion seulement, on renvoie
    // vers l'accueil, à sa vraie adresse (servi à la place de la page, ses chemins relatifs ne marchaient pas :
    // accueil vide en ouvrant odyssee/ le 17/10)
    if (!hit && req.mode === "navigate") return net.catch(async () => (await cache.match("./index.html")) ? Response.redirect(new URL("./index.html", self.registration.scope).href, 302) : Response.error());
    if (!hit) return net;
    if (Date.now() < slowUntil) return hit;
    let done = false;
    const fresh = net.then(res => { done = true; return res && res.ok ? res : hit; }, () => { done = true; return hit; });
    const slow = new Promise(resolve => setTimeout(() => { if (!done) slowUntil = Date.now() + 10000; resolve(hit); }, NET_WAIT));
    return Promise.race([fresh, slow]);
  })());
});
