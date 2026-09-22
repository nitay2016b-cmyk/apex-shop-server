/* RUSHVERSE - UI/UIManager.js
   Screen router + shared chrome (currency/level header), toast/modal
   helpers, and small format utilities every screen module reuses. */
(function (RV) {
  'use strict';

  var screens = {};
  var current = null;
  var root, headerEl;

  function registerScreen(name, api) { screens[name] = api; }

  function init(rootEl) {
    root = rootEl;
    headerEl = document.getElementById('topHeader');
    renderHeader();
    RV.Progress.on('levelup', renderHeader);
  }

  function show(name, opts) {
    Object.keys(screens).forEach(function (key) {
      var el = screens[key].el;
      if (!el) return;
      el.classList.toggle('active', key === name);
    });
    if (screens[name] && screens[name].onShow) screens[name].onShow(opts);
    current = name;
    var isGameplay = (name === 'game');
    headerEl.classList.toggle('hidden', isGameplay || name === 'tutorial');
    document.getElementById('bottomNav').classList.toggle('hidden', isGameplay || name === 'tutorial');
    if (!isGameplay) renderHeader();
  }

  function getCurrent() { return current; }

  function renderHeader() {
    var s = RV.Save.get();
    var prog = RV.Progress.xpProgress();
    headerEl.innerHTML =
      '<div class="curr-pill coin-pill"><span class="curr-icon">&#9679;</span>' + fmt(s.coins) + '</div>' +
      '<div class="curr-pill gem-pill"><span class="curr-icon">&#9670;</span>' + fmt(s.gems) + '</div>' +
      '<div class="level-block">' +
        '<div class="level-badge">LV ' + prog.level + '</div>' +
        '<div class="xp-bar"><div class="xp-fill" style="width:' + Math.round(prog.pct * 100) + '%"></div></div>' +
      '</div>';
  }

  function fmt(n) {
    n = Math.round(n);
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000) return Math.round(n / 1000) + 'K';
    if (n >= 1000) return n.toLocaleString();
    return String(n);
  }

  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function rarityColor(r) { return RV.Data.RARITY_COLOR[r] || '#9aa5b1'; }

  var toastQueue = [];
  var toastShowing = false;
  function toast(text, color) {
    toastQueue.push({ text: text, color: color || '#fff' });
    if (!toastShowing) showNextToast();
  }
  function showNextToast() {
    var t = toastQueue.shift();
    if (!t) { toastShowing = false; return; }
    toastShowing = true;
    var el = document.getElementById('toastLayer');
    var node = document.createElement('div');
    node.className = 'toast';
    node.style.borderColor = t.color;
    node.textContent = t.text;
    el.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('show'); });
    setTimeout(function () {
      node.classList.remove('show');
      setTimeout(function () { node.remove(); showNextToast(); }, 250);
    }, 1900);
  }

  function modal(innerHtml, opts) {
    opts = opts || {};
    var layer = document.getElementById('modalLayer');
    layer.innerHTML = '<div class="modal-backdrop"><div class="modal-card">' + innerHtml + '</div></div>';
    layer.classList.add('active');
    var backdrop = layer.querySelector('.modal-backdrop');
    requestAnimationFrame(function () { backdrop.classList.add('show'); });
    if (opts.dismissible !== false) {
      backdrop.addEventListener('click', function (e) { if (e.target === backdrop) closeModal(); });
    }
    return layer.querySelector('.modal-card');
  }
  function closeModal() {
    var layer = document.getElementById('modalLayer');
    var backdrop = layer.querySelector('.modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('show');
    setTimeout(function () { layer.classList.remove('active'); layer.innerHTML = ''; }, 220);
  }

  RV.UI = {
    registerScreen: registerScreen, init: init, show: show, getCurrent: getCurrent,
    renderHeader: renderHeader, fmt: fmt, fmtTime: fmtTime, rarityColor: rarityColor,
    toast: toast, modal: modal, closeModal: closeModal
  };
})(window.RV || (window.RV = {}));
