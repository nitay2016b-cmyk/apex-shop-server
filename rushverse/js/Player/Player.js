/* RUSHVERSE - Player/Player.js
   Player entity: movement, dash, jump, swipe-dodge, HP/invulnerability,
   status effects (shield/speed/magnet/multiplier/freeze-immune/slowed) and
   rendering. Ability *logic* (what it does to enemies/coins) is executed by
   GameLoop, which listens for the 'ability' event this module emits. */
(function (RV) {
  'use strict';

  var BASE_SPEED = 5.2;      // world units / sec
  var DASH_SPEED = 15;
  var DASH_TIME = 0.18;
  var DASH_COOLDOWN = 1.35;
  var SWIPE_DODGE_SPEED = 11;
  var SWIPE_DODGE_TIME = 0.16;
  var SWIPE_COOLDOWN = 0.9;
  var JUMP_TIME = 0.55;
  var MAX_HP = 3;
  var HIT_INVULN = 1.1;

  function create(characterDef) {
    return {
      x: 0, z: 0, facing: 0,
      radius: 0.55,
      hp: MAX_HP, maxHp: MAX_HP,
      character: characterDef,
      vx: 0, vz: 0,
      dashTimer: 0, dashCooldown: 0, dashDir: { x: 0, z: -1 },
      swipeTimer: 0, swipeCooldown: 0,
      jumpTimer: 0,
      invulnTimer: 1.4, // brief safety window at match start
      abilityCooldown: 0, abilityActiveTimer: 0,
      lastMoveDir: { x: 0, z: -1 },
      status: {
        shieldTimer: 0, speedTimer: 0, magnetTimer: 0,
        multiplierTimer: 0, multiplierValue: 1,
        slowedTimer: 0, secondChance: false
      },
      tookDamageThisRun: false,
      distanceSinceTrail: 0,
      events: []
    };
  }

  function emit(p, type, data) { p.events.push({ type: type, data: data }); }
  function drainEvents(p) { var e = p.events; p.events = []; return e; }

  function isDashing(p) { return p.dashTimer > 0; }
  function isSwiping(p) { return p.swipeTimer > 0; }
  function isAirborne(p) { return p.jumpTimer > 0; }
  function isInvulnerable(p) { return p.invulnTimer > 0 || isDashing(p) || isSwiping(p) || p.status.shieldTimer > 0 || (p.character.ability.id === 'phase' && p.abilityActiveTimer > 0); }
  function isFrozenImmune(p) { return p.character.ability.id === 'frost'; }

  function speedMultiplier(p) {
    var m = 1;
    if (p.status.speedTimer > 0) m *= 1.55;
    if (p.status.slowedTimer > 0) m *= 0.5;
    if (p.character.ability.id === 'dasher' && p.abilityActiveTimer <= 0) m *= 1.05;
    return m;
  }

  function update(p, dt, input, arenaRadius) {
    // timers
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.swipeTimer = Math.max(0, p.swipeTimer - dt);
    p.swipeCooldown = Math.max(0, p.swipeCooldown - dt);
    p.jumpTimer = Math.max(0, p.jumpTimer - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.abilityCooldown = Math.max(0, p.abilityCooldown - dt);
    p.abilityActiveTimer = Math.max(0, p.abilityActiveTimer - dt);
    var st = p.status;
    st.shieldTimer = Math.max(0, st.shieldTimer - dt);
    st.speedTimer = Math.max(0, st.speedTimer - dt);
    st.magnetTimer = Math.max(0, st.magnetTimer - dt);
    st.multiplierTimer = Math.max(0, st.multiplierTimer - dt);
    if (st.multiplierTimer <= 0) st.multiplierValue = 1;
    st.slowedTimer = Math.max(0, st.slowedTimer - dt);

    var moving = Math.abs(input.moveX) > 0.05 || Math.abs(input.moveY) > 0.05;

    if (isDashing(p)) {
      p.x += p.dashDir.x * DASH_SPEED * dt;
      p.z += p.dashDir.z * DASH_SPEED * dt;
    } else if (isSwiping(p)) {
      p.x += p.dashDir.x * SWIPE_DODGE_SPEED * dt;
      p.z += p.dashDir.z * SWIPE_DODGE_SPEED * dt;
    } else if (moving) {
      var len = Math.hypot(input.moveX, input.moveY) || 1;
      var nx = input.moveX / len, nz = input.moveY / len;
      p.lastMoveDir.x = nx; p.lastMoveDir.z = nz;
      p.facing = Math.atan2(nx, -nz);
      var sp = BASE_SPEED * speedMultiplier(p) * Math.min(1, len * 1.3);
      p.x += nx * sp * dt;
      p.z += nz * sp * dt;
    }

    // clamp to circular arena
    var d = Math.hypot(p.x, p.z);
    if (d > arenaRadius - p.radius) {
      var k = (arenaRadius - p.radius) / d;
      p.x *= k; p.z *= k;
    }

    // dash trigger
    if (input.dash && p.dashCooldown <= 0 && !isDashing(p)) {
      var dashDir = moving ? { x: p.lastMoveDir.x, z: p.lastMoveDir.z } : { x: p.lastMoveDir.x, z: p.lastMoveDir.z };
      var isBlink = p.character.ability.id === 'blink';
      p.dashDir = dashDir;
      p.dashTimer = isBlink ? DASH_TIME * 1.4 : DASH_TIME;
      p.dashCooldown = isBlink ? DASH_COOLDOWN * 0.55 : DASH_COOLDOWN;
      emit(p, 'dash', { blink: isBlink });
    }

    // jump trigger
    if (input.jump && p.jumpTimer <= 0) {
      p.jumpTimer = JUMP_TIME;
      emit(p, 'jump', {});
    }

    // swipe dodge trigger
    if (input.swipe && p.swipeCooldown <= 0 && !isDashing(p)) {
      // screen dx = world x; screen dz(down positive) = world z (toward camera)
      var mag = Math.hypot(input.swipe.dx, input.swipe.dz) || 1;
      p.dashDir = { x: input.swipe.dx / mag, z: input.swipe.dz / mag };
      p.swipeTimer = SWIPE_DODGE_TIME;
      p.swipeCooldown = SWIPE_COOLDOWN;
      emit(p, 'swipe', {});
    }

    // ability trigger
    if (input.ability && p.abilityCooldown <= 0) {
      p.abilityCooldown = p.character.ability.cooldown / 1000;
      p.abilityActiveTimer = p.character.ability.duration / 1000;
      emit(p, 'ability', { ability: p.character.ability });
    }
  }

  function applyHit(p) {
    if (isInvulnerable(p)) return false;
    p.hp -= 1;
    p.invulnTimer = HIT_INVULN;
    p.tookDamageThisRun = true;
    emit(p, 'hit', { hp: p.hp });
    if (p.hp <= 0) {
      if (p.status.secondChance) {
        p.status.secondChance = false;
        p.hp = 1;
        emit(p, 'secondChance', {});
        return true;
      }
      emit(p, 'died', {});
    }
    return true;
  }

  function grantPowerup(p, type) {
    switch (type) {
      case 'shield': p.status.shieldTimer = 6; break;
      case 'magnet': p.status.magnetTimer = 7; break;
      case 'speed': p.status.speedTimer = 6; break;
      case 'multiplier': p.status.multiplierTimer = 8; p.status.multiplierValue = 2; break;
      case 'freeze': /* handled globally by GameLoop on enemies/obstacles */ break;
      case 'secondChance': p.status.secondChance = true; break;
    }
  }

  function draw(ctx, p, project, skin) {
    var anchor = project(p.x, p.z);
    if (!anchor) return;
    var scale = anchor.scale;
    var bob = isAirborne(p) ? Math.sin((0.55 - p.jumpTimer) / 0.55 * Math.PI) * 22 : 0;
    var bodyY = anchor.y - bob * scale;

    // shadow
    ctx.globalAlpha = 0.35 - (isAirborne(p) ? 0.18 : 0);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(anchor.x, anchor.y + 6 * scale, 20 * scale * (1 - bob / 60), 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    var flicker = isInvulnerable(p) && Math.floor(performance.now() / 90) % 2 === 0;
    if (flicker && p.invulnTimer > 0 && p.hp > 0) ctx.globalAlpha = 0.45;

    var color = p.character.color;
    var outfitColor = skin && skin.outfitColor ? skin.outfitColor : color;

    // trail glow ring if dashing
    if (isDashing(p) || isSwiping(p)) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(anchor.x, bodyY, 26 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // body
    var grad = ctx.createRadialGradient(anchor.x, bodyY - 10 * scale, 2, anchor.x, bodyY, 26 * scale);
    grad.addColorStop(0, p.character.accent);
    grad.addColorStop(1, outfitColor);
    ctx.fillStyle = grad;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18 * scale;
    ctx.beginPath();
    ctx.ellipse(anchor.x, bodyY, 15 * scale, 20 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // facing visor
    var fx = anchor.x + Math.sin(p.facing) * 10 * scale;
    var fy = bodyY - Math.cos(p.facing) * 6 * scale - 6 * scale;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(fx, fy, 3.4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // shield ring
    if (p.status.shieldTimer > 0) {
      ctx.strokeStyle = '#7ad9ff';
      ctx.lineWidth = 2.4 * scale;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(anchor.x, bodyY, 24 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // magnet aura
    if (p.status.magnetTimer > 0) {
      ctx.strokeStyle = '#ff7ad1';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(anchor.x, bodyY, 55 * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 1;
  }

  RV.Player = {
    create: create, update: update, draw: draw,
    applyHit: applyHit, grantPowerup: grantPowerup,
    drainEvents: drainEvents,
    isDashing: isDashing, isSwiping: isSwiping, isAirborne: isAirborne,
    isInvulnerable: isInvulnerable, isFrozenImmune: isFrozenImmune,
    MAX_HP: MAX_HP
  };
})(window.RV || (window.RV = {}));
