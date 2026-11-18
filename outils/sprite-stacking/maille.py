# Voxelise un .obj quelconque (Kenney : texture colormap) : maille.py <obj> <texture> <sortie.png> <taille d'un voxel> [teinte r,g,b]
import sys, numpy as np; from PIL import Image
sys.path.insert(0, __import__('os').path.dirname(__file__)); import piles
obj,tex,sortie,r=sys.argv[1],sys.argv[2],sys.argv[3],float(sys.argv[4])
V=[];T=[];F=[]
for l in open(obj):
    p=l.split()
    if not p: continue
    if p[0]=='v': V.append([float(x) for x in p[1:4]])
    elif p[0]=='vt': T.append([float(x) for x in p[1:3]])
    elif p[0]=='f':
        q=[(int(a.split('/')[0])-1,int(a.split('/')[1])-1 if len(a.split('/'))>1 and a.split('/')[1] else 0) for a in p[1:]]
        for t in range(1,len(q)-1): F.append((q[0],q[t],q[t+1]))
V=np.array(V); T=np.array(T) if T else np.zeros((1,2))
# OBJ : Y en haut, Z vers l'avant → grille (x, z, y)
if not (len(sys.argv)>5 and sys.argv[5]=='z'): V=V[:,[0,2,1]]*np.array([1,-1,1])
tx=np.array(Image.open(tex).convert('RGBA')); th,tw=tx.shape[:2]
mn=V.min(0); dim=np.ceil((V.max(0)-mn)/r).astype(int)+1
c=np.zeros((*dim,4),np.uint8)
for (a,ta),(b,tb),(d,td) in F:
    A,B,C=V[a],V[b],V[d]; L=max(np.linalg.norm(B-A),np.linalg.norm(C-A),np.linalg.norm(C-B)); n=max(2,int(L/r*2.5)+1)
    i,j=np.meshgrid(np.arange(n+1),np.arange(n+1)); m=i+j<=n; u=(i[m]/n)[:,None]; v=(j[m]/n)[:,None]
    P=A+(B-A)*u+(C-A)*v; UV=T[ta]+(T[tb]-T[ta])*u+(T[td]-T[ta])*v
    idx=np.clip(((P-mn)/r).astype(int),0,dim-1)
    px=tx[np.clip(((UV[:,1] if __import__('os').environ.get('NOFLIP') else 1-UV[:,1])*th).astype(int),0,th-1),np.clip((UV[:,0]*tw).astype(int),0,tw-1)]
    c[idx[:,0],idx[:,1],idx[:,2]]=px; c[idx[:,0],idx[:,1],idx[:,2],3]=255
import os
te=os.environ.get('TEINTE'); print(sortie, piles.ecrire(c,sortie,teinte=[int(x) for x in te.split(',')] if te else None))
