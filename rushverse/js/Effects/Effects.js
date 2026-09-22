/* RUSHVERSE - Effects/Effects.js
   Particle bursts, floating combat text, and screen shake. Particle budget
   scales with the Graphics setting so low-end devices stay smooth. */
(function (RV) {
  'use strict';

  var particles = [];
  var floaters = [];
  var shakeMag = 0;
  var shakeDecay = 0;

  var QUALITY_BUDGET = { low: 40, medium: 140, high: 320 };

  function quality() { return RV.Save.get().settings.graphics || 'medium'; }
  function budget() { return QUALITY_BUDGET[quality()] || 140; }

  function burst(x, y, color, opts) {
    opts = opts || {};
    var count = Math.round((opts.count || 12) * (quality() === 'low' ? 0.35 : quality() === 'medium' ? 0.7 : 1));
    for (var i = 0; i < count; i++) {
      if (particles.length > budget()) particles.shift();
      var angle = Math.random() * Math.PI * 2;
      var speed = (opts.speed || 90) * (0.4 + Math.random() * 0.9);
      particles.push({
        x: x, y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (opts.upBias || 0),
        life: 0, maxLife: (opts.life || 0.5) * (0.7 + Math.random() * 0.6),
        size: (opts.size || 4) * (0.6 + Math.random() * 0.8),
        color: color,
        gravity: opts.gravity != null ? opts.gravity : 140,
        glow: opts.glow !== false
      });
    }
  }

  function floatText(x, y, text, color, opts) {
    opts = opts || {};
    floaters.push({
      x: x, y: y, text: text, color: color,
      life: 0, maxLife: opts.life || 0.9,
      size: opts.size || 18, vy: opts.vy || -55
    });
  }

  function shake(mag) {
    shakeMag = Math.max(shakeMag, mag);
    shakeDecay = 4.5;
  }

  function update(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (i = floaters.length - 1; i >= 0; i--) {
      var f = floaters[i];
      f.life += dt;
      if (f.life >= f.maxLife) { floaters.splice(i, 1); continue; }
      f.y += f.vy * dt;
    }
    if (shakeMag > 0) {
      shakeMag = Math.max(0, shakeMag - shakeDecay * dt * 60 * dt);
      shakeMag *= Math.max(0, 1 - dt * 6);
      if (shakeMag < 0.05) shakeMag = 0;
    }
  }

  function getShakeOffset() {
    if (shakeMag <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() * 2 - 1) * shakeMag,
      y: (Math.random() * 2 - 1) * shakeMag
    };
  }

  function drawWorldParticles(ctx, worldToScreen) {
    particles.forEach(function (p) {
      var pos = worldToScreen(p.x, p.y);
      if (!pos || pos.cull) return;
      var a = 1 - p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, a);
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10 * pos.scale;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * pos.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function drawScreenFloaters(ctx, worldToScreen) {
    floaters.forEach(function (f) {
      var pos = worldToScreen(f.x, f.y);
      if (!pos) return;
      var a = 1 - f.life / f.maxLife;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = f.color;
      ctx.font = '700 ' + Math.round(f.size * (pos.scale || 1)) + 'px Segoe UI, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, pos.x, pos.y);
    });
    ctx.globalAlpha = 1;
  }

  function clear() {
    particles.length = 0;
    floaters.length = 0;
    shakeMag = 0;
  }

  RV.Effects = {
    burst: burst,
    floatText: floatText,
    shake: shake,
    update: update,
    getShakeOffset: getShakeOffset,
    drawWorldParticles: drawWorldParticles,
    drawScreenFloaters: drawScreenFloaters,
    clear: clear,
    quality: quality
  };
})(window.RV || (window.RV = {}));
