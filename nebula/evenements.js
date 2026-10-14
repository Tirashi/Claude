/* =====================================================================
   NEBULA · les ÉVÉNEMENTS (textes des épaves et des nébuleuses calmes).
   Des données seulement : les effets sont appliqués par regles.js
   (resolveEvent). Facile à relire et à compléter sans toucher au code.
   - Dans la page : script classique chargé avant regles.js.
   - Dans Node : require('nebula/evenements.js') (fait par regles.js).
   Un événement : { id, title, text, choices: [choix, …] } (2 ou 3 choix).
   Un choix : { label, need?: { cr?, fuel? } (sinon grisé), pay?: { cr?, fuel? } (payé en choisissant),
                outcomes: [issue, …] }   (une issue tirée au sort selon p, avec la graine de la partie)
   Une issue : { p, text, et des effets :
     cr: n ou [min, max]   crédits gagnés (ou perdus si négatif)
     fuel: n               carburant
     dmg: n                chaque vaisseau perd n de coque (jamais en dessous de 1)
     dmgOne: n             un vaisseau au hasard perd n de coque (jamais en dessous de 1)
     heal: n               chaque vaisseau répare n de coque
     mod: true             un module au hasard dans la réserve
     pilot: true | 'as'…   un pilote rejoint l'équipage (au hasard, ou celui-là)
     ship: true            un vaisseau au hasard rejoint la flotte (à moitié réparé) si elle a moins de 5 vaisseaux
     data: n               données stellaires (comptées en fin de partie)
     combat: 'contact' | 'lourd'   un combat commence (récompense normale) }
   Majuscules accentuées : la police de Nebula (Rajdhani) les affiche bien.
   ===================================================================== */
