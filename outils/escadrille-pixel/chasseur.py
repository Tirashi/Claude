# Dessine un chasseur vu de dos en pixel art, sous 16 angles de tonneau et 3 inclinaisons, avec des rampes de couleurs à la main.
import sys,math,json
from PIL import Image,ImageDraw
FW,FH=64,40
GRIS=['#16171c','#2c2f37','#454955','#646a78','#8e95a3','#c3c8d0']
ROUGE=['#4a1c14','#9c2f22','#c8402e','#ec6a3a']
CONTOUR=(16,17,22,255)
def hexa(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))+(255,)
def rot(p,a): x,y=p; return (x*math.cos(a)-y*math.sin(a), x*math.sin(a)+y*math.cos(a))
def image(roll,pitch):
    im=Image.new('RGBA',(FW,FH),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx,cy=FW/2,FH*.62
    e=.5+pitch*.2          # combien on voit le dessus : plus en piqué, moins en cabré
    av=lambda L:(0,-L*e)     # « vers l'avant » = vers le haut de l'écran
    def P(pts,a=roll,dy=0): return [(cx+rot(p,a)[0]+q[0], cy-rot(p,a)[1]+q[1]+dy) for p,q in pts]
    haut=math.cos(roll)      # >0 : on voit le dessus de l'avion
    # surface vue : dessus (clair) ou dessous (sombre)
    def ton(dessus): return GRIS[3] if dessus else GRIS[2]
    def aile(s,env,racine,corde_r,corde_b,y0=0,die=.1,coul=None):
        r=(s*racine,y0); b=(s*env,y0+env*die)
        bord=[(r,(0,0)),(b,(0,0)),(b,av(corde_b)),(r,av(corde_r))]
        pts=P(bord); vis=haut>0
        d.polygon(pts,fill=ton(vis) if not coul else coul)
        # arête : bord d'attaque clair (dessus) ou bord de fuite sombre
        if vis: d.line([pts[3],pts[2]],fill=GRIS[4]); d.line([pts[0],pts[1]],fill=GRIS[2])
        else: d.line([pts[0],pts[1]],fill=GRIS[0]); d.line([pts[3],pts[2]],fill=GRIS[2])
        return pts
    # 1. ailes principales et bouts d'ailes rouges
    for s in (1,-1):
        pts=aile(s,17,3.5,17,5)
        tip=P([((s*15.6,1.6),(0,0)),((s*17.4,1.75),(0,0)),((s*17.4,1.75),av(5)),((s*15.6,1.6),av(6.5))]); d.polygon(tip,fill=ROUGE[2] if haut>0 else ROUGE[1])
    # 2. empennage horizontal
    for s in (1,-1): aile(s,8,3,6,4,y0=.6,die=-.05)
    # 3. fuselage : un fuseau vu de l'arrière, ombré de gauche à droite (lumière en haut à gauche)
    for k in range(9,-1,-1):
        L=k*1.9; rx=4.6-max(0,k-5)*.8; ry=3.8-max(0,k-5)*.6
        pts=[]
        for j in range(16):
            a=j/16*2*math.pi; pts.append(((rx*math.cos(a),ry*math.sin(a)),av(L)))
        poly=P(pts); d.polygon(poly,fill=GRIS[2])
    # ombrage du cul du fuselage : quarts éclairés selon la lumière
    for j in range(16):
        a=j/16*2*math.pi; n=rot((math.cos(a),math.sin(a)),roll); l=-.6*n[0]+.8*n[1]
        c=GRIS[4] if l>.55 else GRIS[3] if l>.1 else GRIS[2] if l>-.4 else GRIS[1]
        p1=P([((4.6*math.cos(a),3.8*math.sin(a)),(0,0))])[0]; p2=P([((4.6*math.cos(a+.4),3.8*math.sin(a+.4)),(0,0))])[0]
        d.polygon([P([((0,0),(0,0))])[0],p1,p2],fill=c)
    # bande rouge sur le dos et verrière (seulement si on voit le dessus)
    if haut>-.2:
        bande=P([((-.7,3.7),av(1)),((.7,3.7),av(1)),((.7,3.2),av(16)),((-.7,3.2),av(16))]); d.polygon(bande,fill=ROUGE[2])
    if haut>.15:
        v=P([((-1.8,3.4),av(10)),((1.8,3.4),av(10)),((1.3,3.1),av(16)),((-1.3,3.1),av(16))]); d.polygon(v,fill='#3c7fb8'); d.point(P([((-.6,3.5),av(12))])[0],fill='#cfe8ff');d.point(P([((-.2,3.5),av(13))])[0],fill='#cfe8ff')
    # 4. dérives (double, inclinées vers l'extérieur)
    for s in (1,-1):
        base=(s*2.3,3.1); som=(s*5.2,11.5)
        pts=P([(base,(0,0)),(som,av(1.5)),(som,av(5)),(base,av(8))]); d.polygon(pts,fill=GRIS[3] if s*math.cos(roll)<0 or True else GRIS[2])
        d.line([pts[1],pts[2]],fill=ROUGE[2]); d.line([pts[2],pts[3]],fill=GRIS[4])
    # 5. tuyères
    tuy=[]
    for s in (1,-1):
        c=P([((s*2.2,-.4),(0,0))])[0]; tuy.append(c)
        d.ellipse([c[0]-3,c[1]-2.8,c[0]+3,c[1]+2.8],fill=GRIS[1]); d.ellipse([c[0]-2.2,c[1]-2,c[0]+2.2,c[1]+2],fill=GRIS[0]); d.ellipse([c[0]-1.4,c[1]-1.3,c[0]+1.4,c[1]+1.3],fill='#ff8a2a'); d.point((round(c[0]),round(c[1])),fill='#ffe080')
    # contour sombre d'un pixel
    a=im.load(); m=[[a[x,y][3]>0 for y in range(FH)] for x in range(FW)]
    for x in range(FW):
        for y in range(FH):
            if not m[x][y] and any(0<=x+dx<FW and 0<=y+dy<FH and m[x+dx][y+dy] for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): a[x,y]=CONTOUR
    return im,[(round(c[0]),round(c[1])) for c in tuy]
if __name__=='__main__':
    NR=16; P=[-1,0,1]; sheet=Image.new('RGBA',(FW*NR,FH*len(P))); tu={}
    for j,p in enumerate(P):
        for i in range(NR):
            im,t=image(i/NR*2*math.pi,p); sheet.alpha_composite(im,(i*FW,j*FH)); tu[f'{i},{j}']=t
    sheet.save(sys.argv[1]); json.dump({'w':FW,'h':FH,'nr':NR,'tuyeres':tu},open(sys.argv[1]+'.json','w'))
