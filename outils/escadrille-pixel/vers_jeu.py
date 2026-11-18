# Fabrique ciel-de-guerre/jeu.js à partir du code de la maquette (crep.html)
import re,sys
S='/tmp/claude-0/-home-user-Claude/fcffeada-e83d-5761-b3f5-53af1f50fc26/scratchpad'
src=open(S+'/crep.html').read()
c=src[src.index('/*DONNEES*/'):src.rindex('</script>')]
def rep(a,b,n=1):
  global c
  assert c.count(a)==n,(c.count(a),a[:100]);c=c.replace(a,b)
rep("/*DONNEES*/\n","""/* Ciel de guerre : combat aérien en 3D low poly (Three.js r128). Né de la maquette « Escadrille crépuscule » (outils/escadrille-pixel/).
   Les modèles sont dans modeles/*.glb (catalogue.js), chargés à la demande ; la copie artefact les met en base64 dans window.CDG_B64.
   Écrans : titre (le jeu tourne derrière en pilote automatique), jeu, pause, fin. Objet de test : window.CielDeGuerre. */
""")
rep("const charger=nom=>new Promise((ok,ko)=>new THREE.GLTFLoader().parse(b64(MODELES[nom]),'',g=>ok(g.scene),ko));\n","")
# --- taille : tout l'écran, n'importe quel format
rep("const ECH=2.5;const LW=Math.max(240,Math.min(560,Math.round(el.clientWidth*(devicePixelRatio||1)/ECH))),LH=Math.round(LW*16/9);const OW=180,OH=320;/* OW × OH : la toile du viseur */",
"""// l'image est calculée environ 2,5 fois moins finement que l'écran (900 pixels au plus dans le grand côté), puis agrandie sans lissage ;
// la toile du viseur garde 320 pixels de haut, sa largeur suit le format de l'écran
let LW,LH,OW,OH,AW,AH;function mesures(){const w=el.clientWidth||360,h=el.clientHeight||640,dp=devicePixelRatio||1,ech=Math.max(2.5,Math.max(w,h)*dp/900);
  LW=Math.max(160,Math.round(w*dp/ech));LH=Math.max(160,Math.round(h*dp/ech));OH=320;OW=Math.round(OH*w/h);AW=LW;AH=LH;}
mesures();""")
rep("const AW=LW,AH=LH;const cibleAvions=","const cibleAvions=")
rep("const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(62,LW/LH,.5,1500);","const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(LW>LH?50:62,LW/LH,.5,1500);")
# --- modèles chargés à la demande
i=c.index("await Promise.all(Object.entries(GLBS).map(([k,v])=>new Promise(ok=>new THREE.GLTFLoader().parse(b64(v.b64),'',g=>{const sc0=g.scene;dequantifie(sc0);")
j=c.index("ok();},()=>ok()))));",i)+len("ok();},()=>ok()))));")
corps=c[i:j]
corps=corps.replace("await Promise.all(Object.entries(GLBS).map(([k,v])=>new Promise(ok=>new THREE.GLTFLoader().parse(b64(v.b64),'',g=>{const sc0=g.scene;dequantifie(sc0);",
  "const CAT=window.CDG_CAT||{},ATTENTE={};\nfunction prepare(k,sc0){const v=CAT[k];dequantifie(sc0);")
corps=corps.replace("ok();},()=>ok()))));","}")
assert corps.endswith("IMPORTS[k+'_r']=repeint(sc0,'r');}}"),corps[-120:]
corps+="""
// chargement d'un modèle (une seule fois) : depuis modeles/, ou depuis window.CDG_B64 dans la copie artefact
function chargerModele(k){if(IMPORTS[k]||!CAT[k])return Promise.resolve();if(ATTENTE[k])return ATTENTE[k];
  return ATTENTE[k]=new Promise(ok=>{const fin=g=>{try{prepare(k,g.scene);}catch(x){console.warn('modèle',k,x);}ok();},err=e=>{console.warn('modèle',k,e);ok();};
    if(window.CDG_B64&&window.CDG_B64[k])new THREE.GLTFLoader().parse(b64(window.CDG_B64[k]),'',fin,err);else new THREE.GLTFLoader().load('modeles/'+k+'.glb',fin,undefined,err);});}"""