'use strict';
const NEBULA_EVENTS = {
  epaves: [
    { id: 'cargo', title: 'CARGO ÉVENTRÉ', text: 'Un cargo marchand dérive, la coque ouverte comme une boîte de conserve. Sa soute semble encore pleine.', choices: [
      { label: 'FOUILLER LA SOUTE', outcomes: [
        { p: .6, text: 'Des caisses de pièces détachées, intactes. Les revendeurs du prochain comptoir en donneront un bon prix.', cr: [30, 50] },
        { p: .4, text: 'Une mine pirate était cachée sous les caisses. L\'explosion secoue le vaisseau le plus proche.', dmgOne: 4 }] },
      { label: 'PASSER SON CHEMIN', outcomes: [{ p: 1, text: 'Mieux vaut ne pas tenter le diable. La flotte reprend sa route.' }] }] },
    { id: 'capsule', title: 'CAPSULE DE SURVIE', text: 'Une capsule clignote faiblement. À l\'intérieur, un pilote en hibernation, la combinaison couverte d\'écussons.', choices: [
      { label: 'LE RÉVEILLER', outcomes: [{ p: 1, text: 'Le pilote ouvre les yeux, encore groggy : « Vous avez besoin de quelqu\'un aux commandes ? »', pilot: true }] },
      { label: 'TOUCHER LA PRIME', outcomes: [{ p: 1, text: 'La guilde des sauveteurs paie bien les capsules rapportées. Le pilote finira sa sieste au chaud.', cr: 30 }] }] },
    { id: 'detresse', title: 'SIGNAL DE DÉTRESSE', text: 'Un appel à l\'aide, en boucle, sur la fréquence civile. La voix semble un peu trop calme.', choices: [
      { label: 'RÉPONDRE', outcomes: [
        { p: .5, text: 'Un transport en panne de réacteur. Son capitaine vous remercie avec ce qu\'il a sous la main.', cr: 40, fuel: 1 },
        { p: .5, text: 'C\'était un piège : des pirates surgissent de derrière l\'épave !', combat: 'contact' }] },
      { label: 'IGNORER', outcomes: [{ p: 1, text: 'Le signal s\'éteint derrière vous. Vous ne saurez jamais.' }] }] },
    { id: 'balise', title: 'BALISE ÉTEINTE', text: 'Une balise de navigation, muette. Ses réservoirs de secours sont encore pleins, mais son circuit est grillé.', choices: [
      { label: 'LA RÉPARER (15 CR)', need: { cr: 15 }, pay: { cr: 15 }, outcomes: [{ p: 1, text: 'La balise se rallume. Les gardiens du secteur vous laissent puiser dans ses réservoirs.', fuel: 2 }] },
      { label: 'LA DÉMONTER', outcomes: [
        { p: .6, text: 'Le cœur de la balise contient un module de bonne facture.', mod: true },
        { p: .4, text: 'Un court-circuit ! Une décharge traverse le vaisseau qui l\'avait arrimée.', dmgOne: 2 }] },
      { label: 'PASSER', outcomes: [{ p: 1, text: 'La balise reste éteinte. Un autre s\'en chargera.' }] }] },
    { id: 'chantier', title: 'CHANTIER ABANDONNÉ', text: 'Un chantier naval désert, ses grues figées. Des plaques de blindage traînent encore sur les quais.', choices: [
      { label: 'RÉCUPÉRER LES PLAQUES', outcomes: [{ p: 1, text: 'Les mécaniciens rafistolent toute la flotte avec les plaques.', heal: 3 }] },
      { label: 'FOUILLER LES ATELIERS', outcomes: [
        { p: .6, text: 'Dans un casier oublié : un module encore sous emballage.', mod: true },
        { p: .4, text: 'Les ateliers ont été pillés depuis longtemps. Rien à prendre.' }] }] },
    { id: 'pirate', title: 'ÉPAVE PIRATE', text: 'Un intercepteur pirate, éventré par un tir. Son coffre de bord est verrouillé.', choices: [
      { label: 'FORCER LE COFFRE', outcomes: [
        { p: .55, text: 'Le butin d\'un pillage récent. Il change de mains.', cr: [50, 70] },
        { p: .45, text: 'Le coffre était piégé : une onde de choc balaie toute la flotte.', dmg: 2 }] },
      { label: 'SIPHONNER LES RÉSERVOIRS', outcomes: [{ p: 1, text: 'Les réservoirs de l\'épave n\'étaient pas vides.', fuel: 1 }] }] },
    { id: 'fantome', title: 'VAISSEAU FANTÔME', text: 'Un vaisseau intact, sans équipage, moteurs coupés. Le remorquer coûterait du carburant.', choices: [
      { label: 'LE REMORQUER (1 CARBURANT)', need: { fuel: 1 }, pay: { fuel: 1 }, outcomes: [{ p: 1, text: 'Après un nettoyage complet, il rejoint la flotte (à moitié réparé). Si la flotte est pleine, il est revendu en pièces.', ship: true }] },
      { label: 'LE LAISSER', outcomes: [{ p: 1, text: 'Le vaisseau fantôme continue sa dérive silencieuse.' }] }] },
    { id: 'debris', title: 'NUAGE DE DÉBRIS', text: 'Le passage vers la balise suivante est encombré de débris. Les contourner prendra du temps.', choices: [
      { label: 'CONTOURNER (1 CARBURANT)', need: { fuel: 1 }, pay: { fuel: 1 }, outcomes: [{ p: 1, text: 'Un long détour, mais pas une égratignure.' }] },
      { label: 'FONCER', outcomes: [{ p: 1, text: 'Les débris martèlent les coques. Ça passe, mais ça laisse des traces.', dmg: 2 }] }] },
    { id: 'contrebande', title: 'CONTREBANDIERS', text: 'Deux transports aux feux éteints. Leur chef propose un marché, la main sur ses canons.', choices: [
      { label: 'ACHETER (30 CR)', need: { cr: 30 }, pay: { cr: 30 }, outcomes: [{ p: 1, text: 'Une caisse change de soute : un module, pas tout à fait légal.', mod: true }] },
      { label: 'LES ARRAISONNER', outcomes: [{ p: 1, text: 'Les contrebandiers appellent leurs amis pirates à la rescousse !', combat: 'contact' }] },
      { label: 'LES LAISSER FILER', outcomes: [{ p: 1, text: 'Chacun repart de son côté, sans un mot.' }] }] },
    { id: 'medicale', title: 'STATION MÉDICALE', text: 'Une petite station neutre, tenue par des mécaniciens et des médecins. Elle accueille tout le monde, contre paiement.', choices: [
      { label: 'RÉPARATIONS (20 CR)', need: { cr: 20 }, pay: { cr: 20 }, outcomes: [{ p: 1, text: 'Les équipes de la station remettent la flotte en état.', heal: 4 }] },
      { label: 'ENGAGER UN MÉCANO (25 CR)', need: { cr: 25 }, pay: { cr: 25 }, outcomes: [{ p: 1, text: 'Une mécanicienne de la station rejoint l\'équipage.', pilot: 'mecano' }] },
      { label: 'REPARTIR', outcomes: [{ p: 1, text: 'Vous saluez la station et reprenez la route.' }] }] },
    { id: 'mines', title: 'CHAMP DE MINES', text: 'Un vieux champ de mines barre la route. Certaines sont encore armées, d\'autres cachent des pièces de valeur.', choices: [
      { label: 'DÉSAMORCER', outcomes: [
        { p: .6, text: 'Travail d\'orfèvre : les mécanismes récupérés font un excellent module.', mod: true },
        { p: .4, text: 'Une mine se réveille et explose contre une coque.', dmgOne: 5 }] },
      { label: 'CONTOURNER (1 CARBURANT)', need: { fuel: 1 }, pay: { fuel: 1 }, outcomes: [{ p: 1, text: 'Le détour est long, mais sûr.' }] }] },
    { id: 'archives', title: 'ARCHIVES STELLAIRES', text: 'Une sonde d\'exploration, vieille de deux siècles. Sa mémoire contient des cartes des secteurs lointains.', choices: [
      { label: 'COPIER LES CARTES', outcomes: [{ p: 1, text: 'Des relevés précieux pour les prochaines expéditions.', data: 6 }] },
      { label: 'REVENDRE LA SONDE', outcomes: [{ p: 1, text: 'Un collectionneur la rachète sans discuter le prix.', cr: 35 }] }] },
    { id: 'veteran', title: 'LE VIEUX PILOTE', text: 'Sur une épave transformée en bar, un pilote aux cheveux blancs raconte ses batailles à qui veut l\'entendre.', choices: [
      { label: 'L\'ENGAGER (40 CR)', need: { cr: 40 }, pay: { cr: 40 }, outcomes: [{ p: 1, text: '« Une dernière campagne, alors. » Il ramasse son casque.', pilot: 'veteran' }] },
      { label: 'ÉCOUTER SES HISTOIRES', outcomes: [{ p: 1, text: 'Il connaît les routes des pirates comme sa poche.', data: 3, fuel: 1 }] }] },
  ],
  // nébuleuse calme (l'autre moitié du temps, la nébuleuse cache un combat)
  nebuleuses: [
    { id: 'courants', title: 'COURANTS IONIQUES', text: 'La brume est traversée de courants lumineux. Les capteurs grésillent, mais la mer est calme.', choices: [
      { label: 'SE LAISSER PORTER', outcomes: [{ p: 1, text: 'Les courants poussent la flotte sans brûler une goutte de carburant.', fuel: 1 }] },
      { label: 'RECHARGER LES BATTERIES', outcomes: [{ p: 1, text: 'L\'énergie des courants alimente les ateliers de bord.', heal: 2 }] }] },
    { id: 'lueurs', title: 'LUEURS DANS LA BRUME', text: 'Des lueurs régulières, au cœur de la nébuleuse. Une cachette ? Un phare ? Des yeux ?', choices: [
      { label: 'LES SUIVRE', outcomes: [
        { p: .5, text: 'Une cache de contrebandiers, abandonnée. Le butin est à vous.', cr: [40, 60] },
        { p: .5, text: 'Les lueurs étaient des réacteurs pirates. Ils vous attendaient.', combat: 'contact' }] },
      { label: 'LES ÉVITER', outcomes: [{ p: 1, text: 'Vous gardez vos distances. Les lueurs s\'éteignent une à une.' }] }] },
    { id: 'calme', title: 'CALME PLAT', text: 'Au centre de la nébuleuse, aucun pirate ne s\'aventure. L\'équipage souffle enfin.', choices: [
      { label: 'RÉPARATIONS', outcomes: [{ p: 1, text: 'Toute la flotte profite de l\'accalmie pour réparer.', heal: 3 }] },
      { label: 'CARTOGRAPHIER', outcomes: [{ p: 1, text: 'Les relevés de la nébuleuse serviront aux prochaines expéditions.', data: 4 }] }] },
    { id: 'chant', title: 'LE CHANT DES ÉTOILES', text: 'Les radios captent une mélodie étrange, venue de la brume. Un pilote perdu y répond depuis des années.', choices: [
      { label: 'LE GUIDER JUSQU\'À VOUS', outcomes: [{ p: 1, text: 'Le pilote rejoint la flotte, reconnaissant.', pilot: true }] },
      { label: 'ENREGISTRER LE CHANT', outcomes: [{ p: 1, text: 'Les collectionneurs de signaux paient cher ce genre d\'enregistrement.', cr: 30 }] }] },
  ],
};
if (typeof window !== 'undefined') window.NEBULA_EVENTS = NEBULA_EVENTS;
if (typeof module !== 'undefined') module.exports = NEBULA_EVENTS;
