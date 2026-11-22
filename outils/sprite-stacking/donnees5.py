# Met les exemples en base64 dans maquettes/sprite-stacking-vaisseaux.html.
# Usage : python3 donnees5.py <dossier des exemples> <page.html>
# Dossier : vox/*.png (bandes de vox-bande.py --taille 32 --tourner …), plat/*.png (sprites à plat, nez en haut), asteroide.png
import sys, base64, json, re, glob, os
d, page = sys.argv[1], sys.argv[2]
uri = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
def nom(f):
    n = os.path.splitext(os.path.basename(f))[0]
    if n == 'Chasseur': return 'Chasseur (test)'
    m = re.match(r'Spaceships_(\d+)', n)
    if m: return f'Texnist {int(m.group(1)) + 1}'
    m = re.match(r'Kenney_(\d+)', n)
    if m: return f'Kenney {int(m.group(1))}'
    return re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', n) + ' (monogon)'
def groupe(g):
    fs = sorted(glob.glob(f'{d}/{g}/*.png'), key=lambda f: ('Chasseur' in f, 'Spaceships' in f, f))
    return {nom(f): uri(f) for f in fs}
ex = {'vox': groupe('vox'), 'plat': groupe('plat'), 'asteroide': uri(f'{d}/asteroide.png')}
# nano/ : planche de l'utilisateur (nano-banana.py puis separer-flamme.py), décrite par nano/nano.json
if os.path.exists(f'{d}/nano/nano.json'):
    j = json.load(open(f'{d}/nano/nano.json'))
    ex['nano'] = {'sprites': {n: {'img': uri(f'{d}/nano/{fi}.png'), 'q': q, 'flammes': bool(fl[0]) if fl else False} for n, fi, q, *fl in j['sprites']},
                  'flammes': [uri(f'{d}/nano/flamme{k}.png') for k in range(3)], 'decalages': j['decalages'],
                  'asteroides': [uri(f'{d}/nano/ast{k}.png') for k in range(4)]}
s = open(page).read()
s = re.sub(r'var EXEMPLES = .*?;\n', lambda m: 'var EXEMPLES = ' + json.dumps(ex) + ';\n', s, count=1)
open(page, 'w').write(s); print(len(s), 'octets', list(ex['vox']), list(ex['plat']))
