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
        if (!r.ok){ var err = new Error((data && (data.message || data.hint)) || ("Erreur " + r.status)); err.status = r.status; err.code = /code familial/.test(t) ? "code" : "http"; throw err; }
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
      set("pseudo", pseudo); set("code", code); player();
      pushExisting(); flush();
      return true;
    });
  }
  function leave(){ set("code", ""); }

  // records déjà présents dans ce navigateur, envoyés au moment de rejoindre
  var existing = [];
  function registerExisting(fn){ existing.push(fn); }
  function pushExisting(){ existing.forEach(function (fn){ try { (fn() || []).forEach(function (s){ queue(s); }); } catch (e) {} }); }

  // file d'attente : un score n'est jamais perdu, même hors connexion
  function queue(s){
    var q = get("queue", []).filter(function (x){ return !(x.game === s.game && x.board === s.board); });
    var prev = get("queue", []).find(function (x){ return x.game === s.game && x.board === s.board; });
    if (prev) s.value = s.low ? Math.min(prev.value, s.value) : Math.max(prev.value, s.value);
    q.push(s); set("queue", q.slice(-50));
  }
  var flushing = null;
  function flush(){
    if (!joined() || flushing) return flushing || Promise.resolve();
    var q = get("queue", []); if (!q.length) return Promise.resolve();
    flushing = q.reduce(function (p, s){
      return p.then(function (){ return send(s).then(function (){ set("queue", get("queue", []).filter(function (x){ return !(x.game === s.game && x.board === s.board && x.value === s.value); })); }); });
    }, Promise.resolve()).catch(function (){}).then(function (){ flushing = null; });
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
      if (err && err.code === "code"){ leave(); return null; }   // le code a changé : il faudra le retaper
      queue(s); return null;
    });
  }
  function board(game, b, limit){
    if (!joined()) return Promise.resolve(null);
    return rpc("ludo_board", {code: get("code", ""), p_game: game, p_board: b, p_player: player(), p_limit: limit || 20})
      .catch(function (err){ if (err && err.code === "code") leave(); throw err; });
  }

  // records déjà faits sur ce navigateur, envoyés en rejoignant le classement
  function readKey(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  registerExisting(function (){
    var out = [], t = Number(readKey("tetris16.best", 0)), d = readKey("lignee.daily", {}) || {};
    if (t > 0) out.push({game: "tetris", board: "best", value: t, low: false});
    Object.keys(d).forEach(function (code){ if (/^[CR]2-J[0-9A-Z]+$/.test(code) && d[code] > 0) out.push({game: "lignee", board: "daily:" + code, value: d[code], low: true}); });
    return out;
  });

  window.addEventListener("online", function (){ flush(); });
  setTimeout(flush, 1500);

  window.LudoScores = {joined: joined, join: join, leave: leave, submit: submit, board: board, flush: flush, registerExisting: registerExisting,
    pseudo: function (){ return get("pseudo", ""); }, pending: function (){ return get("queue", []).length; }};
})();
