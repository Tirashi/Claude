/* =====================================================================
   BANNIÈRES · les PERSONNAGES et la BATAILLE en 3D.
   Personnages KayKit (Adventurers 2.0, Skeletons ; animations Character
   Animations 1.1 ; lance de Fantasy Weapons), recolorés par seigneur.
   La bataille est réglée d'avance par la règle (banResoudre, regles.js)
   puis rejouée de profil, temps par temps (volées, assauts, fin) ;
   les cœurs au-dessus des guerriers disparaissent quand ils sont touchés.
   Repris de la maquette (outils/bannieres-maquette/modele.html).
   ===================================================================== */
'use strict';
/* global AVENTURIERS */

// ---------- les personnages : modèles, textures recolorées par seigneur, animations ----------
const AV = { modeles: {}, clips: {}, armes: {}, mats: {}, haut: 1 };
// une sorte de guerrier (regles.js) → son personnage
const VUE = { seigneur: 'seigneur', fantassin: 'soldat', archer: 'archer', champion: 'champion', mage: 'mage', barbare: 'barbare', voleur: 'voleur', lancier: 'lancier', squelette: 'squelette', sbire: 'sbire', necromancien: 'necromancien' };
// personnage, armes (main droite, main gauche), attaques, repos
const TYPES = {
  soldat: { perso: 'Knight', droite: 'sword_1handed', gauche: 'shield_badge_color', attaques: ['Melee_1H_Attack_Chop', 'Melee_1H_Attack_Stab'], repos: 'Idle_A' },
  champion: { perso: 'Knight', droite: 'sword_2handed_color', attaques: ['Melee_2H_Attack_Chop'], repos: 'Melee_2H_Idle' },
  archer: { perso: 'Ranger', gauche: 'bow_withString', attaques: [], repos: 'Ranged_Bow_Idle', archer: true },
  voleur: { perso: 'Rogue_Hooded', droite: 'dagger', attaques: ['Melee_1H_Attack_Stab'], repos: 'Idle_A' },
  barbare: { perso: 'Barbarian', droite: 'axe_1handed', attaques: ['Melee_1H_Attack_Chop'], repos: 'Idle_A' },
  mage: { perso: 'Mage', droite: 'staff', attaques: ['Melee_1H_Attack_Chop'], repos: 'Idle_A', mage: true },
  seigneur: { perso: 'Knight', droite: 'sword_1handed', gauche: 'shield_badge_color', attaques: ['Melee_1H_Attack_Chop', 'Melee_1H_Attack_Stab'], repos: 'Idle_A' },
  lancier: { perso: 'Knight', droite: 'spear_A', gauche: 'shield_badge_color', attaques: ['Melee_1H_Attack_Stab'], repos: 'Idle_A' },
  squelette: { perso: 'Skeleton_Warrior', droite: 'Skeleton_Blade', gauche: 'Skeleton_Shield_Small_A', attaques: ['Melee_1H_Attack_Chop', 'Melee_1H_Attack_Stab'], repos: 'Idle_A' },
  sbire: { perso: 'Skeleton_Minion', droite: 'Skeleton_Axe', attaques: ['Melee_1H_Attack_Chop'], repos: 'Idle_A' },
  necromancien: { perso: 'Skeleton_Mage', droite: 'Skeleton_Staff', attaques: ['Melee_1H_Attack_Chop'], repos: 'Idle_A', mage: true },
};
const TEXTURE_ARME = { sword_1handed: 'Knight', sword_2handed_color: 'Knight', shield_badge_color: 'Knight', bow_withString: 'Ranger', arrow_bow: 'Ranger', axe_1handed: 'Barbarian', dagger: 'Rogue_Hooded', staff: 'Mage', Skeleton_Blade: 'Skeleton_Warrior', Skeleton_Axe: 'Skeleton_Warrior', Skeleton_Staff: 'Skeleton_Warrior', Skeleton_Shield_Small_A: 'Skeleton_Warrior' };   // la lance garde sa propre texture
// la couleur d'équipe : le rouge du chevalier (cape, plumet, blason du bouclier), le bleu de l'archer (écharpe, cape), le violet du mage
const TEINTES = { or: [44, 1.25], rouge: [0, 1], bleu: [218, 1], violet: [282, 0.95] };
const EQUIPE = { Knight: hh => hh > 330 || hh < 20, Ranger: hh => hh > 185 && hh < 245, Mage: hh => hh > 245 && hh < 305 };
// Leçon (mémo technique) : dans un artefact, pas d'image glTF en data: (fetch interdit) ; les GLB portent leurs images, la lance a sa texture à part
async function preparerAventuriers() {
  const chargeur = new THREE.GLTFLoader();
  const lire = src => new Promise((ok, ko) => chargeur.parse(src, '', ok, ko));
  for (const p in AVENTURIERS.persos) {
    let g;
    try { g = await lire(Uint8Array.from(atob(AVENTURIERS.persos[p]), c => c.charCodeAt(0)).buffer); } catch (e) { console.error('personnage', p, e); continue; }   // un personnage en moins n'empêche pas de jouer
    AV.modeles[p] = g.scene;
    let carte = null; g.scene.traverse(o => { if (o.isMesh && !carte) carte = o.material.map; });
    AV.mats[p] = {};
    for (const coul of ['or', 'rouge', 'bleu', 'violet', 'neutre']) {
      // atlas de dégradés : 256 pixels suffisent
      const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d'); ctx.drawImage(carte.image, 0, 0, 256, 256);
      if (EQUIPE[p] && TEINTES[coul]) {
        const d = ctx.getImageData(0, 0, 256, 256), [cible, lum] = TEINTES[coul];
        for (let k = 0; k < d.data.length; k += 4) {
          const [hh, s, v] = teinte(d.data[k], d.data[k + 1], d.data[k + 2]);
          if (s > 0.35 && EQUIPE[p](hh)) [d.data[k], d.data[k + 1], d.data[k + 2]] = rgb(cible, Math.min(1, s), Math.min(1, v * lum));
        }
        ctx.putImageData(d, 0, 0);
      }
      const t = new THREE.CanvasTexture(c); t.flipY = false; t.encoding = THREE.sRGBEncoding;
      AV.mats[p][coul] = { peau: new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0, skinning: true }), fixe: new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0 }) };
    }
  }
  for (const a in AVENTURIERS.armes) {
    try { AV.armes[a] = (await lire(AVENTURIERS.armes[a])).scene; } catch (e) { console.error('arme', a, e); continue; }
    if (AVENTURIERS.texArmes && AVENTURIERS.texArmes[a]) {
      const t = new THREE.TextureLoader().load(AVENTURIERS.texArmes[a]); t.flipY = false; t.encoding = THREE.sRGBEncoding;
      const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0 });
      AV.armes[a].traverse(x => { if (x.isMesh) x.material = m; });
    }
  }
  AVENTURIERS.clips.forEach(j => { AV.clips[j.name] = THREE.AnimationClip.parse(j); });
  const b = new THREE.Box3().setFromObject(AV.modeles.Knight); AV.haut = b.max.y - b.min.y;
}
const geoAnneau = new THREE.RingGeometry(0.16, 0.36, 24), matsAnneau = {};
// un guerrier : le personnage cloné avec son squelette, ses armes dans les mains, son mélangeur d'animations
function aventurier(type, coul, haut) {
  const T = TYPES[type], perso = AV.modeles[T.perso] ? T.perso : 'Knight', o = THREE.SkeletonUtils.clone(AV.modeles[perso]), m = AV.mats[perso][coul] || AV.mats[perso].neutre;
  o.traverse(x => { if (x.isMesh) { x.material = m.peau; x.castShadow = true; x.frustumCulled = false; } });
  const arme = (nom, os) => {
    if (!nom || !AV.armes[nom]) return;
    const w = AV.armes[nom].clone(), src = TEXTURE_ARME[nom], mw = src && AV.mats[src] && (AV.mats[src][coul] || AV.mats[src].neutre).fixe;
    w.traverse(x => { if (x.isMesh) { if (mw) x.material = mw; x.castShadow = true; } });
    if (nom === 'bow_withString') w.rotation.z = Math.PI;   // sinon la corde est tournée vers la cible
    const main = o.getObjectByName(os); if (main) main.add(w);
  };
  arme(T.droite, 'handslotr'); arme(T.gauche, 'handslotl');   // « handslot.r » : le chargeur retire les points des noms
  o.scale.setScalar(haut / AV.haut);
  const g = new THREE.Group(); g.add(o);
  // un cercle à la couleur du seigneur sous les pieds : on voit d'un coup d'œil qui est qui
  const C = COUL[coul], anneau = new THREE.Mesh(geoAnneau, matsAnneau[coul] || (matsAnneau[coul] = new THREE.MeshBasicMaterial({ color: new THREE.Color(C ? C.hex : 0x8a8170).convertSRGBToLinear(), transparent: true, opacity: 0.95 })));
  anneau.rotation.x = -Math.PI / 2; anneau.position.y = 0.015; anneau.scale.setScalar(haut / 1.1); g.add(anneau);
  g.userData = { type, T, coul, mixer: new THREE.AnimationMixer(o), actions: {}, courant: null, anneau };
  return g;
}
// lance une animation (en boucle, ou une fois en restant sur la dernière image), avec un fondu
function jouer(g, nom, une = false, vitesse = 1) {
  const u = g.userData;
  if (!AV.clips[nom]) return { time: 0 };
  const a = u.actions[nom] || (u.actions[nom] = u.mixer.clipAction(AV.clips[nom]));
  if (u.courant === a && !une) return a;
  a.reset(); a.setLoop(une ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = une; a.timeScale = vitesse;
  if (u.courant && u.courant !== a) u.courant.fadeOut(0.15);
  a.fadeIn(0.15).play(); u.courant = a;
  return a;
}

// ---------- la scène de bataille ----------
const sceneB = new THREE.Scene();
const cameraB = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
const cielB = new THREE.HemisphereLight(0xdff1ff, 0x5a7040, 0.8), soleilB = new THREE.DirectionalLight(0xfff1d6, 1.0);
soleilB.position.set(-4, 9, 5); soleilB.castShadow = true; soleilB.shadow.mapSize.set(1024, 1024);
Object.assign(soleilB.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
sceneB.add(cielB, soleilB);
sceneB.background = new THREE.Color(0x8fc6e8); sceneB.fog = new THREE.Fog(0x8fc6e8, 30, 60);
let bataille = null, vitesseB = 1;
const matTerre = new THREE.MeshLambertMaterial({ color: new THREE.Color(0x7a5534).convertSRGBToLinear() }), matRoche = new THREE.MeshLambertMaterial({ color: new THREE.Color(0x5e4a3a).convertSRGBToLinear() });
// décor d'arrière-plan d'un terrain (pour les tuiles du fond)
const FOND = { plaine: ['building_grain', 'tree_single_A', 0], foret: ['trees_A_large', 'trees_B_large', 'trees_A_medium'], colline: ['hills_B', 'hill_single_A', 'hills_C_trees'],
  montagne: ['mountain_B_grass', 'mountain_C_grass', 'mountain_A_grass_trees'], marais: ['waterplant_A', 'waterlily_A', 'waterplant_B'], riviere: ['tree_single_B', 0, 'rock_single_A'] };
// les rangs de profil : colonnes de 3 guerriers en profondeur, la première colonne face à l'ennemi ; la mêlée devant, les tireurs derrière
const XFRONT = 1.25, XCONTACT = 0.38;
function placeRang(c, slot) { const col = Math.floor(slot / 3), r = slot % 3, s = c ? 1 : -1; return [s * (XFRONT + col * 0.85 + (r === 1 ? 0.25 : 0)), [1.15, 0.4, -0.35][r]]; }
function rangsVivants(c) {
  const F = bataille.figures[c], der = g => (g.userData.T.archer || g.userData.T.mage ? 1 : 0);
  return F.map((g, k) => k).filter(k => !F[k].userData.mort).sort((a, b) => der(F[a]) - der(F[b]) || a - b);
}
function cadrerBataille() {
  const asp = innerWidth / innerHeight, d = Math.max(8, 5.6 / (2 * Math.tan(15 * Math.PI / 180) * Math.min(1.2, asp)));
  cameraB.aspect = asp; cameraB.position.set(0, 0.5 + d * Math.sin(0.2), d * Math.cos(0.2)); cameraB.lookAt(0, 0.35 + d * 0.035, 0); cameraB.updateProjectionMatrix();
}
const EFFETS = { foret: 'FORET : LES FLECHES PASSENT MAL.', colline: 'COLLINE : CELUI QUI DEFEND TIRE UNE FOIS DE PLUS.', montagne: 'MONTAGNE : CELUI QUI DEFEND SE PROTEGE MIEUX.', marais: 'MARAIS : CELUI QUI ATTAQUE FRAPPE MOINS FORT.', riviere: 'RIVIERE : CELUI QUI ATTAQUE FRAPPE MOINS FORT.', plaine: 'HERBE : RIEN DE SPECIAL.' };
const NOM_TERRAIN = { plaine: 'HERBE', foret: 'FORET', colline: 'COLLINE', montagne: 'MONTAGNE', marais: 'MARAIS', riviere: 'RIVIERE' };
// ap : l'aperçu de la bataille (banApercu) ; source : la case d'où vient l'attaquant ; i : la case attaquée
function ouvrirBataille(ap, source, i) {
  document.body.classList.add('en-bataille');
  while (sceneB.children.length > 2) sceneB.remove(sceneB.children[2]);
  const S = SAISONS[banSaison(etat.tour)] || SAISONS.printemps, terre = etat.terres[i];
  sceneB.background.setHex(S.ciel); sceneB.fog.color.setHex(S.ciel); soleilB.color.setHex(S.soleil); cielB.groundColor.setHex(S.sol);
  const gauche = etat.terres[source], droite = terre;
  // le sol : des rangées de tuiles sur la grille de la carte (elles s'emboîtent), le terrain de l'attaquant à gauche, celui de la case attaquée à droite
  for (let rr = -4; rr <= 1; rr++) for (let q = -8; q <= 8; q++) {
    const x = px(q, rr), z = pz(q, rr);
    if (Math.abs(x) > 9) continue;
    const T = x < 0 ? gauche : droite, merB = rr <= -3;
    let sol = merB ? 'hex_water' : 'hex_grass';
    if (rr === -1 && T.t === 'riviere') sol = 'hex_river_A';   // la rivière coule derrière l'armée
    if (rr <= -1 && T.t === 'marais' && (q + rr) % 2) sol = 'hex_water';
    const o = objet(sol, matBase, false); o.position.set(x, 0, z); sceneB.add(o);
    // sous les rangées de devant : l'épaisseur de terre, comme une tranche de diorama
    if (rr >= 0) for (let y = 1; y <= (rr === 1 ? 4 : 1); y++) { const s = new THREE.Mesh(geo('hex_grass'), y === 1 ? matTerre : matRoche); s.position.set(x, -y, z); sceneB.add(s); }
    // décor : rien devant (rangées 0 et 1), un peu de terrain derrière (une tuile sur deux), puis la mer à l'horizon
    if (rr >= 0 || merB || sol !== 'hex_grass' || (q + rr) % 2) continue;
    const nom = FOND[T.t][Math.abs(q * 7 + rr * 3) % 3];
    if (!nom || (rr === -2 && Math.abs(x) > 1 && Math.abs(Math.abs(x) - 1.0) < 1.2 && (x > 0 ? droite : gauche).bat)) continue;   // la place du bâtiment
    const d = objet(nom); d.position.set(x, 0, z); d.rotation.y = (q * 2 + rr) * Math.PI / 3; sceneB.add(d);
  }
  // le bâtiment de chaque case se dresse au fond de son côté, à sa vraie taille
  const batiment = (t, cote) => {
    if (!t.bat || !BAT_MODELE[t.bat]) return;
    const Sx = t.prop >= 0 ? etat.seigneurs[t.prop] : null, C = Sx && COUL[Sx.coul];
    const o = objet(modeleBat(t) + (C ? C.k : 'blue'), C ? C.mat : matGris);
    o.position.set(cote * 1.0, 0, -3.46); sceneB.add(o);
  };
  batiment(droite, 1); batiment(gauche, -1);
  [[-5, 4.2, -9], [3, 4.8, -10], [7, 3.8, -8]].forEach(([x, y, z], k) => { const c = objet(k % 2 ? 'cloud_small' : 'cloud_big'); c.position.set(x, y, z); sceneB.add(c); });
  decorBataille(gauche, -1); decorBataille(droite, 1);
  // les guerriers : l'attaquant à gauche, le défenseur (et la garde du château) à droite
  const coulDe = s => (s >= 0 ? etat.seigneurs[s].coul : 'neutre');
  const figures = [[ap.A, ap.att.s], [ap.D, ap.sDef]].map(([liste, s], c) => liste.map((u, k) => {
    const g = aventurier(VUE[u.type], coulDe(s), u.type === 'seigneur' ? 1.25 : 1.1), gu = g.userData;
    gu.c = c; gu.k = k; gu.rot = c ? -Math.PI / 2 : Math.PI / 2; gu.rotVise = gu.rot; g.rotation.y = gu.rot;
    jouer(g, gu.T.repos).time = hasardTerre(k, c + 1);
    gu.max = Math.max(u.pv, banCoeursMax(etat, u.type, s)); gu.coeurs = coeursSprite(u.pv, gu.max); gu.coeurs.position.y = u.type === 'seigneur' ? 1.6 : 1.45; g.add(gu.coeurs);
    sceneB.add(g); return g;
  }));
  bataille = { figures, fleches: [], feux: [], vie: [ap.A, ap.D].map(l => l.map(u => u.pv)), vie0: [ap.A, ap.D].map(l => l.reduce((t, u) => t + u.pv, 0)), file: [], temps: null, horloge: 0 };
  [0, 1].forEach(c => rangsVivants(c).forEach((k, slot) => { const [x, z] = placeRang(c, slot); figures[c][k].position.set(x, 0, z); }));
  cadrerBataille();
  const effets = [EFFETS[terre.t]];
  if (terre.bat === 'chateau') effets.push('CHATEAU : CELUI QUI DEFEND SE PROTEGE MIEUX ET TIRE UNE FOIS DE PLUS.');
  else if (ap.tourDef) effets.push('TOUR : CELUI QUI DEFEND TIRE UNE FOIS DE PLUS.');
  if (ap.garde) effets.push('LA GARDE DU CHATEAU SE BAT AUSSI.');
  $('bataille').innerHTML = `<div class="banniere">BATAILLE : ${NOM_TERRAIN[terre.t]}</div>` +
    `<div class="camps"><div class="camp">${nomCamp(ap.att.s)}<br><b>${compo(ap.A)}</b><div class="jauge bleu"><i id="jA" style="width:100%"></i></div></div>` +
    `<div class="camp">${nomCamp(ap.sDef)}<br><b>${compo(ap.D)}</b><div class="jauge"><i id="jD" style="width:100%"></i></div></div></div>` +
    `<div class="effets">${effets.join('<br>')}</div>`;
  $('bataille').classList.remove('cache');
}
// le décor d'un côté du champ de bataille (cote : −1 à gauche, +1 à droite), toujours derrière les rangs
function decorBataille(t, cote) {
  const poser = (nom, x, z, k = 1, r = 0) => { const o = objet(nom); o.position.set(cote * x, 0, z); o.scale.multiplyScalar(k); o.rotation.y = r; sceneB.add(o); return o; };
  if (t.bat === 'chateau') {   // les remparts du château, avec la herse au milieu et deux torches
    poser('wall', 1.0, -1.25, 1, 0); poser('wall_gated', 2.8, -1.25, 1, 0); poser('wall', 4.6, -1.25, 1, 0);
    poser('torch_lit', 1.9, -1.0); poser('torch_lit', 3.7, -1.0);
  } else if (t.camp) {
    poser('tent', 2.2, -1.5, 1.1, cote * 0.6); poser('crates_stacked', 0.9, -1.4, 1.1, 0.3); poser('barrel_large', 3.4, -0.9, 1, 0); poser('chest_gold', 1.6, -0.85, 1, -0.4); poser('torch_lit', 2.9, -0.7);
  } else if (t.ruine) {
    poser('wall_broken', 2.4, -1.4, 1, 0); poser('pillar', 0.9, -1.3); poser('pillar', 4.0, -1.5); poser('rubble_large', 3.2, -0.6, 0.6, 1); poser('torch_lit', 1.6, -0.8); poser('torch_lit', 3.0, -0.9);
  } else {   // les provisions de l'armée, des buissons et des pierres sur les côtés
    poser('box_stacked', 3.6, -1.1, 1, 0.4); poser('keg', 2.9, -1.4, 1, 0); poser('Bush_1_A_Color1', 4.4, -0.3, 0.45); poser('Rock_1_A_Color1', 1.5, -1.7, 1.1, 0.7); poser('Bush_2_C_Color1', 0.8, -1.9, 0.4); poser('Bush_4_A_Color1', 2.1, -1.9, 0.45);
  }
}
// des cœurs en pixel art (rouges, ou gris quand ils sont perdus), au-dessus d'un guerrier
function dessinerCoeurs(s, n, max) {
  const c = s.userData.canvas, g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  const motif = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
  for (let k = 0; k < max; k++) motif.forEach((l, y) => [...l].forEach((ch, x) => { if (ch === 'X') { g.fillStyle = k < n ? (y === 1 && x === 1 ? '#ff9c8a' : '#e0302a') : '#6a5a50'; g.fillRect(k * 8 + x, y + 1, 1, 1); } }));
  s.material.map.needsUpdate = true;
}
function coeursSprite(n, max) {
  const c = document.createElement('canvas'); c.width = max * 8; c.height = 8;
  const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false })); s.renderOrder = 12;
  s.scale.set(max * 0.13, 0.13, 1); s.userData.canvas = c; dessinerCoeurs(s, n, max);
  return s;
}
// le combat rejoué : chaque « temps » du journal (volée, assaut, fin) devient une petite scène d'environ 1,5 s ;
// la promesse se résout un peu après la fin (les vainqueurs fêtent, les vaincus détalent)
function rejouerBataille(res) {
  return new Promise(ok => {
    const B = bataille;
    B.file = res.journal.slice(); B.res = res; B.apres = ok;
    B.prochain = () => {
      const e = B.file.shift(); if (!e) return;
      B.temps = { e, debut: B.horloge, faits: {} };
      if (e.temps === 'assaut' && e.n === 0) B.figures.flat().forEach(g => { const u = g.userData; if (!u.mort && !u.T.archer && !u.T.mage) u.versContact = true; });
    };
    B.prochain();
  });
}
function vieJauges() { const B = bataille; [0, 1].forEach(c => { const v = B.vie[c].reduce((t, x) => t + Math.max(0, x), 0); const e = $(c ? 'jD' : 'jA'); if (e) e.style.width = (100 * v / Math.max(1, B.vie0[c])) + '%'; }); }
function toucher(c, k, deg, mort) {
  const B = bataille, g = B.figures[c][k]; if (!g || g.userData.mort) return;
  B.vie[c][k] -= deg; vieJauges(); dessinerCoeurs(g.userData.coeurs, Math.max(0, B.vie[c][k]), g.userData.max);
  if (mort) { jouer(g, 'Death_A', true); g.userData.mort = true; g.userData.anneau.visible = false; g.userData.coeurs.visible = false; }
  else jouer(g, deg ? 'Hit_A' : 'Melee_Block', true);
}
function animerBataille(now, dtReel) {
  const B = bataille, dt = dtReel * vitesseB; B.horloge += dt * 1000;
  const T = B.temps, h = B.horloge;
  B.figures.flat().forEach(g => {
    const u = g.userData; u.mixer.update(dt);
    if (u.mort) return;
    g.rotation.y += (u.rotVise - g.rotation.y) * Math.min(1, dt * 10);
    // chacun rejoint sa place dans les rangs (la mêlée au contact après le premier assaut), en courant
    const s = u.c ? 1 : -1;
    let x = placeRang(u.c, Math.max(0, rangsVivants(u.c).indexOf(u.k)))[0];
    if (u.versContact) x = s * (XCONTACT + Math.abs(x) - XFRONT);
    if (u.fuite) { x = s * 7; u.rotVise = u.rot + Math.PI; }
    const ecart = x - g.position.x, enCours = u.courant && u.courant.loop === THREE.LoopOnce && u.courant.isRunning();
    if (Math.abs(ecart) > 0.05 && (!enCours || u.fuite)) { g.position.x += Math.sign(ecart) * Math.min(Math.abs(ecart), 1.6 * dt); jouer(g, 'Running_A', false, 1.2); }
    else if (!enCours && !u.fete && u.courant !== u.actions[u.T.repos]) jouer(g, u.T.repos);
  });
  if (T) {
    const e = T.e, f = (h - T.debut) / 1000, une = cle => (T.faits[cle] ? false : (T.faits[cle] = true));
    if (e.temps === 'volee') {
      e.tirs.forEach((s, n) => {
        const g = B.figures[s.c][s.k]; if (!g || g.userData.mort) return;
        const u = g.userData;
        if (s.sorte === 'fleche') {
          if (une('bande' + n)) { jouer(g, 'Ranged_Bow_Draw', true); u.rotVise = u.rot - Math.PI / 6; }   // on vise sur sa gauche : un trois quarts garde le visage vers l'ennemi
          if (f > 0.45 && une('tire' + n)) { jouer(g, 'Ranged_Bow_Release', true); tirer(g, B.figures[s.e][s.t], s.touche); }
          if (f > 1.1 && une('fin' + n)) u.rotVise = u.rot;
        } else {
          if (une('sort' + n)) jouer(g, 'Ranged_Magic_Shoot', true);
          if (f > 0.4 && une('feu' + n)) lancerFeu(g, B.figures[s.e][s.t], s.touche);
        }
      });
      if (f > 0.95 && une('touches')) e.coups.forEach(cp => toucher(cp.c, cp.k, cp.deg, cp.mort));
      if (f > 1.6) B.temps = null;
    } else if (e.temps === 'assaut') {
      const g2 = f - (e.n === 0 ? 0.9 : 0.1);   // au premier assaut, on laisse la mêlée courir au contact
      if (g2 > 0) {
        e.frappes.forEach((fr, n) => { const g = B.figures[fr.c][fr.k]; if (g && !g.userData.mort && g2 > (n % 3) * 0.07 && une('frappe' + n)) jouer(g, g.userData.T.attaques[n % g.userData.T.attaques.length] || 'Melee_1H_Attack_Chop', true, 1.15); });
        if (g2 > 0.45 && une('son')) Sons.choc();
        if (g2 > 0.55 && une('coups')) { e.frappes.filter(fr => fr.pare).forEach(fr => toucher(fr.e, fr.t, 0, false)); e.coups.forEach(cp => toucher(cp.c, cp.k, cp.deg, cp.mort)); }
        if (g2 > 1.35) B.temps = null;
      }
    } else if (e.temps === 'fin') {
      if (une('fin')) finCombat(e.issue);
      B.temps = null;
    }
    if (!B.temps) B.prochain();
  }
  if (B.finA && h > B.finA) { const ok = B.apres; B.finA = 0; B.apres = null; if (ok) ok(); }
  // flèches et boules de feu
  B.fleches = B.fleches.filter(fl => {
    const k = (h - fl.debut) / 550;
    if (k >= 1) { sceneB.remove(fl.o); return false; }
    const pos = k2 => new THREE.Vector3(fl.a.x + (fl.b.x - fl.a.x) * k2, fl.a.y + (fl.b.y - fl.a.y) * k2 + Math.sin(k2 * Math.PI) * 1.0, fl.a.z + (fl.b.z - fl.a.z) * k2);
    fl.o.position.copy(pos(k)); fl.o.lookAt(pos(Math.min(1, k + 0.02)));
    return true;
  });
  B.feux = B.feux.filter(fe => {
    const k = (h - fe.debut) / 500;
    if (k >= 1.6) { sceneB.remove(fe.o); return false; }
    if (k < 1) { fe.o.position.lerpVectors(fe.a, fe.b, k); fe.o.position.y += Math.sin(k * Math.PI) * 0.5; fe.o.scale.setScalar(1 + Math.sin(h / 40) * 0.15); }
    else { fe.o.scale.setScalar(1 + (k - 1) * 6); fe.o.material.opacity = Math.max(0, 1 - (k - 1) / 0.6); fe.o.material.color.setHex(0xffd04a); }
    return true;
  });
  rendu.render(sceneB, cameraB);
}
// la fin : les vaincus détalent, les vainqueurs fêtent ; puis la promesse de rejouerBataille se résout
function finCombat(issue) {
  const B = bataille, F = B.figures, gagnant = issue === 'victoire' ? 0 : 1;
  if (issue === 'retraite') F[0].forEach(g => { g.userData.fuite = true; g.userData.versContact = false; });
  if (issue === 'victoire') F[1].forEach(g => { g.userData.fuite = true; g.userData.versContact = false; });   // les derniers défenseurs détalent
  F[gagnant].forEach(g => { if (!g.userData.mort) { g.userData.fete = true; jouer(g, 'Cheering'); } });
  B.finA = B.horloge + 1300;
}
// une flèche (le modèle de l'archer) : elle arrive sur sa cible, ou se plante à côté
function tirer(archer, cible, touche) {
  if (!AV.armes.arrow_bow) return;
  const o = AV.armes.arrow_bow.clone(), m = (AV.mats.Ranger[archer.userData.coul] || AV.mats.Ranger.neutre).fixe;
  o.traverse(x => { if (x.isMesh) x.material = m; });
  o.scale.setScalar(0.7 * 1.1 / AV.haut * 2.2); sceneB.add(o);
  const main = new THREE.Vector3(), os = archer.getObjectByName('handslotl'); (os || archer).getWorldPosition(main);
  const b = cible.position.clone().add(touche ? new THREE.Vector3(0, 0.55, 0) : new THREE.Vector3(archer.userData.c ? -0.5 : 0.5, 0.02, 0.3));
  bataille.fleches.push({ o, debut: bataille.horloge, a: main, b });
}
// une boule de feu du mage (verte pour le nécromancien)
const geoFeu = new THREE.SphereGeometry(0.13, 12, 8);
function lancerFeu(mage, cible, touche) {
  const o = new THREE.Mesh(geoFeu, new THREE.MeshBasicMaterial({ color: mage.userData.type === 'necromancien' ? 0x7aff5a : 0xff7a1a, transparent: true, opacity: 0.95 }));
  const a = new THREE.Vector3(), os = mage.getObjectByName('handslotr'); (os || mage).getWorldPosition(a);
  sceneB.add(o); bataille.feux.push({ o, debut: bataille.horloge, a, b: cible.position.clone().add(new THREE.Vector3(touche ? 0 : 0.4, 0.5, 0)) });
  Sons.feu();
}
function fermerBataille() {
  bataille = null; vitesseB = 1;
  document.body.classList.remove('en-bataille'); $('bataille').classList.add('cache'); $('issue').classList.add('cache');
}
