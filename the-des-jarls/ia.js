/* =====================================================================
   LE THÉ DES JARLS · l'ORDINATEUR.
   Chaque dieu a son style (poids des faces à garder) et ses trois faveurs.
   - Les dés : il garde ce qui sert selon son style et ce qu'il voit chez
     l'adversaire (casques contre ses haches, boucliers contre ses flèches,
     mains s'il a des jetons, faces dorées s'il vise une grosse faveur).
   - La faveur : il essaie chacune de ses faveurs à chaque niveau sur une
     copie de la partie (jarBataille) et prend la meilleure.
   - niveau 1 à 3 : 1 se trompe souvent, 3 joue au mieux.
   Tout l'aléatoire passe par jarRng(graine, 'ia', …) : parties reproductibles.
   ===================================================================== */
'use strict';
// style : poids de base des faces ; deck : ses trois faveurs (la sienne d'abord)
const JAR_DIEUX = {
  thrymr:   { style: { hache: 1, fleche: 1, casque: 1, bouclier: 1, main: 1.2, or: 1.6 }, deck: ['thrymr', 'thor', 'idunn'] },
  var:      { style: { hache: 0.8, fleche: 0.8, casque: 1.4, bouclier: 1.4, main: 0.8, or: 1.8 }, deck: ['var', 'thor', 'idunn'] },
  freyja:   { style: { hache: 1.2, fleche: 1.2, casque: 1, bouclier: 1, main: 0.8, or: 1.4 }, deck: ['freyja', 'thor', 'freyr'] },
  frigg:    { style: { hache: 1, fleche: 1, casque: 1.2, bouclier: 1.2, main: 1, or: 1.3 }, deck: ['frigg', 'idunn', 'thor'] },
  loki:     { style: { hache: 1, fleche: 1, casque: 0.8, bouclier: 0.8, main: 1.8, or: 1.2 }, deck: ['loki', 'bragi', 'thor'] },
  tyr:      { style: { hache: 1.5, fleche: 0.8, casque: 1, bouclier: 0.8, main: 0.8, or: 1.2 }, deck: ['tyr', 'vidar', 'thor'] },
  vidar:    { style: { hache: 1.6, fleche: 0.8, casque: 1, bouclier: 0.8, main: 0.7, or: 1.1 }, deck: ['vidar', 'brunhild', 'idunn'] },
  ullr:     { style: { hache: 0.7, fleche: 1.8, casque: 0.8, bouclier: 1, main: 0.8, or: 1.1 }, deck: ['ullr', 'skadi', 'thor'] },
  baldr:    { style: { hache: 1.3, fleche: 1.1, casque: 1.2, bouclier: 1.2, main: 0.7, or: 1.4 }, deck: ['baldr', 'thor', 'freyr'] },
  brunhild: { style: { hache: 1.9, fleche: 0.7, casque: 0.9, bouclier: 0.8, main: 0.6, or: 1.3 }, deck: ['brunhild', 'hel', 'thor'] },
  freyr:    { style: { hache: 1.3, fleche: 1.1, casque: 1, bouclier: 1, main: 0.8, or: 1.2 }, deck: ['freyr', 'idunn', 'vidar'] },
  skadi:    { style: { hache: 0.7, fleche: 1.9, casque: 0.8, bouclier: 1, main: 0.7, or: 1.3 }, deck: ['skadi', 'ullr', 'skuld'] },
  heimdall: { style: { hache: 0.7, fleche: 0.7, casque: 1.8, bouclier: 1.8, main: 0.7, or: 1.1 }, deck: ['heimdall', 'thor', 'vidar'] },
  hel:      { style: { hache: 1.8, fleche: 0.7, casque: 1, bouclier: 0.8, main: 0.7, or: 1.3 }, deck: ['hel', 'brunhild', 'vidar'] },
  mimir:    { style: { hache: 0.9, fleche: 0.9, casque: 1, bouclier: 1, main: 1, or: 1.4 }, deck: ['mimir', 'thor', 'vidar'] },
  bragi:    { style: { hache: 0.8, fleche: 0.8, casque: 0.9, bouclier: 0.9, main: 1.9, or: 1.2 }, deck: ['bragi', 'thor', 'loki'] },
  skuld:    { style: { hache: 0.7, fleche: 1.8, casque: 0.9, bouclier: 0.9, main: 1, or: 1.1 }, deck: ['skuld', 'skadi', 'thor'] },
  thor:     { style: { hache: 1.3, fleche: 1.1, casque: 0.8, bouclier: 0.8, main: 0.8, or: 1.7 }, deck: ['thor', 'vidar', 'idunn'] },
  idunn:    { style: { hache: 0.9, fleche: 0.9, casque: 1.3, bouclier: 1.3, main: 0.8, or: 1.6 }, deck: ['idunn', 'heimdall', 'thor'] },
  odin:     { style: { hache: 1.1, fleche: 1.1, casque: 1, bouclier: 1, main: 0.9, or: 1.5 }, deck: ['odin', 'thor', 'freyr'] },
};

