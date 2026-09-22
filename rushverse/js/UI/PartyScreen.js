/* RUSHVERSE - UI/PartyScreen.js
   Party (up to 4) + Private Match room codes. Clearly labeled as a local
   demo everywhere — see Leaderboard/Party.js for why. */
(function (RV) {
  'use strict';

  var el;
  var pollTimer = null;

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen party-screen';
    container.appendChild(el);
    return { el: el, onShow: onShow, onHide: onHide };
  }

  function onShow() {
    render();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () {
      var party = RV.Party.getParty();
      var hasPending = party.members.some(function (m) { return m.status === 'pending'; });
      var inputFocused = document.activeElement && document.activeElement.id === 'roomCodeInput';
      if (hasPending && !inputFocused) render();
    }, 1500);
  }
  function onHide() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function render() {
    var party = RV.Party.getParty();
    el.innerHTML =
      '<div class="screen-title">PARTY</div>' +
      '<div class="demo-banner">LOCAL DEMO — real online multiplayer needs a backend and isn\'t connected here. Invites and joins are simulated on this device.</div>' +
      '<div class="party-section">' +
        '<div class="party-section-title">YOUR PARTY</div>' +
        (party.code ? renderPartyBox(party) : '<button class="menu-btn" id="createPartyBtn">CREATE PARTY</button>') +
      '</div>' +
      '<div class="party-section">' +
        '<div class="party-section-title">PRIVATE MATCH</div>' +
        '<div class="party-desc">Join a room by its 6-digit code, or generate one to share.</div>' +
        '<div class="friend-add-row">' +
          '<input id="roomCodeInput" class="friend-input" placeholder="482913" maxlength="6">' +
          '<button class="menu-btn small-btn" id="joinRoomBtn">JOIN</button>' +
        '</div>' +
        '<button class="menu-btn secondary" id="genRoomBtn" style="margin-top:10px">GENERATE ROOM CODE</button>' +
      '</div>';

    var createBtn = el.querySelector('#createPartyBtn');
    if (createBtn) createBtn.addEventListener('click', function () { RV.Audio.sfx.click(); RV.Party.createParty(); render(); });

    el.querySelector('#joinRoomBtn').addEventListener('click', function () {
      var code = el.querySelector('#roomCodeInput').value;
      var res = RV.Party.joinRoom(code);
      if (res.error) RV.UI.toast(res.error, '#ff6a6a');
      else { RV.Audio.sfx.powerup(); RV.UI.toast('Joined room ' + code + ' (demo)', '#7dff5a'); render(); }
    });
    el.querySelector('#genRoomBtn').addEventListener('click', function () {
      var code = String(Math.floor(100000 + Math.random() * 900000));
      RV.Audio.sfx.click();
      RV.Party.joinRoom(code);
      render();
    });

    bindPartyButtons();
  }

  function renderPartyBox(party) {
    return '<div class="party-code-line">ROOM: <span>' + party.code + '</span></div>' +
      '<div class="party-members">' + party.members.map(function (m) {
        var statusLabel = m.status === 'pending' ? 'INVITED...' : m.status === 'declined' ? 'DECLINED' : (m.isYou ? 'YOU' : 'READY');
        var statusColor = m.status === 'pending' ? '#ffce45' : m.status === 'declined' ? '#ff6a6a' : '#7dff5a';
        return '<div class="party-member-row"><span class="party-member-name">' + m.name + '</span>' +
          '<span class="party-member-status" style="color:' + statusColor + '">' + statusLabel + '</span>' +
          (m.isYou ? '' : '<button class="party-kick-btn" data-name="' + m.name + '">&#10005;</button>') + '</div>';
      }).join('') + '</div>' +
      '<div class="party-desc">Invite friends from the Leaderboard &gt; Friends tab.</div>' +
      '<button class="menu-btn secondary" id="leavePartyBtn">DISBAND PARTY</button>';
  }

  function bindPartyButtons() {
    var leaveBtn = el.querySelector('#leavePartyBtn');
    if (leaveBtn) leaveBtn.addEventListener('click', function () { RV.Audio.sfx.click(); RV.Party.leaveParty(); render(); });
    el.querySelectorAll('.party-kick-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { RV.Audio.sfx.click(); RV.Party.removeMember(btn.dataset.name); render(); });
    });
  }

  RV.PartyScreen = { build: build };
})(window.RV || (window.RV = {}));
