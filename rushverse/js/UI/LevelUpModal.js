/* RUSHVERSE - UI/LevelUpModal.js
   Big "LEVEL UP!" celebration, chained for multi-level jumps, naming
   whatever unlocked at that level (skins/characters/maps/effects/rewards). */
(function (RV) {
  'use strict';

  function show(levels) {
    showOne(0);
    function showOne(i) {
      if (i >= levels.length) return;
      var lvl = levels[i];
      var unlock = RV.Data.LEVEL_UNLOCK_TABLE[lvl];
      RV.Audio.sfx.levelUp();
      var card = RV.UI.modal(
        '<div class="levelup-burst"></div>' +
        '<div class="levelup-title">LEVEL UP!</div>' +
        '<div class="levelup-level">LEVEL ' + lvl + '</div>' +
        (unlock ? '<div class="levelup-unlock">' + unlock + '</div>' : '<div class="levelup-unlock">+50 Coins bonus</div>') +
        '<button class="menu-btn" id="levelUpNext">' + (i < levels.length - 1 ? 'NEXT' : 'NICE!') + '</button>',
        { dismissible: false }
      );
      if (!unlock) RV.Progress.addCoins(50);
      card.querySelector('#levelUpNext').addEventListener('click', function () {
        RV.Audio.sfx.click();
        RV.UI.closeModal();
        setTimeout(function () { showOne(i + 1); }, 260);
      });
    }
  }

  RV.LevelUpModal = { show: show };
})(window.RV || (window.RV = {}));
