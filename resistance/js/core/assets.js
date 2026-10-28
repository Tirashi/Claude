// Chargement des images et préparation des versions grisées (unités ayant joué).
(() => {
  'use strict';
  const { CLASSES, MAP_SPRITES, fortressSprites } = Resistance;

  const PIXEL_FONT = '"Pixelify Sans"';

  const images = {};
  const grayImages = {};

  // Une planche par sprite utilisé par au moins une classe (plusieurs classes peuvent la partager).
  const UNIT_SPRITES = [...new Set(Object.values(CLASSES).map((c) => c.sprite))];

  function loadImage(key, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(img); };
      img.onerror = () => reject(new Error(`Impossible de charger ${src}`));
      img.src = src;
    });
  }

  function makeGray(img) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      const v = l * 0.75 + 20;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
    return c;
  }

  async function loadAssets() {
    const list = [
      ['tileset', 'assets/tiles/tileset.png'],
      ['rangeBlue', 'assets/ui/range_blue.png'],
      ['rangeRed', 'assets/ui/range_red.png'],
      ['cursor', 'assets/ui/cursor.png'],
      ['crit', 'assets/fx/critical.png'],
    ];
    for (const s of UNIT_SPRITES) {
      for (const team of ['blue', 'red']) list.push([`${s}_${team}`, `assets/units/${s}_${team}.png`]);
    }
    // Planches « Mini World » (carte de run, forteresse), désignées par leur chemin
    const worldSrcs = new Set([...Object.values(MAP_SPRITES), ...fortressSprites()].map((s) => s.src));
    for (const src of worldSrcs) list.push([src, src]);
    await Promise.all([
      ...list.map(([k, src]) => loadImage(k, src)),
      // police pixel des panneaux et des nombres flottants (déclarée dans style.css)
      document.fonts.load(`8px ${PIXEL_FONT}`).catch(() => {}),
    ]);
    for (const s of UNIT_SPRITES) {
      for (const team of ['blue', 'red']) {
        const k = `${s}_${team}`;
        grayImages[k] = makeGray(images[k]);
      }
    }
  }

  const img = (key) => images[key];
  const grayImg = (key) => grayImages[key];

  Object.assign(Resistance, { PIXEL_FONT, UNIT_SPRITES, loadAssets, img, grayImg });
})();
