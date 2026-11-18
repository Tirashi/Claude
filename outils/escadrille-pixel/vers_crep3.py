# Escadrille crépuscule : les 21 modèles des packs de l'utilisateur, au choix dans un hangar
import sys,json
S=sys.argv[1];p=S+'/crep.html';s=open(p).read()
def rep(a,b):
    global s
    assert a in s,a[:80]; s=s.replace(a,b)
PI='Math.PI'
ROT={'mono_plane01':'Math.PI/2','mono_plane02':'Math.PI/2','mono_plane03':'Math.PI/2','mono_plane04':'Math.PI/2','mono_plane05':'Math.PI/2','mono_plane06':'Math.PI/2',
 'mono_microrecon':PI,'mono_redfighter':PI,'mono_camo':PI,'mono_infrared':PI,'mono_dual':PI,'niko_fighter':'-Math.PI/2','niko_bomber':'0','texnist2':PI,'texnist4':PI,
 'fga_corvette':'-Math.PI/2','fga_frigate':'-Math.PI/2','maja1':'0','maja2':'0','maja3':'0','maja4':PI}
HELICE={'mono_plane01','mono_plane02','mono_plane03','mono_plane04','mono_plane05','mono_plane06'}
PACKS={'monoplane':'MONOGON · VOXEL PLANE (CC BY-ND)','monoship':'MONOGON · VOXEL SPACESHIPS (CC BY-ND)','niko':'NIKO-3D-MODELS','texnist':'TEXNIST · VOXEL SPACESHIPS (CC BY)','fga':'FREE GAME ASSETS (craftpix)','maja':'MAJADROID (CC0)'}
# 1. les modèles importés : analysés une fois au départ, puis clonés
rep("function construire(c,flammes){const r=MODELES3D[c.m](c);",
"""// modèles importés (GLB en base64, GLBS) : analysés une seule fois, puis clonés ; matériaux convertis en Lambert à facettes
const IMPORTS={};const b64=s=>{const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;};
await Promise.all(Object.entries(GLBS).map(([k,v])=>new Promise(ok=>new THREE.GLTFLoader().parse(b64(v.b64),'',g=>{const sc0=g.scene;
  sc0.traverse(o=>{if(o.isMesh){const mm=Array.isArray(o.material)?o.material:[o.material];const n=mm.map(m=>new THREE.MeshLambertMaterial({color:m.color,map:m.map||null,flatShading:true,side:THREE.DoubleSide}));o.material=Array.isArray(o.material)?n:n[0];}});
  IMPORTS[k]=sc0;ok();},()=>ok()))));
function importe(cle,rot,taille){const g=new THREE.Group(),m=IMPORTS[cle].clone();const piv=new THREE.Group();piv.add(m);piv.rotation.y=rot;g.add(piv);
  const b=new THREE.Box3().setFromObject(piv),s=new THREE.Vector3();b.getSize(s);const k=taille/Math.max(s.x,s.z);piv.scale.setScalar(k);const b2=new THREE.Box3().setFromObject(piv),c=b2.getCenter(new THREE.Vector3());piv.position.sub(c);
  const s2=new THREE.Vector3();b2.getSize(s2);return{g,env:s2.x/2,arriere:s2.z/2,larg:s2.x};}
function construire(c,flammes){if(c.m==='import'){const r=importe(c.cle,c.rot,c.taille||6.4);r.tuy=c.helice?[]:[[r.larg*.12,0,r.arriere],[-r.larg*.12,0,r.arriere]];r.flammes=[];
    if(flammes)for(const t of r.tuy){const f=new THREE.Group();const a=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,1.1),new THREE.MeshBasicMaterial({color:'#ffb040',fog:false}));a.position.z=.55;const b=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.6),new THREE.MeshBasicMaterial({color:'#ffe080',fog:false}));b.position.z=.3;f.add(a,b);f.position.set(t[0],t[1],t[2]);r.g.add(f);r.flammes.push(f);}
    return r;}
  const r=MODELES3D[c.m](c);""")
