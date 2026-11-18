# grille.json (voxeliseur) → ruban de tranches : grille.py <grille.json> <sortie.png>
import sys,json,base64,numpy as np,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import piles
j=json.load(open(sys.argv[1]));X,Y,Z=j['dims'];c=np.frombuffer(base64.b64decode(j['data']),np.uint8).reshape(X,Y,Z,4).copy()
print(sys.argv[2],piles.ecrire(c[:,::-1],sys.argv[2]))
