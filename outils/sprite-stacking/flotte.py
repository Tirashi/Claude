# Chantier naval en voxels : construit les 11 navires d'Amiral ! (grille x = largeur, y = longueur, proue en haut, z = hauteur)
import sys,os,numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import piles
H=lambda h:[int(h[1:3],16),int(h[3:5],16),int(h[5:7],16),255]
GRIS,GRIS_F,GRIS_C,PONT,ROUGE,NOIR,BLANC,BLEU,ORANGE,BOIS,JAUNE=map(H,['#7f8995','#5b6470','#a9b1ba','#959ca3','#9c3a32','#2a2d33','#e8ebee','#3f557f','#e07a2c','#a8845a','#f2c94c'])
class Navire:
    def __init__(s,L,W,Z=40): s.L,s.W=L,W; s.c=np.zeros((W+2,L,Z,4),np.uint8); s.cx=(W+1)/2
    def boite(s,x0,x1,y0,y1,z0,z1,col):
        s.c[max(0,int(x0)):int(x1),max(0,int(y0)):int(y1),int(z0):int(z1)]=col
    def boiteC(s,w,y0,y1,z0,z1,col):  # centrée en largeur
        s.boite(round(s.cx-w/2),round(s.cx+w/2),y0,y1,z0,z1,col)
    def cyl(s,x,y,r,z0,z1,col):
        for a in range(int(x-r-1),int(x+r+2)):
            for b in range(int(y-r-1),int(y+r+2)):
                if (a-x)**2+(b-y)**2<=r*r and 0<=a<s.c.shape[0] and 0<=b<s.L: s.c[a,b,int(z0):int(z1)]=col
    def coque(s,h,col=GRIS,flot=ROUGE,pont=PONT,proue=.28,poupe=.08,pointe=1):
        L,W=s.L,s.W
        for y in range(L):
            t=y/(L-1); f=1
            if t>1-proue: f=((1-t)/proue)**.75*pointe+ (1-pointe)*.4
            if t<poupe: f=min(f,.75+.25*t/poupe)
            hw=max(.6,W/2*f)
            for x in range(W+2):
                if abs(x-s.cx)<=hw:
                    s.c[x,y,0:2]=flot; s.c[x,y,2:h]=col; s.c[x,y,h-1]=pont
                    if abs(x-s.cx)>hw-1: s.c[x,y,h-1]=GRIS_C
    def tourelle(s,y,z,r=2.6,canons=3,lg=7,sens=1,col=GRIS_F):
        s.cyl(s.cx,y,r,z,z+2,col); s.cyl(s.cx,y,r-.8,z+2,z+3,GRIS)
        for k in range(canons):
            x=round(s.cx+(k-(canons-1)/2)*1.2)
            for d in range(lg): yy=int(y+sens*(r+d))
            for d in range(int(r),int(r+lg)):
                yy=int(y+sens*d)
                if 0<=yy<s.L: s.c[x,yy,z+1]=NOIR
    def mat(s,y,z0,z1,col=NOIR,vergue=3):
        s.boite(round(s.cx),round(s.cx)+1,y,y+1,z0,z1,col)
        s.boite(round(s.cx-vergue),round(s.cx+vergue)+1,y,y+1,z1-3,z1-2,col)
    def cheminee(s,y,z,w=4,lg=5,h=5,col=GRIS_F):
        s.boiteC(w,y,y+lg,z,z+h,col); s.boiteC(w,y,y+lg,z+h-1,z+h,NOIR)
    def ecrire(s,nom,dest): return piles.ecrire(s.c.copy(),f'{dest}/{nom}.png')

