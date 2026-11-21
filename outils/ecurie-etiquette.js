// Écurie miniature : fabrique ecurie/etiquette.jpg (étiquette de la disquette sur l'accueil) avec la vitrine 3D du jeu et son bandeau « la télé ».
// Lancer un serveur à la racine (python3 -m http.server 8765), puis : node outils/ecurie-etiquette.js
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:400},deviceScaleFactor:2});
await p.goto('http://localhost:8765/ecurie/index.html');await p.waitForSelector('.titre',{timeout:30000});await p.waitForTimeout(500);
await p.evaluate(()=>{const app=document.getElementById('app');
 app.innerHTML=`<div id="etq" style="position:absolute;left:0;top:0;width:284px;height:200px;overflow:hidden;background:radial-gradient(ellipse at 50% 75%,#2a3a60,#0b0f1a 72%)">
  <canvas id="cv" style="position:absolute;left:-50px;top:-8px;width:424px;height:265px"></canvas>
  <div style="position:absolute;left:0;top:14px;display:grid;justify-items:start">
   <span style="font:900 italic 15px 'Titillium Web';letter-spacing:.28em;color:#2a0f00;background:#ff6a13;padding:3px 16px 2px 12px;clip-path:polygon(0 0,100% 0,92% 100%,0 100%)">ÉCURIE</span>
   <b style="font:900 italic 38px/1 'Titillium Web';text-transform:uppercase;color:#fff;padding:2px 12px 0;text-shadow:0 2px 6px rgba(0,0,0,.6)">Miniature</b></div>
  </div>`;
 const v=Scene3D.vitrine(document.getElementById('cv'));v.montrer([['cosmo-italia','#ff6a13']]);
 window.__v=v;});
await p.evaluate(()=>{for(let i=0;i<12;i++)window.__v.image(i?0:1.05);});await p.waitForTimeout(400);await p.evaluate(()=>window.__v.image(0));
await (await p.$('#etq')).screenshot({path:'/home/user/Claude/ecurie/etiquette.jpg',type:'jpeg',quality:86});await b.close();})();
