#!/usr/bin/env python3
"""Suivi des mises à jour des packs de graphismes (liste : outils/packs-suivis.json).

   python3 outils/packs-maj.py                 → compare l'état actuel de chaque pack à la dernière photo et dit ce qui a changé
   python3 outils/packs-maj.py --noter         → pareil, puis enregistre l'état actuel comme nouvelle photo (dans packs-suivis.json)
   python3 outils/packs-maj.py --api           → ajoute, pour les packs achetés, les dates des fichiers lues par api.itch.io
                                                 (seulement dans l'environnement de Claude, où le proxy ajoute la clé)
   python3 outils/packs-maj.py --rapport f.md  → écrit un rapport Markdown dans f.md s'il y a du nouveau (rien sinon) ;
                                                 la première ligne est le titre de l'issue, avec une empreinte des changements

   Sans clé, on lit la page publique du pack (fichiers et tailles, date « Updated ») et le flux de son devlog (devlog.rss).
   Le workflow .github/workflows/packs.yml le lance chaque lundi et ouvre une issue s'il y a du nouveau.
   Ensuite : demander à Claude de récupérer la mise à jour (API itch.io), puis de noter la photo (--noter)."""
import hashlib, html, json, os, re, sys, urllib.request

ICI = os.path.dirname(os.path.abspath(__file__))
LISTE = os.environ.get('PACKS_LISTE') or os.path.join(ICI, 'packs-suivis.json')   # PACKS_LISTE : une autre liste (essais)
AGENT = {'User-Agent': 'ludotheque-suivi-packs/1.0'}

def lire(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=AGENT), timeout=30) as r:
        return r.read().decode('utf-8', 'replace')

def etat(pack, api):
    """L'état actuel d'un pack : fichiers (nom → taille), date « Updated », derniers billets du devlog."""
    page = lire(pack['url'])
    fichiers = {}
    for m in re.finditer(r'upload_name"><strong[^>]*? title="([^"]+)"', page):   # l'ordre des attributs change d'une page à l'autre
        z = re.search(r'file_size"><span>([^<]+)</span>', page[m.end():m.end() + 800])
        fichiers[html.unescape(m.group(1))] = z.group(1) if z else '?'
    z = re.search(r'Updated</td><td><abbr title="([^"]+)"', page)
    e = {'fichiers': fichiers, 'maj': z.group(1) if z else None, 'devlog': []}
    try:
        rss = lire(pack['url'].rstrip('/') + '/devlog.rss')
        for it in re.findall(r'<item>(.*?)</item>', rss, re.S)[:5]:
            t = re.search(r'<title>(.*?)</title>', it, re.S); l = re.search(r'<link>(.*?)</link>', it, re.S); d = re.search(r'<pubDate>(.*?)</pubDate>', it, re.S)
            e['devlog'].append({'titre': html.unescape(t.group(1).strip()) if t else '?', 'lien': l.group(1).strip() if l else '', 'date': d.group(1).strip() if d else ''})
    except Exception as x:
        e['devlog_erreur'] = str(x)
    if api and pack.get('cle'):
        try:
            c = pack['cle']
            d = json.loads(lire('https://api.itch.io/games/%d/uploads?download_key_id=%d' % (c['jeu'], c['achat'])))
            e['api'] = {u['filename']: {'id': u['id'], 'taille': u.get('size'), 'maj': u.get('updated_at')} for u in d.get('uploads', [])}
        except Exception as x:
            e['api_erreur'] = str(x)
    return e

def differences(avant, apres):
    """Les changements lisibles entre deux états (avant = None : première photo)."""
    if not avant: return ['première photo : ' + ', '.join('%s (%s)' % kv for kv in apres['fichiers'].items())]
    out = []
    for f, t in apres['fichiers'].items():
        if f not in avant.get('fichiers', {}): out.append('nouveau fichier : **%s** (%s)' % (f, t))
        elif avant['fichiers'][f] != t: out.append('fichier changé : **%s** (%s → %s)' % (f, avant['fichiers'][f], t))
    for f in avant.get('fichiers', {}):
        if f not in apres['fichiers']: out.append('fichier retiré : %s' % f)
    if apres.get('maj') and apres['maj'] != avant.get('maj'): out.append('page mise à jour le %s' % apres['maj'])
    vus = {b['lien'] for b in avant.get('devlog', [])}
    for b in apres.get('devlog', []):
        if b['lien'] not in vus: out.append('devlog : [%s](%s) (%s)' % (b['titre'], b['lien'], b['date'][:16]))
    for f, u in (apres.get('api') or {}).items():
        v = (avant.get('api') or {}).get(f)
        if v and v.get('maj') != u.get('maj'): out.append('fichier remis en ligne (API) : **%s** (%s)' % (f, u.get('maj')))
    return out

def main():
    args = sys.argv[1:]
    api, noter = '--api' in args, '--noter' in args
    rapport = args[args.index('--rapport') + 1] if '--rapport' in args else None
    liste = json.load(open(LISTE, encoding='utf-8'))
    lignes, empreinte = [], hashlib.sha1()
    for p in liste['packs']:
        try:
            e = etat(p, api)
        except Exception as x:
            print('%s : page illisible (%s)' % (p['nom'], x)); continue
        avant = p.get('etat')
        if avant and avant.get('fichiers') and not e['fichiers']:
            # aucune ligne de fichier reconnue : la page a sans doute changé de forme ; on ne crie pas « tout est retiré »
            print('%s : page lue, mais aucun fichier reconnu (format de la page changé ?) : à vérifier' % p['nom']); continue
        if avant and not api and 'api' in avant: e['api'] = avant['api']      # garder ce que l'API avait vu
        diff = differences(avant, e)
        print('%s : %s' % (p['nom'], 'rien de nouveau' if not diff else ''))
        for d in diff: print('  - ' + re.sub(r'\*\*|\[|\]\([^)]*\)', '', d))
        if diff and avant:
            lignes.append('### [%s](%s)\nUtilisé par : %s\n\n' % (p['nom'], p['url'], p['jeux']) + '\n'.join('- ' + d for d in diff) + '\n')
            empreinte.update(json.dumps(diff, ensure_ascii=False).encode())
        if noter: p['etat'] = e
    if noter:
        with open(LISTE, 'w', encoding='utf-8') as f: json.dump(liste, f, ensure_ascii=False, indent=2); f.write('\n')
        print('photo notée dans outils/packs-suivis.json')
    if rapport and lignes:
        with open(rapport, 'w', encoding='utf-8') as f:
            f.write('Packs : du nouveau (%s)\n\n' % empreinte.hexdigest()[:8])
            f.write('La vérification de la semaine a vu des changements sur des packs que nous suivons.\n\n' + '\n'.join(lignes))
            f.write('\nPour la suite, dire à Claude : « récupère la mise à jour de … » (il télécharge avec l\'API itch.io, regarde les nouveautés, '
                    'puis note la photo avec `python3 outils/packs-maj.py --api --noter`).\n')
        print('rapport écrit :', rapport)

if __name__ == '__main__':
    main()
