# Convertit les glTF d'Ultimate Fantasy RTS en un paquet compact :
# par modèle et par matériau, positions quantifiées int16 (sur la boîte du modèle) + indices uint16/uint32.
# Sortie : JSON d'en-tête + binaire, le tout gzippé puis en base64.
import json, base64, struct, sys, os, gzip, io, glob
src, out = sys.argv[1], sys.argv[2]
noms = sys.argv[3].split(",") if len(sys.argv) > 3 else [os.path.basename(f)[:-5] for f in sorted(glob.glob(src + "/*.gltf"))]
CT = {5120:'b',5121:'B',5122:'h',5123:'H',5125:'I',5126:'f'}; NC = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def lire(g, bufs, i):
    a = g['accessors'][i]; bv = g['bufferViews'][a['bufferView']]
    n = NC[a['type']]; c = CT[a['componentType']]; sz = struct.calcsize(c)
    off = bv.get('byteOffset',0) + a.get('byteOffset',0); st = bv.get('byteStride', n*sz)
    b = bufs[bv['buffer']]; r = []
    for k in range(a['count']):
        r.append(struct.unpack_from('<' + c*n, b, off + k*st))
    return r
def mat4(n):
    import math
    T = n.get('translation',[0,0,0]); Q = n.get('rotation',[0,0,0,1]); S = n.get('scale',[1,1,1])
    x,y,z,w = Q
    R = [[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
    return [[R[i][j]*S[j] for j in range(3)] + [T[i]] for i in range(3)] + [[0,0,0,1]]
def mul(A,B): return [[sum(A[i][k]*B[k][j] for k in range(4)) for j in range(4)] for i in range(4)]
couleurs = {}; tete = []; bin_ = io.BytesIO()
for nom in noms:
    g = json.load(open(f"{src}/{nom}.gltf"))
    bufs = [base64.b64decode(b['uri'].split(',',1)[1]) for b in g['buffers']]
    parts = {}
    def visite(ni, M):
        n = g['nodes'][ni]; M2 = mul(M, mat4(n))
        if 'mesh' in n:
            for p in g['meshes'][n['mesh']]['primitives']:
                m = g['materials'][p.get('material',0)]
                mn = m['name']; couleurs[mn] = [round(v,4) for v in m['pbrMetallicRoughness'].get('baseColorFactor',[1,1,1,1])[:3]]
                pos = [tuple(M2[i][0]*v[0]+M2[i][1]*v[1]+M2[i][2]*v[2]+M2[i][3] for i in range(3)) for v in lire(g,bufs,p['attributes']['POSITION'])]
                idx = [i[0] for i in lire(g,bufs,p['indices'])]
                P = parts.setdefault(mn, [[],[]]); base = len(P[0]); P[0] += pos; P[1] += [i+base for i in idx]
        for c in n.get('children',[]): visite(c, M2)
    I = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]
    for ni in g['scenes'][g.get('scene',0)]['nodes']: visite(ni, I)
    allp = [v for P in parts.values() for v in P[0]]
    lo = [min(v[i] for v in allp) for i in range(3)]; hi = [max(v[i] for v in allp) for i in range(3)]
    ent = {'n':nom,'lo':[round(x,5) for x in lo],'hi':[round(x,5) for x in hi],'p':[]}
    for mn,(pos,idx) in parts.items():
        # dédoublonne les sommets (positions identiques) pour gagner de la place
        d = {}; np_ = []; remap = []
        for v in pos:
            q = tuple(int(round((v[i]-lo[i])/((hi[i]-lo[i]) or 1)*65535))-32768 for i in range(3))
            if q not in d: d[q] = len(np_); np_.append(q)
            remap.append(d[q])
        idx = [remap[i] for i in idx]
        big = len(np_) > 65535
        o = bin_.tell(); bin_.write(struct.pack('<%dh' % (3*len(np_)), *[c for q in np_ for c in q]))
        if bin_.tell() % 4: bin_.write(b'\0'*(4-bin_.tell()%4))
        oi = bin_.tell(); bin_.write(struct.pack('<%d%s' % (len(idx), 'I' if big else 'H'), *idx))
        if bin_.tell() % 4: bin_.write(b'\0'*(4-bin_.tell()%4))
        ent['p'].append([mn, o, len(np_), oi, len(idx), 1 if big else 0])
    tete.append(ent)
h = json.dumps({'mod':tete,'col':couleurs}, separators=(',',':')).encode()
raw = struct.pack('<I', len(h)) + h + b'\0'*((4 - (4+len(h)) % 4) % 4) + bin_.getvalue()
z = gzip.compress(raw, 9)
open(out,'w').write(base64.b64encode(z).decode())
print(len(noms), 'modèles, brut', len(raw)//1024, 'Ko, gzip', len(z)//1024, 'Ko, base64', len(z)*4//3//1024, 'Ko')
