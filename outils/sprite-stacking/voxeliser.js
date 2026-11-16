// node voxeliser.js <modèle> <longueur en voxels> <sortie.json> [rotY]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [M,L,OUT,ROT,WM]=process.argv.slice(2);const N=(process.env.THREE_JS||path.resolve(__dirname,'../../npm/package/examples/js'))+'/',D=path.dirname(path.resolve(M));
(async()=>{const b=await chromium.launch();const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(/rror/.test(m.text()))console.log('>',m.text().slice(0,200));});
  await p.route('http://v.local/**',r=>{const u=decodeURIComponent(new URL(r.request().url()).pathname);let f;
    if(u==='/page.html')f=path.resolve(__dirname,'voxeliseur.html');else if(u==='/js/three.min.js')f='/home/user/Claude/lib/three.min.js';else if(u.startsWith('/js/'))f=N+u.slice(4);else f=path.join(D,path.basename(u));
    if(!fs.existsSync(f)){ // texture cherchée ailleurs : on la cherche par son nom dans le dossier du modèle
      const nom=path.basename(u).toLowerCase();const t=fs.readdirSync(D).find(x=>x.toLowerCase()===nom);if(t)f=path.join(D,t);else return r.fulfill({status:404,body:''});}
    r.fulfill({path:f});});
  await p.goto('http://v.local/page.html');const res=await p.evaluate(a=>voxeliser(...a),['http://v.local/'+path.basename(M),Number(L),Number(ROT||0),Number(WM||0)]);
  fs.writeFileSync(OUT,JSON.stringify(res));console.log(path.basename(M),res.dims);await b.close();})();
