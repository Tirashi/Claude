// Étiquettes des jeux (règle de l'utilisateur du 22/11, maquette maquettes/etiquettes-jeux.html, direction C « photo brillante ») :
// joue un peu chaque jeu dans Chromium, capture une scène et en tire <dossier>/etiquette.jpg (cartouche, en largeur)
// et <dossier>/jaquette.jpg (boîte du volet, en hauteur). Le titre n'est pas dans l'image : l'accueil le pose par-dessus.
// Lancer un serveur à la racine (python3 -m http.server 8765), puis : node outils/etiquettes.js [dossier…] [--brut <rép>]
//   --brut <rép> : enregistre seulement la capture plein écran de chaque jeu (pour choisir les cadrages).
// Chaque jeu : a = actions (["clic", texte] · ["xy", [x, y]] · ["touche", touche] · ["tenir", [touche, ms]] · ["texte", lettres] · ["js", code] · ["attente", ms]), vue = [largeur, hauteur]
// (390 × 760 par défaut), net = agrandir sans lisser (pixel art), e et j = cadres [x, y, largeur, hauteur] en pixels CSS de la vue pour l'étiquette et la jaquette.
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const RACINE = path.join(__dirname, '..');
const E = [300, 210], J = [220, 290];   // tailles des images (étiquette, jaquette)
const JEUX = {
  alunissage: {a: [["attente", 500]], net: true, e: [190, 270, 130, 90], j: [210, 260, 90, 120]},
  amiral: {a: [["xy", [195, 454]], ["attente", 1500], ["xy", [293, 688]], ["attente", 2500]], e: [10, 120, 370, 259], j: [40, 100, 300, 395]},
  asteroids: {a: [["touche", "Space"], ["attente", 2500]], e: [0, 330, 390, 273], j: [60, 250, 270, 356]},
  bannieres: {a: [["xy", [195, 290]], ["attente", 1500], ["xy", [195, 386]], ["attente", 4000], ["js", "fermer()"], ["attente", 1200]], e: [0, 140, 390, 273], j: [40, 110, 310, 409]},
  bannis: {a: [["attente", 800], ["js", "const J = Bannis.J, G = Bannis.G, R = Bannis.R; J.nouvelleNuit(); G.run.heros = G.recrues.slice(); R.placerParDefaut(G.run); G.run.vague = 5; R.preparerVague(G.run); J.allerPlacement(); J.lancerCombat()"], ["attente", 7000]], net: true, e: [50, 275, 320, 224], j: [80, 255, 230, 303]},
  bastion: {a: [["xy", [195, 382]], ["attente", 2000], ["xy", [293, 652]], ["attente", 4000]], e: [0, 300, 390, 273], j: [60, 230, 270, 356]},
  boutique: {a: [], e: [10, 140, 370, 259], j: [60, 110, 270, 356]},
  'capitaine-du-port': {a: [["xy", [84, 362]], ["attente", 3000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  'ciel-de-guerre': {a: [["xy", [195, 371]], ["attente", 6000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  club: {a: [], e: [10, 150, 370, 170], j: [100, 120, 190, 250]},
  'doggy-saga': {a: [["clic", "Jouer"], ["attente", 1500], ["clic", "C'est parti"], ["attente", 2000]], e: [10, 230, 370, 259], j: [40, 210, 300, 395]},
  'dragon-simulator': {a: [], e: [0, 30, 390, 273], j: [60, 10, 270, 356]},
  duche: {a: [["clic", "PARTIE LIBRE"], ["attente", 1200], ["clic", "FACILE"], ["attente", 3000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  empilage: {a: [["xy", [195, 549]], ["attente", 1200]].concat(Array(14).fill([["js", "cur.o = 0; placeCur(); lacher()"], ["attente", 250]]).flat(), [["attente", 1200]]), e: [0, 225, 390, 273], j: [0, 125, 390, 513]},
  escadrille: {a: [["xy", [195, 496]], ["attente", 1500]], e: [10, 120, 370, 259], j: [40, 100, 300, 395]},
  injagility: {a: [], e: [100, 215, 190, 133], j: [130, 200, 130, 170]},
  lanterne: {a: [["clic", "Nouvelle partie"], ["attente", 1500], ["clic", "Commencer"], ["attente", 4000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  lignee: {a: [["clic", "FACILE"], ["attente", 1500]], e: [10, 90, 370, 259], j: [40, 80, 310, 409]},
  'lune-rover': {a: [], e: [40, 320, 310, 217], j: [70, 290, 250, 330]},
  magasinier: {a: [["xy", [195, 365]], ["attente", 1500], ["xy", [89, 357]], ["attente", 3500]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  'mineur-de-l-espace': {vue: [760, 390], a: [["xy", [208, 222]], ["attente", 3000], ["tenir", ["ArrowUp", 2500]]], net: true, e: [0, 220, 320, 170], j: [50, 190, 160, 200]},
  'mot-d-or': {a: [["touche", "Escape"], ["js", "document.querySelectorAll('.modal,.aide,.overlay,dialog').forEach(e=>e.remove())"], ["texte", "POMME"], ["touche", "Enter"], ["attente", 1800], ["texte", "TABLE"], ["touche", "Enter"], ["attente", 1800]], e: [20, 40, 350, 245], j: [40, 30, 310, 409]},
  nebula: {a: [], e: [0, 240, 390, 273], j: [60, 200, 270, 356]},
  odyssee: {a: [["clic", "JOUER"], ["attente", 3000]], e: [0, 150, 390, 273], j: [60, 120, 270, 356]},
  orbite: {a: [], e: [40, 150, 310, 217], j: [70, 100, 250, 330]},
  picross: {a: [["js", "(async () => { const s = await (await fetch('jeu.js')).text(), i = s.indexOf('const PAL = ') + 12, PAL = eval('(' + s.slice(i, s.indexOf('};', i) + 1) + ')'); const d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:99;background:#e8f0d8;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px;align-content:start'; PUZZLES.filter(q => !q.legend).slice(0, 24).forEach(q => { const c = document.createElement('canvas'), H = q.art.length, W = q.art[0].length; c.width = W; c.height = H; const x = c.getContext('2d'); q.art.forEach((l, r) => [...l].forEach((ch, k) => { if (PAL[ch]){ x.fillStyle = PAL[ch]; x.fillRect(k, r, 1, 1); } })); c.style.cssText = 'width:100%;image-rendering:pixelated;background:#fff;border:3px solid #1a2a1a;border-radius:6px;padding:4px'; d.append(c); }); document.body.append(d); })()"], ["attente", 800]], net: true, e: [0, 0, 390, 273], j: [0, 0, 390, 513]},
  politique: {a: [["xy", [89, 421]], ["attente", 2000], ["xy", [195, 150]], ["attente", 2000], ["xy", [195, 240]], ["attente", 3000]], e: [0, 170, 390, 273], j: [60, 150, 270, 356]},
  'strategie-ciel': {a: [["attente", 6000], ["js", "localStorage.setItem('strategieciel.tuto', '1'); const J = StrategieCiel; J.jouer(false); const G = J.PLANETES[0], pv = J.U().find(u => u.type === 'pv'); pv.pos.set(G.x + 260, pv.pos.y, G.z + 520); pv.ordre = {k: 'rien'}; J.U().filter(u => u.type === 'chasseur' || u.type === 'destroyer').forEach((u, i) => { u.pos.set(G.x + 420 + i * 40, u.pos.y, G.z + 300 + i * 25); u.ordre = {k: 'rien'}; }); J.CA.c.set(G.x + 260, 0, G.z + 400); J.CA.dist = 2300; J.CA.yaw = -.4; J.CA.tilt = -10; for (let i = 0; i < 6; i++) J.produire('chasseur'); document.getElementById('hud').style.visibility = 'hidden'"], ["attente", 5000]], e: [0, 240, 390, 273], j: [30, 110, 320, 420]},
  'pont-stellaire': {a: [["xy", [195, 410]], ["attente", 1500]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  queens: {a: [["clic", "7×7"], ["attente", 800]], e: [20, 280, 350, 245], j: [40, 230, 310, 409]},
  resistance: {a: [], e: [0, 60, 390, 273], j: [60, 40, 270, 356]},
  romet: {a: [["clic", "JOUER"], ["attente", 3000]], e: [0, 180, 390, 273], j: [60, 130, 270, 356]},
  snake: {a: [["clic", "JOUER"], ["attente", 700]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  solitaire: {a: [["attente", 800]], e: [0, 40, 390, 273], j: [60, 20, 270, 356]},
  sudoku: {a: [["xy", [195, 340]], ["attente", 1500]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  'tank-arena': {a: [["js", "document.getElementById('bJouer').click()"], ["attente", 3500]], e: [0, 120, 390, 273], j: [60, 100, 270, 356]},
  'terres-franches': {a: [["attente", 1500]], e: [60, 250, 280, 196], j: [90, 220, 220, 290]},
  tetris: {a: [["clic", "JOUER"], ["touche", "Enter"], ["pluie", 14]], e: [20, 70, 210, 147], j: [20, 60, 210, 277]},
  'the-des-jarls': {a: [["clic", "DUEL LIBRE"], ["attente", 1500], ["xy", [110, 255]], ["attente", 800], ["xy", [293, 730]], ["attente", 3500]], e: [0, 170, 390, 273], j: [60, 120, 270, 356]},
  'touche-coule': {a: [], e: [20, 165, 350, 140], j: [120, 160, 150, 145]},
  yams: {a: [["clic", "NOUVELLE PARTIE"], ["attente", 2500]], e: [20, 320, 350, 245], j: [60, 200, 270, 356]},
};
async function joue(p, a){
  for (const [t, v] of a){
    if (t === "clic") await p.getByText(v).first().click({timeout: 2000}).catch(() => console.log("  pas trouvé :", v));
    else if (t === "xy") await p.mouse.click(v[0], v[1]);
    else if (t === "touche") await p.keyboard.press(v);
    else if (t === "tenir"){ await p.keyboard.down(v[0]); await p.waitForTimeout(v[1]); await p.keyboard.up(v[0]); }
    else if (t === "texte") await p.keyboard.type(v, {delay: 60});
    else if (t === "js") await p.evaluate(v).catch(e => console.log("  js :", e.message.slice(0, 60)));
    else if (t === "attente") await p.waitForTimeout(v);
    else if (t === "pluie") for (let i = 0; i < v; i++){   // Tetris : quelques pièces posées
      for (let k = 0; k < (i * 3) % 5; k++) await p.keyboard.press(i % 2 ? "ArrowLeft" : "ArrowRight");
      await p.keyboard.press(i % 3 ? "ArrowUp" : "Space"); await p.waitForTimeout(300);
    }
  }
}
// recadre la capture (cadre r, en pixels CSS) aux proportions de la sortie, réduit, et renvoie un JPEG
async function decoupe(atelier, png, r, [w, h], net){
  const d = await atelier.evaluate(async ({src, r, w, h, net}) => {
    const im = new Image(); im.src = src; await im.decode();
    const k = im.width / window.__vue;   // échelle de la capture (deviceScaleFactor)
    let [x, y, cw, ch] = r; const f = w / h;
    if (cw / ch > f){ const n = ch * f; x += (cw - n) / 2; cw = n; } else { const n = cw / f; y += (ch - n) / 2; ch = n; }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = !net; g.imageSmoothingQuality = "high";
    g.drawImage(im, x * k, y * k, cw * k, ch * k, 0, 0, w, h);
    return c.toDataURL("image/jpeg", .84);
  }, {src: "data:image/png;base64," + png.toString("base64"), r, w, h, net});
  return Buffer.from(d.split(",")[1], "base64");
}
(async () => {
  const args = process.argv.slice(2), bi = args.indexOf("--brut"), brut = bi >= 0 ? args.splice(bi, 2)[1] : null;
  const liste = args.length ? args : Object.keys(JEUX);
  const b = await chromium.launch({args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]});
  const atelier = await b.newPage();
  for (const n of liste){
    const c = JEUX[n]; if (!c){ console.log("inconnu :", n); continue; }
    const [vw, vh] = c.vue || [390, 760];
    const p = await b.newPage({viewport: {width: vw, height: vh}, deviceScaleFactor: 2});
    try {
      await p.goto(`http://localhost:8765/${n}/index.html`, {timeout: 20000}); await p.waitForTimeout(2500);
      await joue(p, c.a || []);
      const png = await p.screenshot();
      if (brut){ fs.mkdirSync(brut, {recursive: true}); fs.writeFileSync(path.join(brut, n + ".png"), png); }
      else {
        await atelier.evaluate(v => { window.__vue = v; }, vw);
        fs.writeFileSync(path.join(RACINE, n, "etiquette.jpg"), await decoupe(atelier, png, c.e, E, c.net));
        fs.writeFileSync(path.join(RACINE, n, "jaquette.jpg"), await decoupe(atelier, png, c.j, J, c.net));
      }
      console.log("ok", n);
    } catch (e){ console.log(n, e.message.slice(0, 100)); }
    await p.close();
  }
  await b.close();
})();
