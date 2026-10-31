/* =====================================================================
   MINEUR DE L'ESPACE · les PLANÈTES : shaders du Pixel Planet Generator
   de Deep-Fold (licence MIT, https://deep-fold.itch.io/pixel-planet-generator)
   passés en WebGL 2 (GLSL ES 3.0) ; repli : disque de couleur si WebGL 2 manque.
   Repris de la maquette 6 (maquettes/mineurs-d-etoiles-6.html).
   ===================================================================== */
'use strict';
const VS = `#version 300 es
in vec2 p; out vec2 UV; void main(){ UV = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }`;
const TETE = `#version 300 es
precision highp float; in vec2 UV; out vec4 o;
uniform float pixels, rotation, time_speed, size, seed, time, dither_size;
uniform vec2 light_origin; uniform int OCTAVES; uniform bool should_dither;
`;
const RAND = m => m ? `float rand(vec2 coord){ coord = mod(coord, ${m}*round(size)); return fract(sin(dot(coord.xy, vec2(12.9898,78.233))) * 15.5453 * seed); }`
                    : `float rand(vec2 coord){ return fract(sin(dot(coord.xy, vec2(12.9898,78.233))) * 15.5453 * seed); }`;
const OUTILS = `
float noise(vec2 coord){ vec2 i = floor(coord); vec2 f = fract(coord);
 float a = rand(i), b = rand(i+vec2(1.,0.)), c = rand(i+vec2(0.,1.)), d = rand(i+vec2(1.,1.));
 vec2 cubic = f*f*(3.-2.*f); return mix(a,b,cubic.x) + (c-a)*cubic.y*(1.-cubic.x) + (d-b)*cubic.x*cubic.y; }
float fbm(vec2 coord){ float v = 0., s = .5; for (int i = 0; i < OCTAVES; i++){ v += noise(coord)*s; coord *= 2.; s *= .5; } return v; }
vec2 spherify(vec2 uv){ vec2 c = uv*2.-1.; float z = sqrt(1.-dot(c,c)); return c/(z+1.)*.5+.5; }
vec2 rotate(vec2 coord, float angle){ coord -= .5; coord *= mat2(vec2(cos(angle),-sin(angle)), vec2(sin(angle),cos(angle))); return coord+.5; }
bool dither(vec2 uv1, vec2 uv2){ return mod(uv1.x+uv2.y, 2./pixels) <= 1./pixels; }`;
const CERCLES = lisse => `
float circleNoise(vec2 uv){ float uv_y = floor(uv.y); uv.x += uv_y*.31; vec2 f = fract(uv);
 float h = rand(vec2(floor(uv.x), floor(uv_y))); float m = length(f-.25-(h*.5)); float r = h*.25;
 return ${lisse ? 'smoothstep(0., r, m*.75)' : 'smoothstep(r-.1*r, r, m)'}; }`;
