/* Rend des modèles .glb (ex. Kenney Space Kit) vus de dessus, une ligne de N angles par modèle, fond transparent.
   Usage : MODELES=<dossier des .glb> SORTIE=<dossier> LIB=lib NAMES=craft_miner,craft_cargoA YAWS=32 TILE=160 PITCH=20 node outils/sprites-kenney/rendu.js
   Image 0 = nez en haut ; image i tournée de i/N de tour dans le sens des aiguilles d'une montre. Matériaux remplacés par du Lambert (la palette de texture reste). */
const {chromium}=require('playwright');const fs=require('fs');
const M=(process.env.MODELES||'.')+'/';
const names=(process.env.NAMES||'craft_miner,craft_cargoA,craft_cargoB,craft_racer,craft_speederA,craft_speederB,craft_speederC,craft_speederD').split(',');
const YAWS=+process.env.YAWS||2, TILE=+process.env.TILE||160, PITCH=+(process.env.PITCH||0);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:TILE*YAWS,height:TILE*names.length}});
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>m.type()==='error'&&console.log('C',m.text()));
await p.setContent('<body style="margin:0;background:#0b1730"></body>');
for(const f of ['three.min.js','GLTFLoader.js'])await p.addScriptTag({content:fs.readFileSync((process.env.LIB||'lib')+'/'+f,'utf8')});
const data={};for(const n of names)data[n]=fs.readFileSync(M+n+'.glb').toString('base64');
const out=await p.evaluate(async({data,names,YAWS,TILE,PITCH})=>{
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(TILE,TILE);renderer.setClearColor(0x000000,0);renderer.outputEncoding=THREE.sRGBEncoding;
  const res={};
  for(const n of names){
    const bin=Uint8Array.from(atob(data[n]),c=>c.charCodeAt(0)).buffer;
    const gltf=await new Promise((ok,ko)=>new THREE.GLTFLoader().parse(bin,'',ok,ko));
    const root=gltf.scene;root.traverse(o=>{if(o.isMesh){const m=o.material;o.material=new THREE.MeshLambertMaterial({map:m.map||null,color:m.color||0xffffff,vertexColors:!!m.vertexColors})}});const box=new THREE.Box3().setFromObject(root);const size=box.getSize(new THREE.Vector3()),ctr=box.getCenter(new THREE.Vector3());
    root.position.sub(ctr);const holder=new THREE.Group();holder.add(root);
    const scene=new THREE.Scene();scene.add(holder);
    scene.add(new THREE.HemisphereLight(0xffffff,0x8d99b8,.5));
    const dl=new THREE.DirectionalLight(0xfff4e6,.55);dl.position.set(-3,6,-2);scene.add(dl);
    const R=Math.max(size.x,size.z)*.62;const cam=new THREE.OrthographicCamera(-R,R,R,-R,.1,100);
    const pr=PITCH*Math.PI/180;cam.position.set(0,10*Math.cos(pr),10*Math.sin(pr));cam.lookAt(0,0,0);cam.up.set(0,0,-1);cam.updateProjectionMatrix();
    const row=document.createElement('canvas');row.width=TILE*YAWS;row.height=TILE;const g=row.getContext('2d');
    for(let i=0;i<YAWS;i++){holder.rotation.y=-i/YAWS*Math.PI*2;renderer.render(scene,cam);g.drawImage(renderer.domElement,i*TILE,0)}
    res[n]={png:row.toDataURL('image/png'),size:[size.x,size.y,size.z]};
  }return res},{data,names,YAWS,TILE,PITCH});
const OUT=process.env.SORTIE||'out';fs.mkdirSync(OUT,{recursive:true});
for(const n of names){fs.writeFileSync(OUT+'/'+n+'.png',Buffer.from(out[n].png.split(',')[1],'base64'));console.log(n,out[n].size.map(v=>v.toFixed(2)).join(' '))}
await b.close()})();
