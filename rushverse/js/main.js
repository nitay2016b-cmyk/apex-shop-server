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

  var BOOT_TIPS = [
    'Perfect Dodges increase your Combo.',
    'Jump clears low ground hazards — Dash gets you past walls and enemies.',
    'A well-timed swipe dodges just as well as tapping DASH.',
    'Combo multiplies every point you earn — keep it alive.',
    'Each character\'s ability is free to use once its cooldown ring fills.',
    'Chests need matching keys from missions and achievements to open.',
    'The Battle Pass Free track is fully playable without spending gems.',
    'Boss weak points glow gold — dash through then for bonus damage.',
    'Daily Challenges reset every 24 hours, so check in often.',
    'Your Season Pass level rises from XP earned in any match.'
  ];
  function showBootTip() {
    var el = document.getElementById('bootTip');
    if (el) el.innerHTML = 'TIP: <b>' + BOOT_TIPS[Math.floor(Math.random() * BOOT_TIPS.length)] + '</b>';
  }

  function boot() {
    showBootTip();
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
    RV.UI.registerScreen('battlepass', RV.BattlePassScreen.build(stage));
    RV.UI.registerScreen('events', RV.EventsScreen.build(stage));
    RV.UI.registerScreen('boss', RV.BossScreen.build(stage));
    RV.UI.registerScreen('profile', RV.ProfileScreen.build(stage));
    RV.UI.registerScreen('party', RV.PartyScreen.build(stage));
    RV.UI.registerScreen('replay', RV.ReplayScreen.build(stage));

    RV.UI.init(document.getElementById('app'));
    RV.UI.applyAccessibility();
    buildBottomNav();
    updateNavActive('home');
    RV.UI.show('home');

    RV.Progress.on('achievementComplete', function (a) {
      RV.UI.toast('Achievement unlocked: ' + a.name, '#ffce45');
      RV.Progress.addNotification('Achievement unlocked: ' + a.name, 'success');
    });
    RV.Progress.on('characterUnlocked', function (c) {
      if (c) { RV.UI.toast('Character unlocked: ' + c.name, c.color); RV.Progress.addNotification('New character unlocked: ' + c.name, 'success'); }
    });
    RV.Progress.on('mapUnlocked', function (m) {
      if (m) { RV.UI.toast('Map unlocked: ' + m.name, '#7ad9ff'); RV.Progress.addNotification('New map unlocked: ' + m.name, 'success'); }
    });
    RV.Progress.on('itemDiscovered', function (d) {
      RV.UI.toast('NEW ITEM DISCOVERED!\n' + d.label, '#ffce45');
    });
    RV.Progress.on('titleUnlocked', function (t) {
      RV.UI.toast('Title unlocked: ' + t.name, '#c79bff');
      RV.Progress.addNotification('Title unlocked: ' + t.name, 'success');
    });
    RV.Progress.on('badgeUnlocked', function (b) {
      RV.Progress.addNotification('Badge earned: ' + b.name, 'success');
    });
    RV.Progress.on('missionComplete', function (info) {
      RV.Progress.addNotification('Mission complete: ' + info.def.desc.replace('{t}', info.def.target.toLocaleString()), 'info');
    });
    RV.Progress.on('metaEventStarted', function (def) {
      RV.Progress.addNotification('NEW EVENT AVAILABLE: ' + def.label, 'event');
    });
    RV.Progress.on('levelup', function (data) {
      RV.Progress.addNotification('LEVEL UP! You reached Level ' + data.level, 'success');
    });
    RV.Progress.on('questComplete', function (q) {
      RV.Progress.addNotification('Quest complete: ' + q.name, 'success');
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
