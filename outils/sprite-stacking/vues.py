# 1) dessine 4 vues pixel art d'un bateau (dessus, côté, avant, arrière) ; 2) les découpe en tranches (sculpture par les vues)
import sys,os,numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import piles
H=lambda h:np.array([int(h[1:3],16),int(h[3:5],16),int(h[5:7],16),255],np.uint8)
def toile(h,w): return np.zeros((h,w,4),np.uint8)
def rect(v,y0,y1,x0,x1,c): v[max(0,y0):y1,max(0,x0):x1]=H(c)

def remorqueur():
    L,W,Hh=32,14,18
    top=toile(L,W); side=toile(Hh,L); front=toile(Hh,W); back=toile(Hh,W)
    # dessus (ligne 0 = proue)
    for y in range(L):
        t=y/(L-1); hw=W/2*(min(1,(t/.35)**.6) if t<.35 else (1 if t<.9 else 1-(t-.9)*2))
        for x in range(W):
            if abs(x+.5-W/2)<=hw: top[y,x]=H('#c8352b')
    for y in range(2,L-2):
        for x in range(W):
            if top[y,x,3] and top[max(0,y-2),x,3] and top[min(L-1,y+2),x,3] and 0<x<W-1 and top[y,x-1,3] and top[y,x+1,3]: top[y,x]=H('#8c6a48')  # pont en bois, liseré rouge
    rect(top,12,24,3,11,'#f1efe8'); rect(top,14,20,4,10,'#d9d6cc'); rect(top,19,22,5,9,'#2a2a30'); rect(top,19,20,5,9,'#f2c230')   # cabine, toit, cheminée
    for y in (6,10,26): top[y,0]=H('#222222'); top[y,W-1]=H('#222222')   # pneus
    rect(top,3,6,6,8,'#555555')   # bitte de remorquage
    # côté (colonne = même rang que le dessus ; ligne 0 = en haut)
    for y in range(L):
        t=y/(L-1); bas=Hh-1; haut=11 if t>.3 else 11-int((.3-t)*8)
        if top[y].any(): side[haut:Hh,y]=H('#c8352b'); side[Hh-2:Hh,y]=H('#2a2a30'); side[haut,y]=H('#8c6a48')
    rect(side,6,11,12,24,'#f1efe8'); rect(side,7,9,13,23,'#5fa8d8'); rect(side,5,6,12,24,'#d9d6cc')   # cabine, fenêtres, toit
    rect(side,1,6,19,22,'#2a2a30'); rect(side,2,3,19,22,'#f2c230')   # cheminée
    for y in (6,10,26): side[12:14,y]=H('#222222')
    # avant et arrière
    for v,arr in ((front,0),(back,1)):
        for x in range(W):
            if abs(x+.5-W/2)<=W/2: v[11:Hh,x]=H('#c8352b'); v[Hh-2:Hh,x]=H('#2a2a30'); v[11,x]=H('#8c6a48')
        rect(v,6,11,3,11,'#f1efe8'); rect(v,7,9,4,10,'#5fa8d8' if not arr else '#e0ddd2'); rect(v,5,6,3,11,'#d9d6cc'); rect(v,1,6,5,9,'#2a2a30'); rect(v,2,3,5,9,'#f2c230')
        v[12:14,0]=H('#222222'); v[12:14,W-1]=H('#222222')
    return top,side,front,back

