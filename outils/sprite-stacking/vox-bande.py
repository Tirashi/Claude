# .vox (MagicaVoxel) → bande de tranches PNG au format de loktar00/sprite-stack-animation :
# tranches côte à côte, la plus basse à gauche, cellule carrée, modèle centré (pivot au centre de la cellule).
# Un fichier .json à côté donne {cellule, tranches}.
#
# Usage : python3 vox-bande.py <fichier.vox> <dossier> [options]
#   --cellule N   taille de la cellule (défaut : le plus grand côté du modèle, arrondi au pair)
#   --tourner Q   quarts de tour (sens horaire à l'écran) pour mettre le nez vers la droite (+x) ; défaut 0
#   --creux       ne pas remplir l'intérieur (par défaut l'intérieur est rempli : pas de trous vus d'en haut)
#   --dessus F    éclaircit les faces du dessus (défaut 1.12 ; 1 = rien)
#   --bas F       assombrit les tranches du bas, jusqu'à ce facteur pour la tranche 0 (défaut 0.8 ; 1 = rien)
#   --modele K    seulement le modèle K (défaut : tous, un fichier par modèle)
#   --taille N    réduit le modèle pour que son plus grand côté au sol fasse N px (même facteur en hauteur) ;
#                 une case réduite est pleine si au moins --seuil (défaut 0.3) de son bloc l'est, couleur la plus fréquente
import sys, os, json, argparse
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vox import lire          # lecture du .vox, palette par défaut si absente
from piles import remplir     # remplissage de l'intérieur

def reduire(c, plein, N, seuil=0.3):
    X, Y, Z = plein.shape; k = N / max(X, Y)
    if k >= 1: return c, plein
    bx = lambda n: [(int(i / k), max(int(i / k) + 1, int((i + 1) / k))) for i in range(max(1, round(n * k)))]
    BX, BY, BZ = bx(X), bx(Y), bx(Z)
    c2 = np.zeros((len(BX), len(BY), len(BZ), 4), np.uint8); p2 = np.zeros(c2.shape[:3], bool)
    for i, (x0, x1) in enumerate(BX):
        for j, (y0, y1) in enumerate(BY):
            for l, (z0, z1) in enumerate(BZ):
                b = plein[x0:x1, y0:y1, z0:z1]
                if b.mean() < seuil: continue
                cols = c[x0:x1, y0:y1, z0:z1][b]
                # couleur la plus fréquente, en privilégiant les cases du dessus du bloc (ce qu'on voit)
                u, n = np.unique(cols.view(np.uint32).ravel(), return_counts=True)
                c2[i, j, l] = np.frombuffer(np.uint32(u[n.argmax()]).tobytes(), np.uint8); p2[i, j, l] = True
    return c2, p2

def bande(taille, v, pal, sortie, cellule=None, tourner=0, creux=False, dessus=1.12, bas=0.8, N=None, seuil=0.3):
    X, Y, Z = taille
    c = np.zeros((X, Y, Z, 4), np.uint8)
    c[v[:, 0], v[:, 1], v[:, 2]] = pal[(v[:, 3].astype(int) - 1) % 256]
    c[v[:, 0], v[:, 1], v[:, 2], 3] = 255
    plein = c[..., 3] > 0
    if not creux:
        tout = remplir(plein)
        for z in range(Z - 2, -1, -1):      # une case remplie prend la couleur de celle du dessus
            m = tout[:, :, z] & ~plein[:, :, z]
            c[:, :, z][m] = c[:, :, z + 1][m]
        plein = tout
    xs, ys, zs = np.nonzero(plein)
    c = c[xs.min():xs.max() + 1, ys.min():ys.max() + 1, zs.min():zs.max() + 1].astype(float)
    plein = plein[xs.min():xs.max() + 1, ys.min():ys.max() + 1, zs.min():zs.max() + 1]
    if N:
        c, plein = reduire(c.astype(np.uint8), plein, N, seuil); c = c.astype(float)
        xs, ys, zs = np.nonzero(plein)
        c = c[xs.min():xs.max() + 1, ys.min():ys.max() + 1, zs.min():zs.max() + 1]
        plein = plein[xs.min():xs.max() + 1, ys.min():ys.max() + 1, zs.min():zs.max() + 1]
    X, Y, Z = plein.shape
    # ombrage précalculé : dessus éclairés, bas de la pile plus sombre
    haut = plein.copy(); haut[:, :, :-1] &= ~plein[:, :, 1:]
    c[..., :3][haut] *= dessus
    for z in range(Z):
        c[:, :, z, :3] *= bas + (1 - bas) * (z / max(1, Z - 1))
    c = np.clip(c, 0, 255).astype(np.uint8); c[..., 3] = np.where(plein, 255, 0)
    C = cellule or (max(X, Y) + (max(X, Y) & 1))
    assert C >= max(X, Y), f'cellule {C} trop petite pour {X}×{Y}'
    img = np.zeros((C, C * Z, 4), np.uint8)
    ox, oy = (C - X) // 2, (C - Y) // 2
    for z in range(Z):
        s = c[:, ::-1, z].transpose(1, 0, 2)            # ligne = -y (y de MagicaVoxel vers le haut), colonne = x
        s = np.rot90(s, -tourner % 4)                   # rot90 négatif = sens horaire à l'écran
        h, w = s.shape[:2]; ox, oy = (C - w) // 2, (C - h) // 2
        img[oy:oy + h, z * C + ox:z * C + ox + w] = s
    Image.fromarray(img).save(sortie)
    info = {'cellule': C, 'tranches': Z, 'modele': [X, Y, Z]}
    json.dump(info, open(os.path.splitext(sortie)[0] + '.json', 'w'))
    return info

if __name__ == '__main__':
    a = argparse.ArgumentParser()
    a.add_argument('vox'); a.add_argument('dossier')
    a.add_argument('--cellule', type=int); a.add_argument('--tourner', type=int, default=0)
    a.add_argument('--creux', action='store_true'); a.add_argument('--dessus', type=float, default=1.12)
    a.add_argument('--bas', type=float, default=0.8); a.add_argument('--modele', type=int)
    a.add_argument('--taille', type=int); a.add_argument('--seuil', type=float, default=0.3)
    o = a.parse_args()
    os.makedirs(o.dossier, exist_ok=True)
    mods, pal = lire(o.vox)
    base = os.path.splitext(os.path.basename(o.vox))[0].replace(' ', '_')
    for k, (t, v) in enumerate(mods):
        if o.modele is not None and k != o.modele: continue
        nom = os.path.join(o.dossier, base + (f'_{k}' if len(mods) > 1 else '') + '.png')
        print(os.path.basename(nom), bande(t, v, pal, nom, o.cellule, o.tourner, o.creux, o.dessus, o.bas, o.taille, o.seuil))
