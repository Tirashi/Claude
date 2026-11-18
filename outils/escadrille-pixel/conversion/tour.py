import json,sys,numpy as np
from PIL import Image,ImageDraw
sys.path.insert(0,'.')
from ilots import lire,composantes
def detecte(P,I):
  T,lab=composantes(P,I)
  cle={};Q=np.round(P,3)
  for p in Q:cle.setdefault(tuple(p),len(cle))
  PV=np.array(list(cle.keys()))
  L=max(np.ptp(PV[:,0]),np.ptp(PV[:,2]))
  isl={}
  for t,l in enumerate(lab):isl.setdefault(l,[]).append(t)
  info={}
  for l,ts in isl.items():
    v=PV[np.unique(T[ts])];mn,mx=v.min(0),v.max(0);e=mx-mn;info[l]=dict(mn=mn,mx=mx,e=e,c=(mn+mx)/2,ts=ts)
  petits=[l for l in info if max(info[l]["e"])<.12*L]
  par={l:l for l in petits}
  def f(x):
    while par[x]!=x:par[x]=par[par[x]];x=par[x]
    return x
  eps=.01*L
  for i,a in enumerate(petits):
    for b in petits[i+1:]:
      A,B=info[a],info[b]
      if np.all(A['mn']-eps<=B['mx'])and np.all(B['mn']-eps<=A['mx']):par[f(b)]=f(a)
  grp={}
  for l in petits:grp.setdefault(f(l),[]).append(l)
  res=[]
  for g in grp.values():
    canons=[l for l in g if (lambda e:sorted(e)[2]>=3*sorted(e)[1] and e[1]<sorted(e)[2]*.5 and sorted(e)[2]>=.012*L)(info[l]['e'])]
    bases=[l for l in g if l not in canons and (lambda e:max(e[0],e[2])>=.015*L and max(e[0],e[2])<=1.7*min(e[0],e[2]))(info[l]['e'])]
    if not canons or not bases:continue
    mn=np.min([info[l]['mn'] for l in g],0);mx=np.max([info[l]['mx'] for l in g],0)
    if max(mx[0]-mn[0],mx[2]-mn[2])>.16*L:continue
    bmn=np.min([info[l]['mn'] for l in bases],0);bmx=np.max([info[l]['mx'] for l in bases],0);piv=(bmn+bmx)/2
    cc=np.mean([info[l]['c'] for l in canons],0)
    rb=max(bmx[0]-bmn[0],bmx[2]-bmn[2])/2
    bout=max(np.hypot(*(np.array([info[l]['mn'][0],info[l]['mx'][0]])[[i]]-piv[0]).tolist()+((np.array([info[l]['mn'][2],info[l]['mx'][2]])[[j]]-piv[2]).tolist())) for l in canons for i in (0,1) for j in (0,1))
    if bout<rb*1.25:continue   # les canons doivent dépasser de la base
    res.append(dict(g=g,piv=piv,a0=float(np.arctan2(cc[2]-piv[2],cc[0]-piv[0])),n=sum(len(info[l]['ts']) for l in g)))
  return T,PV,lab,res,L
if __name__=='__main__':
  d=json.load(open(sys.argv[3] if len(sys.argv)>3 else 'modeles.json'));ks=sys.argv[1].split(',')
  out=Image.new('RGB',(900,300*len(ks)),(20,30,40));im=ImageDraw.Draw(out)
  for r,k in enumerate(ks):
    j,acc=lire(d[k]['b64']);pr=j['meshes'][0]['primitives'][0];P=acc(pr['attributes']['POSITION']).astype(float);I=acc(pr['indices'])
    T,PV,lab,res,L=detecte(P,I);print(k,len(res),'tourelles',[x['n'] for x in res])
    tour={l:i for i,x in enumerate(res) for l in x['g']}
    mn,mx=PV.min(0),PV.max(0);s=860/max(mx[0]-mn[0],mx[2]-mn[2])
    for t in np.argsort(PV[T][:,:,1].mean(1)):
      c=(255,80,80) if lab[t] in tour else (110,120,130)
      im.polygon([(20+(PV[v][0]-mn[0])*s,r*300+20+(PV[v][2]-mn[2])*s) for v in T[t]],fill=c,outline=(60,60,70))
    for i,x in enumerate(res):im.text((20+(x['piv'][0]-mn[0])*s,r*300+20+(x['piv'][2]-mn[2])*s),str(i),fill=(255,255,0))
    im.text((5,r*300+3),k,fill=(255,255,255))
  out.save(sys.argv[2])
