/* Ciel de guerre : combat aérien en 3D low poly (Three.js r128). Né de la maquette « Escadrille crépuscule » (outils/escadrille-pixel/).
   Les modèles sont dans modeles/*.glb (catalogue.js), chargés à la demande ; la copie artefact les met en base64 dans window.CDG_B64.
   Écrans : titre (le jeu tourne derrière en pilote automatique), jeu, pause, fin. Objet de test : window.CielDeGuerre. */
window.createImageBitmap=undefined;
const b64=s=>{const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;};
function bruit(seed){const P=new Uint8Array(512);let s=seed;for(let i=0;i<256;i++)P[i]=i;for(let i=255;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);[P[i],P[j]]=[P[j],P[i]];}for(let i=0;i<256;i++)P[i+256]=P[i];
  const g=(x,y)=>P[P[x&255]+(y&255)]/255;const f=t=>t*t*(3-2*t);return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=f(x-xi),yf=f(y-yi);const a=g(xi,yi),b=g(xi+1,yi),c=g(xi,yi+1),d=g(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf;};}
const N1=bruit(11),N2=bruit(37);const fbm=(n,x,y,o=5)=>{let v=0,a=.5,f=1;for(let i=0;i<o;i++){v+=a*n(x*f,y*f);a*=.5;f*=2;}return v;};
// palette fixe, relevée sur la capture de référence
const PAL=['#6aa8e0','#86bdea','#a3d0f0','#c3e2f6','#dceef9','#1c4f9c','#2563b4','#3577c4','#4d9bd6','#79bde6','#ffffff','#e6eef6','#e8d9a0','#d1bd7e',
  '#1f5a2a','#2d7a32','#43963a','#6db84a','#a6d672','#6e6a62','#9a958a','#1a1c22','#3a3d46','#6a6e78','#c8402e','#e2682e','#ffb040','#ffe080','#5a2a1a'];