def porte_avions(L,W):
    n=Navire(L,W+6); n.coque(9,proue=.18,pointe=.8)
    n.boite(1,W+7,4,L-6,9,11,H('#4a5058'))  # pont d'envol
    for y in range(10,L-12,8): n.boite(round(n.cx)-0.5,round(n.cx)+1,y,y+4,11,12,BLANC)  # axe
    n.boite(3,4,L-26,L-8,11,12,JAUNE)
    n.boite(W+2,W+6,L*.45,L*.62,11,20,GRIS); n.boite(W+2,W+6,L*.45,L*.62,19,20,GRIS_C); n.mat(int(L*.53),20,28)   # îlot sur tribord
    for y in (L*.3,L*.75): n.boite(n.cx-3,n.cx+1,y,y+5,11,13,H('#8f98a3')); n.boite(n.cx-2,n.cx,y+1,y+3,13,14,H('#b8c0c8'))  # avions
    return n
def croiseur_iowa(L,W):
    n=Navire(L,W); n.coque(8,pont=BLEU,proue=.32)
    n.tourelle(L*.78,8,3.2,3,10,1); n.tourelle(L*.66,10,3.2,3,8,1); n.boiteC(W*.55,L*.6,L*.64,8,10,GRIS)
    n.boiteC(W*.6,L*.38,L*.6,8,14,GRIS); n.boiteC(W*.45,L*.48,L*.58,14,19,GRIS_C); n.boiteC(W*.3,L*.52,L*.56,19,24,GRIS)
    n.cheminee(int(L*.42),14,5,5,6); n.cheminee(int(L*.33),12,5,4,5); n.mat(int(L*.54),24,33,vergue=4)
    n.tourelle(L*.2,8,3.2,3,10,-1)
    for y in (L*.3,L*.5): 
        for x in (2,W-1): n.cyl(x,y,1.2,8,10,GRIS_F)
    return n
def atelier(L,W):
    n=Navire(L,W); n.coque(8,pont=BOIS,proue=.22)
    n.boiteC(W*.7,L*.08,L*.3,8,16,GRIS); n.boiteC(W*.5,L*.12,L*.26,16,20,GRIS_C); n.cheminee(int(L*.15),16,4,4,6)
    for y in (L*.42,L*.62,L*.8):  # portiques
        n.boite(1,3,y,y+2,8,22,JAUNE); n.boite(W-1,W+1,y,y+2,8,22,JAUNE); n.boite(1,W+1,y,y+2,21,23,JAUNE)
    n.boite(n.cx-4,n.cx+2,L*.5,L*.58,8,12,ORANGE); n.boite(n.cx-2,n.cx+4,L*.68,L*.75,8,11,H('#5c8a4a'))
    return n
def cuirasse(L,W):
    n=Navire(L,W); n.coque(8,proue=.3)
    n.tourelle(L*.76,8,3,2,8,1); n.tourelle(L*.22,8,3,2,8,-1)
    n.boiteC(W*.6,L*.36,L*.62,8,14,GRIS); n.boiteC(W*.4,L*.46,L*.58,14,20,GRIS_C); n.cheminee(int(L*.38),14,4,5,5); n.mat(int(L*.52),20,28)
    return n
def sous_marin(L,W):
    n=Navire(L,W,20)
    for y in range(L):
        t=y/(L-1); f=min(1,(1-t)/.2,t/.12+.3); hw=W/2*max(.2,f)
        for x in range(W+2):
            d=abs(x-n.cx)
            if d<=hw:
                h=int(5*np.sqrt(max(0,1-(d/(hw+.01))**2)))+1
                n.c[x,y,0:h]=H('#3a414c'); n.c[x,y,h-1]=H('#4d5560')
    n.boiteC(3,L*.55,L*.7,5,11,H('#3a414c')); n.boiteC(3,L*.55,L*.7,10,11,H('#59616c')); n.mat(int(L*.62),11,15,vergue=0)
    n.boite(n.cx-4,n.cx+5,L*.04,L*.06,2,4,H('#3a414c'))
    return n
