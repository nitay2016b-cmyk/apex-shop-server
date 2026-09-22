/* RUSHVERSE - main.js
   Boot sequence: build every screen, wire the bottom nav, load save data,
   and show the home screen. Kept deliberately thin — all real logic lives
   in the feature modules under /js. */
(function (RV) {
  'use strict';

  var NAV_ITEMS = [
    { id: 'shop', label: 'SHOP', icon: '&#128722;' },
    { id: 'collection', label: 'COLLECTION', icon: '&#127942;' },
    { id: 'home', label: 'HOME', icon: '&#9733;', isHome: true },
    { id: 'missions', label: 'MISSIONS', icon: '&#128203;' },
    { id: 'leaderboard', label: 'RANKS', icon: '&#128200;' }
  ];

  function buildBottomNav() {
    var nav = document.getElementById('bottomNav');
    nav.innerHTML = NAV_ITEMS.map(function (item) {
      return '<button class="nav-btn ' + (item.isHome ? 'nav-home' : '') + '" data-screen="' + item.id + '">' +
        '<span class="nav-icon">' + item.icon + '</span><span class="nav-label">' + item.label + '</span></button>';
    }).join('') + '<button class="nav-btn" data-screen="settings"><span class="nav-icon">&#9881;</span><span class="nav-label">SETTINGS</span></button>';

    nav.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Audio.resume(); RV.Audio.sfx.click();
        RV.UI.show(btn.dataset.screen);
        updateNavActive(btn.dataset.screen);
      });
    });
  }

  function updateNavActive(screen) {
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.screen === screen);
    });
  }

  function boot() {
    RV.Save.get(); // ensure loaded

    var stage = document.getElementById('stage');
    RV.UI.registerScreen('home', RV.HomeScreen.build(stage));
    RV.UI.registerScreen('game', RV.HUD.build(stage));
    RV.UI.registerScreen('gameover', RV.GameOverScreen.build(stage));
    RV.UI.registerScreen('tutorial', RV.TutorialScreen.build(stage));
    RV.UI.registerScreen('shop', RV.ShopScreen.build(stage));
    RV.UI.registerScreen('collection', RV.CollectionScreen.build(stage));
    RV.UI.registerScreen('missions', RV.MissionsScreen.build(stage));
    RV.UI.registerScreen('leaderboard', RV.LeaderboardScreen.build(stage));
    RV.UI.registerScreen('settings', RV.SettingsScreen.build(stage));

    RV.UI.init(document.getElementById('app'));
    buildBottomNav();
    updateNavActive('home');
    RV.UI.show('home');

    RV.Progress.on('achievementComplete', function (a) {
      RV.UI.toast('Achievement unlocked: ' + a.name, '#ffce45');
    });
    RV.Progress.on('characterUnlocked', function (c) {
      if (c) RV.UI.toast('Character unlocked: ' + c.name, c.color);
    });
    RV.Progress.on('mapUnlocked', function (m) {
      if (m) RV.UI.toast('Map unlocked: ' + m.name, '#7ad9ff');
    });

    setTimeout(function () { RV.DailyReward.checkAndMaybeShow(); }, 500);

    document.getElementById('bootLoader').classList.add('hidden');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.RV || (window.RV = {}));