// relief des îles : 0 = niveau de la mer
const H=(x,z)=>{const n=fbm(N1,x*.004,z*.004);return (n-.47)*130+fbm(N2,x*.04,z*.04,3)*5-2.5;};
const hash=(a,b)=>{let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
// couleur d'un pixel du sol (une case de la texture)
function couleurSol(x,z,a,b){const h=H(x,z),r=hash(a,b),v=fbm(N2,x*.02,z*.02,2);
  if(h<-10)return r<.008?'#ffffff':(v>.55?'#2563b4':'#1c4f9c');
  if(h<-3)return r<.012?'#e6eef6':(v>.5?'#3577c4':'#2563b4');
  if(h<-.9)return r<.25?'#79bde6':'#4d9bd6';
  if(h<.5)return r<.35?'#e6eef6':'#ffffff';
  if(h<1.8)return r<.3?'#d1bd7e':'#e8d9a0';
  const pente=(H(x-3,z+3)-H(x+3,z-3))*.25;
  if(h<18){let k=(v>.6?0:v>.48?1:2)+(r<.25?1:0)+(pente>.5?1:pente<-.5?-1:0);k=Math.max(0,Math.min(4,k));return['#1f5a2a','#2d7a32','#43963a','#6db84a','#a6d672'][k];}
  if(h<34)return pente>.3?'#9a958a':pente<-.3?'#6e6a62':(v>.5?'#9a958a':'#6e6a62');return pente<-.6?'#c3e2f6':'#e6eef6';}
(async()=>{
const el=document.getElementById('t'),hud=document.getElementById('hud'),band=document.getElementById('bandeau');
// l'image est calculée environ 2,5 fois moins finement que l'écran (900 pixels au plus dans le grand côté), puis agrandie sans lissage ;
// la toile du viseur garde 320 pixels de haut, sa largeur suit le format de l'écran
let LW,LH,OW,OH,AW,AH;function mesures(){const w=el.clientWidth||360,h=el.clientHeight||640,dp=devicePixelRatio||1,ech=Math.max(2.5,Math.max(w,h)*dp/900);
  LW=Math.max(160,Math.round(w*dp/ech));LH=Math.max(160,Math.round(h*dp/ech));OH=320;OW=Math.round(OH*w/h);AW=LW;AH=LH;}
mesures();
const R=new THREE.WebGLRenderer({antialias:false});R.setPixelRatio(1);R.setSize(LW,LH,false);el.prepend(R.domElement);
const ov=document.createElement('canvas');ov.width=OW;ov.height=OH;ov.style.cssText='position:absolute;inset:0;pointer-events:none';R.domElement.after(ov);const ox=ov.getContext('2d');
const cible=new THREE.WebGLRenderTarget(LW,LH,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
// les avions sont dessinés à part (même finesse), pour leur tracer un contour
const cibleAvions=new THREE.WebGLRenderTarget(AW,AH,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});
const AVIONS=1;const versCalque=o=>o.traverse(m=>m.layers.set(AVIONS));
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(LW>LH?50:62,LW/LH,.5,1500);
const SOLEIL=new THREE.Vector3(-.45,.2,-1).normalize(),BRUME=new THREE.Color('#f1c6aa'),BN=220,BF=760;
sc.fog=new THREE.Fog(BRUME,BN,BF);
// ciel du crépuscule, peint par la carte graphique : dégradé, soleil et halo, traînées de nuages
const matCiel=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{soleil:{value:SOLEIL},temps:{value:0}},
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
  uniform vec3 soleil;uniform float temps;varying vec3 vD;
  void main(){vec3 d=normalize(vD);float y=d.y;
    vec3 haut=vec3(.56,.46,.70),rose=vec3(.92,.60,.64),peche=vec3(.98,.76,.60),jaune=vec3(1.,.88,.62),brume=vec3(.945,.776,.667);
    vec3 c=y<0.?brume:y<.07?mix(brume,jaune,y/.07):y<.22?mix(jaune,peche,(y-.07)/.15):y<.45?mix(peche,rose,(y-.22)/.23):mix(rose,haut,clamp((y-.45)/.45,0.,1.));
    float s=dot(d,soleil);c=mix(c,vec3(1.,.93,.75),smoothstep(.95,.995,s)*.55);c=mix(c,vec3(1.,.97,.88),smoothstep(.9975,.9985,s));
    if(y>.01){vec2 q=d.xz/(y+.12);float n=fb(vec2(q.x*.9+temps*.004,q.y*3.2));float k=smoothstep(.52,.68,n)*smoothstep(.01,.12,y)*(1.-smoothstep(.55,.9,y));
      vec3 nu=mix(vec3(1.,.86,.78),vec3(.82,.56,.66),clamp(.5-y*1.2+n*.3,0.,1.));c=mix(c,nu,k*.8);}
    gl_FragColor=vec4(c,1.);}`});
var ciel=new THREE.Mesh(new THREE.SphereGeometry(900,32,24),matCiel);ciel.renderOrder=-1;sc.add(ciel);
const hemi=new THREE.HemisphereLight('#ffe6d6','#5a4a70',.8);sc.add(hemi);const L=new THREE.DirectionalLight('#ffd6b0',.85);L.position.copy(SOLEIL).multiplyScalar(10).add(new THREE.Vector3(0,6,0));sc.add(L);hemi.layers.enable(AVIONS);L.layers.enable(AVIONS);
// au-delà des carreaux : la mer profonde
const mer=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#2a4f86'}));mer.position.y=-.3;sc.add(mer);
// relief : la hauteur dans la géométrie ; les couleurs (forêts d'automne, roche, plage, profondeur de l'eau, écume) calculées pixel par pixel
const matSol=new THREE.ShaderMaterial({uniforms:{soleil:{value:SOLEIL},temps:{value:0},brume:{value:BRUME},bN:{value:BN},bF:{value:BF}},
  vertexShader:`attribute float hauteur;varying vec3 vP;varying float vH;varying vec3 vN;varying float vDist;
  void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vH=hauteur;vN=normal;vec4 m=viewMatrix*w;vDist=length(m.xyz);gl_Position=projectionMatrix*m;}`,
  fragmentShader:`float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}/* hasard sans motif qui revient (l'ancien se répétait toutes les 50 cases) */
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
  uniform vec3 soleil,brume;uniform float temps,bN,bF;varying vec3 vP;varying float vH;varying vec3 vN;varying float vDist;
  void main(){vec3 c;vec3 n=normalize(vN);float li=clamp(dot(n,soleil)*.9+.35,0.,1.2);
    if(vH<.15){float d=max(0.,-vH);
      c=mix(vec3(.36,.78,.76),vec3(.17,.50,.70),smoothstep(0.,2.5,d));c=mix(c,vec3(.12,.25,.50),smoothstep(2.5,11.,d));c=mix(c,vec3(.10,.20,.42),smoothstep(11.,30.,d));
      vec2 w=vP.xz;float gr=fb(w*.0021+3.1);vec2 dw=vec2(fb(w*.006+1.3),fb(w*.006+8.7))*40.;/* grande houle et déformation : les taches ne s'alignent plus */
      float pt=fb((w+dw)*.02+vec2(temps*.012,0.));c*=(.86+.26*pt)*(.9+.2*gr);c=mix(c,vec3(.22,.42,.66),smoothstep(.62,.72,pt)*.25*smoothstep(4.,12.,d));
      float ec=1.-smoothstep(0.,1.6,d+(vn(vP.xz*.35+temps*.4)-.5)*1.4);c=mix(c,vec3(.97,.94,.9),ec*.9);
      vec2 q=vec2((w.x+dw.x)*.5-temps*1.4,(w.y+dw.y)*1.4);float cr=vn(q*.55)*.65+vn(q*1.6+5.)*.35;/* moutons : traînées étirées dans le sens du vent, qui avancent et apparaissent par endroits */
      float mo=smoothstep(.66,.74,cr)*smoothstep(.28,.6,fb(w*.008+vec2(temps*.02,3.)))*smoothstep(3.,9.,d);c=mix(c,vec3(.93,.95,1.),mo*.85);
      float sp=step(.996,h21(floor((w+dw)*1.3)+floor(temps*2.)*7.1))*smoothstep(2.,6.,d)*smoothstep(.45,.7,gr);c=mix(c,vec3(1.,.9,.75),sp*.6);/* reflets du soleil, rares et changeants */
    }else{float n1=fb(vP.xz*.006),n2=fb(vP.xz*.03+7.),g=h21(floor(vP.xz*1.5)),g2=h21(floor(vP.xz*.6)+5.);
      vec3 vert=vec3(.20,.44,.27),jaune=vec3(.94,.72,.26),orange=vec3(.88,.46,.17),rouge=vec3(.70,.23,.15),olive=vec3(.66,.63,.38),mauve=vec3(.47,.40,.55);
      vec3 b=n1<.40?vert:n1<.47?mix(vert,jaune,(n1-.40)/.07):n1<.55?jaune:n1<.62?mix(jaune,orange,(n1-.55)/.07):n1<.68?orange:rouge;
      b=mix(b,olive,smoothstep(.56,.74,n2)*.65);b*=.8+.34*g;if(g2>.9)b=mix(b,vert*.85,.65);if(g>.96)b=mix(b,vec3(1.,.88,.6),.6);
      float pente=1.-n.y;b=mix(b,mauve*(.82+.3*g),smoothstep(.3,.45,pente));b=mix(b,vec3(.92,.86,.88),smoothstep(34.,46.,vH)*(1.-pente));
      vec3 sable=vec3(.95,.86,.64)*(.93+.1*g);c=mix(sable,b,smoothstep(.6,2.4,vH+(n2-.5)*1.6));c*=li;}
    c=mix(c,brume,smoothstep(bN,bF,vDist));gl_FragColor=vec4(c,1.);}`});
const T=200,SEG=50;const carreaux=new Map();
// décor posé sur le relief : arbres (sapins et feuillus d'automne), villages, voiliers ; en instances (un seul dessin par sorte et par carreau)
const GEO={sapin:new THREE.ConeGeometry(1,2.8,5).translate(0,1.3,0),feuillu:new THREE.IcosahedronGeometry(1.3,0).translate(0,1.7,0),tronc:new THREE.CylinderGeometry(.18,.22,1,4).translate(0,.5,0),
  mur:new THREE.BoxGeometry(2.2,1.6,2.8).translate(0,.8,0),toit:new THREE.ConeGeometry(1.95,1.25,4).rotateY(Math.PI/4).translate(0,2.2,0),
  coque:new THREE.BoxGeometry(1.1,.5,3.2).translate(0,.2,0),voile:new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(0,3),new THREE.Vector2(1.6,0)]),{depth:.05,bevelEnabled:false}).rotateY(-Math.PI/2).translate(0,.5,-.2)};
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

function carreau(i,j){const g=new THREE.PlaneGeometry(T,T,SEG,SEG).rotateX(-Math.PI/2);const p=g.attributes.position,hh=new Float32Array(p.count);
  for(let k=0;k<p.count;k++){const x=p.getX(k)+i*T,z=p.getZ(k)+j*T;const h=H(x,z);hh[k]=h;p.setY(k,Math.max(0,h));}g.setAttribute('hauteur',new THREE.BufferAttribute(hh,1));g.computeVertexNormals();
  const m=new THREE.Mesh(g,matSol);m.position.set(i*T,0,j*T);sc.add(m);m.userData.decor=decor(i,j);return m;}
function majCarreaux(x,z){const ci=Math.round(x/T),cj=Math.round(z/T),vus=new Set();let neuf=0;for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){const k=(ci+a)+','+(cj+b);vus.add(k);if(!carreaux.has(k)&&neuf<3){carreaux.set(k,carreau(ci+a,cj+b));neuf++;}}
  for(const[k,m]of carreaux)if(!vus.has(k)){sc.remove(m);m.geometry.dispose();for(const d of m.userData.decor)sc.remove(d);carreaux.delete(k);}}
// nuages en volume : des grappes de boules low poly, éclairées en 3 tons (rose clair, rose, mauve)
const matNuage=new THREE.ShaderMaterial({uniforms:{soleil:{value:SOLEIL},brume:{value:BRUME},bN:{value:BN},bF:{value:BF}},
  vertexShader:'varying vec3 vN;varying float vDist;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 m=modelViewMatrix*vec4(position,1.);vDist=length(m.xyz);gl_Position=projectionMatrix*m;}',
  fragmentShader:'uniform vec3 soleil,brume;uniform float bN,bF;varying vec3 vN;varying float vDist;void main(){float l=dot(normalize(vN),soleil)+.25*normalize(vN).y;vec3 c=l>.35?vec3(1.,.9,.86):l>-.05?vec3(.96,.74,.76):vec3(.72,.58,.72);c=mix(c,brume,smoothstep(bN,bF,vDist)*.9);gl_FragColor=vec4(c,1.);}'});
const nuages=[];{const geo=new THREE.IcosahedronGeometry(1,1);for(let i=0;i<34;i++){const g=new THREE.Group();const n=4+Math.random()*5|0,tl=8+Math.random()*16;
  for(let k=0;k<n;k++){const b=new THREE.Mesh(geo,matNuage);const r=tl*(.45+Math.random()*.45);b.scale.set(r,r*.72,r);b.position.set((Math.random()-.5)*tl*1.8,Math.random()*tl*.25,(Math.random()-.5)*tl*1.2);g.add(b);}
  g.userData={dx:(Math.random()-.5)*1100,dz:(Math.random()-.5)*1100,y:28+Math.random()*80};sc.add(g);nuages.push(g);}}
// avions low poly construits dans le code : chacun renvoie {g, tuy (tuyères), env (demi-envergure), helice}
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
// deux camps, un seul style : coques grises, couleur du camp (bleu : le joueur et ses alliés ; rouge : l'ennemi), comme les vaisseaux Free Game Assets
const COULEURS={FAUCON:{m:'faucon',corps:'#6d7279',aile:'#8b9198',accent:'#6f8fe8',verriere:'#26324a'},HIRONDELLE:{m:'hirondelle',corps:'#767b82',aile:'#959aa1',accent:'#8fb0ff',verriere:'#26324a'},
  VIPERE:{m:'vipere',corps:'#5e6268',aile:'#7a7f86',accent:'#6f8fe8',verriere:'#26324a'},
  SPECTRE:{m:'spectre',corps:'#4e5258',aile:'#62676e',accent:'#6f8fe8',verriere:'#8fb0ff'}};
const ROUGE={faucon:{m:'faucon',corps:'#6d7279',aile:'#8b9198',accent:'#c8242c',verriere:'#2a2224'},vipere:{m:'vipere',corps:'#5e6268',aile:'#7a7f86',accent:'#d8303a',verriere:'#2a2224'}};
// modèles importés (GLB en base64, GLBS) : analysés une seule fois, puis clonés ; matériaux convertis en Phong à facettes ; textures lues telles quelles (sans décodage sRGB, qui assombrissait tout)
const IMPORTS={};const b64=s=>{const b=atob(s);const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;};
// modèles quantifiés (positions en int16) : on remet les coordonnées d'origine, pour que tuyères et tourelles se calculent comme avant
function dequantifie(sc0){sc0.updateMatrixWorld(true);sc0.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position;if(!a||a.array instanceof Float32Array)return;
  const n=a.count,f=new Float32Array(n*3),k=a.array instanceof Int16Array?32767:a.array instanceof Uint16Array?65535:a.array instanceof Int8Array?127:255;
  for(let i=0;i<n;i++){f[i*3]=a.getX(i)/k*o.scale.x+o.position.x;f[i*3+1]=a.getY(i)/k*o.scale.y+o.position.y;f[i*3+2]=a.getZ(i)/k*o.scale.z+o.position.z;}
  o.geometry.setAttribute('position',new THREE.BufferAttribute(f,3));const u=o.geometry.attributes.uv;
  if(u&&!(u.array instanceof Float32Array)){const g=new Float32Array(u.count*2),q=u.array instanceof Uint16Array?65535:255;for(let i=0;i<u.count;i++){g[i*2]=u.getX(i)/q;g[i*2+1]=u.getY(i)/q;}o.geometry.setAttribute('uv',new THREE.BufferAttribute(g,2));}
  o.position.set(0,0,0);o.scale.set(1,1,1);o.geometry.boundingBox=null;o.geometry.boundingSphere=null;});}
// repeinture aux couleurs d'un camp (pack polyyai) : la teinte dominante (la coque) devient un gris teinté du camp, les autres couleurs vives prennent la couleur du camp, le reste devient gris
const REPEINTS={polyyai:1},HUE={b:.6,r:0};
function teinte(c,h){const o={};c.getHSL(o);if(o.s>.3&&o.l>.12&&o.l<.9)c.setHSL(h,.62,Math.min(.62,Math.max(.4,o.l)));else c.setHSL(0,0,Math.min(.82,o.l*.95+.04));}
function texRepeinte(t,h){const im=t.image;if(!im||!im.width)return t;const cv=document.createElement('canvas');cv.width=im.width;cv.height=im.height;const x=cv.getContext('2d');x.drawImage(im,0,0);
  const d=x.getImageData(0,0,cv.width,cv.height),A=d.data,c=new THREE.Color(),o={},hist=new Float32Array(24);
  for(let i=0;i<A.length;i+=4){c.setRGB(A[i]/255,A[i+1]/255,A[i+2]/255);c.getHSL(o);if(o.s>.3&&o.l>.12&&o.l<.9)hist[Math.floor(o.h*24)%24]++;}
  let hm=0;for(let k=1;k<24;k++)if(hist[k]>hist[hm])hm=k;
  for(let i=0;i<A.length;i+=4){c.setRGB(A[i]/255,A[i+1]/255,A[i+2]/255);c.getHSL(o);const bin=Math.floor(o.h*24)%24,dd=Math.min(Math.abs(bin-hm),24-Math.abs(bin-hm));
    if(o.s>.3&&o.l>.12&&o.l<.9&&dd>2)c.setHSL(h,.68,Math.min(.6,Math.max(.42,o.l)));else if(o.s>.3&&dd<=2)c.setHSL(h,.22,Math.min(.62,.2+o.l*.7));else c.setHSL(0,0,Math.min(.8,.18+o.l*.75));A[i]=c.r*255;A[i+1]=c.g*255;A[i+2]=c.b*255;}
  x.putImageData(d,0,0);const n=new THREE.CanvasTexture(cv);n.flipY=t.flipY;n.wrapS=t.wrapS;n.wrapT=t.wrapT;n.magFilter=n.minFilter=THREE.NearestFilter;n.generateMipmaps=false;return n;}
function repeint(sc0,camp){const s=sc0.clone(),h=HUE[camp];s.traverse(o=>{if(!o.isMesh)return;const mm=Array.isArray(o.material)?o.material:[o.material];
  const n=mm.map(m=>{const r=m.clone();if(m.map)r.map=texRepeinte(m.map,h);else{r.color=m.color.clone();teinte(r.color,h);}return r;});o.material=Array.isArray(o.material)?n:n[0];});return s;}
const CAT=window.CDG_CAT||{},ATTENTE={};
function prepare(k,sc0){const v=CAT[k];dequantifie(sc0);
  sc0.traverse(o=>{if(o.isMesh){const mm=Array.isArray(o.material)?o.material:[o.material];const n=mm.map(m=>{if(m.map){m.map.encoding=THREE.LinearEncoding;if(m.map.image&&m.map.image.height<=4){m.map.magFilter=m.map.minFilter=THREE.NearestFilter;m.map.generateMipmaps=false;}}return m;}).map(m=>new THREE.MeshPhongMaterial({color:m.color,map:m.map||null,vertexColors:!!m.vertexColors,flatShading:true,shininess:0,specular:0x000000,side:THREE.DoubleSide}));o.material=Array.isArray(o.material)?n:n[0];}});
  if(v.tour)decoupe(sc0,v.tour);IMPORTS[k]=sc0;if(REPEINTS[v.pack]){IMPORTS[k+'_b']=repeint(sc0,'b');IMPORTS[k+'_r']=repeint(sc0,'r');}}
// chargement d'un modèle (une seule fois) : depuis modeles/, ou depuis window.CDG_B64 dans la copie artefact
function chargerModele(k){if(IMPORTS[k]||!CAT[k])return Promise.resolve();if(ATTENTE[k])return ATTENTE[k];
  return ATTENTE[k]=new Promise(ok=>{const fin=g=>{try{prepare(k,g.scene);}catch(x){console.warn('modèle',k,x);}ok();},err=e=>{console.warn('modèle',k,e);ok();};
    if(window.CDG_B64&&window.CDG_B64[k])new THREE.GLTFLoader().parse(b64(window.CDG_B64[k]),'',fin,err);else new THREE.GLTFLoader().load('modeles/'+k+'.glb',fin,undefined,err);});}
// tourelles des grands vaisseaux : leurs triangles (repérés à la conversion) passent dans une pièce à part, qui pivote autour de sa base
function decoupe(sc0,tours){let me=null;sc0.traverse(o=>{if(o.isMesh&&!me)me=o;});const g=me.geometry,ix=g.index.array,pris=new Uint8Array(ix.length/3);
  tours.forEach((t,n)=>{const l=[];for(const[a,nb]of t.pl)for(let q=a;q<a+nb;q++){pris[q]=1;l.push(ix[q*3],ix[q*3+1],ix[q*3+2]);}
    const gg=new THREE.BufferGeometry();for(const nm in g.attributes)gg.setAttribute(nm,g.attributes[nm]);gg.setIndex(l);
    const piv=new THREE.Group();piv.name='tourelle'+n;piv.position.fromArray(t.piv);piv.userData={a0:t.a0,bout:t.bout};const m=new THREE.Mesh(gg,me.material);m.position.fromArray(t.piv).negate();piv.add(m);me.add(piv);});
  const reste=[];for(let q=0;q<pris.length;q++)if(!pris[q])reste.push(ix[q*3],ix[q*3+1],ix[q*3+2]);g.setIndex(reste);}
function importe(cle,rot,taille){const g=new THREE.Group(),m=(IMPORTS[cle]||IMPORTS['py7_b']||IMPORTS[Object.keys(IMPORTS)[0]]).clone();/* pas encore chargé : un modèle de secours */const piv=new THREE.Group();piv.add(m);piv.rotation.y=rot;g.add(piv);
  const b=new THREE.Box3().setFromObject(piv),s=new THREE.Vector3();b.getSize(s);const k=taille/Math.max(s.x,s.z);piv.scale.setScalar(k);const b2=new THREE.Box3().setFromObject(piv),c=b2.getCenter(new THREE.Vector3());piv.position.sub(c);
  const s2=new THREE.Vector3();b2.getSize(s2);const helices=[],tourelles=[];m.traverse(o=>{if(/^helice/.test(o.name))helices.push(o);if(/^tourelle/.test(o.name))tourelles.push(o);});return{g,env:s2.x/2,arriere:s2.z/2,larg:s2.x,helices,tourelles,tuyeres:(f,coupe)=>tuyeres(g,f,coupe)};}
// repère les tuyères : les points les plus en arrière du modèle, regroupés en taches (grille en x-y) ; une tache = une flamme
function tuyeres(g,force,coupe){g.updateMatrixWorld(true);const P=[],v=new THREE.Vector3();g.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,pas=Math.max(1,Math.floor(a.count/6000));for(let i=0;i<a.count;i+=pas){v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);P.push([v.x,v.y,v.z]);}});
  let z0=1e9,z1=-1e9,x0=1e9,x1=-1e9;for(const p of P){z0=Math.min(z0,p[2]);z1=Math.max(z1,p[2]);x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);}
  if(coupe){const zc=z1-coupe*(z1-z0);for(let i=P.length-1;i>=0;i--)if(P[i][2]>zc)P.splice(i,1);z1=-1e9;for(const p of P)z1=Math.max(z1,p[2]);}/* coupe : on ignore les tiges (canons, antennes) qui dépassent à l'arrière */
  if(force)return force.map(([fx,fy])=>{const x=fx*(x1-x0),y=fy*(x1-x0),R=(x1-x0)*.08;let z=-1e9;for(const p of P)if(Math.hypot(p[0]-x,p[1]-y)<R)z=Math.max(z,p[2]);return[x,y,z>-1e9?z:z1];});
  const L=z1-z0,W=x1-x0,c=W/20,arr=P.filter(p=>p[2]>z1-L*.07),cel=new Map();
  for(const p of arr){const k=Math.floor(p[0]/c)+','+Math.floor(p[1]/c);const e=cel.get(k);if(e){e.n++;e.x+=p[0];e.y+=p[1];e.z=Math.max(e.z,p[2]);}else cel.set(k,{n:1,x:p[0],y:p[1],z:p[2]});}
  const vu=new Set(),taches=[];for(const k of cel.keys()){if(vu.has(k))continue;const t={n:0,x:0,y:0,z:-1e9,c:0},pile=[k];vu.add(k);
    while(pile.length){const q=pile.pop(),e=cel.get(q);t.n+=e.n;t.x+=e.x;t.y+=e.y;t.z=Math.max(t.z,e.z);t.c++;const [i,j]=q.split(',').map(Number);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const r=(i+a)+','+(j+b);if(cel.has(r)&&!vu.has(r)){vu.add(r);pile.push(r);}}}
    taches.push({x:t.x/t.n,y:t.y/t.n,z:t.z,c:t.c});}
  taches.sort((a,b)=>b.c-a.c);return taches.filter(t=>t.c>=Math.max(2,taches[0].c*.3)).slice(0,4).map(t=>[t.x,t.y,t.z]);}
// flammes des réacteurs : trois cônes emboîtés (halo, flamme, cœur blanc) et un point chaud sur la tuyère ; bleues pour notre camp, orangées pour l'ennemi.
// Sur le calque des avions, elles sont à demi transparentes : le rendu final les ajoute comme une lueur, sans contour. Ailleurs (grands vaisseaux, missiles) : mélange additif.
const GEO_FL=new THREE.ConeGeometry(1,1,10,1,true).rotateX(Math.PI/2).translate(0,0,.5),GEO_PT=new THREE.IcosahedronGeometry(1,1);
const TEINTES={b:['#3f9cff','#a8e2ff','#ffffff','#d8f4ff'],r:['#ff5020','#ffb050','#fff2c8','#ffe6b0']},MATS_FL={};
function matFl(col,op,add){const k=col+op+add;return MATS_FL[k]||(MATS_FL[k]=new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false,fog:false,side:THREE.DoubleSide,blending:add?THREE.AdditiveBlending:THREE.NormalBlending}));}
function flamme(s,camp='b',add=false){const T=TEINTES[camp],f=new THREE.Group();
  for(const[col,r,l,op]of[[T[0],1,4.6,.42],[T[1],.66,3,.62],[T[2],.38,1.6,.92]]){const m=new THREE.Mesh(GEO_FL,matFl(col,op,add));m.scale.set(r*s,r*s,l*s);m.renderOrder=5;f.add(m);}
  const p=new THREE.Mesh(GEO_PT,matFl(T[3],.9,add));p.scale.setScalar(.6*s);p.renderOrder=5;f.add(p);return f;}
function animeFlammes(fl,boost){for(const f of fl){const k=(boost?1.8:1)*(.82+Math.random()*.36);f.scale.set(1+(boost?.15:0),1+(boost?.15:0),k);}}
function construire(c,flammes,camp='b'){if(c.m==='import'){const r=importe(c.cle+(c.repeint?'_'+camp:''),c.rot,c.taille||6.4);r.tuy=c.helice?[]:r.tuyeres(c.tuy,c.coupe);r.flammes=[];
    if(flammes){const s=Math.max(.26,Math.min(.6,r.larg*.05/Math.sqrt(Math.max(1,r.tuy.length/2))));for(const t of r.tuy){const f=flamme(s,camp);f.position.set(t[0],t[1],t[2]-s*.3);r.g.add(f);r.flammes.push(f);}}
    return r;}
  const r=MODELES3D[c.m](c);r.flammes=[];if(flammes)for(const t of r.tuy){const f=flamme(.36,camp);f.position.set(t[0],t[1],t[2]-.1);r.g.add(f);r.flammes.push(f);}return r;}
function chasseur(c){return construire(Object.assign({m:'faucon'},c),false).g;}
const PACKS={"fga": "CORVETTES BLEUES \u00b7 FREE GAME ASSETS (craftpix)","polyyai":"POLYYAI (CC0) \u00b7 A ESSAYER"};
const ROT_PACK={polyyai:Math.PI},ROT_MOD={};
// les familles : chaque appareil a les réglages de sa famille (vitesse, virage, blindage, missiles) ; les ennemis sont tirés par famille
const FAMILLES={inter:{nom:'INTERCEPTEURS',txt:'Rapides, virent bien, fragiles',v:1.15,vir:1.3,bli:.7,mis:4,vie:2,b:[5,5,2],l:[2,5,13,17,26]},
  poly:{nom:'POLYVALENTS',txt:'Moyens partout',v:1,vir:1,bli:1,mis:5,vie:3,b:[3,3,3],l:[1,3,7,8,19,23,28]},
  lourd:{nom:'LOURDS',txt:'Lents, tres blindes, plus de missiles',v:.85,vir:.78,bli:1.7,mis:7,vie:6,b:[2,2,5],l:[6,9,10,12,14,16,18,20,21,24,25,27,29,30,32,34]},
  furtif:{nom:'FURTIFS',txt:'Moins reperes (les ennemis tirent de moins loin), armes plus faibles',v:1.05,vir:1.1,bli:.85,mis:4,vie:4,discret:.65,b:[4,4,2],l:[4,11,15,22,31,33,35]}};
const CORV_COUPE={2:.3,3:.34,4:.3};
for(const k in COULEURS)delete COULEURS[k];
for(const f in FAMILLES)for(const i of FAMILLES[f].l)COULEURS['py'+i]={m:'import',cle:'py'+i,repeint:1,rot:Math.PI,fam:f};
for(const k in COULEURS){const c=COULEURS[k];c.pack=FAMILLES[c.fam].nom;c.nom=CAT[c.cle].nom;}
const FAM=()=>FAMILLES[COULEURS[NOMS[choix]].fam];
const NOMS=Object.keys(COULEURS);let choix=NOMS.indexOf('py7');try{const i=NOMS.indexOf(localStorage.getItem('cieldeguerre.avion'));if(i>=0)choix=i;}catch(e){}
// au démarrage : la flotte, les bombardiers, l'appareil du joueur et les polyvalents (premières vagues) ; le reste se charge ensuite, en fond
const FLOTTE_CLES=['fga_destroyer2','fga_croiseur1','fga_destroyer4','fga_destroyer1','fga_croiseur2','fga_destroyer3','fga_croiseur4'];
await Promise.all([...FLOTTE_CLES,...[1,2,3,4,5].flatMap(n=>['fga_corvette'+n+'_r','fga_fregate'+n+'_r']),COULEURS[NOMS[choix]].cle,...FAMILLES.poly.l.map(i=>'py'+i)].map(chargerModele));
setTimeout(async()=>{for(const k in CAT)await chargerModele(k);},4000);
// un appareil ennemi de la famille voulue, parmi ceux déjà chargés (les autres se chargent pour la suite)
function modeleFam(f){const l=FAMILLES[f].l.map(i=>'py'+i);l.forEach(chargerModele);const ok=l.filter(k=>IMPORTS[k+'_r']);
  if(ok.length)return ok[Math.random()*ok.length|0];const p=FAMILLES.poly.l.map(i=>'py'+i).filter(k=>IMPORTS[k+'_r']);return p[Math.random()*p.length|0]||'py7';}
const nav=new THREE.Group();let modele=construire(COULEURS[NOMS[choix]],true),moi=modele.g;moi.scale.setScalar(.66);nav.add(moi);sc.add(nav);versCalque(nav);
const ombre=new THREE.Mesh(new THREE.CircleGeometry(2.6,8).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#3a2a50',transparent:true,opacity:.35,depthWrite:false}));sc.add(ombre);
// traînées des ailes
function trainee(){const n=60,pos=new Float32Array(n*3),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.9}));l.frustumCulled=false;sc.add(l);return{pos,g,n};}
const tr=[trainee(),trainee()];
// grands vaisseaux au loin : deux flottes qui se croisent au-dessus du paysage en échangeant des tirs laser (décor : on ne peut pas les abattre)
const FLOTTE=[],LASERS=[],CAP=.55;let TOURS=[];/* TOURS : tourelles rouges encore debout, cibles du joueur (balles, verrouillage des missiles) */{const camps=[['fga_destroyer2','fga_croiseur1','fga_destroyer4'],['fga_destroyer1','fga_croiseur2','fga_destroyer3','fga_croiseur4']];
  camps.forEach((l,camp)=>l.forEach((cle,i)=>{const lg=cle.includes('destroyer')?120:85;const r=importe(cle,-Math.PI/2,lg);const s=camp?-1:1;
    const fl=[];for(const t of r.tuyeres()){const f=flamme(lg*.022,camp?'r':'b',true);f.position.set(t[0],t[1],t[2]-lg*.01);r.g.add(f);fl.push(f);}
    const yaw=CAP+(camp?Math.PI:0);r.g.rotation.order='YXZ';r.g.rotation.y=yaw;sc.add(r.g);
    FLOTTE.push({g:r.g,camp,lg,yaw,fl,tourelles:r.tourelles.map(o=>({o,cad:Math.random()*2,c:null,cible:camp?{g:new THREE.Object3D(),vie:8,rayon:4,tour:1}:null})),base:new THREE.Vector3(),v:9+Math.random()*3,ph:Math.random()*6,neuf:1});}));}
function fumee(p,n){for(let i=0;i<n;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.2,2.2),new THREE.MeshBasicMaterial({color:i%2?'#3a3240':'#5a4e5e',transparent:true,opacity:.8}));f.position.copy(p).add(new THREE.Vector3((Math.random()-.5)*3,Math.random()*2,(Math.random()-.5)*3));sc.add(f);eclats.push({s:f,v:new THREE.Vector3((Math.random()-.5)*2,4+Math.random()*3,(Math.random()-.5)*2),t:1.6,fum:1});}}
function flotte(dt){for(const n of FLOTTE){n.ph+=dt;if(!n.neuf)animeFlammes(n.fl,false);const d=new THREE.Vector3(-Math.sin(n.yaw),0,-Math.cos(n.yaw));n.base.addScaledVector(d,n.v*dt);
    if(n.chute){/* toutes ses tourelles détruites : il prend feu, pique du nez et tombe */n.chute+=dt;n.base.y-=dt*(4+n.chute*5);n.g.rotation.z+=dt*.12*(n.camp?1:-1);n.g.rotation.x=Math.min(.35,n.chute*.06);n.boomT=(n.boomT||0)-dt;
      if(n.boomT<=0){n.boomT=.12+Math.random()*.2;const p=n.g.position.clone().add(new THREE.Vector3((Math.random()-.5)*n.lg*.3,(Math.random()-.3)*n.lg*.08,(Math.random()-.5)*n.lg*.6).applyQuaternion(n.g.quaternion));boom(p,10+Math.random()*10|0);fumee(p,3);}
      n.g.position.set(n.base.x,n.base.y,n.base.z);if(n.base.y<H(n.base.x,n.base.z)-10||n.chute>9){boom(n.g.position,40);n.neuf=1;n.g.rotation.x=0;}continue;}
    const rel=n.base.clone().sub(S.p);rel.y=0;if(n.neuf||rel.length()>560){/* trop loin : il revient devant le joueur, dans la brume */
      const a=S.yaw+(Math.random()-.5)*(n.neuf?2.4:1.6),dist=n.neuf?180+Math.random()*320:460+Math.random()*60;n.base.set(S.p.x-Math.sin(a)*dist,62+Math.random()*55,S.p.z-Math.cos(a)*dist);n.neuf=0;n.chute=0;for(const t of n.tourelles){t.o.visible=true;t.mort=0;if(t.cible)t.cible.vie=8;}
      for(const m of FLOTTE)if(m!==n&&m.base.distanceTo(n.base)<m.lg*.9+n.lg*.9){n.neuf=1;break;}}/* pas l'un dans l'autre : on retire au prochain coup */
    const x=n.base.x,z=n.base.z;n.g.position.set(x,Math.max(n.base.y,H(x,z)+45)+Math.sin(n.ph*.4)*3,z);n.g.rotation.z=Math.sin(n.ph*.3)*.03;n.g.rotation.x=0;n.g.visible=!n.neuf;}
  // tourelles : chacune choisit une cible (vaisseau ennemi ; les rouges visent aussi le joueur s'il passe près, les bleus les chasseurs ennemis), pivote vers elle et tire du bout de ses canons
  const loc=new THREE.Vector3(),bout=new THREE.Vector3();
  TOURS=[];
  for(const n of FLOTTE){if(n.neuf||n.chute)continue;for(const t of n.tourelles){t.cad-=dt;
      if(t.cible){t.o.getWorldPosition(t.cible.g.position);if(!t.r){t.r=1;t.cible.rayon=Math.max(3.5,Math.hypot(...t.o.userData.bout)*t.o.getWorldScale(loc).x*.75);}
        if(t.cible.vie<=0&&!t.mort){t.mort=1;t.o.visible=false;boom(t.cible.g.position,28);fumee(t.cible.g.position,6);S.score+=300;
          if(n.tourelles.every(u=>u.mort)){n.chute=.01;S.score+=2000;annonce(`VAISSEAU ABATTU<b>+2000</b>Toutes ses tourelles sont détruites`);}}
        if(t.mort){if(Math.random()<dt*4)fumee(t.cible.g.position,1);continue;}/* une tourelle détruite fume */
        TOURS.push(t.cible);}
      if(!t.c||t.cad<-3||(t.c.n&&t.c.n.neuf)||(t.c.e&&t.c.e.vie<=0)){t.c=null;const op=t.o.getWorldPosition(loc).clone();const choix=[];
        if(n.camp===1&&op.distanceTo(S.p)<260*(FAM().discret||1))choix.push({joueur:1},{joueur:1});
        if(n.camp===0)for(const e of ennemis)if(e.vie>0&&e.g.position.distanceTo(op)<260)choix.push({e});
        for(const m of FLOTTE)if(m.camp!==n.camp&&!m.neuf&&m.g.position.distanceTo(op)<650)choix.push({n:m,dx:(Math.random()-.5)*.5,dz:(Math.random()-.5)*.5});
        if(choix.length)t.c=choix[Math.random()*choix.length|0];}
      if(!t.c)continue;const p=t.c.joueur?S.p.clone().addScaledVector(S.fwd||new THREE.Vector3(),S.v*.5):t.c.e?t.c.e.g.position.clone():t.c.n.g.position.clone().add(new THREE.Vector3(t.c.dx*t.c.n.lg,0,t.c.dz*t.c.n.lg));
      const parent=t.o.parent;parent.worldToLocal(loc.copy(p));const vise=Math.atan2(loc.z-t.o.position.z,loc.x-t.o.position.x);
      let da=(t.o.userData.a0-vise)-t.o.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));const pas=dt*1.4;t.o.rotation.y+=Math.max(-pas,Math.min(pas,da));
      if(t.cad<=0&&Math.abs(da)<.15){t.cad=t.c.joueur?1.3+Math.random():1.6+Math.random()*2;t.o.localToWorld(bout.fromArray(t.o.userData.bout));
        const dir=p.clone().sub(bout),L=dir.length();dir.normalize();const coul=n.camp?'#ff6a4a':'#6ae0ff';
        for(let q=0;q<2;q++){const m=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,12),new THREE.MeshBasicMaterial({color:coul}));m.position.copy(bout).addScaledVector(dir,-q*10);m.lookAt(p);sc.add(m);LASERS.push({m,v:dir.clone().multiplyScalar(240),t:L/240+q*10/240,c:t.c});}
        boom(bout,3,['#ffffff',coul]);}}}
  for(const l of LASERS){l.t-=dt;l.m.position.addScaledVector(l.v,dt);
    if(l.c.joueur&&S.mode==='jeu'&&l.m.position.distanceTo(S.p)<3&&S.rollT<0){l.t=0;S.blindage-=6/FAM().bli;V.flash=.15;if(S.blindage<=0)abattu();continue;}
    if(l.c.e&&l.c.e.vie>0&&l.m.position.distanceTo(l.c.e.g.position)<l.c.e.rayon+1){l.t=0;l.c.e.vie-=2;if(l.c.e.vie<=0){boom(l.c.e.g.position);sc.remove(l.c.e.g);}continue;}
    if(l.t<=0&&l.c.n)boom(l.m.position,6,['#ffffff','#ffe066','#ff8a2a']);}
  for(let k=LASERS.length-1;k>=0;k--)if(LASERS[k].t<=0){sc.remove(LASERS[k].m);LASERS.splice(k,1);}}
// ennemis
const ennemis=[];
function ennemi(pos,dir){const g=new THREE.Group();const as=V.n>=4&&Math.random()<.3,bomb=!as&&V.n>=3&&Math.random()<.22;
  const escorte=bomb&&V.n>=4&&Math.random()<.4;const famE=bomb?null:as?(V.n>=5&&Math.random()<.6?'furtif':'inter'):V.n<=2?'poly':(V.n<=4?['poly','poly','inter','lourd']:['poly','inter','lourd','lourd','furtif'])[Math.random()*(V.n<=4?4:5)|0];/* les escadrilles ennemies : polyvalents au début, puis intercepteurs et lourds ; les as sur des intercepteurs ou des furtifs */const mr=construire(!bomb?COULEURS[modeleFam(famE)]:escorte?{m:'import',cle:'fga_fregate'+(1+Math.random()*5|0)+'_r',rot:-Math.PI/2,taille:6.4}:bomb?(n=>({m:'import',cle:'fga_corvette'+n+'_r',rot:-Math.PI/2,taille:6.4,coupe:CORV_COUPE[n]}))(1+Math.random()*5|0):as?ROUGE.vipere:ROUGE.faucon,true,'r'),m=mr.g;/* bombardiers : corvettes rouges ; escorteurs : frégates rouges */
  if(bomb)m.scale.setScalar(escorte?2.8:2.2);m.rotation.y=Math.PI;g.add(m);versCalque(g);sc.add(g);g.position.copy(pos);
  const roles=['tournoi','tournoi','chasse','passe'];const role=roles[Math.random()*roles.length|0];const e={g,as,bomb,fam:famE,fl:mr.flammes,rayon:bomb?(escorte?12:9):4.6,roleDepart:bomb?'bombardier':role,ph:Math.random()*6,r:18+Math.random()*28,vie:escorte?18:bomb?10:(as?2:0)+FAMILLES[famE].vie,etat:'arrivee',role:bomb?'bombardier':role,v:dir.clone().multiplyScalar(58),t:0,tirT:2+Math.random()*2,vise:0,jink:null};ennemis.push(e);return e;}
const tirsEnnemis=[];
// projectiles : géométries et matériaux partagés (traçantes fines)
const GEO_BALLE=new THREE.BoxGeometry(.16,.16,4.2),MAT_BALLE=new THREE.MeshBasicMaterial({color:'#fff3b0',fog:false}),GEO_TIR=new THREE.BoxGeometry(.28,.28,2.8),MAT_TIR=new THREE.MeshBasicMaterial({color:'#ff6040',fog:false}),GEO_FUM=new THREE.IcosahedronGeometry(1,0);
const eclats=[],balles=[],missiles=[];
const boom=(p,n=18,c=['#ffe066','#ff8a2a','#ff4a2a','#555555'])=>{for(let i=0;i<n;i++){const s=new THREE.Mesh(new THREE.BoxGeometry(.9,.9,.9),new THREE.MeshBasicMaterial({color:c[i%c.length],fog:false}));s.position.copy(p);const v=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(6+Math.random()*14);sc.add(s);eclats.push({s,v,t:.6+Math.random()*.7});}};
// rendu final : contour des avions, puis un tramage fin (Bayer 4 × 4) qui donne le grain des dégradés
const post=new THREE.ShaderMaterial({uniforms:{t:{value:cible.texture},ta:{value:cibleAvions.texture},pa:{value:new THREE.Vector2(1/AW,1/AH)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D t;uniform sampler2D ta;uniform vec2 pa;varying vec2 v;
  float bayer(vec2 p){int x=int(mod(p.x,4.)),y=int(mod(p.y,4.));int i=x+y*4;float m[16];m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
    for(int k=0;k<16;k++){if(k==i)return m[k]/16.;}return 0.;}
  void main(){vec3 c=texture2D(t,v).rgb;vec4 a=texture2D(ta,v);
    if(a.a>.92)c=a.rgb;else{if(texture2D(ta,v+vec2(pa.x,0.)).a>.92||texture2D(ta,v-vec2(pa.x,0.)).a>.92||texture2D(ta,v+vec2(0.,pa.y)).a>.92||texture2D(ta,v-vec2(0.,pa.y)).a>.92)c=vec3(.2,.15,.26);else if(a.a>.01)c=min(vec3(1.),c*(1.-a.a*.3)+a.rgb*1.5);}
    float n=22.;c=floor(c*n+bayer(gl_FragCoord.xy))/n;gl_FragColor=vec4(c,1.);}`});
