import base64, json, re, sys, os
from PIL import Image
S=sys.argv[1]; D={}
def ajoute(nom, f, w=None, n=None):
    im=Image.open(f); W,H=im.size
    if n is None: n=W//w
    if w is None: w=W//n
    D[nom]={'src':'data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode(),'w':w,'h':H,'n':n}
for f,w in [('House_1',33),('House_2',24),('House_3',21),('Tower_Simple',30),('Shop_Simple',13),('Kiosk',21),('Cart_Straight',10),('Lamp_Ground_Small',4),('Flag_Large_Green',11),('Wall_Simple',30),('Plane01',35)]:
    ajoute(f, f'{S}/petit/{f}.png', w=w)
for c in ['YellowCar','RedCar','BlueCar','GreenCar','PurpleCar','RedMotorcycle']:
    ajoute(c, f'{S}/packs/cars/{c}.png', w=16)
iso=f'{S}/packs/iso/Aquanoctis_IsoSliceBasicDungeonAssets'
for sous,nom in [('Floors','FloorCentrePlain_strip16'),('Floors','FloorCentrePattern_strip16'),('Floors','FloorDirtDither_strip16'),('Walls','WallCentreA_strip16'),('Walls','WallCentreB_strip16'),('Walls','WallPillar_strip16'),('Doors','WoodDoor_strip16'),('Misc Props','TorchOn_strip12'),('Misc Props','Chestf0_strip18'),('Misc Props','Barrel_strip8'),('Misc Props','Crate_strip8'),('Misc Props','Table_strip8'),('Misc Props','Chair_strip12'),('Misc Props','Spikef2_strip8'),('Misc Props','Grass_strip8')]:
    n=int(re.search(r'strip(\d+)',nom).group(1)); ajoute(nom.split('_strip')[0], f'{iso}/{sous}/{nom}.png', n=n)
print('const PILES='+json.dumps(D)+';')
