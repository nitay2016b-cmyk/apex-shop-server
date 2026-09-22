/* RUSHVERSE - Audio/AudioManager.js
   Fully procedural audio (Web Audio API oscillators/noise) so the game needs
   zero binary asset files. Covers all SFX cues plus a generative ambient
   music bed per map. Respects Settings volumes at all times. */
(function (RV) {
  'use strict';

  var ctx = null;
  var musicGain, sfxGain, masterGain;
  var musicNodes = [];
  var musicTimer = null;
  var started = false;

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.connect(masterGain);
    sfxGain = ctx.createGain();
    sfxGain.connect(masterGain);
    applyVolumes();
    return ctx;
  }

  function applyVolumes() {
    if (!ctx) return;
    var s = RV.Save.get().settings;
    musicGain.gain.setTargetAtTime(s.musicVolume * 0.5, ctx.currentTime, 0.05);
    sfxGain.gain.setTargetAtTime(s.sfxVolume, ctx.currentTime, 0.05);
  }

  function resume() {
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    started = true;
  }

  function tone(freq, dur, opts) {
    if (!started) return;
    opts = opts || {};
    var t0 = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);
    var peak = opts.volume != null ? opts.volume : 0.22;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, dur * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, opts) {
    if (!started) return;
    opts = opts || {};
    var t0 = ctx.currentTime;
    var bufferSize = ctx.sampleRate * dur;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'lowpass';
    filter.frequency.value = opts.filterFreq || 2000;
    var gain = ctx.createGain();
    gain.gain.value = opts.volume != null ? opts.volume : 0.2;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    src.start(t0);
  }

  var SFX = {
    click: function () { tone(520, 0.06, { type: 'square', volume: 0.15 }); },
    buttonPress: function () { tone(340, 0.05, { type: 'square', volume: 0.14 }); },
    coin: function () { tone(880, 0.09, { type: 'triangle', slideTo: 1400, volume: 0.2 }); },
    gem: function () { tone(1200, 0.14, { type: 'sine', slideTo: 1800, volume: 0.22 }); tone(1600, 0.16, { type: 'sine', volume: 0.12 }); },
    dash: function () { tone(200, 0.14, { type: 'sawtooth', slideTo: 60, volume: 0.18 }); noiseBurst(0.12, { volume: 0.08, filterFreq: 3000 }); },
    jump: function () { tone(300, 0.12, { type: 'sine', slideTo: 520, volume: 0.16 }); },
    land: function () { tone(140, 0.08, { type: 'sine', slideTo: 80, volume: 0.12 }); },
    ability: function () { tone(220, 0.2, { type: 'sawtooth', slideTo: 660, volume: 0.2 }); noiseBurst(0.18, { volume: 0.1 }); },
    hit: function () { noiseBurst(0.15, { volume: 0.22, filterFreq: 900 }); tone(120, 0.15, { type: 'square', slideTo: 40, volume: 0.14 }); },
    enemyDefeat: function () { tone(500, 0.1, { type: 'square', slideTo: 900, volume: 0.16 }); noiseBurst(0.08, { volume: 0.1 }); },
    combo: function (n) { tone(600 + Math.min(n, 40) * 12, 0.09, { type: 'triangle', volume: 0.18 }); },
    powerup: function () { tone(700, 0.1, { type: 'sine', slideTo: 1100, volume: 0.2 }); tone(1000, 0.16, { type: 'sine', slideTo: 1400, volume: 0.12 }); },
    levelUp: function () {
      [0, 0.09, 0.18].forEach(function (t, i) {
        setTimeout(function () { tone(440 * Math.pow(1.26, i), 0.22, { type: 'triangle', volume: 0.22 }); }, t * 1000);
      });
    },
    chestOpen: function () {
      tone(200, 0.3, { type: 'sawtooth', slideTo: 900, volume: 0.16 });
      setTimeout(function () { tone(900, 0.4, { type: 'sine', slideTo: 1500, volume: 0.2 }); }, 250);
    },
    achievement: function () {
      [0, 0.1, 0.2].forEach(function (t, i) {
        setTimeout(function () { tone(520 * Math.pow(1.2, i), 0.18, { type: 'sine', volume: 0.2 }); }, t * 1000);
      });
    },
    gameOver: function () { tone(400, 0.5, { type: 'sawtooth', slideTo: 80, volume: 0.2 }); },
    highScore: function () {
      [0, 0.12, 0.24, 0.36].forEach(function (t, i) {
        setTimeout(function () { tone(500 * Math.pow(1.19, i), 0.2, { type: 'triangle', volume: 0.22 }); }, t * 1000);
      });
    },
    eventAlert: function () { tone(300, 0.18, { type: 'square', slideTo: 500, volume: 0.16 }); },
    shield: function () { tone(500, 0.2, { type: 'sine', volume: 0.15 }); },
    warning: function () { tone(220, 0.12, { type: 'square', volume: 0.14 }); }
  };

  var MUSIC_PROFILES = {
    neon: { base: 55, scale: [0, 3, 5, 7, 10], tempo: 0.42, wave: 'sawtooth', filter: 1400 },
    desert: { base: 49, scale: [0, 2, 4, 7, 9], tempo: 0.55, wave: 'triangle', filter: 900 },
    frozen: { base: 52, scale: [0, 2, 3, 7, 8], tempo: 0.6, wave: 'sine', filter: 1800 },
    sky: { base: 58, scale: [0, 4, 7, 9, 11], tempo: 0.48, wave: 'triangle', filter: 2000 },
    volcano: { base: 46, scale: [0, 1, 5, 6, 10], tempo: 0.38, wave: 'sawtooth', filter: 700 }
  };

  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    musicNodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
    musicNodes = [];
  }

  function playMusic(key, intensity) {
    if (!started) return;
    stopMusic();
    var profile = MUSIC_PROFILES[key] || MUSIC_PROFILES.neon;
    var step = 0;
    var filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = profile.filter;
    filterNode.connect(musicGain);

    function playStep() {
      var speedMul = 1 + (intensity ? intensity() : 0) * 0.6;
      var degree = profile.scale[step % profile.scale.length];
      var octave = (Math.floor(step / profile.scale.length) % 2) * 12;
      var freq = midiToFreq(profile.base + degree + octave);
      var t0 = ctx.currentTime;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = profile.wave;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + profile.tempo * 0.9);
      osc.connect(g);
      g.connect(filterNode);
      osc.start(t0);
      osc.stop(t0 + profile.tempo);
      if (step % 4 === 0) {
        var bassOsc = ctx.createOscillator();
        var bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.value = midiToFreq(profile.base - 12);
        bassGain.gain.setValueAtTime(0.0001, t0);
        bassGain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, t0 + profile.tempo * 3.6);
        bassOsc.connect(bassGain);
        bassGain.connect(filterNode);
        bassOsc.start(t0);
        bassOsc.stop(t0 + profile.tempo * 3.6);
      }
      step++;
      var nextDelay = (profile.tempo / speedMul) * 1000;
      musicTimer = setTimeout(playStep, nextDelay);
    }
    playStep();
  }

  RV.Audio = {
    resume: resume,
    applyVolumes: applyVolumes,
    isStarted: function () { return started; },
    sfx: SFX,
    playMusic: playMusic,
    stopMusic: stopMusic
  };
})(window.RV || (window.RV = {}));
