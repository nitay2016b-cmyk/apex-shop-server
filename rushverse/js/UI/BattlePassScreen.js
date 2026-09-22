/* RUSHVERSE - UI/BattlePassScreen.js
   Free + Premium reward tracks driven by Season XP. The Free track always
   stays functionally useful (coins/gems/chests); Premium only adds
   cosmetics and modest currency bonuses on top — never a gameplay
   advantage, so buying it can't win the game for you. */
(function (RV) {
  'use strict';

  var el;

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen battlepass-screen';
    container.appendChild(el);
    return { el: el, onShow: render };
  }

  function render() {
    var state = RV.Season.getState();
    el.innerHTML =
      '<div class="screen-title">BATTLE PASS</div>' +
      '<div class="bp-header">' +
        '<div class="bp-season-name">' + state.name + '</div>' +
        '<div class="bp-level-big">LEVEL ' + state.level + ' <span class="bp-level-max">/ ' + state.maxLevel + '</span></div>' +
        '<div class="progress-bar bp-progress"><div class="progress-fill" style="width:' + Math.round(state.pct * 100) + '%"></div></div>' +
        (state.premiumOwned
          ? '<div class="bp-premium-owned">PREMIUM PASS ACTIVE</div>'
          : '<button class="menu-btn bp-buy-btn" id="bpBuyBtn">UNLOCK PREMIUM — ' + RV.Season.PREMIUM_PASS_PRICE.gems + ' <span class="gem-dot"></span></button>') +
      '</div>' +
      '<div class="bp-track-labels"><span>FREE</span><span>PREMIUM</span></div>' +
      '<div class="bp-track" id="bpTrack"></div>';

    var track = el.querySelector('#bpTrack');
    RV.Data.BATTLE_PASS_REWARDS.forEach(function (row) {
      track.appendChild(rowEl(row, state));
    });

    var buyBtn = el.querySelector('#bpBuyBtn');
    if (buyBtn) buyBtn.addEventListener('click', function () {
      var res = RV.Season.purchasePremium();
      if (res.error) RV.UI.toast(res.error, '#ff6a6a');
      else { RV.Audio.sfx.powerup(); RV.UI.toast('Premium Pass unlocked!', '#ffce45'); render(); }
    });

    el.querySelectorAll('.bp-claim-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var res = RV.Season.claimReward(parseInt(btn.dataset.level, 10), btn.dataset.track);
        if (res.error) RV.UI.toast(res.error, '#ff6a6a');
        else { RV.Audio.sfx.achievement(); RV.UI.toast('Reward claimed!', '#7dff5a'); render(); }
      });
    });
  }

  function rowEl(row, state) {
    var wrap = document.createElement('div');
    wrap.className = 'bp-row' + (row.level <= state.level ? ' unlocked' : '');
    wrap.innerHTML =
      '<div class="bp-cell">' + cellHtml(row, 'free', state) + '</div>' +
      '<div class="bp-level-pill">' + row.level + '</div>' +
      '<div class="bp-cell">' + cellHtml(row, 'premium', state) + '</div>';
    return wrap;
  }

  function cellHtml(row, track, state) {
    var reward = row[track];
    var locked = row.level > state.level;
    var needsPremium = track === 'premium' && !state.premiumOwned;
    var claimedList = track === 'premium' ? state.claimedPremium : state.claimedFree;
    var claimed = claimedList.indexOf(row.level) !== -1;
    var label = rewardLabel(reward);
    var cls = 'bp-reward' + (track === 'premium' ? ' premium' : '') + (locked || needsPremium ? ' locked' : '');
    var action = '';
    if (claimed) action = '<div class="bp-claimed">&#10003;</div>';
    else if (locked) action = '';
    else if (needsPremium) action = '<div class="bp-lock-icon">&#128274;</div>';
    else action = '<button class="bp-claim-btn" data-level="' + row.level + '" data-track="' + track + '">CLAIM</button>';
    return '<div class="' + cls + '"><div class="bp-reward-label">' + label + '</div>' + action + '</div>';
  }

  function rewardLabel(reward) {
    var parts = [];
    if (reward.coins) parts.push(reward.coins + 'c');
    if (reward.gems) parts.push(reward.gems + 'g');
    if (reward.chest) parts.push(reward.chest.toUpperCase() + ' CHEST');
    if (reward.skin) parts.push('SKIN');
    return parts.join(' + ') || '—';
  }

  RV.BattlePassScreen = { build: build };
})(window.RV || (window.RV = {}));
