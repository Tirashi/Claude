// Premier combat guidé : une bulle explique chaque geste la première fois qu'il sert
// (choisir un soldat, le déplacer, attaquer, lire les prévisions, la zone de danger, le tour
// ennemi). Le combat appelle guide.on(étape) ; chaque bulle ne s'affiche qu'une fois.
// « Passer » arrête le guide. Il ne revient plus une fois le premier combat fini (meta.guideDone).
(() => {
  'use strict';

  const STEPS = {
    start: 'Premier combat ! Touche un de tes soldats (en bleu) pour le choisir. Attention : un soldat qui tombe est perdu pour toute la campagne.',
    select: 'Cases bleues : où il peut aller. Cases rouges : où il pourra frapper. Touche une case bleue pour l\'y envoyer.',
    menu: 'Choisis une action. « Attaquer » apparaît quand un ennemi est à portée ; sinon, « Attendre ». « Annuler » le ramène à sa place.',
    forecast: 'Les prévisions : PV avant → après, dégâts (×2 : il frappe deux fois), précision et critique en %. Flèche verte : ton arme a l\'avantage (épée > hache > lance > épée). Touche « Attaquer ».',
    acted: 'Bien joué ! Fais jouer les autres soldats. Touche un ennemi pour voir jusqu\'où il peut frapper, ou « Danger » pour voir toute la zone ennemie.',
    danger: 'En rouge : toutes les cases que l\'ennemi peut frapper à son prochain tour. Termine ton tour hors du rouge pour être à l\'abri.',
    enemy: 'Au tour de l\'ennemi. Touche la carte pour l\'accélérer.',
  };

  class Guide {
    constructor(ui) {
      this.ui = ui;
      this.seen = new Set();
      this.stopped = false;
    }

    on(step) {
      if (this.stopped || this.seen.has(step) || !STEPS[step]) return;
      this.seen.add(step);
      this.ui.showGuide(STEPS[step], () => this.stop());
    }

    stop() {
      this.stopped = true;
      this.ui.hideGuide();
    }
  }

  Object.assign(Resistance, { Guide });
})();
