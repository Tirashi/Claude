/* Dessine les planètes de Deep-Fold (window.SC_SHADERS, fabriqué par outils/strategie-ciel/shaders.py ; fichier strategie-ciel/shaders.js) en WebGL 2 :
   chaque couche est rendue à sa taille en pixels puis recopiée, centrée, dans le canvas 2D de la planète.
   new PlanetesDF.Planete('GasPlanetLayers', 100, {seed:3}) ; p.maj(dt) à chaque image ; p.canvas. */
'use strict';
window.PlanetesDF = (function () {
  const S = window.SC_SHADERS, T = 1024;
  const c = document.createElement('canvas'); c.width = c.height = T;
  const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true });
  if (!gl || !S) return null;
  const VS = '#version 300 es\nin vec2 p; out vec2 UV; void main(){ UV = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }';
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const P = {};
  function compile(t, s) { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error('PlanetesDF', gl.getShaderInfoLog(sh)); return sh; }
  function prog(k) {
    if (P[k]) return P[k];
    const src = S.sh[k], p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    const ent = new Set([...src.matchAll(/uniform\s+(?:int|bool)\s+(\w+)/g)].map(m => m[1])), loc = {};
    return P[k] = { p, ent, loc };
  }
  function rendre(k, t, u, cible, x, y) {
    const q = prog(k); gl.useProgram(q.p); gl.viewport(0, 0, t, t); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const n in u) {
      const v = u[n]; let l = q.loc[n]; if (l === undefined) l = q.loc[n] = gl.getUniformLocation(q.p, n); if (l === null) continue;
      if (q.ent.has(n)) gl.uniform1i(l, Math.round(+v));
      else if (Array.isArray(v) && Array.isArray(v[0])) gl.uniform4fv(l, v.flat());
      else if (Array.isArray(v)) gl.uniform2f(l, v[0], v[1]); else gl.uniform1f(l, v);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    cible.drawImage(c, 0, T - t, t, t, x, y, t, t);
  }
  class Planete {
    constructor(nom, px, o = {}) {
      this.couches = S.planetes[nom].map(k => ({ ...k, p: { ...k.p } }));
      for (const k of this.couches) { if (o.seed !== undefined) k.p.seed = o.seed + (k.p.seed % 1); if (o.couleurs) Object.assign(k.p, o.couleurs(k)); }
      this.px = px; this.taille = Math.max(...this.couches.map(k => Math.round(k.px * px)));
      this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = this.taille;
      this.x = this.canvas.getContext('2d'); this.t = 1000 + (o.decalage || 0); this.maj(0);
    }
    maj(dt) {
      this.t += dt; this.x.clearRect(0, 0, this.taille, this.taille);
      for (const k of this.couches) { const s = Math.round(k.px * this.px); rendre(k.sh, s, { ...k.p, pixels: s, time: this.t * k.tf }, this.x, (this.taille - s) >> 1, (this.taille - s) >> 1); }
    }
  }
  return { Planete, sortes: Object.keys(S.planetes) };
})();
