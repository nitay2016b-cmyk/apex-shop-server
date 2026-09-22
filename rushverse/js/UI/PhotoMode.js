/* RUSHVERSE - UI/PhotoMode.js
   Pause-time photo mode: freezes the current match frame (gameplay is
   already paused before this opens), hides the HUD/controls, and lets the
   player pan the camera, zoom/rotate the frame, and cycle a few character
   poses. Panning re-renders the real scene through the camera; zoom/rotate
   are an honest CSS-transform "frame" effect on top of the frozen render,
   not a true free 3D camera (this is a 2D-canvas game). */
(function (RV) {
  'use strict';

  var active = false;
  var toolbar, canvasEl, hudOverlayEl, controlsLayerEl, pauseMenuEl;
  var base = { x: 0, z: 0 };
  var pan = { x: 0, z: 0 };
  var zoom = 1, rotate = 0, poseIndex = 0, uiHidden = false;
  var POSES = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

  function enter(gameScreenEl) {
    var match = RV.GameLoop.getMatch();
    if (!match || active) return;
    active = true;
    base.x = match.player.x; base.z = match.player.z;
    pan.x = 0; pan.z = 0; zoom = 1; rotate = 0; poseIndex = 0; uiHidden = false;

    canvasEl = gameScreenEl.querySelector('#gameCanvas');
    hudOverlayEl = gameScreenEl.querySelector('#hudOverlay');
    controlsLayerEl = gameScreenEl.querySelector('#controlsLayer');
    pauseMenuEl = gameScreenEl.querySelector('#pauseMenu');

    hudOverlayEl.classList.add('photo-hidden');
    controlsLayerEl.classList.add('photo-hidden');
    pauseMenuEl.classList.remove('active');

    toolbar = document.createElement('div');
    toolbar.className = 'photo-toolbar';
    gameScreenEl.appendChild(toolbar);
    renderToolbar();
    applyCamera();
  }

  function exit(gameScreenEl) {
    active = false;
    if (canvasEl) canvasEl.style.transform = '';
    if (toolbar && toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
    hudOverlayEl.classList.remove('photo-hidden');
    controlsLayerEl.classList.remove('photo-hidden');
    pauseMenuEl.classList.add('active');
  }

  function applyCamera() {
    RV.Camera.follow(base.x + pan.x, base.z + pan.z);
    if (canvasEl) canvasEl.style.transform = 'scale(' + zoom + ') rotate(' + rotate + 'deg)';
  }

  function pan_(dx, dz) { pan.x += dx; pan.z += dz; applyCamera(); }
  function zoomBy(delta) { zoom = Math.max(0.6, Math.min(1.8, zoom + delta)); applyCamera(); }
  function rotateBy(delta) { rotate += delta; applyCamera(); }
  function cyclePose() {
    poseIndex = (poseIndex + 1) % POSES.length;
    var match = RV.GameLoop.getMatch();
    if (match) match.player.facing = POSES[poseIndex];
  }
  function toggleUI() {
    uiHidden = !uiHidden;
    toolbar.classList.toggle('hidden-mode', uiHidden);
  }

  function renderToolbar() {
    toolbar.innerHTML =
      '<div class="photo-row pan-row">' +
        '<button class="photo-btn" data-a="panU">&#8593;</button>' +
      '</div>' +
      '<div class="photo-row pan-row">' +
        '<button class="photo-btn" data-a="panL">&#8592;</button>' +
        '<button class="photo-btn" data-a="panD">&#8595;</button>' +
        '<button class="photo-btn" data-a="panR">&#8594;</button>' +
      '</div>' +
      '<div class="photo-row">' +
        '<button class="photo-btn" data-a="zoomOut">&#8722;</button>' +
        '<button class="photo-btn" data-a="zoomIn">&#43;</button>' +
        '<button class="photo-btn" data-a="rotL">&#8634;</button>' +
        '<button class="photo-btn" data-a="rotR">&#8635;</button>' +
      '</div>' +
      '<div class="photo-row">' +
        '<button class="photo-btn" data-a="pose">POSE</button>' +
        '<button class="photo-btn" data-a="hideui">HIDE UI</button>' +
        '<button class="photo-btn exit-btn" data-a="exit">DONE</button>' +
      '</div>';
    toolbar.querySelectorAll('.photo-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Audio.sfx.click();
        switch (btn.dataset.a) {
          case 'panU': pan_(0, -0.8); break;
          case 'panD': pan_(0, 0.8); break;
          case 'panL': pan_(-0.8, 0); break;
          case 'panR': pan_(0.8, 0); break;
          case 'zoomIn': zoomBy(0.15); break;
          case 'zoomOut': zoomBy(-0.15); break;
          case 'rotL': rotateBy(-15); break;
          case 'rotR': rotateBy(15); break;
          case 'pose': cyclePose(); break;
          case 'hideui': toggleUI(); break;
          case 'exit': exit(btn.closest('.game-screen')); break;
        }
      });
    });
  }

  RV.PhotoMode = { enter: enter, isActive: function () { return active; } };
})(window.RV || (window.RV = {}));
