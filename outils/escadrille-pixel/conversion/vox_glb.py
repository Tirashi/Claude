# Reconstruit un avion voxel (.vox, nez vers +X) en GLB : le corps, et chaque hélice à part (nœuds « helice0 », « helice1 »…) centrée sur son moyeu
# vox_glb.py <fichier.vox> <sortie.glb>
import sys,os,json,struct,numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import vox
from helices import helices
PAS=.1
FACES=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),((-1,0,0),[(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),((0,1,0),[(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),
       ((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)])]
def maille(vox_list,occ,pal,origine):
    """faces visibles regroupées en rectangles de même couleur (greedy meshing), tranche par tranche"""
    col={(x,y,z):ci for x,y,z,ci in vox_list}
    P=[];C=[];I=[]
    for ax in range(3):
        u,w=[a for a in range(3) if a!=ax]
        for sens in (1,-1):
            tranches={}
            for p,ci in col.items():
                q=list(p);q[ax]+=sens
                if tuple(q) in occ: continue
                tranches.setdefault(p[ax],{})[(p[u],p[w])]=ci
            for k,g in tranches.items():
                fait=set()
                for (a,b) in sorted(g):
                    if (a,b) in fait: continue
                    c=g[(a,b)];l=1
                    while (a+l,b) in g and g[(a+l,b)]==c and (a+l,b) not in fait: l+=1
                    h=1
                    while all((a+i,b+h) in g and g[(a+i,b+h)]==c and (a+i,b+h) not in fait for i in range(l)): h+=1
                    for i in range(l):
                        for j in range(h): fait.add((a+i,b+j))
                    plan=k+(1 if sens>0 else 0)
                    coins=[(a,b),(a+l,b),(a+l,b+h),(a,b+h)]
                    if sens<0: coins=coins[::-1]
                    if (ax==1): coins=coins[::-1]   # garder l'ordre direct quel que soit l'axe
                    base=len(P)
                    for cu,cw in coins:
                        v=[0,0,0];v[ax]=plan;v[u]=cu;v[w]=cw
                        P.append(((v[0]-origine[0])*PAS,(v[2]-origine[2])*PAS,-(v[1]-origine[1])*PAS));C.append(pal[(c-1)%256][:3].astype(np.uint8))   # couleurs telles quelles (le jeu affiche les textures sans conversion sRGB)
                    I+=[base,base+1,base+2,base,base+2,base+3]
    return np.array(P,np.float32),np.array(C,np.uint8),np.array(I,np.uint32)
def glb(pieces,sortie):
    bin_=bytearray();bvs=[];acc=[];meshes=[];nodes=[]
    def ajoute(arr,cible=None):
        while len(bin_)%4: bin_.append(0)
        o=len(bin_);bin_.extend(arr.tobytes());bvs.append({'buffer':0,'byteOffset':o,'byteLength':arr.nbytes,**({'target':cible} if cible else {})});return len(bvs)-1
    for nom,(P,C,I),t in pieces:
        if not len(I): continue
        a0=len(acc);acc.append({'bufferView':ajoute(P,34962),'componentType':5126,'count':len(P),'type':'VEC3','min':P.min(0).tolist(),'max':P.max(0).tolist()})
        Cp=np.concatenate([C,np.full((len(C),1),255,np.uint8)],1);acc.append({'bufferView':ajoute(Cp,34962),'componentType':5121,'normalized':True,'count':len(C),'type':'VEC4'})
        acc.append({'bufferView':ajoute(I,34963),'componentType':5125,'count':len(I),'type':'SCALAR'})
        meshes.append({'primitives':[{'attributes':{'POSITION':a0,'COLOR_0':a0+1},'indices':a0+2,'material':0}]})
        nodes.append({'name':nom,'mesh':len(meshes)-1,'translation':t})
    while len(bin_)%4: bin_.append(0)
    J={'asset':{'version':'2.0'},'scenes':[{'nodes':list(range(len(nodes)))}],'scene':0,'nodes':nodes,'meshes':meshes,'accessors':acc,'bufferViews':bvs,'buffers':[{'byteLength':len(bin_)}],
       'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':1}}]}
    js=json.dumps(J,separators=(',',':')).encode()
    while len(js)%4: js+=b' '
    out=b'glTF'+struct.pack('<II',2,12+8+len(js)+8+len(bin_))+struct.pack('<I',len(js))+b'JSON'+js+struct.pack('<I',len(bin_))+b'BIN\x00'+bytes(bin_)
    open(sortie,'wb').write(out);return len(out)
if __name__=='__main__':
    (X,Y,Z),v=vox.lire(sys.argv[1])[0][0];pal=vox.lire(sys.argv[1])[1]
    comps=[c for c in helices(v) if max(np.ptp(c[:,1]),np.ptp(c[:,2]))+1>=2.2*(min(np.ptp(c[:,1]),np.ptp(c[:,2]))+1)]
    # deux pales au même x et proches = une hélice
    grp=[]
    for c in comps:
        for g in grp:
            if g[0][0,0]==c[0,0] and min(np.abs(g_[:,1][:,None]-c[:,1][None,:]).min() for g_ in g)<=10 and len(g)<2: g.append(c);break
        else: grp.append([c])
    occ_all={(int(a),int(b),int(d)):int(e) for a,b,d,e in v}
    pale=set();pieces=[]
    for k,g in enumerate(grp):
        pts=np.concatenate(g);centre=pts.mean(0)
        for p in pts: pale.add(tuple(int(x) for x in p))
        hub=(float(centre[0])+.5,float(centre[1])+.5,float(centre[2])+.5)
        lst=[(x,y,z,occ_all[(x,y,z)]) for x,y,z in map(tuple,pts.astype(int).tolist())]
        oc=set((x,y,z) for x,y,z,_ in lst)
        pieces.append((f'helice{k}',maille(lst,oc,pal,hub),[0,0,0]))
        pieces[-1]=(pieces[-1][0],pieces[-1][1],[(hub[0])*PAS,(hub[2])*PAS,-(hub[1])*PAS])
    corps=[(x,y,z,c) for (x,y,z),c in occ_all.items() if (x,y,z) not in pale]
    oc=set((x,y,z) for x,y,z,_ in corps)
    pieces.insert(0,('corps',maille(corps,oc,pal,(0,0,0)),[0,0,0]))
    n=glb(pieces,sys.argv[2]);print(os.path.basename(sys.argv[1]),len(grp),'hélice(s)',n//1024,'Ko')
