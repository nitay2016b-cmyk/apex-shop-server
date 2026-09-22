/* RUSHVERSE - Game/Combo.js
   Combo meter: coins, dodges, enemy kills, ability use and well-timed dashes
   all feed it. It decays if the player goes quiet, and drops hard on a hit.
   Score multiplier scales with combo, so keeping it alive is the whole game. */
(function (RV) {
  'use strict';

  var DECAY_WINDOW = 3.0;
  var MILESTONES = [2, 5, 10, 25, 50, 75, 100];

  var WEIGHTS = { coin: 1, dodge: 1, kill: 2, ability: 1, perfectDash: 2 };

  function create() {
    return { count: 0, timer: 0, best: 0, lastMilestoneHit: 0 };
  }

  function register(state, kind) {
    var w = WEIGHTS[kind] || 1;
    state.count += w;
    state.timer = DECAY_WINDOW;
    if (state.count > state.best) state.best = state.count;
    var hitMilestone = null;
    MILESTONES.forEach(function (m) {
      if (state.count >= m && state.lastMilestoneHit < m) {
        state.lastMilestoneHit = m;
        hitMilestone = m;
      }
    });
    return hitMilestone;
  }

  function onHit(state) {
    state.count = Math.floor(state.count * 0.35);
    state.lastMilestoneHit = Math.min(state.lastMilestoneHit, state.count);
    state.timer = DECAY_WINDOW * 0.6;
  }

  function update(state, dt) {
    if (state.count <= 0) return;
    state.timer -= dt;
    if (state.timer <= 0) {
      state.count = 0;
      state.lastMilestoneHit = 0;
    }
  }

  function multiplier(state) {
    return Math.min(6, 1 + Math.floor(state.count / 5) * 0.5);
  }

  RV.Combo = { create: create, register: register, onHit: onHit, update: update, multiplier: multiplier, MILESTONES: MILESTONES };
})(window.RV || (window.RV = {}));
