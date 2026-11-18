# repère les tourelles des grands vaisseaux (tour.py), garde celles choisies à la main, et les range dans modeles.json :
# pour chaque tourelle, ses triangles (plages [début, nombre]), son pivot, l'angle de ses canons et le bout des canons
import json,sys,numpy as np
sys.path.insert(0,'.')
from ilots import lire
from tour import detecte
GARDE={'fga_destroyer1':[0,1,2,3,4,5],'fga_croiseur1':[0,1,2],'fga_destroyer2':[2,3],'fga_croiseur2':[0,2,3],'fga_destroyer3':[0,1,2,3,4,5],
 'fga_croiseur3':[0,1],'fga_destroyer4':[0,1,2,3,4,5],'fga_croiseur4':[1,3],'fga_destroyer5':[0,1]}
f=sys.argv[1];d=json.load(open(f))
for k,garde in GARDE.items():
  j,acc=lire(d[k]['b64']);prs=j['meshes'][0]['primitives'];assert len(prs)==1,k
  P=acc(prs[0]['attributes']['POSITION']).astype(float);I=acc(prs[0]['indices'])
  T,PV,lab,res,L=detecte(P,I)
  tours=[]
  for i in garde:
    x=res[i];g=set(x['g']);ts=sorted(t for t in range(len(T)) if lab[t] in g)
    pl=[];
    for t in ts:
      if pl and pl[-1][0]+pl[-1][1]==t:pl[-1][1]+=1
      else:pl.append([t,1])
    v=PV[np.unique(T[ts])]-x['piv'];dist=np.hypot(v[:,0],v[:,2]);bout=v[np.argmax(dist)]
    tours.append({'pl':pl,'piv':[round(float(a),2) for a in x['piv']],'a0':round(x['a0'],4),'bout':[round(float(a),2) for a in bout]})
  d[k]['tour']=tours;print(k,len(tours),'tourelles',sum(len(t['pl']) for t in tours),'plages')
json.dump(d,open(f,'w'))
