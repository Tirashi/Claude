/* =====================================================================
   ROMET · les MACHINES et les RÈGLES d'une partie (logique pure).
   MACHINES : les 6 machines et la secrète, de la plus facile à la plus dure
   (specs/romet.md § 3) : bourse de départ, réglages de la physique, bonus,
   les 6 trésors, textes du bandeau. pret: false = pas encore construite.
   Partie : une bourse sur une machine (§ 5). On lâche une pièce (1 de la
   bourse) ; ce qui tombe à l'avant revient dans la bourse et compte dans le
   butin ; tous les `bonusTous` lâchers, un bonus tombe avec la pièce.
   Fin : bourse vide, plus de pluie, et rien n'est tombé depuis 3 secondes.
   Les événements (gain, perte, trésor, bonus, fin…) s'empilent dans evts ;
   la page les lit pour les sons et l'affichage, puis les vide.
   - Dans la page : script classique après physique.js, window.RometMachines.
   - Dans Node : require (outils/romet-simulateur.js).
   ===================================================================== */
(function (racine) {
'use strict';
const P = typeof module !== 'undefined' && module.exports ? require('./physique.js') : racine.RometPhysique;
const { DT, MAXP } = P;

// finCotes : fin des parois latérales (après, les côtés sont ouverts) ; grimpe : seuil de grimpe des pièces serrées ; miel : bande collante
// bonusTous : un bonus tous les n lâchers ; bonus : poids de tirage de chaque bonus ; murDuree : en secondes ; tresors : [nom, couleur]
// Réglages au simulateur (22/10, joueur au hasard, une pièce toutes les 0,4 s) : sans bonus la foire rend 82 % ; chaque bonus de pièces
// (géante, pluie, mur) vaut environ 8 pièces : un bonus tous les 10 lâchers rendait 130 % et la bourse ne se vidait jamais.
const MACHINES = [
  { id: 'foire', nom: 'La foire', bourse: 60, nb: 140, finCotes: 1.7, grimpe: 1.3, bonusTous: 30, murDuree: 12, bonus: { geante: 1, mur: 1, pluie: 1, tresor: 1 }, pret: true,
    tresors: [['Ours en peluche', 0xc8864a], ['Pomme d\'amour', 0xe0283a], ['Barbe à papa', 0xff9ad0], ['Ballon', 0x3b9bff], ['Cheval de bois', 0xf3e2c0], ['Étoile du manège', 0xffd23a]],
    textes: { reserve: 'Pièces', butin: 'Butin', aide: 'Touche pour lâcher une pièce', piece: 'pièce' } },
  { id: 'ruche', nom: 'La ruche', bourse: 55, nb: 140, finCotes: 1.5, grimpe: 1.15, miel: [.9, 1.9], bonusTous: 35, murDuree: 12, bonus: { geante: 1, mur: 1, pluie: 1, tresor: 1 }, pret: true,
    tresors: [['Gelée royale', 0xfff2c0], ['Pollen', 0xffd23a], ['Propolis', 0xb05a18], ['Nectar', 0xff9a3a], ['Lavande', 0xa070ff], ['Trèfle', 0xff7ab0]],
    textes: { reserve: 'Miel', butin: 'Récolte', aide: 'Touche pour lâcher une goutte', piece: 'goutte' } },
  { id: 'epave', nom: 'L\'épave', bourse: 50, pret: false, tresors: [['Perle blanche', 0xf4f0e8], ['Corail', 0xff6a4a], ['Perle noire', 0x5a5a7a], ['Aigue-marine', 0x5fe0d0], ['Rubis', 0xff2a4a], ['Émeraude', 0x2fe08a]] },
  { id: 'casino', nom: 'Le casino', bourse: 45, pret: false, tresors: [['Rubis', 0xff3b5c], ['Saphir', 0x3b7bff], ['Émeraude', 0x2fe08a], ['Topaze', 0xffc23b], ['Améthyste', 0xb45cff], ['Opale', 0xe8f4ff]] },
  { id: 'nuit', nom: 'La foire de nuit', bourse: 40, pret: false, tresors: [] },
  { id: 'horloger', nom: 'L\'horloger', bourse: 40, pret: false, tresors: [['Rubis', 0xff3b5c], ['Saphir', 0x3b7bff], ['Émeraude', 0x2fe08a], ['Topaze', 0xffc23b], ['Améthyste', 0xb45cff], ['Diamant', 0xe8f4ff]] },
  { id: 'secrete', nom: 'La machine secrète', bourse: 30, pret: false, secrete: true, tresors: [] },
];
const machine = id => MACHINES.find(m => m.id === id);
const FIN_CALME = 3;   // secondes sans rien qui tombe, bourse vide, avant la fin de partie

// m : la machine ; acquis : tableau de 6 booléens (trésors déjà gagnés, modifié ici quand on en gagne un)
// s : sauvegarde (Partie.sauver) ou rien pour une nouvelle partie ; graine : pour un nouveau tas
function Partie(m, acquis, s, graine) {
  this.m = m; this.acquis = acquis; this.evts = [];
  this.pl = new P.Plateau({ finCotes: m.finCotes, grimpe: m.grimpe, miel: m.miel }, s ? 1 : graine);
  if (s) {
    this.pl.charger(s.pl); this.bourse = s.bourse; this.butin = s.butin; this.lachers = s.lachers; this.murT = s.murT; this.pluie = s.pluie;
    this.calme = 0; this.pluieT = 0; this.fini = !!s.fini;
  } else {
    this.bourse = m.bourse; this.butin = 0; this.lachers = 0; this.murT = 0; this.pluie = 0; this.pluieT = 0; this.calme = 0; this.fini = false;
    // le tas de départ : une pièce géante, et un trésor qui manque, déjà en route
    const t = this.tresorAuHasard(), extras = [['geante', .3, 2.2]];
    if (t >= 0) extras.push(['tresor', -.8, 2.5, t]);
    this.pl.remplir(m.nb, extras);
  }
}
// un trésor au hasard parmi ceux qui manquent et ne sont pas déjà sur le plateau ; tous gagnés : n'importe lequel ; aucun libre : -1
Partie.prototype.tresorAuHasard = function () {
  const h = this.pl.h, sur = new Set(this.pl.objets.filter(o => o.type === 'tresor').map(o => o.lot));
  let l = this.acquis.map((a, i) => i).filter(i => !this.acquis[i] && !sur.has(i));
  if (!l.length) l = this.acquis.every(Boolean) ? this.acquis.map((a, i) => i) : [];
  return l.length ? l[Math.floor(h.n() * l.length)] : -1;
};
Partie.prototype.bonusAuHasard = function () {
  const b = this.m.bonus, h = this.pl.h; let tot = 0; for (const k in b) tot += b[k];
  let r = h.n() * tot; for (const k in b) { r -= b[k]; if (r < 0) return k; } return 'geante';
};
// lâcher une pièce au-dessus de x (entre -2.1 et 2.1) ; gratuit : pièce de la pluie ; renvoie false si impossible
Partie.prototype.lacher = function (x, gratuit) {
  if (this.fini) return false;
  if (!gratuit && this.bourse <= 0) return false;
  const pl = this.pl, h = pl.h;
  if (pl.objets.length >= MAXP - 4) { this.evts.push({ t: 'plein' }); return false; }
  x = Math.max(-2.1, Math.min(2.1, x));
  const o = pl.ajouter('piece', x + (h.n() - .5) * .1, 2.4, -4.6); o.vy = -2; this.calme = 0;
  if (gratuit) return true;
  this.bourse--; this.lachers++; this.evts.push({ t: 'lache' });
  if (this.lachers % this.m.bonusTous === 0) {
    let t = this.bonusAuHasard(), lot;
    if (t === 'tresor') { lot = this.tresorAuHasard(); if (lot < 0) t = 'geante'; }
    const b = pl.ajouter(t, (h.n() - .5) * 3, 2.6, -4.4, lot); b.vy = -2; this.evts.push({ t: 'bonus', type: t, lot });
  }
  return true;
};
// un pas de 1/60 s : physique, ce qui tombe, minuteries, fin de partie
Partie.prototype.pas = function () {
  if (this.fini) return;
  const pl = this.pl; pl.murs = this.murT > 0; pl.pas();
  this.calme += DT;
  if (this.murT > 0) { this.murT = Math.max(0, this.murT - DT); if (!this.murT) this.evts.push({ t: 'finMur' }); }
  if (this.pluie > 0 && (this.pluieT -= DT) <= 0) { this.pluie--; this.pluieT = .15; this.lacher((pl.h.n() - .5) * 4, true); }
  const tombes = pl.retirer();
  if (tombes) for (const o of tombes) {
    this.calme = 0; this.evts.push({ t: 'tombe', o });   // la page retire son dessin
    if (!o.gagne) { this.evts.push({ t: 'perte', type: o.type, x: o.x }); continue; }
    if (o.type === 'piece' || o.type === 'geante') { const v = o.type === 'geante' ? 10 : 1; this.butin += v; this.bourse += v; this.evts.push({ t: 'gain', v, x: o.x, type: o.type }); }
    else if (o.type === 'mur') { this.murT = this.m.murDuree || 15; this.evts.push({ t: 'mur', x: o.x }); }
    else if (o.type === 'pluie') { this.pluie += 10; this.evts.push({ t: 'pluie', x: o.x }); }
    else { const nouveau = !this.acquis[o.lot]; this.acquis[o.lot] = true; this.evts.push({ t: 'tresor', lot: o.lot, nouveau, x: o.x });
      if (nouveau && this.acquis.every(Boolean)) this.evts.push({ t: 'finie' }); }
  }
  if (this.bourse <= 0 && this.pluie <= 0 && this.calme >= FIN_CALME) { this.fini = true; this.evts.push({ t: 'fin' }); }
};
const arr = v => Math.round(v * 1000) / 1000;
Partie.prototype.sauver = function () {
  return { m: this.m.id, pl: this.pl.sauver(), bourse: this.bourse, butin: this.butin, lachers: this.lachers, murT: arr(this.murT), pluie: this.pluie, fini: this.fini };
};

const M = { MACHINES, machine, Partie, FIN_CALME };
if (typeof module !== 'undefined' && module.exports) module.exports = M; else racine.RometMachines = M;
})(typeof window !== 'undefined' ? window : globalThis);
