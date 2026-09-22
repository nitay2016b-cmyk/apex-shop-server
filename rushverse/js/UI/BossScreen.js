/* RUSHVERSE - UI/BossScreen.js
   Entry point for the dedicated Boss Battle mode: a single multi-phase
   fight against THE OVERLORD, distinct from the survival-run boss that can
   randomly appear during a GIANT ENEMY event. */
(function (RV) {
  'use strict';

  var el;

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen boss-screen';
    container.appendChild(el);
    return { el: el, onShow: render };
  }

  function render() {
    var s = RV.Save.get();
    el.innerHTML =
      '<div class="screen-title">BOSS BATTLE</div>' +
      '<div class="boss-hero">' +
        '<div class="boss-portrait">&#128128;</div>' +
        '<div class="boss-name">THE OVERLORD</div>' +
        '<div class="boss-desc">A three-phase arena boss. It opens by hurling obstacles, ' +
        'then reshapes the arena around you, and finally speeds up when enraged. ' +
        'Watch for its golden weak-point window — dashing through it there deals huge bonus damage.</div>' +
        '<div class="boss-stats-row">' +
          '<div class="boss-stat"><div class="boss-stat-val">' + s.bossesDefeated + '</div><div class="boss-stat-label">TIMES DEFEATED</div></div>' +
          '<div class="boss-stat"><div class="boss-stat-val">800c + 40g</div><div class="boss-stat-label">VICTORY REWARD</div></div>' +
        '</div>' +
        '<button class="play-btn boss-enter-btn" id="bossEnterBtn"><span>ENTER BATTLE</span></button>' +
      '</div>';

    el.querySelector('#bossEnterBtn').addEventListener('click', function () {
      RV.Audio.resume(); RV.Audio.sfx.click();
      var save = RV.Save.get();
      var mapId = save.maps.unlocked.indexOf('volcano_core') !== -1 ? 'volcano_core' : save.maps.unlocked[save.maps.unlocked.length - 1];
      var skin = { outfitColor: (RV.Data.getShopItem(save.skins.equipped.outfit) || {}).color };
      RV.UI.show('game');
      RV.HUD.startMatch(save.characters.equipped, mapId, skin, { bossMode: true });
    });
  }

  RV.BossScreen = { build: build };
})(window.RV || (window.RV = {}));