const SH = {
 terre: TETE + `uniform float light_border_1, light_border_2, river_cutoff; uniform vec4 colors[6];` + RAND('vec2(2.,1.)') + OUTILS + `
void main(){ vec2 uv = floor(UV*pixels)/pixels; bool dith = dither(uv, UV);
 float a = step(length(uv-vec2(.5)), .49999); uv = spherify(uv); float d_light = distance(uv, light_origin);
 uv = rotate(uv, rotation); vec2 b = uv*size + vec2(time*time_speed, 0.);
 float fbm1 = fbm(b), fbm2 = fbm(b-light_origin*fbm1), fbm3 = fbm(b-light_origin*1.5*fbm1), fbm4 = fbm(b-light_origin*2.*fbm1);
 float river = step(river_cutoff, fbm(b+fbm1*6.)); float db = (1./pixels)*dither_size;
 if (d_light < light_border_1) fbm4 *= .9;
 if (d_light > light_border_1){ fbm2 *= 1.05; fbm3 *= 1.05; fbm4 *= 1.05; }
 if (d_light > light_border_2){ fbm2 *= 1.3; fbm3 *= 1.4; fbm4 *= 1.8; if (d_light < light_border_2+db && (dith || !should_dither)) fbm4 *= .5; }
 d_light = pow(d_light, 2.)*.4; vec4 col = colors[3];
 if (fbm4+d_light < fbm1*1.5) col = colors[2]; if (fbm3+d_light < fbm1) col = colors[1]; if (fbm2+d_light < fbm1) col = colors[0];
 if (river < fbm1*.5){ col = colors[5]; if (fbm4+d_light < fbm1*1.5) col = colors[4]; }
 o = vec4(col.rgb, a*col.a); }`,
 nuages: TETE + `uniform float cloud_cover, stretch, cloud_curve, light_border_1, light_border_2; uniform vec4 colors[4];` + RAND('vec2(1.,1.)') + OUTILS + CERCLES(true) + `
float cloud_alpha(vec2 uv){ float c = 0.; for (int i = 0; i < 9; i++) c += circleNoise(uv*size*.3 + (float(i+1)+10.) + vec2(time*time_speed, 0.));
 return fbm(uv*size + c + vec2(time*time_speed, 0.)); }
void main(){ vec2 uv = floor(UV*pixels)/pixels; float d_light = distance(uv, light_origin);
 float a = step(length(uv-vec2(.5)), .49999); float dc = distance(uv, vec2(.5));
 uv = rotate(uv, rotation); uv = spherify(uv); uv.y += smoothstep(0., cloud_curve, abs(uv.x-.4));
 float c = cloud_alpha(uv*vec2(1., stretch)); vec4 col = colors[0];
 if (c < cloud_cover+.03) col = colors[1]; if (d_light+c*.2 > light_border_1) col = colors[2]; if (d_light+c*.2 > light_border_2) col = colors[3];
 c *= step(dc, .5); o = vec4(col.rgb, step(cloud_cover, c)*a*col.a); }`,
 lune: TETE + `uniform float light_border_1, light_border_2; uniform vec4 colors[3];` + RAND('vec2(1.,1.)') + OUTILS + `
void main(){ vec2 uv = floor(UV*pixels)/pixels; float dc = distance(uv, vec2(.5)); float d_light = distance(uv, light_origin);
 float a = step(dc, .49999); bool dith = dither(uv, UV); uv = rotate(uv, rotation);
 float fbm1 = fbm(uv); d_light += fbm(uv*size+fbm1+vec2(time*time_speed, 0.))*.3; float db = (1./pixels)*dither_size;
 vec4 col = colors[0];
 if (d_light > light_border_1){ col = colors[1]; if (d_light < light_border_1+db && (dith || !should_dither)) col = colors[0]; }
 if (d_light > light_border_2){ col = colors[2]; if (d_light < light_border_2+db && (dith || !should_dither)) col = colors[1]; }
 o = vec4(col.rgb, a*col.a); }`,
 crateres: TETE + `uniform float light_border; uniform vec4 colors[2];` + RAND('vec2(1.,1.)') + OUTILS + CERCLES(false) + `
float crater(vec2 uv){ float c = 1.; for (int i = 0; i < 2; i++) c *= circleNoise(uv*size + (float(i+1)+10.) + vec2(time*time_speed, 0.)); return 1.-c; }
void main(){ vec2 uv = floor(UV*pixels)/pixels; float dc = distance(uv, vec2(.5)); float d_light = distance(uv, light_origin);
 float a = step(dc, .49999); uv = rotate(uv, rotation); uv = spherify(uv);
 float c1 = crater(uv), c2 = crater(uv+(light_origin-.5)*.03); vec4 col = colors[0];
 a *= step(.5, c1); if (c2 < c1-(.5-d_light)*2.) col = colors[1]; if (d_light > light_border) col = colors[1];
 a *= step(dc, .5); o = vec4(col.rgb, a*col.a); }`,
 asteroide: TETE + `uniform vec4 colors[3];` + RAND('') + OUTILS + CERCLES(false) + `
float crater(vec2 uv){ float c = 1.; for (int i = 0; i < 2; i++) c *= circleNoise(uv*size + (float(i+1)+10.)); return 1.-c; }
void main(){ vec2 uv = floor(UV*pixels)/pixels; bool dith = dither(uv, UV); float d = distance(uv, vec2(.5));
 uv = rotate(uv, rotation); float n = fbm(uv*size), n2 = fbm(uv*size + (rotate(light_origin, rotation)-.5)*.5);
 float ns = step(.2, n-d), n2s = step(.2, n2-d); float rel = (n2s+n2)-(ns+n);
 float c1 = crater(uv), c2 = crater(uv+(light_origin-.5)*.03); vec4 col = colors[1];
 if (rel < -.06 || (rel < -.04 && (dith || !should_dither))) col = colors[0];
 if (rel > .05 || (rel > .03 && (dith || !should_dither))) col = colors[2];
 if (c1 > .4) col = colors[1]; if (c2 < c1) col = colors[2];
 o = vec4(col.rgb, ns*col.a); }`,
};
const GLR = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const gl = c.getContext('webgl2', { preserveDrawingBuffer: true, premultipliedAlpha: false, alpha: true });
  if (!gl) return null;
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const progs = {};
  function compile(t, s){ const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh)); return sh; }
  for (const k in SH){ const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, SH[k]));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); progs[k] = p; }
  const ENTIERS = ['OCTAVES', 'should_dither'];
  // dessine un shader en taille t×t et le recopie dans le contexte 2D cible
  function rendre(k, t, u, cible, x = 0, y = 0){
    const p = progs[k]; gl.useProgram(p); gl.viewport(0, 0, t, t); gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const n in u){ const v = u[n], l = gl.getUniformLocation(p, n); if (l === null) continue;
      if (ENTIERS.includes(n)) gl.uniform1i(l, +v);
      else if (Array.isArray(v) && Array.isArray(v[0])) gl.uniform4fv(l, v.flat());
      else if (Array.isArray(v)) gl.uniform2f(l, v[0], v[1]); else gl.uniform1f(l, v); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    cible.drawImage(c, 0, 512 - t, t, t, x, y, t, t);
  }
  return { rendre };
})();
const C4 = a => { const r = []; for (let i = 0; i < a.length; i += 4) r.push(a.slice(i, i+4)); return r; };
const TERRE = { pixels:0, rotation:.2, light_origin:[.39,.39], time_speed:.1, dither_size:3.951, should_dither:1, light_border_1:.287, light_border_2:.476, river_cutoff:.368,
  colors:C4([.388,.671,.247,1, .231,.490,.310,1, .184,.341,.325,1, .157,.208,.251,1, .310,.643,.722,1, .251,.286,.451,1]), size:4.6, OCTAVES:6, seed:8.98 };
