/* RUSHVERSE - Data/SaveSystem.js
   Local persistence layer. Everything the game needs to remember lives here,
   wrapped so the rest of the codebase never touches localStorage directly.
   Designed so a future networked backend can slot in behind the same API
   (see RV.Save.setRemoteAdapter). */
(function (RV) {
  'use strict';

  var STORAGE_KEY = 'rushverse_save_v1';
  var SAVE_VERSION = 1;

  function uid(prefix) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return prefix + '-' + s;
  }

  function defaultSave() {
    return {
      version: SAVE_VERSION,
      playerName: 'Runner',
      playerCode: uid('RV'),
      createdAt: Date.now(),

      coins: 250,
      gems: 15,
      level: 1,
      xp: 0,

      bestScore: 0,
      lifetimeCoins: 0,
      gamesPlayed: 0,
      totalSurvivalMs: 0,
      totalPlayMs: 0,
      bestCombo: 0,
      bestSurvivalMs: 0,
      damagelessWins: 0,
      abilityUses: 0,

      characters: {
        owned: ['rush'],
        equipped: 'rush'
      },
      skins: {
        owned: ['outfit_default', 'trail_default', 'effect_default', 'emote_default'],
        equipped: {
          outfit: 'outfit_default',
          trail: 'trail_default',
          effect: 'effect_default',
          emote: 'emote_default'
        }
      },
      maps: {
        unlocked: ['neon_city']
      },

      achievements: {},
      missions: {
        daily: null,
        weekly: null,
        dailyResetAt: 0,
        weeklyResetAt: 0
      },

      dailyReward: {
        streak: 0,
        lastClaim: 0
      },

      chests: { common: 0, rare: 0, epic: 0, legendary: 0 },
      keys: { common: 0, rare: 0, epic: 0, legendary: 0 },

      friends: [],

      settings: {
        musicVolume: 0.6,
        sfxVolume: 0.8,
        graphics: 'medium',
        vibration: true,
        language: 'en',
        joystickSide: 'left'
      },

      tutorialDone: false,
      lastRun: null
    };
  }

  function deepMerge(base, incoming) {
    if (typeof incoming !== 'object' || incoming === null) return base;
    Object.keys(base).forEach(function (k) {
      if (incoming[k] === undefined) return;
      if (typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])) {
        base[k] = deepMerge(base[k], incoming[k]);
      } else {
        base[k] = incoming[k];
      }
    });
    return base;
  }

  var state = null;
  var remoteAdapter = null;
  var dirty = false;

  function load() {
    var fresh = defaultSave();
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        state = deepMerge(fresh, parsed);
      } else {
        state = fresh;
      }
    } catch (e) {
      console.warn('[RUSHVERSE] save load failed, starting fresh', e);
      state = fresh;
    }
    return state;
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      dirty = false;
      if (remoteAdapter && remoteAdapter.push) remoteAdapter.push(state);
    } catch (e) {
      console.warn('[RUSHVERSE] save persist failed', e);
    }
  }

  var persistTimer = null;
  function scheduleSave() {
    dirty = true;
    if (persistTimer) return;
    persistTimer = setTimeout(function () {
      persistTimer = null;
      if (dirty) persist();
    }, 250);
  }

  window.addEventListener('beforeunload', function () {
    if (dirty) persist();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && dirty) persist();
  });

  RV.Save = {
    get: function () { return state || load(); },
    save: scheduleSave,
    saveNow: persist,
    reset: function () {
      state = defaultSave();
      persist();
      return state;
    },
    setRemoteAdapter: function (adapter) { remoteAdapter = adapter; },
    uid: uid
  };
})(window.RV || (window.RV = {}));
