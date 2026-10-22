/* Moteur RPG — personnages animés par le code (navigateur).
   Chaque personnage n'a qu'une image : un « corps » (et une arme à part, qui tourne autour de sa prise).
   On le dessine dans un petit canevas de 64 × 48 pixels, pieds en bas au centre, avec une animation :
   repos (respiration), marche (balancement), attaque, sort, touche (flash), victoire (saut), ko (couché).
   sens : 1 regarde vers la gauche (sens des tuiles de Dungeon Crawl), -1 vers la droite. */
(function (M) {
  const L = 64, H = 48;
  const ease = x => 1 - Math.pow(1 - x, 3);

  // atlas : l'image de la planche ; tuiles : { nom: [x, y, l, h] } ; prises : { perso: [x, y] }
  function Poupees(atlas, tuiles, prises) {
    const cache = {};
    function decoupe(nom) {
      if (cache[nom]) return cache[nom];
      const r = tuiles[nom];
      if (!r) return null;
      const c = document.createElement('canvas'); c.width = r[2]; c.height = r[3];
      c.getContext('2d').drawImage(atlas, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
      return (cache[nom] = c);
    }
    // un personnage composé (nom_c + nom_a) ou une simple tuile (monstre)
    function perso(nom) {
      const corps = decoupe(nom + '_c') || decoupe(nom);
      if (!corps) throw new Error('personnage inconnu : ' + nom);
      return { corps, arme: decoupe(nom + '_a'), prise: prises[nom] || [16, 20], dec: Math.random() * 6 };
    }
    return { decoupe, perso };
  }

  function dessiner(g, p, etat, q, t, sens = 1) {
    g.clearRect(0, 0, L, H);
    let sx = 1, sy = 1, rot = 0, dx = 0, dy = 0, armeA = 0, flash = 0, aura = 0;
    const respire = Math.sin(t * 3 + p.dec);
    if (etat === 'repos') { sy = 1 + .03 * respire; sx = 1 - .015 * respire; armeA = .04 * respire; }
    else if (etat === 'marche') { const s = Math.sin(q * Math.PI * 2); rot = .06 * s; dy = -Math.abs(s) * 2.5; sy = 1 - .05 * Math.abs(Math.cos(q * Math.PI * 2)); armeA = .1 * s; }
    else if (etat === 'attaque') {
      if (q < .4) { const k = ease(q / .4); armeA = .35 * k; rot = .04 * k; dx = 1.5 * k; dy = -k; }
      else if (q < .6) { const k = ease((q - .4) / .2); armeA = .35 - .9 * k; rot = .04 - .1 * k; dx = 1.5 - 5 * k; dy = -1 + k; }
      else { const k = ease((q - .6) / .4); armeA = -.55 * (1 - k); rot = -.06 * (1 - k); dx = -3.5 * (1 - k); }
    }
    else if (etat === 'sort') { const k = Math.sin(Math.min(1, q / .85) * Math.PI); dy = -3 * k; armeA = .25 * k; sy = 1 + .04 * k; aura = k; }
    else if (etat === 'touche') { const k = 1 - q; dx = Math.sin(q * 45) * 2 * k + 3 * k; flash = k; rot = .08 * k; }
    else if (etat === 'ko') { rot = -Math.PI / 2 * .92; dy = -2; dx = -6; flash = 0; }
    else if (etat === 'victoire') { const k = Math.abs(Math.sin(q * Math.PI)); dy = -9 * k; armeA = .3; sy = 1 + .06 * k; sx = 1 - .03 * k; }
    g.save(); g.translate(L / 2, H); g.scale(sens, 1);
    if (aura && p.aura) {
      const r = g.createRadialGradient(0, -16, 2, 0, -16, 26);
      r.addColorStop(0, p.aura.replace('A', (.7 * aura).toFixed(2))); r.addColorStop(1, p.aura.replace('A', '0'));
      g.fillStyle = r; g.fillRect(-32, -48, 64, 48);
    }
    g.translate(dx, dy); g.rotate(-rot); g.scale(sx, sy);
    const w = p.corps.width, h = p.corps.height;
    g.drawImage(p.corps, -w / 2, -h);
    if (p.arme) { const [px, py] = p.prise; g.save(); g.translate(px - 16, py - 32); g.rotate(-armeA); g.drawImage(p.arme, -px, -py); g.restore(); }
    g.restore();
    if (flash > 0) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(255,255,255,${(flash * .85).toFixed(2)})`; g.fillRect(0, 0, L, H); g.globalCompositeOperation = 'source-over'; }
  }

  // portrait pour les dialogues : le haut du personnage, agrandi
  function portrait(canvas, p) {
    const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, canvas.width, canvas.height);
    const w = p.corps.width, s = canvas.width / 20;
    g.drawImage(p.corps, (w - 20) / 2, 0, 20, 20, 0, 0, 20 * s, 20 * s);
    if (p.arme) g.drawImage(p.arme, (w - 20) / 2, 0, 20, 20, 0, 0, 20 * s, 20 * s);
  }

  M.Poupees = { L, H, Poupees, dessiner, portrait };
})(window.MoteurRPG = window.MoteurRPG || {});
