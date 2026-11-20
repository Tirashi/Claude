# Convertit les stations de « Space Stations » de Viktor Hahn (CC BY 4.0, https://v-ktor.itch.io/space-stations)
# en un script window.SC_STATIONS : pour chaque station, ses pièces (corps, anneau, quai) avec positions, coordonnées de texture,
# et textures (couleur réduite en JPEG, lumières en PNG).
# Usage : python3 -I outils/strategie-ciel/stations.py <dossier spacestations> <sortie.js> [station01,station03…] [taille des textures]
import base64, io, json, os, pathlib, sys
from PIL import Image
D = pathlib.Path(sys.argv[1]); out = sys.argv[2]
choix = sys.argv[3].split(',') if len(sys.argv) > 3 else ['station01', 'station02', 'station03', 'station05', 'station06']
T = int(sys.argv[4]) if len(sys.argv) > 4 else 512
def obj(f):
    V, VT, P, U = [], [], [], []
    for l in f.read_text().splitlines():
        a = l.split()
        if not a: continue
        if a[0] == 'v': V.append([float(x) for x in a[1:4]])
        elif a[0] == 'vt': VT.append([float(x) for x in a[1:3]])
        elif a[0] == 'f':
            c = [x.split('/') for x in a[1:]]
            for i in range(1, len(c) - 1):
                for q in (c[0], c[i], c[i + 1]):
                    P += V[int(q[0]) - 1]; U += VT[int(q[1]) - 1] if len(q) > 1 and q[1] else [0, 0]
    return [round(x, 3) for x in P], [round(x, 4) for x in U]
def img(f, fmt):
    if not f.exists(): return None
    im = Image.open(f).convert('RGB'); im.thumbnail((T, T), Image.LANCZOS); b = io.BytesIO()
    im.save(b, fmt, **({'quality': 80} if fmt == 'JPEG' else {'optimize': True}))
    return ('data:image/jpeg;base64,' if fmt == 'JPEG' else 'data:image/png;base64,') + base64.b64encode(b.getvalue()).decode()
S = {}
for st in choix:
    pieces = [st] if (D / (st + '.obj')).exists() else sorted(p.stem for p in D.glob(st + '_*.obj'))
    S[st] = []
    for pc in pieces:
        p, u = obj(D / (pc + '.obj'))
        S[st].append({'nom': pc, 'p': p, 'uv': u, 'couleur': img(D / (pc + '_diffuse.png'), 'JPEG'), 'lumiere': img(D / (pc + '_emission.png'), 'PNG')})
s = ('/* Stations de « Space Stations » par Viktor Hahn (CC BY 4.0, https://v-ktor.itch.io/space-stations) ; '
     'fabriqué par outils/strategie-ciel/stations.py */\nwindow.SC_STATIONS=' + json.dumps(S, separators=(',', ':')) + ';\n')
open(out, 'w').write(s); print(out, len(s) // 1024, 'Ko', {k: [len(x['p']) // 9 for x in v] for k, v in S.items()})
