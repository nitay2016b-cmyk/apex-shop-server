/* RUSHVERSE - Missions/MissionsScreen.js
   Mission hub: Daily / Weekly / Season mission tiers, the 3-per-day
   Challenges list, and the sequential Quest Line — all in one screen so
   the bottom nav doesn't need extra slots for each new system. */
(function (RV) {
  'use strict';

  var el;
  var activeTab = 'daily';
  var TABS = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'season', label: 'Season' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'quests', label: 'Quests' }
  ];

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen missions-screen';
    el.innerHTML =
      '<div class="screen-title">MISSIONS</div>' +
      '<div class="tab-row" id="missionTabs">' + TABS.map(function (t) {
        return '<button class="tab-btn" data-tab="' + t.id + '">' + t.label + '</button>';
      }).join('') + '</div>' +
      '<div class="list-col" id="missionList"></div>';
    container.appendChild(el);

    el.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { RV.Audio.sfx.click(); activeTab = btn.dataset.tab; render(); });
    });

    return { el: el, onShow: render };
  }

  function render() {
    el.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === activeTab); });
    var list = el.querySelector('#missionList');
    if (activeTab === 'quests') { list.innerHTML = renderQuests(); bindQuestButtons(); return; }
    if (activeTab === 'challenges') { list.innerHTML = renderMissionRows(RV.Progress.getDailyChallenges(), 'challenge'); bindClaimButtons('challenge'); return; }
    var missions = RV.Progress.getMissions()[activeTab];
    list.innerHTML = renderMissionRows(missions, activeTab);
    bindClaimButtons(activeTab);
  }

  function renderMissionRows(missions, kind) {
    if (!missions.length) return '<div class="empty-state">Nothing here right now — check back soon.</div>';
    return missions.map(function (m) {
      var pct = Math.min(100, Math.round(m.progress / m.target * 100));
      var action = m.claimed ? '<span class="claimed-tag">CLAIMED</span>'
        : m.complete ? '<button class="item-btn buy-btn claim-mission-btn" data-kind="' + kind + '" data-id="' + m.id + '">CLAIM</button>'
        : '';
      return '<div class="mission-row">' +
        '<div class="mission-info"><div class="mission-name">' + m.desc + '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="progress-label">' + RV.UI.fmt(m.progress) + ' / ' + RV.UI.fmt(m.target) + '</div></div>' +
        '<div class="mission-reward">' + rewardText(m.reward) + action + '</div></div>';
    }).join('');
  }

  function bindClaimButtons(kind) {
    el.querySelectorAll('.claim-mission-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reward = kind === 'challenge'
          ? RV.Progress.claimDailyChallenge(btn.dataset.id)
          : RV.Progress.claimMission(btn.dataset.kind, btn.dataset.id);
        if (reward) { RV.Audio.sfx.achievement(); RV.UI.toast('Reward claimed!', '#7dff5a'); render(); }
      });
    });
  }

  function renderQuests() {
    var state = RV.Progress.getQuestState();
    var completedHtml = state.completedQuests.map(function (q) {
      return '<div class="quest-row done"><span class="quest-check">&#10003;</span><div class="quest-info"><div class="quest-name">' + q.name + '</div><div class="quest-desc">' + q.desc + '</div></div></div>';
    }).join('');

    var currentHtml = '';
    if (state.current) {
      var c = state.current;
      var pct = Math.min(100, Math.round(c.progress / c.target * 100));
      currentHtml = '<div class="quest-row active">' +
        '<div class="quest-info"><div class="quest-name">' + c.name + '</div><div class="quest-desc">' + c.desc + '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="progress-label">' + RV.UI.fmt(c.progress) + ' / ' + RV.UI.fmt(c.target) + '</div></div>' +
        '<div class="mission-reward">' + rewardText(c.reward) +
        (c.complete ? '<button class="item-btn buy-btn claim-quest-btn">CLAIM</button>' : '') + '</div></div>';
    }

    var finalHtml = '';
    if (state.done) {
      finalHtml = '<div class="quest-final-banner">' +
        (state.claimedFinal
          ? '<div class="claimed-tag">SPECIAL REWARD CLAIMED</div>'
          : '<div class="levelup-title" style="font-size:16px">SPECIAL REWARD UNLOCKED!</div><button class="item-btn buy-btn claim-final-btn">CLAIM</button>') +
        '</div>';
    }

    return completedHtml + currentHtml + finalHtml;
  }

  function bindQuestButtons() {
    var claimBtn = el.querySelector('.claim-quest-btn');
    if (claimBtn) claimBtn.addEventListener('click', function () {
      var reward = RV.Progress.claimCurrentQuest();
      if (reward) { RV.Audio.sfx.achievement(); RV.UI.toast('Quest complete!', '#7dff5a'); render(); }
    });
    var finalBtn = el.querySelector('.claim-final-btn');
    if (finalBtn) finalBtn.addEventListener('click', function () {
      var reward = RV.Progress.claimFinalQuestReward();
      if (reward) { RV.Audio.sfx.achievement(); RV.UI.toast('Special reward claimed!', '#ffce45'); render(); }
    });
  }

  function rewardText(reward) {
    var parts = [];
    if (reward.coins) parts.push('+' + reward.coins + 'c');
    if (reward.gems) parts.push('+' + reward.gems + 'g');
    if (reward.chest) parts.push(reward.chest + ' chest');
    return '<div class="reward-chip">' + parts.join(' ') + '</div>';
  }

  RV.MissionsScreen = { build: build };
})(window.RV || (window.RV = {}));
