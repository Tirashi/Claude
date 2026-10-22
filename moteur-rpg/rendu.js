/* Moteur RPG — dessin en HD-2D avec Three.js (navigateur).
   Le sol est une grande image faite des tuiles ; arbres, statues, objets et personnages sont des panneaux
   debout qui projettent leur ombre ; murs et maisons sont des blocs. Un petit effet final (shader maison)
   floute le haut et le bas de l'image (profondeur de champ), ajoute une lueur et un vignettage.
   Une case = 1 unité ; la case (x, y) a son centre en (x + 0,5 ; 0 ; y + 0,5).

   style (données du jeu) :
     sols:    { nom: { tuiles: […], semis: { tuiles: […], sur: 7 } } ou { bordure: { centre, n, s, e, w, ne, nw, se, sw } } }
     decors:  { nom: { type: 'panneau', tuiles: […], taille } | { type: 'bloc', tuile, hauteur }
              | { type: 'meuble', pieces: [{ boite: [l, h, p] | cylindre: [rayon, h], pos: [x, y, z], dessus, face, cote }] } | { type: 'plat', tuiles: […] } }
     objets:  { type: { tuile, tuileOuverte, taille, lumiere: { couleur, intensite, portee, hauteur } } | { pieces: [… comme un meuble] } }
     ornements: { type: { tuile, l, h, haut, sol, brille, lumiere } }   tapis et décorations murales (carte.ornements)
     exterieur: { sol: [tuiles], decor: 'arbre' }   sol et arbres autour des cartes d'extérieur */
