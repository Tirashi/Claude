/* =====================================================================
   LA BOUTIQUE DE CARTES · la PREMIÈRE SEMAINE GUIDÉE (demande du 23/10 :
   « le jeu n'est pas facile à comprendre »). Marco, l'ancien patron,
   montre pas à pas : commander, ouvrir un booster, les vitrines, ouvrir
   la boutique, le bilan. Le bouton à toucher clignote en doré ; chaque
   étape passe toute seule quand le joueur l'a faite. On peut le passer.
   Lancé à la première partie (boutique.guide), ou par le menu le lundi.
   BouGuide(ctx) : ctx = { etat(), lundi, fini() }.
   ===================================================================== */
'use strict';
function BouGuide(ctx) {
  const $ = id => document.getElementById(id);
  const commande = e => e.commandes.some(c => /^(booster|presentoir):/.test(c.cle));
  // chaque étape : le texte, le bouton qui clignote (cible), et quand elle est faite (fait) ; sans « fait », un bouton SUIVANT
  const ETAPES = [
    { t: 'Bienvenue dans ta boutique ! Je suis Marco, l\'ancien patron. Tu as <b>un an</b> pour en faire la meilleure de la ville. C\'est <b>lundi</b> : la boutique est fermée, on prépare la semaine.' },
    { t: 'D\'abord, on commande des boosters pour la semaine. Touche <b>GROSSISTE</b>.', cible: '[data-ecran=grossiste]', fait: (e, L) => L.ecran === 'grossiste' || commande(e) },
    { t: 'Touche <b>+</b> à côté de « Booster » : 6 boosters à 2,50 €. Ils arrivent <b>tout de suite</b> dans ton stock.', cible: '[data-act=plus][data-cle^="booster:"]', fait: e => commande(e) },
    { t: 'C\'est commandé ! Touche <b>OK</b> pour revenir à la boutique.', cible: '#pFermer', fait: (e, L) => !L.ouvert },
    { t: 'Tu as déjà des boosters en stock. Un booster fermé se vend sans risque… mais <b>ouvert</b>, il peut cacher une carte de valeur ! Touche <b>BOOSTERS</b>.', cible: '[data-ecran=boosters]', fait: (e, L) => L.ecran === 'boosters' || L.booster },
    { t: 'Touche <b>OUVRIR</b>.', cible: '[data-act=ouvrir]', fait: (e, L) => L.booster },
    { t: 'Touche le paquet, puis retourne les 5 cartes. À la fin, choisis <b>EN VITRINE</b> : les clients pourront les acheter.', haut: true, cible: '#bVitrine', cache: () => $('paquet').classList.contains('ouvert'), fait: (e, L) => !L.booster },
    { t: 'Bravo ! Touche <b>OK</b> si besoin, puis va voir tes <b>VITRINES</b>.', cible: '#pFermer, [data-ecran=vitrines]', fait: (e, L) => L.ecran === 'vitrines' },
    { t: 'Chaque carte a une <b>cote</b> (sa valeur). Touche une carte pour changer son prix : trop cher, personne ne l\'achète. Touche <b>OK</b> quand tu as fini.', cible: '#pFermer', fait: (e, L) => !L.ouvert },
    { t: 'Les <b>RAYONS</b> vendent les boosters fermés, et <b>AMÉNAGER</b> sert à acheter des meubles. On verra ça plus tard. Prêt ? Touche <b>OUVRIR LA BOUTIQUE</b> !', cible: '#bOuvrir', fait: e => e.phase !== 'lundi' },
    { t: 'Du mardi au samedi, les clients entrent, choisissent et paient à la caisse. Touche <b>×1</b> pour aller plus vite. Parfois, un visiteur te propose une affaire : à toi de décider !', cible: '#bVitesse', fait: e => e.phase === 'lundi' && e.semaine > 1 },
    { t: 'Voilà ta première semaine ! Chaque lundi : <b>commande</b>, <b>ouvre</b>, <b>range</b>, <b>ouvre la boutique</b>. N\'oublie pas : la banque t\'a prêté 2 000 € à rendre avant la semaine 26 (touche la caisse en haut). Bonne chance !' },
  ];
  let k = -1, minuteur = null;
  const bulle = $('guide');
  function montrer() {
    const E = ETAPES[k];
    bulle.innerHTML = '<b class="qui">MARCO</b><p>' + E.t + '</p><div class="gb">' + (k < ETAPES.length - 1 ? '<button class="lien" id="gPasser">Passer le guide</button>' : '') +
      (E.fait ? '' : '<button class="vert" id="gSuite">' + (k === ETAPES.length - 1 ? 'À MOI DE JOUER !' : 'SUIVANT') + '</button>') + '</div>';
    bulle.classList.toggle('haut', !!E.haut);
    bulle.hidden = false;
    if ($('gPasser')) $('gPasser').onclick = arreter;
    if ($('gSuite')) $('gSuite').onclick = () => suivante();
  }
  function suivante() { k++; if (k >= ETAPES.length) return arreter(); montrer(); }
  function tic() {
    const E = ETAPES[k], e = ctx.etat();
    document.querySelectorAll('.guide-cible').forEach(x => { if (!E || !E.cible || !x.matches(E.cible)) x.classList.remove('guide-cible'); });
    if (!E) return;
    // la bulle se cache derrière une fenêtre (rencontre, bilan) ; elle revient après
    bulle.style.visibility = $('voile').hidden && !(E.cache && E.cache()) ? '' : 'hidden';
    if (E.cible) document.querySelectorAll(E.cible).forEach(c => c.classList.add('guide-cible'));
    if (E.fait && E.fait(e, ctx.lundi)) suivante();
  }
  function lancer() { arreter(true); k = -1; suivante(); minuteur = setInterval(tic, 250); }
  function arreter(silence) {
    clearInterval(minuteur); minuteur = null; k = -1; bulle.hidden = true;
    document.querySelectorAll('.guide-cible').forEach(x => x.classList.remove('guide-cible'));
    if (silence !== true) ctx.fini();
  }
  return { lancer, arreter: () => arreter(true), get actif() { return k >= 0; } };
}
