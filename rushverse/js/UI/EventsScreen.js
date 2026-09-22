/* RUSHVERSE - UI/EventsScreen.js
   The currently active rotating meta-event (Coin Rush, Double XP, Boss
   Week, Speed Week, Neon Night, Frozen Event) with its timer, missions and
   rewards. Distinct from the short in-run random events (COIN RAIN etc.)
   that fire mid-match. */
(function (RV) {
  'use strict';

  var el;

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen events-screen';
    container.appendChild(el);
    return { el: el, onShow: render };
  }

  function render() {
    var state = RV.Progress.getMetaEventState();
    el.innerHTML =
      '<div class="screen-title">EVENTS</div>' +
      '<div class="event-hero" style="border-color:' + state.color + '55; background:linear-gradient(160deg,' + state.color + '22, transparent)">' +
        '<div class="event-hero-label" style="color:' + state.color + '">' + state.label + '</div>' +
        '<div class="event-hero-desc">' + state.desc + '</div>' +
        '<div class="event-hero-timer">ENDS IN ' + state.daysLeft + ' DAY' + (state.daysLeft === 1 ? '' : 'S') + '</div>' +
      '</div>' +
      '<div class="list-col" id="eventMissions"></div>';

    var list = el.querySelector('#eventMissions');
    list.innerHTML = state.missions.map(function (m) {
      var pct = Math.min(100, Math.round(m.progress / m.target * 100));
      var action = m.claimed ? '<span class="claimed-tag">CLAIMED</span>'
        : m.complete ? '<button class="item-btn buy-btn claim-event-btn" data-id="' + m.id + '">CLAIM</button>' : '';
      return '<div class="mission-row">' +
        '<div class="mission-info"><div class="mission-name">' + m.desc + '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:linear-gradient(90deg,' + state.color + ',var(--cyan))"></div></div>' +
        '<div class="progress-label">' + RV.UI.fmt(m.progress) + ' / ' + RV.UI.fmt(m.target) + '</div></div>' +
        '<div class="mission-reward">' + rewardText(m.reward) + action + '</div></div>';
    }).join('');

    list.querySelectorAll('.claim-event-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var reward = RV.Progress.claimMetaEventMission(btn.dataset.id);
        if (reward) { RV.Audio.sfx.achievement(); RV.UI.toast('Event reward claimed!', state.color); render(); }
      });
    });
  }

  function rewardText(reward) {
    var parts = [];
    if (reward.coins) parts.push('+' + reward.coins + 'c');
    if (reward.gems) parts.push('+' + reward.gems + 'g');
    return '<div class="reward-chip">' + parts.join(' ') + '</div>';
  }

  RV.EventsScreen = { build: build };
})(window.RV || (window.RV = {}));
