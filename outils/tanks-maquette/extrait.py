# Découpe la scène OBJ du pack en groupes, simplifie les tanks, sort JSON gzip base64.
import sys, json, gzip, base64, math
src, out = sys.argv[1], sys.argv[2]
V=[];objs={};cur=None
for line in open(src,errors='ignore'):
    if line.startswith('v '): V.append(tuple(map(float,line.split()[1:4])))
    elif line.startswith('o '): cur=objs.setdefault(line[2:].strip(),[]); mat=None
    elif line.startswith('usemtl'): mat=line.split()[1]
    elif line.startswith('f '):
        ix=[int(p.split('/')[0])-1 for p in line.split()[1:]]
        for k in range(1,len(ix)-1): cur.append((ix[0],ix[k],ix[k+1],mat))
TANKS=['Cylinder.062_Cylinder.123','Cube.047_Cube.041','Cylinder.032_Cylinder.076','Cube.046_Cube.021']
MISS=['Cube.026_Cube.031','Cube.025_Cube.030','Cube.021_Cube.027']
CAISSE=['Cube.020','Cylinder.002','Cylinder.003','Cylinder.004','Cube.019','Cube.022','Cube.023_Cube.025','Cube.024_Cube.026']
SKIP=set(TANKS+MISS+CAISSE+['Circle','Plane','Plane.001_Plane.002','Plane.002_Plane.001'])
groupes={
 'tank':(['Cylinder.032_Cylinder.076'],0.009),
 'obus':(['Cube.026_Cube.031'],0),
 'caisse':(CAISSE,0),
 'arene':([n for n in objs if n not in SKIP and n!='Plane.003'],0),
 'sol':(['Plane.003'],0),
}
def tri_list(names):
    return [t for n in names for t in objs[n]]
res={}
for g,(names,grid) in groupes.items():
    tris=tri_list(names)
    pts=[V[i] for t in tris for i in t[:3]]
    mn=[min(p[k] for p in pts) for k in range(3)]; mx=[max(p[k] for p in pts) for k in range(3)]
    if g not in ('arene','sol'):  # recentrer : x,z au milieu, y au sol
        o=[(mn[0]+mx[0])/2,mn[1],(mn[2]+mx[2])/2]
    else: o=[0,2.62,0]
    mats={}
    for a,b,c,m in tris:
        if g=='tank' and (V[a][1]+V[b][1]+V[c][1])/3-o[1]>0.27: m=m+'|T'   # tourelle : au-dessus de la coque
        d=mats.setdefault(m,{'map':{},'p':[],'i':[]})
        key=[]
        for vi in (a,b,c):
            v=V[vi]; q=tuple(round((v[k]-o[k])/grid) if grid else round((v[k]-o[k])*1000) for k in range(3))
            key.append(q)
        if len(set(key))<3: continue
        for q in key:
            if q not in d['map']:
                d['map'][q]=len(d['p'])//3
                d['p'].extend((q[0]*grid*1000 if grid else q[0], q[1]*grid*1000 if grid else q[1], q[2]*grid*1000 if grid else q[2]))
            d['i'].append(d['map'][q])
    # dédoublonner les triangles
    for m,d in mats.items():
        seen=set();ni=[]
        for k in range(0,len(d['i']),3):
            t=tuple(sorted(d['i'][k:k+3]))
            if t in seen: continue
            seen.add(t); ni+=d['i'][k:k+3]
        d['i']=ni
    res[g]={m:{'p':[round(x) for x in d['p']],'i':d['i']} for m,d in mats.items()}
    if g=='tank':  # coque et tourelle séparées ; pivot = milieu du bas de la tourelle
        res['tourelle']={m[:-2]:v for m,v in res[g].items() if m.endswith('|T')}
        res[g]={m:v for m,v in res[g].items() if not m.endswith('|T')}
        bas=[(v['p'][i],v['p'][i+2]) for v in res['tourelle'].values() for i in range(0,len(v['p']),3) if v['p'][i+1]<330]
        res['pivot']=[round((min(q[0] for q in bas)+max(q[0] for q in bas))/2),round((min(q[1] for q in bas)+max(q[1] for q in bas))/2)]
        print('pivot', res['pivot'], 'tourelle', {m:len(v['i'])//3 for m,v in res['tourelle'].items()})
    print(g, {m:len(d['i'])//3 for m,d in res[g].items()}, 'taille', [round(mx[k]-mn[k],2) for k in range(3)])
# obstacles du terrain : coupe de chaque objet à 0,13 au-dessus du sol
Y0=2.75
obs=[]
for n,tris in objs.items():
    if n in SKIP or not tris: continue
    pts=[]
    for t in tris:
        for u,w in ((t[0],t[1]),(t[1],t[2]),(t[2],t[0])):
            A,B=V[u],V[w]
            if (A[1]-Y0)*(B[1]-Y0)<0:
                k=(Y0-A[1])/(B[1]-A[1]); pts.append((A[0]+(B[0]-A[0])*k,A[2]+(B[2]-A[2])*k))
    if not pts: continue
    xs=[p[0] for p in pts]; zs=[p[1] for p in pts]
    cx=(min(xs)+max(xs))/2; cz=(min(zs)+max(zs))/2
    r=max(max(xs)-min(xs),max(zs)-min(zs))/2*0.85
    if abs(cx)-r>6 or abs(cz)-r>6 or r<0.1: continue
    h=max(V[i][1] for t in tris for i in t[:3])-2.62
    obs.append([round(cx,2),round(cz,2),round(r,2),round(h,2),n.split('.')[0]])
print(len(obs),'obstacles', obs)
res['obstacles']=obs
open(out,'w').write(base64.b64encode(gzip.compress(json.dumps(res,separators=(',',':')).encode(),9)).decode())
import os; print('b64', os.path.getsize(out))
