# Maquette « Petits tanks »
- `extrait.py <scène .obj du pack> <sortie.b64>` : découpe la scène du pack Low Poly Tank Assets (dani567) en groupes (tank simplifié par regroupement de sommets, obus, caisse, arène, sol), relève les obstacles (coupe à 13 cm du sol), sort du JSON gzippé en base64.
- `source.html` : la maquette avec `__MODELES__` à la place des modèles ; `maquettes/tanks.html` = source + base64.
