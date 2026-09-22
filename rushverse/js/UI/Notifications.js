/* RUSHVERSE - UI/Notifications.js
   The bell-icon dropdown: a short, capped list of recent events (new
   event live, mission complete, item unlocked, level up, etc). Opening it
   marks everything read so the badge clears. */
(function (RV) {
  'use strict';

  function open() {
    var data = RV.Progress.getNotifications();
    var items = data.items.slice(0, 12);
    var body = items.length
      ? items.map(function (n) {
          return '<div class="notif-row"><span class="notif-dot notif-' + n.kind + '"></span>' +
            '<div class="notif-text">' + n.text + '</div></div>';
        }).join('')
      : '<div class="empty-state" style="padding:20px">No notifications yet.</div>';

    var card = RV.UI.modal(
      '<div class="levelup-title" style="font-size:18px">NOTIFICATIONS</div>' +
      '<div class="notif-list">' + body + '</div>' +
      '<button class="menu-btn" id="notifCloseBtn">CLOSE</button>'
    );
    card.querySelector('#notifCloseBtn').addEventListener('click', function () { RV.Audio.sfx.click(); RV.UI.closeModal(); });
    RV.Progress.markNotificationsRead();
    RV.UI.renderHeader();
  }

  RV.Notifications = { open: open };
})(window.RV || (window.RV = {}));
