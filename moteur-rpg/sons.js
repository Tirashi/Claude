/* Moteur RPG — sons et musiques (navigateur, WebAudio). Les fichiers sont chargés à la demande ;
   l'audio ne démarre qu'après un premier geste du joueur (règle des navigateurs sur téléphone).
   effets, musiques : { nom: 'chemin.ogg' } ; reglages : { musique: true, effets: true } (modifiables).
   Les effets sont chargés dès le premier geste, les musiques quand on les joue. */
(function (M) {
  function Sons(effets, musiques, reglages) {
    const fichiers = Object.assign({}, effets, musiques);
    let ctx = null, gMus = null, musique = null, musiqueNom = null, voulue = null;
    const tampons = {}, enCours = {};

    function demarrer() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const vide = ctx.createBufferSource(); vide.buffer = ctx.createBuffer(1, 1, 22050); vide.connect(ctx.destination); vide.start();
      gMus = ctx.createGain(); gMus.gain.value = .35; gMus.connect(ctx.destination);
      Object.keys(effets).forEach(charger);
      if (voulue) jouerMusique(voulue);
    }
    ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, demarrer, { capture: true }));
    // l'appli passe en arrière-plan (écran éteint, autre appli) : on coupe le son, il revient au retour
    document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend(); else ctx.resume(); } });

    function charger(nom) {
      if (tampons[nom] || enCours[nom] || !ctx || !fichiers[nom]) return enCours[nom] || Promise.resolve(tampons[nom]);
      return (enCours[nom] = fetch(fichiers[nom]).then(r => r.arrayBuffer())
        .then(b => new Promise((ok, ko) => ctx.decodeAudioData(b, ok, ko)))
        .then(t => (tampons[nom] = t)).catch(() => null));
    }

    function effet(nom, vol = .6) {
      if (!ctx || !reglages.effets) return;
      const t = tampons[nom];
      if (!t) { charger(nom); return; }
      const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = vol; s.buffer = t; s.connect(g).connect(ctx.destination); s.start();
    }

    function jouerMusique(nom) {
      voulue = nom;
      if (!ctx) return;
      if (!reglages.musique || !nom) { arreter(); return; }
      if (musiqueNom === nom && musique) return;
      charger(nom).then(t => {
        if (!t || voulue !== nom || !reglages.musique) return;
        arreter();
        const s = ctx.createBufferSource(); s.buffer = t; s.loop = true; s.connect(gMus);
        gMus.gain.cancelScheduledValues(ctx.currentTime); gMus.gain.setValueAtTime(0, ctx.currentTime); gMus.gain.linearRampToValueAtTime(.35, ctx.currentTime + 1.2);
        s.start(); musique = s; musiqueNom = nom;
      });
    }
    function arreter() { if (musique) { try { musique.stop(); } catch (e) { /* déjà arrêtée */ } } musique = null; musiqueNom = null; }

    return {
      effet, musique: jouerMusique, demarrer,
      prechauffer(noms) { if (ctx) noms.forEach(charger); },
      majReglages() { if (!reglages.musique) arreter(); else jouerMusique(voulue); }
    };
  }

  M.Sons = { Sons };
})(window.MoteurRPG = window.MoteurRPG || {});
