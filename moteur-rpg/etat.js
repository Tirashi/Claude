/* Moteur RPG — état de la partie et sauvegardes (testable sous Node, sans DOM).
   L'état est un objet JSON simple : équipe, héros, objets, écus, drapeaux, position sur la carte.
   Trois emplacements de partie ; dans chacun, trois copies :
     - « auto »    : sauvegarde automatique aux moments clés ;
     - « main »    : sauvegarde faite à une lanterne ;
     - « reprise » : copie gardée à chaque changement de carte, seulement pour rouvrir le jeu là où on l'a quitté.
   Après une défaite, on repart de la plus récente entre « auto » et « main » (jamais de « reprise »). */
(function (M) {
  const VERSION = 2;   // 2 : équipement et états des héros
  const MAX_OBJET = 8;   // on ne porte pas plus de 8 exemplaires d'un même objet

  const copie = o => JSON.parse(JSON.stringify(o));

  // jeu : les données du jeu (classes, heros, depart). nom : le nom choisi pour le héros.
  function nouvellePartie(jeu, nom) {
    const d = jeu.depart;
    const e = {
      v: VERSION, nom, chapitre: d.chapitre || '', lieu: '',
      equipe: d.equipe.slice(), heros: {}, objets: {}, ecus: d.ecus || 0,
      drapeaux: {}, carte: d.carte, x: d.x, y: d.y, dir: d.dir || 'bas', temps: 0
    };
    for (const id in jeu.heros) e.heros[id] = M.Regles.creerHeros(jeu, id, d.niveau || 1);
    for (const k in d.objets || {}) donner(e, k, d.objets[k]);
    return e;
  }

  // ajoute les champs des versions suivantes à une vieille partie (jeu : pour l'équipement de départ)
  function migrer(e, jeu) {
    if (!e || typeof e !== 'object' || !e.heros) return null;
    if ((e.v || 1) < 2) for (const id in e.heros) {
      const h = e.heros[id];
      h.equipement = h.equipement || Object.assign({ arme: null, armure: null, accessoire: null }, (jeu && jeu.heros[id] && jeu.heros[id].equipement) || {});
      h.etats = h.etats || {};
    }
    e.v = VERSION;
    return e;
  }

  function donner(e, objet, n = 1) {
    const avant = e.objets[objet] || 0, apres = Math.min(MAX_OBJET, avant + n);
    e.objets[objet] = apres;
    return apres - avant;   // combien on a vraiment reçu
  }
  function prendre(e, objet, n = 1) {
    if ((e.objets[objet] || 0) < n) return false;
    e.objets[objet] -= n;
    if (!e.objets[objet]) delete e.objets[objet];
    return true;
  }
  function combien(e, objet) { return e.objets[objet] || 0; }

  function drapeau(e, nom, valeur = true) { if (valeur === false || valeur === null) delete e.drapeaux[nom]; else e.drapeaux[nom] = valeur; }
  function lireDrapeau(e, nom) { return e.drapeaux[nom]; }

  function rejoindre(e, id) { if (!e.equipe.includes(id)) e.equipe.push(id); }
  function quitter(e, id) { e.equipe = e.equipe.filter(x => x !== id); }

  // soigne toute l'équipe (lanterne) : PV et PM au maximum, les héros à terre se relèvent
  function soigner(e) { for (const id of e.equipe) { const h = e.heros[id]; h.pv = h.pvMax; h.pm = h.pmMax; h.etats = {}; } }

  // porter un objet : l'ancien revient dans le sac ; id null : enlever
  function equiper(e, jeu, heros, emplacement, id) {
    const h = e.heros[heros], ancien = h.equipement[emplacement];
    if (id && (!M.Regles.peutPorter(jeu, h, id) || !prendre(e, id, 1))) return false;
    if (ancien) donner(e, ancien, 1);
    h.equipement[emplacement] = id || null;
    return true;
  }

  /* Sauvegardes. stockage : localStorage ou tout objet avec getItem / setItem / removeItem.
     prefixe : par exemple « lanterne » (clés lanterne.partie1, lanterne.partie2, lanterne.partie3). */
  function Sauvegardes(stockage, prefixe, maintenant = () => Date.now(), jeu = null) {
    const cle = n => `${prefixe}.partie${n}`;
    const lire = n => {
      let p = null;
      try { p = JSON.parse(stockage.getItem(cle(n)) || 'null'); } catch (err) { p = null; }
      if (!p || typeof p !== 'object') return { auto: null, main: null, reprise: null };
      for (const k of ['auto', 'main', 'reprise']) if (p[k] && !migrer(p[k].etat, jeu)) p[k] = null;
      return { auto: p.auto || null, main: p.main || null, reprise: p.reprise || null };
    };
    const ecrire = (n, type, etat) => {
      const p = lire(n);
      p[type] = { date: maintenant(), etat: copie(etat) };
      if (type !== 'reprise') p.reprise = null;   // une vraie sauvegarde rend la copie de reprise inutile
      try { stockage.setItem(cle(n), JSON.stringify(p)); return true; } catch (err) { return false; }
    };
    const recente = (...copies) => copies.filter(Boolean).sort((a, b) => b.date - a.date)[0] || null;
    return {
      lire, ecrire,
      // après une défaite : la plus récente des vraies sauvegardes
      pourDefaite: n => { const p = lire(n), c = recente(p.auto, p.main); return c ? copie(c.etat) : null; },
      // en ouvrant le jeu : la plus récente de toutes, reprise comprise
      pourReprendre: n => { const p = lire(n), c = recente(p.auto, p.main, p.reprise); return c ? copie(c.etat) : null; },
      resume: n => {
        const p = lire(n), c = recente(p.auto, p.main, p.reprise);
        if (!c) return null;
        const e = c.etat;
        return { nom: e.nom, chapitre: e.chapitre, lieu: e.lieu, temps: e.temps, date: c.date, niveau: (e.heros[e.equipe[0]] || {}).niveau || 1 };
      },
      effacer: n => { try { stockage.removeItem(cle(n)); } catch (err) { /* rien */ } }
    };
  }

  M.Etat = { VERSION, MAX_OBJET, nouvellePartie, migrer, copie, donner, prendre, combien, drapeau, lireDrapeau, rejoindre, quitter, soigner, equiper, Sauvegardes };
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? (window.MoteurRPG = window.MoteurRPG || {}) : (globalThis.MoteurRPG = globalThis.MoteurRPG || {}));