const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),post),scPost=new THREE.Scene(),camPost=new THREE.Camera();scPost.add(quad);
function choisir(k){chargerModele(COULEURS[NOMS[k]].cle).then(()=>choisir2(k));}
function choisir2(k){choix=k;S.munM=Math.min(S.munM,FAM().mis);nav.remove(moi);modele=construire(COULEURS[NOMS[choix]],true);moi=modele.g;moi.scale.setScalar(.66);nav.add(moi);versCalque(moi);try{localStorage.setItem('cieldeguerre.avion',NOMS[choix]);}catch(e){}annonce(`HANGAR<b>${COULEURS[NOMS[choix]].nom}</b>${COULEURS[NOMS[choix]].pack}`);}
const hangar=document.getElementById('hangar');
function ouvrirHangar(){try{document.exitPointerLock();}catch(x){}const barres=n=>'▮'.repeat(n)+'▯'.repeat(5-n);let h='<b>HANGAR</b><p class="aide">35 appareils en 4 familles. Dans le jeu, on les debloquera un par un ; ici, tous sont ouverts pour les essayer.</p>';
  for(const f in FAMILLES){const F=FAMILLES[f];h+=`<i>${F.nom}</i><p class="fam">${F.txt}<br><span>VIT ${barres(F.b[0])} · VIR ${barres(F.b[1])} · BLI ${barres(F.b[2])} · MIS ${F.mis}</span></p>`;
    NOMS.forEach((n,k)=>{if(COULEURS[n].fam===f)h+=`<button data-k="${k}" class="${k===choix?'on':''}">${COULEURS[n].nom}</button>`;});}
  h+='<button data-k="x" class="fermer">FERMER</button>';hangar.innerHTML=h;hangar.style.display='flex';}
