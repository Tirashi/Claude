/* Politique : hasard à graine (mulberry32). Le seul hasard du moteur passe par ici.
   Un tirage = un petit objet { s } (entier 32 bits) : on le range dans l'état (etat.alea)
   pour qu'une partie sauvée en JSON reprenne exactement la même suite. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

// graine : un entier, ou un texte (graine du jour…) haché en entier 32 bits
function creer(graine){
  let s = 0;
  if (typeof graine === "string"){ s = 2166136261; for (let i = 0; i < graine.length; i++) s = Math.imul(s ^ graine.charCodeAt(i), 16777619); }
  else s = Number(graine) || 0;
  return { s: s >>> 0 };
}
// un nombre dans [0, 1[ ; fait avancer r.s
function suivant(r){
  r.s = (r.s + 0x6D2B79F5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entier = (r, n) => Math.floor(suivant(r) * n);          // 0 … n-1
const choisir = (r, liste) => liste[entier(r, liste.length)];

const Alea = { creer, suivant, entier, choisir };
if (NODE) module.exports = Alea; else (racine.Politique = racine.Politique || {}).Alea = Alea;
})(typeof window !== "undefined" ? window : globalThis);
