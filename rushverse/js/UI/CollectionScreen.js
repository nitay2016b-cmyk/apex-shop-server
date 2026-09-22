/* RUSHVERSE - UI/CollectionScreen.js
   The Collection Book: every cosmetic/character/ability/badge category the
   game tracks, with locked entries shown dark with a "?" (an
   'itemDiscovered' toast fires elsewhere the moment one unlocks) — plus the
   original Achievements, Chest inventory and lifetime Stats panel. */
(function (RV) {
  'use strict';

  var el;
  var BOOK_TABS = [
    { id: 'Characters', cat: 'character' },
    { id: 'Skins', cat: 'outfit' },
    { id: 'Trails', cat: 'trail' },
    { id: 'Effects', cat: 'effect' },
    { id: 'Emotes', cat: 'emote' },
    { id: 'Abilities', cat: 'ability' },
    { id: 'Badges', cat: 'badge' }
  ];
  var TABS = BOOK_TABS.map(function (t) { return t.id; }).concat(['Achievements', 'Chests', 'Stats']);
  var activeTab = 'Characters';

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen collection-screen';
    el.innerHTML =
      '<div class="screen-title">COLLECTION BOOK</div>' +
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
    var bookTab = BOOK_TABS.filter(function (t) { return t.id === activeTab; })[0];
    if (bookTab) { body.innerHTML = renderBook(bookTab.cat); return; }
    if (activeTab === 'Achievements') { body.innerHTML = renderAchievements(); bindAchievementButtons(); }
    else if (activeTab === 'Chests') { body.innerHTML = renderChests(); bindChestButtons(); }
    else body.innerHTML = renderStats();
  }

  function lockedCard(rarityClass) {
    return '<div class="item-card book-locked ' + (rarityClass || '') + '">' +
      '<div class="item-preview book-locked-preview">?</div>' +
      '<div class="item-name">???</div>' +
      '<div class="item-desc">Locked</div></div>';
  }

  function renderBook(cat) {
    var s = RV.Save.get();
    var cards;
    if (cat === 'character') {
      cards = RV.Data.CHARACTERS.map(function (c) {
        var owned = s.characters.owned.indexOf(c.id) !== -1;
        if (!owned) return lockedCard('rarity-border-' + c.rarity);
        return '<div class="item-card rarity-border-' + c.rarity + '">' +
          '<div class="item-preview" style="background:radial-gradient(circle at 35% 30%,' + c.accent + ',' + c.color + ')"></div>' +
          '<div class="item-name">' + c.name + '</div><div class="item-rarity rarity-' + c.rarity + '">' + c.rarity.toUpperCase() + '</div></div>';
      });
    } else if (cat === 'ability') {
      cards = RV.Data.CHARACTERS.map(function (c) {
        var owned = s.characters.owned.indexOf(c.id) !== -1;
        if (!owned) return lockedCard();
        return '<div class="item-card">' +
          '<div class="item-preview" style="background:linear-gradient(160deg,' + c.color + ',#0a0e16)"></div>' +
          '<div class="item-name">' + c.ability.name + '</div><div class="item-desc">' + c.ability.desc + '</div></div>';
      });
    } else if (cat === 'badge') {
      cards = RV.Progress.getBadges().map(function (b) {
        if (!b.owned) return lockedCard() ;
        return '<div class="item-card rarity-border-legendary">' +
          '<div class="item-preview book-badge-preview">&#127894;</div>' +
          '<div class="item-name">' + b.name + '</div><div class="item-desc">Unlocked</div></div>';
      });
    } else {
      cards = RV.Data.SHOP_ITEMS.filter(function (it) { return it.cat === cat; }).map(function (it) {
        var owned = s.skins.owned.indexOf(it.id) !== -1;
        if (!owned) return lockedCard('rarity-border-' + it.rarity);
        return '<div class="item-card rarity-border-' + it.rarity + '">' +
          '<div class="item-preview" style="background:linear-gradient(160deg,' + it.color + ',#0a0e16)"></div>' +
          '<div class="item-name">' + it.name + '</div><div class="item-rarity rarity-' + it.rarity + '">' + it.rarity.toUpperCase() + '</div></div>';
      });
    }
    return '<div class="item-grid">' + cards.join('') + '</div>';
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
      ['Total Runs', RV.UI.fmt(s.gamesPlayed)],
      ['Best Score', RV.UI.fmt(s.bestScore)],
      ['Total Distance', RV.UI.fmt(Math.round(s.totalDistance)) + ' m'],
      ['Lifetime Coins', RV.UI.fmt(s.lifetimeCoins)],
      ['Enemies Defeated', RV.UI.fmt(s.enemiesDefeatedTotal)],
      ['Bosses Defeated', RV.UI.fmt(s.bossesDefeated)],
      ['Best Combo', 'x' + s.bestCombo],
      ['Best Chain', 'x' + s.bestChain],
      ['Best Multi Collect', 'x' + s.bestMultiCollect],
      ['Perfect Dodges', RV.UI.fmt(s.perfectDodges)],
      ['Near Misses', RV.UI.fmt(s.nearMisses)],
      ['Best Survival', RV.UI.fmtTime(s.bestSurvivalMs)],
      ['Total Play Time', RV.UI.fmtTime(s.totalSurvivalMs)],
      ['Damageless Wins', RV.UI.fmt(s.damagelessWins)],
      ['Ability Uses', RV.UI.fmt(s.abilityUses)],
      ['Replays Saved', RV.UI.fmt(s.replaysSaved)],
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
