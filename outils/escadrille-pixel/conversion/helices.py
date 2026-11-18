# Repère les hélices d'un avion voxel (.vox, nez vers +X) : plaques d'un voxel d'épaisseur en X, larges, perpendiculaires à l'axe
import sys,os,numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import vox
def helices(v):
    occ=set(map(tuple,v[:,:3].tolist()))
    iso=[tuple(p) for p in v[:,:3].tolist() if (p[0]-1,p[1],p[2]) not in occ and (p[0]+1,p[1],p[2]) not in occ]
    iso_s=set(iso);vus=set();comps=[]
    for p in iso:
        if p in vus:continue
        pile=[p];vus.add(p);c=[]
        while pile:
            q=pile.pop();c.append(q)
            for dy,dz in((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                r=(q[0],q[1]+dy,q[2]+dz)
                if r in iso_s and r not in vus:vus.add(r);pile.append(r)
        c=np.array(c);ey=np.ptp(c[:,1])+1;ez=np.ptp(c[:,2])+1
        if len(c)>=8 and max(ey,ez)>=7 and min(ey,ez)>=2: comps.append(c)
    return comps
if __name__=='__main__':
    for f in sys.argv[1:]:
        (X,Y,Z),v=vox.lire(f)[0][0]
        cs=helices(v)
        print(os.path.basename(f),[(int(c[0,0]),len(c),f'{np.ptp(c[:,1])+1}x{np.ptp(c[:,2])+1}',f'centre y{c[:,1].mean():.1f} z{c[:,2].mean():.1f}') for c in cs])
