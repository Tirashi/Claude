// Enchaînement d'une run : carte du pays -> combat, repos ou marchand -> carte… jusqu'au général.
// `scene` est l'écran actif (RunMapScene ou Battle) : main.js lui transmet les entrées.
(() => {
  'use strict';
  const { Battle, Guide, ENCOUNTERS, FORTRESS, META_RULES, PREPARATION, fortressBonuses, veteranPrice, RECRUITMENT, CAPTAIN, traitLabel, COUNTRIES, ITEMS, WEAPONS, CLASSES, EVENTS, WEAPON_UPGRADES, ITEM_ICONS, armyHtml, iconHtml, numberHtml, effectiveText, loadMeta, saveMeta, loadRun, saveRun, clearRun, Run, randomSeed, canWield, shopEntry, prepEntry, prepText, prepBonuses, veteranReturnLevel, RunMapScene, FortressScene } = Resistance;

  const goldIcon = () => iconHtml(ITEM_ICONS.gold.sheet, ITEM_ICONS.gold.at);
  const suppliesIcon = () => iconHtml(ITEM_ICONS.supplies.sheet, ITEM_ICONS.supplies.at);

  // Ce que le Mémorial retient d'un soldat (sauvegardé dans meta.veteran)
  const veteranSnapshot = (r) => ({
    name: r.name, cls: r.cls, trait: r.trait ?? null, captainTraits: [...(r.captainTraits ?? [])],
    grade: r.grade ?? 0, level: r.level,
  });

  // Ligne de butin : « +35 or · +1 ravitaillement »
  function lootHtml({ gold, supplies }) {
    const parts = [];
    if (gold) parts.push(`${goldIcon()} ${numberHtml(`+${gold}`)}`);
    if (supplies) parts.push(`${suppliesIcon()} ${numberHtml(`+${supplies}`)}`);
    return parts.length ? `<p>Butin : ${parts.join(' · ')}</p>` : '';
  }

  class Game {
    constructor(ui) {
      this.ui = ui;
      this.run = null;
      this.scene = null;
      this.meta = loadMeta();
    }

    // ------------------------------------------------------------ forteresse (hub)
    // seed : graine imposée pour la prochaine run (?seed= dans l'URL), sinon tirée au départ
    showFortress(seed = null) {
      this.nextSeed = seed;
      this.run = null;
      window.__run = null;
      window.__battle = null;
      this.ui.hideEnd();
      this.ui.hideAll();
      this.ui.setMode('fortress');
      this.refreshFortressResources();
      this.scene = new FortressScene(this.meta, this.ui, {
        onUpgrade: (id) => this.confirmUpgrade(id),
        onExchange: (id) => this.treasury(id),
        onPrepare: () => this.quartermaster(),
        onDepart: () => this.confirmDepart(),
      });
    }

    // Intendance : préparer la prochaine run avec l'or du trésor. Les préparatifs sont gardés
    // (sauvegardés) jusqu'au départ suivant ; « Tout rendre » rembourse ce qui n'est pas parti.
    async quartermaster() {
      if (this.ui.modalOpen) return 'cancel';
      const prep = (this.meta.prep ??= {});
      for (;;) {
        const gold = this.meta.gold ?? 0;
        const offers = this.prepOffers();
        const vet = this.meta.veteran;
        const choices = offers.map((p) => {
          const def = prepEntry(p.id), have = prep[p.id] ?? 0;
          const isWeapon = !!WEAPONS[p.id];
          let name = def.name, detail = def.desc;
          if (isWeapon) {
            detail = `Pui ${def.mt} · Pré ${def.hit} · Portée ${def.min === def.max ? def.min : `${def.min}-${def.max}`}`
              + (effectiveText(def) ? ` · <span class="trait">${effectiveText(def)}</span>` : '');
          } else if (p.id === 'veteran') {
            // Le vétéran du Mémorial : il reviendra avec un grade de plus, et le niveau calculé
            // comme au départ (part gardée du Mémorial, Salle d'armes, manuels déjà préparés)
            const b = prepBonuses(prep, fortressBonuses(this.meta.upgrades));
            const back = veteranReturnLevel(vet, META_RULES.veteranKeep + (b.veteranKeep ?? 0), b.startLevels ?? 0);
            name = `Rappeler ${vet.name}`;
            detail = `${CLASSES[vet.cls].name} · reviendra au niveau ${back} (niveau ${vet.level} au Mémorial)`
              + ` · Capitaine (grade ${Math.min(CAPTAIN.maxGrade, (vet.grade ?? 0) + 1)})`
              + (traitLabel(vet) ? ` · <span class="trait">${traitLabel(vet)}</span>` : '');
          }
          return {
            id: p.id,
            disabled: have >= p.max || gold < p.price,
            html: `${iconHtml(isWeapon ? 'weapons' : 'items', def.icon)}
              <span class="choice-main"><b>${name}</b> <span class="unit-class">${have}/${p.max}</span><br>
              <span class="unit-class">${detail}</span></span>
              <span class="price">${goldIcon()} ${numberHtml(p.price)}</span>`,
          };
        });
        const ready = prepText(prep);
        const pick = await this.ui.showChoices({
          title: 'Intendance',
          body: `<p>Trésor : ${goldIcon()} ${numberHtml(gold)}</p>
            <p>Pour la prochaine campagne : ${ready || 'rien'}</p>
            <p class="unit-class">Les objets partent dans le sac ; chaque arme remplace celle d'une recrue qui la manie.</p>`,
          choices,
          buttons: [...(ready ? [{ id: 'refund', label: 'Tout rendre' }] : []), { id: 'close', label: 'Fermer' }],
          cancel: 'close',
        });
        if (pick === 'close') return 'cancel';
        if (pick === 'refund') {
          for (const [id, n] of Object.entries(prep)) {
            this.meta.gold = (this.meta.gold ?? 0) + n * this.prepPrice(id);
          }
          this.meta.prep = {};
          saveMeta(this.meta);
          this.refreshFortressResources();
          return this.quartermaster();
        }
        const p = offers.find((e) => e.id === pick);
        if (gold >= p.price && (prep[p.id] ?? 0) < p.max) {
          this.meta.gold = gold - p.price;
          prep[p.id] = (prep[p.id] ?? 0) + 1;
          saveMeta(this.meta);
          this.refreshFortressResources();
        }
      }
    }

    // Préparatifs proposés à l'Intendance : le rappel du vétéran (Mémorial construit et un
    // vétéran désigné), puis la liste fixe PREPARATION.
    prepOffers() {
      const vet = (this.meta.upgrades.memorial ?? 0) > 0 && this.meta.veteran;
      return [...(vet ? [{ id: 'veteran', price: veteranPrice(this.meta.veteran), max: 1 }] : []), ...PREPARATION];
    }

    prepPrice(id) {
      return id === 'veteran' ? veteranPrice(this.meta.veteran) : PREPARATION.find((p) => p.id === id).price;
    }

    refreshFortressResources() {
      this.ui.setResources({ gold: this.meta.gold ?? 0, supplies: this.meta.supplies });
    }

    // Comptoir de la Trésorerie : acheter du ravitaillement avec l'or du trésor, ou améliorer
    // le bâtiment. Renvoie 'ok' si une amélioration a eu lieu (pour l'animation « Niveau 2 ! »).
    async treasury(id) {
      if (this.ui.modalOpen) return 'cancel';
      const b = FORTRESS.buildings[id];
      const price = META_RULES.supplyPrice;
      const gIcon = iconHtml(ITEM_ICONS.gold.sheet, ITEM_ICONS.gold.at);
      const sIcon = iconHtml(ITEM_ICONS.supplies.sheet, ITEM_ICONS.supplies.at);
      let result = 'cancel';
      for (;;) {
        const lvl = this.meta.upgrades[id] ?? 0, gold = this.meta.gold ?? 0;
        const share = Math.round(Math.min(1, META_RULES.goldKept + (fortressBonuses(this.meta.upgrades).goldKept ?? 0)) * 100);
        const buy = (n) => ({
          id: `buy${n}`, disabled: gold < price * n,
          html: `${sIcon}<span class="choice-main"><b>Acheter ${n} ravitaillement${n > 1 ? 's' : ''}</b></span>
            <span class="price">${gIcon} ${numberHtml(price * n)}</span>`,
        });
        const maxed = lvl >= b.costs.length;
        const choices = [buy(1), buy(5), {
          id: 'upgrade', disabled: maxed || this.meta.supplies < b.costs[lvl],
          html: `<span class="choice-main"><b>${maxed ? 'Niveau maximum' : `${lvl ? 'Améliorer' : 'Construire'} la Trésorerie`}</b><br>
            <span class="unit-class">${b.effectText}</span></span>
            ${maxed ? '' : `<span class="price">${sIcon} ${numberHtml(b.costs[lvl])}</span>`}`,
        }];
        const pick = await this.ui.showChoices({
          title: 'Trésorerie',
          body: `<p>Trésor : ${gIcon} ${numberHtml(gold)} · Ravitaillement : ${sIcon} ${numberHtml(this.meta.supplies)}</p>
            <p class="unit-class">En fin de run, ${numberHtml(share)} % de l'or restant rejoint le trésor.</p>`,
          choices, buttons: [{ id: 'close', label: 'Fermer' }], cancel: 'close',
        });
        if (pick === 'close') return result;
        if (pick === 'upgrade') {
          if (await this.confirmUpgrade(id) === 'ok') { result = 'ok'; return result; }
          continue;
        }
        const n = pick === 'buy5' ? 5 : 1;
        if (gold >= price * n) {
          this.meta.gold = gold - price * n;
          this.meta.supplies += n;
          saveMeta(this.meta);
          this.refreshFortressResources();
        }
      }
    }

    // Partir en campagne demande une confirmation (un clic au hasard ne doit pas lancer une run),
    // avec le rappel de ce que la forteresse apporte à cette run.
    async confirmDepart() {
      if (this.ui.modalOpen || !(this.scene instanceof FortressScene)) return;
      const b = prepBonuses(this.meta.prep, fortressBonuses(this.meta.upgrades));
      const ready = prepText(this.meta.prep);
      const vet = this.meta.prep?.veteran && this.meta.veteran;
      const perks = [
        vet ? `le Capitaine ${vet.name}` : null,
        `${RECRUITMENT.slots + (b.slots ?? 0) - (vet ? 1 : 0)} soldats à recruter parmi ${RECRUITMENT.candidates + (b.candidates ?? 0)} candidats`,
        b.startLevels ? `recrues au niveau ${1 + b.startLevels}` : null,
        b.startRations ? `${b.startRations} rations dans le sac` : null,
        b.startPhoenix ? `${b.startPhoenix} Fleur${b.startPhoenix > 1 ? "s" : ""} du phénix` : null,
        b.afterBattleHeal ? `+${Math.round(b.afterBattleHeal * 100)} % de PV après chaque victoire` : null,
      ].filter(Boolean);
      const choice = await this.ui.showRunPanel({
        title: 'Partir en campagne ?',
        body: `<p>Cap sur ${COUNTRIES.marches.name}.</p><p class="unit-class">${perks.join(' · ')}</p>
          ${ready ? `<p>Préparatifs de l'Intendance : ${ready}</p>` : ''}`,
        buttons: [{ id: 'go', label: 'En route !' }, { id: 'stay', label: 'Rester' }],
        cancel: 'stay',
      });
      if (choice === 'go' && this.scene instanceof FortressScene) this.newRun(this.nextSeed ?? randomSeed());
    }

    // Le ravitaillement se gagne lentement : chaque construction est confirmée avant d'être payée.
    async confirmUpgrade(id) {
      if (this.ui.modalOpen) return 'cancel';
      const b = FORTRESS.buildings[id];
      const lvl = this.meta.upgrades[id] ?? 0;
      if (lvl >= b.costs.length) return 'max';
      const cost = b.costs[lvl];
      if (this.meta.supplies < cost) return 'poor';
      const icon = iconHtml(ITEM_ICONS.supplies.sheet, ITEM_ICONS.supplies.at);
      const choice = await this.ui.showRunPanel({
        title: `${lvl ? 'Améliorer' : 'Construire'} : ${b.name} ?`,
        body: `<p>Niveau ${lvl} → ${lvl + 1} : ${b.effectText}</p>
          <p class="unit-class">Coût ${icon} ${numberHtml(cost)} · il restera ${icon} ${numberHtml(this.meta.supplies - cost)}</p>`,
        buttons: [{ id: 'build', label: lvl ? 'Améliorer' : 'Construire' }, { id: 'cancel', label: 'Annuler' }],
        cancel: 'cancel',
      });
      return choice === 'build' ? this.upgrade(id) : 'cancel';
    }

    // Construit ou améliore un bâtiment : 'ok', 'poor' (pas assez de ravitaillement) ou 'max'
    upgrade(id) {
      const b = FORTRESS.buildings[id];
      const lvl = this.meta.upgrades[id] ?? 0;
      if (lvl >= b.costs.length) return 'max';
      if (this.meta.supplies < b.costs[lvl]) return 'poor';
      this.meta.supplies -= b.costs[lvl];
      this.meta.upgrades[id] = lvl + 1;
      saveMeta(this.meta);
      this.refreshFortressResources();
      return 'ok';
    }

    // ------------------------------------------------------------ run
    // Run sauvegardée (le téléphone a fermé le jeu) : on la reprend là où elle en était.
    // Un combat interrompu recommence à son début (même graine : mêmes ennemis). Renvoie false
    // s'il n'y a rien à reprendre.
    resumeRun() {
      const data = loadRun();
      if (!data) return false;
      let run;
      try {
        run = Run.fromSave(data);
        if (!run.country || !run.army.length) throw new Error('run incomplète');
      } catch (err) {
        console.warn('Run sauvegardée illisible, ignorée :', err);
        clearRun();
        return false;
      }
      this.run = run;
      window.__run = run;
      this.ui.setSeed(run.seed);
      const node = data.at === null ? null : run.node(data.at);
      if (!node) { this.showMap(); return true; }
      this.ui.setMode('map');
      this.refreshResources();
      if (node.type === 'event' && node.encounter) this.startBattle(node); // combat d'un événement
      else this.enter(node);
      return true;
    }

    // Sauvegarde de la run en cours (at : nœud où reprendre, null : sur la carte).
    // Rien avant la fin du recrutement : la run n'a pas encore d'armée.
    saveRun(at = null) {
      if (this.run?.army.length && !this.run.over) saveRun(this.run.toSave(at));
    }

    newRun(seed = randomSeed()) {
      this.ui.hideEnd();
      this.ui.hideAll();
      this.ui.setSeed(seed);
      // Les préparatifs de l'Intendance (manuel : niveaux de départ) s'ajoutent à la forteresse
      const prep = { ...(this.meta.prep ?? {}) };
      const bonuses = prepBonuses(prep, fortressBonuses(this.meta.upgrades));
      const run = new Run(seed, undefined, bonuses);
      // Vétéran rappelé à l'Intendance : il revient en Capitaine et prend une place de l'armée
      if (prep.veteran && this.meta.veteran) {
        run.recallVeteran(this.meta.veteran, META_RULES.veteranKeep + (bonuses.veteranKeep ?? 0));
      }
      this.run = run;
      window.__run = run; // pratique pour déboguer dans la console
      this.showMap();
      this.recruit(run, prep);
    }

    // La carte s'affiche derrière la fenêtre de recrutement ; l'armée y apparaît ensuite.
    // Les préparatifs ne sont consommés qu'une fois l'armée recrutée et équipée.
    async recruit(run, prep = {}) {
      const vet = run.veteran;
      const intro = vet ? `<p class="trait">Le Capitaine ${vet.name} (${CLASSES[vet.cls].name}, Niv ${vet.level}) prend la tête de l'armée.</p>` : '';
      const picks = await this.ui.showRecruitment(run.candidates, run.recruitSlots, intro);
      if (this.run !== run) return; // une autre run a été lancée entre-temps
      run.recruit(picks);
      if (vet) this.meta.veteran = veteranSnapshot(vet); // son nouveau grade compte pour le prochain rappel
      delete prep.veteran;
      const kept = await this.equipPrepared(run, run.addPreparations(prep));
      this.meta.prep = kept;
      saveMeta(this.meta);
      this.showMap();
    }

    // Chaque arme préparée est confiée à une recrue qui la manie, ou reste à l'Intendance.
    // Renvoie les préparatifs gardés pour une prochaine run ({ id: quantité }).
    async equipPrepared(run, weapons) {
      const kept = {}, unused = [];
      const keep = (id) => { kept[id] = (kept[id] ?? 0) + 1; };
      for (const id of weapons) {
        const weapon = WEAPONS[id];
        const users = run.army.filter((r) => canWield(r.cls, id));
        if (!users.length) { keep(id); unused.push(weapon.name); continue; }
        const who = await this.ui.showChoices({
          title: `Qui reçoit : ${weapon.name} ?`,
          body: `<p class="unit-class">Préparée à l'Intendance. Elle remplace l'arme de départ.</p>`,
          choices: users.map((r) => ({
            id: r.armyId,
            html: `<span class="choice-main"><b>${r.name}</b> <span class="unit-class">${CLASSES[r.cls].name}</span><br>
              <span class="unit-class">${iconHtml('weapons', WEAPONS[r.weapon].icon)} ${WEAPONS[r.weapon].name}</span></span>`,
          })),
          buttons: [{ id: 'keep', label: "Garder à l'Intendance" }], cancel: 'keep',
        });
        if (who === 'keep' || !run.equip(who, id)) keep(id);
      }
      if (unused.length) {
        await this.ui.showRunPanel({
          title: 'Armes en réserve',
          body: `<p>Aucune recrue ne manie : ${unused.join(', ')}.</p>
            <p class="unit-class">${unused.length > 1 ? 'Elles restent' : 'Elle reste'} à l'Intendance pour une prochaine campagne.</p>`,
        });
      }
      return kept;
    }

    showMap() {
      this.ui.hideAll();
      this.ui.setMode('map');
      this.refreshResources();
      this.scene = new RunMapScene(this.run, this.ui, (node) => this.enter(node));
      window.__battle = null;
      this.saveRun();
    }

    refreshResources() {
      this.ui.setResources({ gold: this.run.gold, supplies: this.run.supplies });
    }

    async enter(node) {
      this.run.moveTo(node);
      this.saveRun(node.id);
      if (node.type === 'rest') {
        const report = this.run.rest();
        const loot = this.run.collectRewards(node);
        this.refreshResources();
        await this.ui.showRunPanel({
          title: 'Repos', body: `<p>L'armée reprend des forces.</p>${lootHtml(loot)}${armyHtml(report)}`,
        });
        this.showMap();
        return;
      }
      if (node.type === 'shop') {
        await this.shop(node);
        this.showMap();
        return;
      }
      if (node.type === 'event') {
        await this.event(node);
        return;
      }
      this.startBattle(node);
    }

    // ------------------------------------------------------------ événements
    // Une scène, des choix (events.js) ; l'issue s'affiche, puis retour à la carte,
    // ou combat si le choix en déclenche un.
    async event(node) {
      const { run, ui } = this;
      const ev = EVENTS[node.event];
      const rng = run.eventRng(node);
      const pick = await ui.showChoices({
        title: ev.title,
        body: `<p>${ev.text}</p>`,
        choices: ev.choices.map((c, i) => ({
          id: i,
          disabled: !run.canChoose(c),
          html: `<span class="choice-main"><b>${c.label}</b>${c.desc ? `<br><span class="unit-class">${c.desc}</span>` : ''}</span>
            ${c.cost?.gold ? `<span class="price">${goldIcon()} ${numberHtml(c.cost.gold)}</span>` : ''}`,
        })),
      });
      const result = run.applyOutcome(ev.choices[pick], rng);
      if (result.upgradeWeapon) {
        const users = run.upgradableUnits();
        const who = await ui.showChoices({
          title: 'Quelle arme reforger ?',
          choices: users.map((r) => {
            const to = WEAPONS[WEAPON_UPGRADES[r.weapon]];
            return {
              id: r.armyId,
              html: `<span class="choice-main"><b>${r.name}</b> <span class="unit-class">${CLASSES[r.cls].name}</span><br>
                <span class="unit-class">${iconHtml('weapons', WEAPONS[r.weapon].icon)} ${WEAPONS[r.weapon].name} →
                ${iconHtml('weapons', to.icon)} ${to.name}</span></span>`,
            };
          }),
        });
        const rec = run.army.find((r) => r.armyId === who);
        const to = WEAPONS[WEAPON_UPGRADES[rec.weapon]];
        run.equip(who, WEAPON_UPGRADES[rec.weapon]);
        result.lines.push(`${rec.name} reçoit : ${to.name}`);
      }
      this.refreshResources();
      if (result.battle) {
        // Combat de l'événement : le butin promis remplace celui d'un combat ordinaire
        node.encounter = result.battle;
        node.loot = result.loot;
        await ui.showRunPanel({ title: ev.title, body: `<p>${result.text}</p>`, buttons: [{ id: 'go', label: 'Au combat !' }] });
        this.startBattle(node);
        return;
      }
      const lines = result.lines.length ? `<p class="unit-class">${result.lines.join(' · ')}</p>` : '';
      await ui.showRunPanel({ title: ev.title, body: `<p>${result.text}</p>${lines}` });
      this.showMap();
    }

    // ------------------------------------------------------------ marchand
    async shop(node) {
      const { run, ui } = this;
      for (;;) {
        const choices = node.stock.map((entry, i) => {
          const def = shopEntry(entry.id);
          const isItem = !!ITEMS[entry.id];
          const users = isItem ? run.livingArmy() : run.livingArmy().filter((r) => canWield(r.cls, entry.id));
          const detail = isItem ? def.desc
            : `Pui ${def.mt} · Pré ${def.hit} · Portée ${def.min === def.max ? def.min : `${def.min}-${def.max}`}`
              + (effectiveText(def) ? ` · <span class="trait">${effectiveText(def)}</span>` : '');
          const stock = entry.qty <= 0 ? 'Épuisé' : isItem ? `×${entry.qty}` : '';
          return {
            id: i,
            disabled: entry.qty <= 0 || run.gold < def.price || !users.length,
            html: `${iconHtml(isItem ? 'items' : 'weapons', def.icon)}
              <span class="choice-main"><b>${def.name}</b> <span class="unit-class">${stock}</span><br>
              <span class="unit-class">${detail}${!isItem && !users.length ? ' · personne ne la manie' : ''}</span></span>
              <span class="price">${goldIcon()} ${numberHtml(def.price)}</span>`,
          };
        });
        const bag = Object.entries(run.inventory).map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(', ') || 'vide';
        const pick = await ui.showChoices({
          title: 'Marchand',
          body: `<p>Or : ${goldIcon()} ${numberHtml(run.gold)} · Sac : ${bag}</p>`,
          choices, buttons: [{ id: 'leave', label: 'Partir' }], cancel: 'leave',
        });
        if (pick === 'leave') return;
        const entry = node.stock[pick];
        if (ITEMS[entry.id]) {
          run.buy(entry);
        } else {
          const weapon = WEAPONS[entry.id];
          const users = run.livingArmy().filter((r) => canWield(r.cls, entry.id));
          const who = await ui.showChoices({
            title: `Qui reçoit : ${weapon.name} ?`,
            body: '<p class="unit-class">Son arme actuelle sera abandonnée.</p>',
            choices: users.map((r) => ({
              id: r.armyId,
              html: `<span class="choice-main"><b>${r.name}</b><br><span class="unit-class">
                ${iconHtml('weapons', WEAPONS[r.weapon].icon)} ${WEAPONS[r.weapon].name}</span></span>`,
            })),
            buttons: [{ id: 'back', label: 'Retour' }], cancel: 'back',
          });
          if (who !== 'back') run.buy(entry, who);
        }
        this.refreshResources();
        this.saveRun(node.id);
      }
    }

    // ------------------------------------------------------------ combats
    // Bouton « Retraite » : filet de sécurité si le combat est impossible à gagner
    // (personne ne peut blesser le dernier ennemi, par exemple).
    async confirmRetreat() {
      const battle = this.scene;
      if (!(battle instanceof Battle) || this.ui.modalOpen || battle.phase !== 'player'
        || battle.state === 'busy' || battle.state === 'over') return;
      const boss = this.run.current?.type === 'boss';
      const choice = await this.ui.showRunPanel({
        title: 'Battre en retraite ?',
        body: `<p>${boss ? 'Fuir le général met fin à la run (le ravitaillement gagné est gardé).'
          : 'Pas de butin pour ce combat. Les unités tombées restent tombées ; la run continue.'}</p>`,
        buttons: [{ id: 'stay', label: 'Continuer le combat' }, { id: 'retreat', label: 'Retraite' }],
        cancel: 'stay',
      });
      if (choice === 'retreat' && this.scene === battle) battle.retreat();
    }

    // « Fin du tour » alors que des soldats n'ont pas joué : on demande d'abord
    async confirmEndTurn() {
      const battle = this.scene;
      if (!(battle instanceof Battle) || this.ui.modalOpen || battle.phase !== 'player'
        || battle.state === 'busy' || battle.state === 'over') return;
      const idle = battle.idleUnits();
      if (idle.length) {
        const names = idle.map((u) => u.name).join(', ');
        const choice = await this.ui.showRunPanel({
          title: 'Finir le tour ?',
          body: `<p>${idle.length > 1 ? `${idle.length} soldats n'ont pas joué` : "Un soldat n'a pas joué"} : ${names}.</p>`,
          buttons: [{ id: 'back', label: 'Revenir' }, { id: 'end', label: 'Finir le tour' }],
          cancel: 'back',
        });
        if (choice !== 'end' || this.scene !== battle) return;
      }
      battle.endPlayerPhase();
    }

    startBattle(node) {
      const { run, ui } = this;
      ui.hideRunPanels();
      ui.hideAll();
      ui.setMode('battle');
      ui.setEndTurnEnabled(true);
      const battle = new Battle({
        encounter: ENCOUNTERS[node.encounter],
        army: run.livingArmy(),
        inventory: run.inventory,
        seed: run.battleSeed(node),
        levelBonus: run.levelBonus(node),
        ui,
        guide: this.meta.guideDone ? null : new Guide(ui),
        onEnd: (win) => this.endBattle(node, battle, win),
      });
      ui.setDangerOn(battle.dangerOn);
      this.scene = battle;
      window.__battle = battle;
      this.saveRun(node.id); // interrompu, le combat reprendra à son début
      battle.start();
    }

    async endBattle(node, battle, win) {
      const { run, ui } = this;
      ui.hideGuide();
      if (battle.guide && !this.meta.guideDone) { this.meta.guideDone = true; saveMeta(this.meta); }
      if (win === true) run.stats.won += 1;
      run.stats.turns += battle.turn;
      const floors = run.map.floors;
      if (win === 'retreat') {
        // L'armée garde ses niveaux et son EXP, les tombés restent tombés ; pas de butin ni de soin.
        const report = run.applyBattle(battle, { heal: false });
        if (node.type !== 'boss') this.saveRun();
        if (node.type === 'boss') {
          this.endRun(false, "L'armée s'est repliée devant le général : le pays reste sous le joug du tyran.", 'Retraite');
          return;
        }
        await ui.showRunPanel({
          title: 'Retraite', body: `<p>L'armée se replie sans butin et reprend sa route.</p>${armyHtml(report)}`,
        });
        this.showMap();
        return;
      }
      if (!win) {
        run.applyBattle(battle, { heal: false, revive: false }); // niveaux de ce dernier combat (Mémorial)
        this.endRun(false, `La rébellion est écrasée… (étage ${node.floor + 1}/${floors}).`);
        return;
      }
      const report = run.applyBattle(battle);
      const loot = run.collectRewards(node);
      this.refreshResources();
      if (node.type !== 'boss') this.saveRun();
      if (node.type === 'boss') {
        this.endRun(true, run.country.liberated, 'Pays libéré !');
        return;
      }
      const turns = `${battle.turn} tour${battle.turn > 1 ? 's' : ''}`;
      await ui.showRunPanel({
        title: 'Victoire !', body: `<p>Combat gagné en ${turns}.</p>${lootHtml(loot)}${armyHtml(report)}`,
      });
      this.showMap();
    }

    // Fin de run : le ravitaillement gagné (au moins META_RULES.minSuppliesPerRun) rejoint les
    // réserves, et une part de l'or restant va au trésor de la rébellion (sauvegardés).
    // Avec le Mémorial, on désigne ensuite le vétéran qui pourra revenir comme Capitaine.
    async endRun(win, text, title) {
      const { run } = this;
      run.over = true;
      clearRun();
      const supplies = Math.max(META_RULES.minSuppliesPerRun, run.supplies);
      const share = Math.min(1, META_RULES.goldKept + (fortressBonuses(this.meta.upgrades).goldKept ?? 0));
      const gold = Math.floor(run.gold * share);
      this.meta.supplies += supplies;
      this.meta.gold = (this.meta.gold ?? 0) + gold;
      this.meta.runs += 1;
      if (win) this.meta.wins = (this.meta.wins ?? 0) + 1;
      saveMeta(this.meta);
      if (run.army.length) await this.showReport(run, win);
      if ((this.meta.upgrades.memorial ?? 0) > 0 && run.army.length) await this.chooseVeteran(run);
      this.ui.showEnd(win, `${text} Rapporté à la forteresse : +${supplies} ravitaillement`
        + ` et +${gold} or (${Math.round(share * 100)} % de l'or restant).`, title);
    }

    // Bilan de la campagne : étage atteint, combats gagnés, ennemis vaincus, et chaque soldat
    // (ses victoires, où il est tombé). Le héros est celui qui a vaincu le plus d'ennemis.
    async showReport(run, win) {
      const kills = run.army.reduce((n, r) => n + (r.kills ?? 0), 0);
      const hero = [...run.army].sort((a, b) => (b.kills ?? 0) - (a.kills ?? 0) || b.level - a.level)[0];
      const floor = Math.max(0, run.floor) + 1;
      const fallen = run.army.filter((r) => !r.alive).length;
      const rows = run.army.map((r) => `<div class="army-row${r.alive ? '' : ' fallen'}">
          <span class="unit-name player">${r === hero && hero.kills ? '★ ' : ''}${r.name}</span>
          <span class="unit-class">${CLASSES[r.cls].name}</span><span>Niv ${r.level}</span>
          <span class="army-hp">${r.kills ?? 0} ennemi${(r.kills ?? 0) > 1 ? 's' : ''} vaincu${(r.kills ?? 0) > 1 ? 's' : ''}
            · ${r.alive ? '<span class="fc-adv">A survécu</span>' : `<span class="fc-dis">Tombé${r.fellAt ? ` : ${r.fellAt}` : ''}</span>`}</span>
        </div>`).join('');
      await this.ui.showRunPanel({
        title: win ? 'Bilan de la victoire' : 'Bilan de la campagne',
        body: `<p>${win ? 'Pays libéré' : `Étage ${floor}/${run.map.floors}`} · ${run.stats.won} combat${run.stats.won > 1 ? 's' : ''} gagné${run.stats.won > 1 ? 's' : ''}
            · ${kills} ennemi${kills > 1 ? 's' : ''} vaincu${kills > 1 ? 's' : ''} · ${fallen ? `${fallen} tombé${fallen > 1 ? 's' : ''}` : 'aucune perte'}</p>
          ${hero?.kills ? `<p>★ Héros de la campagne : <b>${hero.name}</b> (${hero.kills} ennemi${hero.kills > 1 ? 's' : ''} vaincu${hero.kills > 1 ? 's' : ''})</p>` : ''}
          <div class="army-list">${rows}</div>`,
      });
    }

    // Mémorial : un soldat de la run (mort ou vivant) devient le vétéran, à la place du précédent.
    async chooseVeteran(run) {
      const current = this.meta.veteran;
      const inRun = current && run.army.some((r) => r.name === current.name && r.cls === current.cls);
      const pick = await this.ui.showChoices({
        title: 'Mémorial',
        body: `<p>Qui entre au Mémorial ? Il pourra être rappelé à l'Intendance comme Capitaine.</p>
          ${current && !inRun ? `<p class="unit-class">Vétéran actuel : ${current.name} (${CLASSES[current.cls].name}, Niv ${current.level}) : il sera remplacé.</p>` : ''}`,
        choices: run.army.map((r) => {
          const label = traitLabel(r);
          return {
            id: r.armyId,
            html: `<span class="portrait" style="background-image:url(assets/units/${CLASSES[r.cls].sprite}_blue.png)"></span>
              <span class="choice-main"><b>${r.name}</b> <span class="unit-class">${CLASSES[r.cls].name} · Niv ${r.level}</span><br>
              <span class="unit-class">${r.alive ? 'A survécu' : 'Tombé au combat'} · ${r.kills ?? 0} vaincu${(r.kills ?? 0) > 1 ? 's' : ''}${label ? ` · <span class="trait">${label}</span>` : ''}</span></span>`,
          };
        }),
        buttons: [{ id: 'none', label: current && !inRun ? `Garder ${current.name}` : 'Personne' }],
        cancel: 'none',
      });
      if (pick === 'none') return;
      this.meta.veteran = veteranSnapshot(run.army.find((r) => r.armyId === pick));
      saveMeta(this.meta);
    }

    showArmy() {
      if (!this.run?.army.length || !(this.scene instanceof RunMapScene) || this.ui.modalOpen) return;
      const list = this.run.army.map((r) => this.run.summary(r, { fallen: !r.alive }));
      const bag = Object.entries(this.run.inventory)
        .map(([id, n]) => `${iconHtml('items', ITEMS[id].icon)} ${ITEMS[id].name} ×${n}`).join(' · ') || 'vide';
      this.ui.showRunPanel({
        title: 'Armée rebelle', body: `${armyHtml(list)}<p class="bag">Sac : ${bag}</p>`,
        buttons: [{ id: 'close', label: 'Fermer' }], cancel: 'close',
      });
    }
  }

  Object.assign(Resistance, { Game });
})();
