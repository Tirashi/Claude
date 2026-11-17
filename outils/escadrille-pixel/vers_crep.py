# Transforme la maquette « Escadrille pixel » (pixel3d.html) en « Escadrille crépuscule » (crep.html)
import sys
S=sys.argv[1]
s=open(S+'/pixel3d.html').read()
def rep(a,b,n=1):
    global s
    assert a in s,a[:80]; s=s.replace(a,b,n)
def bloc(deb,fin,nouveau):
    global s
    i=s.index(deb);j=s.index(fin,i);s=s[:i]+nouveau+s[j:]
NOISE="""float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}"""
rep("const LW=180,LH=320;","const ECH=2.5;const LW=Math.max(240,Math.min(560,Math.round(el.clientWidth*(devicePixelRatio||1)/ECH))),LH=Math.round(LW*16/9);const OW=180,OH=320;/* OW × OH : la toile du viseur */")
rep("const ov=document.createElement('canvas');ov.width=LW;ov.height=LH;","const ov=document.createElement('canvas');ov.width=OW;ov.height=OH;")
rep("const AW=LW/2,AH=LH/2;","const AW=LW,AH=LH;")
rep("// les avions sont dessinés à part, en deux fois moins de pixels, pour avoir l'air de sprites","// les avions sont dessinés à part (même finesse), pour leur tracer un contour")
rep("cam=new THREE.PerspectiveCamera(60,LW/LH,.5,900);","cam=new THREE.PerspectiveCamera(62,LW/LH,.5,1500);")
rep("sc.fog=new THREE.Fog('#dceef9',170,540);","const SOLEIL=new THREE.Vector3(-.45,.2,-1).normalize(),BRUME=new THREE.Color('#f1c6aa'),BN=220,BF=760;\nsc.fog=new THREE.Fog(BRUME,BN,BF);")
CIEL="""// ciel du crépuscule, peint par la carte graphique : dégradé, soleil et halo, traînées de nuages
const matCiel=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{soleil:{value:SOLEIL},temps:{value:0}},
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`@NOISE@
  uniform vec3 soleil;uniform float temps;varying vec3 vD;
  void main(){vec3 d=normalize(vD);float y=d.y;
    vec3 haut=vec3(.56,.46,.70),rose=vec3(.92,.60,.64),peche=vec3(.98,.76,.60),jaune=vec3(1.,.88,.62),brume=vec3(.945,.776,.667);
    vec3 c=y<0.?brume:y<.07?mix(brume,jaune,y/.07):y<.22?mix(jaune,peche,(y-.07)/.15):y<.45?mix(peche,rose,(y-.22)/.23):mix(rose,haut,clamp((y-.45)/.45,0.,1.));
    float s=dot(d,soleil);c=mix(c,vec3(1.,.93,.75),smoothstep(.95,.995,s)*.55);c=mix(c,vec3(1.,.97,.88),smoothstep(.9975,.9985,s));
    if(y>.01){vec2 q=d.xz/(y+.12);float n=fb(vec2(q.x*.9+temps*.004,q.y*3.2));float k=smoothstep(.52,.68,n)*smoothstep(.01,.12,y)*(1.-smoothstep(.55,.9,y));
      vec3 nu=mix(vec3(1.,.86,.78),vec3(.82,.56,.66),clamp(.5-y*1.2+n*.3,0.,1.));c=mix(c,nu,k*.8);}
    gl_FragColor=vec4(c,1.);}`});
var ciel=new THREE.Mesh(new THREE.SphereGeometry(900,32,24),matCiel);ciel.renderOrder=-1;sc.add(ciel);
"""
bloc("// ciel : larges bandes unies","const hemi=",CIEL.replace('@NOISE@',NOISE))
rep("const hemi=new THREE.HemisphereLight('#eef6ff','#4a6a50',.85);","const hemi=new THREE.HemisphereLight('#ffe6d6','#5a4a70',.8);")
rep("const L=new THREE.DirectionalLight('#fff4e0',.95);L.position.set(-.5,1,.6);","const L=new THREE.DirectionalLight('#ffd6b0',1.05);L.position.copy(SOLEIL).multiplyScalar(10).add(new THREE.Vector3(0,6,0));")
SOL="""// au-delà des carreaux : la mer profonde
const mer=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#2a4f86'}));mer.position.y=-.3;sc.add(mer);
// relief : la hauteur dans la géométrie ; les couleurs (forêts d'automne, roche, plage, profondeur de l'eau, écume) calculées pixel par pixel
const matSol=new THREE.ShaderMaterial({uniforms:{soleil:{value:SOLEIL},temps:{value:0},brume:{value:BRUME},bN:{value:BN},bF:{value:BF}},
  vertexShader:`attribute float hauteur;varying vec3 vP;varying float vH;varying vec3 vN;varying float vDist;
  void main(){vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vH=hauteur;vN=normal;vec4 m=viewMatrix*w;vDist=length(m.xyz);gl_Position=projectionMatrix*m;}`,
  fragmentShader:`@NOISE@
  uniform vec3 soleil,brume;uniform float temps,bN,bF;varying vec3 vP;varying float vH;varying vec3 vN;varying float vDist;
  void main(){vec3 c;vec3 n=normalize(vN);float li=clamp(dot(n,soleil)*.9+.35,0.,1.2);
    if(vH<.15){float d=max(0.,-vH);
      c=mix(vec3(.36,.78,.76),vec3(.17,.52,.70),smoothstep(0.,5.,d));c=mix(c,vec3(.13,.27,.50),smoothstep(5.,26.,d));
      c*=.88+.22*fb(vP.xz*.025+vec2(temps*.015,0.));
      float ec=1.-smoothstep(0.,1.6,d+(vn(vP.xz*.35+temps*.4)-.5)*1.4);c=mix(c,vec3(.97,.94,.9),ec*.9);
      float mo=step(.986,h21(floor(vP.xz*.8)+floor(temps*.8)*17.3))*smoothstep(3.,9.,d);c=mix(c,vec3(.93,.95,1.),mo*.85);
      float sp=step(.993,h21(floor(vP.xz*1.7)+31.))*smoothstep(2.,6.,d);c=mix(c,vec3(1.,.9,.75),sp*.5);
    }else{float n1=fb(vP.xz*.006),n2=fb(vP.xz*.03+7.),g=h21(floor(vP.xz*1.5)),g2=h21(floor(vP.xz*.6)+5.);
      vec3 vert=vec3(.20,.44,.27),jaune=vec3(.94,.72,.26),orange=vec3(.88,.46,.17),rouge=vec3(.70,.23,.15),olive=vec3(.66,.63,.38),mauve=vec3(.47,.40,.55);
      vec3 b=n1<.40?vert:n1<.47?mix(vert,jaune,(n1-.40)/.07):n1<.55?jaune:n1<.62?mix(jaune,orange,(n1-.55)/.07):n1<.68?orange:rouge;
      b=mix(b,olive,smoothstep(.56,.74,n2)*.65);b*=.8+.34*g;if(g2>.9)b=mix(b,vert*.85,.65);if(g>.96)b=mix(b,vec3(1.,.88,.6),.6);
      float pente=1.-n.y;b=mix(b,mauve*(.82+.3*g),smoothstep(.3,.45,pente));b=mix(b,vec3(.92,.86,.88),smoothstep(34.,46.,vH)*(1.-pente));
      vec3 sable=vec3(.95,.86,.64)*(.93+.1*g);c=mix(sable,b,smoothstep(.6,2.4,vH+(n2-.5)*1.6));c*=li;}
    c=mix(c,brume,smoothstep(bN,bF,vDist));gl_FragColor=vec4(c,1.);}`});
const T=200,SEG=50;const carreaux=new Map();
function carreau(i,j){const g=new THREE.PlaneGeometry(T,T,SEG,SEG).rotateX(-Math.PI/2);const p=g.attributes.position,hh=new Float32Array(p.count);
  for(let k=0;k<p.count;k++){const x=p.getX(k)+i*T,z=p.getZ(k)+j*T;const h=H(x,z);hh[k]=h;p.setY(k,Math.max(0,h));}g.setAttribute('hauteur',new THREE.BufferAttribute(hh,1));g.computeVertexNormals();
  const m=new THREE.Mesh(g,matSol);m.position.set(i*T,0,j*T);sc.add(m);return m;}
function majCarreaux(x,z){const ci=Math.round(x/T),cj=Math.round(z/T),vus=new Set();let neuf=0;for(let a=-3;a<=3;a++)for(let b=-3;b<=3;b++){const k=(ci+a)+','+(cj+b);vus.add(k);if(!carreaux.has(k)&&neuf<3){carreaux.set(k,carreau(ci+a,cj+b));neuf++;}}
  for(const[k,m]of carreaux)if(!vus.has(k)){sc.remove(m);m.geometry.dispose();carreaux.delete(k);}}
// nuages en volume : des grappes de boules low poly, éclairées en 3 tons (rose clair, rose, mauve)
const matNuage=new THREE.ShaderMaterial({uniforms:{soleil:{value:SOLEIL},brume:{value:BRUME},bN:{value:BN},bF:{value:BF}},
  vertexShader:'varying vec3 vN;varying float vDist;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 m=modelViewMatrix*vec4(position,1.);vDist=length(m.xyz);gl_Position=projectionMatrix*m;}',
  fragmentShader:'uniform vec3 soleil,brume;uniform float bN,bF;varying vec3 vN;varying float vDist;void main(){float l=dot(normalize(vN),soleil)+.25*normalize(vN).y;vec3 c=l>.35?vec3(1.,.9,.86):l>-.05?vec3(.96,.74,.76):vec3(.72,.58,.72);c=mix(c,brume,smoothstep(bN,bF,vDist)*.9);gl_FragColor=vec4(c,1.);}'});
const nuages=[];{const geo=new THREE.IcosahedronGeometry(1,1);for(let i=0;i<34;i++){const g=new THREE.Group();const n=4+Math.random()*5|0,tl=8+Math.random()*16;
  for(let k=0;k<n;k++){const b=new THREE.Mesh(geo,matNuage);const r=tl*(.45+Math.random()*.45);b.scale.set(r,r*.72,r);b.position.set((Math.random()-.5)*tl*1.8,Math.random()*tl*.25,(Math.random()-.5)*tl*1.2);g.add(b);}
  g.userData={dx:(Math.random()-.5)*1100,dz:(Math.random()-.5)*1100,y:28+Math.random()*80};sc.add(g);nuages.push(g);}}
"""
bloc("// au-delà des carreaux : la mer profonde","// un chasseur construit dans le code",SOL.replace('@NOISE@',NOISE))
rep("for(const n of nuages){const u=n.userData;let x=u.dx,z=u.dz;x=((x-S.p.x)%700+1050)%700-350+S.p.x;z=((z-S.p.z)%700+1050)%700-350+S.p.z;n.position.set(x,u.y,z);}",
    "for(const n of nuages){const u=n.userData;let x=u.dx,z=u.dz;x=((x-S.p.x)%1100+1650)%1100-550+S.p.x;z=((z-S.p.z)%1100+1650)%1100-550+S.p.z;n.position.set(x,u.y,z);}\n  matSol.uniforms.temps.value=S.t;matCiel.uniforms.temps.value=S.t;")