/* on choisit au « click » (un vrai toucher, pas le début d'un glissement) : sur téléphone, glisser pour faire défiler la liste ne doit rien choisir */
for(const t of ['pointerdown','pointermove','pointerup','touchstart','touchmove'])hangar.addEventListener(t,e=>e.stopPropagation(),{passive:true});
hangar.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;if(b.dataset.k!=='x')choisir(+b.dataset.k);hangar.style.display='none';});
function changerAvion(){choisir((choix+1)%NOMS.length);}
document.getElementById('charge').remove();
// pilotage
const S={mode:'titre',vies:3,dx:0,dy:0,blindage:100,p:new THREE.Vector3(0,40,0),yaw:0,pitch:0,bank:0,roll:0,rollT:-1,loopT:-1,v:46,boost:0,auto:true,doigt:null,dernier:0,vue:0,tir:false,munB:300,munM:5,t:0,score:0};
S.munM=FAM().mis;const Q=new THREE.Quaternion(),E=new THREE.Euler(0,0,0,'YXZ');window.CielDeGuerre={S,get ennemis(){return ennemis;},FLOTTE,nouvellePartie:()=>nouvellePartie(),abattu:()=>abattu(),pause:()=>pause(),reprendre:()=>reprendre(),get mode(){return S.mode;},get vague(){return V.n;}};/* pour les tests */
// visée : au doigt et au clavier, droit devant ; à la souris, la direction de la souris, ramenée dans un cône de 25° autour du nez
// (le réticule et les balles la suivent tout de suite, sans attendre que l'appareil ait fini de tourner)
const CONE=.44;function visee(fwd){if(!S.souris||S.auto||S.mode!=='jeu'||S.loopT>=0)return fwd;const cm=Math.cos(S.mp),D=new THREE.Vector3(-Math.sin(S.my)*cm,Math.sin(S.mp),-Math.cos(S.my)*cm);
  const a=D.angleTo(fwd);S.horsCone=a>CONE;return a<=CONE?D:fwd.clone().lerp(D,CONE/a).normalize();}
