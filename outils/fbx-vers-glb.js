// Rassemble des modèles 3D (FBX animés, glTF/GLB, OBJ+MTL) en un seul GLB, écrit en base64, pour une maquette sans fichiers à côté.
// node outils/fbx-vers-glb.js <dossier des modèles> <sortie.b64>
// Chaque fichier du dossier devient un objet nommé d'après son nom de fichier (sans extension) : dragon.fbx -> « dragon ».
// Il faut un three 0.128 dépaqueté dans <dossier>/../npm/package (npm pack three@0.128.0 ; jsdelivr est bloqué depuis le conteneur).
// Corrections faites ici (voir specs/dragon-des-toits.md) :
//  - les maillages à groupes non indexés (FBX, OBJ multi-matériaux) sont regroupés par matériau ET indexés,
//    sinon chaque primitive glTF dessine tout l'objet ;
//  - les os et pistes d'animation des FBX sont préfixés par le nom de l'objet (pas de collision entre deux squelettes Quaternius) ;
//  - hors FBX, les normales sont retirées et les sommets fusionnés (la page rend ces modèles en flatShading) ;
//  - les textures de même taille sont partagées (une seule copie dans le GLB).
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const D=path.resolve(process.argv[2]),OUT=process.argv[3],N=path.resolve(D,'../npm/package/examples/js')+'/',L=path.resolve(__dirname,'../lib')+'/';
const fichiers=fs.readdirSync(D).filter(f=>/\.(fbx|glb|gltf|obj)$/i.test(f)).sort();
(async()=>{const b=await chromium.launch();const p=await b.newPage();
p.on('console',m=>{const t=m.text();if(!/^THREE\.|GLTFExporter: Use Mesh/.test(t))console.log('>',t.slice(0,200));});p.on('pageerror',e=>console.log('ERR',e.message));
await p.route('http://x/**',r=>{const u=decodeURIComponent(new URL(r.request().url()).pathname);let f;
  if(u==='/')return r.fulfill({body:'<html></html>',contentType:'text/html'});
  if(u.startsWith('/n/'))f=N+u.slice(3);else if(u.startsWith('/l/'))f=L+u.slice(3);else f=u.startsWith('/f/')?D+'/'+u.slice(3):D+u;
  try{r.fulfill({body:fs.readFileSync(f)});}catch(e){console.log('manque',f);r.fulfill({status:404,body:''});}});
await p.goto('http://x/');
for(const s of['/l/three.min.js','/n/libs/fflate.min.js','/n/curves/NURBSUtils.js','/n/curves/NURBSCurve.js','/l/GLTFLoader.js','/n/loaders/FBXLoader.js','/n/loaders/OBJLoader.js','/n/loaders/MTLLoader.js','/n/exporters/GLTFExporter.js','/n/utils/BufferGeometryUtils.js'])await p.addScriptTag({url:'http://x'+s});
const b64=await p.evaluate(async(fichiers)=>{
  const sc=new THREE.Scene(),anims=[];
  function regrouper(o){const g=o.geometry;if(!g||g.index||g.groups.length<2)return;
    const nm=Array.isArray(o.material)?o.material.length:1,ord=[];
    for(let mi=0;mi<nm;mi++)for(const gr of g.groups)if((gr.materialIndex||0)===mi)ord.push([gr.start,gr.count,mi]);
    const ng=new THREE.BufferGeometry();
    for(const k in g.attributes){const at=g.attributes[k],sz=at.itemSize,arr=new at.array.constructor(at.count*sz);let off=0;
      for(const[st,ct]of ord){arr.set(at.array.subarray(st*sz,(st+ct)*sz),off);off+=ct*sz;}
      ng.setAttribute(k,new THREE.BufferAttribute(arr,sz,at.normalized));}
    let st=0;for(let mi=0;mi<nm;mi++){let c=0;for(const[,ct,m]of ord)if(m===mi)c+=ct;if(c)ng.addGroup(st,c,mi);st+=c;}
    const n=ng.attributes.position.count,ix=new Uint32Array(n);for(let i=0;i<n;i++)ix[i]=i;ng.setIndex(new THREE.BufferAttribute(ix,1));
    o.geometry=ng;}
  for(const f of fichiers){const nom=f.replace(/\.[^.]+$/,''),ext=f.split('.').pop().toLowerCase();let o;
    try{
      if(ext==='fbx'){o=await new Promise((ok,ko)=>new THREE.FBXLoader().load('/f/'+f,ok,null,ko));
        o.traverse(m=>{if(m.isMesh){const ms=[].concat(m.material).map(x=>new THREE.MeshStandardMaterial({color:x.color,metalness:0,roughness:.85,skinning:!!m.isSkinnedMesh,name:x.name}));m.material=Array.isArray(m.material)?ms:ms[0];}
          if(m!==o&&m.name)m.name=nom+'_'+m.name;});
        for(const c of o.animations){c.name=nom+'|'+c.name.split('|').pop();for(const t of c.tracks)t.name=nom+'_'+t.name;anims.push(c);}}
      else if(ext==='obj'){const mtl=await new Promise(ok=>new THREE.MTLLoader().setPath('/f/').load(nom+'.mtl',ok,null,()=>ok(null)));
        const ol=new THREE.OBJLoader();if(mtl){mtl.preload();ol.setMaterials(mtl);}o=await new Promise((ok,ko)=>ol.load('/f/'+f,ok,null,ko));
        o.traverse(m=>{if(m.isMesh){const ms=[].concat(m.material).map(x=>new THREE.MeshStandardMaterial({color:x.color,metalness:0,roughness:.85,name:x.name}));m.material=Array.isArray(m.material)?ms:ms[0];}});}
      else o=(await new Promise((ok,ko)=>new THREE.GLTFLoader().load('/f/'+f,ok,null,ko))).scene;
    }catch(e){console.log('echec',f,e&&e.message);continue;}
    o.traverse(regrouper);
    if(ext!=='fbx')o.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh)return;const g=m.geometry;g.deleteAttribute('normal');for(const k of Object.keys(g.attributes))if(!['position','uv'].includes(k))g.deleteAttribute(k);
      const gr=g.groups.slice(),mg=THREE.BufferGeometryUtils.mergeVertices(g,1e-4);for(const x of gr)mg.addGroup(x.start,x.count,x.materialIndex);m.geometry=mg;});
    o.name=nom;sc.add(o);
    const bb=new THREE.Box3().setFromObject(o),s=new THREE.Vector3();bb.getSize(s);console.log(nom,s.toArray().map(v=>v.toFixed(2)).join(' x '));}
  {const vu={};sc.traverse(o=>{if(!o.isMesh)return;for(const m of[].concat(o.material)){if(!m.map)continue;const im=m.map.image,cv=document.createElement('canvas');cv.width=cv.height=16;const cx=cv.getContext('2d');cx.drawImage(im,0,0,16,16);const k=(im.width||0)+'x'+(im.height||0)+'|'+Array.from(cx.getImageData(0,0,16,16).data).join(',');
    if(vu[k]&&vu[k]!==m.map)m.map=vu[k];else vu[k]=m.map;}});console.log('textures',Object.keys(vu).length);}
  console.log('animations',anims.map(a=>a.name).join(' '));
  const glb=await new Promise(ok=>new THREE.GLTFExporter().parse(sc,ok,{binary:true,animations:anims,embedImages:true}));
  let s='';const u=new Uint8Array(glb);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);
},fichiers);
fs.writeFileSync(OUT,b64);console.log('taille base64',b64.length);await b.close();})();
