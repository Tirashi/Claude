/* =====================================================================
   BANNIÈRES · les RIVAUX (l'ordinateur), § 8 du cahier des charges.
   Trois caractères : costaud (il attaque), bâtisseur (il construit),
   malin (il attend d'être plus fort). En FACILE, ils n'attaquent le
   joueur qu'avec ★★★ (3 chances sur 4), et jamais avant le tour 5.
   Logique pure (aucun hasard : les choix ne dépendent que de l'état).
   - banIaGerer : acheter et construire au début de son tour ;
   - banIaCoup : où va une armée (et avec quelle tactique si elle attaque) ;
   - banIaJouer : un tour entier (simulateur ; la page enchaîne banIaGerer
     et banIaCoup elle-même, pour montrer chaque marche et chaque bataille).
   Chargé après regles.js. Sert aussi au joueur automatique du simulateur.
   ===================================================================== */
'use strict';
const BAN_IA_SEUIL = { costaud: 0.55, batisseur: 0.7, malin: 0.72 };   // chance de victoire qu'il lui faut pour attaquer
const BAN_IA_BATIR = {   // l'ordre de ses bâtiments
  costaud: ['caserne', 'maison', 'forge', 'moulin', 'maison'],
  batisseur: ['maison', 'moulin', 'tour', 'marche', 'maison', 'moulin', 'forge', 'marche'],
  malin: ['maison', 'moulin', 'caserne', 'tour', 'forge', 'marche'],
};
const BAN_IA_ACHATS = {   // l'ordre de ses achats (un champion seulement avec une caserne)
  costaud: ['fantassin', 'champion', 'archer', 'lancier', 'fantassin', 'archer'],
  batisseur: ['archer', 'fantassin', 'lancier'],
  malin: ['archer', 'lancier', 'mage', 'fantassin', 'champion'],
};
// combien de bâtiments il veut avoir à ce tour
const banIaVeutBatir = (car, tour, nb) => (car === 'batisseur' ? nb < 2 + tour / 2 : car === 'malin' ? nb < tour / 3 : nb < tour / 6);

function banIaGerer(etat, s, car) {
  const S = etat.seigneurs[s]; car = car || S.car || 'malin';
  if (S.tombe || etat.fin) return;
  const c = banChateau(etat, s), ici = banArmeeSur(etat, c);
  if (ici && ici.s === s && ici.unites.reduce((n, u) => n + banCoeursMax(etat, u.type, s) - u.pv, 0) >= 2) banSoigner(etat, s, ici.id);   // soigner la garnison
  for (let k = 0; k < 8; k++) {
    let fait = false;
    const nb = banNbBat(etat, s);
    if (banIaVeutBatir(car, etat.tour, nb)) {
      const b = BAN_IA_BATIR[car][nb % BAN_IA_BATIR[car].length];
      const libres = etat.terres.map((t, i) => i).filter(i => etat.terres[i].prop === s && !etat.terres[i].bat).sort((x, y) => banDist(etat, x, c) - banDist(etat, y, c) || x - y);
      if (libres.length && banConstruire(etat, s, libres[0], b).ok) fait = true;
      else if (!libres.length) {   // plus de case libre : il agrandit un bâtiment
        const g = etat.terres.map((t, i) => i).find(i => etat.terres[i].prop === s && etat.terres[i].bat && etat.terres[i].bat !== 'chateau' && !etat.terres[i].grand);
        if (g !== undefined && banAmeliorer(etat, s, g).ok) fait = true;
      }
      else if (car === 'batisseur' && libres.length && S.pieces < BAN_BATIMENTS[b].prix) break;   // le bâtisseur économise
    }
    if (!fait) {
      const n = banArmeesDe(etat, s).reduce((x, a) => x + a.unites.length, 0);
      let ty = BAN_IA_ACHATS[car][n % BAN_IA_ACHATS[car].length];
      if (ty === 'champion' && !banNbBat(etat, s, 'caserne')) ty = 'fantassin';
      if (banAcheter(etat, s, ty).ok) fait = true;
    }
    if (!fait) break;
  }
}

