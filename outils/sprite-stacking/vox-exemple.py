# Fabrique des fichiers de test pour l'essai du 22/11 (pas de pack téléchargé) :
#   - <dossier>/flotte.vox : un .vox MagicaVoxel avec deux modèles (chasseur nez vers +x, astéroïde)
#   - <dossier>/sprite-plat.png : un vaisseau 32×32 à plat, nez vers le haut (comme un sprite de Nano Banana)
# Usage : python3 vox-exemple.py <dossier>
import sys, os, struct, math
from PIL import Image

PAL = {  # index MagicaVoxel (1..255) → couleur
    1: (70, 85, 122), 2: (111, 134, 179), 3: (182, 201, 234),   # coque
    4: (140, 52, 24), 5: (217, 98, 43), 6: (255, 169, 77),      # orange
    7: (20, 96, 122), 8: (43, 183, 214), 9: (176, 243, 255),    # verrière
    10: (27, 31, 51), 11: (43, 49, 80), 12: (69, 79, 122),      # sombre
    13: (61, 55, 51), 14: (107, 95, 86), 15: (163, 147, 130),   # roche
    16: (38, 33, 31), 17: (63, 176, 200),                       # cratère, minerai
}

def chasseur():
    X, Y, Z = 40, 32, 12; v = {}
    for x in range(X):
        for y in range(Y):
            for z in range(Z):
                px, py, pz = x - 20 + 0.5, y - 16 + 0.5, z + 0.5
                ay = abs(py); c = None
                t = (px + 15) / 33                                     # fuselage effilé, de -15 à +18
                if 0 <= t <= 1:
                    hw = 5.5 * (1 - t ** 2.2); hz = 9.5 - 6 * t
                    if ay <= hw * (1 - pz / 16) and pz <= hz:
                        c = 2 if pz < hz - 1 else 3
                        if ay < 1 and pz > hz - 1.5 and px < 0: c = 5
                if ((px - 4) / 5) ** 2 + (py / 2.6) ** 2 + ((pz - 6.5) / 3) ** 2 <= 1: c = 8   # verrière
                if -14 <= px <= 2 and ay <= 15 - (px + 14) * 0.85 and ay > 4 and pz <= (3 if ay < 9 else 2):
                    c = 5 if ay > 12.5 else 2                          # ailes
                if -18 <= px <= -8:                                    # nacelles
                    if (ay - 6) ** 2 + (pz - 3.5) ** 2 <= 5: c = 4 if px < -16 else 11
                if c: v[(x, y, z)] = c
    return (X, Y, Z), v

def asteroide(seed=2.1, R=11):
    X = Y = 28; Z = 16; v = {}
    for x in range(X):
        for y in range(Y):
            for z in range(Z):
                px, py, pz = x - 14 + 0.5, y - 14 + 0.5, (z + 0.5 - 8) / 8.5
                rz = R * math.sqrt(max(0, 1 - pz * pz)); a = math.atan2(py, px)
                b = 1 + 0.16 * math.sin(3 * a + seed) + 0.1 * math.sin(5 * a + seed * 2.3) + 0.08 * math.sin(4 * pz + a)
                if math.hypot(px, py) <= rz * b:
                    h = (math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1
                    v[(x, y, z)] = 17 if h > 0.97 else 16 if h > 0.86 else 14
    return (X, Y, Z), v

def ecrire_vox(chemin, modeles):
    def chunk(cid, data, enfants=b''):
        return cid + struct.pack('<ii', len(data), len(enfants)) + data + enfants
    corps = b''
    for (X, Y, Z), vox in modeles:
        corps += chunk(b'SIZE', struct.pack('<iii', X, Y, Z))
        corps += chunk(b'XYZI', struct.pack('<i', len(vox)) + b''.join(struct.pack('<BBBB', x, y, z, i) for (x, y, z), i in vox.items()))
    pal = b''.join(struct.pack('<BBBB', *PAL.get(i, (0, 0, 0)), 255) for i in range(1, 257))   # entrée k = couleur k+1
    corps += chunk(b'RGBA', pal)
    open(chemin, 'wb').write(b'VOX ' + struct.pack('<i', 150) + chunk(b'MAIN', b'', corps))

def sprite_plat(chemin):
    # petit vaisseau dessiné « à plat » avec un ombrage peint, nez vers le haut
    im = Image.new('RGBA', (32, 32)); P = im.load()
    for y in range(32):
        for x in range(32):
            dx = x - 15.5; ay = abs(dx); c = None
            t = (y - 3) / 24
            if 0 <= t <= 1 and ay <= 1.2 + 4.2 * t ** 0.7: c = (182, 201, 234) if dx < 0 else (111, 134, 179)
            if 15 <= y <= 25 and ay <= 3 + (y - 15) * 1.2 and ay <= 14: c = (111, 134, 179) if y < 24 else (70, 85, 122)
            if ay > 11 and 21 <= y <= 25: c = (217, 98, 43)
            if (dx / 2.2) ** 2 + ((y - 12) / 3.6) ** 2 <= 1: c = (43, 183, 214) if dx > -0.5 else (176, 243, 255)
            if 26 <= y <= 28 and 2.5 <= ay <= 5: c = (140, 52, 24)
            if c: P[x, y] = c + (255,)
    # contour sombre d'un pixel, comme beaucoup de sprites générés
    m = [[P[x, y][3] > 0 for x in range(32)] for y in range(32)]
    for y in range(32):
        for x in range(32):
            if not m[y][x] and any(0 <= x + a < 32 and 0 <= y + b < 32 and m[y + b][x + a] for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                P[x, y] = (18, 20, 36, 255)
    im.save(chemin)

if __name__ == '__main__':
    d = sys.argv[1]; os.makedirs(d, exist_ok=True)
    ecrire_vox(os.path.join(d, 'flotte.vox'), [chasseur(), asteroide()])
    sprite_plat(os.path.join(d, 'sprite-plat.png'))
    print('écrit', os.path.join(d, 'flotte.vox'), os.path.join(d, 'sprite-plat.png'))
