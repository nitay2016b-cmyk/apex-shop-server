/* RUSHVERSE - UI/TutorialScreen.js
   Sub-minute first-run tutorial: five quick cards (MOVE, DASH, COLLECT,
   USE ABILITY, SURVIVE), then straight into the player's first match. */
(function (RV) {
  'use strict';

  var el, onDone, step;
  var STEPS = [
    { title: 'MOVE', desc: 'Drag the left stick to run around the arena.', icon: '&#8598;' },
    { title: 'DASH', desc: 'Tap DASH (or swipe) to burst through danger.', icon: '&#187;' },
    { title: 'COLLECT', desc: 'Grab coins and gems to level up faster.', icon: '&#9679;' },
    { title: 'USE ABILITY', desc: 'Tap the Ability button for your character\'s power.', icon: '&#9889;' },
    { title: 'SURVIVE', desc: 'The longer you last, the higher your score.', icon: '&#9733;' }
  ];

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen tutorial-screen';
    container.appendChild(el);
    return { el: el, onShow: onShow };
  }

  function onShow(opts) {
    onDone = opts && opts.onDone;
    step = 0;
    render();
  }

  function render() {
    var s = STEPS[step];
    el.innerHTML =
      '<div class="tutorial-card">' +
        '<div class="tutorial-progress">' + (step + 1) + ' / ' + STEPS.length + '</div>' +
        '<div class="tutorial-icon">' + s.icon + '</div>' +
        '<div class="tutorial-title">' + s.title + '</div>' +
        '<div class="tutorial-desc">' + s.desc + '</div>' +
        '<button class="menu-btn" id="tutorialNext">' + (step === STEPS.length - 1 ? "LET'S GO" : 'NEXT') + '</button>' +
        '<button class="skip-link" id="tutorialSkip">Skip Tutorial</button>' +
      '</div>';
    el.querySelector('#tutorialNext').addEventListener('click', next);
    el.querySelector('#tutorialSkip').addEventListener('click', finish);
  }

  function next() {
    RV.Audio.resume(); RV.Audio.sfx.click();
    step++;
    if (step >= STEPS.length) finish();
    else render();
  }

  function finish() {
    var s = RV.Save.get();
    s.tutorialDone = true;
    RV.Save.save();
    if (onDone) onDone();
  }

  RV.TutorialScreen = { build: build };
})(window.RV || (window.RV = {}));