const tonneau=(cote)=>{if(S.rollT<0){S.rollT=0;S.rollD=cote||(S.bank>0?-1:1);}};
const joy=document.getElementById('joy'),bille=joy.firstElementChild,RJ=46;const manuel=(ms=4000)=>{if(S.mode!=='jeu')return;S.auto=false;clearTimeout(S.to);S.to=setTimeout(()=>{S.tir=false;},ms);};/* en partie, le pilote automatique ne reprend jamais la main */
// souris (PC) : elle pilote. Le repère rond est une direction fixe dans le monde, l'avion tourne vers lui ; clic gauche : feu, clic droit : missile
document.getElementById('clavier').innerHTML='FLECHES : PILOTER · ESPACE : FEU<br>E : MISSILE · R : LOOP · F : TONNEAU<br>V : VUE · C : AVION · P : PAUSE<br>CLIC DANS LE JEU : PILOTER A LA SOURIS';
const AIDE_SOURIS='SOURIS : DIRIGER · CLIC G : FEU<br>CLIC D : MISSILE · Z : ACCELERER<br>S : FREINER · Q D : ECART<br>2× Z : LOOP · 2× Q/D : TONNEAU<br>V : VUE · C : AVION · ECHAP : PAUSE';
const souris=()=>{if(!S.souris){S.souris=1;S.my=S.yaw;S.mp=S.pitch;const a=document.getElementById('clavier');a.innerHTML=AIDE_SOURIS;a.style.opacity=1;setTimeout(()=>a.style.opacity=.35,6000);}manuel(1e9);};
el.addEventListener('pointermove',e=>{if(S.mode!=='jeu'||e.pointerType!=='mouse'||S.doigt)return;const verr=document.pointerLockElement===el;if(!verr&&!(e.buttons&3)&&!S.souris)return;
  const mx=e.movementX||0,my=e.movementY||0;if(!mx&&!my||Math.abs(mx)>150||Math.abs(my)>150)return;/* saut parasite à la capture de la souris */souris();S.my-=mx*.0024;S.mp=Math.max(-1.1,Math.min(1.1,S.mp-my*.0024));});