rep("const nav=new THREE.Group();const moi=chasseur({corps:'#3a3d46',aile:'#6a6e78',accent:'#c8402e',verriere:'#79bde6'});moi.scale.setScalar(.8);nav.add(moi);sc.add(nav);",
"""const COULEURS={FAUCON:{corps:'#b9b3cf',aile:'#d9d4ea',accent:'#e2682e',verriere:'#ffcf7a'},HIRONDELLE:{corps:'#3f6fb0',aile:'#86b2e2',accent:'#f2c94c',verriere:'#ffb040'},
  CORSAIRE:{corps:'#5f7a44',aile:'#8fa86a',accent:'#f2c94c',verriere:'#86bdea'},VIPERE:{corps:'#7a2e28',aile:'#b0583a',accent:'#ffe080',verriere:'#7fd0ff'}};
const NOMS=Object.keys(COULEURS);let choix=0;try{choix=Math.max(0,NOMS.indexOf(localStorage.getItem('escadrille.avion3d')));}catch(e){}
const nav=new THREE.Group();let moi=chasseur(COULEURS[NOMS[choix]]);moi.scale.setScalar(.8);nav.add(moi);sc.add(nav);""")
i=s.index("feu.scale.setScalar(.8);nav.add(feu);nav.visible=false;");j=s.index("\n",i)
s=s[:i]+"feu.scale.setScalar(.8);nav.add(feu);versCalque(nav);"+s[j:]
rep("const m=chasseur({corps:'#9a958a',aile:'#d1bd7e',accent:'#e2682e',verriere:'#1a1c22'});","const m=chasseur({corps:'#4a3f5e',aile:'#6e6182',accent:'#d2402e',verriere:'#1a1c22'});")
POST="""// rendu final : contour des avions, puis un tramage fin (Bayer 4 × 4) qui donne le grain des dégradés
const post=new THREE.ShaderMaterial({uniforms:{t:{value:cible.texture},ta:{value:cibleAvions.texture},pa:{value:new THREE.Vector2(1/AW,1/AH)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D t;uniform sampler2D ta;uniform vec2 pa;varying vec2 v;
  float bayer(vec2 p){int x=int(mod(p.x,4.)),y=int(mod(p.y,4.));int i=x+y*4;float m[16];m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
    for(int k=0;k<16;k++){if(k==i)return m[k]/16.;}return 0.;}
  void main(){vec3 c=texture2D(t,v).rgb;vec4 a=texture2D(ta,v);
    if(a.a>.5)c=a.rgb;else if(texture2D(ta,v+vec2(pa.x,0.)).a>.5||texture2D(ta,v-vec2(pa.x,0.)).a>.5||texture2D(ta,v+vec2(0.,pa.y)).a>.5||texture2D(ta,v-vec2(0.,pa.y)).a>.5)c=vec3(.2,.15,.26);
    float n=22.;c=floor(c*n+bayer(gl_FragCoord.xy))/n;gl_FragColor=vec4(c,1.);}`});
"""
bloc("// rendu final : chaque pixel","const quad=",POST)
bloc("// le sprite du joueur : une planche","el.querySelector('.charge').remove();",
 "function changerAvion(){choix=(choix+1)%NOMS.length;nav.remove(moi);moi=chasseur(COULEURS[NOMS[choix]]);moi.scale.setScalar(.8);nav.add(moi);versCalque(moi);try{localStorage.setItem('escadrille.avion3d',NOMS[choix]);}catch(e){}annonce(`HANGAR<b>${NOMS[choix]}</b>Bon vol !`);}\n")
