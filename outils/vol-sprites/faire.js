const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const LIB='/home/user/Claude/lib';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();
  p.on('pageerror',e=>console.log('ERREUR',e.message));
  for(const f of ['three.min.js','GLTFLoader.js'])await p.route('**/'+f,r=>r.fulfill({path:LIB+'/'+f,contentType:'application/javascript'}));
  await p.goto('file://'+path.resolve(__dirname,'page.html'));await p.waitForTimeout(1500);
  const P=[-.32,0,.32];
  const jobs=[['racing',Math.PI,56,40,16,P,false],['intercepteur',Math.PI,56,40,16,P,false],['speeder',0,52,38,16,P,false],['ennemi',Math.PI,40,30,8,[0],true]];
  for(const j of jobs){const url=await p.evaluate(a=>planche(...a),j);fs.writeFileSync(path.resolve(__dirname,j[0]+'.png'),Buffer.from(url.split(',')[1],'base64'));console.log(j[0]);}
  await b.close();})();