el.addEventListener('contextmenu',e=>e.preventDefault());
el.addEventListener('pointerdown',e=>{if(S.mode!=='jeu'||e.pointerType!=='mouse'||e.target.closest('button,#hangar,.ecran'))return;e.stopImmediatePropagation();e.preventDefault();souris();
  try{const p=el.requestPointerLock&&el.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(x){}
  if(e.button===2)appui('bMis',true);else if(e.button===0){S.tir=true;document.getElementById('bTir').classList.add('on');}},true);
addEventListener('pointerup',e=>{if(e.pointerType==='mouse'&&e.button===0&&S.souris){S.tir=false;document.getElementById('bTir').classList.remove('on');}});
el.addEventListener('pointerdown',e=>{if(S.mode!=='jeu'||e.target.closest('button,.ecran,#hangar')||S.doigt)return;const r=el.getBoundingClientRect();S.doigt={id:e.pointerId,x:e.clientX,y:e.clientY};S.dx=S.dy=0;manuel(1e9);
  joy.style.left=(e.clientX-r.left)+'px';joy.style.top=(e.clientY-r.top)+'px';joy.classList.add('on');bille.style.transform='';document.getElementById('aidejoy').style.display='none';el.setPointerCapture(e.pointerId);});
el.addEventListener('pointermove',e=>{if(!S.doigt||e.pointerId!==S.doigt.id)return;let dx=e.clientX-S.doigt.x,dy=e.clientY-S.doigt.y;const l=Math.hypot(dx,dy);if(l>RJ){dx*=RJ/l;dy*=RJ/l;}
  bille.style.transform=`translate(${dx}px,${dy}px)`;const zm=v=>Math.sign(v)*Math.max(0,Math.abs(v)-.12)/.88;S.dx=zm(dx/RJ);S.dy=zm(dy/RJ);/* zone morte au centre, puis réponse douce */});
const lacher=e=>{if(!S.doigt||e.pointerId!==S.doigt.id)return;S.doigt=null;S.dx=S.dy=0;joy.classList.remove('on');manuel();};el.addEventListener('pointerup',lacher);el.addEventListener('pointercancel',lacher);
const bouton=(id,f)=>{const b=document.getElementById(id);b.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();manuel(5000);f(true,b);});b.addEventListener('pointerup',e=>{e.stopPropagation();f(false,b);});b.addEventListener('pointerleave',()=>f(false,b));b.addEventListener('contextmenu',e=>e.preventDefault());};
bouton('bLoop',d=>{if(d&&S.loopT<0)S.loopT=0;});bouton('bAvion',d=>{if(d)ouvrirHangar();});bouton('bRoll',d=>{if(d)tonneau();});bouton('bVue',d=>{if(d)S.vue=(S.vue+1)%2;});
bouton('bTir',(d,b)=>{S.tir=d;b.classList.toggle('on',d);if(d)manuel(1e9);else manuel();});
// clavier (PC) : AZERTY et QWERTY ; les directions agissent comme un joystick qu'on pousse progressivement
const TOUCHES={};const DIR={ArrowUp:'h',KeyW:'h',KeyZ:'h',ArrowDown:'b',KeyS:'b',ArrowLeft:'g',KeyA:'g',KeyQ:'g',ArrowRight:'d',KeyD:'d'};
const appui=(id,v)=>{const b=document.getElementById(id);b.dispatchEvent(new PointerEvent(v?'pointerdown':'pointerup',{bubbles:true}));};
const MANOEUVRE={KeyW:'acc',KeyZ:'acc',KeyS:'frein',KeyA:'ecg',KeyQ:'ecg',KeyD:'ecd'};const DOUBLE={};
addEventListener('keydown',e=>{if(!vu)return;if(e.code==='KeyP'||e.code==='Escape'){if(S.mode==='jeu')pause();else if(S.mode==='pause'&&e.code==='KeyP')reprendre();return;}if(S.mode!=='jeu')return;if(S.souris&&MANOEUVRE[e.code]){e.preventDefault();if(e.repeat)return;const m=MANOEUVRE[e.code];TOUCHES[m]=1;const t=performance.now();
    if(DOUBLE[m]&&t-DOUBLE[m]<300){DOUBLE[m]=0;if(m==='acc'&&S.loopT<0){S.loopT=0;}else if(m==='ecg')tonneau(1);else if(m==='ecd')tonneau(-1);}else DOUBLE[m]=t;return;}
  const d=DIR[e.code];if(d||e.code==='Space')e.preventDefault();if(e.repeat)return;
  if(d){TOUCHES[d]=1;manuel(1e9);document.getElementById('clavier').style.opacity=.35;}
  else if(e.code==='Space')appui('bTir',true);else if(e.code==='KeyE')appui('bMis',true);else if(e.code==='KeyR')appui('bLoop',true);
  else if(e.code==='KeyF'||e.key==='Shift')appui('bRoll',true);else if(e.code==='KeyV')appui('bVue',true);else if(e.code==='KeyC')appui('bAvion',true);});
addEventListener('keyup',e=>{if(MANOEUVRE[e.code])TOUCHES[MANOEUVRE[e.code]]=0;if(S.souris&&MANOEUVRE[e.code])return;const d=DIR[e.code];if(d){TOUCHES[d]=0;if(!TOUCHES.h&&!TOUCHES.b&&!TOUCHES.g&&!TOUCHES.d)manuel();}else if(e.code==='Space')appui('bTir',false);});
addEventListener('blur',()=>{for(const k in TOUCHES)TOUCHES[k]=0;if(S.tir)appui('bTir',false);});
function clavierPilote(dt){if(S.doigt)return;const cx=(TOUCHES.d||0)-(TOUCHES.g||0),cy=(TOUCHES.b||0)-(TOUCHES.h||0);if(!cx&&!cy&&!S.kx&&!S.ky)return;
  S.kx=(S.kx||0)+(cx-(S.kx||0))*Math.min(1,dt*4);S.ky=(S.ky||0)+(cy-(S.ky||0))*Math.min(1,dt*4);if(Math.abs(S.kx)<.01&&!cx)S.kx=0;if(Math.abs(S.ky)<.01&&!cy)S.ky=0;S.dx=S.kx;S.dy=S.ky;}
bouton('bMis',d=>{if(!d||S.munM<=0)return;S.munM--;const c=LOCK.e&&LOCK.t>=LOCK.T&&LOCK.e.vie>0?LOCK.e:null;
  const m=new THREE.Mesh(new THREE.BoxGeometry(.4,.4,1.6),new THREE.MeshBasicMaterial({color:'#eef2f6'}));const fm=flamme(.16,'b',true);fm.rotation.y=Math.PI;fm.position.z=-.8;m.add(fm);m.position.copy(S.p);sc.add(m);/* le missile a sa petite flamme */missiles.push({m,c,v:S.fwd.clone().multiplyScalar(S.v+20),t:4});});

let av=performance.now(),vu=false;new IntersectionObserver(es=>vu=es[0].isIntersecting).observe(el);band.style.opacity=0;
// les vagues : une formation en V arrive de face, fonce sur le joueur, puis se disperse pour le combat
const V={n:0,pause:4,flash:0};const annonce=(h)=>{band.innerHTML=h;band.style.opacity=1;clearTimeout(V.to);V.to=setTimeout(()=>band.style.opacity=0,2600);};
const MOTIFS=[{nom:'DE FACE',ang:[0]},{nom:'PAR DERRIERE !',ang:[Math.PI]},{nom:'SUR LES FLANCS',ang:[Math.PI/2,-Math.PI/2]},
  {nom:'PAR LE DESSUS',ang:[.35,-.35],dy:70},{nom:'ENCERCLES !',ang:[0,Math.PI*2/3,-Math.PI*2/3]},{nom:'EN DEUX TEMPS',ang:[0,Math.PI],decale:6}];
V.file=[];
function vague(){V.n++;const nb=Math.min(12,1+V.n*2);const m=V.n===1?MOTIFS[0]:V.n===2?MOTIFS[2]:MOTIFS[Math.random()*MOTIFS.length|0];const G=m.ang.length;
  for(let g=0;g<G;g++){const a=S.yaw+m.ang[g]+(Math.random()-.5)*.5;const dir=new THREE.Vector3(-Math.sin(a),0,-Math.cos(a));const cote=new THREE.Vector3(-dir.z,0,dir.x);
    const tete=S.p.clone().addScaledVector(dir,270);tete.y=Math.max(28,S.p.y+(m.dy||0)+(Math.random()-.5)*20);const n=Math.ceil(nb/G)-(g===G-1?Math.ceil(nb/G)*G-nb:0);
    const forme=['V','ligne','disperse'][Math.random()*3|0];const vers=S.p.clone().sub(tete).normalize();
    for(let k=0;k<n;k++){const rang=Math.ceil(k/2),s2=k%2?1:-1;let o;
      if(forme==='V')o=cote.clone().multiplyScalar(s2*rang*9).addScaledVector(dir,rang*10);else if(forme==='ligne')o=cote.clone().multiplyScalar((k-(n-1)/2)*10);
      else o=new THREE.Vector3((Math.random()-.5)*60,(Math.random()-.5)*20,(Math.random()-.5)*60);
      V.file.push({t:(m.decale||0)*g+g*1.2,p:tete.clone().add(o),v:vers.clone()});}}
  annonce(`VAGUE ${V.n}<b>${nb} CHASSEURS</b>${m.nom}`);}
