/* RUSHVERSE - Items/Obstacles.js
   Every obstacle type from the design doc, built on four shared behaviors
   (toggle zone, sweeping mover, orbiting spinner, falling impact) so new
   flavors are just new TYPE_META entries. Ground hazards are jump-avoidable;
   solid/moving hazards must be dashed or dodged around — that split is what
   gives Jump and Dash distinct tactical uses. Every hazard telegraphs before
   it can hurt the player. */
(function (RV) {
  'use strict';

  var TYPE_META = {
    laser: { behavior: 'toggle', shape: 'beam', jumpSafe: true, warn: 0.45, on: 1.0, off: 1.6, color: '#ff3bd6' },
    electricZone: { behavior: 'toggle', shape: 'zone', jumpSafe: true, warn: 0.5, on: 1.3, off: 1.4, radius: 1.4, color: '#7fe7ff' },
    frostTrap: { behavior: 'toggle', shape: 'zone', jumpSafe: true, warn: 0.5, on: 1.6, off: 1.3, radius: 1.2, color: '#bdfbff', slows: true },
    lava: { behavior: 'static', shape: 'zone', jumpSafe: true, radius: 1.6, color: '#ff5a1f' },
    sandTrap: { behavior: 'staticSlow', shape: 'zone', jumpSafe: true, radius: 1.6, color: '#ffb85c' },
    slideFloor: { behavior: 'staticSlow', shape: 'zone', jumpSafe: true, radius: 1.5, color: '#9fd0ff' },
    movingWall: { behavior: 'sweep', shape: 'wall', jumpSafe: false, span: 5, speed: 1.1, len: 2.6, color: '#7a3bff' },
    door: { behavior: 'toggle', shape: 'wall', jumpSafe: false, warn: 0.5, on: 1.4, off: 1.6, len: 2.2, color: '#5c8fd6' },
    boulder: { behavior: 'sweep', shape: 'ball', jumpSafe: false, span: 6, speed: 1.4, radius: 0.9, color: '#8a5220' },
    spinner: { behavior: 'orbit', shape: 'ball', jumpSafe: false, orbitRadius: 2.4, orbitSpeed: 1.6, arms: 3, radius: 0.5, color: '#ff9a3c' },
    fallingRock: { behavior: 'falling', shape: 'impact', jumpSafe: false, warn: 0.85, impact: 0.35, cooldown: 1.6, radius: 1.1, color: '#c76b3c' }
  };

  var idc = 0;

  function spawn(type, arenaRadius) {
    var meta = TYPE_META[type];
    var o = {
      id: ++idc, type: type, meta: meta,
      x: 0, z: 0, phase: 'off', timer: 0.6 + Math.random() * 0.8,
      angle: Math.random() * Math.PI * 2
    };
    var pos = randomPos(arenaRadius * 0.8);
    o.x = pos.x; o.z = pos.z;
    if (meta.behavior === 'sweep') {
      o.axis = Math.random() < 0.5 ? 'x' : 'z';
      o.center = pos;
      o.t = Math.random() * Math.PI * 2;
    }
    if (meta.behavior === 'orbit') {
      o.pivot = randomPos(arenaRadius * 0.5);
    }
    if (meta.behavior === 'falling') {
      o.phase = 'idle';
      o.timer = Math.random() * 1.2;
    }
    return o;
  }

  function randomPos(maxR) {
    var a = Math.random() * Math.PI * 2;
    var r = Math.random() * maxR;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  }

  function update(o, dt, arenaRadius, speedMul) {
    speedMul = speedMul || 1;
    var m = o.meta;
    if (m.behavior === 'toggle') {
      o.timer -= dt;
      if (o.timer <= 0) {
        if (o.phase === 'off') { o.phase = 'warn'; o.timer = m.warn; }
        else if (o.phase === 'warn') { o.phase = 'on'; o.timer = m.on; }
        else { o.phase = 'off'; o.timer = m.off; }
      }
    } else if (m.behavior === 'sweep') {
      o.t += dt * m.speed * speedMul;
      var off = Math.sin(o.t) * m.span * 0.5;
      if (o.axis === 'x') { o.x = o.center.x + off; o.z = o.center.z; }
      else { o.z = o.center.z + off; o.x = o.center.x; }
      o.x = Math.max(-arenaRadius + 0.5, Math.min(arenaRadius - 0.5, o.x));
      o.z = Math.max(-arenaRadius + 0.5, Math.min(arenaRadius - 0.5, o.z));
      o.phase = 'on';
    } else if (m.behavior === 'orbit') {
      o.angle += dt * m.orbitSpeed * speedMul;
      o.phase = 'on';
    } else if (m.behavior === 'falling') {
      o.timer -= dt;
      if (o.phase === 'idle' && o.timer <= 0) {
        var pos = randomPos(arenaRadius * 0.75);
        o.x = pos.x; o.z = pos.z;
        o.phase = 'warn'; o.timer = m.warn;
      } else if (o.phase === 'warn' && o.timer <= 0) {
        o.phase = 'impact'; o.timer = m.impact;
      } else if (o.phase === 'impact' && o.timer <= 0) {
        o.phase = 'idle'; o.timer = m.cooldown + Math.random() * 1.5;
      }
    }
  }

  // orbit ball world positions (array, since `arms` can be >1)
  function orbitBalls(o) {
    var out = [];
    for (var i = 0; i < o.meta.arms; i++) {
      var a = o.angle + (Math.PI * 2 / o.meta.arms) * i;
      out.push({ x: o.pivot.x + Math.cos(a) * o.meta.orbitRadius, z: o.pivot.z + Math.sin(a) * o.meta.orbitRadius });
    }
    return out;
  }

  function isDangerousNow(o) {
    var m = o.meta;
    if (m.behavior === 'static') return true;
    if (m.behavior === 'staticSlow') return false; // never damages, only slows
    if (m.behavior === 'toggle') return o.phase === 'on';
    if (m.behavior === 'sweep' || m.behavior === 'orbit') return true;
    if (m.behavior === 'falling') return o.phase === 'impact';
    return false;
  }

  function isSlowingNow(o) {
    var m = o.meta;
    if (m.behavior === 'staticSlow') return true;
    if (m.type === 'frostTrap') return o.phase === 'on';
    return false;
  }

  function checkCollision(o, px, pz, pRadius, airborne) {
    var m = o.meta;
    if (m.jumpSafe && airborne) return { danger: false, slow: false };
    var danger = isDangerousNow(o);
    var slow = isSlowingNow(o) && !airborne;
    if (!danger && !slow) return { danger: false, slow: false };

    var hit = false;
    if (m.shape === 'zone') {
      hit = Math.hypot(px - o.x, pz - o.z) < (m.radius + pRadius);
    } else if (m.shape === 'beam') {
      // beam sweeps across the whole arena along z at o.z, half-width 0.55
      hit = Math.abs(pz - o.z) < (0.55 + pRadius);
    } else if (m.shape === 'wall') {
      var half = m.len / 2;
      if (o.axis === 'x') hit = Math.abs(pz - o.z) < (0.5 + pRadius) && Math.abs(px - o.x) < half;
      else if (o.axis === 'z') hit = Math.abs(px - o.x) < (0.5 + pRadius) && Math.abs(pz - o.z) < half;
      else hit = Math.hypot(px - o.x, pz - o.z) < (half + pRadius);
    } else if (m.shape === 'ball') {
      if (m.behavior === 'orbit') {
        hit = orbitBalls(o).some(function (b) { return Math.hypot(px - b.x, pz - b.z) < (m.radius + pRadius); });
      } else {
        hit = Math.hypot(px - o.x, pz - o.z) < (m.radius + pRadius);
      }
    } else if (m.shape === 'impact') {
      hit = Math.hypot(px - o.x, pz - o.z) < (m.radius + pRadius);
    }
    return { danger: hit && danger, slow: hit && slow };
  }

  function draw(ctx, o, project) {
    var m = o.meta;
    var glowColor = m.color;
    var alphaPulse = 0.75 + 0.25 * Math.sin(performance.now() / 160);

    function drawZone(x, z, r, active, warn) {
      var pos = project(x, z);
      if (!pos || pos.cull) return;
      ctx.globalAlpha = warn ? 0.35 + 0.35 * alphaPulse : (active ? 0.55 : 0.22);
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, r * 40 * pos.scale, r * 18 * pos.scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (m.shape === 'zone') {
      drawZone(o.x, o.z, m.radius, o.phase === 'on' || m.behavior === 'static' || m.behavior === 'staticSlow', o.phase === 'warn');
    } else if (m.shape === 'beam') {
      var a = project(-9, o.z), b = project(9, o.z);
      if (!a || !b) return;
      ctx.strokeStyle = glowColor;
      ctx.globalAlpha = o.phase === 'on' ? 0.9 : (o.phase === 'warn' ? 0.4 + 0.3 * alphaPulse : 0.15);
      ctx.lineWidth = (o.phase === 'on' ? 8 : 3) * ((a.scale + b.scale) / 2);
      ctx.shadowColor = glowColor; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    } else if (m.shape === 'wall') {
      var half = m.len / 2;
      var p1, p2;
      if (o.axis === 'x') { p1 = project(o.x - half, o.z); p2 = project(o.x + half, o.z); }
      else { p1 = project(o.x, o.z - half); p2 = project(o.x, o.z + half); }
      if (!p1 || !p2) return;
      var active = o.phase === 'on';
      ctx.strokeStyle = glowColor;
      ctx.globalAlpha = active ? 0.95 : 0.35 + 0.3 * alphaPulse;
      ctx.lineWidth = 16 * ((p1.scale + p2.scale) / 2);
      ctx.lineCap = 'round';
      ctx.shadowColor = glowColor; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    } else if (m.shape === 'ball') {
      if (m.behavior === 'orbit') {
        orbitBalls(o).forEach(function (b) {
          var pos = project(b.x, b.z);
          if (!pos || pos.cull) return;
          ctx.fillStyle = glowColor;
          ctx.shadowColor = glowColor; ctx.shadowBlur = 12 * pos.scale;
          ctx.beginPath(); ctx.arc(pos.x, pos.y, m.radius * 32 * pos.scale, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        });
        var pivotPos = project(o.pivot.x, o.pivot.z);
        if (pivotPos && !pivotPos.cull) {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = glowColor;
          ctx.beginPath(); ctx.arc(pivotPos.x, pivotPos.y, 8 * pivotPos.scale, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        var bp = project(o.x, o.z);
        if (!bp || bp.cull) return;
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor; ctx.shadowBlur = 10 * bp.scale;
        ctx.beginPath(); ctx.arc(bp.x, bp.y, m.radius * 34 * bp.scale, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    } else if (m.shape === 'impact') {
      var ip = project(o.x, o.z);
      if (!ip || ip.cull) return;
      if (o.phase === 'warn') {
        ctx.globalAlpha = 0.3 + 0.4 * (1 - o.timer / m.warn);
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(ip.x, ip.y, m.radius * 34 * ip.scale, m.radius * 15 * ip.scale, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = glowColor; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; ctx.stroke();
      } else if (o.phase === 'impact') {
        ctx.fillStyle = glowColor;
        ctx.shadowColor = glowColor; ctx.shadowBlur = 20 * ip.scale;
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.arc(ip.x, ip.y, m.radius * 40 * ip.scale, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }
  }

  RV.Obstacles = {
    TYPE_META: TYPE_META, spawn: spawn, update: update, draw: draw,
    checkCollision: checkCollision, isDangerousNow: isDangerousNow
  };
})(window.RV || (window.RV = {}));
