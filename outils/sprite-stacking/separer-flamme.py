# Sépare la flamme d'un vaisseau (nez à droite, flamme à gauche) : écrit <base>_coque.png et <base>_flamme.png
# et affiche le décalage du centre de la flamme par rapport au centre de la coque (en pixels du sprite).
# Usage : python3 -I separer-flamme.py <sprite.png> <base de sortie>
import sys, json, numpy as np
from PIL import Image
from collections import deque
a = np.asarray(Image.open(sys.argv[1]).convert('RGBA')).astype(int); H, W = a.shape[:2]
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
op = al > 0
feu = op & (r > 100) & (r - b > 60) & (g <= r)            # couleurs de feu (larges : bords pâles compris)
def comp(masque, graines):
    m = np.zeros((H, W), bool); q = deque()
    for p in graines:
        if masque[p]: m[p] = True; q.append(p)
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and masque[ny, nx] and not m[ny, nx]: m[ny, nx] = True; q.append((ny, nx))
    return m
ys, xs = np.nonzero(op & ~feu); nez = max(zip(xs, ys))
corps = comp(op & ~feu, [(nez[1], nez[0])])               # tout ce qui n'est pas du feu et touche le nez
x0 = np.nonzero(corps.any(0))[0].min()
flamme = comp(feu, [(y, x) for y in range(H) for x in range(W) if x < x0])
coque = op.copy(); coque[:, :x0] = False; coque &= ~flamme
flamme = op & ~coque
def ecrire(m, nom):
    yy, xx = np.nonzero(m); c = a.copy(); c[~m, 3] = 0
    Image.fromarray(c[yy.min():yy.max() + 1, xx.min():xx.max() + 1].astype(np.uint8)).save(nom)
    return (xx.min() + xx.max() + 1) / 2, (yy.min() + yy.max() + 1) / 2
hc = ecrire(coque, sys.argv[2] + '_coque.png'); fc = ecrire(flamme, sys.argv[2] + '_flamme.png')
print(json.dumps({'decalage': [float(fc[0] - hc[0]), float(fc[1] - hc[1])]}))
