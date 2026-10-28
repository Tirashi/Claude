// Chiffres pixel 5×7 (comme les compteurs GBA). Les chiffres de la police pixel sont ambigus
// en petit (5 ≈ S, 2 ≈ 8) : tous les chiffres du jeu passent par ces glyphes, en HTML (SVG)
// comme sur le canvas.
(() => {
  'use strict';
  const DIGITS = {
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  };
  const ADVANCE = 6; // largeur d'un glyphe + 1 pixel d'espace

  // Nombre en SVG net (1em de haut), avec l'ombre sombre du texte. Les caractères inconnus sont ignorés.
  function numberHtml(value) {
    const chars = String(value).split('').filter((ch) => DIGITS[ch]);
    let d = '';
    chars.forEach((ch, i) => DIGITS[ch].forEach((row, y) => [...row].forEach((bit, x) => {
      if (bit === '1') d += `M${i * ADVANCE + x} ${y}h1v1h-1z`;
    })));
    const w = chars.length * ADVANCE;
    return `<svg class="num" viewBox="0 0 ${w} 8" style="width:${w / 8}em" shape-rendering="crispEdges"
      aria-label="${value}"><path d="${d}" transform="translate(1 1)" fill="#101830"/><path d="${d}" fill="currentColor"/></svg>`;
  }

  // ------------------------------------------------------------ HTML : conversion automatique
  // Tout chiffre écrit dans l'interface (innerHTML, textContent…) est remplacé par des chiffres
  // pixel, sans avoir à y penser à chaque endroit. Exclus : la graine (doit rester copiable).
  const SKIP = 'svg, .num, .seed, script, style, textarea, input';

  function convertTextNode(t) {
    const parts = t.data.split(/(\d+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\d+$/.test(part)) {
        const tpl = document.createElement('template');
        tpl.innerHTML = numberHtml(part);
        frag.appendChild(tpl.content);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }
    t.replaceWith(frag);
  }

  function convertIn(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (/\d/.test(root.data) && root.parentElement && !root.parentElement.closest(SKIP)) convertTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(SKIP)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (/\d/.test(n.data) && !n.parentElement.closest(SKIP)
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(convertTextNode);
  }

  function installPixelDigits(root = document.body) {
    convertIn(root);
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') convertIn(m.target);
        else m.addedNodes.forEach(convertIn);
      }
    }).observe(root, { childList: true, subtree: true, characterData: true });
  }

  // ------------------------------------------------------------ canvas
  // Texte centré en (cx, y = ligne de base) : les chiffres en glyphes pixel, le reste avec la
  // police courante du contexte. Contour sombre d'un pixel autour de tout le texte.
  function drawPixelText(ctx, text, cx, y, color, outline = '#140c18') {
    const segs = [...String(text)].map((ch) => (DIGITS[ch] && /[0-9+-]/.test(ch)
      ? { ch, w: ADVANCE, glyph: DIGITS[ch] } : { ch, w: ctx.measureText(ch).width }));
    const total = segs.reduce((s, g) => s + g.w, 0) - (segs.at(-1)?.glyph ? 1 : 0);
    let x = Math.round(cx - total / 2);
    const align = ctx.textAlign;
    ctx.textAlign = 'left';
    for (const g of segs) {
      if (g.glyph) {
        const top = y - 7;
        for (const [dx, dy, c] of [[-1, 0, outline], [1, 0, outline], [0, -1, outline], [0, 1, outline], [0, 0, color]]) {
          ctx.fillStyle = c;
          g.glyph.forEach((row, ry) => [...row].forEach((bit, rx) => {
            if (bit === '1') ctx.fillRect(x + rx + dx, top + ry + dy, 1, 1);
          }));
        }
      } else if (g.ch.trim()) {
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2;
        ctx.strokeText(g.ch, x, y);
        ctx.fillStyle = color;
        ctx.fillText(g.ch, x, y);
      }
      x += g.w;
    }
    ctx.textAlign = align;
  }

  Object.assign(Resistance, { DIGITS, numberHtml, installPixelDigits, drawPixelText });
})();
