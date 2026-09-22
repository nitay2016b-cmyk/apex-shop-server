/* RUSHVERSE - UI/HomeScreen.js
   Title screen: character + map picker (quick-swap arrows, no heavy menu)
   and the PLAY button, so a run starts in seconds. */
(function (RV) {
  'use strict';

  var el;
  var charIndex = 0, mapIndex = 0;

  function ownedCharacters() {
    var s = RV.Save.get();
    return RV.Data.CHARACTERS.filter(function (c) { return s.characters.owned.indexOf(c.id) !== -1; });
  }
  function unlockedMaps() {
    var s = RV.Save.get();
    return RV.Data.MAPS.filter(function (m) { return s.maps.unlocked.indexOf(m.id) !== -1; });
  }

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen home-screen';
    el.innerHTML =
      '<div class="home-glow"></div>' +
      '<div class="logo-wrap">' +
        '<div class="logo-title">RUSH<span class="logo-accent">VERSE</span></div>' +
        '<div class="logo-sub">ARENA ACTION</div>' +
      '</div>' +
      '<div class="picker-row" id="charPicker">' +
        '<button class="picker-arrow" data-dir="-1" data-target="char">&#10094;</button>' +
        '<div class="picker-card" id="charCard"></div>' +
        '<button class="picker-arrow" data-dir="1" data-target="char">&#10095;</button>' +
      '</div>' +
      '<div class="picker-row map-row" id="mapPicker">' +
        '<button class="picker-arrow" data-dir="-1" data-target="map">&#10094;</button>' +
        '<div class="picker-card map-card" id="mapCard"></div>' +
        '<button class="picker-arrow" data-dir="1" data-target="map">&#10095;</button>' +
      '</div>' +
      '<button class="play-btn" id="playBtn"><span>PLAY</span></button>' +
      '<div class="best-score-line" id="bestScoreLine"></div>';
    container.appendChild(el);

    el.querySelectorAll('.picker-arrow').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Audio.resume(); RV.Audio.sfx.click();
        var dir = parseInt(btn.dataset.dir, 10);
        if (btn.dataset.target === 'char') {
          var chars = ownedCharacters();
          charIndex = (charIndex + dir + chars.length) % chars.length;
          equipCharacter(chars[charIndex].id);
        } else {
          var maps = unlockedMaps();
          mapIndex = (mapIndex + dir + maps.length) % maps.length;
        }
        renderCards();
      });
    });

    el.querySelector('#playBtn').addEventListener('click', function () {
      RV.Audio.resume(); RV.Audio.sfx.click();
      var s = RV.Save.get();
      var maps = unlockedMaps();
      var map = maps[mapIndex] || maps[0];
      if (!s.tutorialDone) {
        RV.UI.show('tutorial', { onDone: function () { launchMatch(s.characters.equipped, map.id); } });
      } else {
        launchMatch(s.characters.equipped, map.id);
      }
    });

    return { el: el, onShow: onShow };
  }

  function equipCharacter(id) {
    var s = RV.Save.get();
    s.characters.equipped = id;
    RV.Save.save();
  }

  function launchMatch(characterId, mapId) {
    var s = RV.Save.get();
    var skin = {
      outfitColor: (RV.Data.getShopItem(s.skins.equipped.outfit) || {}).color
    };
    RV.UI.show('game');
    RV.HUD.startMatch(characterId, mapId, skin);
  }

  function renderCards() {
    var chars = ownedCharacters();
    var maps = unlockedMaps();
    var s = RV.Save.get();
    var equippedIdx = chars.findIndex(function (c) { return c.id === s.characters.equipped; });
    if (equippedIdx !== -1) charIndex = equippedIdx;
    var c = chars[charIndex] || chars[0];
    var m = maps[mapIndex] || maps[0];

    document.getElementById('charCard').innerHTML =
      '<div class="char-avatar" style="background:radial-gradient(circle at 35% 30%,' + c.accent + ',' + c.color + ')"></div>' +
      '<div class="picker-name">' + c.name + '</div>' +
      '<div class="picker-sub rarity-' + c.rarity + '">' + c.rarity.toUpperCase() + '</div>' +
      '<div class="picker-desc">' + c.ability.name + ' — ' + c.ability.desc + '</div>';

    document.getElementById('mapCard').innerHTML =
      '<div class="map-avatar" style="background:linear-gradient(160deg,' + m.palette.sky2 + ',' + m.palette.floor1 + ')">' +
        '<div class="map-avatar-glow" style="background:' + m.palette.glow + '"></div>' +
      '</div>' +
      '<div class="picker-name">' + m.name + '</div>' +
      '<div class="picker-desc">' + m.desc + '</div>';

    document.getElementById('bestScoreLine').textContent = 'BEST SCORE  ' + RV.UI.fmt(s.bestScore);
  }

  function onShow() {
    renderCards();
  }

  RV.HomeScreen = { build: build };
})(window.RV || (window.RV = {}));
