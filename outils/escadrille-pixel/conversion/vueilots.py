import json,sys,numpy as np,random
from PIL import Image,ImageDraw
sys.path.insert(0,'.')
from ilots import lire,composantes
d=json.load(open(sys.argv[3] if len(sys.argv)>3 else 'modeles.json'));ks=sys.argv[1].split(',')
out=Image.new('RGB',(900,360*len(ks)),(20,30,40))
for r,k in enumerate(ks):
  j,acc=lire(d[k]['b64']);pr=j['meshes'][0]['primitives'][0];P=acc(pr['attributes']['POSITION']).astype(float);I=acc(pr['indices'])
  T,lab=composantes(P,I)
  idx={};Q=np.round(P,3)
  # positions par sommet fusionné
  V={}
  for i,p in enumerate(Q):V.setdefault(tuple(p),p)
  keys=list(V.keys())
  cle={}; 
  for i,p in enumerate(Q):cle.setdefault(tuple(p),len(cle))
  PV=np.zeros((len(cle),3))
  for t,i in cle.items():PV[i]=t
  mn,mx=PV.min(0),PV.max(0);
  random.seed(1);col={l:tuple(random.randint(60,255) for _ in range(3)) for l in set(lab)}
  im=ImageDraw.Draw(out)
  for vue,(a,b,dep,ox) in enumerate([(0,2,1,0),(0,1,2,450)]):  # dessus (x,z) tri par y ; côté (x,y) tri par z
    s=430/max(mx[a]-mn[a],mx[b]-mn[b])
    ordre=np.argsort(PV[T][:,:,dep].mean(1))
    for t in ordre:
      pts=[(ox+10+(PV[v][a]-mn[a])*s, r*360+20+(PV[v][b]-mn[b])*s*(1 if vue==0 else -1)+(0 if vue==0 else (mx[b]-mn[b])*s)) for v in T[t]]
      im.polygon(pts,fill=col[lab[t]])
  im.text((5,r*360+3),k+' '+str(mx-mn),fill=(255,255,255))
out.save(sys.argv[2])
