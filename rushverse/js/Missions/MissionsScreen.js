/* RUSHVERSE - Missions/MissionsScreen.js
   Daily / Weekly mission lists with live progress bars and claim buttons. */
(function (RV) {
  'use strict';

  var el;
  var activeTab = 'daily';

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen missions-screen';
    el.innerHTML =
      '<div class="screen-title">MISSIONS</div>' +
      '<div class="tab-row" id="missionTabs">' +
        '<button class="tab-btn" data-tab="daily">Daily</button>' +
        '<button class="tab-btn" data-tab="weekly">Weekly</button>' +
      '</div>' +
      '<div class="list-col" id="missionList"></div>';
    container.appendChild(el);

    el.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { RV.Audio.sfx.click(); activeTab = btn.dataset.tab; render(); });
    });

    return { el: el, onShow: render };
  }

  function render() {
    el.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === activeTab); });
    var missions = RV.Progress.getMissions()[activeTab];
    var list = el.querySelector('#missionList');
    list.innerHTML = missions.map(function (m) {
      var pct = Math.min(100, Math.round(m.progress / m.target * 100));
      var action = m.claimed ? '<span class="claimed-tag">CLAIMED</span>'
        : m.complete ? '<button class="item-btn buy-btn claim-mission-btn" data-kind="' + m.kind + '" data-id="' + m.id + '">CLAIM</button>'
        : '';
      return '<div class="mission-row">' +
        '<div class="mission-info"><div class="mission-name">' + m.desc + '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="progress-label">' + RV.UI.fmt(m.progress) + ' / ' + RV.UI.fmt(m.target) + '</div></div>' +
        '<div class="mission-reward">' + rewardText(m.reward) + action + '</div></div>';
    }).join('');
    list.querySelectorAll('.claim-mission-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reward = RV.Progress.claimMission(btn.dataset.kind, btn.dataset.id);
        if (reward) { RV.Audio.sfx.achievement(); RV.UI.toast('Mission reward claimed!', '#7dff5a'); render(); }
      });
    });
  }

  function rewardText(reward) {
    var parts = [];
    if (reward.coins) parts.push('+' + reward.coins + 'c');
    if (reward.gems) parts.push('+' + reward.gems + 'g');
    return '<div class="reward-chip">' + parts.join(' ') + '</div>';
  }

  RV.MissionsScreen = { build: build };
})(window.RV || (window.RV = {}));
