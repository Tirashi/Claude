// test : un chasseur placé derrière le joueur ; le joueur fait un looping : le chasseur doit se retrouver devant (visible)
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:900,height:1000}});
p.on('pageerror',e=>console.log('ERR',e.message));for(const f of ['three.min.js','GLTFLoader.js'])await p.route('**/'+f,r=>r.fulfill({path:'/home/user/Claude/lib/'+f,contentType:'application/javascript'}));await p.route('https://fonts.googleapis.com/**',r=>r.abort());
await p.goto('file:///home/user/Claude/maquettes/escadrille-pixel.html');await (await p.$('#t')).scrollIntoViewIfNeeded();await p.waitForTimeout(4000);
// on prend la main (touche haut relâchée aussitôt) puis on met tous les ennemis en chasse, 40 m derrière
await p.keyboard.press('ArrowDown');await p.evaluate(()=>{const S=Escadrille.S;for(const e of Escadrille.ennemis){e.etat='combat';e.role='chasse';e.roleDepart='chasse';e.tc=0;const f=S.fwd.clone();e.g.position.copy(S.p).addScaledVector(f,-40);e.v.copy(f).multiplyScalar(S.v);}});
const rel=()=>p.evaluate(()=>{const S=Escadrille.S;return Escadrille.ennemis.map(e=>Math.round(e.g.position.clone().sub(S.p).dot(S.fwd))+'/'+e.role).join(' ');});
for(let k=0;k<4;k++){await p.waitForTimeout(700);console.log('sans manoeuvre',await rel());}
await p.keyboard.press('KeyR');for(let k=0;k<6;k++){await p.waitForTimeout(700);console.log('looping       ',await rel());}
await p.waitForTimeout(600);await (await p.$('#t')).screenshot({path:'/tmp/claude-0/-home-user-Claude/fcffeada-e83d-5761-b3f5-53af1f50fc26/scratchpad/apres-loop.png'});
await b.close();})();
