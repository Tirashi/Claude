import json,base64,struct,sys,numpy as np
def lire(b64):
  b=base64.b64decode(b64);l=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+l]);bin_=b[20+l+8:]
  def acc(i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];o=bv.get('byteOffset',0)+a.get('byteOffset',0)
    dt={5126:np.float32,5123:np.uint16,5125:np.uint32,5121:np.uint8}[a['componentType']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
    return np.frombuffer(bin_,dt,a['count']*n,o).reshape(a['count'],n) if n>1 else np.frombuffer(bin_,dt,a['count'],o)
  return j,acc
def composantes(P,I):
  # sommets fusionnés par position
  cle={};idx=np.zeros(len(P),int)
  for i,p in enumerate(np.round(P,3)):idx[i]=cle.setdefault(tuple(p),len(cle))
  par=list(range(len(cle)))
  def f(x):
    while par[x]!=x:par[x]=par[par[x]];x=par[x]
    return x
  T=idx[I.reshape(-1,3)]
  for a,b,c in T:
    ra,rb,rc=f(a),f(b),f(c);par[rb]=ra;par[f(rc)]=ra
  lab=np.array([f(t[0]) for t in T]);return T,lab
if __name__=='__main__':
  d=json.load(open(sys.argv[1]))
  for k in sys.argv[2:]:
    j,acc=lire(d[k]['b64']);m=j['meshes'][0]
    for pr in m['primitives']:
      P=acc(pr['attributes']['POSITION']);I=acc(pr['indices']);T,lab=composantes(P,I)
      u,c=np.unique(lab,return_counts=True);print(k,'tris',len(T),'ilots',len(u),'plus gros',sorted(c)[-8:])
