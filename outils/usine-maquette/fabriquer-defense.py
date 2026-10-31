"""Fabrique maquettes/usine-defense.html (maquette 2 de La petite usine : usine + tower defense).
Reprend le moteur de source.html (maquette 1), la page defense-page.html et le jeu defense-jeu.js,
et y glisse les modèles GLB des deux packs Kenney (CC0) en base64.
Usage : python3 -I outils/usine-maquette/fabriquer-defense.py <Models du Factory Kit> <Models du Tower Defense Kit>
Packs : https://opengameart.org/content/factory-kit et https://opengameart.org/content/tower-defense-kit"""
import base64, json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
PACKS = {'f': sys.argv[1], 't': sys.argv[2]}
SORTIE = os.path.join(ICI, '..', '..', 'maquettes', 'usine-defense.html')

def b64(p):
    return base64.b64encode(open(p, 'rb').read()).decode()
noms = {}
for ligne in open(os.path.join(ICI, 'modeles-defense.txt')):
    if ':' in ligne:
        k, v = ligne.split(':', 1); noms[k.strip()] = v.split()
src = open(os.path.join(ICI, 'source.html'), encoding='utf-8').read()
tete = src[:src.index('<header>')]
moteur = src[src.index('const MOD = __MODELES__;'):src.index('// tracer des tapis au doigt')]
remplacements = [
    ("const MOD = __MODELES__;\nconst TEX = { a: '__TEX_A__', b: '__TEX_B__' };", "const MOD = { f: __MODELES_F__, t: __MODELES_T__ };\nconst TEX = { f: '__TEX_F__', t: '__TEX_T__' };"),
    ("  sol() {\n", "  sol() {\n    if (this.cfg.terrain) return this.cfg.terrain(this);\n"),
    ("if (c.t === 'sortie') return true;\n    return false;", "if (c.t === 'sortie') return true;\n    if (c.t === 'tour') return k === 'munition' && c.stock + c.res < c.max;\n    return false;"),
    ("if (c && c.t === 'mach') { c.res--; c.buf++; }", "if (c && c.t === 'mach') { c.res--; c.buf++; } else if (c && c.t === 'tour') { c.res--; c.stock++; }"),
    ("if (c.t === 'mach' || c.t === 'sortie') { if (c.t === 'mach') c.res++;", "if (c.t === 'mach' || c.t === 'sortie' || c.t === 'tour') { if (c.t === 'mach' || c.t === 'tour') c.res++;"),
    ("const sortir = (c, k) => {\n      const x = c.x + DX[c.d], z = c.z + DZ[c.d]", "const sortir = (c, k, d = c.d) => {\n      const x = c.x + DX[d], z = c.z + DZ[d]"),
    ("if (!this.accepte(n, k, c.d) || nouv.has(K(x, z))) return false;\n      if (n.t === 'mach' || n.t === 'sortie') return false;\n      nouv.set(K(x, z), this.creer(k, x, z, c.x, c.z, c.d));",
     "if (!this.accepte(n, k, d) || nouv.has(K(x, z))) return false;\n      if (n.t === 'mach' || n.t === 'sortie' || n.t === 'tour') return false;\n      nouv.set(K(x, z), this.creer(k, x, z, c.x, c.z, d));"),
    ("if (!c.busy && !c.pret && c.buf > 0) { c.buf--; c.busy = c.temps; }\n      }",
     "if (!c.busy && !c.pret && c.buf > 0) { c.buf--; c.busy = c.temps; }\n      } else if (c.t === 'base') {\n        c.n = (c.n || 0) + 1;\n        if (c.n >= c.per) for (let j = 0; j < 4; j++) { c.rr = ((c.rr || 0) + 1) % 4; if (sortir(c, 'munition', c.rr)) { c.n = 0; break; } }\n      }"),
    ("this.modele('box-small', 0, 0, 0.1, 0.8, 0.5, g);\n      }", "this.modele('box-small', 0, 0, 0.1, 0.8, 0.5, g);\n      } else if (this.cfg.visuel) this.cfg.visuel(this, c, g);"),
    ("if (n.t === 'mine' || n.t === 'mach') return n.d === vers;", "if (n.t === 'mine' || n.t === 'mach') return n.d === vers;\n    if (n.t === 'base') return true;"),
    ("    else { o = teinter(this.m['box-small'].clone(true), TEINTES[k]); o.scale.setScalar(0.62); }",
     "    else if (k === 'munition') { o = normer(this.m['weapon-ammo-bullet'].clone(true), 0.34); o.position.y = 0.02; }\n    else { o = teinter(this.m['box-small'].clone(true), TEINTES[k]); o.scale.setScalar(0.62); }"),
]
for a, b in remplacements:
    assert moteur.count(a) == 1, a
    moteur = moteur.replace(a, b)
page = open(os.path.join(ICI, 'defense-page.html'), encoding='utf-8').read()
jeu = open(os.path.join(ICI, 'defense-jeu.js'), encoding='utf-8').read()
html = tete.replace('<title>La petite usine</title>', '<title>Usine en défense</title>') + page + '''
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script>
''' + moteur + jeu + '</script>\n'
for k, dossier in PACKS.items():
    glb = os.path.join(dossier, 'GLB format')
    html = html.replace('__MODELES_%s__' % k.upper(), json.dumps({n: b64(os.path.join(glb, n + '.glb')) for n in noms[k]}))
    html = html.replace('__TEX_%s__' % k.upper(), 'data:image/png;base64,' + b64(os.path.join(glb, 'Textures', 'colormap.png')))
open(SORTIE, 'w', encoding='utf-8').write(html)
print(SORTIE, len(html) // 1024, 'Ko')
