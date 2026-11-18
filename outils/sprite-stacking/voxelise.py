# Découpe un .obj voxel (faces alignées sur les axes, pas 0.1) en tranches pour le sprite stacking.
import sys, numpy as np
from PIL import Image
from collections import deque
def charge(obj, png, pas=0.1):
    V=[];T=[];F=[]
    for l in open(obj):
        p=l.split()
        if not p: continue
        if p[0]=='v': V.append([float(x) for x in p[1:4]])
        elif p[0]=='vt': T.append([float(x) for x in p[1:3]])
        elif p[0]=='f': F.append([(int(a.split('/')[0])-1,int(a.split('/')[1])-1) for a in p[1:]])
    V=np.array(V)/pas; T=np.array(T)
    fr=np.abs(V-np.round(V)); V=V+0.5*(np.median(fr,0)>0.25)
    tex=np.array(Image.open(png).convert('RGBA')); th,tw=tex.shape[:2]
    mn=np.floor(V.min(0)+1e-3).astype(int); mx=np.ceil(V.max(0)-1e-3).astype(int)
    dim=mx-mn
    col=np.zeros((*dim,4),np.uint8); solide=np.zeros(dim,bool)
    for f in F:
        P=V[[a for a,_ in f]]; UV=T[[b for _,b in f]]
        n=np.cross(P[1]-P[0],P[2]-P[0])
        if np.linalg.norm(n)<1e-9: continue
        ax=int(np.argmax(abs(n))); sg=1 if n[ax]>0 else -1
        a,b=[i for i in range(3) if i!=ax]
        plan=round(P[0][ax]); k=plan-mn[ax]-(1 if sg>0 else 0)
        if k<0 or k>=dim[ax]: continue
        lo=np.floor(P[:,[a,b]].min(0)+1e-3).astype(int); hi=np.ceil(P[:,[a,b]].max(0)-1e-3).astype(int)
        Q=P[:,[a,b]]
        M=np.c_[Q,np.ones(len(Q))]; coef=np.linalg.lstsq(M,UV,rcond=None)[0]
        for i in range(lo[0],hi[0]):
            for j in range(lo[1],hi[1]):
                x,y=i+.5,j+.5; dedans=False
                for t in range(len(Q)):
                    x1,y1=Q[t]; x2,y2=Q[t-1]
                    if (y1>y)!=(y2>y) and x < (x2-x1)*(y-y1)/(y2-y1)+x1: dedans=not dedans
                if not dedans: continue
                # couleur prise un peu vers l'intérieur de la case
                uv=np.array([x,y,1])@coef
                px=tex[min(th-1,max(0,int((1-uv[1])*th))),min(tw-1,max(0,int(uv[0]*tw)))]
                idx=[0,0,0]; idx[ax]=k; idx[a]=i-mn[a]; idx[b]=j-mn[b]
                idx=tuple(idx)
                if not solide[idx] or ax==1: col[idx]=px; col[idx][3]=255
                solide[idx]=True
    # remplissage de l'intérieur : tout ce qui n'est pas joignable de l'extérieur
    X,Y,Z=dim; dehors=np.zeros((X+2,Y+2,Z+2),bool); s=np.pad(solide,1)
    dq=deque([(0,0,0)]); dehors[0,0,0]=True
    while dq:
        x,y,z=dq.popleft()
        for dx,dy,dz in ((1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)):
            u,v,w=x+dx,y+dy,z+dz
            if 0<=u<X+2 and 0<=v<Y+2 and 0<=w<Z+2 and not dehors[u,v,w] and not s[u,v,w]:
                dehors[u,v,w]=True; dq.append((u,v,w))
    interieur=~dehors[1:-1,1:-1,1:-1]&~solide
    # couleur de l'intérieur : celle de la case au-dessus (axe Y = hauteur), propagée vers le bas
    for y in range(Y-2,-1,-1):
        m=interieur[:,y,:]; col[:,y,:][m]=col[:,y+1,:][m]
    solide|=interieur
    return col  # (x, y(hauteur), z, rgba)
def tranches(col, sortie):
    X,Y,Z=col.shape[:3]
    img=np.zeros((Z,X*Y,4),np.uint8)
    for y in range(Y):
        img[:,y*X:(y+1)*X]=col[:,y,:].transpose(1,0,2)
    Image.fromarray(img).save(sortie); return X,Y,Z
if __name__=='__main__':
    c=charge(sys.argv[1],sys.argv[2],float(sys.argv[4]) if len(sys.argv)>4 else 0.1); print(sys.argv[3], tranches(c,sys.argv[3]))
