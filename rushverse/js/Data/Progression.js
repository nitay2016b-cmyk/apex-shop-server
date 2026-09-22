/* RUSHVERSE - Data/Progression.js
   All currency, XP/level, mission, achievement and chest logic lives here.
   Everything reads/writes through RV.Save so state always persists. */
(function (RV) {
  'use strict';

  var Data = RV.Data;
  var listeners = {};

  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
  }
  function emit(evt, payload) {
    (listeners[evt] || []).forEach(function (fn) { fn(payload); });
  }

  function save() { return RV.Save.get(); }

  // ---------- Currency ----------
  function addCoins(amount) {
    if (amount <= 0) return;
    var s = save();
    s.coins += amount;
    s.lifetimeCoins += amount;
    RV.Save.save();
    checkAchievements();
  }
  function spendCoins(amount) {
    var s = save();
    if (s.coins < amount) return false;
    s.coins -= amount;
    RV.Save.save();
    return true;
  }
  function addGems(amount) {
    if (amount <= 0) return;
    save().gems += amount;
    RV.Save.save();
  }
  function spendGems(amount) {
    var s = save();
    if (s.gems < amount) return false;
    s.gems -= amount;
    RV.Save.save();
    return true;
  }

  // ---------- XP / Level ----------
  function addXP(amount) {
    var s = save();
    s.xp += amount;
    var leveledUp = [];
    var need = Data.xpForLevel(s.level);
    while (s.xp >= need) {
      s.xp -= need;
      s.level += 1;
      leveledUp.push(s.level);
      need = Data.xpForLevel(s.level);
    }
    RV.Save.save();
    if (leveledUp.length) {
      leveledUp.forEach(function (lvl) {
        emit('levelup', { level: lvl, unlock: Data.LEVEL_UNLOCK_TABLE[lvl] || null });
      });
      checkAchievements();
      checkCharacterUnlocks();
      checkMapUnlocks();
    }
    return leveledUp;
  }
  function xpProgress() {
    var s = save();
    var need = Data.xpForLevel(s.level);
    return { xp: s.xp, need: need, level: s.level, pct: Math.min(1, s.xp / need) };
  }

  // ---------- Character / Map unlocks ----------
  function checkCharacterUnlocks() {
    var s = save();
    Data.CHARACTERS.forEach(function (c) {
      if (s.characters.owned.indexOf(c.id) !== -1) return;
      var u = c.unlock;
      if (u.type === 'level' && s.level >= u.value) unlockCharacter(c.id);
    });
  }
  function unlockCharacter(id) {
    var s = save();
    if (s.characters.owned.indexOf(id) === -1) {
      s.characters.owned.push(id);
      RV.Save.save();
      emit('characterUnlocked', Data.getCharacter(id));
    }
  }
  function checkMapUnlocks() {
    var s = save();
    Data.MAPS.forEach(function (m) {
      if (s.maps.unlocked.indexOf(m.id) !== -1) return;
      var u = m.unlock;
      if (u.type === 'default' || (u.type === 'level' && s.level >= u.value)) {
        s.maps.unlocked.push(m.id);
        RV.Save.save();
        emit('mapUnlocked', m);
      }
    });
  }

  // ---------- Missions ----------
  function periodKey(kind) {
    var now = Date.now();
    var day = 86400000;
    if (kind === 'daily') return Math.floor(now / day);
    return Math.floor(now / (day * 7));
  }

  function rollMissions(kind) {
    var pool = Data.MISSION_POOL[kind].slice();
    var picks = [];
    var count = kind === 'daily' ? 4 : 5;
    while (picks.length < count && pool.length) {
      var idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    return picks.map(function (m) {
      return { id: m.id, progress: 0, claimed: false, complete: false };
    });
  }

  function ensureMissions() {
    var s = save();
    var dKey = periodKey('daily');
    var wKey = periodKey('weekly');
    var changed = false;
    if (!s.missions.daily || s.missions.dailyResetAt !== dKey) {
      s.missions.daily = rollMissions('daily');
      s.missions.dailyResetAt = dKey;
      s._periodStatsDaily = {};
      changed = true;
    }
    if (!s.missions.weekly || s.missions.weeklyResetAt !== wKey) {
      s.missions.weekly = rollMissions('weekly');
      s.missions.weeklyResetAt = wKey;
      s._periodStatsWeekly = {};
      changed = true;
    }
    if (changed) RV.Save.save();
  }

  function missionDef(kind, id) {
    return Data.MISSION_POOL[kind].filter(function (m) { return m.id === id; })[0];
  }

  function updateMissionStat(statName, value, mode) {
    ensureMissions();
    var s = save();
    ['daily', 'weekly'].forEach(function (kind) {
      (s.missions[kind] || []).forEach(function (entry) {
        var def = missionDef(kind, entry.id);
        if (!def || def.stat !== statName || entry.complete) return;
        if (mode === 'max') entry.progress = Math.max(entry.progress, value);
        else entry.progress += value;
        if (entry.progress >= def.target) {
          entry.progress = def.target;
          entry.complete = true;
          emit('missionComplete', { kind: kind, id: entry.id, def: def });
        }
      });
    });
    RV.Save.save();
  }

  function claimMission(kind, id) {
    var s = save();
    var entry = (s.missions[kind] || []).filter(function (e) { return e.id === id; })[0];
    var def = missionDef(kind, id);
    if (!entry || !def || !entry.complete || entry.claimed) return null;
    entry.claimed = true;
    grantReward(def.reward);
    RV.Save.save();
    return def.reward;
  }

  function getMissions() {
    ensureMissions();
    var s = save();
    return {
      daily: s.missions.daily.map(function (e) { return decorateMission('daily', e); }),
      weekly: s.missions.weekly.map(function (e) { return decorateMission('weekly', e); })
    };
  }
  function decorateMission(kind, entry) {
    var def = missionDef(kind, entry.id);
    return {
      id: entry.id, kind: kind,
      desc: def.desc.replace('{t}', def.target.toLocaleString()),
      progress: entry.progress, target: def.target,
      complete: entry.complete, claimed: entry.claimed,
      reward: def.reward
    };
  }

  // ---------- Achievements ----------
  function checkAchievements() {
    var s = save();
    Data.ACHIEVEMENTS.forEach(function (a) {
      var rec = s.achievements[a.id] || { progress: 0, complete: false, claimed: false };
      var statVal = s[a.stat] || 0;
      rec.progress = Math.min(a.target, statVal);
      if (!rec.complete && rec.progress >= a.target) {
        rec.complete = true;
        emit('achievementComplete', a);
      }
      s.achievements[a.id] = rec;
    });
    RV.Save.save();
  }
  function claimAchievement(id) {
    var s = save();
    var a = Data.ACHIEVEMENTS.filter(function (x) { return x.id === id; })[0];
    var rec = s.achievements[id];
    if (!a || !rec || !rec.complete || rec.claimed) return null;
    rec.claimed = true;
    grantReward(a.reward);
    RV.Save.save();
    return a.reward;
  }
  function getAchievements() {
    var s = save();
    return Data.ACHIEVEMENTS.map(function (a) {
      var rec = s.achievements[a.id] || { progress: 0, complete: false, claimed: false };
      return {
        id: a.id, name: a.name, desc: a.desc,
        progress: rec.progress, target: a.target,
        complete: rec.complete, claimed: rec.claimed, reward: a.reward
      };
    });
  }

  // ---------- Rewards / Chests ----------
  function grantReward(reward) {
    if (!reward) return;
    if (reward.coins) addCoins(reward.coins);
    if (reward.gems) addGems(reward.gems);
    if (reward.chest) addChest(reward.chest, 1);
    if (reward.key) addKey(reward.key, 1);
    if (reward.skin) grantRandomSkin();
  }
  function addChest(rarity, n) {
    var s = save();
    s.chests[rarity] = (s.chests[rarity] || 0) + n;
    RV.Save.save();
  }
  function addKey(rarity, n) {
    var s = save();
    s.keys[rarity] = (s.keys[rarity] || 0) + n;
    RV.Save.save();
  }
  function grantRandomSkin() {
    var s = save();
    var locked = Data.SHOP_ITEMS.filter(function (it) { return s.skins.owned.indexOf(it.id) === -1; });
    if (!locked.length) { addCoins(300); return null; }
    var pick = locked[Math.floor(Math.random() * locked.length)];
    s.skins.owned.push(pick.id);
    RV.Save.save();
    return pick;
  }
  function openChest(rarity) {
    var s = save();
    if ((s.keys[rarity] || 0) < 1) return null;
    s.keys[rarity] -= 1;
    if ((s.chests[rarity] || 0) > 0) s.chests[rarity] -= 1;
    var table = Data.CHEST_TABLE[rarity];
    var coins = Math.round(table.coinsMin + Math.random() * (table.coinsMax - table.coinsMin));
    var result = { coins: coins, gems: 0, skin: null };
    if (Math.random() < table.gemChance) {
      result.gems = Math.round(table.gemMin + Math.random() * (table.gemMax - table.gemMin));
    }
    if (Math.random() < table.skinChance) {
      result.skin = grantRandomSkin();
    }
    addCoins(coins);
    if (result.gems) addGems(result.gems);
    RV.Save.save();
    return result;
  }

  // ---------- Public API ----------
  RV.Progress = {
    on: on, emit: emit,
    addCoins: addCoins, spendCoins: spendCoins,
    addGems: addGems, spendGems: spendGems,
    addXP: addXP, xpProgress: xpProgress,
    checkCharacterUnlocks: checkCharacterUnlocks,
    checkMapUnlocks: checkMapUnlocks,
    getMissions: getMissions, updateMissionStat: updateMissionStat, claimMission: claimMission,
    getAchievements: getAchievements, checkAchievements: checkAchievements, claimAchievement: claimAchievement,
    addChest: addChest, addKey: addKey, openChest: openChest, grantReward: grantReward, grantRandomSkin: grantRandomSkin
  };
})(window.RV || (window.RV = {}));
