# Copie artefact de Ciel de guerre : outils/artefact.py, puis Three.js et GLTFLoader depuis les CDN, les modèles et les sons en base64 (window.CDG_B64, window.CDG_SONS), la police Silkscreen de Google Fonts.
# Usage : python3 outils/escadrille-pixel/artefact_cdg.py <sortie.html>
import sys,subprocess,base64,json,os,re
out=sys.argv[1]
subprocess.run(['python3','outils/artefact.py','ciel-de-guerre/index.html',out],check=True)
c=open(out).read()
def bloc(marque):
  i=c.index(marque);a=c.rindex('<script',0,i);b=c.index('</script>',i)+9;return a,b
a,b=bloc('three.min.js') if False else (None,None)
# le bloc de three.min.js commence par l'en-tête de licence de three.js ; celui de GLTFLoader par « THREE.GLTFLoader »
i=c.index('REVISION');a=c.rindex('<script',0,i);b=c.index('</script>',i)+9
c=c[:a]+'<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'+c[b:]
i=c.index('THREE.GLTFLoader');a=c.rindex('<script',0,i);b=c.index('</script>',i)+9
c=c[:a]+'<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>'+c[b:]
m={f[:-4]:base64.b64encode(open('ciel-de-guerre/modeles/'+f,'rb').read()).decode() for f in sorted(os.listdir('ciel-de-guerre/modeles')) if f.endswith('.glb')}
sons={f[:-4]:base64.b64encode(open('ciel-de-guerre/sons/'+f,'rb').read()).decode() for f in sorted(os.listdir('ciel-de-guerre/sons')) if f.endswith('.mp3')}
i=c.index('window.CDG_CAT');a=c.rindex('<script',0,i)
c=c[:a]+'<script>window.createImageBitmap=undefined;window.CDG_B64='+json.dumps(m)+';window.CDG_SONS='+json.dumps(sons)+';</script>\n'+c[a:]
c=c.replace('url("../polices/silkscreen.woff2") format("woff2")','local("Silkscreen")')
c='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Silkscreen&display=swap">\n'+c
open(out,'w').write(c);print(out,len(c)//1024,'Ko')
