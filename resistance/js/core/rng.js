// Générateur aléatoire déterministe (mulberry32) : une même graine => une même partie.
(() => {
  'use strict';
  class RNG {
    constructor(seed = Date.now()) {
      this.seed = seed >>> 0;
      this.state = this.seed;
    }
    next() {
      let t = (this.state += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    }
    // Jet de pourcentage "2RN" façon Fire Emblem GBA : moyenne de deux tirages.
    // Les hauts % touchent plus souvent qu'affiché, les bas % moins souvent.
    rollHit(percent) {
      const a = Math.floor(this.next() * 100);
      const b = Math.floor(this.next() * 100);
      return (a + b) / 2 < percent;
    }
    rollCrit(percent) {
      return Math.floor(this.next() * 100) < percent;
    }
  }

  Object.assign(Resistance, { RNG });
})();
