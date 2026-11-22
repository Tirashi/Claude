// Étiquettes des jeux (règle de l'utilisateur du 22/11, maquette maquettes/etiquettes-jeux.html, direction C « photo brillante ») :
// joue un peu chaque jeu dans Chromium, capture une scène et en tire <dossier>/etiquette.jpg (cartouche, en largeur)
// et <dossier>/jaquette.jpg (boîte du volet, en hauteur). Le titre n'est pas dans l'image : l'accueil le pose par-dessus.
// Lancer un serveur à la racine (python3 -m http.server 8765), puis : node outils/etiquettes.js [dossier…] [--brut <rép>]
//   --brut <rép> : enregistre seulement la capture plein écran de chaque jeu (pour choisir les cadrages).
// Chaque jeu : a = actions (["clic", texte] · ["xy", [x, y]] · ["touche", touche] · ["texte", lettres] · ["js", code] · ["attente", ms]), vue = [largeur, hauteur]
// (390 × 760 par défaut), e et j = cadres [x, y, largeur, hauteur] en pixels CSS de la vue pour l'étiquette et la jaquette.
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const RACINE = path.join(__dirname, '..');
const E = [300, 210], J = [220, 290];   // tailles des images (étiquette, jaquette)
const JEUX = {
  alunissage: {a: [["xy", [195, 485]], ["attente", 3000]], e: [165, 45, 200, 140], j: [190, 30, 150, 198]},
  amiral: {a: [["xy", [195, 454]], ["attente", 1500], ["xy", [293, 688]], ["attente", 2500]], e: [10, 120, 370, 259], j: [40, 100, 300, 395]},
  asteroids: {a: [["touche", "Space"], ["attente", 2500]], e: [0, 330, 390, 273], j: [60, 250, 270, 356]},
  bannieres: {a: [["xy", [195, 290]], ["attente", 1500], ["xy", [195, 386]], ["attente", 4000], ["js", "fermer()"], ["attente", 1200]], e: [0, 140, 390, 273], j: [40, 110, 310, 409]},
  bastion: {a: [["xy", [195, 382]], ["attente", 2000], ["xy", [293, 652]], ["attente", 4000]], e: [0, 300, 390, 273], j: [60, 230, 270, 356]},
  boutique: {a: [], e: [10, 140, 370, 259], j: [60, 110, 270, 356]},
  'capitaine-du-port': {a: [["xy", [84, 362]], ["attente", 3000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  'ciel-de-guerre': {a: [["xy", [195, 371]], ["attente", 6000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  club: {a: [], e: [10, 150, 370, 170], j: [100, 120, 190, 250]},
  'doggy-saga': {a: [["clic", "Jouer"], ["attente", 1500], ["clic", "C'est parti"], ["attente", 2000]], e: [10, 230, 370, 259], j: [40, 210, 300, 395]},
  'dragon-simulator': {a: [], e: [0, 30, 390, 273], j: [60, 10, 270, 356]},
  duche: {a: [["clic", "PARTIE LIBRE"], ["attente", 1200], ["clic", "FACILE"], ["attente", 3000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  empilage: {a: [["xy", [195, 549]], ["attente", 1500], ["xy", [195, 400]], ["attente", 1100], ["xy", [195, 400]], ["attente", 1100], ["xy", [195, 400]], ["attente", 1500]], e: [0, 250, 390, 273], j: [60, 170, 270, 356]},
  escadrille: {a: [["xy", [195, 496]], ["attente", 1500]], e: [10, 120, 370, 259], j: [40, 100, 300, 395]},
  injagility: {a: [], e: [100, 215, 190, 133], j: [130, 200, 130, 170]},
  lanterne: {a: [["clic", "Nouvelle partie"], ["attente", 1500], ["clic", "Commencer"], ["attente", 4000]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  lignee: {a: [["clic", "FACILE"], ["attente", 1500]], e: [10, 90, 370, 259], j: [40, 80, 310, 409]},
  'lune-rover': {a: [], e: [40, 320, 310, 217], j: [70, 290, 250, 330]},
  magasinier: {a: [["xy", [195, 365]], ["attente", 1500], ["xy", [89, 357]], ["attente", 3500]], e: [0, 200, 390, 273], j: [60, 150, 270, 356]},
  'mineur-de-l-espace': {vue: [760, 390], a: [["xy", [380, 200]], ["touche", "Space"], ["touche", "Enter"], ["attente", 4000]], e: [180, 60, 400, 280], j: [270, 40, 220, 290]},
  'mot-d-or': {a: [["touche", "Escape"], ["js", "document.querySelectorAll('.modal,.aide,.overlay,dialog').forEach(e=>e.remove())"], ["texte", "POMME"], ["touche", "Enter"], ["attente", 1800], ["texte", "TABLE"], ["touche", "Enter"], ["attente", 1800]], e: [20, 40, 350, 245], j: [40, 30, 310, 409]},
  nebula: {a: [], e: [0, 240, 390, 273], j: [60, 200, 270, 356]},
  odyssee: {a: [["clic", "JOUER"], ["attente", 3000]], e: [0, 150, 390, 273], j: [60, 120, 270, 356]},
  orbite: {a: [], e: [40, 150, 310, 217], j: [70, 100, 250, 330]},
  picross: {a: [["xy", [111, 326]], ["attente", 2000]], e: [20, 150, 350, 245], j: [10, 20, 370, 488]},
  politique: {a: [["xy", [89, 421]], ["attente", 2000], ["xy", [195, 150]], ["attente", 2000], ["xy", [195, 240]], ["attente", 3000]], e: [0, 170, 390, 273], j: [60, 150, 270, 356]},
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
async function decoupe(atelier, png, r, [w, h]){
  const d = await atelier.evaluate(async ({src, r, w, h}) => {
    const im = new Image(); im.src = src; await im.decode();
    const k = im.width / window.__vue;   // échelle de la capture (deviceScaleFactor)
    let [x, y, cw, ch] = r; const f = w / h;
    if (cw / ch > f){ const n = ch * f; x += (cw - n) / 2; cw = n; } else { const n = cw / f; y += (ch - n) / 2; ch = n; }
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
    g.drawImage(im, x * k, y * k, cw * k, ch * k, 0, 0, w, h);
    return c.toDataURL("image/jpeg", .84);
  }, {src: "data:image/png;base64," + png.toString("base64"), r, w, h});
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
        fs.writeFileSync(path.join(RACINE, n, "etiquette.jpg"), await decoupe(atelier, png, c.e, E));
        fs.writeFileSync(path.join(RACINE, n, "jaquette.jpg"), await decoupe(atelier, png, c.j, J));
      }
      console.log("ok", n);
    } catch (e){ console.log(n, e.message.slice(0, 100)); }
    await p.close();
  }
  await b.close();
})();
