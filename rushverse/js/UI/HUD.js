/* RUSHVERSE - UI/HUD.js
   Builds the gameplay screen (canvas + touch controls + live HUD overlay),
   drives GameLoop start/stop, and reacts to its callbacks (hud tick, combo
   milestones, event banners, game over). */
(function (RV) {
  'use strict';

  var el, canvas, hudOverlay, controlsLayer;
  var paused = false;

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen game-screen';
    el.innerHTML =
      '<canvas id="gameCanvas"></canvas>' +
      '<div id="hudOverlay" class="hud-overlay">' +
        '<div class="hud-top">' +
          '<button id="pauseBtn" class="hud-pause">&#10073;&#10073;</button>' +
          '<div class="hud-hp" id="hudHp"></div>' +
          '<div class="hud-score-wrap"><div class="hud-score" id="hudScore">0</div><div class="hud-score-label">SCORE</div></div>' +
        '</div>' +
        '<div class="hud-combo" id="hudCombo"></div>' +
        '<div class="hud-banner" id="hudBanner"></div>' +
        '<div class="hud-status-icons" id="hudStatusIcons"></div>' +
      '</div>' +
      '<div id="controlsLayer" class="controls-layer"></div>' +
      '<div id="pauseMenu" class="pause-menu"></div>';
    container.appendChild(el);

    canvas = el.querySelector('#gameCanvas');
    hudOverlay = el.querySelector('#hudOverlay');
    controlsLayer = el.querySelector('#controlsLayer');

    RV.GameLoop.init(canvas);
    RV.Controls.build(controlsLayer);

    el.querySelector('#pauseBtn').addEventListener('click', togglePause);

    RV.GameLoop.on('hud', updateHud);
    RV.GameLoop.on('eventBanner', showBanner);
    RV.GameLoop.on('gameover', onGameOver);

    return { el: el };
  }

  function startMatch(characterId, mapId, skin, extra) {
    paused = false;
    el.querySelector('#pauseMenu').classList.remove('active');
    var opts = { characterId: characterId, mapId: mapId, skin: skin };
    if (extra) for (var k in extra) opts[k] = extra[k];
    RV.GameLoop.start(opts);
  }

  function togglePause() {
    paused = !paused;
    if (paused) { RV.GameLoop.pause(); renderPauseMenu(); }
    else { RV.GameLoop.resume(); el.querySelector('#pauseMenu').classList.remove('active'); }
    RV.Audio.sfx.click();
  }

  function renderPauseMenu() {
    var m = el.querySelector('#pauseMenu');
    m.classList.add('active');
    m.innerHTML =
      '<div class="pause-card">' +
        '<div class="pause-title">PAUSED</div>' +
        '<button class="menu-btn" id="resumeBtn">RESUME</button>' +
        '<button class="menu-btn secondary" id="photoModeBtn">PHOTO MODE</button>' +
        '<button class="menu-btn" id="restartBtn">RESTART</button>' +
        '<button class="menu-btn secondary" id="homeBtn">HOME</button>' +
      '</div>';
    m.querySelector('#resumeBtn').addEventListener('click', togglePause);
    m.querySelector('#photoModeBtn').addEventListener('click', function () {
      RV.Audio.sfx.click();
      RV.PhotoMode.enter(el);
    });
    m.querySelector('#restartBtn').addEventListener('click', function () {
      var match = RV.GameLoop.getMatch();
      togglePause();
      startMatch(match.character.id, match.map.id, match.skin, { bossMode: match.bossMode });
    });
    m.querySelector('#homeBtn').addEventListener('click', function () {
      RV.GameLoop.stop();
      RV.UI.show('home');
    });
  }

  function updateHud(state) {
    var hpEl = document.getElementById('hudHp');
    var pips = '';
    for (var i = 0; i < state.maxHp; i++) pips += '<span class="hp-pip ' + (i < state.hp ? 'full' : 'empty') + '"></span>';
    hpEl.innerHTML = pips;

    document.getElementById('hudScore').textContent = RV.UI.fmt(state.score);

    var comboEl = document.getElementById('hudCombo');
    if (state.combo >= 2) {
      comboEl.style.opacity = 1;
      comboEl.textContent = 'COMBO x' + state.combo;
    } else {
      comboEl.style.opacity = 0;
    }

    var icons = [];
    if (state.shieldActive) icons.push('<span class="status-icon" style="color:#7ad9ff">SHIELD</span>');
    if (state.speedActive) icons.push('<span class="status-icon" style="color:#7dff5a">SPEED</span>');
    if (state.magnetActive) icons.push('<span class="status-icon" style="color:#ff7ad1">MAGNET</span>');
    if (state.multiplierActive) icons.push('<span class="status-icon" style="color:#ffce45">x2 SCORE</span>');
    document.getElementById('hudStatusIcons').innerHTML = icons.join('');
  }

  function showBanner(text) {
    var banner = document.getElementById('hudBanner');
    banner.textContent = text;
    banner.classList.remove('show');
    void banner.offsetWidth;
    banner.classList.add('show');
  }

  function onGameOver(result) {
    RV.UI.show('gameover', result);
  }

  RV.HUD = { build: build, startMatch: startMatch };
})(window.RV || (window.RV = {}));
