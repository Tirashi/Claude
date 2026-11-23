# Convertit les planètes du « Pixel Planet Generator » de Deep-Fold (licence MIT, https://github.com/Deep-Fold/PixelPlanets)
# en strategie-ciel/shaders.js : shaders Godot passés en GLSL ES 3.0 (WebGL 2) + réglages de chaque couche,
# lus dans les .tscn (paramètres) et les .gd (taille en pixels et vitesse du temps de chaque couche).
# Usage : python3 -I outils/strategie-ciel/shaders.py <dossier du dépôt PixelPlanets cloné>
import json, pathlib, re, sys
R = pathlib.Path(__file__).resolve().parents[2]
D = pathlib.Path(sys.argv[1])
PLANETES = ['Star', 'LandMasses', 'Rivers', 'DryTerran', 'GasPlanet', 'GasPlanetLayers', 'IceWorld', 'LavaWorld', 'NoAtmosphere', 'Asteroids', 'BlackHole', 'Galaxy']
def glsl(src):
    src = re.sub(r'/\*.*?\*/', '', src, flags=re.S); src = re.sub(r'//[^\n]*', '', src)
    src = re.sub(r'^\s*(shader_type|render_mode)[^\n]*\n', '', src, flags=re.M)
    def uni(m):
        t, n1, nom, n2 = m.group(1), m.group(2), m.group(3), m.group(4)
        n = n1 or n2
        return f'uniform {t} {nom}{"[" + n + "]" if n else ""};'
    src = re.sub(r'uniform\s+(\w+)\s*(?:\[(\d+)\])?\s+(\w+)\s*(?:\[(\d+)\])?\s*(?::[^=;]*)?(?:=[^;]*)?;', uni, src)
    src = re.sub(r'void\s+fragment\s*\(\s*\)', 'void main()', src)
    src = re.sub(r'\bCOLOR\b', 'o', src)
    src = re.sub(r'(Cells\(.*), (\d+)\);', r'\1, \2.0);', src)  # Godot convertit seul les entiers en flottants, pas WebGL
    assert 'TIME' not in src and 'texture(' not in src, 'non pris en charge'
    return '#version 300 es\nprecision highp float; in vec2 UV; out vec4 o;\n' + src
def valeur(v):
    v = v.strip()
    if v in ('true', 'false'): return 1 if v == 'true' else 0
    if v == 'null': return 0.0
    m = re.match(r'(PackedColorArray|Vector2|Color)\((.*)\)$', v)
    if m:
        n = [float(x) for x in m.group(2).split(',') if x.strip()]
        if m.group(1) == 'PackedColorArray': return [n[i:i+4] for i in range(0, len(n), 4)]
        if m.group(1) == 'Color': return [n]
        return n
    return float(v)
def defauts(src):
    d = {}
    for m in re.finditer(r'uniform\s+\w+\s+(\w+)\s*(?::[^=;]*)?=\s*([^;]+);', src):
        try: d[m.group(1)] = valeur(m.group(2).replace('vec2', 'Vector2'))
        except Exception: pass
    return d
SH, OUT, SRC = {}, {}, {}
for nom in PLANETES:
    tscn = next((D / 'Planets' / nom).glob('*.tscn')).read_text()
    ext = {'E' + m.group(2): m.group(1) for m in re.finditer(r'\[ext_resource type="Shader" path="res://([^"]+)" id="([^"]+)"\]', tscn)}
    for m in re.finditer(r'\[sub_resource type="Shader" id="([^"]+)"\]\ncode = "((?:[^"\\]|\\.)*)"', tscn, flags=re.S):
        cle = nom + '/' + m.group(1); ext['S' + m.group(1)] = cle; SRC[cle] = m.group(2).replace('\\"', '"')
    mats = {}
    for m in re.finditer(r'\[sub_resource type="ShaderMaterial" id="([^"]+)"\]\n(.*?)(?=\n\[|\Z)', tscn, flags=re.S):
        corps = m.group(2); q = re.search(r'shader = (Ext|Sub)Resource\("([^"]+)"\)', corps); sh = ext[q.group(1)[0] + q.group(2)]
        p = {k: valeur(v) for k, v in re.findall(r'shader_parameter/(\w+) = ([^\n]+)', corps)}
        mats[m.group(1)] = (sh, p)
    rel = re.search(r'relative_scale = ([\d.]+)', tscn); rel = float(rel.group(1)) if rel else 1.0
    gd = next((D / 'Planets' / nom).glob('*.gd')).read_text()
    couches = []
    for m in re.finditer(r'\[node name="(\w+)" type="ColorRect"[^\]]*\]\n(.*?)(?=\n\[|\Z)', tscn, flags=re.S):
        mat = re.search(r'material = SubResource\("([^"]+)"\)', m.group(2))
        if not mat: continue
        n = m.group(1); sh, p = mats[mat.group(1)]
        if sh not in SH:
            src = SRC[sh] if sh in SRC else (D / sh).read_text(); SH[sh] = glsl(src); SH[sh + '#d'] = defauts(src)
        p = {**SH[sh + '#d'], **p}
        px = re.search(r'\$' + n + r'\.material\.set_shader_parameter\("pixels", ([^)\n]+)\)', gd)
        px = px.group(1).replace('amount', '1').replace('relative_scale', str(rel)) if px else '1'
        tf = re.search(r'func update_time\(_?t\):(.*?)(?=\nfunc|\Z)', gd, flags=re.S).group(1)
        tf = re.search(r'\$' + n + r'\.material\.set_shader_parameter\("time", t \* ([^\n]+)\)\s*$', tf, flags=re.M)
        tf = tf.group(1) if tf else '0'
        tf = re.sub(r'get_multiplier\(\$\w+\.material\)', str(round(p.get('size', 1)) * 2.0 / (p.get('time_speed') or 1)), tf)
        tf = re.sub(r'\$\w+\.material\.get_shader_parameter\("(\w+)"\)', lambda q: str(p[q.group(1)]), tf)
        for e in (px, tf): assert re.fullmatch(r'[\d.\s*+/()-]+', e), (nom, n, e)
        couches.append({'sh': sh, 'p': p, 'px': eval(px), 'tf': eval(tf)})
    OUT[nom] = couches
s = ('/* Planètes du Pixel Planet Generator de Deep-Fold (MIT, https://github.com/Deep-Fold/PixelPlanets), shaders passés en WebGL 2 ;\n'
     '   fabriqué par outils/strategie-ciel/shaders.py */\nwindow.SC_SHADERS=' +
     json.dumps({'sh': {k: v for k, v in SH.items() if not k.endswith('#d')}, 'planetes': OUT}, separators=(',', ':')) + ';\n')
(R / 'strategie-ciel/shaders.js').write_text(s)
print(len(s) // 1024, 'Ko'); [print(k, [(pathlib.Path(c['sh']).stem, c['px'], round(c['tf'], 3)) for c in v]) for k, v in OUT.items()]
