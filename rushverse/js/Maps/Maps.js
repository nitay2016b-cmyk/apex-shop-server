/* RUSHVERSE - Maps/Maps.js
   Renders the arena floor/sky/boundary for the active map, using the
   pseudo-3D camera projection so each theme (Neon City, Desert Run, Frozen
   Lab, Sky City, Volcano Core) reads as a distinct place, not a palette
   swap alone. Also spawns theme-appropriate ambient particles. */
(function (RV) {
  'use strict';

  var ambientParticles = [];

  function resetAmbient(mapDef, arenaRadius) {
    ambientParticles.length = 0;
    var count = RV.Effects.quality() === 'low' ? 10 : RV.Effects.quality() === 'medium' ? 22 : 40;
    for (var i = 0; i < count; i++) {
      ambientParticles.push({
        x: (Math.random() * 2 - 1) * arenaRadius * 1.3,
        z: (Math.random() * 2 - 1) * arenaRadius * 1.3,
        h: Math.random() * 6,
        speed: 0.3 + Math.random() * 0.8,
        drift: Math.random() * Math.PI * 2,
        size: 1.5 + Math.random() * 2.5
      });
    }
  }

  function updateAmbient(dt, mapDef, arenaRadius) {
    ambientParticles.forEach(function (p) {
      p.drift += dt * 0.2;
      if (mapDef.id === 'desert_run') { p.x += Math.cos(p.drift) * dt * 1.4; p.z += 0.6 * dt; }
      else if (mapDef.id === 'sky_city') { p.h += dt * 0.4; p.x += Math.sin(p.drift) * dt * 0.3; }
      else if (mapDef.id === 'volcano_core') { p.h += dt * p.speed * 1.5; }
      else { p.h += dt * 0.15; p.x += Math.sin(p.drift) * dt * 0.2; }
      if (p.h > 7) p.h = 0;
      var lim = arenaRadius * 1.3;
      if (p.x > lim) p.x = -lim; if (p.x < -lim) p.x = lim;
      if (p.z > lim) p.z = -lim; if (p.z < -lim) p.z = lim;
    });
  }

  function drawSky(ctx, canvas, mapDef) {
    var g = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
    g.addColorStop(0, mapDef.palette.sky1);
    g.addColorStop(1, mapDef.palette.sky2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawFloor(ctx, canvas, mapDef, arenaRadius, project) {
    var horizon = RV.Camera.horizonY();
    var ground = RV.Camera.groundY();
    var floorGrad = ctx.createLinearGradient(0, horizon, 0, canvas.height);
    floorGrad.addColorStop(0, mapDef.palette.floor2);
    floorGrad.addColorStop(1, mapDef.palette.floor1);
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizon, canvas.width, canvas.height - horizon);

    // horizon glow
    var glow = ctx.createRadialGradient(canvas.width / 2, horizon, 5, canvas.width / 2, horizon, canvas.width * 0.6);
    glow.addColorStop(0, mapDef.palette.ambient + 'aa');
    glow.addColorStop(1, mapDef.palette.ambient + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - canvas.height * 0.15, canvas.width, canvas.height * 0.35);

    // perspective grid lines
    ctx.strokeStyle = mapDef.palette.grid;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1;
    var lines = 9;
    for (var i = -lines; i <= lines; i++) {
      var p1 = project(i * (arenaRadius / lines) * 1.4, -RV.Camera.BEHIND);
      var p2 = project(i * (arenaRadius / lines) * 1.4, RV.Camera.AHEAD);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    var depthLines = 7;
    for (var d = 0; d <= depthLines; d++) {
      var zPos = -RV.Camera.BEHIND + (RV.Camera.AHEAD + RV.Camera.BEHIND) * (d / depthLines);
      var pa = project(-arenaRadius * 1.4, zPos);
      var pb = project(arenaRadius * 1.4, zPos);
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawBoundary(ctx, arenaRadius, project) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    var segs = 48;
    for (var i = 0; i <= segs; i++) {
      var a = (i / segs) * Math.PI * 2;
      var p = project(Math.cos(a) * arenaRadius, Math.sin(a) * arenaRadius);
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  function drawAmbient(ctx, mapDef, project) {
    ambientParticles.forEach(function (p) {
      var pos = project(p.x, p.z);
      if (!pos || pos.cull) return;
      var y = pos.y - p.h * 20 * pos.scale;
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = mapDef.palette.glow;
      ctx.beginPath();
      ctx.arc(pos.x, y, p.size * pos.scale, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function render(ctx, canvas, mapDef, arenaRadius, project, blackout) {
    drawSky(ctx, canvas, mapDef);
    drawFloor(ctx, canvas, mapDef, arenaRadius, project);
    drawBoundary(ctx, arenaRadius, project);
    drawAmbient(ctx, mapDef, project);
    if (blackout) {
      var vg = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.6, canvas.height * 0.12, canvas.width / 2, canvas.height * 0.6, canvas.height * 0.62);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.93)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  RV.Maps = { resetAmbient: resetAmbient, updateAmbient: updateAmbient, render: render };
})(window.RV || (window.RV = {}));