rep("placerSprite(Q,fwd);R.setRenderTarget(null)","R.setRenderTarget(null)")
rep("const w=new THREE.Vector3((k?1:-1)*SP.env/17*1.05,.1,.4)","const w=new THREE.Vector3((k?1:-1)*2.4,0,1.2)")
i=s.index("function px(x,y,w,h,c)");seg=s[i:]
for a,b in [("(q.x+1)/2*LW,(1-q.y)/2*LH","(q.x+1)/2*OW,(1-q.y)/2*OH"),("ox.clearRect(0,0,LW,LH)","ox.clearRect(0,0,OW,OH)"),("(LW/2-9)","(OW/2-9)"),("(LH/2-9)","(OH/2-9)"),("const x=LW/2+dx*k,y=LH/2+dy*k;","const x=OW/2+dx*k,y=OH/2+dy*k;")]:
    assert a in seg,a; seg=seg.replace(a,b)
s=s[:i]+seg
rep("new THREE.MeshBasicMaterial({color:'#0a2a50',transparent:true,opacity:.35,depthWrite:false})","new THREE.MeshBasicMaterial({color:'#3a2a50',transparent:true,opacity:.35,depthWrite:false})")
rep("<title>Escadrille pixel</title>","<title>Escadrille crépuscule</title>")
rep("ESCADRILLE PIXEL · MAQUETTE","ESCADRILLE CREPUSCULE · MAQUETTE")
open(S+'/crep.html','w').write(s)
print('SPRITES' in s, 'SP.' in s, 'PAL' in s)
