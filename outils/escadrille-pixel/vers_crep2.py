# Escadrille crépuscule : 5 avions différents, ennemis variés (as, bombardiers), décor avec arbres, villages et voiliers
import sys
S=sys.argv[1];p=S+'/crep.html';s=open(p).read()
def rep(a,b):
    global s
    assert a in s,a[:80]; s=s.replace(a,b)
def bloc(deb,fin,nouveau,avec_fin=False):
    global s
    i=s.index(deb);j=s.index(fin,i)+(len(fin) if avec_fin else 0);s=s[:i]+nouveau+s[j:]
AVIONS=r"""// avions low poly construits dans le code : chacun renvoie {g, tuy (tuyères), env (demi-envergure), helice}
const MATS={};const M=col=>MATS[col]||(MATS[col]=new THREE.MeshLambertMaterial({color:col,flatShading:true,side:THREE.DoubleSide}));
const V2=(x,y)=>new THREE.Vector2(x,y);
function plan(pts,ep,col){return new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x,z])=>V2(x,z))),{depth:ep,bevelEnabled:false}).rotateX(Math.PI/2),M(col));}
function paire(g,pts,ep,col,y=0){for(const s of[1,-1]){const a=plan(pts,ep,col);a.scale.x=s;a.position.y=y;g.add(a);}}
function derive(g,pts,ep,col,x,y,z,inc=0){const d=new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([a,b])=>V2(a,b))),{depth:ep,bevelEnabled:false}).rotateY(-Math.PI/2),M(col));d.position.set(x,y,z);d.rotation.z=inc;g.add(d);}
function piece(g,geo,col,x,y,z){const m=new THREE.Mesh(geo,M(col));m.position.set(x,y,z);g.add(m);return m;}
const cyl=(a,b,l,n)=>new THREE.CylinderGeometry(a,b,l,n).rotateX(Math.PI/2),cone=(r,l,n)=>new THREE.ConeGeometry(r,l,n).rotateX(-Math.PI/2);
const MODELES3D={
  faucon(c){const g=new THREE.Group();piece(g,cyl(.38,.62,4.2,6),c.corps,0,0,0);piece(g,cone(.38,1.6,6),c.corps,0,0,-2.9);piece(g,new THREE.BoxGeometry(.42,.32,1.1),c.verriere,0,.45,-1.1);piece(g,new THREE.BoxGeometry(.18,.06,3),c.accent,0,.6,.6);
    paire(g,[[.4,-.9],[3,1.1],[3,1.6],[.4,1.7]],.24,c.aile,-.05);for(const s of[1,-1]){piece(g,new THREE.BoxGeometry(.22,.16,.9),c.accent,2.95*s,-.02,1.3);derive(g,[[0,0],[1.3,0],[1.25,1.2],[.75,1.2]],.08,c.aile,.55*s,.15,.6,-.3*s);piece(g,cyl(.3,.3,.8,6),'#1a1c22',.34*s,-.05,2.2);}
    return{g,tuy:[[.34,-.05,2.62],[-.34,-.05,2.62]],env:3};},
  hirondelle(c){const g=new THREE.Group();piece(g,cyl(.3,.5,4.6,6),c.corps,0,0,0);piece(g,cone(.34,1.9,6),c.corps,0,0,-3.2);piece(g,new THREE.BoxGeometry(.38,.3,1.2),c.verriere,0,.4,-1.4);
    paire(g,[[.35,1.2],[2.9,-.5],[2.9,.15],[.35,2.1]],.2,c.aile,-.02);paire(g,[[.3,-1.7],[1.15,-1.35],[1.15,-1.05],[.3,-.95]],.1,c.aile,.05);paire(g,[[.3,1.8],[1.3,2.2],[1.3,2.5],[.3,2.4]],.1,c.aile,.05);
    for(const s of[1,-1])piece(g,new THREE.BoxGeometry(.18,.14,.7),c.accent,2.85*s,-.02,-.15);derive(g,[[0,0],[1.6,0],[1.45,1.5],[.9,1.5]],.09,c.aile,.045,.3,.6);piece(g,new THREE.BoxGeometry(.1,.08,3.4),c.accent,0,.5,.3);
    piece(g,cyl(.36,.36,.7,8),'#1a1c22',0,0,2.45);return{g,tuy:[[0,0,2.85]],env:2.9};},
  corsaire(c){const g=new THREE.Group();piece(g,cyl(.28,.55,4.4,8),c.corps,0,0,0);piece(g,cyl(.6,.62,.8,10),c.accent,0,0,-2.45);piece(g,cone(.22,.5,8),'#e8e0d0',0,0,-3.05);
    const h=new THREE.Group();h.position.z=-2.95;for(let k=0;k<3;k++){const p=new THREE.Mesh(new THREE.BoxGeometry(.13,2.8,.05),M('#2a2620'));p.rotation.z=k*Math.PI*2/3;h.add(p);}g.add(h);
    paire(g,[[.4,-1.1],[3.3,-.75],[3.6,-.4],[3.35,.05],[.4,.5]],.18,c.aile,-.25);for(const s of[1,-1])piece(g,new THREE.BoxGeometry(.3,.12,.6),c.accent,3.3*s,-.25,-.35);
    const b=piece(g,new THREE.SphereGeometry(.4,8,6),c.verriere,0,.48,-.55);b.scale.set(1,.85,1.7);derive(g,[[0,0],[1.2,0],[1.05,1.15],[.55,1.25]],.08,c.aile,.04,.15,1.35);
    paire(g,[[.25,1.45],[1.45,1.7],[1.45,2.15],[.25,2.25]],.08,c.aile,.05);for(const s of[1,-1])piece(g,new THREE.BoxGeometry(.12,.12,.5),'#2a2620',.55*s,-.05,-1.75);
    return{g,tuy:[],env:3.6,helice:h};},
  vipere(c){const g=new THREE.Group();piece(g,new THREE.BoxGeometry(1.4,.55,4.6),c.corps,0,0,.1);piece(g,cone(.45,2.1,6),c.corps,0,0,-3.2);piece(g,new THREE.BoxGeometry(.44,.34,1.2),c.verriere,0,.42,-1.7);
    for(const s of[1,-1]){piece(g,new THREE.BoxGeometry(.46,.5,1.5),'#2a2630',.95*s,-.05,-.7);derive(g,[[0,0],[1.6,0],[1.45,1.75],[.9,1.75]],.09,c.aile,.72*s,.25,.95,-.12*s);piece(g,cyl(.34,.34,.8,8),'#1a1c22',.42*s,-.02,2.6);piece(g,new THREE.BoxGeometry(.22,.16,.7),c.accent,3.15*s,-.02,1.35);}
    paire(g,[[.7,-.45],[3.2,1.15],[3.2,1.7],[.7,2.0]],.22,c.aile,-.05);paire(g,[[.7,-2.0],[1.65,-1.6],[1.65,-1.3],[.7,-1.15]],.1,c.aile,.08);piece(g,new THREE.BoxGeometry(.2,.06,3.6),c.accent,0,.3,.2);
    return{g,tuy:[[.42,-.02,3.02],[-.42,-.02,3.02]],env:3.2};},
  spectre(c){const g=new THREE.Group();const pts=[[0,-2.7],[3.7,1.15],[3.1,1.7],[1.6,1.0],[0,1.8],[-1.6,1.0],[-3.1,1.7],[-3.7,1.15]];
    const w=new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x,z])=>V2(x,z))),{depth:.28,bevelEnabled:false}).rotateX(Math.PI/2),M(c.aile));w.position.y=.1;g.add(w);
    const bosse=piece(g,new THREE.SphereGeometry(1,8,6),c.corps,0,.05,-.2);bosse.scale.set(.85,.38,2.1);const v=piece(g,new THREE.SphereGeometry(.3,8,5),c.verriere,0,.32,-1.3);v.scale.set(1,.6,1.6);
    for(const s of[1,-1]){piece(g,new THREE.BoxGeometry(.6,.1,.2),c.accent,3.3*s,-.05,1.35);piece(g,new THREE.BoxGeometry(.5,.16,.3),'#1a1c22',.55*s,0,1.35);}
    return{g,tuy:[[.55,0,1.55],[-.55,0,1.55]],env:3.6};}};
const COULEURS={FAUCON:{m:'faucon',corps:'#7f7896',aile:'#a49dba',accent:'#e2682e',verriere:'#ffcf7a'},HIRONDELLE:{m:'hirondelle',corps:'#2f5690',aile:'#5f8cc4',accent:'#f2c94c',verriere:'#ffb040'},
  CORSAIRE:{m:'corsaire',corps:'#4a6236',aile:'#6f8a52',accent:'#f2c94c',verriere:'#86bdea'},VIPERE:{m:'vipere',corps:'#6a2a26',aile:'#a04e36',accent:'#ffe080',verriere:'#7fd0ff'},
  SPECTRE:{m:'spectre',corps:'#3a3a48',aile:'#565668',accent:'#7fd0ff',verriere:'#ffcf7a'}};
function construire(c,flammes){const r=MODELES3D[c.m](c);r.flammes=[];if(flammes)for(const t of r.tuy){const f=new THREE.Group();const a=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,1.1),new THREE.MeshBasicMaterial({color:'#ffb040',fog:false}));a.position.z=.55;
    const b=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.6),new THREE.MeshBasicMaterial({color:'#ffe080',fog:false}));b.position.z=.3;f.add(a,b);f.position.set(t[0],t[1],t[2]);r.g.add(f);r.flammes.push(f);}return r;}
function chasseur(c){return construire(Object.assign({m:'faucon'},c),false).g;}
const NOMS=Object.keys(COULEURS);let choix=0;try{choix=Math.max(0,NOMS.indexOf(localStorage.getItem('escadrille.avion3d')));}catch(e){}
const nav=new THREE.Group();let modele=construire(COULEURS[NOMS[choix]],true),moi=modele.g;moi.scale.setScalar(.66);nav.add(moi);sc.add(nav);versCalque(nav);
"""
bloc("// un chasseur construit dans le code","const ombre=",AVIONS)
# changement d'avion : on reconstruit le modèle et ses flammes
bloc("function changerAvion(){","\n","function changerAvion(){choix=(choix+1)%NOMS.length;nav.remove(moi);modele=construire(COULEURS[NOMS[choix]],true);moi=modele.g;moi.scale.setScalar(.66);nav.add(moi);versCalque(moi);try{localStorage.setItem('escadrille.avion3d',NOMS[choix]);}catch(e){}annonce(`HANGAR<b>${NOMS[choix]}</b>Bon vol !`);}")
rep("nav.position.copy(S.p);feu.scale.set(.6,.6,.55+Math.random()*.5);","nav.position.copy(S.p);for(const f of modele.flammes)f.scale.set(1,1,.6+Math.random()*.7);if(modele.helice)modele.helice.rotation.z+=dt*40;")
rep("const w=new THREE.Vector3((k?1:-1)*2,0,1)","const w=new THREE.Vector3((k?1:-1)*modele.env*.66,0,1)")
# ennemis variés : chasseurs, as (Vipère rouge), bombardiers (aile volante géante, lente, mitrailleur arrière)
rep("function ennemi(pos,dir){const g=new THREE.Group();const m=chasseur({corps:'#4a3f5e',aile:'#6e6182',accent:'#d2402e',verriere:'#1a1c22'});m.rotation.y=Math.PI;g.add(m);versCalque(g);sc.add(g);g.position.copy(pos);\n  const as=V.n>=4&&Math.random()<.3;if(as)m.traverse(o=>{if(o.material&&o.material.color&&o.material.color.getHexString()==='e2682e')o.material.color.set('#c8402e');});",
"""function ennemi(pos,dir){const g=new THREE.Group();const as=V.n>=4&&Math.random()<.3,bomb=!as&&V.n>=3&&Math.random()<.22;
  const m=construire(bomb?{m:'spectre',corps:'#2e2a36',aile:'#46404e',accent:'#d2402e',verriere:'#d2402e'}:as?{m:'vipere',corps:'#5a1a1a',aile:'#8a2a24',accent:'#ffe080',verriere:'#1a1c22'}:{m:'faucon',corps:'#4a3f5e',aile:'#6e6182',accent:'#d2402e',verriere:'#1a1c22'},false).g;
  if(bomb)m.scale.setScalar(2.2);m.rotation.y=Math.PI;g.add(m);versCalque(g);sc.add(g);g.position.copy(pos);""")
