/* RUSHVERSE - Shop/ShopScreen.js
   Five tabs: Characters (unlock via level or coins — never gems-only, so
   nothing here is pay-to-win), Outfits, Trails, Effects, Emotes. Every card
   shows rarity, price and a live BUY / EQUIP / OWNED state. */
(function (RV) {
  'use strict';

  var el;
  var TABS = [
    { id: 'characters', label: 'Characters' },
    { id: 'outfit', label: 'Outfits' },
    { id: 'trail', label: 'Trails' },
    { id: 'effect', label: 'Effects' },
    { id: 'emote', label: 'Emotes' }
  ];
  var activeTab = 'characters';

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

  function render() {
    el.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === activeTab); });
    var grid = el.querySelector('#shopGrid');
    grid.innerHTML = '';
    if (activeTab === 'characters') {
      RV.Data.CHARACTERS.forEach(function (c) { grid.appendChild(characterCard(c)); });
    } else {
      RV.Data.SHOP_ITEMS.filter(function (it) { return it.cat === activeTab; }).forEach(function (it) {
        grid.appendChild(cosmeticCard(it));
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
          s.characters.owned.push(c.id);
          RV.Save.save();
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

  function cosmeticCard(item) {
    var s = RV.Save.get();
    var owned = s.skins.owned.indexOf(item.id) !== -1;
    var equipped = s.skins.equipped[item.cat] === item.id;
    var priceLabel = item.price.coins != null && item.price.coins > 0 ? RV.UI.fmt(item.price.coins) + ' COINS'
      : item.price.gems ? RV.UI.fmt(item.price.gems) + ' GEMS' : 'FREE';
    var card = document.createElement('div');
    card.className = 'item-card rarity-border-' + item.rarity;
    card.innerHTML =
      '<div class="item-preview" style="background:linear-gradient(160deg,' + item.color + ',#0a0e16)"></div>' +
      '<div class="item-name">' + item.name + '</div>' +
      '<div class="item-rarity rarity-' + item.rarity + '">' + item.rarity.toUpperCase() + '</div>' +
      (owned
        ? '<button class="item-btn ' + (equipped ? 'owned-btn' : 'buy-btn') + '">' + (equipped ? 'EQUIPPED' : 'EQUIP') + '</button>'
        : '<button class="item-btn buy-btn">BUY — ' + priceLabel + '</button>');

    var btn = card.querySelector('.item-btn');
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
          s.skins.owned.push(item.id);
          RV.Save.save();
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

  RV.ShopScreen = { build: build };
})(window.RV || (window.RV = {}));
