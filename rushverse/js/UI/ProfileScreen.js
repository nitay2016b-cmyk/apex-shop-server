/* RUSHVERSE - UI/ProfileScreen.js
   Player identity hub: name/level/best score/runs/coins/achievements,
   favorite character + equipped skin, an Avatar picker, equippable Titles,
   and the daily login Streak. */
(function (RV) {
  'use strict';

  var el;
  var activeTab = 'overview';

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen profile-screen';
    container.appendChild(el);
    return { el: el, onShow: render };
  }

  function favoriteCharacter(s) {
    return RV.Data.getCharacter(s.characters.equipped) || RV.Data.CHARACTERS[0];
  }

  function render() {
    var s = RV.Save.get();
    var prog = RV.Progress.xpProgress();
    var fav = favoriteCharacter(s);
    var equippedOutfit = RV.Data.getShopItem(s.skins.equipped.outfit);
    var achievements = RV.Progress.getAchievements();
    var achievedCount = achievements.filter(function (a) { return a.complete; }).length;
    var avatar = RV.Data.getAvatar(s.avatar) || RV.Data.AVATARS[0];
    var title = RV.Data.getTitle(s.titles.equipped);

    el.innerHTML =
      '<div class="screen-title">PROFILE</div>' +
      '<div class="profile-hero">' +
        '<div class="profile-avatar-big" id="profileAvatarBtn">' + avatar.icon + '</div>' +
        '<div class="profile-name">' + s.playerName + '</div>' +
        '<div class="profile-title-tag">' + (title ? title.name : '') + '</div>' +
        '<div class="profile-streak">&#128293; ' + s.dailyReward.streak + ' DAY STREAK</div>' +
      '</div>' +
      '<div class="tab-row" id="profileTabs">' +
        '<button class="tab-btn" data-tab="overview">Overview</button>' +
        '<button class="tab-btn" data-tab="avatars">Avatars</button>' +
        '<button class="tab-btn" data-tab="titles">Titles</button>' +
      '</div>' +
      '<div id="profileBody"></div>';

    el.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { RV.Audio.sfx.click(); activeTab = btn.dataset.tab; render(); });
    });
    el.querySelector('#profileAvatarBtn').addEventListener('click', function () { RV.Audio.sfx.click(); activeTab = 'avatars'; render(); });

    var body = el.querySelector('#profileBody');
    el.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === activeTab); });

    if (activeTab === 'avatars') { body.innerHTML = renderAvatars(s); bindAvatars(); return; }
    if (activeTab === 'titles') { body.innerHTML = renderTitles(); bindTitles(); return; }

    body.innerHTML =
      '<div class="stats-grid">' +
        statRow('Level', prog.level) +
        statRow('Best Score', RV.UI.fmt(s.bestScore)) +
        statRow('Total Runs', RV.UI.fmt(s.gamesPlayed)) +
        statRow('Total Coins Earned', RV.UI.fmt(s.lifetimeCoins)) +
        statRow('Achievements', achievedCount + ' / ' + achievements.length) +
        statRow('Favorite Character', fav.name) +
        statRow('Current Skin', equippedOutfit ? equippedOutfit.name : 'Recruit') +
        statRow('Player Code', s.playerCode) +
      '</div>';
  }

  function statRow(label, value) {
    return '<div class="stat-row"><span>' + label + '</span><span class="stat-row-val">' + value + '</span></div>';
  }

  function renderAvatars(s) {
    return '<div class="item-grid">' + RV.Data.AVATARS.map(function (a) {
      var unlocked = a.unlock.type === 'default' || s.level >= a.unlock.value;
      var equipped = s.avatar === a.id;
      return '<div class="item-card ' + (unlocked ? '' : 'book-locked') + '">' +
        '<div class="item-preview avatar-preview">' + (unlocked ? a.icon : '?') + '</div>' +
        '<div class="item-desc">' + (unlocked ? '' : 'Level ' + a.unlock.value) + '</div>' +
        (unlocked ? '<button class="item-btn ' + (equipped ? 'owned-btn' : 'buy-btn') + ' avatar-equip-btn" data-id="' + a.id + '">' + (equipped ? 'EQUIPPED' : 'EQUIP') + '</button>' : '') +
        '</div>';
    }).join('') + '</div>';
  }
  function bindAvatars() {
    el.querySelectorAll('.avatar-equip-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var s = RV.Save.get();
        s.avatar = btn.dataset.id;
        RV.Save.save();
        RV.Audio.sfx.click();
        render();
      });
    });
  }

  function renderTitles() {
    var titles = RV.Progress.getTitles();
    return '<div class="list-col">' + titles.map(function (t) {
      if (!t.owned) return '<div class="mission-row"><div class="mission-info"><div class="mission-name">???</div><div class="mission-desc">Locked</div></div></div>';
      return '<div class="mission-row"><div class="mission-info"><div class="mission-name">' + t.name + '</div></div>' +
        '<button class="item-btn ' + (t.equipped ? 'owned-btn' : 'buy-btn') + ' title-equip-btn" data-id="' + t.id + '">' + (t.equipped ? 'EQUIPPED' : 'EQUIP') + '</button></div>';
    }).join('') + '</div>';
  }
  function bindTitles() {
    el.querySelectorAll('.title-equip-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Progress.equipTitle(btn.dataset.id);
        RV.Audio.sfx.click();
        render();
      });
    });
  }

  RV.ProfileScreen = { build: build };
})(window.RV || (window.RV = {}));