const NUAGES = { pixels:0, rotation:0, cloud_cover:.47, light_origin:[.39,.39], time_speed:.1, stretch:2, cloud_curve:1.3, light_border_1:.52, light_border_2:.62,
  colors:C4([.961,1,.910,1, .875,.878,.910,1, .408,.435,.6,1, .251,.286,.451,1]), size:7.315, OCTAVES:2, seed:5.939 };
const LUNE = { pixels:0, rotation:0, light_origin:[.25,.25], time_speed:.4, dither_size:2, should_dither:1, light_border_1:.615, light_border_2:.729,
  colors:C4([.639,.655,.761,1, .298,.408,.522,1, .227,.247,.369,1]), size:8, OCTAVES:4, seed:1.012 };
const CRATERES = { pixels:0, rotation:0, light_origin:[.25,.25], time_speed:.001, light_border:.465, colors:C4([.298,.408,.522,1, .227,.247,.369,1]), size:5, seed:4.517 };

function toile(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h || w; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
const RT = 320, RL = 120;            // diamètre de la Terre et de la Lune à l'écran
const [terreC, terreX] = toile(RT), [luneC, luneX] = toile(RL);
let tPlan = 1000;
function majPlanetes(dt){
  tPlan += dt; terreX.clearRect(0, 0, RT, RT);
  if (!GLR){ terreX.fillStyle = '#3b7d4f'; terreX.beginPath(); terreX.arc(RT/2, RT/2, RT/2, 0, 7); terreX.fill(); return; }
  GLR.rendre('terre', RT, { ...TERRE, pixels:RT, time:tPlan*100*.02 }, terreX);
  GLR.rendre('nuages', RT, { ...NUAGES, pixels:RT, time:tPlan*(14/.1)*.01 }, terreX);
}
function dessinerLune(){
  luneX.clearRect(0, 0, RL, RL); if (!GLR) { luneX.fillStyle = '#8890b0'; luneX.beginPath(); luneX.arc(RL/2, RL/2, RL/2, 0, 7); luneX.fill(); return; }
  GLR.rendre('lune', RL, { ...LUNE, pixels:RL, time:tPlan }, luneX); GLR.rendre('crateres', RL, { ...CRATERES, pixels:RL, time:tPlan }, luneX);
}
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
