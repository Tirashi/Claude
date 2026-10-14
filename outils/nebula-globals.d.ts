// Pour tsc : regles.js s'exporte aussi vers Node (module.exports) et vers la page (window.Nebula).
declare var module: { exports: any };
interface Window { Nebula: any; NEBULA_EVENTS: any }
declare function require(path: string): any;
