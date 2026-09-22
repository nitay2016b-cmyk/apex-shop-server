/* RUSHVERSE - Game/GameLoop.js
   The match orchestrator: owns the canvas render loop, spawns obstacles /
   enemies / pickups, resolves collisions, drives the combo+score systems,
   runs ability effects, ramps difficulty over time, and reports back to the
   UI layer (HUD updates, game-over summary) via callbacks. */
(function (RV) {
  'use strict';

  var ARENA_RADIUS = 9;
  var COIN_SCORE = 4, GEM_SCORE = 20, SURVIVAL_TICK_SCORE = 8;
  var MAX_COINS_ON_FIELD = 9, MAX_POWERUPS_ON_FIELD = 2;

  var canvas, ctx;
  var running = false, paused = false;
  var rafId = null, lastTime = 0;

  var match = null; // full mutable run state
  var callbacks = {};

  function on(name, fn) { callbacks[name] = fn; }
  function fire(name, payload) { if (callbacks[name]) callbacks[name](payload); }

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', handleResize);
    handleResize();
  }

  function handleResize() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    RV.Camera.resize(w, h);
  }

  function project(x, z) { return RV.Camera.project(x, z); }

  function difficultyAt(elapsed) { return Math.min(4.5, 1 + elapsed / 42); }

  var lastCompletedReplay = null;

  function start(opts) {
    var characterDef = RV.Data.getCharacter(opts.characterId) || RV.Data.CHARACTERS[0];
    var mapDef = RV.Data.getMap(opts.mapId) || RV.Data.MAPS[0];
    var skinCfg = opts.skin || {};

    match = {
      map: mapDef, character: characterDef, skin: skinCfg,
      player: RV.Player.create(characterDef),
      obstacles: [], enemies: [], pickups: [], projectiles: [],
      combo: RV.Combo.create(),
      events: RV.Events.create(),
      elapsed: 0, score: 0, displayScore: 0,
      coinsCollected: 0, gemsCollected: 0, abilityUses: 0, enemiesDefeated: 0,
      enemySpawnTimer: 2, obstacleSpawnTimer: 1, powerupSpawnTimer: 6, coinSpawnTimer: 0,
      globalSlowTimer: 0, bossSpawnedForEvent: false,
      floaterCombo: null,
      ended: false,
      // Boss Battle mode: a dedicated single-boss fight instead of the usual
      // survival wave spawner (see spawnBoss / boss phase logic in update()).
      bossMode: !!opts.bossMode, bossPhase: 1, bossDefeated: false,
      // Advanced combo tracking (near miss / chain / multi-collect cooldowns)
      nearMissCooldowns: {}, chainCount: 0, chainTimer: 0,
      lastCollectTime: -10, multiCollectStreak: 0, bestMultiCollectThisRun: 0,
      nearMissesThisRun: 0, perfectDodgesThisRun: 0,
      // Lightweight replay recording (position/HP/score samples + moment markers)
      replay: { samples: [], moments: [] }, _replayAccum: 0
    };
    RV.Maps.resetAmbient(mapDef, ARENA_RADIUS);
    RV.Effects.clear();
    RV.Audio.playMusic(mapDef.musicKey, function () { return Math.min(1, match.elapsed / 90); });

    for (var i = 0; i < 6; i++) spawnCoin();
    // Map Randomizer: seed a couple of obstacles immediately (instead of
    // only after the spawn timer fires) so the opening seconds of every
    // run already look different from the last one.
    if (!match.bossMode) {
      var startObstacleCount = 1 + Math.floor(Math.random() * 2);
      for (var j = 0; j < startObstacleCount; j++) spawnObstacle();
    } else {
      spawnBoss();
    }

    running = true; paused = false;
    lastTime = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    RV.Audio.stopMusic();
  }
  function pause() { paused = true; }
  function resume() { paused = false; lastTime = performance.now(); }
  function isPaused() { return paused; }

  function spawnCoin() {
    if (match.pickups.filter(function (p) { return p.kind === 'coin'; }).length >= MAX_COINS_ON_FIELD) return;
    var pos = RV.Pickups.randomPos(ARENA_RADIUS * 0.85);
    match.pickups.push(RV.Pickups.spawnCoin(pos.x, pos.z, Math.random() < 0.12 ? 15 : 5));
  }
  function spawnGem() {
    var pos = RV.Pickups.randomPos(ARENA_RADIUS * 0.8);
    match.pickups.push(RV.Pickups.spawnGem(pos.x, pos.z));
  }
  function spawnPowerupItem() {
    if (match.pickups.filter(function (p) { return p.kind === 'powerup'; }).length >= MAX_POWERUPS_ON_FIELD) return;
    var pos = RV.Pickups.randomPos(ARENA_RADIUS * 0.75);
    match.pickups.push(RV.Pickups.spawnPowerup(pos.x, pos.z));
  }

  function spawnObstacle() {
    var pool = match.map.obstaclePool;
    var type = pool[Math.floor(Math.random() * pool.length)];
    var maxObstacles = Math.min(3 + Math.floor(match.elapsed / 22), 8);
    if (match.obstacles.length >= maxObstacles) return;
    match.obstacles.push(RV.Obstacles.spawn(type, ARENA_RADIUS));
  }

  function pickEnemyType(difficulty) {
    var roll = Math.random();
    if (difficulty > 2.6 && roll < 0.08) return 'boss';
    if (roll < 0.32) return 'runner';
    if (roll < 0.58) return 'chaser';
    if (roll < 0.8) return 'shooter';
    return 'blocker';
  }

  function spawnEnemy(forceType) {
    var difficulty = difficultyAt(match.elapsed);
    var maxEnemies = Math.min(2 + Math.floor(match.elapsed / 20), 7);
    if (!forceType && match.enemies.length >= maxEnemies) return;
    var type = forceType || pickEnemyType(difficulty);
    var pos = RV.Pickups.randomPos(ARENA_RADIUS * 0.9);
    // keep spawn away from the player
    var tries = 0;
    while (Math.hypot(pos.x - match.player.x, pos.z - match.player.z) < 3 && tries < 6) {
      pos = RV.Pickups.randomPos(ARENA_RADIUS * 0.9); tries++;
    }
    var e = RV.Enemy.spawn(type, pos.x, pos.z, difficulty);
    if (type === 'runner') {
      var dx = match.player.x - pos.x, dz = match.player.z - pos.z;
      var len = Math.hypot(dx, dz) || 1;
      e.dir = { x: dx / len, z: dz / len };
    }
    match.enemies.push(e);
  }

  // ---------- Boss Battle mode ----------
  function spawnBoss() {
    var boss = RV.Enemy.spawn('boss', 0, -6, 1);
    boss.hp = boss.maxHp = 60;
    boss.isMainBoss = true;
    boss.weakOpen = false;
    boss.weakTimer = 8;
    boss.baseSpeed = boss.speed;
    match.enemies.push(boss);
    fire('eventBanner', 'THE OVERLORD');
  }

  function updateBossPhase(dt) {
    var boss = match.enemies.filter(function (e) { return e.isMainBoss; })[0];
    if (!boss) return;
    var ratio = boss.hp / boss.maxHp;
    var phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    if (phase !== match.bossPhase) {
      match.bossPhase = phase;
      RV.Audio.sfx.eventAlert();
      RV.Effects.shake(10);
      if (phase === 2) { fire('eventBanner', 'PHASE 2: ARENA SHIFTING'); }
      else if (phase === 3) {
        fire('eventBanner', 'PHASE 3: OVERLORD ENRAGED');
        boss.speed = boss.baseSpeed * 1.45;
      }
    }
    // Weak point: opens periodically; dashing through the boss while open
    // deals bonus damage (see resolveCollisions), rewarding good timing.
    boss.weakTimer -= dt;
    if (boss.weakTimer <= 0) {
      boss.weakOpen = !boss.weakOpen;
      boss.weakTimer = boss.weakOpen ? 3 : (phase === 3 ? 4.5 : 6.5);
      if (boss.weakOpen) { RV.Audio.sfx.warning(); }
    }
    // Phase 1 sends extra obstacles; phase 2 speeds the arena up further.
    if (phase >= 1 && match.obstacles.length < (phase === 1 ? 3 : 5)) {
      match.obstacleSpawnTimer = Math.min(match.obstacleSpawnTimer, phase === 1 ? 2.5 : 1.4);
    }
  }

  // ---------- Ability effects ----------
  function applyAbilityEffect(ability) {
    var p = match.player;
    match.abilityUses++;
    RV.Progress.updateTrackedStat('abilityUsesThisPeriod', 1, 'add');
    RV.Audio.sfx.ability();
    RV.Effects.shake(4);
    RV.Effects.burst(p.x, p.z, p.character.color, { count: 22, speed: 130, life: 0.5 });
    registerCombo('ability');

    switch (ability.id) {
      case 'surge':
        p.status.speedTimer = Math.max(p.status.speedTimer, ability.duration / 1000);
        break;
      case 'blink':
        break; // handled entirely by Player dash mechanics
      case 'shockwave':
        var shockKills = 0;
        match.enemies.forEach(function (e) {
          var d = Math.hypot(e.x - p.x, e.z - p.z);
          if (d < 3.6) {
            RV.Enemy.applyStun(e, 1.8);
            var killed = RV.Enemy.hit(e, d < 2 ? 5 : 2);
            if (killed) { onEnemyDefeated(e); shockKills++; }
          }
        });
        if (shockKills >= 2) {
          addScore(shockKills * 80 * comboScoreMultiplier());
          registerCombo('abilityCombo');
          RV.Effects.floatText(p.x, p.z, 'ABILITY COMBO x' + shockKills, '#ff3bd6', { size: 18 });
        }
        break;
      case 'frostfield':
        match.globalSlowTimer = ability.duration / 1000;
        match.enemies.forEach(function (e) { RV.Enemy.applySlow(e, ability.duration / 1000); });
        break;
      case 'magnetpulse':
        p.status.magnetTimer = Math.max(p.status.magnetTimer, ability.duration / 1000);
        break;
      case 'phase':
        break; // handled by isInvulnerable()
    }
  }

  function onEnemyDefeated(e) {
    match.enemiesDefeated++;
    RV.Progress.updateTrackedStat('enemiesThisPeriod', 1, 'add');
    var mult = comboScoreMultiplier();
    addScore(e.score * mult);
    RV.Effects.burst(e.x, e.z, e.color, { count: 16, speed: 140, life: 0.45 });
    RV.Effects.floatText(e.x, e.z, '+' + Math.round(e.score * mult), e.color);
    RV.Audio.sfx.enemyDefeat();
    registerCombo('kill');
    recordReplayMoment('kill', e.type === 'boss' ? 'Boss hit!' : 'Enemy defeated', e.color);
    if (e.isMainBoss) {
      match.bossDefeated = true;
      RV.Audio.sfx.achievement();
      RV.Effects.shake(16);
      endMatch();
    }
  }

  function comboScoreMultiplier() {
    var m = RV.Combo.multiplier(match.combo);
    if (match.events.active === 'doubleScore') m *= 2;
    return m;
  }

  function registerCombo(kind) {
    var milestone = RV.Combo.register(match.combo, kind);
    if (milestone) {
      RV.Audio.sfx.combo(milestone);
      RV.Effects.floatText(match.player.x, match.player.z - 0.6, 'COMBO x' + milestone + '!', '#ffce45', { size: 24, life: 1.1 });
      addScore(milestone * 15);
      fire('combo', milestone);
    }
  }

  function addScore(amount) {
    match.score += amount;
  }

  // ---------- Frame loop ----------
  function loop(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (!paused) update(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }

  function update(dt) {
    match.elapsed += dt;
    match.globalSlowTimer = Math.max(0, match.globalSlowTimer - dt);
    var difficulty = difficultyAt(match.elapsed);
    var input = RV.Controls.consumeFrame();
    var p = match.player;

    var prevX = p.x, prevZ = p.z;
    RV.Player.update(p, dt, input, ARENA_RADIUS);
    match.distance = (match.distance || 0) + Math.hypot(p.x - prevX, p.z - prevZ);
    RV.Camera.follow(p.x, p.z);
    RV.Controls.setAbilityCooldownDisplay(1 - p.abilityCooldown / (p.character.ability.cooldown / 1000));

    RV.Player.drainEvents(p).forEach(function (ev) {
      if (ev.type === 'dash') { RV.Audio.sfx.dash(); RV.Effects.burst(p.x, p.z, p.character.color, { count: 8, speed: 60, life: 0.3 }); checkPerfectDodge(); }
      else if (ev.type === 'swipe') { RV.Audio.sfx.dash(); checkPerfectDodge(); }
      else if (ev.type === 'jump') { RV.Audio.sfx.jump(); }
      else if (ev.type === 'ability') { applyAbilityEffect(ev.data.ability); recordReplayMoment('ability', p.character.ability.name, p.character.color); }
      else if (ev.type === 'hit') { RV.Audio.sfx.hit(); RV.Controls.vibrate(60); RV.Effects.shake(9); RV.Effects.burst(p.x, p.z, '#ff3860', { count: 14, speed: 110, life: 0.4 }); RV.Combo.onHit(match.combo); recordReplayMoment('hit', 'Hit!', '#ff3860'); }
      else if (ev.type === 'secondChance') { RV.Effects.floatText(p.x, p.z, 'SECOND CHANCE!', '#ff5e5e', { size: 22, life: 1.2 }); }
      else if (ev.type === 'died') { endMatch(); }
    });

    // trail particles while dashing
    if (RV.Player.isDashing(p) && Math.random() < 0.6) {
      RV.Effects.burst(p.x, p.z, p.character.color, { count: 2, speed: 20, life: 0.35, gravity: 0 });
    }

    updateObstacles(dt, difficulty);
    updateEnemies(dt);
    updateProjectiles(dt);
    updatePickups(dt);
    resolveCollisions(dt);
    if (match.bossMode) updateBossPhase(dt);
    updateAdvancedCombo(dt);
    recordReplaySample(dt);

    RV.Combo.update(match.combo, dt);
    RV.Events.update(match.events, dt, match.elapsed, onEventTrigger);
    RV.Maps.updateAmbient(dt, match.map, ARENA_RADIUS);
    RV.Effects.update(dt);

    // spawning
    match.obstacleSpawnTimer -= dt;
    if (match.obstacleSpawnTimer <= 0) { spawnObstacle(); match.obstacleSpawnTimer = Math.max(2.2, 5.5 - difficulty * 0.5); }
    if (!match.bossMode) {
      var enemyInterval = match.events.active === 'speedMode' ? 1.4 : Math.max(1.6, 4.4 - difficulty * 0.45);
      match.enemySpawnTimer -= dt;
      if (match.enemySpawnTimer <= 0) { spawnEnemy(); match.enemySpawnTimer = enemyInterval; }
    }
    match.coinSpawnTimer -= dt;
    if (match.coinSpawnTimer <= 0) { spawnCoin(); match.coinSpawnTimer = match.events.active === 'coinRain' ? 0.15 : 1.6; }
    match.powerupSpawnTimer -= dt;
    if (match.powerupSpawnTimer <= 0) { spawnPowerupItem(); match.powerupSpawnTimer = 10 + Math.random() * 6; }

    // survival tick score
    match._tickAccum = (match._tickAccum || 0) + dt;
    if (match._tickAccum >= 1) {
      match._tickAccum -= 1;
      addScore(SURVIVAL_TICK_SCORE * comboScoreMultiplier() * 0.4 * difficulty);
    }

    // display score animates toward real score
    match.displayScore += (match.score - match.displayScore) * Math.min(1, dt * 6);

    RV.Progress.updateTrackedStat('bestSurvivalThisPeriod', match.elapsed, 'max');
    RV.Progress.updateTrackedStat('bestComboThisPeriod', match.combo.best, 'max');
    RV.Progress.updateTrackedStat('bestScoreThisPeriod', match.score, 'max');

    fire('hud', getHudState());
  }

  function checkPerfectDodge() {
    var p = match.player;
    var wasNearHazard = match.obstacles.some(function (o) {
      var res = RV.Obstacles.checkCollision(o, p.x, p.z, p.radius + 1.1, false);
      return res.danger;
    }) || match.enemies.some(function (e) {
      return !e.isMainBoss && Math.hypot(e.x - p.x, e.z - p.z) < e.radius + p.radius + 1.0;
    });
    if (wasNearHazard) {
      addScore(100 * comboScoreMultiplier());
      registerCombo('perfectDodge');
      registerChain();
      match.perfectDodgesThisRun++;
      RV.Effects.floatText(p.x, p.z, 'PERFECT DODGE\n+100', '#7dff5a', { size: 18 });
    } else {
      registerCombo('dodge');
    }
  }

  // NEAR MISS: passing close to (but not touching) a live hazard/enemy,
  // without the deliberate dash/dodge timing that earns a Perfect Dodge.
  function checkNearMisses() {
    var p = match.player;
    var now = match.elapsed;
    match.obstacles.forEach(function (o) {
      if (!RV.Obstacles.isDangerousNow(o)) return;
      var last = match.nearMissCooldowns[o.id] || -10;
      if (now - last < 1.4) return;
      var band = RV.Obstacles.checkCollision(o, p.x, p.z, p.radius + 0.9, RV.Player.isAirborne(p));
      var touching = RV.Obstacles.checkCollision(o, p.x, p.z, p.radius, RV.Player.isAirborne(p));
      if (band.danger && !touching.danger) awardNearMiss(o.id, p);
    });
    match.enemies.forEach(function (e) {
      if (e.isMainBoss) return;
      var key = 'e' + e.id;
      var last = match.nearMissCooldowns[key] || -10;
      if (now - last < 1.4) return;
      var d = Math.hypot(e.x - p.x, e.z - p.z);
      if (d < e.radius + p.radius + 0.7 && d > e.radius + p.radius) awardNearMiss(key, p);
    });
  }
  function awardNearMiss(key, p) {
    match.nearMissCooldowns[key] = match.elapsed;
    match.nearMissesThisRun++;
    addScore(50 * comboScoreMultiplier());
    registerCombo('nearMiss');
    registerChain();
    RV.Effects.floatText(p.x, p.z, 'NEAR MISS\n+50', '#7ad9ff', { size: 15 });
  }

  function registerChain() {
    if (match.chainTimer > 0) match.chainCount++; else match.chainCount = 1;
    match.chainTimer = 1.1;
    if (match.chainCount >= 3 && match.chainCount % 3 === 0) {
      addScore(match.chainCount * 10 * comboScoreMultiplier());
      registerCombo('chain');
      RV.Effects.floatText(match.player.x, match.player.z + 0.6, 'CHAIN x' + match.chainCount, '#c79bff', { size: 17 });
    }
  }

  function registerMultiCollect() {
    var now = match.elapsed;
    if (now - match.lastCollectTime < 0.35) match.multiCollectStreak++;
    else match.multiCollectStreak = 1;
    match.lastCollectTime = now;
    match.bestMultiCollectThisRun = Math.max(match.bestMultiCollectThisRun, match.multiCollectStreak);
    if (match.multiCollectStreak >= 2) {
      addScore(match.multiCollectStreak * 20 * comboScoreMultiplier());
      registerCombo('multiCollect');
      RV.Effects.floatText(match.player.x, match.player.z - 0.9, 'MULTI COLLECT x' + match.multiCollectStreak, '#ffce45', { size: 16 });
    }
  }

  function updateAdvancedCombo(dt) {
    checkNearMisses();
    match.chainTimer = Math.max(0, match.chainTimer - dt);
  }

  function recordReplaySample(dt) {
    match._replayAccum += dt;
    if (match._replayAccum < 0.5) return;
    match._replayAccum = 0;
    var p = match.player;
    match.replay.samples.push({
      t: Math.round(match.elapsed * 10) / 10, x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100,
      facing: Math.round(p.facing * 100) / 100, hp: p.hp, score: Math.round(match.score), combo: match.combo.count
    });
    if (match.replay.samples.length > 600) match.replay.samples.shift();
  }
  function recordReplayMoment(type, label, color) {
    if (!match || !match.replay) return;
    match.replay.moments.push({ t: Math.round(match.elapsed * 10) / 10, x: match.player.x, z: match.player.z, type: type, label: label, color: color });
    if (match.replay.moments.length > 300) match.replay.moments.shift();
  }

  function onEventTrigger(phase, key) {
    if (phase === 'start') {
      RV.Audio.sfx.eventAlert();
      fire('eventBanner', RV.Events.DEFS[key].label);
      if (key === 'giantEnemy' && !match.enemies.some(function (e) { return e.type === 'boss'; })) {
        spawnEnemy('boss');
      }
      if (key === 'coinRain') {
        for (var i = 0; i < 4; i++) spawnCoin();
      }
    }
  }

  function updateObstacles(dt, difficulty) {
    var speedMul = match.globalSlowTimer > 0 ? 0.4 : (match.events.active === 'speedMode' ? 1.5 : 1) * Math.min(1.6, 0.9 + difficulty * 0.12);
    match.obstacles.forEach(function (o) { RV.Obstacles.update(o, dt, ARENA_RADIUS, speedMul); });
  }

  function updateEnemies(dt) {
    var p = match.player;
    for (var i = match.enemies.length - 1; i >= 0; i--) {
      var e = match.enemies[i];
      if (match.globalSlowTimer > 0) RV.Enemy.applySlow(e, 0.1);
      RV.Enemy.update(e, dt, p.x, p.z, match.projectiles);
      if (!e.alive) match.enemies.splice(i, 1);
    }
  }

  function updateProjectiles(dt) {
    var p = match.player;
    for (var i = match.projectiles.length - 1; i >= 0; i--) {
      var pr = match.projectiles[i];
      pr.x += pr.dx * pr.speed * dt;
      pr.z += pr.dz * pr.speed * dt;
      pr.life -= dt;
      var dead = pr.life <= 0 || Math.hypot(pr.x, pr.z) > ARENA_RADIUS * 1.4;
      if (!dead && !RV.Player.isInvulnerable(p) && Math.hypot(pr.x - p.x, pr.z - p.z) < pr.radius + p.radius) {
        RV.Player.applyHit(p);
        dead = true;
      }
      if (dead) match.projectiles.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    var p = match.player;
    var magnetActive = p.status.magnetTimer > 0 || match.events.active === 'magnetStorm';
    for (var i = match.pickups.length - 1; i >= 0; i--) {
      var item = match.pickups[i];
      RV.Pickups.update(item, dt, p.x, p.z, magnetActive);
      if (RV.Pickups.checkPickup(item, p.x, p.z, p.radius)) {
        collectPickup(item);
        match.pickups.splice(i, 1);
      }
    }
  }

  function collectPickup(item) {
    var mult = comboScoreMultiplier();
    if (item.kind === 'coin') {
      RV.Progress.addCoins(item.value);
      match.coinsCollected += item.value;
      RV.Progress.updateTrackedStat('coinsThisPeriod', item.value, 'add');
      addScore(COIN_SCORE * mult);
      RV.Audio.sfx.coin();
      RV.Effects.floatText(item.x, item.z, '+' + item.value, '#ffce45');
      registerCombo('coin');
      registerMultiCollect();
    } else if (item.kind === 'gem') {
      RV.Progress.addGems(item.value);
      match.gemsCollected += item.value;
      addScore(GEM_SCORE * mult);
      RV.Audio.sfx.gem();
      RV.Effects.floatText(item.x, item.z, '+' + item.value + ' GEM', '#7ad9ff');
      registerMultiCollect();
    } else {
      RV.Player.grantPowerup(match.player, item.ptype);
      RV.Audio.sfx.powerup();
      RV.Effects.floatText(item.x, item.z, RV.Pickups.POWERUP_META[item.ptype].icon.toUpperCase(), RV.Pickups.POWERUP_META[item.ptype].color, { size: 20 });
      RV.Effects.burst(item.x, item.z, RV.Pickups.POWERUP_META[item.ptype].color, { count: 18 });
    }
  }

  function resolveCollisions(dt) {
    var p = match.player;
    var invuln = RV.Player.isInvulnerable(p);
    var wasDashing = RV.Player.isDashing(p) || RV.Player.isSwiping(p);
    var anySlow = false;

    match.obstacles.forEach(function (o) {
      var res = RV.Obstacles.checkCollision(o, p.x, p.z, p.radius, RV.Player.isAirborne(p));
      if (res.slow) anySlow = true;
      if (res.danger && !invuln) {
        RV.Player.applyHit(p);
      } else if (res.danger && wasDashing) {
        // dashed straight through danger: rewarded in checkPerfectDash on dash-start,
        // but also reward continuous pass-through for swipe dodges mid-hazard.
      }
    });
    p.status.slowedByField = anySlow;
    if (anySlow) p.status.slowedTimer = Math.max(p.status.slowedTimer, 0.15);

    if (!invuln) {
      match.enemies.forEach(function (e) {
        var d = Math.hypot(e.x - p.x, e.z - p.z);
        if (d < e.radius + p.radius) RV.Player.applyHit(p);
      });
    }

    if (RV.Player.isDashing(p)) {
      match.enemies.forEach(function (e) {
        var d = Math.hypot(e.x - p.x, e.z - p.z);
        if (d < e.radius + p.radius + 0.3) {
          var dmg = e.isMainBoss ? (e.weakOpen ? 4 : 1) : 1;
          var killed = RV.Enemy.hit(e, dmg);
          if (killed) onEnemyDefeated(e);
        }
      });
    }
  }

  // ---------- Rendering ----------
  function render() {
    if (!match) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    var shakeOff = RV.Effects.getShakeOffset();
    ctx.save();
    ctx.translate(shakeOff.x, shakeOff.y);

    RV.Maps.render(ctx, { width: w, height: h }, match.map, ARENA_RADIUS, project, match.events.active === 'blackout');

    var drawables = [];
    match.obstacles.forEach(function (o) { drawables.push({ z: o.z, fn: function () { RV.Obstacles.draw(ctx, o, project); } }); });
    match.pickups.forEach(function (item) { drawables.push({ z: item.z, fn: function () { RV.Pickups.draw(ctx, item, project); } }); });
    match.enemies.forEach(function (e) { drawables.push({ z: e.z, fn: function () { RV.Enemy.draw(ctx, e, project); } }); });
    match.projectiles.forEach(function (pr) { drawables.push({ z: pr.z, fn: function () {
      var pos = project(pr.x, pr.z);
      if (!pos || pos.cull) return;
      ctx.fillStyle = '#ffdd66'; ctx.shadowColor = '#ffdd66'; ctx.shadowBlur = 8 * pos.scale;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 5 * pos.scale, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } }); });
    drawables.push({ z: match.player.z, fn: function () { RV.Player.draw(ctx, match.player, project, match.skin); } });
    drawables.sort(function (a, b) { return a.z - b.z; });
    drawables.forEach(function (d) { d.fn(); });

    RV.Effects.drawWorldParticles(ctx, project);
    RV.Effects.drawScreenFloaters(ctx, project);

    ctx.restore();
  }

  function getHudState() {
    var p = match.player;
    return {
      score: Math.round(match.displayScore),
      combo: match.combo.count,
      hp: p.hp, maxHp: p.maxHp,
      abilityReady: p.abilityCooldown <= 0,
      abilityPct: 1 - p.abilityCooldown / (p.character.ability.cooldown / 1000),
      elapsed: match.elapsed,
      eventBanner: match.events.banner,
      coins: match.coinsCollected,
      shieldActive: p.status.shieldTimer > 0,
      speedActive: p.status.speedTimer > 0,
      magnetActive: p.status.magnetTimer > 0,
      multiplierActive: p.status.multiplierTimer > 0
    };
  }

  function endMatch() {
    if (match.ended) return;
    match.ended = true;
    stop();
    var save = RV.Save.get();
    var survivalMs = match.elapsed * 1000;
    var isNewBest = match.score > save.bestScore;

    save.gamesPlayed += 1;
    save.bestScore = Math.max(save.bestScore, Math.round(match.score));
    save.bestCombo = Math.max(save.bestCombo, match.combo.best);
    save.bestSurvivalMs = Math.max(save.bestSurvivalMs, survivalMs);
    save.totalSurvivalMs += survivalMs;
    save.abilityUses += match.abilityUses;
    save.totalDistance += Math.round(match.distance || 0);
    save.enemiesDefeatedTotal += match.enemiesDefeated;
    save.perfectDodges += match.perfectDodgesThisRun;
    save.nearMisses += match.nearMissesThisRun;
    save.bestChain = Math.max(save.bestChain, match.chainCount);
    save.bestMultiCollect = Math.max(save.bestMultiCollect, match.bestMultiCollectThisRun);
    if (!match.player.tookDamageThisRun) save.damagelessWins += 1;

    var bossReward = null;
    if (match.bossMode && match.bossDefeated) {
      save.bossesDefeated += 1;
      if (save.boss.defeatedIds.indexOf('overlord') === -1) save.boss.defeatedIds.push('overlord');
      bossReward = { coins: 800, gems: 40, chest: 'legendary' };
    }
    RV.Save.save();

    RV.Progress.updateTrackedStat('matchesThisPeriod', 1, 'add');
    RV.Progress.updateTrackedStat('scoreSumThisPeriod', Math.round(match.score), 'add');
    RV.Progress.updateDailyChallengeStat('perfectDodgesThisPeriod', match.perfectDodgesThisRun, 'add');
    RV.Progress.updateDailyChallengeStat('nearMissesThisPeriod', match.nearMissesThisRun, 'add');
    if (bossReward) {
      RV.Progress.updateTrackedStat('bossesThisPeriod', 1, 'add');
      RV.Progress.grantReward(bossReward);
    }
    RV.Progress.checkAchievements();
    RV.Progress.checkCharacterUnlocks();
    RV.Progress.checkMapUnlocks();
    RV.Progress.checkTitleUnlocks();
    RV.Progress.checkBadgeUnlocks();

    var xpEarned = Math.round(match.score / 12 + match.elapsed * 2 + match.coinsCollected * 0.3);
    var levelUps = RV.Progress.addXP(xpEarned);
    RV.Season.addXP(Math.round(xpEarned * 0.8));

    if (match.bossDefeated) RV.Audio.sfx.achievement();
    else if (isNewBest) RV.Audio.sfx.highScore();
    else RV.Audio.sfx.gameOver();

    lastCompletedReplay = {
      mapId: match.map.id, mapName: match.map.name, characterId: match.character.id,
      score: Math.round(match.score), survivalMs: survivalMs,
      samples: match.replay.samples, moments: match.replay.moments
    };

    fire('gameover', {
      score: Math.round(match.score),
      bestScore: save.bestScore,
      isNewBest: isNewBest,
      coins: match.coinsCollected,
      gems: match.gemsCollected,
      xp: xpEarned,
      combo: match.combo.best,
      survivalMs: survivalMs,
      levelUps: levelUps,
      bossMode: match.bossMode,
      bossDefeated: match.bossDefeated,
      bossReward: bossReward
    });
  }

  RV.GameLoop = {
    init: init, start: start, stop: stop, pause: pause, resume: resume, isPaused: isPaused,
    on: on, ARENA_RADIUS: ARENA_RADIUS,
    getMatch: function () { return match; },
    getLastReplay: function () { return lastCompletedReplay; }
  };
})(window.RV || (window.RV = {}));