// la meilleure tactique d'attaque, et sa chance
function banIaTactique(etat, id, i) {
  const ch = banChances(etat, id, i, 0); let tac = 'charger';
  for (const k in ch) if (ch[k] > ch[tac] + 1e-9) tac = k;
  return { tac, chance: ch[tac] };
}
// où va cette armée ? null : elle reste. { vers, tac } : elle y va (tac : sa tactique s'il y a bataille).
function banIaCoup(etat, a, car) {
  const S = etat.seigneurs[a.s]; car = car || S.car || 'malin';
  if (a.s < 0 || a.pts <= 0 || S.tombe || etat.fin) return null;
  const m = banAtteignables(etat, a); if (!m.size) return null;
  const chez = banChateau(etat, a.s), niv = banNiveau(etat), garnison = a.terre === chez;
  const cibles = etat.armees.filter(o => o.s !== a.s).map(o => o.terre)
    .concat(etat.seigneurs.map((T, s) => (s !== a.s && !T.tombe ? banChateau(etat, s) : -1)).filter(i => i >= 0 && etat.terres[i].prop !== a.s));
  const proche = j => (cibles.length ? Math.min(...cibles.map(i => banDist(etat, i, j))) : 0);
  const place = j => (car === 'costaud' ? -0.4 * proche(j) : car === 'batisseur' ? -0.6 * Math.max(0, banDist(etat, j, chez) - 2) - 0.1 * proche(j) : -0.25 * proche(j) - 0.3 * Math.max(0, banDist(etat, j, chez) - 3));
  let mieux = null, note = place(a.terre) + (garnison ? 4 : 0);   // rester sur place ; la garnison ne sort que pour attaquer (ou quand elle est pleine)
  if (garnison && a.unites.length >= banMaxUnites(etat, a.s) && S.pieces >= 6) note -= 5;   // pleine et riche : elle sort, d'autres guerriers la remplaceront
  m.forEach((v, j) => {
    const t = etat.terres[j], o = banArmeeSur(etat, j);
    let n;
    if (banEnnemiSur(etat, a.s, j)) {
      const sDef = o ? o.s : t.prop;
      if (sDef === 0 && etat.tour < niv.premierTour) return;
      if (a.s > 0 && sDef > 0 && t.bat === 'chateau' && !niv.chateauxRivaux) return;
      const seuil = Math.max(BAN_IA_SEUIL[car] - (a.s > 0 && niv.audace || 0), sDef === 0 ? niv.seuil : 0);
      const { tac, chance } = banIaTactique(etat, a.id, j);
      if (chance <= seuil) return;
      n = 10 + 2 * chance + (t.bat === 'chateau' ? 5 : 0) + (t.camp || t.ruine ? 2 : 0);
      if (n > note) { note = n; mieux = { vers: j, tac }; }
      return;
    }
    if (o) n = a.unites.length <= 3 && !garnison ? 1 + place(j) : -99;   // une petite armée rejoint une grande
    else n = (t.prop !== a.s ? 2 + (t.bat ? 0.5 : 0) : 0) + place(j) - 0.1 * v.cout;
    if (n > note) { note = n; mieux = { vers: j, tac: null }; }
  });
  return mieux;
}

// un tour entier pour le seigneur s : acheter, construire, puis chaque armée bouge (et se bat)
// opts.car : un caractère imposé (joueur automatique) ; opts.defense(etat, attId, i) : la tactique du joueur quand on l'attaque
function banIaJouer(etat, s, opts) {
  opts = opts || {};
  const S = etat.seigneurs[s];
  if (S.tombe || etat.fin) return [];
  banIaGerer(etat, s, opts.car);
  const batailles = [];
  for (const id of banArmeesDe(etat, s).map(a => a.id)) {
    const a = banArmee(etat, id); if (!a || etat.fin) continue;
    const c = banIaCoup(etat, a, opts.car); if (!c) continue;
    const r = banDeplacer(etat, id, c.vers);
    if (!r.ok || !r.bataille) continue;
    const ap = banApercu(etat, id, c.vers);
    const tD = ap.sDef === 0 && opts.defense ? opts.defense(etat, id, c.vers) : banTactiqueIA(ap.D, ap.sDef < 0);
    batailles.push(banResoudre(etat, id, c.vers, c.tac, tD));
  }
  return batailles;
}
