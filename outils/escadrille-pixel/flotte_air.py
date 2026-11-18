# Dessine des chasseurs vus de dos en pixel art (plusieurs modèles), sous NR angles de tonneau × 5 inclinaisons.
# flotte_air.py <dossier>  →  <nom>.png + <nom>.json pour chaque modèle
import sys,math,json,os
from PIL import Image,ImageDraw
FW,FH=64,40
CONTOUR=(16,17,22,255)
def rot(p,a): x,y=p; return (x*math.cos(a)-y*math.sin(a), x*math.sin(a)+y*math.cos(a))
MODELES={
 'faucon':dict(nom='FAUCON',rampe=['#16171c','#2c2f37','#454955','#646a78','#8e95a3','#c3c8d0'],accent=['#9c2f22','#c8402e'],verriere='#3c7fb8',
   envergure=17,racine=17,bout=5,fleche=0,diedre=.1,derives='double',reacteurs=2,corps=(4.6,3.8),long=10,helice=False,bande=True),
 'hirondelle':dict(nom='HIRONDELLE',rampe=['#0f1c33','#1d3a66','#2f5a96','#4f80c0','#86b2e2','#dcebf8'],accent=['#c8a020','#f2c94c'],verriere='#ffb040',
   envergure=19,racine=11,bout=6,fleche=4,diedre=.06,derives='simple',reacteurs=1,corps=(4,3.6),long=11,helice=False,bande=True),
 'corsaire':dict(nom='CORSAIRE',rampe=['#1a2414','#2f4224','#486336','#6a8a4a','#9cb878','#e0ecc8'],accent=['#c8a020','#f2c94c'],verriere='#86bdea',
   envergure=20,racine=9,bout=6,fleche=0,diedre=.16,derives='simple',reacteurs=0,corps=(4.2,4.2),long=9,helice=True,bande=False),
 'vipere':dict(nom='VIPERE',rampe=['#1a1010','#3a1a1a','#5a2a24','#7a3a2e','#b0583a','#f0a060'],accent=['#e2682e','#ffe080'],verriere='#7fd0ff',
   envergure=15,racine=15,bout=7,fleche=-3,diedre=-.08,derives='double',reacteurs=2,corps=(5.2,3.4),long=11,helice=False,bande=False,canards=True),
}
def image(roll,pitch,m):
    G=m['rampe'];A=m['accent']
    im=Image.new('RGBA',(FW,FH),(0,0,0,0)); d=ImageDraw.Draw(im)
    cx,cy=FW/2,round(FH*.62)
    e=.5+pitch*.2
    av=lambda L:(0,-L*e)
    def P(pts,a=roll): return [(cx+rot(p,a)[0]+q[0], cy-rot(p,a)[1]+q[1]) for p,q in pts]
    haut=math.cos(roll)
    def aile(s,env,racine,cr,cb,y0=0,die=.1,fl=0,coul=None):
        r=(s*racine,y0); b=(s*env,y0+env*die)
        pts=P([(r,(0,0)),(b,av(fl)),(b,av(fl+cb)),(r,av(cr))]); vis=haut>0
        d.polygon(pts,fill=coul or (G[3] if vis else G[2]))
        if vis: d.line([pts[3],pts[2]],fill=G[4]); d.line([pts[0],pts[1]],fill=G[2])
        else: d.line([pts[0],pts[1]],fill=G[0]); d.line([pts[3],pts[2]],fill=G[2])
        return pts
    E_,R_,B_=m['envergure'],m['racine'],m['bout']
    # ailes principales, bouts colorés
    for s in (1,-1):
        aile(s,E_,3.5,R_,B_,die=m['diedre'],fl=m['fleche'])
        t0,t1=E_-1.8,E_
        tip=P([((s*t0,t0*m['diedre']),av(m['fleche'])),((s*t1,t1*m['diedre']),av(m['fleche'])),((s*t1,t1*m['diedre']),av(m['fleche']+B_)),((s*t0,t0*m['diedre']),av(m['fleche']+B_+1))])
        d.polygon(tip,fill=A[1] if haut>0 else A[0])
    if m.get('canards'):
        for s in (1,-1): aile(s,7,2,4,3,y0=.4,die=0,fl=m['long']*1.4)
    for s in (1,-1): aile(s,8,3,6,4,y0=.6,die=-.05)   # empennage horizontal
    # fuselage
    rx0,ry0=m['corps'];L=m['long']
    for k in range(9,-1,-1):
        Lk=k*L/5; rx=rx0-max(0,k-5)*rx0*.17; ry=ry0-max(0,k-5)*ry0*.16
        d.polygon(P([((rx*math.cos(j/16*2*math.pi),ry*math.sin(j/16*2*math.pi)),av(Lk)) for j in range(16)]),fill=G[2])
    for j in range(16):
        a=j/16*2*math.pi; n=rot((math.cos(a),math.sin(a)),roll); l=-.6*n[0]+.8*n[1]
        c=G[4] if l>.55 else G[3] if l>.1 else G[2] if l>-.4 else G[1]
        p1=P([((rx0*math.cos(a),ry0*math.sin(a)),(0,0))])[0]; p2=P([((rx0*math.cos(a+.4),ry0*math.sin(a+.4)),(0,0))])[0]
        d.polygon([P([((0,0),(0,0))])[0],p1,p2],fill=c)
    if m['bande'] and haut>-.2:
        d.polygon(P([((-.7,ry0-.1),av(1)),((.7,ry0-.1),av(1)),((.7,ry0-.6),av(L*1.6)),((-.7,ry0-.6),av(L*1.6))]),fill=A[1])
    if haut>.15:
        v=P([((-1.8,ry0-.4),av(L)),((1.8,ry0-.4),av(L)),((1.3,ry0-.7),av(L*1.6)),((-1.3,ry0-.7),av(L*1.6))]); d.polygon(v,fill=m['verriere']); d.point(P([((-.6,ry0-.3),av(L*1.2))])[0],fill='#ffffff')
    # dérives
    if m['derives']=='double':
        for s in (1,-1):
            pts=P([((s*2.3,ry0*.8),(0,0)),((s*5.2,11.5),av(1.5)),((s*5.2,11.5),av(5)),((s*2.3,ry0*.8),av(8))]); d.polygon(pts,fill=G[3]); d.line([pts[1],pts[2]],fill=A[1]); d.line([pts[2],pts[3]],fill=G[4])
    else:
        pts=P([((0,ry0*.9),(0,0)),((0,12.5),av(2)),((0,12.5),av(5.5)),((0,ry0*.9),av(9))]); d.polygon(pts,fill=G[3]); d.line(pts[:2],fill=G[2],width=2); d.line([pts[1],pts[2]],fill=A[1]); d.line([pts[0],pts[1]],fill=G[4])
    # tuyères ou hélice
    tuy=[]
    n=m['reacteurs']
    for k in range(n):
        s=0 if n==1 else (1 if k==0 else -1); c=P([((s*2.2,-.4),(0,0))])[0]; tuy.append(c); r=3.2 if n==1 else 3
        d.ellipse([c[0]-r,c[1]-r*.93,c[0]+r,c[1]+r*.93],fill=G[1]); d.ellipse([c[0]-r+.8,c[1]-r+.8,c[0]+r-.8,c[1]+r-.8],fill=G[0]); d.ellipse([c[0]-1.4,c[1]-1.3,c[0]+1.4,c[1]+1.3],fill='#ff8a2a'); d.point((round(c[0]),round(c[1])),fill='#ffe080')
    if m['helice']:
        c=P([((0,0),av(L*1.9))])[0]
        for j in range(24):   # disque d'hélice tramé autour du nez
            a=j/24*2*math.pi; x=c[0]+math.cos(a)*7.5; y=c[1]+math.sin(a)*7.5*e*1.6
            if j%2==0: d.point((round(x),round(y)),fill='#e0ecc8')
        d.ellipse([c[0]-2,c[1]-1.5,c[0]+2,c[1]+1.5],fill=A[1])
        # échappements sous le capot
        for s in (1,-1): ex=P([((s*3.6,-1),av(L*1.2))])[0]; d.point((round(ex[0]),round(ex[1])),fill='#2c2f37')
    a=im.load(); mm=[[a[x,y][3]>0 for y in range(FH)] for x in range(FW)]
    for x in range(FW):
        for y in range(FH):
            if not mm[x][y] and any(0<=x+dx<FW and 0<=y+dy<FH and mm[x+dx][y+dy] for dx,dy in((1,0),(-1,0),(0,1),(0,-1))): a[x,y]=CONTOUR
    return im,[(round(c[0]),round(c[1])) for c in tuy]
if __name__=='__main__':
    dest=sys.argv[1]; os.makedirs(dest,exist_ok=True); NR=32; PI=[-1,-.5,0,.5,1]
    for nom,m in MODELES.items():
        sheet=Image.new('RGBA',(FW*NR,FH*len(PI))); tu={}
        for j,p in enumerate(PI):
            for i in range(NR):
                im,t=image(i/NR*2*math.pi,p,m); sheet.alpha_composite(im,(i*FW,j*FH)); tu[f'{i},{j}']=t
        sheet.save(f'{dest}/{nom}.png'); json.dump({'nom':m['nom'],'w':FW,'h':FH,'nr':NR,'np':len(PI),'tuyeres':tu},open(f'{dest}/{nom}.json','w'))
        print(nom)
