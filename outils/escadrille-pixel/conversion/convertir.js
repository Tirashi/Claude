const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const N=(process.env.THREE_JS||path.resolve(__dirname,'../../../npm/package/examples/js'))+'/';const PACKS=process.env.PACKS||path.resolve(__dirname,'packs');
const L=JSON.parse(fs.readFileSync(path.join(__dirname,'liste.json'))).map(e=>({...e,f:e.f.replace('PACKS',PACKS),tex:e.tex&&e.tex.replace('PACKS',PACKS)}));const sortie={};
function chercher(dir,nom){nom=nom.toLowerCase();const st=[dir];while(st.length){const d=st.pop();for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())st.push(p);else if(f.name.toLowerCase()===nom)return p;}}return null;}
(async()=>{const b=await chromium.launch();for(const e of L){const p=await b.newPage();p.on('pageerror',x=>console.log('ERR',e.cle,x.message));
  const dir=path.dirname(e.f),racine=path.resolve(dir,'..','..');
  await p.route('http://c.local/**',r=>{const u=decodeURIComponent(new URL(r.request().url()).pathname);let f=null;
    if(u==='/page.html')f=path.join(__dirname,'page.html');else if(u==='/js/three.min.js')f='/home/user/Claude/lib/three.min.js';else if(u.startsWith('/js/'))f=N+u.slice(4);
    else if(u.startsWith('/t/'))f=e.tex;else{const nom=u.split(/[\\/]/).pop();f=path.join(dir,nom);if(!fs.existsSync(f))f=chercher(dir,nom)||chercher(path.resolve(dir,'..'),nom)||chercher(racine,nom)||chercher(path.resolve(racine,'..'),nom);}
    if(!f||!fs.existsSync(f))return r.fulfill({status:404,body:''});r.fulfill({path:f});});
  await p.goto('http://c.local/page.html');try{const res=await p.evaluate(x=>convertir(x),e);sortie[e.cle]={nom:e.nom,pack:e.pack,b64:res.b64,taille:res.taille};console.log(e.cle,res.tris+' tri',Math.round(res.b64.length*.75/1024)+' Ko',res.taille.map(v=>v.toFixed(1)).join('×'));}catch(x){console.log('ECHEC',e.cle,x.message.slice(0,150));}
  await p.close();}
  fs.writeFileSync(path.join(__dirname,'modeles.json'),JSON.stringify(sortie));await b.close();})();
