# Allège les GLB de modeles.json (extension KHR_mesh_quantization, lue par le GLTFLoader de Three.js r128) :
# positions en int16 normalisés (le maillage passe dans un nœud enfant qui porte l'échelle et le décalage), UV en uint16 normalisés.
# Usage : python3 -I quantifie.py modeles.json cle1,cle2,...   (les clés non citées ne bougent pas)
import json,base64,struct,sys
import numpy as np
def lire(b):
  l=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+l]);o=20+l;bl=struct.unpack('<I',b[o:o+4])[0];return j,b[o+8:o+8+bl]
def acc(j,B,i):
  a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];dt={5126:np.float32,5123:np.uint16,5125:np.uint32,5121:np.uint8,5122:np.int16}[a['componentType']]
  n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];o=bv.get('byteOffset',0)+a.get('byteOffset',0);st=bv.get('byteStride',0)
  if st and st!=n*np.dtype(dt).itemsize:
    raw=np.frombuffer(B,np.uint8,st*a['count'],o).reshape(a['count'],st)[:,:n*np.dtype(dt).itemsize].copy();return raw.view(dt).reshape(a['count'],n)
  v=np.frombuffer(B,dt,a['count']*n,o);return v.reshape(a['count'],n) if n>1 else v
def quantifie(b):
  j,B=lire(b);vues=[];out=bytearray()
  def ajoute(data,stride=None,cible=None):
    while len(out)%4:out.append(0)
    bv={'buffer':0,'byteOffset':len(out),'byteLength':len(data)}
    if stride:bv['byteStride']=stride
    if cible:bv['target']=cible
    out.extend(data);j2['bufferViews'].append(bv);return len(j2['bufferViews'])-1
  j2=dict(j);j2['bufferViews']=[];anciens=j['accessors'];j2['accessors']=[]
  # recopie des vues d'images telles quelles
  for im in j.get('images',[]):
    bv=j['bufferViews'][im['bufferView']];im['bufferView']=ajoute(B[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']])
  def nouvel(a,data,stride=None,cible=None,**k):
    a=dict(a);a.pop('byteOffset',None);a['bufferView']=ajoute(data,stride,cible);a.update(k);j2['accessors'].append(a);return len(j2['accessors'])-1
  echelles={}
  for mi,m in enumerate(j['meshes']):
    P=[acc(j,B,p['attributes']['POSITION']).astype(np.float64) for p in m['primitives']];allp=np.concatenate(P);mn,mx=allp.min(0),allp.max(0);c=(mn+mx)/2;s=max((mx-mn).max()/2,1e-9)
    echelles[mi]=(c,s)
    for p,pos in zip(m['primitives'],P):
      q=np.round((pos-c)/s*32767).clip(-32767,32767).astype(np.int16);q4=np.zeros((len(q),4),np.int16);q4[:,:3]=q
      a=anciens[p['attributes']['POSITION']];p['attributes']['POSITION']=nouvel(a,q4.tobytes(),8,34962,componentType=5122,normalized=True,min=[float(x) for x in q.min(0)/32767],max=[float(x) for x in q.max(0)/32767])
      for nom,ia in list(p['attributes'].items()):
        if nom=='POSITION':continue
        a=anciens[ia];v=acc(j,B,ia)
        if nom.startswith('TEXCOORD') and a['componentType']==5126 and v.min()>=0 and v.max()<=1:
          u=np.round(v*65535).astype(np.uint16);p['attributes'][nom]=nouvel(a,u.tobytes(),None,34962,componentType=5123,normalized=True)
        else:p['attributes'][nom]=nouvel(a,np.ascontiguousarray(v).tobytes(),None,34962)
      if 'indices' in p:a=anciens[p['indices']];v=acc(j,B,p['indices']);p['indices']=nouvel(a,np.ascontiguousarray(v).tobytes(),None,34963)
  # chaque nœud qui porte un maillage : le maillage descend dans un enfant qui porte décalage et échelle
  for ni in range(len(j['nodes'])):
    n=j['nodes'][ni]
    if 'mesh' in n:
      c,s=echelles[n['mesh']];e={'mesh':n.pop('mesh'),'translation':[float(x) for x in c],'scale':[s,s,s]};j['nodes'].append(e);n.setdefault('children',[]).append(len(j['nodes'])-1)
  j2['nodes']=j['nodes'];j2['buffers']=[{'byteLength':len(out)}]
  for k in ('extensionsUsed','extensionsRequired'):j2[k]=sorted(set(j.get(k,[]))|{'KHR_mesh_quantization'})
  while len(out)%4:out.append(0)
  js=json.dumps(j2,separators=(',',':')).encode()
  while len(js)%4:js+=b' '
  tot=12+8+len(js)+8+len(out)
  return struct.pack('<III',0x46546C67,2,tot)+struct.pack('<I',len(js))+b'JSON'+js+struct.pack('<I',len(out))+b'BIN\0'+bytes(out)
if __name__=='__main__':
  d=json.load(open(sys.argv[1]));ks=sys.argv[2].split(',') if len(sys.argv)>2 else list(d)
  avant=apres=0
  for k in ks:
    b=base64.b64decode(d[k]['b64']);n=quantifie(b);avant+=len(b);apres+=len(n);d[k]['b64']=base64.b64encode(n).decode()
  json.dump(d,open(sys.argv[1],'w'));print('avant',avant//1024,'Ko, après',apres//1024,'Ko')
