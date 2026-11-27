# Serveur tirashi.fr (VPS) — réflexions et décisions

Chantier de réflexion (conversations du 20/11 au 25/11/2026). Rien n'est commandé ni installé : l'utilisateur prendra le VPS **plus tard**. Ce fichier deviendra le cahier des charges et le guide d'installation.

## 1. Le serveur
- **Forfait choisi : OVH VPS-2** (offre 2027 : 4 vCores, 8 Go, 75 Go NVMe, sauvegarde quotidienne, trafic illimité, environ 8,65 € TTC par mois « à partir de », à vérifier selon la durée d'engagement).
  - VPS-1 (2 cœurs, 4 Go, 40 Go) suffirait, mais le disque serait juste.
  - VPS-3 et VPS-4 sont inutiles pour nous.
- Ubuntu 24.04, centre de données en France (Gravelines ou Strasbourg), clé SSH ajoutée dès la commande.
- **Usages prévus** : multijoueur coop (2 à 6 joueurs, WebSocket : `ws` ou Colyseus), notifications (Web Push), PostgreSQL, un MCP maison, des petits projets à côté (ex. Cairn, météo).

## 2. Organisation
- **Docker Compose** : un service par projet, isolés les uns des autres.
- **Caddy** devant : HTTPS automatique et un sous-domaine par application.
- Code du serveur dans un dossier `serveur/` (Compose, Caddy, MCP, schéma SQL).
- **Déploiement par la CI GitHub** à chaque push sur main : Claude ne peut pas se connecter lui-même au VPS.
- Entretien : mises à jour de sécurité automatiques, pare-feu (22, 80, 443), fail2ban, `pg_dump` chaque nuit copié hors du VPS.

## 3. Nom de domaine et adresses
- Domaine envisagé : **tirashi.fr**, avec une ligne DNS « joker » `*.tirashi.fr` qui pointe vers le VPS.
- Un sous-domaine par application : `ludotheque.tirashi.fr`, `cairn.tirashi.fr`, `meteo.tirashi.fr`…
- **Chaque sous-domaine est un site à part** pour le navigateur. Chacun a donc :
  - sa propre installation PWA ;
  - son propre service worker ;
  - ses propres données locales ;
  - ses propres notifications. Exemple : une alerte météo n'est envoyée qu'aux abonnés de `meteo.tirashi.fr`, pas à ceux de Cairn.
- **Dépôts** : un dépôt par **famille** de projets. La Ludothèque garde le sien ; Cairn et la météo peuvent partager un dépôt s'ils partagent du code. L'adresse ne dépend pas du dépôt : un dépôt peut publier plusieurs applications.
- La Ludothèque peut aussi rester sur GitHub Pages avec l'adresse `ludotheque.tirashi.fr` (gratuit, rien sur le VPS).

## 4. PostgreSQL et MCP maison
- **PostgreSQL** dans Docker, **port 5432 jamais ouvert sur Internet**. Une base ou un schéma par projet.
- **MCP maison** en HTTP (transport « Streamable HTTP »), servi en HTTPS sur `mcp.tirashi.fr`.
- **Outils précis seulement** :
  - lister les tables ;
  - lire les classements ;
  - requête en lecture seule ;
  - ajouter une partie ;
  - côté serveur : état (processeur, mémoire, disque, services), journaux, redémarrer un service de la liste, déployer, sauvegarder et restaurer.
- **Jamais** de SQL libre ni de terminal root par le MCP. Il tourne sous un utilisateur sans droits root, avec un rôle Postgres limité.
- **Branchement à Claude** :
  1. d'abord un fichier `.mcp.json` dans le dépôt, avec la clé enregistrée sur l'environnement cloud (le proxy l'ajoute aux requêtes, elle n'est ni dans le dépôt ni dans la conversation) ;
  2. plus tard, un connecteur personnalisé sur claude.ai (il demande de gérer OAuth).
- **Intérêt** : de vraies données de parties pour l'équilibrage, un remplaçant possible de Supabase à terme, une base pour le multijoueur (salons, comptes, sauvegardes).
- Secrets (mot de passe de la base, `.env`) : uniquement sur le VPS, **jamais** dans le dépôt ni dans la conversation.

## 5. Déménagement des sauvegardes de la Ludothèque
- **Le problème** : en passant de `tirashi.github.io/Claude` à `ludotheque.tirashi.fr`, les données locales ne suivent pas toutes seules. Seule l'ancienne adresse peut lire ses propres sauvegardes.
- **Solution simple** : un bouton « DEMENAGER » dans l'ancienne version ouvre la nouvelle adresse et lui passe les sauvegardes, d'une page à l'autre dans le téléphone, sans serveur. C'est le transfert `LUDO1-` sans copier-coller.
- **Solution avec comptes** : on se connecte, les sauvegardes partent sur le compte. C'est le début d'une synchronisation téléphone et PC et de sauvegardes en ligne ; un compte pourrait remplacer le code de compte des classements.
- **Ordre à respecter** :
  1. publier le bouton sur GitHub Pages et attendre la mise à jour de l'appli installée ;
  2. installer la nouvelle adresse ;
  3. transférer, puis vérifier dans la nouvelle appli ;
  4. laisser l'ancienne adresse en ligne avec « LA LUDOTHEQUE A DEMENAGE ».

## 6. Façon de développer (décision du 20/11)
- On **reste en HTML et JavaScript vanilla, sans build**. Le VPS n'accélère pas l'écriture des jeux ; il ouvre le multijoueur, les notifications et les données.
- **GameMaker écarté** :
  - Claude ne pourrait plus compiler ni tester : il faut l'éditeur sur Windows ou Mac, et son MCP tourne sur le PC ;
  - on perdrait le « sans build », l'intégration à la Ludothèque et la CI ;
  - l'export HTML5 est plus lourd sur mobile.
- **Phaser** (un seul fichier, chargé avec `<script>`) reste en réserve pour un futur gros jeu d'action.
- Continuer à mutualiser dans `commun/` et `moteur-rpg/`, et découper les gros jeux en plusieurs scripts.

## 7. Étapes quand le VPS sera commandé
1. Créer la clé SSH sur le PC (PowerShell), commander le VPS-2 avec cette clé.
2. Sécuriser : utilisateur, connexion root et mots de passe interdits, pare-feu, fail2ban, mises à jour automatiques.
3. Installer Docker et Caddy.
4. Domaine `tirashi.fr` et DNS joker, HTTPS.
5. PostgreSQL et le MCP, branché à Claude, premier test.
6. Déploiement par la CI.
7. Multijoueur coop, puis notifications, puis déménagement de la Ludothèque (si on le décide).

Pendant le guidage : l'utilisateur tape les commandes et colle les sorties, mais **jamais** une clé privée, un mot de passe ni un `.env`.
