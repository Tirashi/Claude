# Convertit des modèles glTF du pack KayKit (CC0, Kay Lousberg) en tableaux compacts pour Three.js.
# Usage : python3 outils/kaykit-conversion.py <dossier gltf/glb> <sortie.js> nom1,nom2,… [VARIABLE] [echelle] [decalage y] [atlas.png]
# (Kenney Hexagon Kit : KENNEY 2 -0.4 « GLB format/Textures/colormap.png », pour avoir des tuiles de 2 comme KayKit)
# Sortie : window.KAYKIT = {nom: [sommets, indices, base64]} et window.KAYKIT_TEX (atlas PNG) ; lecture : maquettes/duche-kaykit.html.
IMG = sys.argv[7] if len(sys.argv) > 7 else None
idx = {}
for d, _, fs in os.walk(src):
    for f in fs:
        if f.endswith('.gltf'): idx[f[:-5]] = os.path.join(d, f)
        if f.endswith('.glb'): idx[f[:-4]] = os.path.join(d, f)
def matmul(a, b):
    return [sum(a[r+4*k]*b[k+4*c] for k in range(4)) for c in range(4) for r in range(4)][::1] if False else [sum(a[k*4+r]*b[c*4+k] for k in range(4)) for c in range(4) for r in range(4)]
def node_mat(n):
    if 'matrix' in n: return n['matrix']
    t = n.get('translation', [0,0,0]); q = n.get('rotation', [0,0,0,1]); s = n.get('scale', [1,1,1])
    x,y,z,w = q
    r = [1-2*(y*y+z*z), 2*(x*y+z*w), 2*(x*z-y*w), 0,
         2*(x*y-z*w), 1-2*(x*x+z*z), 2*(y*z+x*w), 0,
         2*(x*z+y*w), 2*(y*z-x*w), 1-2*(x*x+y*y), 0, 0,0,0,1]
    for c in range(3):
        for k in range(3): r[c*4+k] *= s[c]
    r[12],r[13],r[14] = t
    return r
res = {}
for nm in names:
    p = idx[nm]; d = os.path.dirname(p)
    if p.endswith('.glb'):
        raw = open(p, 'rb').read(); l = struct.unpack_from('<I', raw, 12)[0]
        g = json.loads(raw[20:20+l]); bufs = [raw[20+l+8:]]
    else:
        g = json.load(open(p)); bufs = [open(os.path.join(d, b['uri']), 'rb').read() for b in g['buffers']]
    def acc(i):
        a = g['accessors'][i]; v = g['bufferViews'][a['bufferView']]
        n = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
        fmt = {5126:'f',5123:'H',5125:'I',5121:'B'}[a['componentType']]
        sz = struct.calcsize(fmt); stride = v.get('byteStride', sz*n)
        off = v.get('byteOffset',0)+a.get('byteOffset',0); b = bufs[v['buffer']]
        return [struct.unpack_from('<'+fmt*n, b, off+stride*j) for j in range(a['count'])]
    P=[];N=[];U=[];I=[]
    def walk(ni, M):
        n = g['nodes'][ni]; W = matmul(M, node_mat(n))
        if 'mesh' in n:
            for pr in g['meshes'][n['mesh']]['primitives']:
                base = len(P)
                for x,y,z in acc(pr['attributes']['POSITION']):
                    P.append((W[0]*x+W[4]*y+W[8]*z+W[12], W[1]*x+W[5]*y+W[9]*z+W[13], W[2]*x+W[6]*y+W[10]*z+W[14]))
                for x,y,z in acc(pr['attributes']['NORMAL']):
                    a=(W[0]*x+W[4]*y+W[8]*z, W[1]*x+W[5]*y+W[9]*z, W[2]*x+W[6]*y+W[10]*z); l=math.sqrt(sum(c*c for c in a)) or 1
                    N.append(tuple(c/l for c in a))
                U.extend(acc(pr['attributes']['TEXCOORD_0']))
                I.extend(base+i[0] for i in acc(pr['indices']))
        for c in n.get('children', []): walk(c, W)
    I4 = [ECH,0,0,0,0,ECH,0,0,0,0,ECH,0,0,DY,0,1]
    for r in g['scenes'][g.get('scene',0)]['nodes']: walk(r, I4)
    # positions/normals en Int16 (pos × 4096 ; normales × 32767), uv en Uint16 (× 65535)
    q = lambda v,s: max(-32768,min(32767,round(v*s)))
    pb = struct.pack('<%dh'%(len(P)*3), *[q(c,4096) for v in P for c in v])
    nb = struct.pack('<%db'%(len(N)*3), *[max(-127,min(127,round(c*127))) for v in N for c in v])
    ub = struct.pack('<%dH'%(len(U)*2), *[max(0,min(65535,round(c*65535))) for v in U for c in v])
    ib = struct.pack(('<%dH' if len(P)<65536 else '<%dI')%len(I), *I)
    res[nm] = [len(P), len(I), base64.b64encode(pb+nb+ub+ib).decode()]
img = IMG or os.path.join(src, '..', '..', 'Textures', 'hexagons_medieval.png')
js = 'window.'+VAR+'=' + json.dumps(res, separators=(',',':')) + ';\nwindow.'+VAR+'_TEX="data:image/png;base64,' + base64.b64encode(open(img,'rb').read()).decode() + '";\n'
open(out,'w').write(js); print(len(js), {k:v[0] for k,v in res.items()})
