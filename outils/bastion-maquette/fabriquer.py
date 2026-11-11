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
Maquette 10 (tactique au tour par tour façon Wargroove : Free Pack, Enemy Pack, Warfare) :
        python3 -I outils/bastion-maquette/fabriquer.py 10 <Free Pack> <ancienne version> <dossier « Enemy Pack »> <dossier « Warfare »> <sortie.html>
Maquette 13 (nouvelle interface : 3 directions, choix du niveau, tuto) :
        python3 -I outils/bastion-maquette/fabriquer.py 13 <dossier « Warfare »> <Free Pack> <capture du jeu sans interface.png> <sortie.html>
Maquette 12 (bestiaire : toutes les unités et tous les bâtiments des packs, avec leurs animations) :
        python3 -I outils/bastion-maquette/fabriquer.py 12 <Free Pack> <dossier « Enemy Pack »> <dossier « Warfare »> <ancienne version (Update 010)> <sortie.html>
Maquette 11 (RTS et tower defense : économie, recrutement, vagues ; Free Pack et Enemy Pack) :
        python3 -I outils/bastion-maquette/fabriquer.py 11 <Free Pack> <ancienne version> <dossier « Enemy Pack »> <sortie.html>
Les packs ne sont pas dans le dépôt (pas de redistribution) : la page fabriquée sert d'artefact, elle n'est pas commitée.
Packs : https://reodesuxz.itch.io/low-poly-japanese-castle-town-pack, https://reodesuxz.itch.io/low-poly-japanese-shrine-pack,
https://reodesuxz.itch.io/low-poly-ninja-dojo-castle-pack, https://standout7.itch.io/lowpo-samurai"""
import base64, glob, json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, '..', '..'))
M4 = sys.argv[1] == '4'
if sys.argv[1] == '13':
    wf, fp, capture, sortie = sys.argv[2:6]
    png = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
    IMG = os.path.join(RACINE, 'bastion', 'img')
    im = lambda n: png(os.path.join(IMG, n + '.png'))
    D = {n: im(n) for n in ['ic-bois', 'ic-or', 'ic-viande', 'ic-marteau', 'ic-epee', 'ic-bouclier', 'ic-reglages', 'av-lance', 'av-guer', 'av-arc', 'av-moine', 'av-cata']}
    D['av-roi'] = png(os.path.join(wf, 'King', 'King Avatar', 'King_Avatar_01.png'))
    D['doigt'] = png(os.path.join(fp, 'UI Elements', 'UI Elements', 'Cursors', 'Cursor_02.png'))
    rond = png(os.path.join(fp, 'UI Elements', 'UI Elements', 'Buttons', 'SmallBlueRoundButton_Regular.png'))
    var = {'papier': im('ui-papier'), 'table': im('ui-table'), 'parchemin': im('ui-parchemin'), 'ruban-bleu': im('ui-ruban-bleu'), 'ruban-rouge': im('ui-ruban-rouge'),
           'carre': im('ui-carre-bleu'), 'rond': rond, 'barre': im('ui-barre'), 'barre-plein': im('ui-barre-plein'), 'bouton': im('ui-bouton-bleu'), 'bouton-rouge': im('ui-bouton-rouge'),
           'jeu-img': png(capture)}
    haut = ('<div class="haut"><div class="ligne"><div class="res"><span class="papier"><img src="__ic-bois__" alt="">85</span><span class="papier"><img src="__ic-or__" alt="">62</span>'
            '<span class="papier"><img src="__ic-viande__" alt="">48</span></div><div class="droite"><span class="carre"><img src="__ic-reglages__" alt="" style="width:16px"></span><span class="carre">II</span></div></div>'
            '<div class="ligne"><span class="ruban rouge vague">VAGUE 3/10 · 12 S</span></div><div class="barre"><i></i></div></div>')
    cartes = '<div class="cartes">' + ''.join('<span class="c papier%s"><img src="__av-%s__" alt="">%s<span class="cout">%s</span>%s</span>' % (
        ' ferme' if v else '', k, n, c, '<span class="v">%s</span>' % v if v else '') for k, n, c, v in [
        ('lance', 'LANCIERS', '10<img src="__ic-bois__" alt="">10<img src="__ic-or__" alt="">', ''), ('guer', 'CHEVALIERS', '20<img src="__ic-or__" alt="">', 'CASERNE'),
        ('arc', 'ARCHERS', '15<img src="__ic-bois__" alt="">', ''), ('moine', 'MOINES', '20<img src="__ic-or__" alt="">', 'MONASTERE'), ('cata', 'CATAPULTE', '40<img src="__ic-bois__" alt="">', 'ATELIER')]) + '</div>'
    noeuds = ''.join('<div class="noeud%s" style="left:%d%%;top:%d%%"><span class="rond"><span>%s</span></span><b>%s</b><span class="et">%s</span></div>' % (cl, x, y, num, nom, et) for cl, x, y, num, nom, et in [
        ('', 30, 88, '1', 'LA CLAIRIERE', '★★★'), ('', 68, 66, '2', 'LE GUE', '★☆☆'), (' ferme', 28, 46, '3', 'LE CARREFOUR', ''),
        (' ferme', 72, 34, '4', 'LES TROIS CHEMINS', ''), (' ferme', 30, 20, '5', 'LE VILLAGE EXPOSE', ''), (' ferme', 70, 9, '6', 'LA FORTERESSE', '')])
    html = open(os.path.join(ICI, 'source-13.html'), encoding='utf-8').read()
    html = html.replace('__HAUT__', haut).replace('__CARTES__', cartes).replace('__NOEUDS__', noeuds)
    for k, v in D.items(): html = html.replace('__%s__' % k, v)
    html = html.replace('<div class="page">', '<style>:root{' + ''.join('--%s:url(%s);' % kv for kv in var.items()) + '}</style>\n<div class="page">', 1)
    open(sortie, 'w', encoding='utf-8').write(html); print(sortie, len(html) // 1024, 'Ko'); sys.exit()
if sys.argv[1] == '12':
    fp, ep, wf, old, sortie = sys.argv[2:7]
    import re
    from PIL import Image
    png = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
    # rôle de chaque unité ou bâtiment dans Bastion (point doré)
    ROLE = {'Warrior': 'chevaliers', 'Lancer': 'lanciers', 'Archer': 'archers', 'Monk': 'moines', 'Pawn': 'ouvriers', 'Torch Goblin': 'gobelins',
            'Spear Goblin': 'gobelins à lance', 'Gnoll': 'gnolls', 'Troll': 'troll', 'Catapult': 'catapulte',
            'Castle': 'château', 'Barracks': 'caserne', 'Archery': 'archerie', 'House1': 'maison', 'House2': 'maison', 'House3': 'atelier',
            'Monastery': 'monastère', 'Tower': 'tour', 'Maison (ancienne)': 'chantier et ruine'}
    def largeur(f, w, h):
        # largeur d'une case de bande : carrée en général ; quelques bandes de bâtiments ont des cases plus étroites ou plus larges
        if 'Wood_Tower' in f: return 256
        if 'Pirate Tower_Water' in f: return 128
        return h if w % h == 0 else w
    def nom_anim(f, nom):
        a = os.path.splitext(os.path.basename(f))[0]
        a = re.sub(r'^' + re.escape(nom) + r'[ _]?', '', a); a = re.sub(r'[ _]?Blue$', '', a).replace('_', ' ').strip()
        return a or nom
    def anim(f, nom, libelle=None):
        w, h = Image.open(f).size
        return [libelle or nom_anim(f, nom), png(f), largeur(f, w, h)]
    def anims(dossier, nom, garder=lambda f: True):
        return [anim(f, nom) for f in sorted(glob.glob(os.path.join(dossier, '**', '*.png'), recursive=True)) if 'Avatar' not in f and garder(f)]
    # --- les unités
    U = []
    for d in sorted(os.listdir(os.path.join(fp, 'Units', 'Blue Units'))):
        U.append({'p': 'FREE', 'n': d, 'b': ROLE.get(d), 'a': anims(os.path.join(fp, 'Units', 'Blue Units', d), d)})
    X = os.path.join(ep, 'Extra')
    for d in sorted(os.listdir(ep)):
        if d == 'Extra' or not os.path.isdir(os.path.join(ep, d)): continue
        U.append({'p': 'ENEMY', 'n': d, 'b': ROLE.get(d), 'a': anims(os.path.join(ep, d), d)})
    # animations rangées dans « Extra » : rattachées à leur monstre, ou unités à part
    par = {u['n']: u for u in U}
    for dx, cible in [('Gnoll Hit', 'Gnoll'), ('Lizard Hit', 'Lizard'), ('Minotaur Guard', 'Minotaur'), ('Panda Guard', 'Panda'), ('Skull Guard', 'Skull'),
                      ('Turtle Guard', 'Turtle'), ('Troll Dead', 'Troll'), ('Spear Goblin Strong Attack', 'Spear Goblin'), ('Hex Shaman Transformation Spell', 'Hex Shaman')]:
        if os.path.isdir(os.path.join(X, dx)) and cible in par: par[cible]['a'] += anims(os.path.join(X, dx), cible)
    for dx, nom in [('Pig Rider Spear Goblin', 'Pig Rider'), ('Pig', 'Pig'), ('Boat', 'Boat'), ('Seahorse Boat', 'Seahorse Boat')]:
        if os.path.isdir(os.path.join(X, dx)): U.append({'p': 'ENEMY', 'n': nom, 'b': None, 'a': anims(os.path.join(X, dx), nom)})
    for d in sorted(os.listdir(wf)):
        if not os.path.isdir(os.path.join(wf, d)): continue
        couleur = lambda f: not re.search(r'_(Red|Yellow|Purple|Black)', f)
        U.append({'p': 'WARFARE', 'n': d, 'b': ROLE.get(d), 'a': anims(os.path.join(wf, d), d, couleur)})
    U = [u for u in U if u['a']]
    for u in U: u['a'].sort(key=lambda a: (0 if re.search('idle', a[0], re.I) else 1 if re.search('run|walk|move', a[0], re.I) else 2, a[0]))
    # --- les bâtiments
    BT = []
    COUL = [('Blue', 'bleu'), ('Red', 'rouge'), ('Yellow', 'jaune'), ('Purple', 'violet'), ('Black', 'noir')]
    for f in sorted(os.listdir(os.path.join(fp, 'Buildings', 'Blue Buildings'))):
        if not f.endswith('.png'): continue
        n = f[:-4]
        BT.append({'p': 'FREE', 'n': n, 'b': ROLE.get(n), 'a': [anim(os.path.join(fp, 'Buildings', c + ' Buildings', f), n, fr) for c, fr in COUL]})
    E = [('Goblin Hut', 'Goblin Hut', None), ('Fish Hut', 'Fish Hut', None), ('Gnome Hut', 'Gnome Buildings', 'Gnome Hut'), ('Gnome Tower', 'Gnome Buildings', 'Gnome Tower'),
         ('Pirate Tower', 'Pirate Tower', None), ('Cave', 'Cave', None), ('Cannon', 'Cannon', None), ('Wooden Fence', 'Wooden Fence', None),
         ('Dead Tree', 'Dead Tree', None), ('Skull decorations', 'Skull decorations', None)]
    for n, d, seul in E:
        fs = sorted(glob.glob(os.path.join(X, d, '*.png')))
        if seul: fs = [f for f in fs if os.path.basename(f).startswith(seul)]
        if fs: BT.append({'p': 'ENEMY', 'n': n, 'b': None, 'a': [anim(f, n) for f in fs]})
    K = os.path.join(old, 'Factions', 'Knights', 'Buildings'); G = os.path.join(old, 'Factions', 'Goblins', 'Buildings')
    ORDRE = lambda f: (0 if re.search('Blue', f) else 1 if re.search('Red|Yellow|Purple', f) else 2 if 'Constr' in f else 3, f)
    for n, d, pre in [('Château (ancien)', K, 'Castle'), ('Maison (ancienne)', K, 'House'), ('Tour (ancienne)', K, 'Tower'),
                      ('Maison gobeline', G, 'Wood_House'), ('Tour en bois', G, 'Wood_Tower'), ('Mine d\'or', os.path.join(old, 'Resources'), 'Gold Mine')]:
        fs = sorted(glob.glob(os.path.join(d, pre, '*.png')), key=ORDRE)
        if fs: BT.append({'p': 'ANCIEN', 'n': n, 'b': ROLE.get(n), 'a': [anim(f, pre) for f in fs]})
    data = {'unites': U, 'batiments': BT}
    html = open(os.path.join(ICI, 'source-12.html'), encoding='utf-8').read().replace('__DATA__', json.dumps(data, ensure_ascii=False))
    open(sortie, 'w', encoding='utf-8').write(html)
    print(sortie, len(html) // 1024, 'Ko,', len(U), 'unités,', sum(len(u['a']) for u in U), 'animations,', len(BT), 'bâtiments,', sum(len(b['a']) for b in BT), 'images'); sys.exit()
if sys.argv[1] == '11':
    fp, old, ep, sortie = sys.argv[2:6]
    png = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
    B = os.path.join(fp, 'Units', 'Blue Units'); T = os.path.join(fp, 'Terrain'); BB = os.path.join(fp, 'Buildings', 'Blue Buildings'); R = os.path.join(T, 'Resources')
    I = {'tm': os.path.join(T, 'Tileset/Tilemap_color1.png'), 'sable': os.path.join(old, 'Terrain/Ground/Tilemap_Flat.png'),
         'bush': os.path.join(T, 'Decorations/Bushes/Bushe1.png'), 'rock': os.path.join(T, 'Decorations/Rocks/Rock2.png'), 'dust': os.path.join(fp, 'Particle FX/Dust_01.png'),
         'fire': os.path.join(fp, 'Particle FX/Fire_01.png'), 'arrow': os.path.join(B, 'Archer/Arrow.png'), 'healfx': os.path.join(B, 'Monk/Heal_Effect.png'), 'bone': os.path.join(ep, 'Gnoll/Gnoll_Bone.png'),
         'castle': os.path.join(BB, 'Castle.png'), 'barracks': os.path.join(BB, 'Barracks.png'), 'archery': os.path.join(BB, 'Archery.png'), 'house1': os.path.join(BB, 'House1.png'), 'house2': os.path.join(BB, 'House2.png'),
         'sheepM': os.path.join(R, 'Meat/Sheep/Sheep_Move.png'), 'sheepG': os.path.join(R, 'Meat/Sheep/Sheep_Grass.png'),
         'ic/bois': os.path.join(R, 'Wood/Wood Resource/Wood Resource.png'), 'ic/or': os.path.join(R, 'Gold/Gold Resource/Gold_Resource.png'), 'ic/viande': os.path.join(R, 'Meat/Meat Resource/Meat Resource.png')}
    for k in range(1, 5): I['tree%d' % k] = os.path.join(R, 'Wood/Trees/Tree%d.png' % k)
    for k in range(1, 3): I['stump%d' % k] = os.path.join(R, 'Wood/Trees/Stump %d.png' % k)
    for k in range(3, 6): I['gold%d' % k] = os.path.join(R, 'Gold/Gold Stones/Gold Stone %d.png' % k)
    for a in ('Run Axe', 'Interact Axe', 'Run Wood', 'Run Pickaxe', 'Interact Pickaxe', 'Run Gold', 'Run Knife', 'Interact Knife', 'Run Meat'): I['pawn/' + a] = os.path.join(B, 'Pawn/Pawn_%s.png' % a)
    U = {'guer': [os.path.join(B, 'Warrior/Warrior_%s.png'), ('Idle', 'Run', 'Attack1')], 'arc': [os.path.join(B, 'Archer/Archer_%s.png'), ('Idle', 'Run', 'Shoot')],
         'lance': [os.path.join(B, 'Lancer/Lancer_%s.png'), ('Idle', 'Run', 'Right_Attack')], 'moine': [os.path.join(B, 'Monk/%s.png'), ('Idle', 'Run', 'Heal')],
         'gob': [os.path.join(ep, 'Torch Goblin/Torch Goblin_%s.png'), ('Idle', 'Run', 'Attack')], 'lanceg': [os.path.join(ep, 'Spear Goblin/Spear Goblin_%s.png'), ('Idle', 'Run', 'Attack Fast')],
         'gnoll': [os.path.join(ep, 'Gnoll/Gnoll_%s.png'), ('Idle', 'Walk', 'Throw')], 'troll': [os.path.join(ep, 'Troll/Troll_%s.png'), ('Idle', 'Walk', 'Attack')]}
    for u, (pat, ans) in U.items():
        for a in ans: I['u/%s/%s' % (u, a)] = pat % a
    HA = os.path.join(fp, 'UI Elements/UI Elements/Human Avatars')
    I.update({'av/lance': os.path.join(HA, 'Avatars_01.png'), 'av/guer': os.path.join(HA, 'Avatars_02.png'), 'av/arc': os.path.join(HA, 'Avatars_03.png'), 'av/moine': os.path.join(HA, 'Avatars_05.png')})
    img = {k: png(v) for k, v in I.items()}
    html = open(os.path.join(ICI, 'source-11.html'), encoding='utf-8').read().replace('__IMAGES__', json.dumps(img))
    open(sortie, 'w', encoding='utf-8').write(html); print(sortie, len(html) // 1024, 'Ko,', len(img), 'images'); sys.exit()
if sys.argv[1] == '10':
    fp, old, ep, wf, sortie = sys.argv[2:7]
    png = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
    B = os.path.join(fp, 'Units', 'Blue Units'); T = os.path.join(fp, 'Terrain')
    I = {'tm': os.path.join(T, 'Tileset/Tilemap_color1.png'), 'eau': os.path.join(T, 'Tileset/Water Background color.png'), 'sable': os.path.join(old, 'Terrain/Ground/Tilemap_Flat.png'),
         'bush1': os.path.join(T, 'Decorations/Bushes/Bushe1.png'), 'rock1': os.path.join(T, 'Decorations/Rocks/Rock2.png'), 'dust': os.path.join(fp, 'Particle FX/Dust_01.png'),
         'arrow': os.path.join(B, 'Archer/Arrow.png'), 'healfx': os.path.join(B, 'Monk/Heal_Effect.png'), 'castle': os.path.join(fp, 'Buildings/Blue Buildings/Castle.png'),
         'hut': os.path.join(ep, 'Extra/Goblin Hut/Goblin Hut.png'), 'bone': os.path.join(ep, 'Gnoll/Gnoll_Bone.png')}
    for k in range(1, 5): I['tree%d' % k] = os.path.join(T, 'Resources/Wood/Trees/Tree%d.png' % k)
    for k in range(1, 4): I['house%d' % k] = os.path.join(fp, 'Buildings/Blue Buildings/House%d.png' % k)
    U = {'roi': [os.path.join(wf, 'King/King Animations/King_Blue/King_%s_Blue.png'), ('Idle', 'Run', 'Attack')],
         'guer': [os.path.join(B, 'Warrior/Warrior_%s.png'), ('Idle', 'Run', 'Attack1')],
         'lance': [os.path.join(B, 'Lancer/Lancer_%s.png'), ('Idle', 'Run', 'Right_Attack')],
         'arc': [os.path.join(B, 'Archer/Archer_%s.png'), ('Idle', 'Run', 'Shoot')],
         'moine': [os.path.join(B, 'Monk/%s.png'), ('Idle', 'Run', 'Heal')],
         'cav': [os.path.join(wf, 'Horseman/Horseman Animations/Horseman_Blue/Horseman_%s_Blue.png'), ('Idle', 'Run', 'Attack')],
         'gob': [os.path.join(ep, 'Torch Goblin/Torch Goblin_%s.png'), ('Idle', 'Run', 'Attack')],
         'lanceg': [os.path.join(ep, 'Spear Goblin/Spear Goblin_%s.png'), ('Idle', 'Run', 'Attack Fast')],
         'gnoll': [os.path.join(ep, 'Gnoll/Gnoll_%s.png'), ('Idle', 'Walk', 'Throw')],
         'troll': [os.path.join(ep, 'Troll/Troll_%s.png'), ('Idle', 'Walk', 'Attack')]}
    for u, (pat, ans) in U.items():
        for a in ans: I['u/%s/%s' % (u, a)] = pat % a
    HA = os.path.join(fp, 'UI Elements/UI Elements/Human Avatars')
    I.update({'av/roi': os.path.join(wf, 'King/King Avatar/King_Avatar_01.png'), 'av/cav': os.path.join(wf, 'Horseman/Horseman Avatar/Horseman_Avatar_01.png'),
              'av/lance': os.path.join(HA, 'Avatars_01.png'), 'av/guer': os.path.join(HA, 'Avatars_02.png'), 'av/arc': os.path.join(HA, 'Avatars_03.png'), 'av/moine': os.path.join(HA, 'Avatars_05.png'),
              'av/gob': os.path.join(ep, 'Torch Goblin/Torch Goblin_Avatar.png'), 'av/lanceg': os.path.join(ep, 'Spear Goblin/Spear Goblin_Avatar.png'),
              'av/gnoll': os.path.join(ep, 'Gnoll/Gnoll_Avatar.png'), 'av/troll': os.path.join(ep, 'Troll/Troll_Avatar.png')})
    img = {k: png(v) for k, v in I.items()}
    html = open(os.path.join(ICI, 'source-10.html'), encoding='utf-8').read().replace('__IMAGES__', json.dumps(img))
    open(sortie, 'w', encoding='utf-8').write(html); print(sortie, len(html) // 1024, 'Ko,', len(img), 'images'); sys.exit()
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
