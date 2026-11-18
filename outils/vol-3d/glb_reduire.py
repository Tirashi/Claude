# Réduit les textures d'un .glb : glb_reduire.py <entrée.glb> <sortie.glb> <taille max>
import sys, json, struct, io
from PIL import Image
src,dst,T=sys.argv[1],sys.argv[2],int(sys.argv[3])
b=open(src,'rb').read(); assert b[:4]==b'glTF'
L=struct.unpack('<I',b[12:16])[0]; J=json.loads(b[20:20+L]); o=20+L; bl=struct.unpack('<I',b[o:o+4])[0]; BIN=b[o+8:o+8+bl]
imgs={im['bufferView']:i for i,im in enumerate(J.get('images',[])) if 'bufferView' in im}
nouv=bytearray()
for k,bv in enumerate(J['bufferViews']):
    d=BIN[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]
    if k in imgs:
        im=Image.open(io.BytesIO(d)).convert('RGB'); im.thumbnail((T,T)); s=io.BytesIO(); im.save(s,'JPEG',quality=82); d=s.getvalue()
        J['images'][imgs[k]]['mimeType']='image/jpeg'
    while len(nouv)%4: nouv.append(0)
    bv['byteOffset']=len(nouv); bv['byteLength']=len(d); nouv+=d
while len(nouv)%4: nouv.append(0)
J['buffers'][0]['byteLength']=len(nouv)
js=json.dumps(J,separators=(',',':')).encode()
while len(js)%4: js+=b' '
out=b'glTF'+struct.pack('<II',2,12+8+len(js)+8+len(nouv))+struct.pack('<I',len(js))+b'JSON'+js+struct.pack('<I',len(nouv))+b'BIN\x00'+bytes(nouv)
open(dst,'wb').write(out); print(dst,len(b),'->',len(out))
