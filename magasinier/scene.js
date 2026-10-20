/* Le Magasinier : la scène en Three.js (r128, lib/three.min.js), reprise de maquettes/magasinier-4.html (lieu A, l'entrepôt au soleil).
   Plateau en blocs habillés de textures pixel art 16×16 générées par code, caméra penchée, flou tilt-shift, halo,
   ombres, lumières locales, particules. MagScene.creer(canvas, { fini, son }) renvoie l'objet qui pilote la scène.
   Dépend de MagDocker (docker.js) et de MAG_DIRS (regles.js). */
const MagScene = (function () {
// ---------- outils pixel art (textures 16×16) ----------
function toile(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;}
function alea(g){let s=g>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function R(g,x,y,w,h,c){g.fillStyle=c;g.fillRect(x,y,w,h);}
function texPix(n,peindre,rep,m){const c=toile(n,m||n),g=c.getContext("2d");peindre(g,n,m||n);const t=new THREE.CanvasTexture(c);
  t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep[0],rep[1]);}return t;}
const choix=(r,l)=>l[Math.floor(r()*l.length)];
// peintres de textures 16×16
const PEINT={
  planches:(p)=>(g,n)=>{const r=alea(7);for(let i=0;i<4;i++){R(g,0,i*4,n,4,choix(r,p.c));R(g,0,i*4+3,n,1,p.f);const j=Math.floor(r()*n);R(g,j,i*4,1,3,p.f);
    for(let k=0;k<3;k++)R(g,Math.floor(r()*n),i*4+1+Math.floor(r()*2),2,1,p.g);R(g,(j+3)%n,i*4+1,1,1,p.l);}},
  dalles:(p)=>(g,n)=>{const r=alea(5);R(g,0,0,n,n,p.f);for(let y=0;y<2;y++)for(let x=0;x<2;x++){const c=choix(r,p.c);R(g,x*8,y*8,7,7,c);R(g,x*8,y*8,7,1,p.l);R(g,x*8,y*8,1,7,p.l);
    for(let k=0;k<4;k++)R(g,x*8+1+Math.floor(r()*5),y*8+1+Math.floor(r()*5),1,1,p.g);}R(g,3,2,1,3,p.f);R(g,4,4,2,1,p.f);R(g,11,10,1,2,p.f);},
  briques:(p)=>(g,n)=>{const r=alea(3);R(g,0,0,n,n,p.f);for(let y=0;y<4;y++)for(let x=-1;x<3;x++){const X=x*8+(y%2?4:0);R(g,X,y*4,7,3,choix(r,p.c));R(g,X,y*4,7,1,p.l);R(g,X+1+Math.floor(r()*5),y*4+1,1,1,p.g);}},
  dessus:(p)=>(g,n)=>{const r=alea(17);R(g,0,0,n,n,p.c[0]);for(let k=0;k<30;k++)R(g,Math.floor(r()*n),Math.floor(r()*n),1,1,choix(r,p.c));R(g,0,0,n,1,p.l);R(g,0,0,1,n,p.l);R(g,0,n-1,n,1,p.f);R(g,n-1,0,1,n,p.f);
    if(p.neige){R(g,0,0,n,5,"#dfeaf6");for(let k=0;k<30;k++)R(g,Math.floor(r()*n),4+Math.floor(r()*8),2,1,r()<.5?"#eef6ff":"#c4d4e8");}},
};
const texCaisse=(p)=>texPix(16,(g,n)=>{R(g,0,0,n,n,p.f);for(let i=0;i<3;i++){R(g,2,2+i*4,12,4,i%2?p.c:p.l);R(g,2,5+i*4,12,1,p.g);}
  for(let i=0;i<10;i++){R(g,3+i,12-i,2,2,p.f);R(g,3+i,11-i,1,1,p.l);}R(g,0,0,n,1,p.l);R(g,0,0,1,n,p.l);R(g,1,1,1,1,"#2a1a10");R(g,14,1,1,1,"#2a1a10");R(g,1,14,1,1,"#2a1a10");R(g,14,14,1,1,"#2a1a10");});
// caisse lourde : fonte gris-bleu cerclée de fer, rivets
const texFonte=()=>texPix(16,(g,n)=>{R(g,0,0,n,n,"#3a414c");R(g,2,2,12,12,"#5a6472");R(g,2,2,12,1,"#7a8696");R(g,2,6,12,1,"#48505c");R(g,2,10,12,1,"#48505c");R(g,2,13,12,1,"#434a55");
  [[1,1],[14,1],[1,14],[14,14],[7,1],[7,14],[1,7],[14,7]].forEach(([x,y])=>{R(g,x,y,1,1,"#b8c0cc");R(g,x+1>15?x:x+1,y+1>15?y:y+1,1,1,"#2a2f38");});R(g,5,4,6,1,"#8e9aaa");R(g,4,8,8,1,"#6a7484");});
// tapis roulant : bande sombre à lattes, chevrons jaunes vers +x (la texture défile, le maillage est tourné selon le sens)
const texTapis=()=>{const t=texPix(16,(g,n)=>{R(g,0,0,n,n,"#2e2c2a");for(let x=0;x<n;x+=4){R(g,x,0,1,n,"#3e3a36");R(g,x+3,0,1,n,"#1e1c1a");}
  [2,10].forEach(x0=>{for(let i=0;i<4;i++){R(g,x0+i,4+i,2,1,"#f0bf2a");R(g,x0+i,11-i,2,1,"#f0bf2a");}});R(g,0,0,n,1,"#55504a");R(g,0,n-1,n,1,"#151312");});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
const texGlace=()=>texPix(16,(g,n)=>{const r=alea(21);R(g,0,0,n,n,"#9fd6ee");for(let k=0;k<40;k++)R(g,Math.floor(r()*n),Math.floor(r()*n),1,1,r()<.5?"#b8e4f6":"#86c4e2");
  for(let i=0;i<5;i++){R(g,2+i,10-i,1,1,"#ffffff");R(g,9+i,6-i,1,1,"#eafaff");}R(g,4,12,3,1,"#6aa8cc");R(g,6,13,1,1,"#6aa8cc");R(g,12,9,1,3,"#6aa8cc");});
const texMarque=(col)=>texPix(16,(g,n)=>{[[1,1],[11,1],[1,11],[11,11]].forEach(([x,y])=>{R(g,x,y+(y>8?3:0),4,1,col);R(g,x+(x>8?3:0),y,1,4,col);});R(g,7,5,2,1,col);R(g,6,6,4,1,col);R(g,5,7,6,2,col);R(g,6,9,4,1,col);R(g,7,10,2,1,col);R(g,7,7,2,2,"#ffffff");});
const texTonneau=()=>texPix(16,(g,n)=>{const r=alea(31);for(let x=0;x<4;x++){R(g,x*4,0,4,n,choix(r,["#8a5a32","#7a4e2a","#966438"]));R(g,x*4+3,0,1,n,"#4e3018");}R(g,0,3,n,2,"#5a5e66");R(g,0,3,n,1,"#9aa0a8");R(g,0,11,n,2,"#5a5e66");R(g,0,11,n,1,"#9aa0a8");});
const texSac=()=>texPix(16,(g,n)=>{const r=alea(41);R(g,0,0,n,n,"#c8ad7e");for(let k=0;k<50;k++)R(g,Math.floor(r()*n),Math.floor(r()*n),1,1,r()<.5?"#b39868":"#d8c094");R(g,6,2,4,1,"#8a7048");R(g,4,8,8,1,"#a8905e");});
function texRadial(stops){const c=toile(64,64),g=c.getContext("2d"),gr=g.createRadialGradient(32,32,0,32,32,32);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
const TEX_HALO=()=>texRadial([[0,"rgba(255,255,255,1)"],[.25,"rgba(255,255,255,.45)"],[1,"rgba(255,255,255,0)"]]);
const TEX_OMBRE=()=>texRadial([[0,"rgba(0,0,0,.6)"],[.6,"rgba(0,0,0,.35)"],[1,"rgba(0,0,0,0)"]]);
const TEX_FUMEE=()=>texPix(8,(g)=>{R(g,2,1,4,6,"#fff");R(g,1,2,6,4,"#fff");R(g,2,2,2,1,"#ffffffaa");});
// ---------- l'entrepôt au soleil (lieu A de la maquette 4) ----------
const LIEU = { fond: 0x140e0a, brume: 0x1c140e, ciel: [0xffe6c0, 0x3a2414, .32], soleil: [0xfff0d0, .62], teinte: [1.06, 1, .9],
  sol: PEINT.planches({ c: ["#b07a48", "#a06c3e", "#bd8854"], f: "#5a3820", g: "#8e5e34", l: "#d39c62" }),
  solExt: PEINT.dalles({ c: ["#7a7064", "#857a6c", "#6e655a"], f: "#3e362e", g: "#5e564c", l: "#958a7a" }),
  mur: PEINT.briques({ c: ["#9a4a34", "#a85640", "#8a4030"], f: "#4a3428", g: "#6e2e20", l: "#c06a4e" }),
  dessus: PEINT.dessus({ c: ["#b8a890", "#a89a82", "#c4b69c"], f: "#6e6252", l: "#d8cab0" }),
  caisse: { f: "#6a4020", c: "#b07440", l: "#c88850", g: "#8a5a30" }, marque: "#f2c242", poussiere: 0xffe6b0 };
const VITESSE = { pas: 3.4, glisse: 6.5, tapis: 2.4 };

// quadrillage de cases (une case = un carré de 1, texture répétée par case), posé à plat à la hauteur y
function dalles(N, test, y) {
  const pos = [], uv = [], nor = [];
  for (let p = 0; p < N.w * N.h; p++) if (test(p)) {
    const x = p % N.w - .5, z = (p - p % N.w) / N.w - .5;
    pos.push(x, y, z, x, y, z + 1, x + 1, y, z + 1, x, y, z, x + 1, y, z + 1, x + 1, y, z);
    uv.push(0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1);
    for (let i = 0; i < 6; i++) nor.push(0, 1, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  return g;
}

function creer(can, ecoute) {
  ecoute = ecoute || {};
  const rendu = new THREE.WebGLRenderer({ canvas: can, antialias: false });
  rendu.shadowMap.enabled = true; rendu.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, .5, 90);
  scene.background = new THREE.Color(LIEU.fond); scene.fog = new THREE.Fog(LIEU.brume, 20, 40);
  // passe finale : flou en haut et en bas (tilt-shift), halo des zones claires, vignettage, teinte chaude
  const cible = new THREE.WebGLRenderTarget(4, 4);
  const passe = new THREE.ShaderMaterial({ uniforms: { t: { value: cible.texture }, res: { value: new THREE.Vector2(4, 4) }, teinte: { value: new THREE.Vector3(...LIEU.teinte) }, flou: { value: 1 } },
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: `uniform sampler2D t;uniform vec2 res;uniform vec3 teinte;uniform float flou;varying vec2 vUv;
      void main(){float f=abs(vUv.y-.5);float b=smoothstep(.17,.47,f)*2.6*flou;vec3 s=vec3(0.),h=vec3(0.);
        for(int i=-2;i<=2;i++)for(int j=-2;j<=2;j++){vec2 o=vec2(float(i),float(j));s+=texture2D(t,vUv+o*b/res*1.5).rgb;h+=max(texture2D(t,vUv+o*7./res).rgb-.72,0.);}
        s=s/25.+h/25.*1.4;s*=teinte;float v=length((vUv-.5)*vec2(1.,.75));s*=1.-smoothstep(.3,.8,v)*.6;gl_FragColor=vec4(s,1.);}`, depthTest: false, depthWrite: false });
  const scenePasse = new THREE.Scene(), camPasse = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scenePasse.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), passe));

  // lumières
  scene.add(new THREE.HemisphereLight(LIEU.ciel[0], LIEU.ciel[1], LIEU.ciel[2]));
  const soleil = new THREE.DirectionalLight(LIEU.soleil[0], LIEU.soleil[1]);
  soleil.castShadow = true; soleil.shadow.mapSize.set(1024, 1024); soleil.shadow.bias = -.002;
  scene.add(soleil, soleil.target);

  // textures (une fois)
  const T = { fonte: texFonte(), tapis: texTapis(), sol: texPix(16, LIEU.sol), ext: texPix(16, LIEU.solExt, [1, 1]), mur: texPix(16, LIEU.mur), dessus: texPix(16, LIEU.dessus), glace: texGlace(),
    marque: texMarque(LIEU.marque), caisse: texCaisse(LIEU.caisse), tonneau: texTonneau(), sac: texSac(), halo: TEX_HALO(), ombre: TEX_OMBRE(), fumee: TEX_FUMEE() };
  const mat = (t, o) => new THREE.MeshLambertMaterial(Object.assign({ map: t }, o || {}));
  const M = { sol: mat(T.sol), ext: mat(T.ext), mur: mat(T.mur), dessus: mat(T.dessus), glace: new THREE.MeshPhongMaterial({ map: T.glace, shininess: 40, specular: 0x2a3a4a }),
    marque: new THREE.MeshLambertMaterial({ map: T.marque, transparent: true, depthWrite: false, emissive: new THREE.Color(LIEU.marque), emissiveMap: T.marque, emissiveIntensity: .35 }),
    tonneau: mat(T.tonneau), sac: mat(T.sac), caisseDeco: mat(T.caisse) };

  // le docker : un panneau qui fait face à la caméra, avec son ombre ronde
  const IMG = MagDocker.images(), affiche = toile(MagDocker.LW, MagDocker.LH), ga = affiche.getContext("2d");
  const tPerso = new THREE.CanvasTexture(affiche); tPerso.magFilter = tPerso.minFilter = THREE.NearestFilter; tPerso.generateMipmaps = false;
  const gPerso = new THREE.PlaneGeometry(1.18, 1.62); gPerso.translate(0, .81, 0);
  const sprite = new THREE.Mesh(gPerso, new THREE.MeshLambertMaterial({ map: tPerso, alphaTest: .5, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tPerso, emissiveIntensity: .3 }));
  sprite.rotation.x = -.42; scene.add(sprite);
  const ombre = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), new THREE.MeshBasicMaterial({ map: T.ombre, transparent: true, depthWrite: false }));
  ombre.rotation.x = -Math.PI / 2; scene.add(ombre);

  let N = null, groupe = null, ent = [], dk = null, lampes = [], animes = [], parts = [], grains = null, cle = "", victoire = 0, effets = true, calme = false, inactif = true;

  function lampe(par, x, y, z, col, int, dist, taille, vac) {
    const l = new THREE.PointLight(col, int, dist, 2); l.position.set(x, y, z); par.add(l);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.halo, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .85 }));
    s.position.set(x, y, z); s.scale.setScalar(taille); par.add(s);
    lampes.push({ l, s, int, taille, vac, ph: x * 3.1 + z });
  }
  function bloc(x, z, w, h, d, m, y0 = 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y0 + h / 2, z); b.castShadow = b.receiveShadow = true; groupe.add(b); return b; }
  function tonneau(x, z, s = 1, y0 = 0) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.34 * s, .34 * s, .8 * s, 10), [M.tonneau, M.dessus, M.dessus]); m.position.set(x, y0 + .4 * s, z); m.castShadow = m.receiveShadow = true; groupe.add(m); }
  function sac(x, z) { const m = new THREE.Mesh(new THREE.SphereGeometry(.32, 8, 6), M.sac); m.scale.set(1, .62, .85); m.position.set(x, .2, z); m.castShadow = true; groupe.add(m); }
  function caisseDeco(x, y, z, s = .84, rot = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), M.caisseDeco); m.position.set(x, y + s / 2, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; groupe.add(m); }
  function blocGlace(x, z, s, rot) { const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * .8, s), new THREE.MeshPhongMaterial({ color: 0xbfe8f8, transparent: true, opacity: .82, shininess: 80, specular: 0x6688aa })); m.position.set(x, s * .4, z); m.rotation.y = rot; m.castShadow = true; groupe.add(m); }

  // construit le décor du niveau : sol, murs, glace, marques, caisses, et l'entrepôt autour
  function niveau(n, E, entrepot = 0, graine = 1) {
    if (groupe) { scene.remove(groupe); groupe.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    N = n; groupe = new THREE.Group(); scene.add(groupe); lampes = []; animes = []; parts.forEach(q => scene.remove(q.s)); parts = []; victoire = 0;
    const w = N.w, h = N.h, cx = (w - 1) / 2, rnd = alea(graine * 7919 + 13);
    T.ext.repeat.set(w + 20, h + 20);
    const ext = new THREE.Mesh(new THREE.PlaneGeometry(w + 20, h + 20), M.ext); ext.rotation.x = -Math.PI / 2; ext.position.set(cx, -.01, (h - 1) / 2); ext.receiveShadow = true; groupe.add(ext);
    const sol = new THREE.Mesh(dalles(N, p => N.dedans[p], 0), M.sol); sol.receiveShadow = true; groupe.add(sol);
    const gl = new THREE.Mesh(dalles(N, p => N.glace[p] && N.dedans[p], .008), M.glace); gl.receiveShadow = true; groupe.add(gl);
    groupe.add(new THREE.Mesh(dalles(N, p => N.marque[p], .016), M.marque));
    // tapis roulants : une bande par case, tournée dans le sens du tapis, avec ses deux rebords
    const mTapis = new THREE.MeshLambertMaterial({ map: T.tapis }), mRebord = new THREE.MeshLambertMaterial({ color: 0x6a6e78 }), ANGLE = { D: 0, G: Math.PI, H: Math.PI / 2, B: -Math.PI / 2 };
    for (let p = 0; p < w * h; p++) if (N.tapis[p]) {
      const g = new THREE.Group(); g.position.set(p % w, 0, (p - p % w) / w); g.rotation.y = ANGLE[N.tapis[p]]; groupe.add(g);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1, .86), mTapis); b.rotation.x = -Math.PI / 2; b.position.y = .02; b.receiveShadow = true; g.add(b);
      [-1, 1].forEach(sg => { const r = new THREE.Mesh(new THREE.BoxGeometry(1, .08, .07), mRebord); r.position.set(0, .04, sg * .465); r.castShadow = r.receiveShadow = true; g.add(r); });
    }
    animes.push(t => { T.tapis.offset.x = -(t * .8) % 1; });
    for (let p = 0; p < w * h; p++) if (N.mur[p]) {
      const x = p % w, y = (p - x) / w, bas = y > 0 && N.dedans[p - w], ht = bas ? .45 : 1.05;   // mur bas s'il cacherait une case derrière lui
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, ht, 1), [M.mur, M.mur, M.dessus, M.mur, M.mur, M.mur]); m.position.set(x, ht / 2, y); m.castShadow = m.receiveShadow = true; groupe.add(m);
    }
    // caisses
    ent = E.c.map(k => { const hh = k.l ? .7 : .84, m = new THREE.Mesh(new THREE.BoxGeometry(k.l ? .88 : .84, hh, k.l ? .88 : .84), new THREE.MeshLambertMaterial({ map: k.l ? T.fonte : T.caisse, emissive: 0x40ff80, emissiveIntensity: 0 }));
      m.castShadow = m.receiveShadow = true; groupe.add(m); const l = new THREE.PointLight(0x5cff9a, 0, 2.6, 2); groupe.add(l);
      return { m, l, p: k.p, x: k.p % w, y: (k.p - k.p % w) / w, file: [], ph: 0, flash: 0, lourde: k.l, h: hh / 2 }; });
    dk = { x: E.d % w, y: (E.d - E.d % w) / w, file: [], dx: 0, dy: -1, marche: 0, pousse: false, glisse: false, bump: -9, repos: 0 };
    // l'entrepôt autour : mur du fond à fenêtres, rayonnages, accessoires devant, suspensions, rayons, poussière
    const L2 = w + 12, mf = mat(texPix(16, LIEU.mur, [L2, 4]));
    bloc(cx, -3.2, L2, 4.5, .6, mf);
    for (let i = 0; i < Math.ceil(L2 / 3.5); i++) { const fx = cx - L2 / 2 + 1.5 + i * 3.5;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), new THREE.MeshBasicMaterial({ color: 0xfff2c8 })); f.position.set(fx, 2.8, -2.88); groupe.add(f);
      const b1 = new THREE.Mesh(new THREE.PlaneGeometry(.1, 1.8), new THREE.MeshBasicMaterial({ color: 0x3a2414 })); b1.position.set(fx, 2.8, -2.87); groupe.add(b1);
      const b2 = b1.clone(); b2.rotation.z = Math.PI / 2; b2.scale.set(1, .78, 1); groupe.add(b2); }
    const mEt = new THREE.MeshLambertMaterial({ color: 0x3a4a6a }), mPl = new THREE.MeshLambertMaterial({ color: 0xc06a30 });
    for (let x = cx - Math.floor(w / 2) - 1; x <= cx + Math.floor(w / 2) + 1; x += 3.3) {
      [-1, 1].forEach(s => bloc(x + s * 1.3, -1.6, .12, 2.6, .9, mEt)); [.05, 1.25, 2.45].forEach(y => bloc(x, -1.6, 2.7, .08, .95, mPl, y - .04));
      caisseDeco(x - .7, .1, -1.6, .7, rnd() * .3); caisseDeco(x + .5, 1.3, -1.6, .7, -rnd() * .3); tonneau(x + .7, -1.6, .85, .1); caisseDeco(x - .6, 1.3, -1.6, .6, .2); caisseDeco(x + .2, 2.5, -1.6, .55, rnd()); }
    const zf = h + .6;
    for (let x = cx - w / 2 - 1; x < cx + w / 2 + 1; x += 1.1 + rnd() * 1.4) { const r = rnd(), z = zf + rnd() * 1.4;
      if (entrepot === 1 && r < .45) blocGlace(x, z, .6 + rnd() * .3, rnd()); else if (r < .3) tonneau(x, z, .85 + rnd() * .2); else if (r < .55) sac(x, z); else if (r < .8) caisseDeco(x, 0, z, .7 + rnd() * .15, rnd()); }
    if (entrepot === 1) for (let i = 0; i < 4; i++) blocGlace(cx - w / 2 + rnd() * w, -1 - rnd() * .4, .5 + rnd() * .3, rnd());
    const tRayon = T.rayon || (T.rayon = new THREE.CanvasTexture((() => { const c = toile(4, 64), g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "rgba(255,236,190,.22)"); gr.addColorStop(1, "rgba(255,236,190,0)"); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); return c; })()));
    for (let i = 0; i < Math.max(2, Math.round(w / 2.5)); i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 9 + h * .3), new THREE.MeshBasicMaterial({ map: tRayon, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      r.position.set(cx - w / 2 + .6 + i * 3.5, 2.2, h * .2); r.rotation.set(-.75, 0, .5); groupe.add(r); animes.push(t => { r.material.opacity = .75 + .25 * Math.sin(t * .6 + i * 1.7); }); }
    [[w * .25 - .3, h * .2], [w * .72, h * .26]].forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 7.6, z); groupe.add(g);
      const fil = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 3.6, 4), new THREE.MeshBasicMaterial({ color: 0x111111 })); fil.position.y = -1.8; g.add(fil);
      const ab = new THREE.Mesh(new THREE.ConeGeometry(.32, .26, 10, 1, true), new THREE.MeshLambertMaterial({ color: 0x2e4a3a, side: THREE.DoubleSide })); ab.position.y = -3.65; g.add(ab);
      lampe(g, 0, -3.85, 0, 0xffc87a, 1.1, 7, 1.2, .04); animes.push(t => { g.rotation.z = Math.sin(t * .8 + x) * .07; g.rotation.x = Math.cos(t * .6 + z) * .05; }); });
    grains = poussiere(Math.round(50 + w * h), entrepot === 1 ? 0xe8f4ff : LIEU.poussiere, .045, [-1.5, w + .5], [0, 3.5], [-2, h + 1]);
    soleil.position.set(cx - 5, 11, (h - 1) / 2 + 2); soleil.target.position.set(cx, 0, (h - 1) / 2);
    Object.assign(soleil.shadow.camera, { left: -w - 3, right: w + 3, top: h + 3, bottom: -h - 3, near: 1, far: 40 }); soleil.shadow.camera.updateProjectionMatrix();
    poser(E); taille = "";
  }
  function poussiere(n, col, t, [x0, x1], [y0, y1], [z0, z1]) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), ph = [];
    for (let i = 0; i < n; i++) { pos[i * 3] = x0 + Math.random() * (x1 - x0); pos[i * 3 + 1] = y0 + Math.random() * (y1 - y0); pos[i * 3 + 2] = z0 + Math.random() * (z1 - z0); ph.push(Math.random() * 9); }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: col, size: t, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false })); groupe.add(pts);
    return { pts, pos, ph, n };
  }

  // place tout instantanément (annulation, recommencer)
  function poser(E) {
    const w = N.w; dk.x = E.d % w; dk.y = (E.d - dk.x) / w; dk.file = []; dk.pousse = dk.glisse = false; victoire = 0;
    E.c.forEach((k, i) => { const e = ent[i]; e.p = k.p; e.x = k.p % w; e.y = (k.p - e.x) / w; e.file = []; e.flash = 0; });
    inactif = true;
  }
  // joue les déplacements d'un coup (résultat de magCoup) ; dir : 'H', 'B', 'G' ou 'D'
  function coup(r, dir) {
    const [dx, dy] = MAG_DIRS[dir], w = N.w; dk.dx = dx; dk.dy = dy; dk.repos = 0; dk.pousse = r.pousse >= 0;
    r.mvt.forEach(m => { const e = m.qui < 0 ? dk : ent[m.qui]; e.file.push({ x: m.a % w, y: (m.a - m.a % w) / w, v: m.glisse ? VITESSE.glisse : m.tapis ? VITESSE.tapis : VITESSE.pas, glisse: !!m.glisse, tapis: !!m.tapis }); });
    r.E.c.forEach((k, i) => { ent[i].p = k.p; });
    inactif = false;
    if (ecoute.son) { ecoute.son(dk.pousse ? "pousse" : "pas"); if (r.mvt.some(m => m.glisse)) ecoute.son("glisse", .12); if (r.mvt.some(m => m.tapis)) ecoute.son("tapis", .3); }
  }
  function bute(dir) { const [dx, dy] = MAG_DIRS[dir]; dk.dx = dx; dk.dy = dy; dk.repos = 0; dk.bump = performance.now() / 1000; if (ecoute.son) ecoute.son("mur"); }
  const bouge = e => e.file.length > 0;
  const occupe = () => !!dk && (bouge(dk) || ent.some(bouge));
  function avance(e, dt) {
    const f = e.file[0]; if (!f) return 0;
    if (f.tapis && bouge(dk)) return 0;                       // les tapis attendent que le docker ait fini son pas
    const ddx = f.x - e.x, ddy = f.y - e.y, d = Math.hypot(ddx, ddy), s = Math.min(d, f.v * dt);
    if (d > 1e-4) { e.x += ddx / d * s; e.y += ddy / d * s; }
    if (d - s < 1e-4) { e.x = f.x; e.y = f.y; e.file.shift(); }
    e.glisse = f.glisse;
    return s;
  }
  function particule(x, y, z, o) {
    if (!effets && !o.conf && Math.random() < .6) return;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: o.halo ? T.halo : T.fumee, color: o.col, transparent: true, depthWrite: false, blending: o.halo ? THREE.AdditiveBlending : THREE.NormalBlending }));
    s.position.set(x, y, z); s.scale.setScalar(o.t); scene.add(s); parts.push(Object.assign({ s, v: 1, vx: 0, vy: 0, vz: 0, g: 0, dv: 1.4, gr: 1 }, o));
  }
  function gagne() {
    victoire = performance.now() / 1000; const cols = [0xf5c542, 0xff7a3a, 0x5ccf8a, 0x4b9be8, 0xe85a8a, 0xffffff];
    for (let n = 0; n < 60; n++) particule(dk.x + (Math.random() - .5) * 3, 2.5 + Math.random() * 1.5, dk.y + (Math.random() - .5) * 2, { col: cols[n % 6], t: .09, vy: -.4, vx: (Math.random() - .5) * .6, vz: (Math.random() - .5) * .4, g: -1.2, dv: .4, conf: true });
    if (ecoute.son) ecoute.son("victoire");
  }

  function maj(t, dt) {
    if (!N) return;
    const etaitOccupe = occupe(), surGlace = e => N.glace[Math.round(e.y) * N.w + Math.round(e.x)];
    const s = avance(dk, dt); if (s > 0 && !dk.glisse) dk.marche += s * 4;
    if (dk.glisse && s > 0 && Math.random() < .5) particule(dk.x + (Math.random() - .5) * .3, .05, dk.y + .1, { col: 0xffffff, t: .08, halo: true, vy: .6, dv: 2.5 });
    ent.forEach((c, i) => {
      const ex = c.x, ey = c.y, av = bouge(c), s = avance(c, dt), M2 = c.m;
      if (s > 0) { c.ph += s * 11; const dx = Math.sign(c.x - ex), dy = Math.sign(c.y - ey);
        if (surGlace(c)) { if (Math.random() < .6) particule(c.x - dx * .4 + (Math.random() - .5) * .6 * Math.abs(dy), .04, c.y - dy * .4 + (Math.random() - .5) * .6 * Math.abs(dx), { col: 0xdff6ff, t: .07, halo: true, vy: .8, vx: -dx * .5, vz: -dy * .5, dv: 2.2 }); }
        else if (Math.random() < .7) { const sg = Math.random() < .5 ? -1 : 1; particule(c.x - dx * .42 + sg * .38 * Math.abs(dy), .08, c.y - dy * .42 + sg * .38 * Math.abs(dx), { col: LIEU.poussiere, t: .16, vx: -dx * .4 + sg * Math.abs(dy) * .3, vy: .35, vz: -dy * .4 + sg * Math.abs(dx) * .3, dv: 1.3, gr: 2.2 }); } }
      else if (av && !bouge(c) && N.marque[c.p]) {
        for (let n = 0; n < 14; n++) { const a = n / 14 * Math.PI * 2; particule(c.x + Math.cos(a) * .45, .3, c.y + Math.sin(a) * .45, { col: 0x7cffb0, t: .12, halo: true, vx: Math.cos(a) * .9, vy: 1.2 + Math.random(), vz: Math.sin(a) * .9, g: -3, dv: 1.4 }); }
        c.flash = t; if (ecoute.son) ecoute.son("marque"); }
      const ok = N.marque[c.p] && !bouge(c), tang = bouge(c) && !surGlace(c) && !c.file[0].tapis ? Math.sin(c.ph) * .06 : 0;
      M2.position.set(c.x, c.h + Math.abs(tang) * .15, c.y); M2.rotation.set(0, 0, 0); if (Math.abs(c.x - Math.round(c.x)) > .01) M2.rotation.z = tang; else M2.rotation.x = tang;
      const fl = c.flash ? Math.max(0, 1 - (t - c.flash) / .6) : 0;
      M2.material.emissiveIntensity = ok ? .22 + .1 * Math.sin(t * 3 + i) + fl * .6 : 0; c.l.intensity = ok ? 1.2 + .3 * Math.sin(t * 3 + i) + fl * 2 : 0; c.l.position.set(c.x, 1, c.y);
    });
    if (!bouge(dk)) dk.pousse = dk.pousse && ent.some(bouge);
    if (!occupe()) dk.repos += dt;
    if (etaitOccupe && !occupe() && ecoute.fini) ecoute.fini();
    // image du docker
    let dir = dk.dy > 0 ? "b" : dk.dy < 0 ? "h" : dk.dx > 0 ? "d" : "g";
    if (dk.repos > 3 && Math.floor(dk.repos / 2.5) % 2 === 1) dir = "b";
    const pose = dk.pousse ? "p" : dk.glisse && bouge(dk) ? "s" : "n", fr = bouge(dk) && !dk.glisse ? Math.floor(dk.marche) % 4 : (dk.pousse && occupe() ? Math.floor(t * 6) % 4 : 0);
    let nc = dir + pose + fr;
    if (victoire) nc = Math.floor((t - victoire) * 4) % 2 ? "bv0" : "bn0"; else if (!occupe() && dir !== "h" && t % 3.4 < .14) nc = dir + "k0";
    if (nc !== cle) { cle = nc; ga.clearRect(0, 0, MagDocker.LW, MagDocker.LH); ga.drawImage(IMG[nc], 0, 0); tPerso.needsUpdate = true; }
    const b = Math.max(0, 1 - (t - dk.bump) / .22), bx = dk.dx * Math.sin(b * Math.PI) * .12, bz = dk.dy * Math.sin(b * Math.PI) * .12;
    let saut = 0; if (victoire) { const e = t - victoire; saut = Math.abs(Math.sin(e * 6)) * .35 * Math.max(0, 1 - e / 2.5); }
    sprite.position.set(dk.x + bx, saut, dk.y + bz - .05); sprite.scale.set(1, 1 + (occupe() ? 0 : Math.sin(t * 2.6) * .02), 1);
    ombre.position.set(dk.x + bx, .02, dk.y + bz); ombre.scale.setScalar(1 - saut * .6);
    // particules, lampes, décor animé, poussière
    parts.forEach(q => { q.s.position.x += q.vx * dt; q.s.position.y += q.vy * dt; q.s.position.z += q.vz * dt; q.vy += q.g * dt; q.v -= dt * q.dv; q.s.material.opacity = Math.min(1, q.v * 1.5);
      if (q.gr !== 1) q.s.scale.setScalar(q.t * (1 + (1 - q.v) * q.gr)); if (q.conf) q.s.material.rotation += dt * 8; if (q.v <= 0) { scene.remove(q.s); q.s.material.dispose(); } });
    parts = parts.filter(q => q.v > 0);
    lampes.forEach(o => { const v = 1 + Math.sin(t * 9 + o.ph) * o.vac * .5 + Math.sin(t * 23 + o.ph * 2) * o.vac * .5; o.l.intensity = o.int * v; o.s.scale.setScalar(o.taille * (.92 + .08 * v)); });
    animes.forEach(f => f(t));
    if (grains) { for (let i = 0; i < grains.n; i++) { const j = i * 3; grains.pos[j] += Math.sin(t * .3 + grains.ph[i]) * dt * .06; grains.pos[j + 1] += Math.cos(t * .25 + grains.ph[i]) * dt * .05; }
      grains.pts.geometry.attributes.position.needsUpdate = true; grains.pts.material.opacity = .6 + .2 * Math.sin(t * .7); }
  }

  // cadrage : le plateau tient en largeur et en hauteur ; caméra penchée à 54°
  let taille = "";
  function cadre() {
    const r = can.getBoundingClientRect(), d = Math.min(effets ? 2 : 1.5, devicePixelRatio || 1), w = Math.round(r.width), h = Math.round(r.height);
    if (!w || !h || !N) return false;
    if (taille !== w + "x" + h + "x" + d) {
      taille = w + "x" + h + "x" + d; rendu.setPixelRatio(d); rendu.setSize(w, h, false); cible.setSize(w * d, h * d); passe.uniforms.res.value.set(w * d, h * d);
      cam.aspect = w / h; const el = THREE.MathUtils.degToRad(54), tv = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), th = tv * cam.aspect;
      const dist = Math.max((N.w / 2 + .45) / th, ((N.h / 2 + .5) * Math.sin(el) + .6) / tv);
      const cx = (N.w - 1) / 2, cz = (N.h - 1) / 2 + .15;
      cam.position.set(cx, .2 + Math.sin(el) * dist, cz + Math.cos(el) * dist); cam.lookAt(cx, .2, cz); cam.updateProjectionMatrix();
      scene.fog.near = dist - 3; scene.fog.far = dist + 16;
    }
    return true;
  }
  let prec = performance.now() / 1000, image = 0;
  function boucle(now) {
    requestAnimationFrame(boucle);
    if (document.hidden) return;
    if (calme && inactif && image++ % 3) return;            // menus : une image sur trois
    const t = now / 1000, dt = Math.min(.05, t - prec); prec = t;
    if (!cadre()) return;
    maj(t, dt);
    if (effets) { rendu.setRenderTarget(cible); rendu.render(scene, cam); rendu.setRenderTarget(null); rendu.render(scenePasse, camPasse); }
    else rendu.render(scene, cam);
    if (!occupe() && !parts.length) inactif = true;
  }
  requestAnimationFrame(boucle);
  function reglerEffets(v) {
    effets = !!v; rendu.shadowMap.enabled = effets; soleil.castShadow = effets; taille = "";
    scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => { m.needsUpdate = true; }); });
  }
  return { niveau, poser, coup, bute, occupe, gagne, effets: reglerEffets, calme: v => { calme = !!v; }, flou: v => { passe.uniforms.flou.value = v; } };
}

return { creer };
})();