rep("const e={g,as,roleDepart:role,","const e={g,as,bomb,rayon:bomb?9:4.6,roleDepart:bomb?'bombardier':role,")
rep("vie:as?5:3,etat:'arrivee',role,","vie:bomb?10:as?5:3,etat:'arrivee',role:bomb?'bombardier':role,")
# comportement du bombardier : vol droit et lent qui passe près du joueur ; il tire vers l'arrière dès que le joueur est à portée
rep("    else if(e.role==='chasse'){","    else if(e.role==='bombardier'){if(!e.cap||e.g.position.distanceTo(e.cap)<40){const a=Math.random()*6.28;e.cap=S.p.clone().add(new THREE.Vector3(Math.cos(a)*220,0,Math.sin(a)*220));e.cap.y=Math.max(45,S.p.y+20);}cible=e.cap.clone();}\n    else if(e.role==='chasse'){")
rep("const devant=e.g.position.clone().sub(S.p).dot(fwd);const vmax=","const devant=e.g.position.clone().sub(S.p).dot(fwd);const vmax=e.bomb?34:")
rep("if(e.tirT<=0&&d.length()<140&&e.v.angleTo(d)<.45){","if(e.tirT<=0&&d.length()<(e.bomb?150:140)&&(e.bomb||e.v.angleTo(d)<.45)){")
rep("b.b.position.distanceTo(e.g.position)<4.6)","b.b.position.distanceTo(e.g.position)<e.rayon)")
rep("mi.m.position.distanceTo(mi.c.g.position)<4)","mi.m.position.distanceTo(mi.c.g.position)<mi.c.rayon)")
# un bombardier ne fait pas d'esquive
rep("if(e.vise>(e.as?.6:.9)&&!e.jink&&!e.repit&&!e.las){","if(e.vise>(e.as?.6:.9)&&!e.jink&&!e.repit&&!e.las&&!e.bomb){")
DECOR=r"""
// décor posé sur le relief : arbres (sapins et feuillus d'automne), villages, voiliers ; en instances (un seul dessin par sorte et par carreau)
const GEO={sapin:new THREE.ConeGeometry(1,2.8,5).translate(0,1.3,0),feuillu:new THREE.IcosahedronGeometry(1.3,0).translate(0,1.7,0),tronc:new THREE.CylinderGeometry(.18,.22,1,4).translate(0,.5,0),
  mur:new THREE.BoxGeometry(2.2,1.6,2.8).translate(0,.8,0),toit:new THREE.ConeGeometry(1.95,1.25,4).rotateY(Math.PI/4).translate(0,2.2,0),
  coque:new THREE.BoxGeometry(1.1,.5,3.2).translate(0,.2,0),voile:new THREE.ExtrudeGeometry(new THREE.Shape([V2(0,0),V2(0,3),V2(1.6,0)]),{depth:.05,bevelEnabled:false}).rotateY(-Math.PI/2).translate(0,.5,-.2)};
const matDecor=new THREE.MeshLambertMaterial({flatShading:true});
const COUL={feuillu:['#d8742a','#c4482a','#e8b440','#b05a2a','#a8a050','#5e8a40'],sapin:['#2f5a3a','#3d6a40','#4a5e38'],tronc:['#5a3e2a'],mur:['#f4ead8','#efe0c8','#e8d4bc'],toit:['#c4502e','#b0442a','#d0663a','#8a4a3a'],coque:['#f0e6d8','#4a6a9a','#c45a3a'],voile:['#fbf4ea']};
function pente(x,z){return Math.abs(H(x+2,z)-H(x-2,z))+Math.abs(H(x,z+2)-H(x,z-2));}
function decor(i,j){let s=(i*73856093^j*19349663)>>>0||1;const r=()=>(s=(s*16807)%2147483647)/2147483647;const L={};const mat=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();
  const pose=(sorte,x,y,z,ech,rot=r()*6.28,coul)=>{(L[sorte]=L[sorte]||[]).push([x,y,z,ech,rot,coul||COUL[sorte][r()*COUL[sorte].length|0]]);};
  for(let k=0;k<170;k++){const x=i*T+(r()-.5)*T,z=j*T+(r()-.5)*T,h=H(x,z);if(h<2.4||h>34||pente(x,z)>3.4)continue;const ech=.8+r()*.8;
    if(h>15||r()<.3){pose('sapin',x,h-.2,z,ech);}else{pose('feuillu',x,h-.2,z,ech);pose('tronc',x,h-.2,z,ech,0);}}
  if(r()<.4)for(let t=0;t<30;t++){const cx=i*T+(r()-.5)*T*.8,cz=j*T+(r()-.5)*T*.8,h=H(cx,cz);if(h<1.3||h>7||pente(cx,cz)>1.4)continue;
    const n=6+r()*10|0;for(let k=0;k<n;k++){const x=cx+(r()-.5)*36,z=cz+(r()-.5)*36,hh=H(x,z);if(hh<1.2||hh>9||pente(x,z)>1.8)continue;const ech=.8+r()*.5,rot=(r()*4|0)*Math.PI/2+(r()-.5)*.3;pose('mur',x,hh-.1,z,ech,rot);pose('toit',x,hh-.1,z,ech,rot);}break;}
  for(let k=0;k<6;k++){const x=i*T+(r()-.5)*T,z=j*T+(r()-.5)*T,h=H(x,z);if(h>-2.5||h<-14)continue;const rot=r()*6.28,ech=.9+r()*.4;pose('coque',x,0,z,ech,rot);pose('voile',x,0,z,ech,rot,'#fbf4ea');}
  const ims=[];for(const sorte in L){const li=L[sorte];const im=new THREE.InstancedMesh(GEO[sorte],matDecor,li.length);
    li.forEach(([x,y,z,ech,rot,c],k)=>{q.setFromEuler(e.set(0,rot,0));mat.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(ech,ech*(sorte==='sapin'?1+((k*37)%10)/14:1),ech));im.setMatrixAt(k,mat);im.setColorAt(k,new THREE.Color(c));});
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;sc.add(im);ims.push(im);}
  return ims;}
"""
rep("const T=200,SEG=50;const carreaux=new Map();","const T=200,SEG=50;const carreaux=new Map();"+DECOR)
rep("  const m=new THREE.Mesh(g,matSol);m.position.set(i*T,0,j*T);sc.add(m);return m;}","  const m=new THREE.Mesh(g,matSol);m.position.set(i*T,0,j*T);sc.add(m);m.userData.decor=decor(i,j);return m;}")
rep("for(const[k,m]of carreaux)if(!vus.has(k)){sc.remove(m);m.geometry.dispose();carreaux.delete(k);}}","for(const[k,m]of carreaux)if(!vus.has(k)){sc.remove(m);m.geometry.dispose();for(const d of m.userData.decor)sc.remove(d);carreaux.delete(k);}}")
# texte de la page
rep("Quatre couleurs au choix (bouton AVION, touche C).","Cinq avions différents au choix (bouton AVION, touche C) : Faucon, Hirondelle, Corsaire (à hélice), Vipère, Spectre (aile volante).")
open(p,'w').write(s)
print('ok')