(function (M) {
  const FRAG = `
uniform sampler2D t;uniform vec2 res;uniform float foyer,bande,flou;varying vec2 v;
void main(){
  float d=max(0.,abs(v.y-foyer)-bande);float r=clamp(d*3.2,0.,1.)*flou;
  vec3 c=vec3(0.);vec3 b=vec3(0.);
  for(int i=0;i<16;i++){
    float a=float(i)*2.39996;float rr=sqrt((float(i)+.5)/16.);vec2 o=vec2(cos(a),sin(a))*rr;
    c+=texture2D(t,v+o*r/res).rgb;
    b+=max(texture2D(t,v+o*12./res).rgb-.8,0.);
  }
  c/=16.;b/=16.;
  if(r<.05)c=texture2D(t,v).rgb;
  c+=b*1.2;c=mix(vec3(dot(c,vec3(.3,.59,.11))),c,.88);
  c=mix(c,c*vec3(1.06,1.01,.9),.6);
  c*=mix(.72,1.,smoothstep(.95,.4,length(v-.5)));
  gl_FragColor=vec4(c,1.);
}`;
  const hasard = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

  function Rendu(canvas, poupees, style) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const rt = new THREE.WebGLRenderTarget(4, 4);
    const post = new THREE.ShaderMaterial({
      uniforms: { t: { value: rt.texture }, res: { value: new THREE.Vector2(4, 4) }, foyer: { value: .5 }, bande: { value: .2 }, flou: { value: 8 } },
      vertexShader: 'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: FRAG, depthTest: false
    });
    const scPost = new THREE.Scene(); scPost.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
    const camPost = new THREE.Camera();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 90);
    const textures = {};
    let scene = null, carte = null, soleil = null, w0 = 0, h0 = 0;
    let acteurs = new Map(), objets = new Map(), vacillent = [], alternent = [], eau = null, brumes = [], interieur = false;
    let masquables = [];   // maisons et arbres qui deviennent transparents quand ils cachent l'équipe
    const cible = new THREE.Vector3(), voulue = new THREE.Vector3();

    function net(t) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; }
    // grandes images vues de loin (sol) : pixels nets de près, mais adoucies au loin pour éviter le moiré
    // (taille en puissance de deux, sinon pas de mipmaps en WebGL 1)
    // (l'image est posée telle quelle dans une toile en puissance de deux : l'étirer dédoublerait des rangées de pixels)
    function lointain(cv, plein) {
      const p2 = n => 2 ** Math.ceil(Math.log2(n));
      let c = cv;
      if (cv.width !== p2(cv.width) || cv.height !== p2(cv.height)) {
        c = document.createElement('canvas'); c.width = p2(cv.width); c.height = p2(cv.height);
        c.getContext('2d').drawImage(cv, 0, 0);
      }
      const t = new THREE.CanvasTexture(c);
      if (c !== cv && !plein) { t.repeat.set(cv.width / c.width, cv.height / c.height); t.offset.set(0, 1 - cv.height / c.height); }
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
      t.anisotropy = r.capabilities.getMaxAnisotropy(); t.needsUpdate = true;
      return t;
    }
    function tex(nom) {
      if (textures[nom]) return textures[nom];
      const c = poupees.decoupe(nom);
      if (!c) throw new Error('tuile inconnue : ' + nom);
      return (textures[nom] = net(new THREE.CanvasTexture(c)));
    }
    // panneau debout, pivot en bas au centre, qui projette une ombre selon sa transparence
    function panneau(texture, w, h) {
      const geo = new THREE.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
      const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: texture, alphaTest: .5, side: THREE.DoubleSide }));
      m.castShadow = true;
      m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: texture, alphaTest: .5 });
      return m;
    }
    const choisir = (liste, x, y) => liste[hasard(x, y) % liste.length];

    // l'image du sol : une tuile par case (bordures des chemins, fleurs semées, décors à plat)
    function imageDuSol() {
      const cv = document.createElement('canvas'); cv.width = carte.l * 32; cv.height = carte.h * 32;
      const g = cv.getContext('2d');
      const solEn = (x, y) => (x < 0 || y < 0 || x >= carte.l || y >= carte.h) ? null : carte.cases[y][x].sol;
      for (let y = 0; y < carte.h; y++) for (let x = 0; x < carte.l; x++) {
        const c = carte.cases[y][x], s = style.sols[c.sol];
        if (!s) continue;
        const X = x * 32, Y = y * 32;
        if (s.dessous) g.drawImage(poupees.decoupe(choisir(style.sols[s.dessous].tuiles, x, y)), X, Y);
        if (s.bordure) {
          const b = s.bordure, meme = (a, bb) => { const v = solEn(a, bb); return v === c.sol || (s.avec || []).includes(v) || v === null; };
          const n = !meme(x, y - 1), so = !meme(x, y + 1), e = !meme(x + 1, y), o = !meme(x - 1, y);
          let k = b.centre;
          if (n && o) k = b.nw; else if (n && e) k = b.ne; else if (so && o) k = b.sw; else if (so && e) k = b.se;
          else if (n) k = b.n; else if (so) k = b.s; else if (e) k = b.e; else if (o) k = b.w;
          g.drawImage(poupees.decoupe(k), X, Y);
        } else g.drawImage(poupees.decoupe(choisir(s.tuiles, x, y)), X, Y);
        if (s.semis && hasard(x + 7, y + 3) % s.semis.sur === 0) g.drawImage(poupees.decoupe(choisir(s.semis.tuiles, x + 1, y)), X, Y);
        const d = c.decor && style.decors[c.decor];
        if (d && d.type === 'plat') g.drawImage(poupees.decoupe(choisir(d.tuiles, x, y)), X, Y);
      }
      return cv;
    }

    function lumieres(sombre) {
      scene.add(new THREE.HemisphereLight(0xe4f0ff, 0x5a6a35, sombre ? .32 : .55));
      if (sombre) scene.add(new THREE.AmbientLight(0xffd9a0, .22));
      soleil = new THREE.DirectionalLight(0xfff0d0, sombre ? .35 : .85);
      soleil.castShadow = true; soleil.shadow.mapSize.set(2048, 2048); soleil.shadow.bias = -.0004; soleil.shadow.normalBias = .03;
      Object.assign(soleil.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
      scene.add(soleil, soleil.target);
    }

    function maison(m) {
      const mur = tex(m.mur || 'mur_brique').clone(); mur.needsUpdate = true;
      mur.wrapS = mur.wrapT = THREE.RepeatWrapping; mur.repeat.set(m.l, m.h || 1.4);
      const hm = m.h || 1.4;
      const mats = [];
      const bloc = new THREE.Mesh(new THREE.BoxGeometry(m.l, hm, m.p), new THREE.MeshLambertMaterial({ map: mur }));
      mats.push(bloc.material);
      bloc.position.set(m.x + m.l / 2, hm / 2, m.y + m.p / 2); bloc.castShadow = bloc.receiveShadow = true; scene.add(bloc);
      const tt = tex(m.toit || 'toit').clone(); tt.needsUpdate = true; tt.wrapS = tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(m.l + .4, 2);
      const montee = .9, pente = Math.hypot(m.p / 2 + .15, montee);
      for (const sgn of [-1, 1]) {
        const pan = new THREE.Mesh(new THREE.PlaneGeometry(m.l + .4, pente), new THREE.MeshLambertMaterial({ map: tt, side: THREE.DoubleSide }));
        pan.position.set(m.x + m.l / 2, hm + montee / 2, m.y + m.p / 2 + sgn * (m.p / 4 + .04));
        pan.rotation.x = -sgn * (Math.PI / 2 - Math.atan2(montee, m.p / 2 + .15));
        pan.castShadow = pan.receiveShadow = true; scene.add(pan); mats.push(pan.material);
      }
      const pignon = new THREE.Shape(); pignon.moveTo(-m.p / 2, 0); pignon.lineTo(m.p / 2, 0); pignon.lineTo(0, montee); pignon.lineTo(-m.p / 2, 0);
      for (const x of [m.x, m.x + m.l]) {
        const p = new THREE.Mesh(new THREE.ShapeGeometry(pignon), new THREE.MeshLambertMaterial({ color: 0x8a6a4a, side: THREE.DoubleSide }));
        p.rotation.y = Math.PI / 2; p.position.set(x, hm, m.y + m.p / 2); scene.add(p); mats.push(p.material);
      }
      if (m.porte !== undefined) {
        const porte = new THREE.Mesh(new THREE.PlaneGeometry(.9, .95), new THREE.MeshLambertMaterial({ map: tex('porte'), alphaTest: .5 }));
        porte.position.set(m.x + m.porte + .5, .48, m.y + m.p + .01); scene.add(porte); mats.push(porte.material);
      }
      for (const f of m.fenetres || []) {
        const v = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), new THREE.MeshLambertMaterial({ map: tex('fenetre_ext'), alphaTest: .5 }));
        v.position.set(m.x + f + .5, .78, m.y + m.p + .012); scene.add(v); mats.push(v.material);
      }
      masquable(mats, m.x, m.x + m.l, m.y, m.y + m.p, hm + .9);
    }

    function objet(o) {
      const s = style.objets[o.type] || {};
      const lum = o.lumiere || s.lumiere;
      if (lum) flamme(lum, o.x + .5, o.y + .8);
      if (s.pieces) {   // objet en volume (coffre, panneau) : les pièces marquées si: 'ouvert' / 'ferme' changent à l'ouverture
        const pieces = meuble(s, o.x, o.y); objets.set(o, { pieces, s });
        for (const p of pieces) if (p.si === 'ouvert') p.m.visible = false;
        return;
      }
      const nom = o.tuile || s.tuile;
      if (!nom) return;
      const m = panneau(tex(nom), s.taille || 1, s.taille || 1);
      m.position.set(o.x + .5, 0, o.y + .5); scene.add(m);
      objets.set(o, { m, s });
    }

    function brume(force) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const d = g.createRadialGradient(32, 32, 0, 32, 32, 32); d.addColorStop(0, 'rgba(235,240,248,1)'); d.addColorStop(1, 'rgba(235,240,248,0)');
      g.fillStyle = d; g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c);
      const n = Math.round(10 + force * 30);
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(4 + Math.random() * 3, 1.6 + Math.random()), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: .18 + force * .25 }));
        m.position.set(Math.random() * carte.l, .4 + Math.random() * .8, Math.random() * carte.h);
        scene.add(m); brumes.push({ m, v: (.1 + Math.random() * .25) * (Math.random() < .5 ? -1 : 1) });
      }
    }

    // construit la scène d'une carte préparée par Monde.preparer
    function chargerCarte(c) {
      carte = c; const def = c.def; allumees.clear();
      interieur = !def.exterieur;
      acteurs = new Map(); objets = new Map(); vacillent = []; alternent = []; brumes = []; masquables = [];
      scene = new THREE.Scene();
      const ciel = new THREE.Color(def.ciel !== undefined ? def.ciel : (interieur ? 0x0c0a08 : 0xa9d1ee));
      scene.background = ciel;
      const brumeForce = def.brume || 0;
      if (!interieur) scene.fog = new THREE.Fog(brumeForce ? 0xd6dde6 : ciel, brumeForce ? 14 : 22, brumeForce ? 34 - brumeForce * 10 : 48);
      lumieres(interieur);
      // sol de la carte, et autour (dehors) un grand pré
      const solMat = new THREE.MeshPhongMaterial({ map: lointain(imageDuSol()), shininess: 0, specular: 0 });
      const sol = new THREE.Mesh(new THREE.PlaneGeometry(c.l, c.h), solMat);
      sol.rotation.x = -Math.PI / 2; sol.position.set(c.l / 2, 0, c.h / 2); sol.receiveShadow = true; scene.add(sol);
      if (!interieur && style.exterieur) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
        for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g.drawImage(poupees.decoupe(choisir(style.exterieur.sol, x + 50, y)), x * 32, y * 32);
        const t = lointain(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(15, 15);
        const autour = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshPhongMaterial({ map: t, shininess: 0, specular: 0 }));
        autour.rotation.x = -Math.PI / 2; autour.position.set(c.l / 2, -.08, c.h / 2);   // assez bas pour ne pas se battre avec le sol (rayures) autour.receiveShadow = true; scene.add(autour);
        const d = style.decors[style.exterieur.decor];
        for (let y = -5; y < c.h + 5; y++) for (let x = -5; x < c.l + 5; x++) {
          if (x >= 0 && y >= 0 && x < c.l && y < c.h) continue;
          if (hasard(x + 99, y) % 3 === 0) continue;
          const a = panneau(tex(choisir(d.tuiles, x, y)), d.taille, d.taille); a.position.set(x + .5 + (hasard(x, y) % 5 - 2) * .06, 0, y + .5); scene.add(a);
        }
      }
      // décors debout et blocs
      const textureEau = [];
      for (let y = 0; y < c.h; y++) for (let x = 0; x < c.l; x++) {
        const k = c.cases[y][x], d = k.decor && style.decors[k.decor];
        if (style.sols[k.sol] && style.sols[k.sol].eau) textureEau.push([x, y]);
        if (!d) continue;
        if (d.type === 'panneau') {
          const tuile = choisir(d.tuiles, x, y), a = panneau(tex(tuile), d.taille, d.taille);
          a.position.set(x + .5 + (d.taille > 1.2 ? (hasard(x, y) % 5 - 2) * .05 : 0), 0, y + .5); scene.add(a);
          if (d.taille > 1.2) masquable([a.material], x - .1, x + 1.1, y + .5, y + .5, d.taille);
          if (d.alterne) alternent.push({ a, tuiles: d.alterne.map(tex) });
        } else if (d.type === 'meuble') meuble(d, x, y);
        else if (d.type === 'bloc') {
          const t = tex(d.tuile), hb = d.hauteur || 1.2;
          const b = new THREE.Mesh(new THREE.BoxGeometry(1, hb, 1), new THREE.MeshLambertMaterial({ map: t }));
          b.position.set(x + .5, hb / 2, y + .5); b.castShadow = b.receiveShadow = true; scene.add(b);
        }
      }
      if (textureEau.length) {
        eau = new THREE.MeshPhongMaterial({ color: 0x5aa0d0, transparent: true, opacity: .35, shininess: 90, specular: 0xffffff });
        for (const [x, y] of textureEau) { const e = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), eau); e.rotation.x = -Math.PI / 2; e.position.set(x + .5, .02, y + .5); scene.add(e); }
      } else eau = null;
      for (const m of def.maisons || []) maison(m);
      for (const o of def.objets || []) objet(o);
      for (const o of def.ornements || []) ornement(o);
      if (brumeForce) brume(brumeForce);
      if (interieur) { const p = new THREE.PointLight(0xffc880, .9, Math.max(c.l, c.h) * 1.2, 1.2); p.position.set(c.l / 2, 2.4, c.h / 2 + 1); scene.add(p); }
    }

    // un meuble en volume (lit, table, tonneau) : des boîtes et des cylindres texturés, face par face
    // pièce : { boite: [l, h, p] | cylindre: [rayon, h], pos: [x, y, z], rot: [rx, ry, rz], dessus, face, cote,
    //          si: 'ouvert' | 'ferme' (pour un coffre) } ; d.lumiere : une flamme qui vacille (cheminée)
    function meuble(d, x, y) {
      const mat = n => new THREE.MeshLambertMaterial({ map: tex(n) }), faites = [];
      for (const p of d.pieces) {
        const [px, py, pz] = p.pos || [0, 0, 0], dessus = mat(p.dessus || p.face), face = mat(p.face), cote = mat(p.cote || p.face);
        let m, h;
        if (p.cylindre) { h = p.cylindre[1]; m = new THREE.Mesh(new THREE.CylinderGeometry(p.cylindre[0], p.cylindre[0], h, 14), [face, dessus, dessus]); }
        else { h = p.boite[1]; m = new THREE.Mesh(new THREE.BoxGeometry(p.boite[0], h, p.boite[2]), [cote, cote, dessus, dessus, face, face]); }
        m.position.set(x + .5 + px, py + h / 2, y + .5 + pz); m.castShadow = m.receiveShadow = true;
        if (p.rot) m.rotation.set(p.rot[0], p.rot[1] || 0, p.rot[2] || 0);
        scene.add(m); faites.push({ m, si: p.si });
      }
      if (d.lumiere) flamme(d.lumiere, x + .5, y + .8);
      return faites;
    }
    function flamme(lum, x, z) {
      const p = new THREE.PointLight(lum.couleur, lum.intensite, lum.portee, 1.5);
      p.position.set(x, lum.hauteur || .9, z); scene.add(p);
      vacillent.push({ p, base: lum.intensite, dec: Math.random() * 9 });
    }

    // ornements d'une carte : tapis posés au sol, décorations accrochées au mur du fond (fenêtre, tapisserie, torche…)
    // style.ornements[type] = { tuile, l, h, haut (hauteur du bas de l'image), sol: true, brille: true, lumiere }
    // carte : ornements: [{ type, x, y, l, h }] ; au mur, (x, y) est la case du mur, l'ornement est posé sur sa face avant
    function ornement(o) {
      const s = (style.ornements || {})[o.type]; if (!s) return;
      const l = o.l || s.l || 1, h = o.h || s.h || 1;
      const mat = new THREE.MeshLambertMaterial({ map: tex(o.tuile || s.tuile), transparent: true, alphaTest: .5 });
      if (s.brille) { mat.emissive = new THREE.Color(0xffffff); mat.emissiveMap = mat.map; mat.emissiveIntensity = .35; }
      const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), mat);
      if (s.sol) { m.rotation.x = -Math.PI / 2; m.position.set(o.x + l / 2, .012, o.y + h / 2); m.receiveShadow = true; }
      else m.position.set(o.x + .5 + (l > 1 ? (l - 1) / 2 : 0), (s.haut || .6) + h / 2, o.y + 1.012);
      scene.add(m);
      if (s.lumiere) flamme(s.lumiere, o.x + .5, o.y + 1.3);
    }

    // ce qui peut cacher l'équipe : de x0 à x1, de l'arrière (zb) à l'avant (zf), hauteur h
    function masquable(mats, x0, x1, zb, zf, h) {
      for (const m of mats) { m.transparent = true; m.needsUpdate = true; }
      masquables.push({ mats, x0, x1, zb, zf, h, a: 1 });
    }

    // une lanterne qu'on vient d'allumer (style.objets[type].allumee)
    const allumees = new Set();
    function allumer(o) {
      const s = style.objets[o.type] || {}, lum = s.allumee;
      if (!lum || allumees.has(o)) return;
      allumees.add(o);
      const p = new THREE.PointLight(lum.couleur, lum.intensite, lum.portee, 1.5);
      p.position.set(o.x + .5, lum.hauteur || .9, o.y + .8); scene.add(p);
      vacillent.push({ p, base: lum.intensite, dec: Math.random() * 9 });
    }

    // un coffre ouvert change d'image
    // un objet qui change : coffre ouvert, levier baissé (tuileOuverte), grille ou nappe disparue (cacheOuvert)
    function majObjet(o, ouvert) {
      const x = objets.get(o); if (!x) return;
      if (x.pieces) { for (const p of x.pieces) p.m.visible = x.s.cacheOuvert ? !ouvert : p.si === 'ouvert' ? !!ouvert : p.si === 'ferme' ? !ouvert : true; return; }
      if (x.s.cacheOuvert) { x.m.visible = !ouvert; return; }
      if (!x.s.tuileOuverte) return;
      const t = tex(ouvert ? x.s.tuileOuverte : (o.tuile || x.s.tuile));
      x.m.material.map = t; x.m.customDepthMaterial.map = t; x.m.material.needsUpdate = true;
    }

    // personnages : un petit canevas animé par Poupees.dessiner, posé sur un panneau
    function acteur(id, perso, opts = {}) {
      const cv = document.createElement('canvas'); cv.width = M.Poupees.L; cv.height = M.Poupees.H;
      const t = net(new THREE.CanvasTexture(cv));
      const m = panneau(t, 2, 1.5);
      if (opts.taille) m.scale.set(opts.taille, opts.taille, 1);
      scene.add(m);
      const a = { id, cv, t, m, p: poupees.perso(perso), etat: 'repos', q: 0, sens: 1 };
      if (opts.aura) a.p.aura = opts.aura;
      acteurs.set(id, a);
      return a;
    }
    function placer(id, x, y, etat = 'repos', q = 0, sens) {
      const a = acteurs.get(id); if (!a) return;
      a.m.position.set(x + .5, 0, y + .5 + .001 * (a.ordre || 0)); a.etat = etat; a.q = q;
      if (sens) a.sens = sens;
    }
    function retirer(id) { const a = acteurs.get(id); if (a) { scene.remove(a.m); acteurs.delete(id); } }
    function montrer(id, oui) { const a = acteurs.get(id); if (a) a.m.visible = oui; }

    function viser(x, y, tout) { voulue.set(x + .5, 0, y + .5); if (tout) cible.copy(voulue); }

    // ---------- l'écran de combat : une autre scène ; celle de la carte est mise de côté puis revient ----------
    // o : { sol: [tuiles], decor: nom d'un décor « panneau » (arbres au fond), brume, interieur }
    // Les combattants se placent en coordonnées du monde (placerMonde) : monstres à gauche, héros à droite.
    let combat = null;
    function chargerCombat(o) {
      const sauve = { scene, carte, soleil, acteurs, objets, vacillent, alternent, eau, brumes, masquables, interieur };
      scene = new THREE.Scene();
      acteurs = new Map(); objets = new Map(); vacillent = []; alternent = []; eau = null; brumes = []; masquables = []; interieur = !!o.interieur;
      const ciel = new THREE.Color(interieur ? 0x14100c : 0xa9d1ee), b = o.brume || 0;
      scene.background = ciel;
      scene.fog = new THREE.Fog(b ? 0xd6dde6 : ciel, b ? 10 : 15, b ? 26 - b * 6 : 36);
      lumieres(interieur);
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g.drawImage(poupees.decoupe(choisir(o.sol, x + 11, y)), x * 32, y * 32);
      const ts = lointain(cv); ts.wrapS = ts.wrapT = THREE.RepeatWrapping; ts.repeat.set(10, 7);
      const sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 28), new THREE.MeshPhongMaterial({ map: ts, shininess: 0, specular: 0 }));
      sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);
      const d = o.decor && style.decors[o.decor];
      if (d && d.type === 'panneau') {
        for (let x = -11; x <= 11; x += .9) for (let rang = 0; rang < 3; rang++) {
          const hh = hasard(Math.round(x * 10) + 500, rang), a = panneau(tex(choisir(d.tuiles, Math.round(x * 10), rang)), d.taille * 1.15, d.taille * 1.15);
          a.position.set(x + (hh % 7) * .05, 0, -3.6 - rang * 1.2 - (hh % 3) * .2); scene.add(a);
        }
        for (const [x, z] of [[-6.2, 4.6], [6.6, 4.8], [-5, 5.6]]) { const a = panneau(tex(choisir(d.tuiles, Math.round(x), 9)), d.taille * 1.3, d.taille * 1.3); a.position.set(x, 0, z); scene.add(a); }
      } else if (d && d.type === 'bloc') {
        const t = tex(d.tuile).clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(24, 3);
        const mur = new THREE.Mesh(new THREE.BoxGeometry(24, 3, 1), new THREE.MeshLambertMaterial({ map: t })); mur.position.set(0, 1.5, -3.8); mur.receiveShadow = true; scene.add(mur);
      }
      const eclair = new THREE.PointLight(0xffffff, 0, 7, 1.5); scene.add(eclair);
      combat = { sauve, eclair, effets: new Map() };
    }
    function quitterCombat() {
      if (!combat) return;
      ({ scene, carte, soleil, acteurs, objets, vacillent, alternent, eau, brumes, masquables, interieur } = combat.sauve);
      combat = null;
    }
    function placerMonde(id, x, z, etat = 'repos', q = 0, sens) {
      const a = acteurs.get(id); if (!a) return;
      a.m.position.set(x, 0, z); a.etat = etat; a.q = q; if (sens) a.sens = sens;
    }
    // un effet visible (projectile, impact) : cle, { tuile, x, y, z, taille, rot, op } ; null le cache
    function effet(cle, o) {
      if (!combat) return;
      let m = combat.effets.get(cle);
      if (!o) { if (m) m.visible = false; return; }
      if (!m) { m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); scene.add(m); combat.effets.set(cle, m); }
      const t = o.tuile === '_arc' ? arc() : tex(o.tuile);
      if (m.material.map !== t) { m.material.map = t; m.material.needsUpdate = true; }
      m.visible = true; m.position.set(o.x, o.y, o.z); m.scale.set(o.taille || 1, o.taille || 1, 1); m.rotation.z = o.rot || 0; m.material.opacity = o.op === undefined ? 1 : o.op;
    }
    // l'arc blanc d'un coup d'épée (dessiné une fois)
    function arc() {
      if (textures._arc) return textures._arc;
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(32, 32, 24, -2.6, -.4); g.stroke();
      g.strokeStyle = 'rgba(180,220,255,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 19, -2.4, -.6); g.stroke();
      return (textures._arc = new THREE.CanvasTexture(c));
    }
    function eclair(couleur, intensite, x, y, z) { if (!combat) return; combat.eclair.color.set(couleur); combat.eclair.intensity = intensite; combat.eclair.position.set(x, y, z); }
    // position à l'écran (pixels CSS, depuis le coin du canevas) d'un point du monde
    function projeter(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); return [(v.x + 1) / 2 * canvas.clientWidth, (1 - v.y) / 2 * canvas.clientHeight]; }

    function rendre(t) {
      if (!scene) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (w !== w0 || h !== h0) { w0 = w; h0 = h; r.setSize(w, h, false); const pr = r.getPixelRatio(); rt.setSize(w * pr, h * pr); post.uniforms.res.value.set(w * pr, h * pr); camera.aspect = w / h; camera.updateProjectionMatrix(); }
      for (const a of acteurs.values()) { M.Poupees.dessiner(a.cv.getContext('2d'), a.p, a.etat, a.q, t, a.sens); a.t.needsUpdate = true; }
      for (const v of vacillent) v.p.intensity = v.base * (1 + Math.sin(t * 13 + v.dec) * .1 + Math.sin(t * 7.3 + v.dec) * .1);
      for (const x of alternent) { const k = x.tuiles[Math.floor(t * 3) % x.tuiles.length]; if (x.a.material.map !== k) { x.a.material.map = k; x.a.customDepthMaterial.map = k; } }
      if (eau) eau.opacity = .3 + Math.sin(t * 2) * .08;
      for (const b of brumes) { b.m.position.x += b.v * .016; if (b.m.position.x < -3) b.m.position.x = carte.l + 3; if (b.m.position.x > carte.l + 3) b.m.position.x = -3; }
      if (combat) {
        // assez de recul pour voir les deux camps, même sur un écran étroit (téléphone en portrait)
        const d = Math.min(17, Math.max(9.5, 3.6 / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect)));
        camera.position.set(0, d * .36, d); camera.lookAt(0, -.15 - d * .02, 0);
        soleil.position.set(-6, 10, 5); soleil.target.position.set(0, 0, 0);
        r.setRenderTarget(rt); r.render(scene, camera); r.setRenderTarget(null); r.render(scPost, camPost);
        return;
      }
      // caméra : suit le chef de file sans montrer trop de vide autour de la carte
      const recul = interieur ? 10.5 : 12.5, haut = interieur ? 8.5 : 9.5;
      const demi = Math.tan(camera.fov * Math.PI / 360) * Math.hypot(recul, haut) * camera.aspect;
      const vx = carte.l <= demi * 2 ? carte.l / 2 : Math.min(carte.l - demi + .5, Math.max(demi - .5, voulue.x));
      const vz = carte.h <= 9 ? carte.h / 2 + .5 : Math.min(carte.h - 3, Math.max(3.5, voulue.z));
      cible.lerp(new THREE.Vector3(vx, 0, vz), .08);
      camera.position.set(cible.x, haut, cible.z + recul); camera.lookAt(cible.x, .4, cible.z);
      soleil.position.set(cible.x - 6, 10, cible.z + 5); soleil.target.position.copy(cible);
      // un objet devant l'équipe (entre elle et la caméra) devient transparent
      const k = recul / haut;
      for (const o of masquables) {
        const cache = voulue.x > o.x0 - .2 && voulue.x < o.x1 + .2 && voulue.z < o.zf + .01 && voulue.z > o.zb - o.h * k;
        const but = cache ? .35 : 1;
        if (Math.abs(o.a - but) > .01) { o.a += (but - o.a) * .2; for (const m of o.mats) m.opacity = o.a; }
      }
      r.setRenderTarget(rt); r.render(scene, camera); r.setRenderTarget(null); r.render(scPost, camPost);
    }

    return { chargerCarte, majObjet, allumer, acteur, placer, retirer, montrer, viser, rendre, chargerCombat, quitterCombat, placerMonde, effet, eclair, projeter,
      get carte() { return carte; }, get enCombat() { return !!combat; } };
  }

  M.Rendu = { Rendu };
})(window.MoteurRPG = window.MoteurRPG || {});
