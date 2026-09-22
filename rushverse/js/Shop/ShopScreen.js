/* RUSHVERSE - Shop/ShopScreen.js
   Featured (rotates daily) + Characters (unlock via level or coins — never
   gems-only, so nothing here is pay-to-win) + Outfits/Trails/Effects/Emotes.
   Every card shows rarity, price, a live BUY / EQUIP / OWNED state, and a
   Preview before buying. */
(function (RV) {
  'use strict';

  var el;
  var TABS = [
    { id: 'featured', label: 'Featured' },
    { id: 'characters', label: 'Characters' },
    { id: 'outfit', label: 'Outfits' },
    { id: 'trail', label: 'Trails' },
    { id: 'effect', label: 'Effects' },
    { id: 'emote', label: 'Emotes' }
  ];
  var activeTab = 'featured';

  function build(container) {
    el = document.createElement('div');
    el.className = 'screen shop-screen';
    el.innerHTML =
      '<div class="screen-title">SHOP</div>' +
      '<div class="tab-row" id="shopTabs"></div>' +
      '<div class="item-grid" id="shopGrid"></div>';
    container.appendChild(el);

    el.querySelector('#shopTabs').innerHTML = TABS.map(function (t) {
      return '<button class="tab-btn" data-tab="' + t.id + '">' + t.label + '</button>';
    }).join('');
    el.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        RV.Audio.sfx.click();
        activeTab = btn.dataset.tab;
        render();
      });
    });

    return { el: el, onShow: render };
  }

  // Deterministic daily rotation — no server needed, everyone on the same
  // day sees the same featured picks, and they change automatically.
  function getFeaturedItems() {
    var dayKey = Math.floor(Date.now() / 86400000);
    var pool = RV.Data.SHOP_ITEMS.filter(function (it) { return it.price.coins > 0 || it.price.gems > 0; });
    var picks = [];
    var seed = dayKey;
    while (picks.length < 4 && picks.length < pool.length) {
      seed = (seed * 9301 + 49297) % 233280;
      var idx = Math.floor((seed / 233280) * pool.length);
      if (picks.indexOf(pool[idx]) === -1) picks.push(pool[idx]);
    }
    return picks;
  }

  function render() {
    el.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === activeTab); });
    var grid = el.querySelector('#shopGrid');
    grid.innerHTML = '';
    if (activeTab === 'featured') {
      getFeaturedItems().forEach(function (it) { grid.appendChild(cosmeticCard(it, true)); });
    } else if (activeTab === 'characters') {
      RV.Data.CHARACTERS.forEach(function (c) { grid.appendChild(characterCard(c)); });
    } else {
      RV.Data.SHOP_ITEMS.filter(function (it) { return it.cat === activeTab; }).forEach(function (it) {
        grid.appendChild(cosmeticCard(it, false));
      });
    }
  }

  function unlockLabel(u) {
    if (u.type === 'default') return 'STARTER';
    if (u.type === 'level') return 'LEVEL ' + u.value;
    if (u.type === 'coins') return u.value.toLocaleString() + ' COINS';
    return '';
  }

  function characterCard(c) {
    var s = RV.Save.get();
    var owned = s.characters.owned.indexOf(c.id) !== -1;
    var equipped = s.characters.equipped === c.id;
    var card = document.createElement('div');
    card.className = 'item-card rarity-border-' + c.rarity;
    var canBuyWithCoins = !owned && c.unlock.type === 'coins';
    card.innerHTML =
      '<div class="item-preview" style="background:radial-gradient(circle at 35% 30%,' + c.accent + ',' + c.color + ')"></div>' +
      '<div class="item-name">' + c.name + '</div>' +
      '<div class="item-rarity rarity-' + c.rarity + '">' + c.rarity.toUpperCase() + '</div>' +
      '<div class="item-desc">' + c.ability.name + '</div>' +
      (owned
        ? '<button class="item-btn ' + (equipped ? 'owned-btn' : 'buy-btn') + '">' + (equipped ? 'EQUIPPED' : 'EQUIP') + '</button>'
        : canBuyWithCoins
          ? '<button class="item-btn buy-btn">UNLOCK — ' + RV.UI.fmt(c.unlock.value) + ' <span class="coin-dot"></span></button>'
          : '<button class="item-btn locked-btn" disabled>' + unlockLabel(c.unlock) + '</button>');

    var btn = card.querySelector('.item-btn');
    if (owned && !equipped) {
      btn.addEventListener('click', function () {
        RV.Audio.sfx.click();
        s.characters.equipped = c.id; RV.Save.save();
        render();
      });
    } else if (canBuyWithCoins) {
      btn.addEventListener('click', function () {
        if (RV.Progress.spendCoins(c.unlock.value)) {
          RV.Progress.unlockCharacter(c.id);
          RV.Audio.sfx.powerup();
          RV.UI.toast(c.name + ' unlocked!', c.color);
          render();
        } else {
          RV.UI.toast('Not enough coins', '#ff6a6a');
        }
      });
    }
    return card;
  }

  function cosmeticCard(item, featuredBadge) {
    var s = RV.Save.get();
    var owned = s.skins.owned.indexOf(item.id) !== -1;
    var equipped = s.skins.equipped[item.cat] === item.id;
    var priceLabel = item.price.coins != null && item.price.coins > 0 ? RV.UI.fmt(item.price.coins) + ' COINS'
      : item.price.gems ? RV.UI.fmt(item.price.gems) + ' GEMS' : 'FREE';
    var card = document.createElement('div');
    card.className = 'item-card rarity-border-' + item.rarity;
    card.innerHTML =
      (featuredBadge ? '<div class="featured-tag">FEATURED</div>' : '') +
      '<div class="item-preview" style="background:linear-gradient(160deg,' + item.color + ',#0a0e16)"></div>' +
      '<div class="item-name">' + item.name + '</div>' +
      '<div class="item-rarity rarity-' + item.rarity + '">' + item.rarity.toUpperCase() + '</div>' +
      (owned
        ? '<button class="item-btn ' + (equipped ? 'owned-btn' : 'buy-btn') + '">' + (equipped ? 'EQUIPPED' : 'EQUIP') + '</button>'
        : '<div class="item-btn-row">' +
            '<button class="item-btn preview-btn">PREVIEW</button>' +
            '<button class="item-btn buy-btn">BUY — ' + priceLabel + '</button>' +
          '</div>');

    var previewBtn = card.querySelector('.preview-btn');
    if (previewBtn) previewBtn.addEventListener('click', function () { RV.Audio.sfx.click(); openPreview(item); });

    var btn = card.querySelector('.buy-btn, .owned-btn');
    if (owned && !equipped) {
      btn.addEventListener('click', function () {
        RV.Audio.sfx.click();
        s.skins.equipped[item.cat] = item.id; RV.Save.save();
        render();
      });
    } else if (!owned) {
      btn.addEventListener('click', function () {
        var ok = item.price.gems ? RV.Progress.spendGems(item.price.gems) : RV.Progress.spendCoins(item.price.coins || 0);
        if (ok) {
          RV.Progress.acquireSkin(item.id);
          RV.Audio.sfx.powerup();
          RV.UI.toast(item.name + ' purchased!', item.color);
          render();
        } else {
          RV.UI.toast('Not enough currency', '#ff6a6a');
        }
      });
    }
    return card;
  }

  // ---------- Preview: shows the item on the equipped character, rotatable ----------
  var previewFacing = 0;
  function openPreview(item) {
    previewFacing = 0;
    var card = RV.UI.modal(
      '<div class="levelup-title" style="font-size:16px">' + item.name + '</div>' +
      '<canvas id="previewCanvas" width="240" height="240" class="preview-canvas"></canvas>' +
      '<div class="preview-rotate-row">' +
        '<button class="photo-btn" id="prevRotL">&#8634;</button>' +
        '<button class="photo-btn" id="prevRotR">&#8635;</button>' +
      '</div>' +
      '<button class="menu-btn" id="previewCloseBtn">CLOSE</button>'
    );
    var canvas = card.querySelector('#previewCanvas');
    drawPreview(canvas, item);
    card.querySelector('#prevRotL').addEventListener('click', function () { previewFacing -= 0.5; drawPreview(canvas, item); });
    card.querySelector('#prevRotR').addEventListener('click', function () { previewFacing += 0.5; drawPreview(canvas, item); });
    card.querySelector('#previewCloseBtn').addEventListener('click', function () { RV.Audio.sfx.click(); RV.UI.closeModal(); });
  }

  function drawPreview(canvas, item) {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var grad = ctx.createRadialGradient(120, 190, 10, 120, 190, 120);
    grad.addColorStop(0, 'rgba(124,77,255,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var s = RV.Save.get();
    var charDef = RV.Data.getCharacter(s.characters.equipped) || RV.Data.CHARACTERS[0];
    var outfitColor = item.cat === 'outfit' ? item.color : (RV.Data.getShopItem(s.skins.equipped.outfit) || {}).color;

    var fakePlayer = {
      x: 0, z: 0, facing: previewFacing, radius: 0.55, hp: 3, maxHp: 3, character: charDef,
      dashTimer: 0, swipeTimer: 0, jumpTimer: 0, invulnTimer: 0, abilityCooldown: 1, abilityActiveTimer: 0,
      status: { shieldTimer: 0, speedTimer: 0, magnetTimer: item.cat === 'effect' ? 1 : 0, multiplierTimer: 0, multiplierValue: 1, slowedTimer: 0, secondChance: false }
    };
    var project = function () { return { x: 120, y: 190, scale: 2.6, cull: false }; };
    RV.Player.draw(ctx, fakePlayer, project, { outfitColor: outfitColor });

    if (item.cat === 'trail') {
      ctx.strokeStyle = item.color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = 120 - i * 14 * Math.cos(previewFacing);
        var b = 190 + 10 + i * 10;
        ctx.lineTo(a, b);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  RV.ShopScreen = { build: build };
})(window.RV || (window.RV = {}));
