/* RUSHVERSE - UI/CollectionScreen.js
   COLLECTION button: Achievements progress, Chest inventory (opens with
   earned keys, fun reveal animation), and lifetime stats. */
(function (RV) {
  'use strict';

  var el;
  var TABS = ['Achievements', 'Chests', 'Stats'];
  var activeTab = 'Achievements';

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen collection-screen';
    el.innerHTML =
      '<div class="screen-title">COLLECTION</div>' +
      '<div class="tab-row" id="collTabs"></div>' +
      '<div class="collection-body" id="collBody"></div>';
    container.appendChild(el);

    el.querySelector('#collTabs').innerHTML = TABS.map(function (t) {
      return '<button class="tab-btn" data-tab="' + t + '">' + t + '</button>';
    }).join('');
    el.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { RV.Audio.sfx.click(); activeTab = btn.dataset.tab; render(); });
    });

    return { el: el, onShow: render };
  }

  function render() {
    el.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === activeTab); });
    var body = el.querySelector('#collBody');
    if (activeTab === 'Achievements') body.innerHTML = renderAchievements();
    else if (activeTab === 'Chests') { body.innerHTML = renderChests(); bindChestButtons(); }
    else body.innerHTML = renderStats();
    if (activeTab === 'Achievements') bindAchievementButtons();
  }

  function renderAchievements() {
    var list = RV.Progress.getAchievements();
    return '<div class="list-col">' + list.map(function (a) {
      var pct = Math.min(100, Math.round(a.progress / a.target * 100));
      var btn = a.claimed ? '<span class="claimed-tag">CLAIMED</span>'
        : a.complete ? '<button class="item-btn buy-btn claim-btn" data-id="' + a.id + '">CLAIM</button>'
        : '';
      return '<div class="mission-row">' +
        '<div class="mission-info"><div class="mission-name">' + a.name + '</div><div class="mission-desc">' + a.desc + '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="progress-label">' + RV.UI.fmt(a.progress) + ' / ' + RV.UI.fmt(a.target) + '</div></div>' +
        '<div class="mission-reward">' + rewardText(a.reward) + btn + '</div></div>';
    }).join('') + '</div>';
  }
  function bindAchievementButtons() {
    el.querySelectorAll('.claim-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reward = RV.Progress.claimAchievement(btn.dataset.id);
        if (reward) { RV.Audio.sfx.achievement(); RV.UI.toast('Achievement claimed!', '#ffce45'); render(); }
      });
    });
  }

  function renderChests() {
    var s = RV.Save.get();
    var rarities = ['common', 'rare', 'epic', 'legendary'];
    return '<div class="chest-grid">' + rarities.map(function (r) {
      var count = s.chests[r] || 0, keys = s.keys[r] || 0;
      return '<div class="chest-card rarity-border-' + (r === 'common' ? 'common' : r === 'rare' ? 'rare' : r) + '">' +
        '<div class="chest-icon" style="color:' + RV.UI.rarityColor(r === 'common' ? 'common' : r) + '">&#128230;</div>' +
        '<div class="item-name">' + r.toUpperCase() + ' CHEST</div>' +
        '<div class="item-desc">Owned: ' + count + ' &nbsp;·&nbsp; Keys: ' + keys + '</div>' +
        '<button class="item-btn buy-btn open-chest-btn" data-r="' + r + '" ' + (keys > 0 ? '' : 'disabled') + '>OPEN</button>' +
        '</div>';
    }).join('') + '</div>';
  }
  function bindChestButtons() {
    el.querySelectorAll('.open-chest-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var result = RV.Progress.openChest(btn.dataset.r);
        if (!result) { RV.UI.toast('No keys for this chest', '#ff6a6a'); return; }
        showChestOpenAnimation(btn.dataset.r, result);
      });
    });
  }

  function showChestOpenAnimation(rarity, result) {
    RV.Audio.sfx.chestOpen();
    var lines = ['+' + result.coins + ' Coins'];
    if (result.gems) lines.push('+' + result.gems + ' Gems');
    if (result.skin) lines.push('New skin: ' + result.skin.name);
    var card = RV.UI.modal(
      '<div class="chest-open-icon">&#128230;</div>' +
      '<div class="levelup-title">' + rarity.toUpperCase() + ' CHEST</div>' +
      '<div class="chest-rewards">' + lines.map(function (l) { return '<div class="chest-reward-line">' + l + '</div>'; }).join('') + '</div>' +
      '<button class="menu-btn" id="chestCloseBtn">NICE!</button>'
    );
    card.querySelector('#chestCloseBtn').addEventListener('click', function () { RV.Audio.sfx.click(); RV.UI.closeModal(); render(); });
  }

  function renderStats() {
    var s = RV.Save.get();
    var rows = [
      ['Best Score', RV.UI.fmt(s.bestScore)],
      ['Lifetime Coins', RV.UI.fmt(s.lifetimeCoins)],
      ['Games Played', RV.UI.fmt(s.gamesPlayed)],
      ['Best Combo', 'x' + s.bestCombo],
      ['Best Survival', RV.UI.fmtTime(s.bestSurvivalMs)],
      ['Total Play Time', RV.UI.fmtTime(s.totalSurvivalMs)],
      ['Damageless Wins', RV.UI.fmt(s.damagelessWins)],
      ['Ability Uses', RV.UI.fmt(s.abilityUses)],
      ['Player Code', s.playerCode]
    ];
    return '<div class="stats-grid">' + rows.map(function (r) {
      return '<div class="stat-row"><span>' + r[0] + '</span><span class="stat-row-val">' + r[1] + '</span></div>';
    }).join('') + '</div>';
  }

  function rewardText(reward) {
    var parts = [];
    if (reward.coins) parts.push('+' + reward.coins + 'c');
    if (reward.gems) parts.push('+' + reward.gems + 'g');
    if (reward.chest) parts.push(reward.chest + ' chest');
    return '<div class="reward-chip">' + parts.join(' ') + '</div>';
  }

  RV.CollectionScreen = { build: build };
})(window.RV || (window.RV = {}));