c=c[:i]+corps+c[j:]
rep("function importe(cle,rot,taille){const g=new THREE.Group(),m=IMPORTS[cle].clone();","function importe(cle,rot,taille){const g=new THREE.Group(),m=(IMPORTS[cle]||IMPORTS['py7_b']||IMPORTS[Object.keys(IMPORTS)[0]]).clone();/* pas encore chargé : un modèle de secours */")
rep("for(const k in COULEURS){const c=COULEURS[k];c.pack=FAMILLES[c.fam].nom;c.nom=GLBS[c.cle].nom;}","for(const k in COULEURS){const c=COULEURS[k];c.pack=FAMILLES[c.fam].nom;c.nom=CAT[c.cle].nom;}")
rep("let choix=NOMS.indexOf('py7');try{const i=NOMS.indexOf(localStorage.getItem('escadrille.avion3d'));if(i>=0)choix=i;}catch(e){}",
    "let choix=NOMS.indexOf('py7');try{const i=NOMS.indexOf(localStorage.getItem('cieldeguerre.avion'));if(i>=0)choix=i;}catch(e){}")
c=re.sub(r"\nlet ENNEMIS=\[\];try\{[^\n]*\n// version rouge d'un appareil du hangar, pour les ennemis\nfunction versionRouge\(k\)\{[^\n]*","",c)
rep("const nav=new THREE.Group();let modele=construire(","""// au démarrage : la flotte, les bombardiers, l'appareil du joueur et les polyvalents (premières vagues) ; le reste se charge ensuite, en fond
const FLOTTE_CLES=['fga_destroyer2','fga_croiseur1','fga_destroyer4','fga_destroyer1','fga_croiseur2','fga_destroyer3','fga_croiseur4'];
await Promise.all([...FLOTTE_CLES,...[1,2,3,4,5].flatMap(n=>['fga_corvette'+n+'_r','fga_fregate'+n+'_r']),COULEURS[NOMS[choix]].cle,...FAMILLES.poly.l.map(i=>'py'+i)].map(chargerModele));
setTimeout(async()=>{for(const k in CAT)await chargerModele(k);},4000);
// un appareil ennemi de la famille voulue, parmi ceux déjà chargés (les autres se chargent pour la suite)
function modeleFam(f){const l=FAMILLES[f].l.map(i=>'py'+i);l.forEach(chargerModele);const ok=l.filter(k=>IMPORTS[k+'_r']);
  if(ok.length)return ok[Math.random()*ok.length|0];const p=FAMILLES.poly.l.map(i=>'py'+i).filter(k=>IMPORTS[k+'_r']);return p[Math.random()*p.length|0]||'py7';}
const nav=new THREE.Group();let modele=construire(""")
rep("const mr=construire(!bomb?COULEURS['py'+FAMILLES[famE].l[Math.random()*FAMILLES[famE].l.length|0]]:escorte?","const mr=construire(!bomb?COULEURS[modeleFam(famE)]:escorte?")
rep("function choisir(k){choix=k;","function choisir(k){chargerModele(COULEURS[NOMS[k]].cle).then(()=>choisir2(k));}\nfunction choisir2(k){choix=k;")
c=c.replace("localStorage.setItem('escadrille.avion3d',NOMS[choix])","localStorage.setItem('cieldeguerre.avion',NOMS[choix])")
rep("function changerAvion(){choix=(choix+1)%NOMS.length;nav.remove(moi);","function changerAvion(){choisir((choix+1)%NOMS.length);return;nav.remove(moi);")
rep("window.Escadrille={S,get ennemis(){return ennemis;}};","window.CielDeGuerre={S,get ennemis(){return ennemis;},FLOTTE,nouvellePartie:()=>nouvellePartie(),abattu:()=>abattu(),pause:()=>pause(),reprendre:()=>reprendre(),get mode(){return S.mode;},get vague(){return V.n;}};")
rep("el.querySelector('.charge').remove();","document.getElementById('charge').remove();")
# --- modes : titre, jeu, pause, fin
rep("const S={dx:0,","const S={mode:'titre',vies:3,dx:0,")
rep("const manuel=(ms=4000)=>{S.auto=false;clearTimeout(S.to);S.to=setTimeout(()=>{S.auto=true;S.tir=false;},ms);};",
    "const manuel=(ms=4000)=>{if(S.mode!=='jeu')return;S.auto=false;clearTimeout(S.to);S.to=setTimeout(()=>{S.tir=false;},ms);};/* en partie, le pilote automatique ne reprend jamais la main */")
