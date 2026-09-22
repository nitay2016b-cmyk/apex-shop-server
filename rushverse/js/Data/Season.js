/* RUSHVERSE - Data/Season.js
   Seasons + Battle Pass. No backend exists, so the season calendar is
   computed deterministically from real time against a fixed anchor date —
   every player's client agrees on "how many days are left" without a
   server, and the season (and its Battle Pass progress) rolls over
   automatically when the window closes. */
(function (RV) {
  'use strict';

  var EPOCH = Date.UTC(2025, 0, 1); // fixed anchor so season math is stable across sessions
  var PREMIUM_PASS_PRICE = { gems: 480 };

  function seasonDef() { return RV.Data.SEASONS[0]; }

  function computeCycle() {
    var def = seasonDef();
    var periodMs = def.durationDays * 86400000;
    var elapsed = Date.now() - EPOCH;
    var cycle = Math.floor(elapsed / periodMs);
    var msIntoCycle = elapsed - cycle * periodMs;
    var daysLeft = Math.max(0, Math.ceil((periodMs - msIntoCycle) / 86400000));
    return { cycle: cycle, daysLeft: daysLeft, periodMs: periodMs };
  }

  function ensureCurrent() {
    var s = RV.Save.get();
    var cyc = computeCycle();
    if (s.season.seasonId !== cyc.cycle) {
      s.season.seasonId = cyc.cycle;
      s.season.xp = 0;
      s.season.claimedFree = [];
      s.season.claimedPremium = [];
      // premiumOwned intentionally NOT reset — cosmetic entitlement, not a
      // recurring subscription trap; a player who bought it keeps buying
      // power for that season only, but we don't punish a rollover mid-play.
      s.season.premiumOwned = false;
      RV.Save.save();
    }
    return s;
  }

  function levelForXp(xp) {
    var rows = RV.Data.BATTLE_PASS_REWARDS;
    var level = 0;
    for (var i = 0; i < rows.length; i++) {
      if (xp >= rows[i].xpRequired) level = rows[i].level; else break;
    }
    return level;
  }

  function getState() {
    var s = ensureCurrent();
    var def = seasonDef();
    var cyc = computeCycle();
    var rows = RV.Data.BATTLE_PASS_REWARDS;
    var level = levelForXp(s.season.xp);
    var currentFloor = level > 0 ? rows[level - 1].xpRequired : 0;
    var nextRow = rows[level] || rows[rows.length - 1];
    var span = Math.max(1, nextRow.xpRequired - currentFloor);
    var pct = level >= rows.length ? 1 : Math.min(1, (s.season.xp - currentFloor) / span);
    return {
      name: def.name, daysLeft: cyc.daysLeft, durationDays: def.durationDays,
      xp: s.season.xp, level: level, maxLevel: rows.length, pct: pct,
      premiumOwned: s.season.premiumOwned,
      claimedFree: s.season.claimedFree, claimedPremium: s.season.claimedPremium
    };
  }

  function addXP(amount) {
    if (amount <= 0) return;
    ensureCurrent();
    var s = RV.Save.get();
    var before = levelForXp(s.season.xp);
    s.season.xp += amount;
    RV.Save.save();
    var after = levelForXp(s.season.xp);
    if (after > before) {
      RV.Progress.emit('seasonLevelUp', { from: before, to: after });
    }
  }

  function purchasePremium() {
    ensureCurrent();
    var s = RV.Save.get();
    if (s.season.premiumOwned) return { error: 'Already owned' };
    if (!RV.Progress.spendGems(PREMIUM_PASS_PRICE.gems)) return { error: 'Not enough gems' };
    s.season.premiumOwned = true;
    RV.Save.save();
    return { ok: true };
  }

  function claimReward(level, track) {
    ensureCurrent();
    var s = RV.Save.get();
    var row = RV.Data.BATTLE_PASS_REWARDS.filter(function (r) { return r.level === level; })[0];
    var state = getState();
    if (!row || level > state.level) return { error: 'Not unlocked yet' };
    if (track === 'premium' && !s.season.premiumOwned) return { error: 'Premium pass required' };
    var claimedList = track === 'premium' ? s.season.claimedPremium : s.season.claimedFree;
    if (claimedList.indexOf(level) !== -1) return { error: 'Already claimed' };
    claimedList.push(level);
    RV.Save.save();
    RV.Progress.grantReward(track === 'premium' ? row.premium : row.free);
    return { ok: true, reward: track === 'premium' ? row.premium : row.free };
  }

  RV.Season = {
    PREMIUM_PASS_PRICE: PREMIUM_PASS_PRICE,
    getState: getState, addXP: addXP, purchasePremium: purchasePremium, claimReward: claimReward,
    seasonDef: seasonDef, getCycleId: function () { return computeCycle().cycle; }
  };
})(window.RV || (window.RV = {}));
