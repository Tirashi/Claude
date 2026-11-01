#!/usr/bin/env python3
"""Fabrique mineur-de-l-espace/sprites.js : les vaisseaux choisis dans les packs payants de l'utilisateur (itch.io),
en images data: (le jeu et son artefact n'ont qu'à charger le script). Les packs ne sont PAS dans le dépôt
(licences : usage dans un jeu permis, pas de redistribution des fichiers seuls) ; on ne garde que les sprites utilisés.
   python3 outils/mineur-sprites.py <dossier zoser> <dossier sckr> mineur-de-l-espace/sprites.js
<dossier zoser> : fvA/x/sprites/pack_01_*.png, fvB/x/sprites/pack_02_*.png (Fields of the Void A et B, Zoser)
<dossier sckr>  : planches Cute SCKR (Complete Spaceship et Star Fleet, tile-B-05.png) et boîtes d_c5.json, d_f5.json (outil decoupe.py)
Choix de l'utilisateur (01/11, specs/mineur-de-l-espace.md § 23)."""
import json, base64, io, sys
from PIL import Image
Z, SK, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
def zoser(pack, n):
    d = {'A': ('fvA', '01'), 'B': ('fvB', '02')}[pack]
    im = Image.open(f'{Z}/{d[0]}/x/sprites/pack_{d[1]}_{n}.png').convert('RGBA'); return im.crop(im.getbbox())
def sckr(planche, i, tourne=0):
    png = {'c5': SK + '/Complete_Spaceship_Pixel_Art_Tileset/x/tile-B-05.png', 'f5': SK + '/Star_Fleet_Pixel_Art_Tileset/x/tile-B-05.png'}[planche]
    b = json.load(open(f'{SK}/d_{planche}.json'))[i]; im = Image.open(png).convert('RGBA').crop(b); im = im.crop(im.getbbox())
    return im.rotate(tourne, expand=True) if tourne else im   # 90 : nez à droite -> nez en haut
def data(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
def moteurs(im):   # tuyères : segments opaques de la rangée la plus basse (x, y, rayon), en pixels de l'image
    w, h = im.size; px = im.load(); bas = [max([y for y in range(h) if px[x, y][3] > 0] or [-1]) for x in range(w)]
    m = max(bas); seg = []; x = 0
    while x < w:
        if bas[x] >= m - 3:
            x0 = x
            while x < w and bas[x] >= m - 3: x += 1
            seg.append([round((x0 + x - 1) / 2, 1), m + 1, max(1.5, min(3.5, (x - x0) / 2))])
        else: x += 1
    return seg[:4]
def tourelles(im, n=6):   # places des tourelles (décalage depuis le centre, pixels de l'image), posées sur la coque
    w, h = im.size; px = im.load(); out = []
    for fx, fy in [(0, -.12), (-.27, .05), (.27, .05), (0, .2), (-.3, .32), (.3, .32)][:n]:
        x, y = round(fx * w), round(fy * h)
        for t in range(12):
            xx, yy = int(w / 2 + x * (1 - t / 12)), int(h / 2 + y * (1 - t / 12))
            if 0 <= xx < w and 0 <= yy < h and px[xx, yy][3] > 0: x, y = xx - w / 2, yy - h / 2; break
        out.append([round(x), round(y)])
    return out
def nef(im, ech=0.5, tour=True):
    d = {'src': data(im), 'w': im.size[0], 'h': im.size[1], 'ech': ech, 'moteurs': moteurs(im)}
    if tour: d['tourelles'] = tourelles(im)
    return d
SP = {
  # corvettes (Zoser, Fields of the Void A, gris et bleu) ; le porte-vaisseaux : Cute SCKR Complete Spaceship 5 n° 15
  'eclaireur': nef(zoser('A', 'support_ship_03')), 'prospecteur': nef(zoser('A', 'combat_ship_05')),
  'pionniere': nef(zoser('A', 'combat_ship_02')), 'escorte': nef(zoser('A', 'combat_ship_07')),
  'porte': nef(sckr('c5', 15, 90), ech=0.42),
  'tourelle': nef(zoser('A', 'weapon_turret_09'), tour=False),
  # escadrille du porte-vaisseaux (Star Fleet 5 : n° 29, puis 28 améliorée à fond)
  'chasseur1': nef(sckr('f5', 29), tour=False), 'chasseur2': nef(sckr('f5', 28), tour=False),
  # drones des stations, satellites et flottes du joueur (Star Fleet 5)
  'd_mineur': nef(sckr('f5', 10), tour=False), 'd_cargo': nef(sckr('f5', 38), tour=False), 'd_reparateur': nef(sckr('f5', 47), tour=False),
  'd_satellite': nef(sckr('f5', 5), tour=False),
  'u_garde': nef(sckr('f5', 33), tour=False), 'u_escorte': nef(sckr('f5', 4), tour=False),
  'u_reparateur': nef(sckr('f5', 18), tour=False), 'u_canonniere': nef(sckr('f5', 49), tour=False),
  # aliens (Zoser, Fields of the Void B, bleu canard et violet)
  'a_rodeur': nef(zoser('B', 'interceptor_ship_04'), tour=False), 'a_chasseur': nef(zoser('B', 'combat_ship_08'), tour=False),
  'a_croiseur': nef(zoser('B', 'combat_ship_01'), tour=False), 'a_mere': nef(zoser('B', 'main_ship_01'), ech=1, tour=False),
}
js = ('/* Mineur de l\'espace : sprites des packs de l\'utilisateur (fabriqué par outils/mineur-sprites.py, ne pas modifier à la main).\n'
      '   Corvettes et aliens : Zoser, Fields of the Void A et B. Porte-vaisseaux, escadrille, drones et flottes : Cute SCKR,\n'
      '   Complete Spaceship et Star Fleet. Licences : usage dans un jeu permis, pas de redistribution (voir credits/index.html). */\n'
      'const SPRITES = ' + json.dumps(SP, separators=(',', ':')) + ';\n')
open(OUT, 'w').write(js); print(OUT, len(js) // 1024, 'Ko')
