# Met les exemples (bandes et sprite plat) en base64 dans maquettes/sprite-stacking-vaisseaux.html.
# Usage : python3 donnees5.py <dossier des exemples> <page.html>
# Le dossier vient de : vox-exemple.py <dossier> puis vox-bande.py <dossier>/flotte.vox <dossier>
import sys, base64, json, re
d, page = sys.argv[1], sys.argv[2]
uri = lambda n: 'data:image/png;base64,' + base64.b64encode(open(f'{d}/{n}', 'rb').read()).decode()
ex = {'vaisseau': uri('flotte_0.png'), 'asteroide': uri('flotte_1.png'), 'plat': uri('sprite-plat.png')}
s = open(page).read()
s = re.sub(r'var EXEMPLES = .*?;\n', lambda m: 'var EXEMPLES = ' + json.dumps(ex) + ';\n', s, count=1)
open(page, 'w').write(s); print(len(s), 'octets')