def chalutier():
    L,W,Hh=34,12,22
    top=toile(L,W); side=toile(Hh,L); front=toile(Hh,W); back=toile(Hh,W)
    for y in range(L):
        t=y/(L-1); hw=W/2*(min(1,(t/.4)**.6) if t<.4 else 1-max(0,t-.92)*3)
        for x in range(W):
            if abs(x+.5-W/2)<=hw: top[y,x]=H('#2f6fb0')
    for y in range(3,L-2):
        for x in range(1,W-1):
            if top[y,x-1,3] and top[y,x+1,3] and top[y-2,x,3]: top[y,x]=H('#d8d2c2')
    rect(top,8,16,3,9,'#f4f4ef'); rect(top,9,15,4,8,'#e05a3a')   # timonerie, toit orange
    rect(top,20,32,2,10,'#6e7a50'); rect(top,22,30,3,9,'#86925f')   # filets
    rect(top,17,19,5,7,'#333333')   # mât
    for y in range(L):
        t=y/(L-1); haut=13 if t>.35 else 13-int((.35-t)*12)
        if top[y].any(): side[haut:Hh,y]=H('#2f6fb0'); side[Hh-2:Hh,y]=H('#a8352b'); side[haut,y]=H('#f4f4ef')
    rect(side,7,13,8,16,'#f4f4ef'); rect(side,8,10,9,15,'#5fa8d8'); rect(side,6,7,8,16,'#e05a3a')
    rect(side,1,13,17,19,'#333333'); rect(side,3,4,14,26,'#333333')   # mât et vergue
    rect(side,10,13,20,32,'#6e7a50')
    for v,arr in ((front,0),(back,1)):
        v[13:Hh,:]=H('#2f6fb0'); v[Hh-2:Hh,:]=H('#a8352b'); v[13,:]=H('#f4f4ef')
        rect(v,7,13,3,9,'#f4f4ef'); rect(v,8,10,4,8,'#5fa8d8'); rect(v,6,7,3,9,'#e05a3a'); rect(v,1,13,5,7,'#333333'); rect(v,3,4,1,11,'#333333')
        if arr: rect(v,10,13,2,10,'#6e7a50')
    return top,side,front,back

def sculpter(top,side,front,back):
    """un voxel existe là où toutes les vues en ont un ; dessus = couleur du dessus, bords = couleur de la vue du côté"""
    L,W=top.shape[:2]; Hh=side.shape[0]
    occ=np.zeros((W,L,Hh),bool)
    for z in range(Hh):
        r=Hh-1-z; le_long=side[r,:,3]>0; en_travers=(front[r,:,3]>0)|(back[r,:,3]>0)
        occ[:,:,z]=((top[...,3]>0)&le_long[:,None]&en_travers[None,:]).T
    c=np.zeros((W,L,Hh,4),np.uint8)
    for z in range(Hh):
        r=Hh-1-z
        for x in range(W):
            for y in range(L):
                if not occ[x,y,z]: continue
                dessus=z==Hh-1 or not occ[x,y,z+1]
                bordx=x==0 or x==W-1 or not occ[x-1,y,z] or not occ[x+1,y,z]
                bordy=y==0 or y==L-1 or not occ[x,y-1,z] or not occ[x,y+1,z]
                if dessus: col=top[y,x]
                elif bordy and (y<L/2): col=front[r,x] if front[r,x,3] else top[y,x]
                elif bordy: col=back[r,x] if back[r,x,3] else top[y,x]
                elif bordx: col=side[r,y] if side[r,y,3] else top[y,x]
                else: col=top[y,x]
                c[x,y,z]=col
    return c[:,::-1]   # proue en bas de l'image, comme les bateaux Kenney

if __name__=='__main__':
    dest=sys.argv[1]
    for nom,f in (('remorqueur',remorqueur),('chalutier',chalutier)):
        top,side,front,back=f()
        # planche des 4 vues (2 × 2), comme on la dessinerait à la main
        L,W=top.shape[:2]; Hh=side.shape[0]; g=4
        pl=np.zeros((L+Hh+3*g,max(W+L,2*W)+3*g,4),np.uint8)
        pl[g:g+L,g:g+W]=top; pl[g:g+Hh,2*g+W:2*g+W+L]=side; pl[2*g+L:2*g+L+Hh,g:g+W]=front; pl[2*g+L:2*g+L+Hh,2*g+W:2*g+2*W]=back
        Image.fromarray(pl).save(f'{dest}/{nom}-vues.png')
        print(nom,piles.ecrire(sculpter(top,side,front,back),f'{dest}/{nom}.png',eclaire=1.0))
