/* Captures sur un écran de téléphone.
   node outils/captures.js <dossier-de-sortie> orbite/index.html pont-stellaire/index.html ...
   Chaque page est ouverte, attend 1 s, puis est capturée (nom = chemin avec des tirets). */
const { BASE, phone, logErrors } = require('./pw');
(async () => {
  const [out, ...pages] = process.argv.slice(2);
  if (!out || !pages.length) { console.log('usage : node outils/captures.js <sortie> <page> [<page>...]'); process.exit(1); }
  const { browser, ctx } = await phone();
  for (const path of pages) {
    const p = await ctx.newPage(); logErrors(p);
    await p.goto(BASE + path); await p.waitForTimeout(1000);
    const file = `${out}/${path.replace(/[\/#]/g, '-').replace(/\.html$/, '')}.png`;
    await p.screenshot({ path: file }); console.log('capture', file); await p.close();
  }
  await browser.close();
})();
