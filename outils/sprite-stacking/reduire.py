# Réduit un ruban de tranches de moitié (2×2×2 → 1), en gardant la couleur la plus haute et la plus fréquente.
import sys, numpy as np, json, base64, io
from PIL import Image
from collections import Counter
def reduire(f, X):
    a=np.array(Image.open(f).convert('RGBA')); Z=a.shape[0]; n=a.shape[1]//X
    sl=[a[:,i*X:(i+1)*X] for i in range(n)]
    X2,Z2,n2=(X+1)//2,(Z+1)//2,(n+1)//2
    out=np.zeros((Z2,X2*n2,4),np.uint8)
    for k in range(n2):
        for zz in range(Z2):
            for xx in range(X2):
                c=None
                for s in (2*k+1,2*k):
                    if s>=n: continue
                    bloc=sl[s][2*zz:2*zz+2,2*xx:2*xx+2].reshape(-1,4)
                    op=[tuple(p) for p in bloc if p[3]>128]
                    if len(op)>=2 or (op and c is None and s==2*k):
                        c=Counter(op).most_common(1)[0][0]; break
                if c: out[zz,k*X2+xx]=c
    return Image.fromarray(out), X2
if __name__=='__main__':
    im,X2=reduire(sys.argv[1],int(sys.argv[2])); im.save(sys.argv[3]); print(sys.argv[3],X2,im.size)