function image(m){const dt=Math.min(.05,(m-av)/1000);av=m;requestAnimationFrame(image);if(!vu&&!window.TOUT_VOIR)return;if(S.mode==='pause'){rendre();return;}S.t+=dt;
  clavierPilote(dt);
  // commandes : virage et tangage
  let tyaw,tp;if(S.auto){const c=ennemis.filter(e=>e.vie>0).sort((a,b)=>a.g.position.distanceTo(S.p)-b.g.position.distanceTo(S.p))[0];
    if(c){const d=c.g.position.clone().sub(S.p);const a=Math.atan2(-d.x,-d.z);let da=a-S.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));tyaw=Math.max(-1,Math.min(1,da*2));tp=Math.max(-.6,Math.min(.6,(c.g.position.y-S.p.y)*.03));
      S.tir=!!S.fwd&&d.angleTo(S.fwd)<.1&&d.length()<170;}else{tyaw=Math.sin(S.t*.35)*.6;tp=(40-S.p.y)*.02;S.tir=false;}
    if(S.p.y<14)tp=.5;if(S.t%11<dt&&S.t>3)tonneau();}
  else if(S.souris&&!S.doigt&&!S.dx&&!S.dy){let da=S.my-S.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));tyaw=Math.max(-1,Math.min(1,da*2.2));tp=S.mp;/* l'avion rejoint la direction de la souris */}
  else{tyaw=-S.dx*Math.abs(S.dx)*1;tp=-S.dy*.9;/* joystick vers le haut : l'avion monte ; vers le bas : il descend */}
  if(!S.souris||S.auto||S.doigt||S.dx||S.dy){S.my=S.yaw;S.mp=S.pitch;}
  if(S.loopT>=0)tyaw=0;/* pendant le looping, le joystick ne fait pas virer */
  tyaw*=FAM().vir;S.vyaw=(S.vyaw||0)+(tyaw-(S.vyaw||0))*Math.min(1,dt*3);S.yaw+=S.vyaw*dt;S.bank+=((S.vyaw*1.1-(S.ecart||0)*.45)-S.bank)*Math.min(1,dt*3);
  if(S.loopT>=0){S.loopT+=dt/2.6;S.pitch+=Math.PI*2*dt/2.6;if(S.loopT>=1){S.loopT=-1;S.mp=0;S.my=S.yaw;S.pitch-=Math.round(S.pitch/(Math.PI*2))*Math.PI*2;/* un tour complet = 0 : sinon l'avion « déroule » la boucle à l'envers */}}
  else{S.pitch+=(Math.max(-.85,Math.min(.85,tp))-S.pitch)*Math.min(1,dt*1.7);}
  if(S.rollT>=0){S.rollT+=dt/.8;S.roll=(S.rollT<1?(1-Math.cos(S.rollT*Math.PI))/2:1)*Math.PI*2*S.rollD;if(S.rollT>=1){S.rollT=-1;S.roll=0;}}
  E.set(S.pitch,S.yaw,S.bank+S.roll);Q.setFromEuler(E);nav.quaternion.copy(Q);
  const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(Q);S.fwd=fwd;const up=new THREE.Vector3(0,1,0).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(S.pitch,S.yaw,0,'YXZ')));
  if(TOUCHES.acc)S.boost=Math.max(S.boost,.05);const v=S.v*FAM().v*(S.boost>0?1.7:1)*(TOUCHES.frein?.62:1);S.boost-=dt;S.p.addScaledVector(fwd,v*dt);
  {const gl=(TOUCHES.ecd||0)-(TOUCHES.ecg||0)+(S.souris&&S.rollT>=0?S.rollD*-1.4:0);if(gl){S.p.x+=Math.cos(S.yaw)*gl*22*dt;S.p.z-=Math.sin(S.yaw)*gl*22*dt;}S.ecart=gl;}/* écart de côté (Q, D) et pendant le tonneau à la souris */const sol=Math.max(0,H(S.p.x,S.p.z));if(S.p.y<sol+4){S.p.y=sol+4;if(S.loopT<0)S.pitch=Math.max(S.pitch,.2);}
  nav.position.copy(S.p);animeFlammes(modele.flammes,S.boost>0);if(modele.helice)modele.helice.rotation.z+=dt*40;if(modele.helices)for(const h of modele.helices)h.rotation.x+=dt*38;/* hélices des avions importés : elles tournent autour de l'axe du nez */
  ombre.position.set(S.p.x,sol+.3,S.p.z);ombre.material.opacity=Math.max(0,.35-(S.p.y-sol)*.004);
  // traînées
  for(const[k,t]of tr.entries()){t.pos.copyWithin(3,0,(t.n-1)*3);const w=new THREE.Vector3((k?1:-1)*modele.env*.66,0,1).applyQuaternion(Q).add(S.p);t.pos[0]=w.x;t.pos[1]=w.y;t.pos[2]=w.z;if(S.t<.1)for(let i=0;i<t.n;i++)t.pos.set([w.x,w.y,w.z],i*3);t.g.attributes.position.needsUpdate=true;}
  // canon
  if(S.tir&&S.munB>0&&(S.cad=(S.cad||0)-dt)<=0){S.cad=.07;S.munB--;S.canon=-(S.canon||1);/* deux canons, un coup chacun */const vis=visee(fwd);const b=new THREE.Mesh(GEO_BALLE,MAT_BALLE);b.position.copy(S.p).addScaledVector(fwd,3).add(new THREE.Vector3(S.canon*modele.env*.3,0,0).applyQuaternion(Q));b.lookAt(b.position.clone().add(vis));sc.add(b);balles.push({b,v:vis.clone().multiplyScalar(v+160),t:1.1});}
  for(const b of balles){b.t-=dt;b.b.position.addScaledVector(b.v,dt);for(const e of ennemis)if(e.vie>0&&b.b.position.distanceTo(e.g.position)<e.rayon){b.t=0;e.vie--;if(e.vie<=0){boom(e.g.position);sc.remove(e.g);S.score+=100;}}
    if(b.t>0)for(const t of TOURS)if(t.vie>0&&b.b.position.distanceTo(t.g.position)<t.rayon){b.t=0;t.vie--;boom(b.b.position,5,['#ffffff','#ffe066','#ff8a2a']);break;}/* tourelles rouges : 8 balles */
    if(b.t>0)for(const n of FLOTTE)if(b.b.position.distanceTo(n.g.position)<n.lg*.3){b.t=0;boom(b.b.position,4,['#ffffff','#ffe066']);break;}/* les balles ricochent sur les grands vaisseaux */}
  for(let i=balles.length-1;i>=0;i--)if(balles[i].t<=0){sc.remove(balles[i].b);balles.splice(i,1);}
  for(const mi of missiles){mi.t-=dt;if(mi.c&&mi.c.vie>0){const d=mi.c.g.position.clone().sub(mi.m.position).normalize().multiplyScalar(110);mi.v.lerp(d,Math.min(1,dt*5));}mi.m.position.addScaledVector(mi.v,dt);mi.m.lookAt(mi.m.position.clone().add(mi.v));
    mi.fu=(mi.fu||0)-dt;if(mi.fu<=0){mi.fu=.05;const f=new THREE.Mesh(GEO_FUM,new THREE.MeshBasicMaterial({color:'#e4e8ef',transparent:true,opacity:.35,depthWrite:false}));f.position.copy(mi.m.position);f.scale.setScalar(.3);sc.add(f);eclats.push({s:f,v:new THREE.Vector3(0,.5,0),t:.55,fum:1,gr:1.8,op:.35});}/* fumée légère : une bouffée toutes les 0,05 s, qui grossit et s'efface vite */
    if(mi.c&&mi.c.vie>0&&mi.m.position.distanceTo(mi.c.g.position)<mi.c.rayon){mi.t=0;mi.c.vie=0;boom(mi.c.g.position,26);sc.remove(mi.c.g);S.score+=250;}}
  for(let i=missiles.length-1;i>=0;i--)if(missiles[i].t<=0){sc.remove(missiles[i].m);missiles.splice(i,1);}
  for(const e of eclats){e.t-=dt;e.s.position.addScaledVector(e.v,dt);if(!e.fum)e.v.y-=12*dt;else{e.s.material.opacity=Math.max(0,Math.min(e.op||.8,e.t*.6));if(e.gr)e.s.scale.multiplyScalar(1+e.gr*dt);}}
  for(let i=eclats.length-1;i>=0;i--)if(eclats[i].t<=0){sc.remove(eclats[i].s);eclats.splice(i,1);}
  // ennemis : arrivée en formation, puis combat tournoyant devant le joueur ; ils tirent
  for(let k=ennemis.length-1;k>=0;k--)if(ennemis[k].vie<=0)ennemis.splice(k,1);
  for(const f of V.file)f.t-=dt;for(let k=V.file.length-1;k>=0;k--)if(V.file[k].t<=0){const f=V.file[k];ennemi(f.p,f.v);V.file.splice(k,1);}
  if(S.mode==='jeu'&&!ennemis.length&&!V.file.length){V.pause-=dt;if(V.pause<=0){V.pause=4;vague();}else if(V.n&&!V.fin){V.fin=1;annonce(`VAGUE ${V.n} TERMINEE<b>+${V.n*500}</b>Prochaine vague…`);S.score+=V.n*500;S.blindage=Math.min(100,S.blindage+30);}}else V.fin=0;
  const fh=new THREE.Vector3(fwd.x,0,fwd.z).normalize(),lat=new THREE.Vector3(-fh.z,0,fh.x);
  for(const e of ennemis){e.t+=dt;e.ph+=dt*(e.as?.8:.5);let cible;const dpl=e.g.position.distanceTo(S.p);
    if(e.etat==='combat'){e.tcomb=(e.tcomb||0)+dt;if(e.tcomb>25&&!e.las){e.las=1;e.role='tournoi';e.roleDepart='tournoi';e.r=Math.min(e.r,25);}}
    if(e.etat==='arrivee'){cible=e.g.position.clone().addScaledVector(e.v,1);if(e.t>3.4||dpl<50)e.etat='combat';}
    else if(e.role==='bombardier'){if(!e.cap||e.g.position.distanceTo(e.cap)<40){const a=Math.random()*6.28;e.cap=S.p.clone().add(new THREE.Vector3(Math.cos(a)*220,0,Math.sin(a)*220));e.cap.y=Math.max(45,S.p.y+20);}cible=e.cap.clone();}
    else if(e.role==='chasse'){e.tc=(e.tc||0)+dt;cible=S.p.clone().addScaledVector(fwd,Math.min(25,dpl*.3));
      const devant=e.g.position.clone().sub(S.p).dot(fwd)>8;   // il a dépassé le joueur : il est devant lui, donc visible
      if(devant||e.tc>10){e.role=devant?'tournoi':'passe';e.retour=devant?6:5;e.tc=0;e.cap=null;}}
    else if(e.role==='passe'){e.tp=(e.tp||0)-dt;if(!e.cap||e.tp<=0||e.g.position.distanceTo(e.cap)<25){const loin=!(e.cap&&e.cap.loin);e.tp=6;
        e.cap=loin?Object.assign(S.p.clone().addScaledVector(new THREE.Vector3(Math.random()-.5,0,Math.random()-.5).normalize(),150),{loin:1}):S.p.clone().addScaledVector(fwd,30);}
      cible=e.cap.clone();cible.y=Math.max(cible.y,24);}
    else{const c=S.p.clone().addScaledVector(fh,85);cible=new THREE.Vector3(c.x+Math.cos(e.ph)*e.r,Math.max(H(c.x,c.z)+12,S.p.y+Math.sin(e.ph*1.7)*6),c.z+Math.sin(e.ph)*e.r);}
    if(e.retour!==undefined&&e.role!=='chasse'&&e.roleDepart==='chasse'){e.retour-=dt;if(e.retour<=0){e.role='chasse';e.retour=undefined;}}
    cible.y=Math.max(cible.y,H(cible.x,cible.z)+10);
    // esquive : un ennemi qui reste dans le viseur fait un écart brusque
    if(e.etat==='combat'&&dpl<190&&e.g.position.clone().sub(S.p).angleTo(fwd)<.12)e.vise+=dt;else e.vise=Math.max(0,e.vise-dt);
    e.repit=Math.max(0,(e.repit||0)-dt);
    if(e.vise>(e.as?.6:.9)&&!e.jink&&!e.repit&&!e.las&&!e.bomb){e.repit=2.5;e.jink={v:new THREE.Vector3(Math.random()-.5,(Math.random()-.5)*.6,Math.random()-.5).normalize().multiplyScalar(e.as?60:42),t:.8};e.vise=0;}
    if(e.jink){cible.addScaledVector(e.jink.v,1.4);e.jink.t-=dt;if(e.jink.t<=0)e.jink=null;}
    const voulu=cible.clone().sub(e.g.position);const devant=e.g.position.clone().sub(S.p).dot(fwd);const vmax=e.bomb?34:(e.role==='tournoi'&&devant<25)?S.v*1.35:e.las?S.v*.85:(e.role==='passe'?80:e.role==='chasse'?S.v*(1.05+.1*Math.sin(e.ph)):70)*(e.as?1.12:1);let vit=e.etat==='arrivee'?58:Math.min(vmax*(e.fam?FAMILLES[e.fam].v:1),Math.max(30,voulu.length()*1.2));
    if(e.role==='chasse')vit=S.v*(dpl>60?1.06:dpl>30?.97:.88)*(e.as?1.05:1);/* il rattrape quand il est loin, ralentit quand il est proche */
    const ang=e.v.angleTo(voulu),om=(e.as?1.5:1.1)*dt;if(ang>1e-4){const ax=new THREE.Vector3().crossVectors(e.v,voulu);if(ax.lengthSq()<1e-8)ax.set(0,1,0);e.v.applyAxisAngle(ax.normalize(),Math.min(ang,om));}
    e.v.setLength(e.v.length()+(vit-e.v.length())*Math.min(1,dt*1.5));
    {const l=e.v.length(),m=l*.55;if(Math.abs(e.v.y)>m){e.v.y=Math.sign(e.v.y)*m;const h=Math.sqrt(l*l-m*m),hx=Math.hypot(e.v.x,e.v.z)||1;e.v.x*=h/hx;e.v.z*=h/hx;}}/* pente limitée à 33° : ils ne peuvent pas suivre un looping */
    e.g.position.addScaledVector(e.v,dt);{const sol=Math.max(0,H(e.g.position.x,e.g.position.z))+6;if(e.g.position.y<sol){e.g.position.y=sol;if(e.v.y<0)e.v.y*=-.3;}}/* jamais sous l'eau ni dans le relief */
    animeFlammes(e.fl,false);if(e.v.lengthSq()>1){e.g.lookAt(e.g.position.clone().add(e.v));e.g.rotateZ(Math.sin(e.ph*1.3)*.7);}
    e.tirT-=dt;const d=S.p.clone().sub(e.g.position);if(e.tirT<=0&&d.length()<(e.bomb?150:140)*(FAM().discret||1)&&(e.bomb||e.v.angleTo(d)<.45)){e.tirT=1.6+Math.random()*2.2;const vise=S.p.clone().addScaledVector(fwd,S.v*d.length()/120).sub(e.g.position).normalize();
      for(let q=0;q<2;q++){const b=new THREE.Mesh(GEO_TIR,MAT_TIR);b.position.copy(e.g.position).addScaledVector(vise,3+q*3);b.lookAt(b.position.clone().add(vise));sc.add(b);tirsEnnemis.push({b,v:vise.clone().multiplyScalar(120),t:1.6});}}}
  for(const b of tirsEnnemis){b.t-=dt;b.b.position.addScaledVector(b.v,dt);if(b.b.position.distanceTo(S.p)<2.6&&S.rollT<0&&S.mode==='jeu'){b.t=0;S.blindage-=7/FAM().bli;V.flash=.15;
      if(S.blindage<=0)abattu();}}
  for(let k=tirsEnnemis.length-1;k>=0;k--)if(tirsEnnemis[k].t<=0){sc.remove(tirsEnnemis[k].b);tirsEnnemis.splice(k,1);}
  V.flash-=dt;el.style.boxShadow=V.flash>0?'inset 0 0 0 6px rgba(226,104,46,.85)':'none';
  // nuages
  for(const n of nuages){const u=n.userData;let x=u.dx,z=u.dz;x=((x-S.p.x)%1100+1650)%1100-550+S.p.x;z=((z-S.p.z)%1100+1650)%1100-550+S.p.z;n.position.set(x,u.y,z);}
  flotte(dt);
  matSol.uniforms.temps.value=S.t;matCiel.uniforms.temps.value=S.t;
  majCarreaux(S.p.x,S.p.z);mer.position.x=S.p.x;mer.position.z=S.p.z;
  // caméra derrière l'avion
  // caméra derrière l'avion : elle suit son orientation par une vraie rotation (slerp), même sur le dos pendant un looping
  const loin=S.vue?30:17,haut=S.vue?8:3.8;const qc=new THREE.Quaternion().setFromEuler(new THREE.Euler(S.pitch-.1,S.yaw,0,'YXZ'));
  if(!S.qc)S.qc=qc.clone();S.qc.slerp(qc,Math.min(1,dt*(S.loopT>=0?8:5)));
  const cp=S.p.clone().add(new THREE.Vector3(0,haut,loin).applyQuaternion(S.qc));const solC=Math.max(0,H(cp.x,cp.z))+2;if(cp.y<solC)cp.y=solC;
  cam.position.copy(cp);cam.quaternion.copy(S.qc);ciel.position.copy(cam.position);
  hud.innerHTML=`SCORE ${String(S.score).padStart(6,'0')} · ${'✈'.repeat(Math.max(0,S.vies))}<br>VAGUE ${V.n} · ENNEMIS ${ennemis.length}<br>BLINDAGE ${'▮'.repeat(Math.ceil(S.blindage/10))}${'▯'.repeat(10-Math.ceil(S.blindage/10))}`;document.getElementById('nTir').textContent=S.munB;document.getElementById('nMis').textContent='▮'.repeat(S.munM)||'—';
  if(S.munB<=0)S.munB=300;if(S.munM<=0&&!S.rech){S.rech=1;setTimeout(()=>{S.munM=FAM().mis;S.rech=0;},6000);}
  rendre();if(S.mode==='jeu')viseur(visee(fwd),dt);else ox.clearRect(0,0,OW,OH);}
