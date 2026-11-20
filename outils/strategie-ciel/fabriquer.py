# Fabrique maquettes/strategie-ciel.html (copie autonome pour l'artefact) depuis maquettes/strategie-ciel-source.html :
# scripts (Three.js, GLTFLoader, planètes, shaders de Mineur) recopiés dans la page, modèles de Ciel de guerre en base64 (window.SC_B64).
import base64, json, pathlib, re
R = pathlib.Path(__file__).resolve().parents[2]
s = (R / 'maquettes/strategie-ciel-source.html').read_text()
# chaque <script src> (bibliothèques, planètes de la maquette, shaders de Mineur de l'espace) est recopié dans la page
s = re.sub(r'<script src="([^"]+)"></script>', lambda m: '<script>' + (R / 'maquettes' / m.group(1)).resolve().read_text().replace('</script', '<\\/script') + '</script>', s)
cles = re.search(r"await Promise\.all\(\[(.*?)\]\.map\(charge\)\)", s).group(1)
cles = re.findall(r"'([^']+)'", cles)
b = {k: base64.b64encode((R / 'ciel-de-guerre/modeles' / (k + '.glb')).read_bytes()).decode() for k in cles}
s = s.replace('/*MODELES*/', 'window.SC_B64=' + json.dumps(b) + ';')
(R / 'maquettes/strategie-ciel.html').write_text(s)
print('maquettes/strategie-ciel.html', len(s) // 1024, 'Ko')
