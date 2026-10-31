const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: Number(process.argv[3]||1200), height: 1500 } });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('ERREUR:', e.message));
  await p.route('**/GLTFLoader.js', r => r.fulfill({ path: require('path').resolve(__dirname, '../../../lib') + '/GLTFLoader.js', contentType: 'application/javascript' })); await p.route('**/SkeletonUtils.js', r => r.fulfill({ path: require('path').resolve(__dirname, '../../../lib') + '/SkeletonUtils.js', contentType: 'application/javascript' })); await p.route('**/three.min.js', r => r.fulfill({ path: require('path').resolve(__dirname, '../../../lib') + '/three.min.js', contentType: 'application/javascript' }));
  await p.route('https://fonts.googleapis.com/**', r => r.abort());
  await p.goto('file://' + process.argv[2]); if (process.env.SANS_TEL) { await p.waitForTimeout(4000); await p.evaluate('TEL.length = 0'); }
  await p.waitForTimeout(Number(process.env.ATTENTE||9000));
  if (process.argv[4]) await p.evaluate(process.argv[4]);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: process.argv[5] || 'capture.png', fullPage: true });
  await b.close();
})();
