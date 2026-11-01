// Convertit le dragon FBX (Quaternius) et des pièces KayKit glTF en un seul GLB en base64 (maquette de Dragon Simulator).
// node outils/fbx-vers-glb.js <dossier des téléchargements> <sortie.b64> <noms KayKit séparés par des virgules>
// Attend : <dossier>/dl-q/FBX/Dragon.fbx, <dossier>/dl-k/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/, <dossier>/npm/package (npm pack three@0.128.0).
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const S=process.argv[2], OUT=process.argv[3], NOMS=process.argv[4].split(',');
const K=S+'/dl-k/KayKit_City_Builder_Bits_1.0_FREE/Assets/gltf/', N=S+'/npm/package/examples/js/', L='/home/user/Claude/lib/';
(async()=>{const b=await chromium.launch();const p=await b.newPage();
p.on('console',m=>console.log('>',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
await p.route('http://x/**',r=>{const u=decodeURIComponent(new URL(r.request().url()).pathname);let f;
 if(u.startsWith('/k/'))f=K+u.slice(3);else if(u.startsWith('/n/'))f=N+u.slice(3);else if(u.startsWith('/l/'))f=L+u.slice(3);else if(u==='/dragon.fbx')f=S+'/dl-q/FBX/Dragon.fbx';else if(u==='/')return r.fulfill({body:'<html></html>',contentType:'text/html'});
 r.fulfill({body:fs.readFileSync(f)});});
await p.goto('http://x/');
for(const s of['/l/three.min.js','/n/libs/fflate.min.js','/n/curves/NURBSUtils.js','/n/curves/NURBSCurve.js','/l/GLTFLoader.js','/n/loaders/FBXLoader.js','/n/exporters/GLTFExporter.js'])await p.addScriptTag({url:'http://x'+s});
const b64=await p.evaluate(async(noms)=>{
  const fbx=await new Promise((ok,ko)=>new THREE.FBXLoader().load('/dragon.fbx',ok,null,ko));
  const box=new THREE.Box3().setFromObject(fbx);console.log('dragon',JSON.stringify(box.min),JSON.stringify(box.max),fbx.animations.map(a=>a.name+':'+a.duration.toFixed(2)).join(' '));
  fbx.name='dragon';
  fbx.traverse(o=>{if(!o.isMesh)return;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    const nm=ms.map(m=>new THREE.MeshStandardMaterial({color:m.color,metalness:0,roughness:.85,skinning:true,name:m.name}));
    const g=o.geometry;
    if(g.groups.length>1&&!g.index){const ord=[];for(let mi=0;mi<nm.length;mi++)for(const gr of g.groups)if(gr.materialIndex===mi)ord.push([gr.start,gr.count,mi]);
      const ng=new THREE.BufferGeometry();
      for(const k in g.attributes){const at=g.attributes[k],sz=at.itemSize,arr=new at.array.constructor(at.count*sz);let off=0;
        for(const[st,ct]of ord){arr.set(at.array.subarray(st*sz,(st+ct)*sz),off);off+=ct*sz;}
        ng.setAttribute(k,new THREE.BufferAttribute(arr,sz,at.normalized));}
      let st=0;for(let mi=0;mi<nm.length;mi++){let c=0;for(const[,ct,m]of ord)if(m===mi)c+=ct;if(c)ng.addGroup(st,c,mi);st+=c;}
      {const n=ng.attributes.position.count,ix=new Uint32Array(n);for(let i=0;i<n;i++)ix[i]=i;ng.setIndex(new THREE.BufferAttribute(ix,1));}o.geometry=ng;console.log('groupes',g.groups.length,'->',ng.groups.length);}
    o.material=Array.isArray(o.material)?nm:nm[0];});
  const sc=new THREE.Scene();sc.add(fbx);
  for(const n of noms){const g=await new Promise((ok,ko)=>new THREE.GLTFLoader().load('/k/'+n+'.gltf',ok,null,ko));const o=g.scene;o.name=n;sc.add(o);
    const bb=new THREE.Box3().setFromObject(o);console.log(n,bb.max.x.toFixed(2)-bb.min.x.toFixed(2),bb.max.y.toFixed(2),(bb.max.z-bb.min.z).toFixed(2));}
  const glb=await new Promise(ok=>new THREE.GLTFExporter().parse(sc,ok,{binary:true,animations:fbx.animations,embedImages:true}));
  let s='';const u=new Uint8Array(glb);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);
},NOMS);
fs.writeFileSync(OUT,b64);console.log('taille',b64.length);await b.close();})();
