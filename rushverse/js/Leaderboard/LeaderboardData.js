/* RUSHVERSE - Leaderboard/LeaderboardData.js
   No backend is available, so this generates a stable local leaderboard
   (seeded once, cached) and inserts the player's real best score at the
   correct rank. Built so a real API can replace `generatePool()` later
   without touching the screen code. */
(function (RV) {
  'use strict';

  var NAME_PARTS1 = ['Neo', 'Vex', 'Zed', 'Kai', 'Rin', 'Axl', 'Ivy', 'Jax', 'Lux', 'Mox', 'Nyx', 'Rex', 'Sky', 'Fox', 'Ash', 'Cyn'];
  var NAME_PARTS2 = ['Runner', 'Strike', 'Blaze', 'Storm', 'Shift', 'Bolt', 'Rush', 'Flux', 'Dash', 'Wave', 'Frost', 'Volt'];

  var CACHE_KEY = 'rushverse_lb_pool_v1';

  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function generatePool() {
    var pool = [];
    for (var i = 0; i < 150; i++) {
      var r1 = seededRandom(i * 12.9898);
      var r2 = seededRandom(i * 78.233 + 1);
      var name = NAME_PARTS1[Math.floor(r1 * NAME_PARTS1.length)] + NAME_PARTS2[Math.floor(r2 * NAME_PARTS2.length)];
      var tier = Math.pow(1 - i / 150, 2.2);
      var score = Math.round(400 + tier * 48000 + seededRandom(i * 3.14) * 1500);
      pool.push({ name: name, score: score, level: Math.max(1, Math.round(5 + tier * 60)) });
    }
    pool.sort(function (a, b) { return b.score - a.score; });
    return pool;
  }

  function getPool() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var pool = generatePool();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(pool)); } catch (e) {}
    return pool;
  }

  function board(category) {
    var s = RV.Save.get();
    var pool = getPool().slice();
    var scaleMap = { global: 1, weekly: 0.32, monthly: 0.62, friends: 1 };
    var scale = scaleMap[category] != null ? scaleMap[category] : 1;
    var entries;
    if (category === 'friends') {
      entries = s.friends.map(function (f) { return { name: f.name, score: f.best, level: f.level, isFriend: true }; });
    } else {
      entries = pool.map(function (p) { return { name: p.name, score: Math.round(p.score * scale), level: p.level }; });
    }
    entries.push({ name: s.playerName, score: category === 'weekly' ? weeklyPlayerScore() : s.bestScore, level: RV.Progress.xpProgress().level, isPlayer: true });
    entries.sort(function (a, b) { return b.score - a.score; });
    var rank = entries.findIndex(function (e) { return e.isPlayer; }) + 1;
    // Never slice the player out of the returned list, even at a low rank —
    // the screen needs their entry to render the "your rank" row.
    return { entries: entries, playerRank: rank, totalCount: entries.length };
  }

  function weeklyPlayerScore() {
    return Math.round(RV.Save.get().bestScore * (0.5 + Math.random() * 0.2));
  }

  function addFriend(code) {
    var s = RV.Save.get();
    code = (code || '').trim().toUpperCase();
    if (!/^RV-[A-Z0-9]{5}$/.test(code)) return { error: 'Invalid code format (RV-XXXXX)' };
    if (code === s.playerCode) return { error: "That's your own code!" };
    if (s.friends.some(function (f) { return f.code === code; })) return { error: 'Already friends' };
    var seed = code.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    var r1 = seededRandom(seed), r2 = seededRandom(seed * 2.1);
    var friend = {
      code: code,
      name: NAME_PARTS1[Math.floor(r1 * NAME_PARTS1.length)] + NAME_PARTS2[Math.floor(r2 * NAME_PARTS2.length)],
      level: Math.max(1, Math.round(3 + r1 * 40)),
      best: Math.round(500 + r2 * 20000),
      online: r1 > 0.4
    };
    s.friends.push(friend);
    RV.Save.save();
    return { friend: friend };
  }

  RV.LeaderboardData = { board: board, addFriend: addFriend };
})(window.RV || (window.RV = {}));
