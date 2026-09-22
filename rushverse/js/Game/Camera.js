/* RUSHVERSE - Game/Camera.js
   Pseudo-3D third-person camera. The player is always anchored near the
   bottom-center of the screen; every other entity is projected relative to
   the player's world position using a perspective transform, so the arena
   scrolls under a camera that behaves like it is floating just behind and
   above the runner. Circular arena boundary keeps "small arena" scale. */
(function (RV) {
  'use strict';

  var BEHIND = 3.4;   // world units visible behind the player
  var AHEAD = 13;      // world units visible ahead of the player
  var RANGE = BEHIND + AHEAD;
  var NEAR_SCALE = 1.35;
  var FAR_SCALE = 0.32;

  var cam = { x: 0, z: 0, width: 800, height: 600 };

  function resize(w, h) { cam.width = w; cam.height = h; }
  function follow(x, z) { cam.x = x; cam.z = z; }

  function horizonY() { return cam.height * 0.24; }
  function groundY() { return cam.height * 0.93; }
  function centerX() { return cam.width * 0.5; }

  // Projects a world (x,z) into {x,y,scale,cull,depth}
  function project(wx, wz) {
    var relX = wx - cam.x;
    var relZ = wz - cam.z;
    var t = (relZ + BEHIND) / RANGE;
    var cull = t < -0.08 || t > 1.08;
    var tc = Math.max(0, Math.min(1, t));
    var curve = Math.pow(tc, 0.88);
    var sy = groundY() - curve * (groundY() - horizonY());
    var scale = NEAR_SCALE + (FAR_SCALE - NEAR_SCALE) * Math.pow(tc, 0.8);
    var pxPerUnit = cam.width * 0.052;
    var sx = centerX() + relX * scale * pxPerUnit;
    return { x: sx, y: sy, scale: scale, cull: cull, depth: relZ };
  }

  function playerScreenAnchor() {
    return project(cam.x, cam.z);
  }

  RV.Camera = {
    resize: resize, follow: follow, project: project,
    playerScreenAnchor: playerScreenAnchor,
    BEHIND: BEHIND, AHEAD: AHEAD,
    get x() { return cam.x; }, get z() { return cam.z; },
    get width() { return cam.width; }, get height() { return cam.height; },
    horizonY: horizonY, groundY: groundY, centerX: centerX
  };
})(window.RV || (window.RV = {}));
