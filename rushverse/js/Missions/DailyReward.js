/* RUSHVERSE - Missions/DailyReward.js
   7-day login streak. Checked once on boot; shows a modal if today's
   reward hasn't been claimed yet. Missing a day resets the streak to 1
   (still lets them claim), it never blocks play. */
(function (RV) {
  'use strict';

  var DAY_MS = 86400000;

  function checkAndMaybeShow() {
    var s = RV.Save.get();
    var today = Math.floor(Date.now() / DAY_MS);
    var lastDay = Math.floor((s.dailyReward.lastClaim || 0) / DAY_MS);
    if (lastDay === today) return; // already claimed today

    var streak = s.dailyReward.streak || 0;
    var isConsecutive = lastDay === today - 1;
    var newStreak = isConsecutive ? streak + 1 : 1;
    if (newStreak > 7) newStreak = 1;
    RV.Progress.addNotification('DAILY REWARD READY', 'event');
    show(newStreak);
  }

  function show(dayNumber) {
    var def = RV.Data.DAILY_REWARDS[dayNumber - 1];
    var label = rewardLabel(def);
    var row = RV.Data.DAILY_REWARDS.map(function (d) {
      var cls = d.day === dayNumber ? 'daily-cell active' : d.day < dayNumber ? 'daily-cell done' : 'daily-cell';
      return '<div class="' + cls + '"><div class="daily-day">DAY ' + d.day + '</div><div class="daily-icon">' + dailyIcon(d) + '</div></div>';
    }).join('');

    var currentStreak = RV.Save.get().dailyReward.streak || 0;
    var card = RV.UI.modal(
      '<div class="levelup-title">DAILY REWARD</div>' +
      (currentStreak > 0 ? '<div class="profile-streak" style="margin-bottom:10px">&#128293; ' + currentStreak + ' DAY STREAK</div>' : '') +
      '<div class="daily-strip">' + row + '</div>' +
      '<div class="daily-claim-label">' + label + '</div>' +
      '<button class="menu-btn" id="dailyClaimBtn">CLAIM</button>',
      { dismissible: false }
    );
    card.querySelector('#dailyClaimBtn').addEventListener('click', function () {
      RV.Audio.resume(); RV.Audio.sfx.achievement();
      claim(dayNumber, def);
      RV.UI.closeModal();
    });
  }

  function dailyIcon(d) {
    if (d.type === 'coins') return '&#9679;';
    if (d.type === 'gems') return '&#9670;';
    if (d.type === 'chest') return '&#128230;';
    if (d.type === 'skin') return '&#9733;';
    return '?';
  }

  function rewardLabel(def) {
    if (def.type === 'coins') return '+' + def.amount + ' Coins';
    if (def.type === 'gems') return '+' + def.amount + ' Gems';
    if (def.type === 'chest') return 'A ' + def.amount + ' chest + key';
    if (def.type === 'skin') return 'A free skin';
    if (def.type === 'random') return 'A mystery reward';
    return '';
  }

  function claim(dayNumber, def) {
    var s = RV.Save.get();
    s.dailyReward.streak = dayNumber;
    s.dailyReward.lastClaim = Date.now();
    RV.Save.save();

    if (def.type === 'coins') RV.Progress.addCoins(def.amount);
    else if (def.type === 'gems') RV.Progress.addGems(def.amount);
    else if (def.type === 'chest') { RV.Progress.addChest(def.amount, 1); RV.Progress.addKey(def.amount, 1); }
    else if (def.type === 'skin') RV.Progress.grantRandomSkin();
    else if (def.type === 'random') {
      var roll = Math.random();
      if (roll < 0.5) RV.Progress.addCoins(120);
      else if (roll < 0.85) RV.Progress.addGems(8);
      else RV.Progress.grantRandomSkin();
    }
    RV.UI.renderHeader();
  }

  RV.DailyReward = { checkAndMaybeShow: checkAndMaybeShow };
})(window.RV || (window.RV = {}));
