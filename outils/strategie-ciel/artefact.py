#!/usr/bin/env python3
"""Copie artefact de la stratégie spatiale (strategie-ciel/) : python3 outils/strategie-ciel/artefact.py <sortie.html>
- outils/artefact.py fait la copie de base (scripts et style intégrés, retour à la Ludothèque masqué) ;
- Three.js depuis cdnjs (même version r128) au lieu de sa copie intégrée ;
- les 9 modèles de vaisseaux (lus dans ciel-de-guerre/modeles/) en base64 dans window.SC_B64 ;
- la police Silkscreen depuis Google Fonts (la page du jeu la lit dans polices/)."""
import base64, json, os, re, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out = sys.argv[1]
subprocess.run([sys.executable, os.path.join(R, 'outils/artefact.py'), 'strategie-ciel/index.html', out], check=True)
s = open(out, encoding='utf-8').read()
three = open(os.path.join(R, 'lib/three.min.js'), encoding='utf-8').read()
i = s.index(three); a = s.rindex('<script>', 0, i); b = s.index('</script>', i) + 9
s = s[:a] + '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>' + s[b:]
monde = open(os.path.join(R, 'strategie-ciel/monde.js'), encoding='utf-8').read()
cles = re.findall(r"'([^']+)'", re.search(r"const MODELES = \[(.*?)\]", monde).group(1))
b64 = {k: base64.b64encode(open(os.path.join(R, 'ciel-de-guerre/modeles', k + '.glb'), 'rb').read()).decode() for k in cles}
i = s.index(monde); a = s.rindex('<script>', 0, i)
s = s[:a] + '<script>window.SC_B64=' + json.dumps(b64) + ';</script>\n' + s[a:]
s = s.replace('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap">', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Silkscreen&display=swap">')
open(out, 'w', encoding='utf-8').write(s)
print(out, len(s) // 1024, 'Ko,', len(cles), 'modèles')