function rendre(){cam.layers.set(0);R.setRenderTarget(cible);R.setClearColor(0x000000,1);R.clear();R.render(sc,cam);
  cam.layers.set(AVIONS);R.setRenderTarget(cibleAvions);R.setClearColor(0x000000,0);R.clear();R.render(sc,cam);
  R.setRenderTarget(null);R.render(scPost,camPost);}
const LOCK={e:null,t:0,T:.5};
// pixel art à la main : croix du viseur, coins des cadres
function px(x,y,w,h,c){ox.fillStyle=c;ox.fillRect(Math.round(x),Math.round(y),w,h);}
function coins(x,y,r,c,ep=1){const L=Math.max(2,Math.round(r*.45));for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const cx=x+sx*r,cy=y+sy*r;px(sx<0?cx:cx-L+1,cy,L,ep,c);px(cx,sy<0?cy:cy-L+1,ep,L,c);}}
function versEcran(v){const q=v.clone().project(cam);if(q.z>1||q.z<-1)return null;return[(q.x+1)/2*OW,(1-q.y)/2*OH];}
function viseur(fwd,dt){ox.clearRect(0,0,OW,OH);
  // le verrouillage : l'ennemi le plus près de l'axe, dans un cône de 0,3 rad et à moins de 240 m
  let best=null,ba=.3;for(const e of ennemis.concat(TOURS)){if(e.vie<=0)continue;const d=e.g.position.clone().sub(S.p);const l=d.length();if(l>240)continue;const a=d.angleTo(fwd);if(a<ba){ba=a;best=e;}}
  if(best!==LOCK.e){LOCK.e=best;LOCK.t=0;}else if(best)LOCK.t+=dt;
  // cadres : gris au loin, rouges dans l'axe de tir, jaune qui se resserre pendant le verrouillage, rouge + LOCK une fois verrouillé
  for(const e of ennemis.concat(TOURS)){if(e.vie<=0)continue;const p=versEcran(e.g.position);if(!p)continue;const l=e.g.position.distanceTo(S.p);if(e.tour&&l>320)continue;const r=Math.max(4,Math.min(12,700/l));
    if(e===LOCK.e){const f=Math.min(1,LOCK.t/LOCK.T);if(f<1){coins(p[0],p[1],r+8*(1-f),Math.floor(S.t*10)%2?'#ffe080':'#ffb040');}
      else{coins(p[0],p[1],r,'#e2682e',2);if(Math.floor(S.t*6)%2){ox.font='bold 7px monospace';ox.fillStyle='#1a1c22';ox.fillText('LOCK',Math.round(p[0]-9),Math.round(p[1]-r-3));ox.fillStyle='#ffe080';ox.fillText('LOCK',Math.round(p[0]-10),Math.round(p[1]-r-4));}}}
    else coins(p[0],p[1],r,e.g.position.clone().sub(S.p).angleTo(fwd)<.06?'#e2682e':'rgba(230,238,246,.75)');}
  // flèches au bord de l'écran : les ennemis hors de vue (rouges qui clignotent s'ils sont derrière et proches)
  for(const e of ennemis){if(e.vie<=0)continue;const q=e.g.position.clone().applyMatrix4(cam.matrixWorldInverse);const n=e.g.position.clone().project(cam);
    if(q.z<0&&Math.abs(n.x)<.95&&Math.abs(n.y)<.95)continue;let dx=q.x,dy=-q.y;if(q.z>0&&Math.hypot(dx,dy)<.01)dy=1;const l=Math.hypot(dx,dy);dx/=l;dy/=l;
    const k=Math.min((OW/2-9)/Math.abs(dx||1e-6),(OH/2-9)/Math.abs(dy||1e-6));const x=OW/2+dx*k,y=OH/2+dy*k;const prs=q.z>0&&e.g.position.distanceTo(S.p)<80;
    if(prs&&Math.floor(S.t*6)%2)continue;ox.save();ox.translate(Math.round(x),Math.round(y));ox.rotate(Math.atan2(dy,dx));
    ox.fillStyle='#1a1c22';ox.beginPath();ox.moveTo(6,0);ox.lineTo(-4,-5);ox.lineTo(-4,5);ox.fill();ox.fillStyle=prs?'#ff4a2a':'#e2682e';ox.beginPath();ox.moveTo(4,0);ox.lineTo(-3,-3);ox.lineTo(-3,3);ox.fill();ox.restore();}
  // le repère de la souris : la direction vers laquelle l'avion tourne
  if(S.souris&&!S.auto&&S.horsCone){const cm=Math.cos(S.mp);/* le rond pointillé : seulement quand on vise au-delà du cône (là où l'appareil tourne) */const q=versEcran(S.p.clone().add(new THREE.Vector3(-Math.sin(S.my)*cm,Math.sin(S.mp),-Math.cos(S.my)*cm).multiplyScalar(120)));
    if(q){const[x,y]=[Math.round(q[0]),Math.round(q[1])];for(let a=0;a<16;a++){const ang=a/16*Math.PI*2;px(x+Math.round(Math.cos(ang)*5),y+Math.round(Math.sin(ang)*5),1,1,a%2?'#ffffff':'#1a1c22');}}}
  // le viseur : là où vont les balles, 120 m devant
  const v=versEcran(S.p.clone().addScaledVector(fwd,120));if(v){const[x,y]=[Math.round(v[0]),Math.round(v[1])];
    for(const[c,o]of[['#1a1c22',1],['#ffffff',0]]){px(x-6+o,y+o,4,1,c);px(x+3+o,y+o,4,1,c);px(x+o,y-6+o,1,4,c);px(x+o,y+3+o,1,4,c);px(x+o,y+o,1,1,c);}}
  // munitions de missiles et état du verrouillage, sous le viseur
  if(LOCK.e&&LOCK.t>=LOCK.T&&v){ox.font='bold 7px monospace';ox.fillStyle='#ffe080';ox.fillText('MISSILE PRET',Math.round(v[0]-24),Math.round(v[1]+16));}}

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
})();