// valeur d'une face pour le camp i, vu ce que montre l'adversaire
function jarIaValeur(etat, i, f) {
  const c = etat.camps[i], o = etat.camps[jarAutre(i)], st = JAR_DIEUX[(c.ia && c.ia.dieu) || 'thor'].style;
  const adv = { hache: 0, fleche: 0, casque: 0, bouclier: 0, main: 0 };
  o.des.forEach((d, j) => { const x = jarFace(j, d); if (x && (o.lancers > 0)) adv[x.f]++; });
  let v = { hache: 1.1, fleche: 1, casque: 0.5 + 0.35 * adv.hache, bouclier: 0.45 + 0.35 * adv.fleche, main: o.jetons > 0 ? 0.9 : 0.25 }[f.f];
  if (f.f === 'hache' && adv.casque >= 3) v *= 0.6;
  if (f.f === 'fleche' && adv.bouclier >= 3) v *= 0.6;
  v *= st[f.f];
  if (f.or) v += 0.55 * st.or;
  return v;
}
// le tour de lancer de l'ordinateur : choisit ce qu'il garde puis lance (ou s'arrête)
function jarIaLancer(etat, i) {
  const c = etat.camps[i], niv = (c.ia && c.ia.niveau) || 2;
  if (!jarPeutLancer(etat, i)) return false;
  if (c.lancers > 0) {
    const R = jarRng(etat.graine, 'ia', etat.manche * 2 + i, c.lancers);
    const seuil = 1.15 + (niv === 1 ? 0.3 : 0);
    let gardes = 0;
    c.des.forEach((d, j) => {
      const v = jarIaValeur(etat, i, jarFace(j, d)) + (niv === 1 ? (R() - 0.5) * 1.2 : niv === 2 ? (R() - 0.5) * 0.4 : 0);
      d.garde = v >= seuil; if (d.garde) gardes++;
    });
    if (gardes === 6) return jarFinir(etat, i);
  }
  return jarLancer(etat, i);
}
// la faveur de l'ordinateur : il essaie tout sur une copie et garde le meilleur
function jarIaFaveur(etat, i) {
  if (etat.phase !== 'faveur' || etat.tour !== i) return false;
  const c = etat.camps[i], niv = (c.ia && c.ia.niveau) || 2, o = jarAutre(i);
  const options = [null];
  const dispo = c.jetons + jarOrDe(c);
  for (const id of c.faveurs) for (let n = 1; n <= 3; n++) if (jarCout(id, n) <= dispo + 2) options.push({ id, niv: n });
  const evaluer = ch => {
    const e = JSON.parse(JSON.stringify(etat));
    e.camps[i].choix = ch; if (e.camps[o].choix === undefined) e.camps[o].choix = null;
    e.phase = 'bataille'; jarBataille(e);
    const A = e.camps[i], B = e.camps[o];
    if (A.pv <= 0 && B.pv > 0) return -1000;
    if (B.pv <= 0 && A.pv > 0) return 1000 + A.pv;
    // PV d'écart ; les jetons valent un peu (moins vers la fin) ; une faveur ratée coûte
    return (A.pv - B.pv) * 1 + (A.jetons - B.jetons) * 0.32 + (A.pv <= 5 ? A.pv * 0.6 : 0);
  };
  const notes = options.map(ch => ({ ch, v: evaluer(ch) })).sort((a, b) => b.v - a.v);
  let pick = notes[0].ch;
  if (niv < 3) {
    const R = jarRng(etat.graine, 'ia', etat.manche * 2 + i, 9);
    if (R() < (niv === 1 ? 0.45 : 0.15)) pick = notes[Math.min(notes.length - 1, 1 + Math.floor(R() * 2))].ch;
  }
  return jarChoisir(etat, i, pick && pick.id, pick && pick.niv);
}
// l'ordinateur fait ce qu'il a à faire s'il a la main ; renvoie true s'il a joué
function jarIaJouer(etat) {
  const i = etat.tour, c = etat.camps[i];
  if (!c || !c.ia) return false;
  if (etat.phase === 'lancer') return jarIaLancer(etat, i);
  if (etat.phase === 'faveur') return jarIaFaveur(etat, i);
  return false;
}
// un adversaire tout prêt : le dieu et son deck
function jarAdversaire(dieu, niveau) { return { nom: JAR_FAVEURS[dieu].dieu, faveurs: JAR_DIEUX[dieu].deck.slice(), ia: { dieu, niveau: niveau || 2 } }; }
