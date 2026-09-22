/* RUSHVERSE - Game/Events.js
   Random arena events that fire every 18-30s of survival, each with a
   banner announcement, a duration, and a concrete gameplay effect applied
   by GameLoop (which reads state.active). Keeps every run feeling different. */
(function (RV) {
  'use strict';

  var DEFS = {
    coinRain: { label: 'COIN RAIN', duration: 6, color: '#ffce45' },
    speedMode: { label: 'SPEED MODE', duration: 8, color: '#ff6a6a' },
    blackout: { label: 'BLACKOUT', duration: 5, color: '#7d8fff' },
    giantEnemy: { label: 'GIANT ENEMY', duration: 0, color: '#ff2f5f' },
    doubleScore: { label: 'DOUBLE SCORE', duration: 10, color: '#7dff5a' },
    magnetStorm: { label: 'MAGNET STORM', duration: 7, color: '#ff7ad1' }
  };
  var KEYS = Object.keys(DEFS);

  function create() {
    return { next: 16 + Math.random() * 8, active: null, activeTimer: 0, banner: null, bannerTimer: 0 };
  }

  function update(state, dt, elapsed, onTrigger) {
    if (state.active) {
      state.activeTimer -= dt;
      if (state.activeTimer <= 0) {
        onTrigger && onTrigger('end', state.active);
        state.active = null;
      }
    } else {
      state.next -= dt;
      if (state.next <= 0 && elapsed > 8) {
        var key = KEYS[Math.floor(Math.random() * KEYS.length)];
        var def = DEFS[key];
        state.active = key;
        state.activeTimer = def.duration || 5;
        state.banner = def.label;
        state.bannerTimer = 2.4;
        state.next = 20 + Math.random() * 12;
        onTrigger && onTrigger('start', key);
      }
    }
    if (state.bannerTimer > 0) {
      state.bannerTimer -= dt;
      if (state.bannerTimer <= 0) state.banner = null;
    }
  }

  RV.Events = { DEFS: DEFS, create: create, update: update };
})(window.RV || (window.RV = {}));
