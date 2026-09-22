/* RUSHVERSE - Enemies/Enemy.js
   Five enemy archetypes: RUNNER, CHASER, SHOOTER, BLOCKER, BOSS.
   Each has clear, telegraphed behavior so hits always feel fair. */
(function (RV) {
  'use strict';

  var TYPES = {
    runner: { hp: 1, radius: 0.5, baseSpeed: 3.6, color: '#ff6a6a', score: 60, xp: 4 },
    chaser: { hp: 2, radius: 0.55, baseSpeed: 3.0, color: '#ff9a3c', score: 90, xp: 6 },
    shooter: { hp: 2, radius: 0.55, baseSpeed: 0.6, color: '#c76bff', score: 100, xp: 7 },
    blocker: { hp: 3, radius: 0.75, baseSpeed: 0, color: '#7d8fff', score: 80, xp: 6 },
    boss: { hp: 14, radius: 1.5, baseSpeed: 1.8, color: '#ff2f5f', score: 600, xp: 40 }
  };

  var idc = 0;

  function spawn(type, x, z, difficulty) {
    var def = TYPES[type];
    difficulty = difficulty || 1;
    return {
      id: ++idc,
      type: type,
      x: x, z: z,
      hp: Math.round(def.hp * (1 + (difficulty - 1) * 0.35)),
      maxHp: Math.round(def.hp * (1 + (difficulty - 1) * 0.35)),
      radius: def.radius,
      speed: def.baseSpeed * (1 + (difficulty - 1) * 0.22),
      color: def.color,
      score: def.score, xpVal: def.xp,
      alive: true,
      hitFlash: 0,
      slowTimer: 0,
      stunTimer: 0,
      fireTimer: type === 'shooter' ? 1.4 + Math.random() : 0,
      telegraph: 0,
      spinPhase: Math.random() * Math.PI * 2,
      dir: { x: 0, z: 1 }
    };
  }

  function update(e, dt, playerX, playerZ, projectiles) {
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.slowTimer = Math.max(0, e.slowTimer - dt);
    e.stunTimer = Math.max(0, e.stunTimer - dt);
    if (e.stunTimer > 0) return;
    var speedMul = e.slowTimer > 0 ? 0.35 : 1;

    var dx = playerX - e.x, dz = playerZ - e.z;
    var dist = Math.hypot(dx, dz) || 1;

    if (e.type === 'runner') {
      // Charges straight in the direction it was aimed when spawned.
      e.x += e.dir.x * e.speed * speedMul * dt;
      e.z += e.dir.z * e.speed * speedMul * dt;
    } else if (e.type === 'chaser') {
      e.x += (dx / dist) * e.speed * speedMul * dt;
      e.z += (dz / dist) * e.speed * speedMul * dt;
    } else if (e.type === 'shooter') {
      e.fireTimer -= dt * speedMul;
      e.spinPhase += dt;
      if (e.fireTimer <= 0) {
        e.fireTimer = 2.6;
        e.telegraph = 0.45;
      }
      if (e.telegraph > 0) {
        e.telegraph -= dt;
        if (e.telegraph <= 0 && projectiles) {
          projectiles.push({ x: e.x, z: e.z, dx: dx / dist, dz: dz / dist, speed: 4.6, life: 3.2, radius: 0.28 });
        }
      }
    } else if (e.type === 'blocker') {
      e.spinPhase += dt;
      // stationary, just guards its tile
    } else if (e.type === 'boss') {
      if (dist > 2.2) {
        e.x += (dx / dist) * e.speed * speedMul * dt;
        e.z += (dz / dist) * e.speed * speedMul * dt;
      }
      e.spinPhase += dt;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && projectiles) {
        e.fireTimer = 1.8;
        for (var a = 0; a < 3; a++) {
          var ang = Math.atan2(dz, dx) + (a - 1) * 0.35;
          projectiles.push({ x: e.x, z: e.z, dx: Math.cos(ang), dz: Math.sin(ang), speed: 4, life: 3, radius: 0.3 });
        }
      }
    }
  }

  function hit(e, dmg) {
    e.hp -= dmg;
    e.hitFlash = 0.18;
    if (e.hp <= 0) e.alive = false;
    return !e.alive;
  }

  function applySlow(e, dur) { e.slowTimer = Math.max(e.slowTimer, dur); }
  function applyStun(e, dur) { e.stunTimer = Math.max(e.stunTimer, dur); }

  function draw(ctx, e, project) {
    var pos = project(e.x, e.z);
    if (!pos || pos.cull) return;
    var scale = pos.scale;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + 5 * scale, 16 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    var flashColor = e.hitFlash > 0 ? '#ffffff' : e.color;
    var size = (e.type === 'boss' ? 34 : 15) * scale;

    if (e.telegraph > 0) {
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(performance.now() / 40);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size + 8 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = flashColor;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 14 * scale;

    if (e.type === 'blocker') {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(e.spinPhase * 0.5);
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.restore();
    } else if (e.type === 'shooter') {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(e.spinPhase);
      for (var i = 0; i < 3; i++) {
        ctx.rotate(Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.5, size * 0.5);
        ctx.lineTo(-size * 0.5, size * 0.5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, size * 0.85, size, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (e.type === 'boss') {
      var barW = 60 * scale;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(pos.x - barW / 2, pos.y - size - 16 * scale, barW, 6 * scale);
      ctx.fillStyle = '#ff2f5f';
      ctx.fillRect(pos.x - barW / 2, pos.y - size - 16 * scale, barW * Math.max(0, e.hp / e.maxHp), 6 * scale);
      if (e.weakOpen) {
        ctx.strokeStyle = '#ffce45';
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(performance.now() / 80);
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size + 14 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }

  RV.Enemy = { TYPES: TYPES, spawn: spawn, update: update, hit: hit, applySlow: applySlow, applyStun: applyStun, draw: draw };
})(window.RV || (window.RV = {}));
