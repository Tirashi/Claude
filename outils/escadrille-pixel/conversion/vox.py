import sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
# Lit un .vox (MagicaVoxel) et écrit un ruban de tranches par modèle (axe Z = hauteur), intérieur rempli.
import sys, struct, os, numpy as np
from PIL import Image
DEFAUT=None
def lire(f):
    b=open(f,'rb').read(); assert b[:4]==b'VOX '
    i=8; modeles=[]; pal=None; taille=None
    def chunks(i,fin):
        while i<fin:
            cid=b[i:i+4]; n,m=struct.unpack('<ii',b[i+4:i+12]); yield cid,b[i+12:i+12+n]; 
            if cid==b'MAIN': yield from chunks(i+12+n,i+12+n+m)
            i+=12+n+m
    for cid,d in chunks(8,len(b)):
        if cid==b'SIZE': taille=struct.unpack('<iii',d[:12])
        elif cid==b'XYZI':
            n=struct.unpack('<i',d[:4])[0]; v=np.frombuffer(d[4:4+4*n],np.uint8).reshape(-1,4); modeles.append((taille,v))
        elif cid==b'RGBA': pal=np.frombuffer(d[:1024],np.uint8).reshape(256,4)
    if pal is None:
        # palette par défaut de MagicaVoxel : cube 6×6×6 (sans le noir) puis rampes rouge, vert, bleu, gris
        v=[0xff,0xcc,0x99,0x66,0x33,0x00]; d=[]
        for r in v:
            for g in v:
                for b_ in v: d.append((r,g,b_))
        d=d[:-1]; ramp=[0xee,0xdd,0xbb,0xaa,0x88,0x77,0x55,0x44,0x22,0x11]
        d+= [(x,0,0) for x in ramp]+[(0,x,0) for x in ramp]+[(0,0,x) for x in ramp]+[(x,x,x) for x in ramp]
        pal=np.zeros((256,4),np.uint8); pal[:255,:3]=d; pal[:,3]=255
    return modeles,pal
def remplir(s):
    # tout ce qui n'est pas joignable depuis le bord (dilatations successives, numpy)
    p=np.pad(~s,1); dehors=np.zeros_like(p); dehors[0,:,:]=dehors[-1,:,:]=dehors[:,0,:]=dehors[:,-1,:]=dehors[:,:,0]=dehors[:,:,-1]=True
    dehors&=p
    while True:
        n=dehors.copy()
        n[1:]|=dehors[:-1]; n[:-1]|=dehors[1:]; n[:,1:]|=dehors[:,:-1]; n[:,:-1]|=dehors[:,1:]; n[:,:,1:]|=dehors[:,:,:-1]; n[:,:,:-1]|=dehors[:,:,1:]
        n&=p
        if (n==dehors).all(): break
        dehors=n
    return ~dehors[1:-1,1:-1,1:-1]
def ruban(taille,v,pal,sortie):
    X,Y,Z=taille; g=np.zeros((X,Y,Z),np.uint8); g[v[:,0],v[:,1],v[:,2]]=v[:,3]
    plein=remplir(g>0)
    # couleur des cases remplies : celle de la case au-dessus
    for z in range(Z-2,-1,-1):
        m=plein[:,:,z]&(g[:,:,z]==0); g[:,:,z][m]=g[:,:,z+1][m]
    xs,ys,zs=np.nonzero(g); 
    if len(xs)==0: return None
    g=g[xs.min():xs.max()+1,ys.min():ys.max()+1,zs.min():zs.max()+1]; X,Y,Z=g.shape
    img=np.zeros((Y,X*Z,4),np.uint8)
    for z in range(Z):
        s=g[:,:,z].T[::-1]   # y vers le haut dans MagicaVoxel
        c=pal[(s.astype(int)-1)%256].copy(); c[s==0]=0
        img[:,z*X:(z+1)*X]=c
    Image.fromarray(img).save(sortie); return X,Y,Z
def ruban2(taille,v,pal,sortie,teinte=None):
    import piles
    X,Y,Z=taille; c=np.zeros((X,Y,Z,4),np.uint8); c[v[:,0],v[:,1],v[:,2]]=pal[(v[:,3].astype(int)-1)%256]; c[v[:,0],v[:,1],v[:,2],3]=255
    return piles.ecrire(c,sortie,teinte=teinte)
if __name__=='__main__':
    src,dest=sys.argv[1],sys.argv[2]; os.makedirs(dest,exist_ok=True)
    mods,pal=lire(src); base=os.path.splitext(os.path.basename(src))[0].replace(' ','_')
    for k,(t,v) in enumerate(mods):
        nom=f'{dest}/{base}' + (f'_{k}' if len(mods)>1 else '') + '.png'
        te=os.environ.get('TEINTE'); r=ruban2(t,v,pal,nom,[int(x) for x in te.split(',')] if te else None); print(os.path.basename(nom), r)
        if False:
            import json; j=f'{dest}/tailles.json'; d=json.load(open(j)) if os.path.exists(j) else {}
            d[os.path.basename(nom)]=r; json.dump(d,open(j,'w'))