rep("addEventListener('keydown',e=>{if(!vu)return;","addEventListener('keydown',e=>{if(!vu)return;if(e.code==='KeyP'||e.code==='Escape'){if(S.mode==='jeu')pause();else if(S.mode==='pause'&&e.code==='KeyP')reprendre();return;}if(S.mode!=='jeu')return;")
rep("el.addEventListener('pointerdown',e=>{if(e.target.closest('button')||S.doigt)return;","el.addEventListener('pointerdown',e=>{if(S.mode!=='jeu'||e.target.closest('button,.ecran,#hangar')||S.doigt)return;")
rep("el.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||S.doigt)return;","el.addEventListener('pointermove',e=>{if(S.mode!=='jeu'||e.pointerType!=='mouse'||S.doigt)return;")
rep("el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.target.closest('button,#hangar'))return;","el.addEventListener('pointerdown',e=>{if(S.mode!=='jeu'||e.pointerType!=='mouse'||e.target.closest('button,#hangar,.ecran'))return;")
rep("if(!ennemis.length&&!V.file.length){","if(S.mode==='jeu'&&!ennemis.length&&!V.file.length){")
rep("if(S.blindage<=0){boom(S.p,30);S.blindage=100;annonce('ABATTU !<b>-1000</b>Un nouvel avion décolle.');S.score=Math.max(0,S.score-1000);}continue;}","if(S.blindage<=0)abattu();continue;}")
rep("if(S.blindage<=0){boom(S.p,30);S.blindage=100;annonce('ABATTU !<b>-1000</b>Un nouvel avion décolle.');S.score=Math.max(0,S.score-1000);}}","if(S.blindage<=0)abattu();}")
# en dehors d'une partie, on ne prend pas de coups
c=c.replace("b.b.position.distanceTo(S.p)<2.6&&S.rollT<0","b.b.position.distanceTo(S.p)<2.6&&S.rollT<0&&S.mode==='jeu'")
rep("if(l.c.joueur&&l.m.position.distanceTo(S.p)<3&&S.rollT<0)","if(l.c.joueur&&S.mode==='jeu'&&l.m.position.distanceTo(S.p)<3&&S.rollT<0)")
rep("function image(m){const dt=Math.min(.05,(m-av)/1000);av=m;requestAnimationFrame(image);if(!vu&&!window.TOUT_VOIR)return;S.t+=dt;",
    "function image(m){const dt=Math.min(.05,(m-av)/1000);av=m;requestAnimationFrame(image);if(!vu&&!window.TOUT_VOIR)return;if(S.mode==='pause'){rendre();return;}S.t+=dt;")
rep("""  cam.layers.set(0);R.setRenderTarget(cible);R.setClearColor(0x000000,1);R.clear();R.render(sc,cam);
  cam.layers.set(AVIONS);R.setRenderTarget(cibleAvions);R.setClearColor(0x000000,0);R.clear();R.render(sc,cam);
  R.setRenderTarget(null);R.render(scPost,camPost);viseur(fwd,dt);}""","""  rendre();if(S.mode==='jeu')viseur(fwd,dt);else ox.clearRect(0,0,OW,OH);}
function rendre(){cam.layers.set(0);R.setRenderTarget(cible);R.setClearColor(0x000000,1);R.clear();R.render(sc,cam);
  cam.layers.set(AVIONS);R.setRenderTarget(cibleAvions);R.setClearColor(0x000000,0);R.clear();R.render(sc,cam);
  R.setRenderTarget(null);R.render(scPost,camPost);}""")
rep("hud.innerHTML=`SCORE ${String(S.score).padStart(6,'0')}<br>VAGUE ${V.n} · ENNEMIS ${ennemis.length}<br>","hud.innerHTML=`SCORE ${String(S.score).padStart(6,'0')} · ${'✈'.repeat(Math.max(0,S.vies))}<br>VAGUE ${V.n} · ENNEMIS ${ennemis.length}<br>")
rep("let av=performance.now(),vu=false;new IntersectionObserver(es=>vu=es[0].isIntersecting).observe(el);setTimeout(()=>band.style.opacity=0,4500);",
    "let av=performance.now(),vu=false;new IntersectionObserver(es=>vu=es[0].isIntersecting).observe(el);band.style.opacity=0;")
