/* Moteur RPG — petit langage de scripts (testable sous Node, sans DOM).
   Un événement est une liste de commandes, jouées dans l'ordre :
     { dire: 'Texte' | ['page 1', 'page 2'], qui: 'ysolde' }   fenêtre de dialogue ({HEROS} : nom du héros)
     { choix: 'Question ?', options: ['Oui', 'Non'], suites: [[…], […]] }
     { si: condition, alors: […], sinon: […] }
     { drapeau: 'nom', valeur: true }                  (valeur false : efface le drapeau)
     { donner: 'objet', n: 1 }   { prendre: 'objet', n: 1 }   { ecus: 50 }   (ecus négatif : payer)
     { rejoindre: 'eloi' }   { quitter: 'eloi' }   { soigner: true }   { sauver: 'auto' }
     { teleporter: 'carte', x, y, dir }   { combat: ['monstre', …], boss }   { pnj: 'id', cacher | montrer | aller: [x, y] }
     { son: 'nom' }   { musique: 'nom' }   { attendre: 0.5 }   { chapitre: 'Acte 1' }   { evenement: 'autre' }
     { stop: true }                                    arrête l'événement (une action du jeu qui renvoie false aussi)
   Conditions : 'drapeau', '!drapeau', { drapeau, egal }, { objet, min }, { ecus }, { equipe: 'id' },
   { tous: […] }, { un: […] }, { non: condition }.

   ctx (fourni par la partie) : { etat, jeu, ui: { dire(qui, pages), choix(question, options) }, actions: {…} }
   ui.dire et ui.choix renvoient des promesses ; les actions peuvent aussi en renvoyer. */
(function (M) {
  const E = () => M.Etat;

  function condition(c, etat) {
    if (c === undefined || c === null) return true;
    if (typeof c === 'string') return c[0] === '!' ? !etat.drapeaux[c.slice(1)] : !!etat.drapeaux[c];
    if (c.tous) return c.tous.every(x => condition(x, etat));
    if (c.un) return c.un.some(x => condition(x, etat));
    if (c.non !== undefined) return !condition(c.non, etat);
    if (c.drapeau !== undefined) return 'egal' in c ? etat.drapeaux[c.drapeau] === c.egal : !!etat.drapeaux[c.drapeau];
    if (c.objet !== undefined) return (etat.objets[c.objet] || 0) >= (c.min || 1);
    if (c.ecus !== undefined) return etat.ecus >= c.ecus;
    if (c.equipe !== undefined) return etat.equipe.includes(c.equipe);
    throw new Error('condition inconnue : ' + JSON.stringify(c));
  }

  const texte = (t, etat) => String(t).replace(/\{HEROS\}/g, etat.nom).replace(/\{ECUS\}/g, etat.ecus);

  // joue un événement (liste de commandes ou nom d'événement du jeu) ; renvoie false si { stop } l'a arrêté
  async function jouer(script, ctx, profondeur = 0) {
    if (profondeur > 20) throw new Error('événements imbriqués trop profondément');
    if (typeof script === 'string') {
      const s = ctx.jeu.evenements[script];
      if (!s) throw new Error('événement inconnu : ' + script);
      script = s;
    }
    const { etat, ui, actions = {} } = ctx;
    for (const c of script) {
      if (c.stop) return false;
      else if (c.dire !== undefined) await ui.dire(c.qui || null, [].concat(c.dire).map(t => texte(t, etat)));
      else if (c.choix !== undefined) {
        const i = await ui.choix(texte(c.choix, etat), c.options.map(t => texte(t, etat)));
        const suite = (c.suites || [])[i];
        if (suite && (await jouer(suite, ctx, profondeur + 1)) === false) return false;
      }
      else if (c.si !== undefined) {
        const suite = condition(c.si, etat) ? c.alors : c.sinon;
        if (suite && (await jouer(suite, ctx, profondeur + 1)) === false) return false;
      }
      else if (c.drapeau !== undefined) E().drapeau(etat, c.drapeau, c.valeur === undefined ? true : c.valeur);
      else if (c.donner !== undefined) { const n = E().donner(etat, c.donner, c.n || 1); if (actions.recu) await actions.recu(c.donner, n); }
      else if (c.prendre !== undefined) E().prendre(etat, c.prendre, c.n || 1);
      else if (c.ecus !== undefined) { etat.ecus = Math.max(0, etat.ecus + c.ecus); if (actions.recu && c.ecus > 0) await actions.recu('ecus', c.ecus); }
      else if (c.rejoindre !== undefined) { E().rejoindre(etat, c.rejoindre, ctx.jeu); if (actions.equipe) await actions.equipe(); }
      else if (c.quitter !== undefined) { E().quitter(etat, c.quitter); if (actions.equipe) await actions.equipe(); }
      else if (c.soigner) { E().soigner(etat); if (actions.soigner) await actions.soigner(); }
      else if (c.chapitre !== undefined) etat.chapitre = c.chapitre;
      else if (c.evenement !== undefined) { if ((await jouer(c.evenement, ctx, profondeur + 1)) === false) return false; }
      else {
        const nom = ['sauver', 'teleporter', 'combat', 'pnj', 'son', 'musique', 'attendre'].find(k => c[k] !== undefined);
        if (!nom) throw new Error('commande inconnue : ' + JSON.stringify(c));
        // une action qui renvoie false arrête l'événement (combat perdu : la partie est rechargée, la suite ne doit pas jouer)
        if (actions[nom] && (await actions[nom](c)) === false) return false;
      }
    }
    return true;
  }

  /* Pour les vérifications : parcourt toutes les commandes d'un script (et des sous-listes)
     et appelle visite(commande). */
  function parcourir(script, visite) {
    if (!Array.isArray(script)) return;
    for (const c of script) {
      visite(c);
      for (const k of ['alors', 'sinon']) parcourir(c[k], visite);
      for (const s of c.suites || []) parcourir(s, visite);
    }
  }
  // drapeaux lus par une condition
  function drapeauxLus(c, liste = []) {
    if (!c) return liste;
    if (typeof c === 'string') liste.push(c.replace(/^!/, ''));
    else {
      if (c.drapeau !== undefined) liste.push(c.drapeau);
      for (const k of ['tous', 'un']) (c[k] || []).forEach(x => drapeauxLus(x, liste));
      if (c.non !== undefined) drapeauxLus(c.non, liste);
    }
    return liste;
  }

  M.Evenements = { condition, texte, jouer, parcourir, drapeauxLus };
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? (window.MoteurRPG = window.MoteurRPG || {}) : (globalThis.MoteurRPG = globalThis.MoteurRPG || {}));
