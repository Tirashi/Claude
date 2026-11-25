# Convertit les planètes de deux packs CC0 (OBJ + textures) en maquettes/strategie-ciel-planetes.js (window.SC_PLANETES) :
#  - « 3D Pixel Planet Pack 0001 » d'AstroJar (https://astrojar.itch.io/3d-pixel-planet-pack-0001), dossier PixelPlanet1_TOON ;
#  - « Low Poly Planets Pack » de Heck (https://heckinghecker.itch.io/low-poly-planets-pack), dossier LowPolyPlanetsPack/OBJ.
# Usage : python3 -I outils/strategie-ciel/planetes.py <dossier PixelPlanet1_TOON> <dossier LowPolyPlanetsPack/OBJ>
import base64, io, json, math, pathlib, sys
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[2]
astro, heck = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
def obj(f):
    V, T, P, U = [], [], [], []
    for l in f.read_text().splitlines():
        a = l.split()
        if not a: continue
        if a[0] == 'v': V.append([float(x) for x in a[1:4]])
        elif a[0] == 'vt': T.append([float(x) for x in a[1:3]])
        elif a[0] == 'f':
            c = [x.split('/') for x in a[1:]]
            for i in range(1, len(c) - 1):
                for q in (c[0], c[i], c[i + 1]):
                    P += V[int(q[0]) - 1]; U += T[int(q[1]) - 1] if len(q) > 1 and q[1] else [0, 0]
    m = max(math.sqrt(P[i]**2 + P[i+1]**2 + P[i+2]**2) for i in range(0, len(P), 3))
    return {'p': [round(x / m, 4) for x in P], 'uv': [round(x, 4) for x in U]}
def img(f, taille, fmt):
    im = Image.open(f).convert('RGB' if fmt == 'JPEG' else 'RGBA')
    if taille: im = im.resize(taille, Image.LANCZOS)
    b = io.BytesIO(); im.save(b, fmt, **({'quality': 82} if fmt == 'JPEG' else {'optimize': True}))
    return ('data:image/jpeg;base64,' if fmt == 'JPEG' else 'data:image/png;base64,') + base64.b64encode(b.getvalue()).decode()
# un type de planète par emplacement du jeu → fichier de chaque pack
TYPES = {'terre': ('SE-0002', 'earthday', 'LowPolyEarthDay'), 'lave': ('SE-0003', 'venus', 'LowPolyVenus'), 'glace': ('NL-0001', 'uranus', 'LowPolyUranus'),
         'gaz': ('GG-0001', 'jupiter', 'LowPolyJupiter'), 'desert': ('SE-0006', 'mars', 'LowPolyMars'), 'roche': ('SE-0009', 'moon', 'LowPolyMoon')}
out = {'astro': {'mesh': obj(astro / 'SE-0002.obj'), 'tex': {}}, 'heck': {'mesh': obj(heck / 'LowPolyEarthDay.obj'), 'tex': {}}}
for k, (a, h, _) in TYPES.items():
    out['astro']['tex'][k] = img(astro / (a + '.png'), None, 'PNG')
    out['heck']['tex'][k] = img(heck / 'Textures' / (h + '.jpg'), (512, 256), 'JPEG')
s = '/* planètes CC0 : AstroJar (3D Pixel Planet Pack 0001) et Heck (Low Poly Planets Pack) ; fabriqué par outils/strategie-ciel/planetes.py */\nwindow.SC_PLANETES=' + json.dumps(out, separators=(',', ':')) + ';\n'
(R / 'maquettes/strategie-ciel-planetes.js').write_text(s)
print(len(s) // 1024, 'Ko', len(out['astro']['mesh']['p']) // 9, len(out['heck']['mesh']['p']) // 9, 'triangles')
