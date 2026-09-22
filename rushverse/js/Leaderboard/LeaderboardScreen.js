/* RUSHVERSE - Leaderboard/LeaderboardScreen.js
   Global / Friends / Weekly / Monthly tabs, top-3 podium, player's own
   rank row, add-friend-by-code, and per-friend Challenge launcher. */
(function (RV) {
  'use strict';

  var el;
  var TABS = ['global', 'friends', 'weekly', 'monthly'];
  var activeTab = 'global';

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen leaderboard-screen';
    el.innerHTML =
      '<div class="screen-title">LEADERBOARD</div>' +
      '<div class="tab-row" id="lbTabs">' + TABS.map(function (t) {
        return '<button class="tab-btn" data-tab="' + t + '">' + t.toUpperCase() + '</button>';
      }).join('') + '</div>' +
      '<div id="lbBody"></div>';
    container.appendChild(el);

    el.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { RV.Audio.sfx.click(); activeTab = btn.dataset.tab; render(); });
    });

    return { el: el, onShow: render };
  }

  function render() {
    el.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === activeTab); });
    var body = el.querySelector('#lbBody');
    if (activeTab === 'friends') {
      body.innerHTML = renderFriendsAdd() + renderBoard('friends');
      bindAddFriend();
      bindChallengeButtons();
    } else {
      body.innerHTML = renderBoard(activeTab);
    }
  }

  function renderFriendsAdd() {
    var s = RV.Save.get();
    return '<div class="friend-code-box">' +
      '<div class="friend-code-label">YOUR PLAYER CODE</div>' +
      '<div class="friend-code-value">' + s.playerCode + '</div>' +
      '<div class="friend-add-row"><input id="friendCodeInput" class="friend-input" placeholder="RV-XXXXX" maxlength="8">' +
      '<button class="menu-btn small-btn" id="friendAddBtn">ADD</button></div></div>';
  }

  function bindAddFriend() {
    var btn = el.querySelector('#friendAddBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var input = el.querySelector('#friendCodeInput');
      var res = RV.LeaderboardData.addFriend(input.value);
      if (res.error) { RV.UI.toast(res.error, '#ff6a6a'); }
      else { RV.Audio.sfx.powerup(); RV.UI.toast(res.friend.name + ' added!', '#7dff5a'); render(); }
    });
  }

  function renderBoard(category) {
    var data = RV.LeaderboardData.board(category);
    var entries = data.entries;
    if (category === 'friends' && entries.length <= 1) {
      return '<div class="empty-state">No friends yet — add one with a player code above!</div>';
    }
    if (category === 'friends') {
      // Small lists: skip the podium (it has no room for a Challenge button)
      // and just list everyone with their rank + challenge action.
      return '<div class="lb-list">' + entries.map(function (e, i) { return rowHtml(i + 1, e, category); }).join('') + '</div>';
    }
    var top3 = entries.slice(0, 3);
    var podium = '<div class="podium-row">' + top3.map(function (e, i) {
      return '<div class="podium-item rank-' + (i + 1) + '">' +
        '<div class="podium-rank">#' + (i + 1) + '</div>' +
        '<div class="podium-avatar"></div>' +
        '<div class="podium-name">' + e.name + '</div>' +
        '<div class="podium-score">' + RV.UI.fmt(e.score) + '</div></div>';
    }).join('') + '</div>';

    var rest = entries.slice(3, 30).map(function (e, i) {
      var rank = i + 4;
      return rowHtml(rank, e, category);
    }).join('');

    var playerRow = '';
    if (data.playerRank > 30) {
      var playerEntry = entries.filter(function (e) { return e.isPlayer; })[0];
      playerRow = '<div class="lb-divider">&#8942;</div>' + rowHtml(data.playerRank, playerEntry, category);
    }

    return podium + '<div class="lb-list">' + rest + playerRow + '</div>';
  }

  function rowHtml(rank, e, category) {
    var challengeBtn = (category === 'friends' && !e.isPlayer)
      ? '<button class="challenge-btn" data-name="' + e.name + '">CHALLENGE</button>' : '';
    return '<div class="lb-row ' + (e.isPlayer ? 'is-player' : '') + '">' +
      '<div class="lb-rank">#' + rank + '</div>' +
      '<div class="lb-name">' + (e.isPlayer ? 'YOU' : e.name) + '</div>' +
      '<div class="lb-score">' + RV.UI.fmt(e.score) + '</div>' + challengeBtn + '</div>';
  }

  function bindChallengeButtons() {
    el.querySelectorAll('.challenge-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var s = RV.Save.get();
        var friend = s.friends.filter(function (f) { return f.name === btn.dataset.name; })[0];
        if (!friend) return;
        openChallengeModal(friend);
      });
    });
  }

  function openChallengeModal(friend) {
    var card = RV.UI.modal(
      '<div class="levelup-title">CHALLENGE ' + friend.name.toUpperCase() + '</div>' +
      '<div class="challenge-type-row">' +
        '<button class="menu-btn challenge-type-btn" data-type="score">SCORE RACE</button>' +
        '<button class="menu-btn secondary challenge-type-btn" data-type="survival">SURVIVAL DUEL</button>' +
      '</div>'
    );
    card.querySelectorAll('.challenge-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Audio.sfx.click();
        RV.Challenge.start(friend, btn.dataset.type);
        RV.UI.closeModal();
        var save = RV.Save.get();
        RV.UI.show('game');
        RV.HUD.startMatch(save.characters.equipped, save.maps.unlocked[0], {});
      });
    });
  }

  RV.LeaderboardScreen = { build: build };
})(window.RV || (window.RV = {}));
