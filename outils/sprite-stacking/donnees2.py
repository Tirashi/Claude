import base64, json, sys, os
from PIL import Image
S=sys.argv[1]; D={}
T=json.load(open(S+'/final/tailles.json'))
noms={'F1-b.png':'f1v','F1-c.png':'f1j','F1-d.png':'f1b','F1-e.png':'f1o','avion-joueur.png':'avJ','avion-rouge.png':'avR','avion-kaki.png':'avK',
 'heli_30x9x32_1_color.png':'heli','tree1_32.png':'arb1','tree2_32.png':'arb2','car-race.png':'cRace','car-race-future.png':'cFutur','car-police.png':'cPolice','car-taxi.png':'cTaxi','car-sedan-sports.png':'cSport','car-cone.png':'cone','car-box.png':'caisse',
 'ship-large.png':'galion','ship-small.png':'galion2','ship-small-ghost.png':'fantome','ship-ocean-liner.png':'paquebot','ship-cargo-a.png':'cargo','boat-speed-a.png':'horsbordB','boat-speed-e.png':'horsbordR','boat-tug-a.png':'remorqueur','boat-sail-a.png':'voilier','boat-fishing-small.png':'peche','buoy.png':'bouee','buoy-flag.png':'boueeD','gate-finish.png':'arrivee'}
for f,n in noms.items():
    X,Y,Z=T[f]; D[n]={'src':'data:image/png;base64,'+base64.b64encode(open(S+'/final/'+f,'rb').read()).decode(),'w':X,'h':Y,'n':Z}
for f,w in [('House_1',33),('House_2',24),('House_3',21),('Tower_Simple',30),('Shop_Simple',13),('Kiosk',21),('Cart_Straight',10),('Lamp_Ground_Small',4),('Flag_Large_Green',11),('Wall_Simple',30)]:
    im=Image.open(f'{S}/petit/{f}.png'); D[f]={'src':'data:image/png;base64,'+base64.b64encode(open(f'{S}/petit/{f}.png','rb').read()).decode(),'w':w,'h':im.height,'n':im.width//w}
print('const PILES='+json.dumps(D)+';')
