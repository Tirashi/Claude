// Écurie miniature : fabrique l'étiquette de la disquette (ecurie/etiquette.jpg, en largeur) et la jaquette de la boîte du volet
// (ecurie/jaquette.jpg, en hauteur) avec la vitrine 3D du jeu et son bandeau « la télé » (règle de l'utilisateur : pas d'image inventée).
// Lancer un serveur à la racine (python3 -m http.server 8765), puis : node outils/ecurie-etiquette.js
const {chromium} = require('playwright');
const FORMATS = [
  {f: 'etiquette', w: 284, h: 200, cv: 'left:-50px;top:-8px;width:424px;height:265px', titre: 38},
  {f: 'jaquette', w: 200, h: 260, cv: 'left:-92px;top:72px;width:384px;height:240px', titre: 34}];
(async () => {
  const b = await chromium.launch(), p = await b.newPage({viewport: {width: 400, height: 400}, deviceScaleFactor: 2});
  await p.goto('http://localhost:8765/ecurie/index.html'); await p.waitForSelector('.titre', {timeout: 30000}); await p.waitForTimeout(500);
  for (const F of FORMATS) {
    await p.evaluate(F => {
      document.getElementById('app').innerHTML = `<div id="etq" style="position:absolute;left:0;top:0;width:${F.w}px;height:${F.h}px;overflow:hidden;background:radial-gradient(ellipse at 50% 75%,#2a3a60,#0b0f1a 72%)">
        <canvas id="cv" style="position:absolute;${F.cv}"></canvas>
        <div style="position:absolute;left:0;top:14px;display:grid;justify-items:start">
          <span style="font:900 italic 15px 'Titillium Web';letter-spacing:.28em;color:#2a0f00;background:#ff6a13;padding:3px 16px 2px 12px;clip-path:polygon(0 0,100% 0,92% 100%,0 100%)">ÉCURIE</span>
          <b style="font:900 italic ${F.titre}px/1 'Titillium Web';text-transform:uppercase;color:#fff;padding:2px 12px 0;text-shadow:0 2px 6px rgba(0,0,0,.6)">Miniature</b></div></div>`;
      window.__v = Scene3D.vitrine(document.getElementById('cv')); window.__v.montrer([['cosmo-italia', '#ff6a13']]);
    }, F);
    await p.evaluate(() => { for (let i = 0; i < 12; i++) window.__v.image(i ? 0 : 1.05); }); await p.waitForTimeout(400); await p.evaluate(() => window.__v.image(0));
    await (await p.$('#etq')).screenshot({path: `${__dirname}/../ecurie/${F.f}.jpg`, type: 'jpeg', quality: 86});
  }
  await b.close();
})();
