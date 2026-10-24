#!/usr/bin/env python3
"""La Boutique de cartes : fabrique la planche des monstres des cartes (outil de création, pas lancé par la CI).

    python3 outils/boutique-monstres.py <rltiles>

<rltiles> : dossier crawl-ref/source/rltiles de Dungeon Crawl Stone Soup (tuiles CC0), par exemple :
    git clone --depth 1 --filter=blob:none --sparse https://github.com/crawl/crawl.git
    cd crawl && git sparse-checkout set crawl-ref/source/rltiles/mon

Écrit :
  - boutique/monstres.png : les monstres 32 × 32, 16 par ligne, dans l'ordre de la liste ci-dessous ;
  - boutique/monstres.js  : BOU_MONSTRES = [{ el, n, leg }] (élément, nom du fichier, légendaire).
30 monstres par élément (cartes communes à épiques) et 5 légendaires, un par extension, qui n'apparaissent
nulle part ailleurs (specs/boutique-de-cartes.md § 4). Ne pas changer l'ordre : l'indice d'un monstre est
celui que les règles tirent à la graine (une partie en cours garderait ses cartes, mais pas leurs images).
"""
import sys, os, glob, json
from PIL import Image

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LISTES = {
    'FEU': 'fire_bat fire_crab hell_hog golden_dragon lava_snake bush_burning wandering_mushroom hell_hound lindwurm orange_rat '
           'bombardier_beetle bennu salamander efreet fire_elemental blazeheart_golem molten_gargoyle crimson_imp orange_demon sun_demon '
           'solar_ember hellion manticore komodo_dragon emperor_scorpion scorpion draco-base-red goliath_beetle catoblepas apis',
    'EAU': 'jellyfish octopode sea_snake rock_fish snapping_turtle alligator azure_jelly ice_beast polar_bear rime_drake '
           'ice_dragon bullfrog skyshark kraken_head water_elemental wellspring saltling crocodile alligator_snapping_turtle water_moccasin '
           'swamp_worm blizzard_demon ice_devil white_imp goliath_frog blink_frog cane_toad roaming_sludgefish0 steam_dragon draco-base-white',
    'PLANTE': 'oklob_plant sacred_lotus toadstool_left thorn_hunter butterfly3 frilled_lizard green_rat iguana wyvern swamp_drake '
              'slime_creature briar_patch burstshroom quokka fungal_shambler vine_stalker starflower_0 alderking0 plant_demonic scrub_nettle '
              'sleepcap fungus_gulch0 hippogriff faun satyr meliai butterfly7 acid_dragon swamp_dragon draco-base-green',
    'FOUDRE': 'electric_eel raiju spark_wasp shock_serpent killer_bee sun_moth queen_bee quicksilver_dragon jumping_spider sky_beast '
              'ball_lightning electric_golem air_elemental clockwork_bee wind_drake tengu harpy golden_eye fulminant_prism1 shooting_star '
              'cherub butterfly5 caustic_shrike draco-base-yellow twister1 phalanx_beetle crystal_echidna iron_dragon angel ophan',
    'OMBRE': 'vampire_bat raven oblivion_hound mana_viper ghost_moth hypnotail dream_sheep shard_shrike star_jelly0 void_ooze '
             'black_mamba inugami shadow_imp shadow_demon nekomata wolf warg howler obsidian_bat death_drake '
             'draco-base-black draco-base-purple will_o_the_wisp marshlight foxfire ghost_crab glass_eye shadow_puppet cacodemon morphogenic_ooze',
}
LEGENDAIRES = [('FEU', 'fire_dragon'), ('EAU', 'pearl_dragon'), ('PLANTE', 'treant'), ('FOUDRE', 'storm_dragon'), ('OMBRE', 'shadow_dragon')]


def main():
    mon = os.path.join(sys.argv[1], 'mon')
    trouve = {os.path.basename(f)[:-4]: f for f in glob.glob(os.path.join(mon, '*', '*.png'))}
    liste = [(el, n, False) for el, l in LISTES.items() for n in l.split()] + [(el, n, True) for el, n in LEGENDAIRES]
    manque = [n for _, n, _ in liste if n not in trouve]
    if manque: sys.exit('introuvables : ' + ' '.join(manque))
    assert len({n for _, n, _ in liste}) == len(liste), 'monstre en double'
    for el, l in LISTES.items(): assert len(l.split()) == 30, el
    H = (len(liste) + 15) // 16
    planche = Image.new('RGBA', (16 * 32, H * 32))
    for i, (_, n, _) in enumerate(liste):
        t = Image.open(trouve[n]).convert('RGBA')
        assert t.size == (32, 32), n
        planche.paste(t, ((i % 16) * 32, (i // 16) * 32))
    planche.save(os.path.join(RACINE, 'boutique', 'monstres.png'), optimize=True)
    with open(os.path.join(RACINE, 'boutique', 'monstres.js'), 'w', encoding='utf-8') as f:
        f.write('/* Fabriqué par outils/boutique-monstres.py (ne pas modifier à la main) : les monstres des cartes,\n'
                '   dans l\'ordre de boutique/monstres.png (16 par ligne, 32 × 32). Dungeon Crawl Stone Soup, CC0. */\n')
        f.write('const BOU_MONSTRES = [\n')
        for el, n, leg in liste: f.write('  ' + json.dumps({'el': el, 'n': n, 'leg': leg} if leg else {'el': el, 'n': n}, ensure_ascii=False) + ',\n')
        f.write('];\nif (typeof module !== \'undefined\') module.exports = BOU_MONSTRES;\n')
    print(len(liste), 'monstres')


main()
