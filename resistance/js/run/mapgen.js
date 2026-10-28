// Génération de la carte de run d'un pays, façon Slay the Spire.
// Les étages vont de gauche à droite ; le dernier est le général. On trace plusieurs
// chemins qui avancent d'un étage à la fois en changeant au plus d'un couloir,
// sans jamais croiser un chemin déjà tracé. Les nœuds sont l'union de ces chemins.
(() => {
  'use strict';
  const { ITEMS } = Resistance;

  const GRID_W = 15;

  function generateRunMap(rng, country) {
    const F = country.floors;
    const L = country.lanes;
    const nodes = [];
    const at = new Map(); // "étage,couloir" -> nœud

    const spacing = Math.floor((GRID_W - 3) / (F - 1));
    const xOf = (floor) => GRID_W - 1 - (F - 1 - floor) * spacing;
    const yOf = (lane) => 2 + Math.round((lane * 6) / Math.max(1, L - 1));

    const add = (floor, lane, x, y) => {
      const n = { id: nodes.length, floor, lane, x, y, type: null, encounter: null, event: null, next: [] };
      nodes.push(n);
      return n;
    };
    const boss = add(F - 1, null, xOf(F - 1), 5);
    const nodeAt = (floor, lane) => {
      const k = `${floor},${lane}`;
      if (!at.has(k)) at.set(k, add(floor, lane, xOf(floor), yOf(lane)));
      return at.get(k);
    };
    const link = (a, b) => { if (!a.next.includes(b.id)) a.next.push(b.id); };

    // Un passage de a vers b (couloirs) croise-t-il un lien déjà tracé à cet étage ?
    const crosses = (floor, a, b) => nodes.some((n) => n.floor === floor && n.lane !== null &&
      n.next.some((id) => {
        const d = nodes[id].lane;
        return d !== null && ((n.lane < a && d > b) || (n.lane > a && d < b));
      }));

    // Couloirs de départ distincts tant que possible
    const starts = shuffle([...Array(L).keys()], rng);
    for (let p = 0; p < country.paths; p++) {
      let lane = starts[p % L];
      for (let f = 0; f < F - 1; f++) {
        const n = nodeAt(f, lane);
        if (f === F - 2) { link(n, boss); break; }
        let nl = Math.max(0, Math.min(L - 1, lane + rng.int(-1, 1)));
        if (crosses(f, lane, nl)) nl = lane; // aller tout droit ne croise jamais (pas de ±1)
        link(n, nodeAt(f + 1, nl));
        lane = nl;
      }
    }

    // Types et rencontres, étage par étage : une rencontre évite de répéter
    // celle d'un nœud qui y mène, pour varier les combats le long d'un chemin.
    const pools = country.encounters;
    const parents = new Map(nodes.map((n) => [n.id, []]));
    for (const n of nodes) for (const id of n.next) parents.get(id).push(n);
    const pickFresh = (list, n) => {
      const used = parents.get(n.id).map((p) => p.encounter);
      const fresh = list.filter((e) => !used.includes(e));
      return pick(fresh.length ? fresh : list, rng);
    };
    // Jamais deux haltes (repos, marchand) de suite : l'étage avant le repos final est donc
    // toujours un combat, et un nœud qui suit une halte aussi.
    const isHalt = (n) => n.type === 'rest' || n.type === 'shop';
    const neighbours = (n) => [...parents.get(n.id), ...n.next.map((id) => nodes[id])];
    const combatEncounter = (n) => pickFresh(n.floor < country.earlyFloors ? pools.early : pools.combat, n);
    for (const n of [...nodes].sort((a, b) => a.floor - b.floor || a.id - b.id)) {
      if (n === boss) { n.type = 'boss'; n.encounter = pools.boss; continue; }
      if (n.floor === 0) n.type = 'combat';
      else if (n.floor === F - 2) n.type = 'rest';
      else {
        const w = { ...country.weights };
        if (n.floor < country.eliteMinFloor) w.elite = 0;
        if (n.floor < country.restMinFloor) w.rest = 0;
        if (n.floor < (country.shopMinFloor ?? 0)) w.shop = 0;
        if (n.floor < (country.eventMinFloor ?? 0) || !country.events?.length) w.event = 0;
        if (n.floor === F - 3 || parents.get(n.id).some(isHalt)) w.rest = w.shop = 0;
        n.type = weighted(w, rng);
      }
      if (n.type === 'combat') n.encounter = combatEncounter(n);
      if (n.type === 'elite') n.encounter = pickFresh(pools.elite, n);
      if (n.type === 'event') {
        // Chaque événement une seule fois par carte, tant qu'il en reste
        const unused = country.events.filter((e) => !nodes.some((m) => m.event === e));
        n.event = pick(unused.length ? unused : country.events, rng);
      }
    }

    // Au moins `minShops` marchands : l'or n'a de sens que s'il peut se dépenser.
    // On convertit des combats d'étages intermédiaires, tirés au hasard, de préférence
    // loin de toute autre halte.
    const shops = () => nodes.filter((n) => n.type === 'shop').length;
    const convertible = nodes.filter((n) => (n.type === 'combat' || n.type === 'event') && n.floor >= (country.shopMinFloor ?? 1) && n.floor < F - 3);
    while (shops() < (country.minShops ?? 0) && convertible.length) {
      const calm = convertible.filter((n) => !neighbours(n).some(isHalt));
      const list = calm.length ? calm : convertible;
      const n = list[rng.int(0, list.length - 1)];
      convertible.splice(convertible.indexOf(n), 1);
      n.type = 'shop';
      n.event = null;
      n.encounter = null;
    }

    // Au moins `minFightsPerPath` combats (élites comprises) sur chaque chemin jusqu'au
    // général, pour que l'armée puisse s'entraîner. On remplace des haltes du chemin le
    // plus calme par des combats (sans descendre sous `minShops`, sans toucher au repos final).
    const minFights = country.minFightsPerPath ?? 0;
    const isFight = (n) => n.type === 'combat' || n.type === 'elite';
    for (;;) {
      const best = new Map(); // nœud -> [combats minimum jusqu'au général, chemin correspondant]
      for (const n of [...nodes].sort((a, b) => b.floor - a.floor)) {
        if (n === boss) { best.set(n.id, [0, []]); continue; }
        const [f, path] = n.next.map((id) => best.get(id)).reduce((a, b) => (b[0] < a[0] ? b : a));
        best.set(n.id, [f + (isFight(n) ? 1 : 0), [n, ...path]]);
      }
      const [fights, path] = nodes.filter((n) => n.floor === 0).map((n) => best.get(n.id))
        .reduce((a, b) => (b[0] < a[0] ? b : a));
      if (fights >= minFights) break;
      // On sacrifie d'abord les repos intermédiaires (il y en a toujours un avant le général),
      // puis les marchands en trop, et les événements en dernier.
      const order = (n) => (n.type === 'rest' ? 0 : n.type === 'shop' ? 1 : 2);
      const halts = path.filter((n) => n.floor < F - 2 &&
        (n.type === 'rest' || n.type === 'event' || (n.type === 'shop' && shops() > (country.minShops ?? 0))));
      if (!halts.length) break;
      const first = Math.min(...halts.map(order));
      const pool = halts.filter((h) => order(h) === first);
      const n = pool[rng.int(0, pool.length - 1)];
      n.type = 'combat';
      n.event = null;
      n.encounter = combatEncounter(n);
    }
    // Au moins `minEvents` événements : un combat devient un événement, là où chaque chemin
    // garde assez de combats.
    const events = () => nodes.filter((n) => n.type === 'event').length;
    const weakest = () => Math.min(...nodes.filter((n) => n.floor === 0).map(function fights(n) {
      return n === boss ? 0 : (isFight(n) ? 1 : 0) + Math.min(...n.next.map((id) => fights(nodes[id])));
    }));
    const spare = nodes.filter((n) => n.type === 'combat' && n.floor >= (country.eventMinFloor ?? 1) && n.floor < F - 2);
    while (events() < (country.minEvents ?? 0) && spare.length) {
      const n = spare.splice(rng.int(0, spare.length - 1), 1)[0];
      n.type = 'event';
      if (weakest() < minFights) { n.type = 'combat'; continue; }
      n.encounter = null;
      const unused = country.events.filter((e) => !nodes.some((m) => m.event === e));
      n.event = pick(unused.length ? unused : country.events, rng);
    }
    for (const n of nodes) if (n.type === 'shop') n.stock = makeStock(country.shop, rng);

    return { nodes, boss, floors: F };
  }

  // Articles d'un marchand : { id, qty } (id d'objet ou d'arme).
  function makeStock(shop, rng) {
    const pool = [...shop.pool];
    const ids = [...shop.always];
    while (ids.length < shop.size && pool.length) ids.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
    return ids.map((id) => ({ id, qty: id in ITEMS ? (ITEMS[id].stock ?? shop.itemStock) : 1 }));
  }

  function shuffle(a, rng) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(list, rng) {
    return list[rng.int(0, list.length - 1)];
  }

  function weighted(weights, rng) {
    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    let r = rng.next() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of entries) {
      if ((r -= w) < 0) return k;
    }
    return entries[entries.length - 1][0];
  }

  Object.assign(Resistance, { generateRunMap });
})();
