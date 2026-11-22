# Nettoie une planche générée (Nano Banana…) : faux damier de transparence retiré, sprites découpés,
# puis ramenés à leur vraie grille de pixels (l'image est du pixel art agrandi, souvent en JPEG).
# Usage : python3 -I nano-banana.py <image> <dossier> [--pas S]
#   sortie : <dossier>/detoure.png, sprite_NN.png (taille d'origine), px_NN.png (vraie grille)
# Damier : gris neutres clairs reliés au bord (le contour sombre des sprites arrête le remplissage).
# Pas : cherché sur le profil des bords ; on garde le plus petit pas qui score presque autant que le meilleur
# (sinon on tombe sur un multiple). Décalage de la grille : cherché par sprite (variance minimale dans les cases).
import sys, os, glob, argparse, numpy as np
from PIL import Image
from collections import deque
ap = argparse.ArgumentParser(); ap.add_argument('image'); ap.add_argument('dossier'); ap.add_argument('--pas', type=float)
o = ap.parse_args(); os.makedirs(o.dossier, exist_ok=True)

def trouver_pas(a):
    d = np.abs(np.diff(a, axis=1)).sum(2); e = (d > 60).sum(0).astype(float); idx = np.arange(len(e)); res = []
    for s in np.arange(3, 12.01, 0.02):
        sc = max(e[((idx - off) % s < 0.75) | ((idx - off) % s > s - 0.75)].sum() / e.sum() / (1.5 / s) for off in np.arange(0, s, 0.25))
        res.append((s, sc))
    m = max(sc for _, sc in res)
    # plus petit pas proche du meilleur score, en ne regardant que les sous-multiples du meilleur
    sm = max(res, key=lambda r: r[1])[0]
    def score(s): return max(e[((idx - off) % s < 0.75) | ((idx - off) % s > s - 0.75)].sum() / e.sum() / (1.5 / s) for off in np.arange(0, s, 0.25))
    for k in (4, 3, 2):
        if sm / k < 3: continue
        cand = [(t, score(t)) for t in np.arange(sm / k - 0.02, sm / k + 0.021, 0.0025)]
        t, sc = max(cand, key=lambda r: r[1])
        if sc > 0.5 * m: return t
    return sm
src, out = o.image, o.dossier
a = np.asarray(Image.open(src).convert('RGB')).astype(int); H, W, _ = a.shape
sat = a.max(2) - a.min(2); lum = a.mean(2)
fond_possible = (sat < 22) & (lum > 95)
fond = np.zeros((H, W), bool); q = deque()
for y in range(H):
    for x in (0, W - 1):
        if fond_possible[y, x] and not fond[y, x]: fond[y, x] = True; q.append((y, x))
for x in range(W):
    for y in (0, H - 1):
        if fond_possible[y, x] and not fond[y, x]: fond[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not fond[ny, nx] and fond_possible[ny, nx]: fond[ny, nx] = True; q.append((ny, nx))
# composantes des sprites
lab = np.zeros((H, W), int); n = 0; boites = []
for y in range(H):
    for x in range(W):
        if fond[y, x] or lab[y, x]: continue
        n += 1; lab[y, x] = n; q = deque([(y, x)]); pts = []
        while q:
            cy, cx = q.popleft(); pts.append((cy, cx))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < H and 0 <= nx < W and not fond[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; q.append((ny, nx))
        p = np.array(pts)
        if len(p) > 300: boites.append((n, p[:, 0].min(), p[:, 1].min(), p[:, 0].max(), p[:, 1].max(), len(p)))
rgba = np.dstack([a, np.where(fond, 0, 255)]).astype(np.uint8)
Image.fromarray(rgba).save(out + '/detoure.png')
boites.sort(key=lambda b: (round(b[1] / 120), b[2]))
for i, (k, y0, x0, y1, x1, nb) in enumerate(boites):
    m = lab[y0:y1 + 1, x0:x1 + 1] == k
    c = rgba[y0:y1 + 1, x0:x1 + 1].copy(); c[..., 3] = np.where(m, 255, 0)
    Image.fromarray(c).save(f'{out}/sprite_{i:02d}.png'); print(i, (x0, y0), (x1 - x0 + 1, y1 - y0 + 1), nb)
s = o.pas or trouver_pas(a); print('pas', round(s, 2))
for f in sorted(glob.glob(out + '/sprite_*.png')):
    a = np.asarray(Image.open(f).convert('RGBA')).astype(float); H, W = a.shape[:2]
    def cases(ox, oy):
        nx, ny = int((W - ox) / s), int((H - oy) / s); return nx, ny
    best = None
    for ox in np.arange(0, s, 0.25):
        for oy in np.arange(0, s, 0.25):
            nx, ny = cases(ox, oy); v = 0
            for j in range(0, ny, 2):
                for i in range(0, nx, 2):
                    b = a[int(oy + j * s):int(oy + (j + 1) * s), int(ox + i * s):int(ox + (i + 1) * s)]
                    m = b[..., 3] > 0
                    if m.sum() > 3: v += b[m][:, :3].var(0).sum()
            if best is None or v < best[0]: best = (v, ox, oy)
    _, ox, oy = best
    # bornes : une case de part et d'autre pour ne rien couper
    ox -= s * np.ceil(ox / s); oy -= s * np.ceil(oy / s)
    nx, ny = int(np.ceil((W - ox) / s)), int(np.ceil((H - oy) / s))
    o = np.zeros((ny, nx, 4), np.uint8)
    for j in range(ny):
        for i in range(nx):
            cy, cx = oy + (j + 0.5) * s, ox + (i + 0.5) * s
            y0, y1, x0, x1 = max(0, int(cy - 1.2)), min(H, int(cy + 1.2) + 1), max(0, int(cx - 1.2)), min(W, int(cx + 1.2) + 1)
            b = a[y0:y1, x0:x1].reshape(-1, 4)
            if len(b) == 0 or (b[:, 3] > 0).mean() < 0.5: continue
            o[j, i, :3] = np.median(b[b[:, 3] > 0][:, :3], 0); o[j, i, 3] = 255
    ys, xs = np.nonzero(o[..., 3]); o = o[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(o).save(f.replace('sprite_', 'px_')); print(os.path.basename(f), o.shape[1], 'x', o.shape[0])
