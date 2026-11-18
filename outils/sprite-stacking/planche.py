# planche d'aperçu : chaque ruban vu de 3/4 (rotation 35°, écrasement 0.75)
import sys,json,os; from PIL import Image,ImageDraw
d=sys.argv[1]; T=json.load(open(d+'/tailles.json')); noms=sys.argv[3:] or sorted(T)
cases=[]
for n in noms:
    X,Y,Z=T[n]; im=Image.open(d+'/'+n).convert('RGBA'); e=max(1,int(max(X,Y,Z)/60)+1)
    W=int(X+Y)+4; H=int((X+Y)*.75)+Z+8; c=Image.new('RGBA',(W,H),(0,0,0,0))
    for z in range(Z):
        s=im.crop((z*X,0,(z+1)*X,Y)).rotate(35,expand=True,resample=Image.NEAREST)
        s=s.resize((s.width,max(1,int(s.height*.75))),Image.NEAREST)
        c.alpha_composite(s,((W-s.width)//2,H-s.height-z-2))
    if e>1: c=c.resize((c.width//e,c.height//e),Image.NEAREST)
    cases.append((n,c))
L=7; cw=max(c.width for _,c in cases)+8; ch=max(c.height for _,c in cases)+14
o=Image.new('RGBA',(cw*L,ch*((len(cases)+L-1)//L)),(70,90,70,255)); dr=ImageDraw.Draw(o)
for i,(n,c) in enumerate(cases):
    x,y=(i%L)*cw,(i//L)*ch; o.alpha_composite(c,(x+(cw-c.width)//2,y+ch-12-c.height)); dr.text((x+2,y+ch-11),n[:20],fill='white')
o=o.resize((o.width*2,o.height*2),Image.NEAREST); o.thumbnail((1600,1600)); o.save(sys.argv[2])
