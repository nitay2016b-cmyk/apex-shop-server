/* RUSHVERSE - Player/Controls.js
   Touch-first input: virtual joystick, Dash/Jump/Ability buttons, and a
   swipe-to-dodge gesture layer. Falls back to WASD+Space+Shift+E on desktop
   for testing. Builds its own DOM inside #controlsLayer. */
(function (RV) {
  'use strict';

  var state = {
    moveX: 0, moveY: 0,
    dashPressed: false, jumpPressed: false, abilityPressed: false,
    swipe: null // {dx,dz} set for one frame when a dodge swipe completes
  };

  var els = {};
  var joystick = { active: false, pointerId: null, baseX: 0, baseY: 0, knobMax: 46 };
  var swipeTrack = { active: false, pointerId: null, x: 0, y: 0, t: 0 };

  function vibrate(ms) {
    var s = RV.Save.get().settings;
    if (s.vibration && navigator.vibrate) navigator.vibrate(ms);
  }

  function unlockAudio() {
    RV.Audio.resume();
  }

  function build(container) {
    container.innerHTML =
      '<div id="joyBase" class="joy-base">' +
        '<div id="joyKnob" class="joy-knob"></div>' +
      '</div>' +
      '<div id="swipeZone" class="swipe-zone"></div>' +
      '<div class="action-cluster">' +
        '<button id="btnAbility" class="action-btn ability-btn" aria-label="Ability">' +
          '<span class="btn-icon">&#9889;</span><span class="btn-cd" id="abilityCd"></span>' +
        '</button>' +
        '<button id="btnJump" class="action-btn jump-btn" aria-label="Jump"><span class="btn-icon">&#8593;</span></button>' +
        '<button id="btnDash" class="action-btn dash-btn" aria-label="Dash"><span class="btn-icon">&#187;</span></button>' +
      '</div>';

    els.joyBase = container.querySelector('#joyBase');
    els.joyKnob = container.querySelector('#joyKnob');
    els.swipeZone = container.querySelector('#swipeZone');
    els.btnAbility = container.querySelector('#btnAbility');
    els.btnJump = container.querySelector('#btnJump');
    els.btnDash = container.querySelector('#btnDash');
    els.abilityCd = container.querySelector('#abilityCd');

    applySide();
    bindJoystick();
    bindButton(els.btnDash, function () { state.dashPressed = true; });
    bindButton(els.btnJump, function () { state.jumpPressed = true; });
    bindButton(els.btnAbility, function () { state.abilityPressed = true; });
    bindSwipe();
    bindKeyboard();
  }

  function applySide() {
    var side = RV.Save.get().settings.joystickSide || 'left';
    els.joyBase.classList.toggle('right-side', side === 'right');
    document.querySelector('.action-cluster').classList.toggle('left-side', side === 'right');
  }

  function bindJoystick() {
    var base = els.joyBase, knob = els.joyKnob;
    function start(e) {
      unlockAudio();
      var t = e.changedTouches ? e.changedTouches[0] : e;
      joystick.active = true;
      joystick.pointerId = t.identifier != null ? t.identifier : 'mouse';
      var rect = base.getBoundingClientRect();
      joystick.baseX = rect.left + rect.width / 2;
      joystick.baseY = rect.top + rect.height / 2;
      move(t);
      e.preventDefault();
    }
    function move(t) {
      var dx = t.clientX - joystick.baseX;
      var dy = t.clientY - joystick.baseY;
      var dist = Math.min(joystick.knobMax, Math.hypot(dx, dy));
      var ang = Math.atan2(dy, dx);
      var kx = Math.cos(ang) * dist, ky = Math.sin(ang) * dist;
      knob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
      var norm = dist / joystick.knobMax;
      state.moveX = Math.cos(ang) * norm;
      state.moveY = Math.sin(ang) * norm;
    }
    function findTouch(e) {
      if (!e.changedTouches) return e;
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joystick.pointerId) return e.changedTouches[i];
      }
      return null;
    }
    function moveHandler(e) {
      if (!joystick.active) return;
      var t = findTouch(e);
      if (!t) return;
      move(t);
      e.preventDefault();
    }
    function end(e) {
      if (!joystick.active) return;
      var t = findTouch(e);
      if (e.changedTouches && !t) return;
      joystick.active = false;
      state.moveX = 0; state.moveY = 0;
      knob.style.transform = 'translate(0,0)';
    }
    base.addEventListener('touchstart', start, { passive: false });
    base.addEventListener('mousedown', start);
    window.addEventListener('touchmove', moveHandler, { passive: false });
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    window.addEventListener('mouseup', end);
  }

  function bindButton(btn, fn) {
    function press(e) {
      unlockAudio();
      btn.classList.add('pressed');
      RV.Audio.sfx.buttonPress();
      vibrate(12);
      fn();
      e.preventDefault();
    }
    function release() { btn.classList.remove('pressed'); }
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('touchend', release);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  }

  function bindSwipe() {
    var zone = els.swipeZone;
    function start(e) {
      var t = e.changedTouches ? e.changedTouches[0] : e;
      swipeTrack.active = true;
      swipeTrack.pointerId = t.identifier != null ? t.identifier : 'mouse';
      swipeTrack.x = t.clientX; swipeTrack.y = t.clientY; swipeTrack.t = performance.now();
    }
    function end(e) {
      if (!swipeTrack.active) return;
      var t = e.changedTouches ? e.changedTouches[0] : e;
      swipeTrack.active = false;
      var dx = t.clientX - swipeTrack.x;
      var dy = t.clientY - swipeTrack.y;
      var dt = performance.now() - swipeTrack.t;
      var dist = Math.hypot(dx, dy);
      if (dist > 40 && dt < 400) {
        state.swipe = { dx: dx / dist, dz: dy / dist };
      }
    }
    zone.addEventListener('touchstart', start, { passive: true });
    zone.addEventListener('mousedown', start);
    zone.addEventListener('touchend', end);
    zone.addEventListener('mouseup', end);
  }

  var keys = {};
  function bindKeyboard() {
    window.addEventListener('keydown', function (e) {
      unlockAudio();
      keys[e.code] = true;
      if (e.code === 'Space') state.jumpPressed = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') state.dashPressed = true;
      if (e.code === 'KeyE') state.abilityPressed = true;
    });
    window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  }

  function pollKeyboardMove() {
    var mx = 0, mz = 0;
    if (keys.KeyA || keys.ArrowLeft) mx -= 1;
    if (keys.KeyD || keys.ArrowRight) mx += 1;
    if (keys.KeyW || keys.ArrowUp) mz -= 1;
    if (keys.KeyS || keys.ArrowDown) mz += 1;
    if (mx || mz) {
      var len = Math.hypot(mx, mz);
      state.moveX = mx / len; state.moveY = mz / len;
    }
  }

  function setAbilityCooldownDisplay(pct) {
    if (!els.abilityCd) return;
    els.abilityCd.style.height = Math.round((1 - pct) * 100) + '%';
  }

  function consumeFrame() {
    pollKeyboardMove();
    var out = {
      moveX: state.moveX, moveY: state.moveY,
      dash: state.dashPressed, jump: state.jumpPressed, ability: state.abilityPressed,
      swipe: state.swipe
    };
    state.dashPressed = false; state.jumpPressed = false; state.abilityPressed = false;
    state.swipe = null;
    if (!joystick.active) { state.moveX = 0; state.moveY = 0; }
    return out;
  }

  RV.Controls = {
    build: build,
    applySide: applySide,
    consumeFrame: consumeFrame,
    setAbilityCooldownDisplay: setAbilityCooldownDisplay,
    vibrate: vibrate
  };
})(window.RV || (window.RV = {}));
