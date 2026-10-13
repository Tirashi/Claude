#!/usr/bin/env python3
"""Fabrique la copie d'un jeu à publier en artefact claude.ai.
   python3 outils/artefact.py orbite/index.html /chemin/sortie.html
- intègre injagility/chiens32.js s'il est utilisé (la page ne peut pas le charger) ;
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
chiens = open(os.path.join(root, 'injagility/chiens32.js'), encoding='utf-8').read()
body = re.sub(r'<script src="(\.\./injagility/)?chiens32\.js"></script>', lambda m: '<script>\n' + chiens + '\n</script>', body)
body = re.sub(r'<script src="\.\./ludo-scores\.js"></script>\n?', '', body)
i = body.find('/* Ludothèque : mode hors connexion')
if i >= 0: body = body[:body.rfind('<script>', 0, i)] + body[body.find('</script>', i) + 9:]
body = body.replace('../classements/', SITE + 'classements/')
html = title + '\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap">\n' + styles + body
open(out, 'w', encoding='utf-8').write(html)
rest = sorted(set(re.findall(r'["\'](\.\./[^"\']+|[a-z-]+\.html[^"\']*)["\']', body)))
print(f'{out} : {len(html) // 1024} Ko' + (' (chiens32.js intégré)' if 'window.Chiens32' in body else ''))
if rest: print('Liens relatifs restants (ne marcheront pas dans l\'artefact) :', ', '.join(rest))
