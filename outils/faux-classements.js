/* Test des classements en ligne avec un FAUX serveur Supabase (le vrai n'est pas
   joignable depuis l'environnement de Claude). Toutes les requêtes vers Supabase
   sont interceptées : ludo_check répond « bon code », ludo_submit répond « 2e sur 3 »,
   ludo_board renvoie trois joueurs (dont « Testeur », le joueur courant).
   Le script :
     1. pose des records locaux (argument JSON optionnel), inscrit « Testeur »
        et affiche ce qui part à l'inscription ;
     2. ouvre la page des classements sur l'ancre donnée et affiche le tableau demandé.
   node outils/faux-classements.js <ancre> [records-json] [capture.png]
   ex. : node outils/faux-classements.js amiral-0-easy '{"amiral.best":{"easy":22}}' /tmp/cl.png
   Pour tester l'envoi depuis un jeu, s'en inspirer : ouvrir le jeu dans le même
   contexte, appeler sa fonction de fin de partie avec page.evaluate (les const et
   fonctions de haut niveau des jeux sont accessibles), puis lire `calls`. */
const { BASE, phone, logErrors } = require('./pw');
(async () => {
  const [hash = 'tetris', recs = '{}', shot] = process.argv.slice(2);
  const { browser, ctx } = await phone();
  const calls = [];
  await ctx.route('https://hfoiofrgltzdyetoqpjc.supabase.co/**', route => {
    const name = route.request().url().split('/rpc/')[1], body = JSON.parse(route.request().postData() || '{}');
    calls.push([name, body]);
    const res = name === 'ludo_check' ? true
      : name === 'ludo_submit' ? [{ best: body.p_value, rank: 2, total: 3 }]
      : name === 'ludo_board' ? [{ pseudo: 'Papa', value: 31, updated_at: '2026-10-10', me: false }, { pseudo: 'Testeur', value: 40, updated_at: '2026-10-12', me: true }, { pseudo: 'Fiston', value: 52, updated_at: '2026-10-11', me: false }]
      : [];
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(res) });
  });
  const p = await ctx.newPage(); logErrors(p);
  await p.goto(BASE + 'index.html');
  await p.evaluate(r => { localStorage.clear(); for (const [k, v] of Object.entries(JSON.parse(r))) localStorage.setItem(k, JSON.stringify(v)); }, recs);
  await p.goto(BASE + 'classements/index.html');
  await p.evaluate(() => LudoScores.join('Testeur', 'CODE-TEST')); await p.waitForTimeout(2500);
  console.log('Envoyé à l\'inscription :');
  calls.filter(c => c[0] === 'ludo_submit').forEach(c => console.log(`  ${c[1].p_game} ${c[1].p_board} = ${c[1].p_value}${c[1].p_low ? ' (le plus bas gagne)' : ''}`));
  calls.length = 0;
  // une ancre seule ne recharge pas la page : on repasse par about:blank
  await p.goto('about:blank'); await p.goto(BASE + 'classements/index.html#' + hash); await p.waitForTimeout(1200);
  console.log('Tableau demandé pour #' + hash + ' :', calls.filter(c => c[0] === 'ludo_board').map(c => c[1].p_game + ' ' + c[1].p_board).join(', ') || 'aucun');
  if (shot) { await p.screenshot({ path: shot }); console.log('capture', shot); }
  await browser.close();
})();
