/* RUSHVERSE - Settings/SettingsScreen.js
   Music/SFX volume, graphics quality, vibration, language, controls side,
   account info, and a guarded reset-data action. */
(function (RV) {
  'use strict';

  var el;
  var LANG_LABELS = { en: 'English', he: 'עברית' };

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen settings-screen';
    container.appendChild(el);
    return { el: el, onShow: render };
  }

  function render() {
    var s = RV.Save.get().settings;
    var save = RV.Save.get();
    el.innerHTML =
      '<div class="screen-title">SETTINGS</div>' +
      '<div class="settings-list">' +
        sliderRow('Music Volume', 'musicVolume', s.musicVolume) +
        sliderRow('SFX Volume', 'sfxVolume', s.sfxVolume) +
        segmentRow('Graphics', 'graphics', s.graphics, ['low', 'medium', 'high']) +
        toggleRow('Vibration', 'vibration', s.vibration) +
        segmentRow('Language', 'language', s.language, ['en', 'he'], LANG_LABELS) +
        segmentRow('Joystick Side', 'joystickSide', s.joystickSide, ['left', 'right']) +
        '<div class="settings-section-title">ACCOUNT</div>' +
        '<div class="settings-row"><span>Player Code</span><span class="stat-row-val">' + save.playerCode + '</span></div>' +
        '<div class="settings-row"><span>Level</span><span class="stat-row-val">' + RV.Progress.xpProgress().level + '</span></div>' +
        '<button class="menu-btn danger-btn" id="resetDataBtn">RESET DATA</button>' +
      '</div>';

    el.querySelectorAll('input[type=range]').forEach(function (input) {
      input.addEventListener('input', function () {
        var save2 = RV.Save.get();
        save2.settings[input.dataset.key] = parseFloat(input.value);
        RV.Save.save();
        RV.Audio.applyVolumes();
      });
    });
    el.querySelectorAll('.segment-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Audio.sfx.click();
        var save2 = RV.Save.get();
        save2.settings[btn.dataset.key] = btn.dataset.value;
        RV.Save.save();
        if (btn.dataset.key === 'joystickSide') RV.Controls.applySide();
        render();
      });
    });
    el.querySelectorAll('.toggle-switch').forEach(function (t) {
      t.addEventListener('click', function () {
        RV.Audio.sfx.click();
        var save2 = RV.Save.get();
        save2.settings[t.dataset.key] = !save2.settings[t.dataset.key];
        RV.Save.save();
        render();
      });
    });
    el.querySelector('#resetDataBtn').addEventListener('click', confirmReset);
  }

  function sliderRow(label, key, value) {
    return '<div class="settings-row"><span>' + label + '</span>' +
      '<input type="range" min="0" max="1" step="0.05" value="' + value + '" data-key="' + key + '" class="volume-slider"></div>';
  }
  function toggleRow(label, key, value) {
    return '<div class="settings-row"><span>' + label + '</span>' +
      '<div class="toggle-switch ' + (value ? 'on' : '') + '" data-key="' + key + '"><div class="toggle-knob"></div></div></div>';
  }
  function segmentRow(label, key, value, options, labels) {
    return '<div class="settings-row col"><span>' + label + '</span><div class="segment-group">' +
      options.map(function (o) {
        return '<button class="segment-btn ' + (o === value ? 'active' : '') + '" data-key="' + key + '" data-value="' + o + '">' +
          (labels ? labels[o] : o.toUpperCase()) + '</button>';
      }).join('') + '</div></div>';
  }

  function confirmReset() {
    var card = RV.UI.modal(
      '<div class="levelup-title" style="color:#ff6a6a">RESET ALL DATA?</div>' +
      '<div class="item-desc" style="text-align:center;margin:8px 0 18px">This permanently deletes your progress, currency, and unlocks. This cannot be undone.</div>' +
      '<button class="menu-btn danger-btn" id="confirmResetBtn">YES, RESET</button>' +
      '<button class="menu-btn secondary" id="cancelResetBtn">CANCEL</button>'
    );
    card.querySelector('#confirmResetBtn').addEventListener('click', function () {
      RV.Save.reset();
      RV.UI.closeModal();
      RV.UI.renderHeader();
      RV.UI.show('home');
      RV.UI.toast('Data reset', '#ff6a6a');
    });
    card.querySelector('#cancelResetBtn').addEventListener('click', function () { RV.UI.closeModal(); });
  }

  RV.SettingsScreen = { build: build };
})(window.RV || (window.RV = {}));
