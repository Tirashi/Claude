// Prépare les personnages animés de la bataille de Duché 3D (KayKit Adventurers 2.0 et KayKit Character Animations 1.1,
// Kay Lousberg, CC0, itch.io) : node outils/duche-3d/aventuriers.js <pack Adventurers> <pack Animations> <sortie.js>
// Sortie : window.AVENTURIERS = { persos: {nom: GLB en base64}, armes: {nom: glTF (JSON, tampon intégré, sans texture)},
// clips: [animations au format THREE.AnimationClip.toJSON, valeurs arrondies] }. Les chargeurs viennent de lib/.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [adv, ani, sortie] = process.argv.slice(2);
const PERSOS = ['Knight', 'Ranger', 'Rogue_Hooded', 'Barbarian'];
const ARMES = ['sword_1handed', 'sword_2handed_color', 'shield_badge_color', 'bow_withString', 'arrow_bow', 'axe_1handed', 'dagger'];
const CLIPS = { General: ['Idle_A', 'Hit_A', 'Death_A', 'Death_A_Pose'], MovementBasic: ['Walking_A', 'Running_A'],
  CombatMelee: ['Melee_1H_Attack_Chop', 'Melee_1H_Attack_Stab', 'Melee_2H_Attack_Chop', 'Melee_Block', 'Melee_2H_Idle'],
  CombatRanged: ['Ranged_Bow_Draw', 'Ranged_Bow_Release', 'Ranged_Bow_Idle'], Simulation: ['Cheering'] };
const trouver = (dossier, nom) => { for (const f of fs.readdirSync(dossier, { recursive: true })) if (path.basename(f) === nom) return path.join(dossier, f); throw new Error(nom); };
(async () => {
  const persos = {}, armes = {};
  for (const p of PERSOS) persos[p] = fs.readFileSync(trouver(adv, p + '.glb')).toString('base64');
  for (const a of ARMES) {
    const f = trouver(path.join(adv, 'Assets', 'gltf'), a + '.gltf'), g = JSON.parse(fs.readFileSync(f, 'utf8'));
    g.buffers.forEach(b => { b.uri = 'data:application/octet-stream;base64,' + fs.readFileSync(path.join(path.dirname(f), b.uri)).toString('base64'); });
    // la texture est celle du personnage (recolorée à la couleur du duché) : on la remet à l'exécution
    delete g.images; delete g.textures; delete g.samplers;
    g.materials.forEach(m => { if (m.pbrMetallicRoughness) delete m.pbrMetallicRoughness.baseColorTexture; });
    armes[a] = JSON.stringify(g);
  }
  const b = await chromium.launch(); const page = await b.newPage();
  const lib = path.join(__dirname, '..', '..', 'lib');
  await page.setContent('<html><body></body></html>');
  for (const f of ['three.min.js', 'GLTFLoader.js']) await page.addScriptTag({ path: path.join(lib, f) });
  const clips = [];
  for (const [fic, noms] of Object.entries(CLIPS)) {
    const b64 = fs.readFileSync(trouver(ani, 'Rig_Medium_' + fic + '.glb')).toString('base64');
    clips.push(...await page.evaluate(async ([b64, noms]) => {
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
      const g = await new Promise((ok, ko) => new THREE.GLTFLoader().parse(bin, '', ok, ko));
      const r3 = v => Math.round(v * 1000) / 1000;
      return g.animations.filter(a => noms.includes(a.name)).map(a => {
        const j = THREE.AnimationClip.toJSON(a);
        j.tracks = j.tracks.filter(t => !/scale$/.test(t.name)).map(t => {
          const n = t.values.length / t.times.length;
          const pareil = t.values.every((v, i) => Math.abs(v - t.values[i % n]) < 1e-4);   // piste immobile : une seule image
          return pareil ? { ...t, times: [0], values: t.values.slice(0, n).map(r3) } : { ...t, times: t.times.map(r3), values: t.values.map(r3) };
        });
        return j;
      });
    }, [b64, noms]));
  }
  await b.close();
  const js = 'window.AVENTURIERS=' + JSON.stringify({ persos, armes, clips }) + ';\n';
  fs.writeFileSync(sortie, js);
  console.log('clips', clips.map(c => c.name).join(' '), '|', Math.round(js.length / 1024), 'Ko');
})();