# l'aide clavier
rep("const AIDE_SOURIS=","document.getElementById('clavier').innerHTML='FLECHES : PILOTER · ESPACE : FEU<br>E : MISSILE · R : LOOP · F : TONNEAU<br>V : VUE · C : AVION · P : PAUSE<br>CLIC DANS LE JEU : PILOTER A LA SOURIS';\nconst AIDE_SOURIS=")
c=c.replace("V : VUE · C : AVION · ECHAP : SOURIS","V : VUE · C : AVION · ECHAP : PAUSE")
# écrans
rep("\nrequestAnimationFrame(image);\n})();","""
// ---- écrans : titre, pause, fin ; parties à 3 appareils ----
const $=id=>document.getElementById(id),ECRANS=['eTitre','ePause','eFin','eAide'];let ecranAvant='eTitre';
function montrer(id){for(const e of ECRANS)$(e).hidden=e!==id;el.classList.toggle('menu',!!id);if(id&&id!=='eAide')ecranAvant=id;}
function lireRecord(){try{return JSON.parse(localStorage.getItem('cieldeguerre.record'))||{};}catch(e){return{};}}
function majTitre(){const r=lireRecord();$('tRecord').innerHTML=r.parties?`RECORD ${String(r.score).padStart(6,'0')}<br>VAGUE ${r.vague||0} · ${r.parties||0} PARTIE${(r.parties||0)>1?'S':''}`:'';}
function viderCombat(){for(const e of ennemis)sc.remove(e.g);ennemis.length=0;for(const b of tirsEnnemis)sc.remove(b.b);tirsEnnemis.length=0;V.file.length=0;}
function nouvellePartie(){viderCombat();V.n=0;V.pause=2.5;V.fin=0;Object.assign(S,{mode:'jeu',vies:3,blindage:100,score:0,munB:300,munM:FAM().mis,auto:false,tir:false,boost:0,loopT:-1,rollT:-1,dx:0,dy:0});
  S.p.set(S.p.x,Math.max(S.p.y,40),S.p.z);montrer(null);annonce('MISSION · ARCHIPEL<b>VAGUES</b>Abats les chasseurs rouges. Leurs grands vaisseaux tirent aussi !');}
function pause(){if(S.mode!=='jeu')return;S.mode='pause';S.tir=false;try{document.exitPointerLock();}catch(x){}montrer('ePause');}
function reprendre(){if(S.mode!=='pause')return;S.mode='jeu';montrer(null);}
function versTitre(){viderCombat();S.mode='titre';S.auto=true;S.souris=0;S.doigt=null;joy.classList.remove('on');majTitre();montrer('eTitre');}
function abattu(){boom(S.p,30);S.vies--;V.flash=.4;if(S.vies<=0){finPartie();return;}S.blindage=100;annonce(`ABATTU !<b>${S.vies} APPAREIL${S.vies>1?'S':''} RESTANT${S.vies>1?'S':''}</b>Un nouvel appareil decolle.`);}
function finPartie(){S.mode='fin';S.auto=true;S.tir=false;S.blindage=100;try{document.exitPointerLock();}catch(x){}const r=lireRecord(),neuf=S.score>(r.score||0);
  const n={score:Math.max(S.score,r.score||0),vague:Math.max(V.n,r.vague||0),parties:(r.parties||0)+1};try{localStorage.setItem('cieldeguerre.record',JSON.stringify(n));}catch(e){}
  $('fScore').textContent=String(S.score).padStart(6,'0');$('fDetail').textContent=`Vague ${V.n} atteinte.`;$('fRecord').innerHTML=neuf&&S.score>0?'NOUVEAU RECORD !':`RECORD ${String(n.score).padStart(6,'0')}`;
  setTimeout(()=>{viderCombat();montrer('eFin');},1600);}
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&S.mode==='jeu'&&S.souris)pause();});/* Échap rend la souris : pause */
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
const clic=(id,f)=>$(id).addEventListener('click',e=>{e.stopPropagation();f();});
clic('tJouer',nouvellePartie);clic('fRejouer',nouvellePartie);clic('pReprendre',reprendre);clic('pQuitter',versTitre);clic('fMenu',versTitre);
clic('tHangar',ouvrirHangar);clic('pHangar',ouvrirHangar);clic('tAide',()=>montrer('eAide'));clic('pAide',()=>montrer('eAide'));clic('aRetour',()=>montrer(ecranAvant));
bouton('bPause',d=>{if(d)pause();});
for(const e of ECRANS)$(e).addEventListener('pointerdown',e=>e.stopPropagation());
// la fenêtre change de taille (rotation du téléphone, fenêtre du PC) : on refait les toiles
addEventListener('resize',()=>{clearTimeout(S.rz);S.rz=setTimeout(()=>{mesures();R.setSize(LW,LH,false);cible.setSize(LW,LH);cibleAvions.setSize(AW,AH);ov.width=OW;ov.height=OH;
  cam.aspect=LW/LH;cam.fov=LW>LH?50:62;cam.updateProjectionMatrix();post.uniforms.pa.value.set(1/AW,1/AH);},120);});
S.auto=true;majTitre();montrer('eTitre');
requestAnimationFrame(image);
})();""")
open('/home/user/Claude/ciel-de-guerre/jeu.js','w').write(c.strip()+'\n')
print('ok',len(c))