def mouilleur(L,W):
    n=Navire(L,W); n.coque(7,col=ORANGE,proue=.25)
    n.boiteC(W*.65,L*.55,L*.75,7,13,BLANC); n.boiteC(W*.45,L*.6,L*.72,13,16,GRIS_C); n.cheminee(int(L*.5),12,3,4,5,col=NOIR); n.mat(int(L*.68),16,24)
    for y in range(4,int(L*.48),5):
        for x in (n.cx-3,n.cx+3): n.cyl(x,y,1.5,7,10,NOIR); n.c[int(x),y,10]=ROUGE
    return n
def brouilleur(L,W):
    n=Navire(L,W); n.coque(7,proue=.25)
    n.boiteC(W*.7,L*.4,L*.62,7,13,GRIS); n.boite(0,W+2,L*.55,L*.6,12,13,GRIS_C)  # passerelle à ailerons
    n.mat(int(L*.5),13,24); n.cyl(n.cx,L*.28,3.5,9,10,BLANC); n.cyl(n.cx,L*.28,1,7,9,GRIS_F)  # parabole
    for y in (L*.12,L*.78,L*.84):
        n.cyl(n.cx-2,y,1.3,7,10,GRIS_F); n.cyl(n.cx+2,y,1.3,7,10,GRIS_F)  # pots de fumée
    return n
def destroyer(L,W):
    n=Navire(L,W); n.coque(7,proue=.3)
    n.tourelle(L*.8,7,2.2,1,7,1); n.boiteC(W*.65,L*.5,L*.7,7,13,GRIS); n.boiteC(W*.4,L*.55,L*.66,13,17,GRIS_C); n.mat(int(L*.6),17,26)
    n.boiteC(W*.55,L*.2,L*.42,7,11,GRIS); n.cheminee(int(L*.38),11,3,4,4); n.boiteC(4,L*.08,L*.16,7,9,H('#6a737e'))
    return n
def torpilleur(L,W):
    n=Navire(L,W); n.coque(6,pont=BOIS,proue=.35)
    n.boiteC(W*.6,L*.5,L*.68,6,11,GRIS); n.mat(int(L*.58),11,17,vergue=2)
    for x in (n.cx-2.5,n.cx+2.5): n.boite(x-.5,x+1,L*.15,L*.4,6,8,GRIS_F)
    return n
def vedette(L,W):
    n=Navire(L,W); n.coque(6,col=H('#6f8a6a'),proue=.35)
    n.boiteC(W*.6,L*.45,L*.65,6,10,H('#7f9a78')); n.boiteC(W*.5,L*.12,L*.38,6,9,H('#b0b6a0'))  # porte-leurre
    n.boiteC(W*.3,L*.15,L*.35,9,10,ORANGE); n.mat(int(L*.55),10,15,vergue=2)
    return n
def garde_cote(L,W):
    n=Navire(L,W); n.coque(6,col=BLANC,flot=NOIR,proue=.3)
    for y in range(int(L*.62),int(L*.72)):
        for z in range(2,6): n.c[:,y,z][n.c[:,y,z,3]>0]=H('#d23a2c')
    n.boiteC(W*.65,L*.35,L*.6,6,11,BLANC); n.boiteC(W*.45,L*.42,L*.56,11,13,GRIS_C); n.mat(int(L*.5),13,19,vergue=2); n.cyl(n.cx,L*.5,1,19,20,JAUNE)
    return n
if __name__=='__main__':
    dest=sys.argv[1]; os.makedirs(dest,exist_ok=True); C=int(sys.argv[2]) if len(sys.argv)>2 else 28
    lg=lambda n:n*C-4
    for nom,f,n,W in [('porte_avions',porte_avions,4,14),('croiseur',croiseur_iowa,4,16),('atelier',atelier,4,16),('cuirasse',cuirasse,3,14),('sous_marin',sous_marin,3,8),
                      ('destroyer',destroyer,3,11),('mouilleur',mouilleur,3,13),('brouilleur',brouilleur,3,13),('torpilleur',torpilleur,2,9),('vedette',vedette,2,9),('garde_cote',garde_cote,2,10)]:
        print(nom,f(lg(n),W).ecrire(nom,dest))
