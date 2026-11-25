// node cuire.js <liste.json> <sortie.json> : liste = [{nom,fichier,rot,ignorer}]
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const [LISTE,OUT]=process.argv.slice(2);const N=(process.env.THREE_JS||path.resolve(__dirname,'../../npm/package/examples/js'))+'/';const L=JSON.parse(fs.readFileSync(LISTE));
(async()=>{const b=await chromium.launch();const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
  let courant=null;
  await p.route('http://v.local/**',r=>{let u=decodeURIComponent(new URL(r.request().url()).pathname);if(/\.tga$/i.test(u))u=u.replace(/\.tga$/i,'.png');u=u.replace(/\\/g,'/');let f;
    if(u==='/page.html')f=path.resolve(__dirname,'page.html');else if(u==='/js/three.min.js')f='/home/user/Claude/lib/three.min.js';else if(u.startsWith('/js/'))f=N+u.slice(4);
    else{const D=path.dirname(courant);f=path.join(D,path.basename(u));if(!fs.existsSync(f)){const nom=path.basename(u).toLowerCase();
      const cherche=d=>{for(const x of fs.readdirSync(d,{withFileTypes:true})){const q=path.join(d,x.name);if(x.isDirectory()){const r=cherche(q);if(r)return r;}else if(x.name.toLowerCase()===nom)return q;}};
      f=cherche(path.dirname(D))||cherche(path.dirname(path.dirname(D)));if(!f)return r.fulfill({status:404,body:''});}}
    r.fulfill({path:f});});
  await p.goto('http://v.local/page.html');const res={};
  for(const m of L){courant=m.fichier;try{res[m.nom]=await p.evaluate(a=>cuire(...a),['http://v.local/m/'+encodeURIComponent(path.basename(m.fichier)),m.rot||0,m.ignorer||'',m.tex?'http://v.local/m/'+m.tex:'']);console.log(m.nom,res[m.nom].tris,'triangles',res[m.nom].pal.length,'couleurs',res[m.nom].dims.map(x=>x.toFixed(2)).join('x'));}catch(e){console.log('ECHEC',m.nom,String(e).slice(0,150));}}
  fs.writeFileSync(OUT,JSON.stringify(res));await b.close();})();
