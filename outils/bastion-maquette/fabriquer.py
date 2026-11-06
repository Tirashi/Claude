"""Fabrique la maquette 3 de Bastion (le temple de la Grue avec des modèles gratuits, et la vitrine).
Reprend la simulation et l'interface de maquettes/bastion-2.html, glisse en base64 les GLB des trois packs
japonais de reodesuxz et les deux samouraïs FBX de LOWPO (version gratuite), et intègre GLTFLoader,
SkeletonUtils (lib/), FBXLoader et fflate (three@0.128.0, examples/js, paquet npm).
Usage : python3 -I outils/bastion-maquette/fabriquer.py <bourg du château> <sanctuaire> <dojo> <LOWPO Samurai_Free> <examples/js de three 0.128> <sortie.html>
Maquette 4 (soldats dessinés par le code, source-4.html, sans LOWPO ni FBX) :
        python3 -I outils/bastion-maquette/fabriquer.py 4 <bourg du château> <sanctuaire> <dojo> <sortie.html>
Maquette 5 (2D iso en pixel art, pack « [8x8] Isometric TRPG » de Gustavo Vituri, https://gvituri.itch.io/isometric-trpg) :
        python3 -I outils/bastion-maquette/fabriquer.py 5 <dossier Assets du pack> <sortie.html>
Maquette 6 (2D iso plus grande : sol et figurines « Isometric Classic Hero + Tiles (32x32) » de DezrasDragons, CC0,
https://opengameart.org/node/92757 ; bâtiments de l'échantillon gratuit EAST de mmorwynn, https://mmorwynn.itch.io/east-free-sample) :
        python3 -I outils/bastion-maquette/fabriquer.py 6 <dossier des deux planches OGA (_0.png)> <dossier east-free-sample> <sortie.html>
Maquette 7 (vue du dessus : Tiny Swords de Pixel Frog, ancienne version CC0, https://pixelfrog-assets.itch.io/tiny-swords ;
Ninja Adventure de Pixel-boy et AAA, CC0, https://pixel-boy.itch.io/ninja-adventure-asset-pack) :
        python3 -I outils/bastion-maquette/fabriquer.py 7 <dossier « Tiny Swords (Update 010) »> <dossier « Ninja Adventure - Asset Pack »> <sortie.html>
Maquette 8 (vue du dessus, Free Pack actuel de Tiny Swords, https://pixelfrog-assets.itch.io/tiny-swords ; chemins et ruine de l'ancienne version CC0) :
        python3 -I outils/bastion-maquette/fabriquer.py 8 <dossier « Tiny Swords (Free Pack) »> <dossier « Tiny Swords (Update 010) »> <sortie.html>
Maquette 9 (la 8 avec les monstres de l'Enemy Pack, acheté) :
        python3 -I outils/bastion-maquette/fabriquer.py 9 <dossier « Tiny Swords (Free Pack) »> <dossier « Tiny Swords (Update 010) »> <dossier « Enemy Pack »> <sortie.html>
Les packs ne sont pas dans le dépôt (pas de redistribution) : la page fabriquée sert d'artefact, elle n'est pas commitée.
Packs : https://reodesuxz.itch.io/low-poly-japanese-castle-town-pack, https://reodesuxz.itch.io/low-poly-japanese-shrine-pack,
https://reodesuxz.itch.io/low-poly-ninja-dojo-castle-pack, https://standout7.itch.io/lowpo-samurai"""
import base64, glob, json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, '..', '..'))
M4 = sys.argv[1] == '4'
M9 = sys.argv[1] == '9'
if M9: sys.argv[1:] = ['8', sys.argv[2], sys.argv[3], sys.argv[5]] + [sys.argv[4]]
if sys.argv[1] == '8':
    fp, old, sortie = sys.argv[2:5]
    b2 = open(os.path.join(RACINE, 'maquettes', 'bastion-2.html'), encoding='utf-8').read()
    sim = b2[b2.index('/* ================= la simulation commune'):b2.index('/* ================= le rendu 3D')]
    plan = """["TTT0P0TTT", "T0000000T", "00H111H00", "001222100", "P0122210P", "001222100", "00H111H00", "T0000000T", "TTT0P0TTT"]"""
    sim = sim[:sim.index('const PLANS = {')] + 'const PLANS = {A: ' + plan + ', B: ' + plan + '};\nconst ENTREES = [[4, 0], [0, 4], [8, 4], [4, 8]];' + sim[sim.index('\nconst DIR'):]
    png = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
    T = 'Terrain/'
    I = {'tm1': T + 'Tileset/Tilemap_color1.png', 'tm4': T + 'Tileset/Tilemap_color4.png', 'tree1': T + 'Resources/Wood/Trees/Tree1.png', 'tree2': T + 'Resources/Wood/Trees/Tree2.png',
         'tree3': T + 'Resources/Wood/Trees/Tree3.png', 'tree4': T + 'Resources/Wood/Trees/Tree4.png', 'bush1': T + 'Decorations/Bushes/Bushe1.png', 'bush2': T + 'Decorations/Bushes/Bushe3.png',
         'rock1': T + 'Decorations/Rocks/Rock1.png', 'rock2': T + 'Decorations/Rocks/Rock3.png', 'fire': 'Particle FX/Fire_01.png', 'arrow': 'Units/Blue Units/Archer/Arrow.png',
         'healfx': 'Units/Blue Units/Monk/Heal_Effect.png'}
    img = {k: png(os.path.join(fp, v)) for k, v in I.items()}
    img['sable'] = png(os.path.join(old, 'Terrain/Ground/Tilemap_Flat.png')); img['ruine'] = png(os.path.join(old, 'Factions/Knights/Buildings/House/House_Destroyed.png'))
    for coul in ('Blue', 'Red', 'Yellow', 'Black'):
        base = os.path.join(fp, 'Units', coul + ' Units')
        for d in ('Warrior', 'Archer', 'Lancer'):
            for f in glob.glob(os.path.join(base, d, '*.png')):
                n = os.path.splitext(os.path.basename(f))[0]
                if n != 'Arrow' and 'Defence' not in n: img[coul + '/' + n] = png(f)
        for n in ('Idle', 'Run', 'Heal'):
            f = os.path.join(base, 'Monk', n + '.png')
            if os.path.exists(f): img[coul + '/Monk_' + n] = png(f)
    for coul in ('Blue', 'Yellow'):
        for n in ('House1', 'House2', 'House3', 'Castle'): img[coul + '/b/' + n] = png(os.path.join(fp, 'Buildings', coul + ' Buildings', n + '.png'))
    if M9: sim = sim.replace('if (S.wave % 3 === 0) S.foes.push', 'if (S.wave % 3 === 1) S.foes.push').replace('const boss = (S.wave + 1) % 3 === 0', 'const boss = (S.wave + 1) % 3 === 1')   # le chef dès la 1re vague
    if M9:   # les monstres de l'Enemy Pack (sans les avatars)
        ep = sys.argv[5]
        for n in ('Torch Goblin', 'Spear Goblin', 'Gnoll', 'Troll', 'Skull', 'Thief', 'Minotaur'):
            for f in glob.glob(os.path.join(ep, n, '*.png')):
                a = os.path.splitext(os.path.basename(f))[0].split('_', 1)[1]
                if 'Avatar' not in a and a in ('Idle', 'Run', 'Walk', 'Attack', 'Attack Fast', 'Throw'): img['E/' + n + '/' + a] = png(f)
        img = {k: v for k, v in img.items() if not k.startswith(('Red/', 'Black/', 'Yellow/'))}
    html = open(os.path.join(ICI, 'source-9.html' if M9 else 'source-8.html'), encoding='utf-8').read().replace('__SIM__', sim).replace('__IMAGES__', json.dumps(img))
    open(sortie, 'w', encoding='utf-8').write(html); print(sortie, len(html) // 1024, 'Ko,', len(img), 'images'); sys.exit()
if sys.argv[1] == '7':
    ts, na, sortie = sys.argv[2:5]
    b2 = open(os.path.join(RACINE, 'maquettes', 'bastion-2.html'), encoding='utf-8').read()
    sim = b2[b2.index('/* ================= la simulation commune'):b2.index('/* ================= le rendu 3D')]
    plan = """["TTT0P0TTT", "T0000000T", "0H01110H0", "001222100", "P0122210P", "001222100", "0H01110H0", "T0000000T", "TTT0P0TTT"]"""
    planB = """["TTT0P0TTT", "T00R0000T", "0H01110H0", "001222100", "P0122210P", "001222100", "0H01110H0", "T00000R0T", "TTT0P0TTT"]"""
    sim = sim[:sim.index('const PLANS = {')] + 'const PLANS = {A: ' + plan + ', B: ' + planB + '};\nconst ENTREES = [[4, 0], [0, 4], [8, 4], [4, 8]];' + sim[sim.index('\nconst DIR'):]
    png = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
    K = 'Factions/Knights/'; G = 'Factions/Goblins/'; A = 'Actor/Character/'
    I = {'tsFlat': 'Terrain/Ground/Tilemap_Flat.png', 'tsElev': 'Terrain/Ground/Tilemap_Elevation.png', 'tsTree': 'Resources/Trees/Tree.png',
         'tsHouse': K + 'Buildings/House/House_Blue.png', 'tsHouseR': K + 'Buildings/House/House_Red.png', 'tsHouseY': K + 'Buildings/House/House_Yellow.png',
         'tsHouseX': K + 'Buildings/House/House_Destroyed.png', 'tsTower': K + 'Buildings/Tower/Tower_Blue.png',
         'tsWarrior': K + 'Troops/Warrior/Blue/Warrior_Blue.png', 'tsArcher': K + 'Troops/Archer/Blue/Archer_Blue.png', 'tsPawn': K + 'Troops/Pawn/Blue/Pawn_Blue.png',
         'tsTorch': G + 'Troops/Torch/Red/Torch_Red.png', 'tsTnt': G + 'Troops/TNT/Red/TNT_Red.png', 'tsTorchP': G + 'Troops/Torch/Purple/Torch_Purple.png'}
    for k in range(6): I['tsDeco%d' % k] = 'Deco/%02d.png' % [1, 4, 7, 9, 12, 16][k]
    J = {'naFloor': 'Backgrounds/Tilesets/TilesetFloor.png', 'naRelief': 'Backgrounds/Tilesets/TilesetRelief.png', 'naNature': 'Backgrounds/Tilesets/TilesetNature.png',
         'naHouse': 'Backgrounds/Tilesets/TilesetHouse.png', 'naSamRed': A + 'SamuraiRed/redsamurai.png', 'naSam': A + 'Samurai/SpriteSheet.png',
         'naSamBlue': A + 'SamuraiBlue/SpriteSheet.png', 'naNinjaDark': A + 'NinjaDark/SpriteSheet.png', 'naNinjaGray': A + 'NinjaGray/SpriteSheet.png',
         'naNinjaRed': A + 'NinjaRed/SpriteSheet.png', 'naTenguW': 'Actor/Boss/TenguRed/Walk.png', 'naTenguA': 'Actor/Boss/TenguRed/Attack.png', 'naTenguI': 'Actor/Boss/TenguRed/Idle.png'}
    img = {k: png(os.path.join(ts, v)) for k, v in I.items()}; img.update({k: png(os.path.join(na, v)) for k, v in J.items()})
    html = open(os.path.join(ICI, 'source-7.html'), encoding='utf-8').read().replace('__SIM__', sim).replace('__IMAGES__', json.dumps(img))
    open(sortie, 'w', encoding='utf-8').write(html); print(sortie, len(html) // 1024, 'Ko'); sys.exit()
if sys.argv[1] == '6':
    oga, east, sortie = sys.argv[2:5]
    b2 = open(os.path.join(RACINE, 'maquettes', 'bastion-2.html'), encoding='utf-8').read()
    sim = b2[b2.index('/* ================= la simulation commune'):b2.index('/* ================= le rendu 3D')]
    # plateau de 7 × 7 cases
    sim = sim.replace('const N = 9;', 'const N = 7;')
    sim = sim[:sim.index('const PLANS = {')] + """const PLANS = {
  A: ["TT0P0TT",
      "TH101HT",
      "001210W",
      "P12221P",
      "001210W",
      "TH101HT",
      "TT0P0RT"],
  B: ["TT0P0TT",
      "TH101HT",
      "0012100",
      "P12221P",
      "0W12100",
      "WH101HT",
      "TW0P0TT"]};
const ENTREES = [[3, 0], [0, 3], [6, 3], [3, 6]];""" + sim[sim.index('\nconst DIR'):]
    png = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
    E = {'sakura': 'bamboo/small/trees/sakura/sakura_1_spring', 'bamboo': 'bamboo/small/trees/bamboo_stand/bamboo_stand_1_summer',
         'maple': 'bamboo/small/trees/japanese_maple/japanese_maple_1_autumn', 'iris': 'bamboo/small/plants/iris/iris_1_summer',
         'machiya': 'houses/small/buildings/machiya/machiya_1_new', 'machiya_w': 'houses/small/buildings/machiya/machiya_1_weathered',
         'minka': 'houses/small/buildings/minka/minka_1_new', 'worship_hall': 'shrines/small/items/worship_hall/worship_hall_1_new',
         'pagoda': 'shrines/small/items/pagoda/pagoda_1_new', 'torii': 'shrines/small/items/vermilion_torii/vermilion_torii_1_new',
         'kasuga': 'gardens/small/items/kasuga_lantern/kasuga_lantern_1_mossy', 'fox': 'shrines/small/items/fox_statues/fox_statues_1_new',
         'koi': 'gardens/small/items/koi_pond/koi_pond_1_new', 'rice': 'houses/small/props/rice_bales/rice_bales_1_new',
         'lantern': 'houses/small/props/paper_lantern_stand/paper_lantern_stand_1_new'}
    est = {k: png(os.path.join(east, v + '.png')) for k, v in E.items()}
    html = (open(os.path.join(ICI, 'source-6.html'), encoding='utf-8').read().replace('__SIM__', sim)
            .replace('__TUILES__', png(os.path.join(oga, 'isometric_tiles_dezrasdragons_0.png')))
            .replace('__HEROS__', png(os.path.join(oga, 'isometric_hero_dezrasdragons_0.png'))).replace('__EAST__', json.dumps(est)))
    open(sortie, 'w', encoding='utf-8').write(html); print(sortie, len(html) // 1024, 'Ko'); sys.exit()
if sys.argv[1] == '5':
    ass, sortie = sys.argv[2:4]
    b2 = open(os.path.join(RACINE, 'maquettes', 'bastion-2.html'), encoding='utf-8').read()
    sim = b2[b2.index('/* ================= la simulation commune'):b2.index('/* ================= le rendu 3D')]
    png = lambda n: 'data:image/png;base64,' + base64.b64encode(open(os.path.join(ass, n), 'rb').read()).decode()
    html = (open(os.path.join(ICI, 'source-5.html'), encoding='utf-8').read().replace('__SIM__', sim)
            .replace('__TUILES__', png('Isometric_MedievalFantasy_Tiles.png')).replace('__FIGURINES__', png('IsometricTRPGAssetPack_Entities.png')))
    open(sortie, 'w', encoding='utf-8').write(html); print(sortie, len(html) // 1024, 'Ko'); sys.exit()
if M4: chateau, sanctuaire, dojo, sortie = sys.argv[2:6]; lowpo = exemples = None
else: chateau, sanctuaire, dojo, lowpo, exemples, sortie = sys.argv[1:7]

def b64(p):
    return base64.b64encode(open(p, 'rb').read()).decode()

mod = {}
for pk, d in (('c', chateau), ('s', sanctuaire), ('d', dojo)):
    for f in sorted(glob.glob(os.path.join(d, '**', '*.glb'), recursive=True)):
        mod[pk + '/' + os.path.splitext(os.path.basename(f))[0]] = b64(f)
sam = {} if M4 else {n: b64(os.path.join(lowpo, 'FBX', 'Characters', n + '.fbx')) for n in ('Samurai', 'Female_Samurai')}
tex = '' if M4 else 'data:image/png;base64,' + b64(os.path.join(lowpo, 'Texture', 'Texture.png'))

b2 = open(os.path.join(RACINE, 'maquettes', 'bastion-2.html'), encoding='utf-8').read()
sim = b2[b2.index('/* ================= la simulation commune'):b2.index('/* ================= le rendu 3D')]

libs = ''
for p in ((os.path.join(RACINE, 'lib', 'GLTFLoader.js'),) if M4 else (os.path.join(RACINE, 'lib', 'GLTFLoader.js'), os.path.join(RACINE, 'lib', 'SkeletonUtils.js'),
          os.path.join(exemples, 'libs', 'fflate.min.js'), os.path.join(exemples, 'loaders', 'FBXLoader.js'))):
    libs += '<script>\n' + open(p, encoding='utf-8').read() + '\n</script>\n'

src = open(os.path.join(ICI, 'source-4.html' if M4 else 'source.html'), encoding='utf-8').read()
html = (src.replace('__LIBS__', libs).replace('__SIM__', sim)
        .replace('__MODELES__', json.dumps(mod)).replace('__SAMOURAIS__', json.dumps(sam)).replace('__SAMTEX__', tex))
open(sortie, 'w', encoding='utf-8').write(html)
print(sortie, len(html) // 1024, 'Ko,', len(mod), 'modèles GLB +', len(sam), 'samouraïs')
