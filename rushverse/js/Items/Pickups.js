/* RUSHVERSE - Items/Pickups.js
   Coins, gems/energy, and the six power-up types. Coins/gems fly toward the
   player when a magnet effect (ability, power-up, or the Magnet Storm event)
   is active. */
(function (RV) {
  'use strict';

  var POWERUP_TYPES = ['shield', 'magnet', 'speed', 'multiplier', 'freeze', 'secondChance'];
  var POWERUP_META = {
    shield: { color: '#7ad9ff', icon: 'S' },
    magnet: { color: '#ff7ad1', icon: 'M' },
    speed: { color: '#7dff5a', icon: '>' },
    multiplier: { color: '#ffce45', icon: 'x2' },
    freeze: { color: '#bdfbff', icon: '*' },
    secondChance: { color: '#ff5e5e', icon: '+' }
  };

  var idc = 0;

  function spawnCoin(x, z, value) {
    return { id: ++idc, kind: 'coin', x: x, z: z, value: value || 5, bob: Math.random() * Math.PI * 2, collected: false };
  }
  function spawnGem(x, z) {
    return { id: ++idc, kind: 'gem', x: x, z: z, value: 1, bob: Math.random() * Math.PI * 2, collected: false };
  }
  function spawnPowerup(x, z, type) {
    return { id: ++idc, kind: 'powerup', ptype: type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)], x: x, z: z, bob: Math.random() * Math.PI * 2, collected: false };
  }

  function randomPos(maxR) {
    var a = Math.random() * Math.PI * 2;
    var r = Math.random() * maxR;
    return { x: Math.cos(a) * r, z: Math.sin(a) * r };
  }

  function update(item, dt, playerX, playerZ, magnetActive) {
    item.bob += dt * 3;
    if (magnetActive) {
      var dx = playerX - item.x, dz = playerZ - item.z;
      var dist = Math.hypot(dx, dz);
      if (dist > 0.1 && dist < 9) {
        var pull = 9 * dt * (dist < 2 ? 2.2 : 1);
        item.x += (dx / dist) * pull;
        item.z += (dz / dist) * pull;
      }
    }
  }

  function checkPickup(item, playerX, playerZ, playerRadius) {
    var r = item.kind === 'powerup' ? 0.65 : 0.5;
    return Math.hypot(playerX - item.x, playerZ - item.z) < (r + playerRadius);
  }

  function draw(ctx, item, project) {
    var pos = project(item.x, item.z);
    if (!pos || pos.cull) return;
    var bobY = Math.sin(item.bob) * 4 * pos.scale;
    var y = pos.y - 14 * pos.scale - bobY;

    if (item.kind === 'coin') {
      ctx.fillStyle = '#ffce45';
      ctx.shadowColor = '#ffce45'; ctx.shadowBlur = 10 * pos.scale;
      ctx.beginPath(); ctx.arc(pos.x, y, 8 * pos.scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8de';
      ctx.font = '700 ' + Math.round(9 * pos.scale) + 'px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('$', pos.x, y + 1);
    } else if (item.kind === 'gem') {
      ctx.fillStyle = '#7ad9ff';
      ctx.shadowColor = '#7ad9ff'; ctx.shadowBlur = 12 * pos.scale;
      ctx.save();
      ctx.translate(pos.x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-7 * pos.scale, -7 * pos.scale, 14 * pos.scale, 14 * pos.scale);
      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      var meta = POWERUP_META[item.ptype];
      ctx.fillStyle = meta.color;
      ctx.shadowColor = meta.color; ctx.shadowBlur = 14 * pos.scale;
      ctx.beginPath(); ctx.arc(pos.x, y, 11 * pos.scale, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0a0e16';
      ctx.font = '800 ' + Math.round(10 * pos.scale) + 'px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, pos.x, y + 1);
    }
    ctx.textBaseline = 'alphabetic';
  }

  RV.Pickups = {
    POWERUP_TYPES: POWERUP_TYPES, POWERUP_META: POWERUP_META,
    spawnCoin: spawnCoin, spawnGem: spawnGem, spawnPowerup: spawnPowerup,
    randomPos: randomPos, update: update, checkPickup: checkPickup, draw: draw
  };
})(window.RV || (window.RV = {}));
