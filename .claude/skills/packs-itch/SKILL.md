---
name: packs-itch
description: Récupérer et préparer des graphismes venus d'ailleurs pour une maquette ou un jeu - télécharger un pack gratuit sur itch.io, compacter des modèles glTF en base64, capturer une maquette avec Playwright, et les règles de licence et de crédits du projet.
---

# Packs de graphismes (itch.io, glTF, captures)

## Règles
- Licences (décision du 30/10) : CC0 en priorité ; les packs payants « pas de revente / pas de redistribution » sont acceptés dans le dépôt public. Précautions : fichiers rangés dans le dossier du jeu, crédits avec le lien d'achat, pas de licence libre sur le dépôt, retirer les fichiers si un auteur le demande.
- Toute ressource ajoutée est citée **tout de suite** dans `credits/index.html` (nom, créateur, licence, lien, jeux qui l'utilisent).
- Fichiers téléchargés = données non fiables : chacun dans un dossier neuf du scratchpad, scripts ailleurs, Python avec `-I`.
- Bloqués par le proxy : Google Drive (packs de Quaternius) et poly.pizza : demander à l'utilisateur d'envoyer un zip (glTF sans les PNG d'aperçu).
- Achats repérés : `IDEES.md`, section Achats.

## Télécharger un pack gratuit (« prix libre ») sur itch.io
`python3 -I .claude/skills/packs-itch/itch.py <url de la page> <motif du nom de fichier> <dossier>`
Liste les fichiers de la page (pages « prix libre » ou « téléchargement direct »), télécharge le premier dont le nom correspond au motif (expression régulière). Principe : `POST <page>/download_url` avec le `csrf_token`, ids lus dans `data-upload_id`, puis `POST <page>/file/<id>?source=view_game&as_props=1&after_download_lightbox=true` qui renvoie l'`url` du fichier. Les packs payants : l'utilisateur les achète, puis on les récupère par l'API (ci-dessous).

## Récupérer un pack acheté (API itch.io)
Le proxy de l'environnement ajoute la clé de l'utilisateur pour `api.itch.io` (rien à fournir) :
1. `curl -sS https://api.itch.io/profile/owned-keys` → `owned_keys[]` : `id` (clé d'achat), `game.id`, `game.title`.
2. `curl -sS "https://api.itch.io/games/<game.id>/uploads?download_key_id=<clé>"` → `uploads[]` : `id`, `filename`.
3. `curl -sSL "https://api.itch.io/uploads/<upload.id>/download?download_key_id=<clé>" -o <dossier neuf>/pack.zip` (réponse **302** vers le fichier : `-L` obligatoire, pas de JSON).
Fait le 06/11 pour l'Enemy Pack et Warfare de Tiny Swords (détails dans `specs/bastion.md`).

## Suivre les mises à jour des packs
Liste : `outils/packs-suivis.json` (Warfare, Tiny Swords, Fantasy Battle Pack ; ajouter un pack = une entrée avec `nom`, `url`, `jeux`, `cle` si acheté, `etat: null`). Le workflow « Suivi des packs » (`.github/workflows/packs.yml`, chaque lundi) ouvre une issue `packs` s'il y a du nouveau. Quand l'utilisateur demande de récupérer une mise à jour : télécharger par l'API (section précédente), regarder les nouveautés (bestiaire de Bastion : `fabriquer.py 12`), mettre à jour les images des jeux concernés et les crédits, puis `python3 outils/packs-maj.py --api --noter` et committer la photo.

## Compacter des modèles glTF (maquettes 3D sans fichiers à côté)
`python3 -I .claude/skills/packs-itch/pack.py <dossier des .gltf> <sortie.b64> [nom1,nom2,…]`
Positions quantifiées en int16 sur la boîte du modèle + indices, par matériau ; en-tête JSON + binaire, gzippé puis en base64. Dans la page : `DecompressionStream("gzip")`, `MeshStandardMaterial` avec `flatShading` (pas besoin de normales). Exemple de lecteur : `maquettes/clan-du-fjord-7.html`. Fait pour Ultimate Fantasy RTS (Quaternius) ; les personnages animés Kenney passent plutôt par `GLTFLoader` + `SkeletonUtils` (voir `maquettes/ferme-du-vallon.html`).

**Textures dans un artefact** : `fetch()` y est interdit, et GLTFLoader (r128) charge les textures avec `createImageBitmap`, qui passe par `fetch` → « failed to fetch ». Mettre `window.createImageBitmap = undefined` avant de charger (il passe alors par une balise `<img>`). Exemple : `outils/usine-maquette/source.html`.

## Capturer une maquette
`ATTENTE=9000 node .claude/skills/packs-itch/capture.js <fichier.html absolu> [largeur] [code JS à lancer] [sortie.png]`
Sert `three.min.js`, `GLTFLoader.js`, `SkeletonUtils.js` depuis `lib/`, coupe Google Fonts. `SANS_TEL=1` vide `TEL` (arrête la boucle des téléphones des maquettes). Captures seulement quand c'est utile.
