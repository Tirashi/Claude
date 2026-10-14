/* =====================================================================
   Classements de la Ludothèque (Supabase), partagés par tous les jeux.
   - Le joueur rejoint le classement une fois : pseudo + code familial,
     vérifié auprès de Supabase, puis gardé dans ce navigateur.
   - Les records partent tout seuls ; hors connexion ils attendent dans
     une file et repartent au retour du réseau.
   - La clé ci-dessous est la clé PUBLIQUE du projet : elle est faite pour
     être visible. Sans le code familial, elle ne donne accès à rien
     (voir supabase/classements.sql).
   ===================================================================== */
(function () {
  "use strict";
  var URL = "https://hfoiofrgltzdyetoqpjc.supabase.co";
  var KEY = "sb_publishable_6nlzAAAG3LLLonztigio4g_0Q6dakQE";

  function get(k, d){ try { var v = localStorage.getItem("ludo." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v){ try { localStorage.setItem("ludo." + k, JSON.stringify(v)); } catch (e) {} }

  function uuid(){
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach(function (_, i){ b[i] = Math.random() * 256 | 0; });
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x){ return (x + 256).toString(16).slice(1); }).join("");
    return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
  }
  function player(){ var p = get("player", null); if (!p){ p = uuid(); set("player", p); } return p; }

  // appel d'une fonction Supabase ; la nouvelle clé « publishable » passe dans l'en-tête apikey
  function rpc(name, args){
    var go = function (withBearer){
      var h = {"Content-Type": "application/json", "apikey": KEY};
      if (withBearer) h.Authorization = "Bearer " + KEY;
      return fetch(URL + "/rest/v1/rpc/" + name, {method: "POST", headers: h, body: JSON.stringify(args)});
    };
    return go(false).then(function (r){ return r.status === 401 ? go(true) : r; }).then(function (r){
      return r.text().then(function (t){
        var data = null; try { data = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok){ var err = new Error((data && (data.message || data.hint)) || ("Erreur " + r.status)); err.status = r.status;
          // une fonction absente de Supabase (mise à jour SQL pas encore faite) : PGRST202
          err.code = /code familial/.test(t) ? "code" : (r.status === 404 || /PGRST202/.test(t)) ? "missing" : "http"; throw err; }
        return data;
      });
    });
  }

  function joined(){ return !!(get("pseudo", "") && get("code", "")); }
  function cleanPseudo(s){ return String(s || "").replace(/\s+/g, " ").trim().slice(0, 16); }

  // rejoindre : vérifie le code familial, puis publie les records déjà faits dans ce navigateur
  function join(pseudo, code){
    pseudo = cleanPseudo(pseudo); code = String(code || "").trim();
    if (!pseudo) return Promise.reject(new Error("Choisis un pseudo."));
    if (!code) return Promise.reject(new Error("Entre le code familial."));
    return rpc("ludo_check", {code: code}).then(function (ok){
      if (ok !== true) { var e = new Error("Ce code familial n'est pas le bon."); e.code = "code"; throw e; }
      return pseudoTaken(pseudo, code);
    }).then(function (taken){
      if (taken){ var e = new Error("Ce pseudo est déjà pris par quelqu'un d'autre de la famille : choisis-en un autre."); e.code = "pseudo"; throw e; }
      set("pseudo", pseudo); set("code", code); set("synced", SYNC); player();
      pushExisting(); flush();
      return true;
    });
  }
  function leave(){ set("code", ""); }

  // un pseudo est-il déjà utilisé par un autre joueur ? On regarde les principaux classements
  // (sans rien changer à Supabase : un joueur qui n'a encore aucun score n'y apparaît pas)
  var PSEUDO_BOARDS = [["tetris", "best"], ["snake", "best"], ["asteroids", "best"], ["solitaire", "best"], ["injagility", "best"],
    ["parcours", "total"], ["lignee", "arbres"], ["picross", "dex"], ["queens", "best:5"], ["queens", "best:6"], ["queens", "best:7"], ["touchecoule", "best:classic:normal"], ["amiral", "best:normal"], ["club", "rep"], ["orbite", "etoiles"], ["pontstellaire", "ciels"], ["alunissage", "best"], ["nebula", "best"], ["nebula", "victoires"]];
  function pseudoTaken(pseudo, code){
    var me = player(), want = pseudo.toLowerCase();
    return Promise.all(PSEUDO_BOARDS.map(function (gb){
      return rpc("ludo_board", {code: code, p_game: gb[0], p_board: gb[1], p_player: me, p_limit: 100}).catch(function (){ return []; });
    })).then(function (lists){
      return lists.some(function (rows){ return (rows || []).some(function (r){ return !r.me && String(r.pseudo).toLowerCase() === want; }); });
    }, function (){ return false; });
  }

  // records déjà présents dans ce navigateur, envoyés au moment de rejoindre
  var existing = [];
  function registerExisting(fn){ existing.push(fn); }
  function pushExisting(){ existing.forEach(function (fn){ try { (fn() || []).forEach(function (s){ queue(s); }); } catch (e) {} }); }

  // file d'attente : un score n'est jamais perdu, même hors connexion
  function queue(s){
    var q = get("queue", []).filter(function (x){ return !(x.game === s.game && x.board === s.board); });
    var prev = get("queue", []).find(function (x){ return x.game === s.game && x.board === s.board; });
    if (prev) s.value = s.low ? Math.min(prev.value, s.value) : Math.max(prev.value, s.value);
    q.push(s); set("queue", q.slice(-1000));   // assez pour tous les records d'un coup (207 Pokémon…)
  }
  function unqueue(s){ set("queue", get("queue", []).filter(function (x){ return !(x.game === s.game && x.board === s.board && x.value === s.value); })); }
  // envoi de la file, un score après l'autre : un score refusé par le serveur est jeté,
  // une coupure réseau (ou un code familial changé) arrête l'envoi jusqu'à la prochaine fois
  var flushing = null;
  function flush(){
    if (!joined() || flushing) return flushing || Promise.resolve();
    var q = get("queue", []); if (!q.length) return Promise.resolve();
    var sent = 0;
    flushing = q.reduce(function (p, s){
      return p.then(function (){ return send(s).then(function (){ unqueue(s); sent++; }, function (err){
        if (err && err.status >= 400 && err.status < 500 && err.code !== "code"){ unqueue(s); return; }
        if (err && err.code === "code") leave();
        throw err;
      }); });
    }, Promise.resolve()).catch(function (){}).then(function (){
      flushing = null;
      // des scores arrivés pendant l'envoi : on repart pour un tour
      if (sent && joined() && get("queue", []).length) return flush();
    });
    return flushing;
  }
  function send(s){
    return rpc("ludo_submit", {code: get("code", ""), p_player: player(), p_pseudo: get("pseudo", ""), p_game: s.game, p_board: s.board, p_value: s.value, p_low: !!s.low})
      .then(function (rows){ return rows && rows[0] ? {best: rows[0].best, rank: Number(rows[0].rank), total: Number(rows[0].total)} : null; });
  }

  // publier : renvoie la place du joueur, ou null (pas inscrit, ou hors connexion : le score attend dans la file)
  function submit(game, board, value, low){
    var s = {game: game, board: board, value: Number(value), low: !!low};
    if (!(s.value >= 0) || !isFinite(s.value)) return Promise.resolve(null);
    if (!joined()) return Promise.resolve(null);
    return send(s).then(function (res){ flush(); return res; }, function (err){
      if (err && err.status >= 400 && err.status < 500 && err.code !== "code") return null;   // refusé par le serveur
      queue(s);                                                    // hors connexion : il partira plus tard
      if (err && err.code === "code") leave();                     // le code a changé : il faudra le retaper
      return null;
    });
  }
  // le meilleur de chaque classement d'un jeu, en un appel (fonction ajoutée par classements-2.sql)
  function bests(game){
    if (!joined()) return Promise.resolve(null);
    return rpc("ludo_bests", {code: get("code", ""), p_game: game, p_player: player()})
      .catch(function (err){ if (err && err.code === "code") leave(); throw err; });
  }
  function board(game, b, limit){
    if (!joined()) return Promise.resolve(null);
    return rpc("ludo_board", {code: get("code", ""), p_game: game, p_board: b, p_player: player(), p_limit: limit || 20})
      .catch(function (err){ if (err && err.code === "code") leave(); throw err; });
  }

  // records déjà faits sur ce navigateur, envoyés en rejoignant le classement
  function readKey(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  var HINT_PENALTY = 30000;   // Picross : 30 s de pénalité par indice
  registerExisting(function (){
    var out = [], hi = function (game, board, v){ v = Number(v); if (v > 0) out.push({game: game, board: board, value: v, low: false}); },
        lo = function (game, board, v){ v = Number(v); if (v > 0) out.push({game: game, board: board, value: v, low: true}); };
    hi("tetris", "best", readKey("tetris16.best", 0));
    hi("snake", "best", readKey("snakeBestScore", 0));
    hi("asteroids", "best", readKey("asteroids16.best", 0));
    hi("solitaire", "best", readKey("solitaire16.best", 0));
    hi("injagility", "best", readKey("injagility.best", 0));
    var q = readKey("queens16.best", {}) || {}; Object.keys(q).forEach(function (n){ if (/^[5-9]$/.test(n)) lo("queens", "best:" + n, q[n]); });
    var d = readKey("lignee.daily", {}) || {};
    Object.keys(d).forEach(function (code){ if (/^[CR]2-J[0-9A-Z]+$/.test(code)) lo("lignee", "daily:" + code, d[code]); });
    var ls = readKey("lignee.stats", {}) || {}, trees = 0;
    Object.keys(ls).forEach(function (k){ var s = ls[k] || {}; trees += Number(s.n) || 0; if (/^[CR][1-4]$/.test(k)) lo("lignee", "best:" + k, s.best); });
    hi("lignee", "arbres", trees);
    var pc = readKey("injagility.parcours", {}) || {}, best = pc.best || {}, total = 0;
    Object.keys(best).forEach(function (n){ if (/^\d{1,3}$/.test(n)){ hi("parcours", "lvl:" + n, best[n]); total += Number(best[n]) || 0; } });
    hi("parcours", "total", total);
    var cap = readKey("picrossdex.captured", {}) || {}, ids = Object.keys(cap).filter(function (id){ return cap[id] && !cap[id].test; });
    ids.forEach(function (id){ var c = cap[id]; if (c.time > 0 && /^[a-z0-9_-]{1,36}$/.test(id)) lo("picross", "t:" + id, c.time + HINT_PENALTY * (c.hints || 0)); });
    hi("picross", "dex", ids.filter(function (id){ return id !== "pokeball"; }).length);
    var tc = readKey("touchecoule.best", {}) || {};
    Object.keys(tc).forEach(function (k){ if (/^(classic|arsenal):(easy|normal|hard)$/.test(k)) lo("touchecoule", "best:" + k, tc[k]); });
    var am = readKey("amiral.best", {}) || {};
    Object.keys(am).forEach(function (k){ if (/^(easy|normal|hard)$/.test(k)) lo("amiral", "best:" + k, am[k]); });
    var ob = readKey("orbite.stars", {}) || {}, stars = 0;
    Object.keys(ob).forEach(function (k){ if (/^\d{1,2}$/.test(k)) stars += Math.min(3, Number(ob[k]) || 0); });
    hi("orbite", "etoiles", stars);
    hi("alunissage", "best", readKey("alunissage.best", 0));
    var ad = readKey("alunissage.daily", {}) || {};
    Object.keys(ad).forEach(function (k){ if (/^\d{8}$/.test(k)) hi("alunissage", "daily:" + k, ad[k]); });
    hi("nebula", "best", readKey("nebula.best", 0));
    var nm = readKey("nebula.meta", {}) || {}; hi("nebula", "victoires", Number(nm.wins) || 0);
    var nd = readKey("nebula.daily", {}) || {};
    Object.keys(nd).forEach(function (k){ if (/^\d{8}$/.test(k)) hi("nebula", "daily:" + k, nd[k]); });
    var pb = readKey("pontstellaire.best", {}) || {}, pd = readKey("pontstellaire.daily", {}) || {};
    Object.keys(pb).forEach(function (k){ if (/^(7|9|11)$/.test(k)) lo("pontstellaire", "best:" + k, pb[k]); });
    Object.keys(pd).forEach(function (k){ if (/^\d{8}$/.test(k)) lo("pontstellaire", "daily:" + k, pd[k]); });
    hi("pontstellaire", "ciels", readKey("pontstellaire.wins", 0));
    var cs = readKey("club.save", null);
    if (cs && typeof cs === "object"){ hi("club", "rep", cs.bestRep || cs.rep || 0); if (cs.champion > 0) lo("club", "champion", cs.champion); }
    return out;
  });

  window.addEventListener("online", function (){ flush(); });
  // les joueurs déjà inscrits envoient une fois leurs records des jeux ajoutés depuis (version 6 : avec Nebula)
  var SYNC = 7;
  setTimeout(function (){
    if (joined() && get("synced", 1) < SYNC){ pushExisting(); set("synced", SYNC); }
    flush();
  }, 1500);

  // après un import de sauvegarde : renvoyer tous les records (le serveur garde le meilleur)
  function resync(){ if (!joined()) return Promise.resolve(); pushExisting(); return flush(); }
  window.LudoScores = {resync: resync, joined: joined, join: join, leave: leave, submit: submit, board: board, bests: bests, flush: flush, registerExisting: registerExisting, HINT_PENALTY: HINT_PENALTY,
    pseudo: function (){ return get("pseudo", ""); }, pending: function (){ return get("queue", []).length; },
    rankText: function (r){ return r ? (r.rank === 1 ? "1er" : r.rank + "e") + " sur " + r.total : ""; }};
})();
