/* RUSHVERSE - Leaderboard/Party.js
   Party + Private Match. IMPORTANT: there is no real multiplayer backend in
   this build, so nothing here ever pretends two separate devices are
   actually connected. It's a fully local simulation — real friends "invited"
   get a simulated accept/decline after a short delay, and a "joined" room
   is populated with generated placeholder teammates. Every screen that
   uses this must say so plainly. The API shape (createParty/invite/
   joinRoom) is deliberately what a real networked version would expose, so
   swapping in a live backend later means changing this file only. */
(function (RV) {
  'use strict';

  var MAX_PARTY_SIZE = 4;

  function save() { return RV.Save.get(); }

  function getParty() { return save().party; }

  function createParty() {
    var s = save();
    if (!s.party.code) {
      s.party.code = String(Math.floor(100000 + Math.random() * 900000));
      s.party.members = [{ name: s.playerName, isYou: true, ready: true, status: 'joined' }];
      RV.Save.save();
    }
    return s.party;
  }

  function invite(friend) {
    var s = save();
    createParty();
    if (s.party.members.length >= MAX_PARTY_SIZE) return { error: 'Party is full' };
    if (s.party.members.some(function (m) { return m.name === friend.name; })) return { error: 'Already in party' };
    var member = { name: friend.name, isYou: false, ready: false, status: 'pending' };
    s.party.members.push(member);
    RV.Save.save();
    // Simulated response — a real backend would push this from the other client.
    setTimeout(function () {
      var s2 = save();
      var m = s2.party.members.filter(function (x) { return x.name === friend.name; })[0];
      if (!m) return;
      m.status = Math.random() < 0.75 ? 'joined' : 'declined';
      m.ready = m.status === 'joined';
      RV.Save.save();
      RV.Progress.addNotification(friend.name + (m.status === 'joined' ? ' joined your party!' : ' declined the invite.'), m.status === 'joined' ? 'success' : 'info');
    }, 1800 + Math.random() * 1200);
    return { ok: true };
  }

  function removeMember(name) {
    var s = save();
    s.party.members = s.party.members.filter(function (m) { return m.name !== name; });
    RV.Save.save();
  }

  function leaveParty() {
    var s = save();
    s.party = { code: null, members: [] };
    RV.Save.save();
  }

  function joinRoom(code) {
    code = (code || '').trim();
    if (!/^\d{6}$/.test(code)) return { error: 'Room codes are 6 digits' };
    var seed = code.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    function rnd(n) { return Math.abs(Math.sin(seed * n) * 10000) % 1; }
    var names = ['NeoRunner', 'ZedStorm', 'IvyBlaze', 'FoxDash'];
    var count = 1 + Math.floor(rnd(3) * 3);
    var s = save();
    var members = [{ name: s.playerName, isYou: true, ready: true, status: 'joined' }];
    for (var i = 0; i < count; i++) members.push({ name: names[i % names.length], isYou: false, ready: true, status: 'joined' });
    s.party = { code: code, members: members };
    RV.Save.save();
    return { ok: true };
  }

  RV.Party = {
    MAX_PARTY_SIZE: MAX_PARTY_SIZE,
    getParty: getParty, createParty: createParty, invite: invite,
    removeMember: removeMember, leaveParty: leaveParty, joinRoom: joinRoom
  };
})(window.RV || (window.RV = {}));
