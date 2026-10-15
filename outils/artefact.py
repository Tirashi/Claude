#!/usr/bin/env python3
"""Fabrique la copie d'un jeu à publier en artefact claude.ai.
   python3 outils/artefact.py orbite/index.html /chemin/sortie.html
- intègre tous les scripts locaux de la page (<script src="…"> : chiens32.js, nebula/vaisseaux.js,
  nebula/regles.js…), car l'artefact ne peut pas les charger ;
- garde la police Google Fonts de la page (Press Start 2P par défaut) ; une feuille de polices du dépôt
  (`polices/…css`) est remplacée par son lien Google (attribut data-google) ;
- retire ludo-scores.js (pas de classement dans l'artefact) et le script du service worker / bouton MENU ;
- retire <!DOCTYPE>, <html>, <head>, <body> (l'artefact ajoute son propre squelette) ;
- garde le <title>, la police Google Fonts et le <style> ;
- les liens vers ../classements pointent vers le site publié.
Il signale les autres liens relatifs restants (ils ne marcheront pas dans l'artefact)."""
import os, re, sys
SITE = 'https://tirashi.github.io/Claude/'
src, out = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(root, src), encoding='utf-8').read()
title = re.search(r'<title>.*?</title>', s, re.S).group(0)
styles = ''.join(re.findall(r'<style>.*?</style>', s[:s.index('</head>')], re.S))
body = s[s.index('<body>') + 6:s.rindex('</body>')]
body = re.sub(r'<script src="(?:\.\./)?ludo-scores\.js"></script>\n?', '', body)
here = os.path.dirname(os.path.join(root, src))
inlined = []
def inline(m):
    inlined.append(m.group(1))
    return '<script>\n' + open(os.path.normpath(os.path.join(here, m.group(1))), encoding='utf-8').read() + '\n</script>'
body = re.sub(r'<script src="(?!https?:|//)([^"]+)"></script>', inline, body)
i = body.find('/* Ludothèque : mode hors connexion')
if i >= 0: body = body[:body.rfind('<script>', 0, i)] + body[body.find('</script>', i) + 9:]
body = body.replace('../classements/', SITE + 'classements/')
font = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]+">', s)
local = re.search(r'<link rel="stylesheet" href="[^"]+" data-google="(https://fonts\.googleapis\.com/[^"]+)">', s)   # polices du dépôt : leur équivalent Google
font = font.group(0) if font else f'<link rel="stylesheet" href="{local.group(1)}">' if local else '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap">'
html = title + '\n' + font + '\n' + styles + body
open(out, 'w', encoding='utf-8').write(html)
rest = sorted(set(re.findall(r'["\'](\.\./[^"\']+|[a-z-]+\.html[^"\']*)["\']', body)))
print(f'{out} : {len(html) // 1024} Ko' + (' (intégrés : ' + ', '.join(inlined) + ')' if inlined else ''))
if rest: print('Liens relatifs restants (ne marcheront pas dans l\'artefact) :', ', '.join(rest))