# 2. la liste : nos 5 avions puis ceux des packs
ent=",\n  ".join(f"'{k}':{{m:'import',cle:'{k}',rot:{ROT[k]},pack:'{{PACK_{k}}}'{',helice:1' if k in HELICE else ''}}}" for k in ROT)
rep("const NOMS=Object.keys(COULEURS);","""const PACKS="""+json.dumps(PACKS)+""";
Object.assign(COULEURS,{"""+ent+"""});
for(const k in COULEURS){const c=COULEURS[k];c.pack=c.m==='import'?(PACKS[GLBS[c.cle].pack]||''):'ESCADRILLE (construits dans le code)';c.nom=c.m==='import'?GLBS[c.cle].nom:k;}
const NOMS=Object.keys(COULEURS);""")
# 3. le hangar : un panneau avec tous les avions, groupés par pack
rep("function changerAvion(){choix=(choix+1)%NOMS.length;","function choisir(k){choix=k;nav.remove(moi);modele=construire(COULEURS[NOMS[choix]],true);moi=modele.g;moi.scale.setScalar(.66);nav.add(moi);versCalque(moi);try{localStorage.setItem('escadrille.avion3d',NOMS[choix]);}catch(e){}annonce(`HANGAR<b>${COULEURS[NOMS[choix]].nom}</b>${COULEURS[NOMS[choix]].pack}`);}\nconst hangar=document.getElementById('hangar');\nfunction ouvrirHangar(){let h='<b>HANGAR</b>';let pk='';NOMS.forEach((n,k)=>{const c=COULEURS[n];if(c.pack!==pk){pk=c.pack;h+=`<i>${pk}</i>`;}h+=`<button data-k=\"${k}\" class=\"${k===choix?'on':''}\">${c.nom}</button>`;});h+='<button data-k=\"x\" class=\"fermer\">FERMER</button>';hangar.innerHTML=h;hangar.style.display='flex';}\nhangar.addEventListener('pointerdown',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;if(b.dataset.k!=='x')choisir(+b.dataset.k);hangar.style.display='none';});\nfunction changerAvion(){choix=(choix+1)%NOMS.length;")
rep("bouton('bAvion',d=>{if(d)changerAvion();});","bouton('bAvion',d=>{if(d)ouvrirHangar();});")
rep('<button class="rond" id="bAvion">AVION</button>','<div class="hangar" id="hangar"></div><button class="rond" id="bAvion">AVION</button>')
rep(".charge{",".hangar{position:absolute;inset:8px;z-index:5;display:none;flex-direction:column;gap:5px;overflow:auto;padding:12px;background:rgba(28,22,44,.92);border-radius:16px;font:11px/1.4 var(--titre);color:#fff;touch-action:pan-y}\n.hangar b{font-size:15px;letter-spacing:.14em;margin-bottom:4px}.hangar i{font-style:normal;color:#f2c94c;margin-top:8px;font-size:10px}\n.hangar button{font:11px var(--titre);text-align:left;padding:8px 10px;border-radius:8px;border:1px solid rgba(220,200,240,.4);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}\n.hangar button.on{background:#e2682e}.hangar .fermer{text-align:center;margin-top:8px}\n.charge{")
# 4. bombardiers ennemis : la frégate de Free Game Assets
rep("const m=construire(bomb?{m:'spectre',corps:'#2e2a36',aile:'#46404e',accent:'#d2402e',verriere:'#d2402e'}:","const m=construire(bomb?{m:'import',cle:'fga_frigate',rot:-Math.PI/2,taille:6.4}:")
# chargement : GLTFLoader est déjà chargé par la page
rep("Cinq avions différents au choix (bouton AVION, touche C) : Faucon, Hirondelle, Corsaire (à hélice), Vipère, Spectre (aile volante).","Le bouton AVION ouvre le hangar : nos 5 avions et 21 modèles des packs que tu as choisis (monogon, niko, Texnist, Free Game Assets, Majadroid) ; la touche C passe au suivant.")
open(p,'w').write(s)
print('ok')
