/* Chargement de Playwright et petites aides communes aux scripts de test.
   Le serveur local doit tourner depuis la racine du dépôt :  python3 -m http.server 8765 */
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }
const BASE = process.env.BASE || 'http://localhost:8765/';
// un téléphone : 390×780, écran tactile
async function phone(opts = {}) {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1, hasTouch: true }, opts));
  return { browser, ctx };
}
function logErrors(page) { page.on('pageerror', e => console.log('ERREUR', e.stack || e.message)); }
module.exports = { pw, BASE, phone, logErrors };
