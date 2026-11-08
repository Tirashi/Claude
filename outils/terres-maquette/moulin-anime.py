"""Anime le moulin 1 de « Medieval Village » (Cute SCKR) : découpe une aile, reconstitue la tour derrière les ailes,
puis compose N images où les 4 ailes tournent (rotation au pixel près, sans flou).
Usage : python3 -I outils/terres-maquette/moulin-anime.py <tile-B-03.png de Medieval Village> <sortie.png> [N] [planche.png]
Sortie : une bande de N images de 192 × 230 px."""
import math, sys
from PIL import Image
src, sortie = sys.argv[1], sys.argv[2]; N = int(sys.argv[3]) if len(sys.argv) > 3 else 8
im = Image.open(src).convert("RGBA").crop((0, 150, 192, 380)); W, H = im.size; px = im.load()
HX, HY = 91, 113                       # moyeu
DIRS = [-44, 46, 140, -132]            # angle des 4 bras (degrés, y vers le bas)
R0, R1, LAT0, LAT1 = 7, 108, -21, 27    # rayon et largeur d'une aile (la toile est du côté angle - 90°)
def dans_aile(x, y, a):
  t = math.radians(a); ux, uy = math.cos(t), math.sin(t); sx, sy = math.cos(t - math.pi / 2), math.sin(t - math.pi / 2)
  dx, dy = x - HX, y - HY; r = dx * ux + dy * uy; l = dx * sx + dy * sy
  if r < 27: return R0 <= r and -3 <= l <= 3          # près du moyeu : le bras seul
  return r <= R1 and LAT0 <= l <= LAT1
def dans_tour(x, y):
  if ((x - 91) / 40) ** 2 + ((y - 110) / 31) ** 2 <= 1: return True          # toit de chaume
  if 128 <= y < H:
    u = (y - 128) / (H - 128); g, d = 53 - 12 * u, 129 + 12 * u
    return g <= x <= d
  return False
def clair(p): return p[3] > 0 and p[0] > 175 and p[1] > 160 and p[2] > 130 and max(p[:3]) - min(p[:3]) < 70   # toile
def lateral(x, y, a):
  t = math.radians(a); sx, sy = math.cos(t - math.pi / 2), math.sin(t - math.pi / 2); dx, dy = x - HX, y - HY
  return dx * sx + dy * sy, dx * math.cos(t) + dy * math.sin(t)
def est_aile(x, y, a):
  """pixel d'aile : loin du toit tout ce qui est dans la bande ; sur le toit seulement le bras, la toile claire et son contour"""
  if not dans_aile(x, y, a) or px[x, y][3] == 0: return False
  l, r = lateral(x, y, a)
  if not ((x - 91) / 40) ** 2 + ((y - 110) / 31) ** 2 <= 1.15: return True
  if -2.5 <= l <= 2.5: return True
  if clair(px[x, y]): return True
  q = px[x, y]
  if not (q[0] - q[2] > 45 and q[0] > 85): return True      # pas doré comme le chaume : toile dans l'ombre ou contour
  return any(clair(px[x + dx, y + dy]) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if 0 <= x + dx < W and 0 <= y + dy < H) and sum(px[x, y][:3]) < 330
masque = [[any(est_aile(x, y, a) for a in DIRS) for x in range(W)] for y in range(H)]
# 1. l'aile modèle (celle du haut à droite), dans un carré centré sur le moyeu
C = 2 * R1 + 8; aile = Image.new("RGBA", (C, C)); pa = aile.load()
for y in range(H):
  for x in range(W):
    if est_aile(x, y, DIRS[0]): pa[x - HX + C // 2, y - HY + C // 2] = px[x, y]
# 2. la tour sans les ailes : dehors -> transparent ; dedans -> pixel voisin non masqué de la même rangée (pas de 16 px, comme les pierres)
corps = im.copy(); pc = corps.load()
for y in range(H):
  for x in range(W):
    if not masque[y][x]: continue
    if not dans_tour(x, y): pc[x, y] = (0, 0, 0, 0); continue
    if y < 128:   # le toit : le pixel non masqué le plus proche
      best = None
      for rr in range(1, 30):
        for dx in range(-rr, rr + 1):
          for dy in (-rr, rr):
            for (a, b) in ((x + dx, y + dy), (x + dy, y + dx)):
              if 0 <= a < W and 0 <= b < H and not masque[b][a] and dans_tour(a, b) and px[a, b][3] > 0: best = px[a, b]; break
            if best: break
          if best: break
        if best: break
      pc[x, y] = best or (150, 110, 60, 255); continue
    trouve = None   # la même colonne, 16 ou 32 px plus bas (les pierres et l'ombre de la tour suivent les colonnes)
    for dy in (16, 32, 48, 8, 24):
      if y + dy < H and not masque[y + dy][x] and dans_tour(x, y + dy) and px[x, y + dy][3] > 0: trouve = px[x, y + dy]; break
    if trouve: pc[x, y] = trouve; continue
    for k in range(1, 12):
      trouve = None
      dehors = 1 if x >= HX else -1   # d'abord vers l'extérieur (pas la fenêtre du milieu)
      for sx in (x + dehors * 16 * k, x + dehors * 8 * k, x - dehors * 16 * k):
        if 0 <= sx < W and not masque[y][sx] and dans_tour(sx, y) and px[sx, y][3] > 0: trouve = px[sx, y]; break
      if trouve: pc[x, y] = trouve; break
    else: pc[x, y] = (120, 90, 50, 255)
moyeu = im.crop((HX - 7, HY - 7, HX + 8, HY + 8))
# 3. les images : 4 ailes tournées de phi + 90 k
bande = Image.new("RGBA", (W * N, H))
for f in range(N):
  phi = 90 * f / N; img = corps.copy()
  for k in range(4):
    r = aile.rotate(-(phi + 90 * k), resample=Image.NEAREST, center=(C // 2, C // 2))
    img.alpha_composite(r, (HX - C // 2, HY - C // 2)) if HX - C // 2 >= 0 and HY - C // 2 >= 0 else img.paste(r, (HX - C // 2, HY - C // 2), r)
  img.alpha_composite(moyeu, (HX - 7, HY - 7))
  bande.paste(img, (f * W, 0))
bande.save(sortie)
if len(sys.argv) > 4:
  pl = Image.new("RGBA", (W * 4, H * 2), (60, 60, 70, 255))
  for f in range(4): pl.alpha_composite(bande.crop((f * 2 * W, 0, f * 2 * W + W, H)), (f * W, 0))
  pl.alpha_composite(corps, (0, H)); pl.alpha_composite(aile.crop((C // 2 - 10, 0, C, C // 2 + 10)), (W, H))
  pl.resize((pl.width * 2, pl.height * 2), Image.NEAREST).save(sys.argv[4])
