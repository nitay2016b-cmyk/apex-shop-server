/* RUSHVERSE - Leaderboard/Challenge.js
   Local/demo challenge mode: no real opponent server, so a friend's
   "attempt" is simulated from their profile once the player's run ends.
   Built so a networked matchmaker could later replace resolveOpponent(). */
(function (RV) {
  'use strict';

  var active = null; // {type: 'score'|'survival', target, friend}

  var TYPES = {
    score: { label: 'Score Race', desc: 'First to {t} points.' },
    survival: { label: 'Survival Duel', desc: 'Whoever survives longest wins.' }
  };

  function start(friend, type) {
    active = { type: type, friend: friend };
    if (type === 'score') active.target = Math.round(friend.best * (0.55 + Math.random() * 0.25));
  }

  function isActive() { return !!active; }

  function resolveOpponent() {
    // Simulated opponent performance derived from the friend's profile.
    var f = active.friend;
    if (active.type === 'score') return Math.round(f.best * (0.4 + Math.random() * 0.5));
    return Math.round((30000 + f.level * 4000) * (0.6 + Math.random() * 0.6));
  }

  function resolve(result) {
    if (!active) return null;
    var playerValue = active.type === 'score' ? result.score : result.survivalMs;
    var opponentValue = resolveOpponent();
    var won = playerValue >= opponentValue;
    var out = {
      type: active.type, friendName: active.friend.name,
      playerValue: playerValue, opponentValue: opponentValue, won: won
    };
    active = null;
    return out;
  }

  RV.Challenge = { TYPES: TYPES, start: start, isActive: isActive, resolve: resolve };
})(window.RV || (window.RV = {}));
