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
      checkTitleUnlocks();
      checkBadgeUnlocks();
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
      var c = Data.getCharacter(id);
      noteDiscovery('char_' + id, c ? c.name : id);
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
    var count = kind === 'daily' ? 4 : 4;
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
    var sKey = RV.Season.getCycleId();
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
    if (!s.missions.season || s.missions.seasonResetAt !== sKey) {
      s.missions.season = rollMissions('season');
      s.missions.seasonResetAt = sKey;
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
    ['daily', 'weekly', 'season'].forEach(function (kind) {
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
      weekly: s.missions.weekly.map(function (e) { return decorateMission('weekly', e); }),
      season: s.missions.season.map(function (e) { return decorateMission('season', e); })
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
    checkTitleUnlocks();
    checkBadgeUnlocks();
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

  // Fans one stat update out to every tracked-progress system that might
  // care about it (daily/weekly/season missions, daily challenges, the
  // active meta event) — each one silently no-ops if it has no entry for
  // that stat name, so callers never need to know which systems listen.
  function updateTrackedStat(statName, value, mode) {
    updateMissionStat(statName, value, mode);
    updateDailyChallengeStat(statName, value, mode);
    updateMetaEventStat(statName, value, mode);
  }

  // ---------- Titles ----------
  function checkTitleUnlocks() {
    var s = save();
    var changed = false;
    Data.TITLES.forEach(function (t) {
      if (s.titles.owned.indexOf(t.id) !== -1) return;
      var u = t.unlock;
      var unlocked = u.type === 'default' || (u.stat != null && (s[u.stat] || 0) >= u.target);
      if (unlocked) {
        s.titles.owned.push(t.id);
        changed = true;
        emit('titleUnlocked', t);
      }
    });
    if (changed) RV.Save.save();
  }
  function equipTitle(id) {
    var s = save();
    if (s.titles.owned.indexOf(id) === -1) return false;
    s.titles.equipped = id;
    RV.Save.save();
    return true;
  }
  function getTitles() {
    var s = save();
    return Data.TITLES.map(function (t) {
      return { id: t.id, name: t.name, owned: s.titles.owned.indexOf(t.id) !== -1, equipped: s.titles.equipped === t.id, unlock: t.unlock };
    });
  }

  // ---------- Badges ----------
  function checkBadgeUnlocks() {
    var s = save();
    var changed = false;
    Data.BADGES.forEach(function (b) {
      if (s.badges.owned.indexOf(b.id) !== -1) return;
      if ((s[b.stat] || 0) >= b.target) {
        s.badges.owned.push(b.id);
        changed = true;
        emit('badgeUnlocked', b);
        noteDiscovery(b.id, b.name);
      }
    });
    if (changed) RV.Save.save();
  }
  function getBadges() {
    var s = save();
    return Data.BADGES.map(function (b) {
      return { id: b.id, name: b.name, target: b.target, progress: Math.min(b.target, s[b.stat] || 0), owned: s.badges.owned.indexOf(b.id) !== -1 };
    });
  }

  // ---------- Collection discovery toasts ----------
  function noteDiscovery(id, label) {
    var s = save();
    if (s.discoveredItems.indexOf(id) !== -1) return;
    s.discoveredItems.push(id);
    RV.Save.save();
    emit('itemDiscovered', { id: id, label: label });
  }

  // ---------- Daily Challenges (separate from Missions) ----------
  function rollDailyChallenges() {
    var pool = Data.DAILY_CHALLENGE_POOL.slice();
    var picks = [];
    while (picks.length < 3 && pool.length) {
      var idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    return picks.map(function (c) { return { id: c.id, progress: 0, claimed: false, complete: false }; });
  }
  function challengeDef(id) {
    return Data.DAILY_CHALLENGE_POOL.filter(function (c) { return c.id === id; })[0];
  }
  function ensureDailyChallenges() {
    var s = save();
    var key = periodKey('daily');
    if (!s.dailyChallenges.list || s.dailyChallenges.resetAt !== key) {
      s.dailyChallenges.list = rollDailyChallenges();
      s.dailyChallenges.resetAt = key;
      RV.Save.save();
    }
  }
  function getDailyChallenges() {
    ensureDailyChallenges();
    var s = save();
    return s.dailyChallenges.list.map(function (entry) {
      var def = challengeDef(entry.id);
      return {
        id: entry.id, desc: def.desc.replace('{t}', def.target.toLocaleString()),
        progress: entry.progress, target: def.target, complete: entry.complete, claimed: entry.claimed, reward: def.reward
      };
    });
  }
  function updateDailyChallengeStat(statName, value, mode) {
    ensureDailyChallenges();
    var s = save();
    (s.dailyChallenges.list || []).forEach(function (entry) {
      var def = challengeDef(entry.id);
      if (!def || def.stat !== statName || entry.complete) return;
      if (mode === 'max') entry.progress = Math.max(entry.progress, value);
      else entry.progress += value;
      if (entry.progress >= def.target) { entry.progress = def.target; entry.complete = true; }
    });
    RV.Save.save();
  }
  function claimDailyChallenge(id) {
    var s = save();
    var entry = (s.dailyChallenges.list || []).filter(function (e) { return e.id === id; })[0];
    var def = challengeDef(id);
    if (!entry || !def || !entry.complete || entry.claimed) return null;
    entry.claimed = true;
    grantReward(def.reward);
    RV.Save.save();
    return def.reward;
  }

  // ---------- Meta Events (rotating scheduled events, distinct from in-run random events) ----------
  var META_EPOCH = Date.UTC(2025, 0, 1);
  var META_DAYS_PER_EVENT = 4;
  function activeMetaEventIndex() {
    var daysSince = Math.floor((Date.now() - META_EPOCH) / 86400000);
    return Math.floor(daysSince / META_DAYS_PER_EVENT) % Data.META_EVENTS.length;
  }
  function activeMetaEventDaysLeft() {
    var daysSince = Math.floor((Date.now() - META_EPOCH) / 86400000);
    var intoEvent = daysSince % META_DAYS_PER_EVENT;
    return META_DAYS_PER_EVENT - intoEvent;
  }
  function ensureMetaEvent() {
    var s = save();
    var def = Data.META_EVENTS[activeMetaEventIndex()];
    if (s.metaEvent.eventId !== def.id) {
      s.metaEvent.eventId = def.id;
      s.metaEvent.progress = {};
      s.metaEvent.claimed = [];
      RV.Save.save();
      emit('metaEventStarted', def);
    }
    return def;
  }
  function getMetaEventState() {
    var def = ensureMetaEvent();
    var s = save();
    return {
      id: def.id, label: def.label, desc: def.desc, color: def.color,
      daysLeft: activeMetaEventDaysLeft(),
      missions: def.missions.map(function (m) {
        var progress = s.metaEvent.progress[m.id] || 0;
        return {
          id: m.id, desc: m.desc.replace('{t}', m.target.toLocaleString()),
          progress: progress, target: m.target, complete: progress >= m.target,
          claimed: s.metaEvent.claimed.indexOf(m.id) !== -1, reward: m.reward
        };
      })
    };
  }
  function updateMetaEventStat(statName, value, mode) {
    var def = ensureMetaEvent();
    var s = save();
    def.missions.forEach(function (m) {
      if (m.stat !== statName) return;
      var cur = s.metaEvent.progress[m.id] || 0;
      var next = mode === 'max' ? Math.max(cur, value) : cur + value;
      s.metaEvent.progress[m.id] = Math.min(m.target, next);
    });
    RV.Save.save();
  }
  function claimMetaEventMission(id) {
    var def = ensureMetaEvent();
    var s = save();
    var m = def.missions.filter(function (x) { return x.id === id; })[0];
    if (!m) return null;
    var progress = s.metaEvent.progress[id] || 0;
    if (progress < m.target || s.metaEvent.claimed.indexOf(id) !== -1) return null;
    s.metaEvent.claimed.push(id);
    RV.Save.save();
    grantReward(m.reward);
    return m.reward;
  }

  // ---------- Quest Line ----------
  function questStatValue(s, statName) {
    if (statName === 'charactersOwnedCount') return s.characters.owned.length;
    return s[statName] || 0;
  }
  function getQuestState() {
    var s = save();
    var list = Data.QUEST_LINE;
    var idx = s.quests.currentIndex;
    var done = idx >= list.length;
    var current = done ? null : list[idx];
    var progress = current ? Math.min(current.target, questStatValue(s, current.stat)) : 0;
    return {
      index: idx, total: list.length, done: done, claimedFinal: s.quests.claimedFinal,
      current: current ? {
        id: current.id, name: current.name, desc: current.desc,
        progress: progress, target: current.target,
        complete: progress >= current.target, reward: current.reward
      } : null,
      completedQuests: list.slice(0, idx).map(function (q) { return { id: q.id, name: q.name, desc: q.desc }; })
    };
  }
  function claimCurrentQuest() {
    var s = save();
    var list = Data.QUEST_LINE;
    var idx = s.quests.currentIndex;
    if (idx >= list.length) return null;
    var q = list[idx];
    var progress = questStatValue(s, q.stat);
    if (progress < q.target) return null;
    s.quests.currentIndex += 1;
    RV.Save.save();
    grantReward(q.reward);
    emit('questComplete', q);
    return q.reward;
  }
  function claimFinalQuestReward() {
    var s = save();
    if (s.quests.currentIndex < Data.QUEST_LINE.length || s.quests.claimedFinal) return null;
    s.quests.claimedFinal = true;
    RV.Save.save();
    grantReward(Data.QUEST_LINE_FINAL_REWARD);
    return Data.QUEST_LINE_FINAL_REWARD;
  }

  // ---------- Notifications ----------
  function addNotification(text, kind) {
    var s = save();
    s.notifications.items.unshift({ id: RV.Save.uid('N'), text: text, kind: kind || 'info', ts: Date.now(), read: false });
    if (s.notifications.items.length > 40) s.notifications.items.length = 40;
    s.notifications.unreadCount = Math.min(99, s.notifications.unreadCount + 1);
    RV.Save.save();
  }
  function getNotifications() { return save().notifications; }
  function markNotificationsRead() {
    var s = save();
    s.notifications.items.forEach(function (n) { n.read = true; });
    s.notifications.unreadCount = 0;
    RV.Save.save();
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
    acquireSkin(pick.id);
    return pick;
  }
  function acquireSkin(id) {
    var s = save();
    if (s.skins.owned.indexOf(id) !== -1) return false;
    s.skins.owned.push(id);
    RV.Save.save();
    var item = Data.getShopItem(id);
    noteDiscovery('skin_' + id, item ? item.name : id);
    return true;
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
    unlockCharacter: unlockCharacter,
    getMissions: getMissions, updateMissionStat: updateMissionStat, claimMission: claimMission,
    updateTrackedStat: updateTrackedStat,
    getAchievements: getAchievements, checkAchievements: checkAchievements, claimAchievement: claimAchievement,
    addChest: addChest, addKey: addKey, openChest: openChest, grantReward: grantReward,
    grantRandomSkin: grantRandomSkin, acquireSkin: acquireSkin,
    checkTitleUnlocks: checkTitleUnlocks, equipTitle: equipTitle, getTitles: getTitles,
    checkBadgeUnlocks: checkBadgeUnlocks, getBadges: getBadges,
    noteDiscovery: noteDiscovery,
    getDailyChallenges: getDailyChallenges, updateDailyChallengeStat: updateDailyChallengeStat, claimDailyChallenge: claimDailyChallenge,
    getMetaEventState: getMetaEventState, updateMetaEventStat: updateMetaEventStat, claimMetaEventMission: claimMetaEventMission,
    getQuestState: getQuestState, claimCurrentQuest: claimCurrentQuest, claimFinalQuestReward: claimFinalQuestReward,
    addNotification: addNotification, getNotifications: getNotifications, markNotificationsRead: markNotificationsRead
  };
})(window.RV || (window.RV = {}));
