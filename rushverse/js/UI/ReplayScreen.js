/* RUSHVERSE - UI/ReplayScreen.js
   Plays back the single saved "last run" replay: a ghost of the player's
   recorded path/HP/score plus timed moment markers (dashes, hits, kills,
   abilities), rendered through the same pseudo-3D camera/map renderer as
   live play. Includes Spectator camera modes (Follow / Wide / Cinematic)
   and Pause / Fast-Forward / Restart / Exit — it does not re-simulate
   enemies or obstacles (those aren't recorded), so this is an honest
   "ghost + highlights" replay rather than a full re-simulation. */
(function (RV) {
  'use strict';

  var el, canvas, ctx;
  var rafId = null, lastTime = 0;
  var data = null;
  var state = null;
  var CAMERA_MODES = ['follow', 'wide', 'cinematic'];
  var SPEEDS = [1, 2, 4];

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen replay-screen';
    container.appendChild(el);
    return { el: el, onShow: onShow, onHide: onHide };
  }

  function onShow() {
    data = RV.Replay.getSaved();
    if (!data || !data.samples || !data.samples.length) {
      el.innerHTML = '<div class="empty-state replay-empty">No saved run yet.<br>Finish a match and tap SAVE RUN.<br><button class="menu-btn" id="replayExitBtn" style="margin-top:16px;max-width:220px">BACK TO HOME</button></div>';
      el.querySelector('#replayExitBtn').addEventListener('click', function () { RV.Audio.sfx.click(); RV.UI.show('home'); });
      return;
    }
    el.innerHTML =
      '<canvas id="replayCanvas"></canvas>' +
      '<div class="replay-hud">' +
        '<div class="replay-hud-top">' +
          '<div class="replay-title">REPLAY &middot; ' + (data.mapName || '') + '</div>' +
          '<div class="replay-score" id="replayScore">0</div>' +
        '</div>' +
        '<div class="replay-time" id="replayTime">0:00 / 0:00</div>' +
      '</div>' +
      '<div class="replay-controls">' +
        '<button class="replay-btn" id="rExit">&#10005;</button>' +
        '<button class="replay-btn" id="rRestart">&#8634;</button>' +
        '<button class="replay-btn wide" id="rPlay">&#10074;&#10074;</button>' +
        '<button class="replay-btn" id="rSpeed">1x</button>' +
        '<button class="replay-btn" id="rCamera">FOLLOW</button>' +
      '</div>';

    canvas = el.querySelector('#replayCanvas');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    var duration = data.samples[data.samples.length - 1].t;
    state = { playhead: 0, playing: true, speedIdx: 0, cameraIdx: 0, duration: duration, fired: {} };

    el.querySelector('#rPlay').addEventListener('click', togglePlay);
    el.querySelector('#rRestart').addEventListener('click', restart);
    el.querySelector('#rSpeed').addEventListener('click', cycleSpeed);
    el.querySelector('#rCamera').addEventListener('click', cycleCamera);
    el.querySelector('#rExit').addEventListener('click', exitReplay);

    lastTime = performance.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function onHide() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    RV.Camera.resize(w, h);
  }

  function togglePlay() {
    state.playing = !state.playing;
    el.querySelector('#rPlay').innerHTML = state.playing ? '&#10074;&#10074;' : '&#9654;';
    RV.Audio.sfx.click();
  }
  function restart() {
    state.playhead = 0; state.playing = true; state.fired = {};
    el.querySelector('#rPlay').innerHTML = '&#10074;&#10074;';
    RV.Audio.sfx.click();
  }
  function cycleSpeed() {
    state.speedIdx = (state.speedIdx + 1) % SPEEDS.length;
    el.querySelector('#rSpeed').textContent = SPEEDS[state.speedIdx] + 'x';
    RV.Audio.sfx.click();
  }
  function cycleCamera() {
    state.cameraIdx = (state.cameraIdx + 1) % CAMERA_MODES.length;
    el.querySelector('#rCamera').textContent = CAMERA_MODES[state.cameraIdx].toUpperCase();
    RV.Audio.sfx.click();
  }
  function exitReplay() {
    RV.Audio.sfx.click();
    RV.UI.show('home');
  }

  function interpolate(t) {
    var samples = data.samples;
    if (t <= samples[0].t) return samples[0];
    for (var i = 1; i < samples.length; i++) {
      if (samples[i].t >= t) {
        var a = samples[i - 1], b = samples[i];
        var span = Math.max(0.001, b.t - a.t);
        var f = (t - a.t) / span;
        return {
          x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f,
          facing: a.facing + (b.facing - a.facing) * f,
          hp: a.hp, score: a.score, combo: a.combo
        };
      }
    }
    return samples[samples.length - 1];
  }

  function loop(now) {
    if (!rafId) return;
    var dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (state.playing) {
      state.playhead += dt * SPEEDS[state.speedIdx];
      if (state.playhead >= state.duration) { state.playhead = state.duration; state.playing = false; el.querySelector('#rPlay').innerHTML = '&#9654;'; }
    }
    render();
    rafId = requestAnimationFrame(loop);
  }

  function render() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    var mapDef = RV.Data.getMap(data.mapId) || RV.Data.MAPS[0];
    var charDef = RV.Data.getCharacter(data.characterId) || RV.Data.CHARACTERS[0];
    var sample = interpolate(state.playhead);

    var camMode = CAMERA_MODES[state.cameraIdx];
    var camX = sample.x, camZ = sample.z;
    if (camMode === 'cinematic') { camX += Math.sin(state.playhead * 0.4) * 1.8; camZ += Math.cos(state.playhead * 0.3) * 0.6; }
    RV.Camera.follow(camX, camZ);
    var project = function (x, z) { return RV.Camera.project(x, z); };

    RV.Maps.render(ctx, { width: w, height: h }, mapDef, RV.GameLoop.ARENA_RADIUS, project, false);

    var ghost = {
      x: sample.x, z: sample.z, facing: sample.facing, radius: 0.55,
      hp: sample.hp, maxHp: RV.Player.MAX_HP, character: charDef,
      dashTimer: 0, swipeTimer: 0, jumpTimer: 0, invulnTimer: 0, abilityCooldown: 1, abilityActiveTimer: 0,
      status: { shieldTimer: 0, speedTimer: 0, magnetTimer: 0, multiplierTimer: 0, multiplierValue: 1, slowedTimer: 0, secondChance: false }
    };
    RV.Player.draw(ctx, ghost, project, {});

    data.moments.forEach(function (m, idx) {
      if (Math.abs(m.t - state.playhead) < 0.12 && !state.fired[idx + '_' + Math.floor(state.playhead * 4)]) {
        state.fired[idx + '_' + Math.floor(state.playhead * 4)] = true;
        RV.Effects.floatText(m.x, m.z, m.label, m.color, { size: 16, life: 0.9 });
      }
    });
    RV.Effects.update(1 / 60);
    RV.Effects.drawWorldParticles(ctx, project);
    RV.Effects.drawScreenFloaters(ctx, project);

    document.getElementById('replayScore').textContent = RV.UI.fmt(sample.score);
    document.getElementById('replayTime').textContent = RV.UI.fmtTime(state.playhead * 1000) + ' / ' + RV.UI.fmtTime(state.duration * 1000);
  }

  RV.ReplayScreen = { build: build };
})(window.RV || (window.RV = {}));
