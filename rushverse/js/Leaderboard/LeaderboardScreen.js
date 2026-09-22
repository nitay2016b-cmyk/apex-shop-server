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

  var STATUS_META = {
    online: { color: '#7dff5a', label: 'ONLINE' },
    inGame: { color: '#7ad9ff', label: 'IN GAME' },
    offline: { color: '#6c7688', label: 'OFFLINE' }
  };

  function rowHtml(rank, e, category) {
    var actions = '';
    var statusDot = '';
    if (category === 'friends' && !e.isPlayer) {
      var meta = STATUS_META[e.status || 'offline'];
      statusDot = '<span class="status-dot" style="background:' + meta.color + '" title="' + meta.label + '"></span>';
      actions = '<div class="friend-actions">' +
        '<button class="friend-action-btn" data-a="invite" data-name="' + e.name + '" title="Invite to Party">&#128101;</button>' +
        '<button class="friend-action-btn" data-a="challenge" data-name="' + e.name + '" title="Challenge">&#9876;</button>' +
        '<button class="friend-action-btn" data-a="profile" data-name="' + e.name + '" title="View Profile">&#128100;</button>' +
        '</div>';
    }
    return '<div class="lb-row ' + (e.isPlayer ? 'is-player' : '') + '">' +
      statusDot +
      '<div class="lb-rank">#' + rank + '</div>' +
      '<div class="lb-name">' + (e.isPlayer ? 'YOU' : e.name) + '</div>' +
      '<div class="lb-score">' + RV.UI.fmt(e.score) + '</div>' + actions + '</div>';
  }

  function bindChallengeButtons() {
    el.querySelectorAll('.friend-action-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Audio.sfx.click();
        var s = RV.Save.get();
        var friend = s.friends.filter(function (f) { return f.name === btn.dataset.name; })[0];
        if (!friend) return;
        if (btn.dataset.a === 'challenge') openChallengeModal(friend);
        else if (btn.dataset.a === 'profile') openFriendProfileModal(friend);
        else if (btn.dataset.a === 'invite') {
          var res = RV.Party.invite(friend);
          RV.UI.toast(res.ok ? 'Invite sent to ' + friend.name : res.error, res.ok ? '#7dff5a' : '#ff6a6a');
        }
      });
    });
  }

  function openFriendProfileModal(friend) {
    var meta = STATUS_META[friend.status || 'offline'];
    var card = RV.UI.modal(
      '<div class="levelup-title">' + friend.name.toUpperCase() + '</div>' +
      '<div class="stats-grid" style="text-align:left">' +
        '<div class="stat-row"><span>Level</span><span class="stat-row-val">' + friend.level + '</span></div>' +
        '<div class="stat-row"><span>Best Score</span><span class="stat-row-val">' + RV.UI.fmt(friend.best) + '</span></div>' +
        '<div class="stat-row"><span>Skin</span><span class="stat-row-val">' + (friend.skinName || 'Recruit') + '</span></div>' +
        '<div class="stat-row"><span>Status</span><span class="stat-row-val" style="color:' + meta.color + '">' + meta.label + '</span></div>' +
      '</div>' +
      '<button class="menu-btn" id="friendProfileCloseBtn" style="margin-top:14px">CLOSE</button>'
    );
    card.querySelector('#friendProfileCloseBtn').addEventListener('click', function () { RV.UI.closeModal(); });
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
