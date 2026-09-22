/* RUSHVERSE - UI/GameOverScreen.js
   End-of-run summary: animated count-up score, NEW HIGH SCORE celebration,
   and the coins/XP/combo/time-survived breakdown. */
(function (RV) {
  'use strict';

  var el;
  var lastResult = null;

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen gameover-screen';
    container.appendChild(el);
    return { el: el, onShow: onShow };
  }

  function onShow(result) {
    lastResult = result;
    el.innerHTML =
      '<div class="gameover-card">' +
        (result.isNewBest ? '<div class="new-record-badge">NEW HIGH SCORE!</div>' : '<div class="gameover-title">GAME OVER</div>') +
        '<div class="score-reveal" id="scoreReveal">0</div>' +
        '<div class="best-line">BEST ' + RV.UI.fmt(result.bestScore) + '</div>' +
        '<div class="result-grid">' +
          statBlock('COINS EARNED', '+' + RV.UI.fmt(result.coins), '#ffce45') +
          statBlock('XP EARNED', '+' + RV.UI.fmt(result.xp), '#7dff5a') +
          statBlock('BEST COMBO', 'x' + result.combo, '#ff7ad1') +
          statBlock('TIME SURVIVED', RV.UI.fmtTime(result.survivalMs), '#7ad9ff') +
        '</div>' +
        '<button class="menu-btn" id="playAgainBtn">PLAY AGAIN</button>' +
        '<div class="btn-row">' +
          '<button class="menu-btn secondary" id="goHomeBtn">HOME</button>' +
          '<button class="menu-btn secondary" id="goShopBtn">SHOP</button>' +
        '</div>' +
      '</div>';

    animateScore(result.score);
    if (result.isNewBest) RV.Effects && shakeConfetti();

    if (RV.Challenge.isActive()) {
      var challengeResult = RV.Challenge.resolve(result);
      setTimeout(function () { showChallengeResult(challengeResult); }, 900);
    }

    el.querySelector('#playAgainBtn').addEventListener('click', function () {
      RV.Audio.sfx.click();
      var s = RV.Save.get();
      RV.UI.show('game');
      var match = null;
      RV.HUD.startMatch(s.characters.equipped, s.maps.unlocked[0], {});
    });
    el.querySelector('#goHomeBtn').addEventListener('click', function () { RV.Audio.sfx.click(); RV.UI.show('home'); });
    el.querySelector('#goShopBtn').addEventListener('click', function () { RV.Audio.sfx.click(); RV.UI.show('shop'); });

    if (result.levelUps && result.levelUps.length) {
      setTimeout(function () { RV.LevelUpModal.show(result.levelUps); }, 1200);
    }
  }

  function showChallengeResult(cr) {
    RV.Audio.sfx[cr.won ? 'achievement' : 'warning']();
    var label = cr.type === 'score' ? 'points' : 'ms survived';
    var yourVal = cr.type === 'score' ? RV.UI.fmt(cr.playerValue) : RV.UI.fmtTime(cr.playerValue);
    var oppVal = cr.type === 'score' ? RV.UI.fmt(cr.opponentValue) : RV.UI.fmtTime(cr.opponentValue);
    var card = RV.UI.modal(
      '<div class="levelup-title" style="color:' + (cr.won ? '#7dff5a' : '#ff6a6a') + '">' + (cr.won ? 'CHALLENGE WON!' : 'CHALLENGE LOST') + '</div>' +
      '<div class="challenge-vs-row"><div class="challenge-side"><div class="challenge-name">YOU</div><div class="challenge-value">' + yourVal + '</div></div>' +
      '<div class="challenge-vs">VS</div>' +
      '<div class="challenge-side"><div class="challenge-name">' + cr.friendName + '</div><div class="challenge-value">' + oppVal + '</div></div></div>' +
      '<button class="menu-btn" id="challengeCloseBtn">OK</button>'
    );
    card.querySelector('#challengeCloseBtn').addEventListener('click', function () { RV.Audio.sfx.click(); RV.UI.closeModal(); });
  }

  function statBlock(label, value, color) {
    return '<div class="stat-block"><div class="stat-value" style="color:' + color + '">' + value + '</div><div class="stat-label">' + label + '</div></div>';
  }

  function animateScore(target) {
    var elNode = document.getElementById('scoreReveal');
    var start = performance.now();
    var dur = 1200;
    function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      elNode.textContent = RV.UI.fmt(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
      else elNode.textContent = RV.UI.fmt(target);
    }
    requestAnimationFrame(step);
  }

  function shakeConfetti() {
    var layer = document.getElementById('toastLayer');
    for (var i = 0; i < 24; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = (45 + Math.random() * 10) + '%';
      piece.style.background = ['#ffce45', '#ff7ad1', '#7ad9ff', '#7dff5a'][i % 4];
      piece.style.animationDelay = (Math.random() * 0.3) + 's';
      layer.appendChild(piece);
      setTimeout(function (p) { return function () { p.remove(); }; }(piece), 2200);
    }
  }

  RV.GameOverScreen = { build: build };
})(window.RV || (window.RV = {}));
