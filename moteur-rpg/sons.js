/* Moteur RPG — sons et musiques (navigateur, WebAudio). Les fichiers sont chargés à la demande ;
   l'audio ne démarre qu'après un premier geste du joueur (règle des navigateurs sur téléphone).
   effets, musiques : { nom: 'chemin.ogg' } ; reglages : { musique: true, effets: true } (modifiables).
   Les effets sont chargés dès le premier geste, les musiques quand on les joue. */
(function (M) {
  function Sons(effets, musiques, reglages) {
    const fichiers = Object.assign({}, effets, musiques);
    let ctx = null, gTout = null, gMus = null, musique = null, musiqueNom = null, voulue = null;
    const actif = () => reglages.musique || reglages.effets;
    const tampons = {}, enCours = {};

    // son coupé dans les options : on ne crée ni ne réveille l'audio (sur certains téléphones, rouvrir la sortie fait un « clic »)
    function demarrer() {
      if (!actif() || document.hidden) return;
      if (ctx) { if (ctx.state === 'suspended') reveiller(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      gTout = ctx.createGain(); gTout.connect(ctx.destination);
      const vide = ctx.createBufferSource(); vide.buffer = ctx.createBuffer(1, 1, 22050); vide.connect(gTout); vide.start();
      gMus = ctx.createGain(); gMus.gain.value = .35; gMus.connect(gTout);
      Object.keys(effets).forEach(charger);
      if (voulue) jouerMusique(voulue);
    }
    ['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, demarrer, { capture: true }));
    // l'appli passe en arrière-plan (écran éteint, autre appli) : le son s'éteint en fondu puis l'audio s'endort ;
    // au retour, il ne se réveille que si un son est voulu, et remonte en fondu (pas de claquement)
    function endormir() {
      if (!ctx || ctx.state !== 'running') return;
      const n = ctx.currentTime; gTout.gain.cancelScheduledValues(n); gTout.gain.setValueAtTime(gTout.gain.value, n); gTout.gain.linearRampToValueAtTime(0, n + .06);
      setTimeout(() => { if (document.hidden || !actif()) ctx.suspend(); }, 90);
    }
    function reveiller() {
      if (!ctx || !actif() || document.hidden) return;
      gTout.gain.cancelScheduledValues(ctx.currentTime); gTout.gain.setValueAtTime(0, ctx.currentTime);
      ctx.resume().then(() => { const n = ctx.currentTime; gTout.gain.setValueAtTime(0, n); gTout.gain.linearRampToValueAtTime(1, n + .4); });
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) endormir(); else reveiller(); });

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
      const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = vol; s.buffer = t; s.connect(g).connect(gTout); s.start();
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
      // appelé depuis le menu (donc après un geste) : on peut créer ou réveiller l'audio, ou l'endormir si tout est coupé
      majReglages() { if (!reglages.musique) arreter(); if (actif()) { demarrer(); jouerMusique(voulue); } else endormir(); }
    };
  }

  M.Sons = { Sons };
})(window.MoteurRPG = window.MoteurRPG || {});
