# Télécharge le fichier gratuit d'une page itch.io « prix libre » : itch.py <url de la page> <motif du nom de fichier> <dossier>
import sys, re, json, subprocess, os, html
page, motif, dest = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3]
os.makedirs(dest, exist_ok=True); cj = os.path.join(dest, "cookies.txt")
def curl(*a): return subprocess.run(["curl", "-sSL", "-b", cj, "-c", cj, *a], capture_output=True, text=True).stdout
s = curl(page)
tok = re.search(r'name="csrf_token" value="([^"]+)"', s).group(1)
r = json.loads(curl("-X", "POST", "-d", "csrf_token=" + tok, page + "/download_url"))
dl = curl(r["url"])
for m in re.finditer(r'data-upload_id="(\d+)"(.{0,600})', dl, re.S):
    nom = re.search(r'<strong title="([^"]*)"', m.group(2))
    nom = html.unescape(nom.group(1)) if nom else "?"
    print("fichier :", m.group(1), nom)
    if re.search(motif, nom, re.I):
        j = json.loads(curl("-X", "POST", "--data-urlencode", "csrf_token=" + tok, page + f"/file/{m.group(1)}?source=view_game&as_props=1&after_download_lightbox=true"))
        out = os.path.join(dest, re.sub(r"[^\w.-]+", "_", nom))
        subprocess.run(["curl", "-sSL", "-o", out, j["url"]]); print("  ->", out, os.path.getsize(out)); break
