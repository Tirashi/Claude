# Outils communs : grille de couleurs (X, Y, Z = hauteur, RGBA) → ruban de tranches, avec intérieur rempli et dessus éclairés.
import numpy as np, json, os
from PIL import Image
def remplir(s):
    p=np.pad(~s,1,constant_values=True); d=np.zeros_like(p); d[0]=d[-1]=True; d[:,0]=d[:,-1]=True; d[:,:,0]=d[:,:,-1]=True; d&=p
    while True:
        n=d.copy(); n[1:]|=d[:-1]; n[:-1]|=d[1:]; n[:,1:]|=d[:,:-1]; n[:,:-1]|=d[:,1:]; n[:,:,1:]|=d[:,:,:-1]; n[:,:,:-1]|=d[:,:,1:]; n&=p
        if (n==d).all(): return ~d[1:-1,1:-1,1:-1]
        d=n
def ecrire(c, sortie, teinte=None, eclaire=1.13):
    """c : (X,Y,Z,4) uint8, Y vers le « nord » de l'image, Z vers le haut."""
    plein=c[...,3]>0; tout=remplir(plein)
    X,Y,Z=plein.shape
    for z in range(Z-2,-1,-1):
        m=tout[:,:,z]&~plein[:,:,z]; c[:,:,z][m]=c[:,:,z+1][m]; c[:,:,z,3][m]=255
    plein=tout
    c=c.astype(float)
    if teinte is not None: c[...,:3]=c[...,:3]/255*np.array(teinte)
    # dessus éclairés, dessous assombris
    dessus=plein.copy(); dessus[:,:,:-1]&=~plein[:,:,1:]
    c[...,:3][dessus]*=eclaire
    c=np.clip(c,0,255).astype(np.uint8); c[...,3]=np.where(plein,255,0)
    xs,ys,zs=np.nonzero(plein); c=c[xs.min():xs.max()+1,ys.min():ys.max()+1,zs.min():zs.max()+1]; X,Y,Z=c.shape[:3]
    img=np.zeros((Y,X*Z,4),np.uint8)
    for z in range(Z): img[:,z*X:(z+1)*X]=c[:,::-1,z].transpose(1,0,2)
    Image.fromarray(img).save(sortie)
    j=os.path.join(os.path.dirname(sortie),'tailles.json'); d=json.load(open(j)) if os.path.exists(j) else {}
    d[os.path.basename(sortie)]=[X,Y,Z]; json.dump(d,open(j,'w')); return X,Y,Z
