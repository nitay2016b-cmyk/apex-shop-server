/* RUSHVERSE - Data/GameData.js
   Static game-design data: characters, shop catalog, maps, missions pool,
   achievements, daily rewards, chest tables. Pure data, no logic. */
(function (RV) {
  'use strict';

  var RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
  var RARITY_COLOR = {
    common: '#9aa5b1', uncommon: '#5fd97a', rare: '#4fa8ff',
    epic: '#b968ff', legendary: '#ffb23e', mythic: '#ff5ec8'
  };

  var CHARACTERS = [
    {
      id: 'rush', name: 'RUSH', rarity: 'common',
      desc: 'The balanced starter. Reliable in every arena.',
      color: '#00e5ff', accent: '#7dfcff',
      unlock: { type: 'default' },
      ability: { id: 'surge', name: 'SURGE', desc: 'Brief burst of speed and reduced incoming damage.', cooldown: 9000, duration: 2200 }
    },
    {
      id: 'dasher', name: 'DASHER', rarity: 'uncommon',
      desc: 'Built for one thing: getting out of the way, instantly.',
      color: '#ffce45', accent: '#fff3c0',
      unlock: { type: 'level', value: 5 },
      ability: { id: 'blink', name: 'BLINK DASH', desc: 'Instant long-range dash with brief invulnerability.', cooldown: 6000, duration: 300 }
    },
    {
      id: 'shock', name: 'SHOCK', rarity: 'rare',
      desc: 'Crackles with static. Clears crowds in a flash.',
      color: '#7dff5a', accent: '#d6ffb0',
      unlock: { type: 'coins', value: 3000 },
      ability: { id: 'shockwave', name: 'SHOCKWAVE', desc: 'Electric pulse that stuns and damages nearby enemies.', cooldown: 11000, duration: 400 }
    },
    {
      id: 'frost', name: 'FROST', rarity: 'epic',
      desc: 'Turns the whole arena to ice, and slows it down.',
      color: '#7ad9ff', accent: '#e8fbff',
      unlock: { type: 'level', value: 10 },
      ability: { id: 'frostfield', name: 'FROST FIELD', desc: 'Slows all nearby enemies and obstacles for a few seconds.', cooldown: 13000, duration: 4000 }
    },
    {
      id: 'magnet', name: 'MAGNET', rarity: 'epic',
      desc: 'Never leaves a coin behind.',
      color: '#ff7ad1', accent: '#ffd6ef',
      unlock: { type: 'coins', value: 6000 },
      ability: { id: 'magnetpulse', name: 'MAGNET PULSE', desc: 'Pulls every coin on screen toward you.', cooldown: 12000, duration: 3000 }
    },
    {
      id: 'phantom', name: 'PHANTOM', rarity: 'legendary',
      desc: 'Half in this world, half out of it.',
      color: '#c79bff', accent: '#efe0ff',
      unlock: { type: 'level', value: 18 },
      ability: { id: 'phase', name: 'PHASE', desc: 'Become briefly invincible and pass through obstacles.', cooldown: 15000, duration: 2500 }
    }
  ];

  var MAPS = [
    {
      id: 'neon_city', name: 'NEON CITY',
      desc: 'A futuristic skyline soaked in neon light.',
      unlock: { type: 'default' },
      palette: { sky1: '#0a0620', sky2: '#1b0f3d', floor1: '#160b33', floor2: '#2a1660', grid: '#7a3bff', glow: '#ff3bd6', ambient: '#5f2bff' },
      musicKey: 'neon', obstaclePool: ['laser', 'movingWall', 'spinner'], hazardTint: '#ff3bd6'
    },
    {
      id: 'desert_run', name: 'DESERT RUN',
      desc: 'Endless dunes, rolling boulders and biting sandstorms.',
      unlock: { type: 'level', value: 3 },
      palette: { sky1: '#2b1405', sky2: '#7a3d12', floor1: '#3a1d08', floor2: '#8a5220', grid: '#ffb85c', glow: '#ffe08a', ambient: '#ff9a3c' },
      musicKey: 'desert', obstaclePool: ['boulder', 'sandTrap', 'fallingRock'], hazardTint: '#ffb85c'
    },
    {
      id: 'frozen_lab', name: 'FROZEN LAB',
      desc: 'A cryo-research facility gone cold and hostile.',
      unlock: { type: 'level', value: 7 },
      palette: { sky1: '#04121c', sky2: '#0d3350', floor1: '#082438', floor2: '#144a68', grid: '#7fe7ff', glow: '#bdfbff', ambient: '#3fd6ff' },
      musicKey: 'frozen', obstaclePool: ['electricZone', 'slideFloor', 'frostTrap'], hazardTint: '#7fe7ff'
    },
    {
      id: 'sky_city', name: 'SKY CITY',
      desc: 'A city suspended above the clouds.',
      unlock: { type: 'level', value: 12 },
      palette: { sky1: '#0c1f3d', sky2: '#3a68a8', floor1: '#16305a', floor2: '#5c8fd6', grid: '#ffffff', glow: '#ffe9a8', ambient: '#9fd0ff' },
      musicKey: 'sky', obstaclePool: ['fallingRock', 'movingWall', 'door'], hazardTint: '#ffffff'
    },
    {
      id: 'volcano_core', name: 'VOLCANO CORE',
      desc: 'The molten heart of the world. Nowhere is safe to stand.',
      unlock: { type: 'level', value: 16 },
      palette: { sky1: '#1a0503', sky2: '#5c0f08', floor1: '#260a05', floor2: '#7a1c0a', grid: '#ff5a1f', glow: '#ffcf3e', ambient: '#ff3d0a' },
      musicKey: 'volcano', obstaclePool: ['lava', 'fallingRock', 'door', 'spinner'], hazardTint: '#ff5a1f'
    }
  ];

  // Shop catalog: characters are unlocked via CHARACTERS above (progression/coins), the
  // shop sells cosmetics only, so nothing here is pay-to-win.
  var SHOP_ITEMS = [
    { id: 'outfit_default', cat: 'outfit', name: 'Recruit', rarity: 'common', price: { coins: 0 }, color: '#8fa5c0' },
    { id: 'outfit_crimson', cat: 'outfit', name: 'Crimson Guard', rarity: 'uncommon', price: { coins: 800 }, color: '#ff4d5e' },
    { id: 'outfit_azure', cat: 'outfit', name: 'Azure Strike', rarity: 'rare', price: { coins: 1600 }, color: '#3ea6ff' },
    { id: 'outfit_gilded', cat: 'outfit', name: 'Gilded Vanguard', rarity: 'epic', price: { gems: 120 }, color: '#ffce45' },
    { id: 'outfit_voidwalker', cat: 'outfit', name: 'Voidwalker', rarity: 'legendary', price: { gems: 260 }, color: '#8a3bff' },
    { id: 'outfit_singularity', cat: 'outfit', name: 'Singularity', rarity: 'mythic', price: { gems: 480 }, color: '#ff5ec8' },

    { id: 'trail_default', cat: 'trail', name: 'None', rarity: 'common', price: { coins: 0 }, color: '#7d8896' },
    { id: 'trail_spark', cat: 'trail', name: 'Spark Trail', rarity: 'uncommon', price: { coins: 600 }, color: '#ffe27a' },
    { id: 'trail_comet', cat: 'trail', name: 'Comet Tail', rarity: 'rare', price: { coins: 1400 }, color: '#7ad9ff' },
    { id: 'trail_inferno', cat: 'trail', name: 'Inferno Trail', rarity: 'epic', price: { gems: 100 }, color: '#ff6a2e' },
    { id: 'trail_aurora', cat: 'trail', name: 'Aurora Trail', rarity: 'legendary', price: { gems: 220 }, color: '#7dffb0' },
    { id: 'trail_quantum', cat: 'trail', name: 'Quantum Ribbon', rarity: 'mythic', price: { gems: 420 }, color: '#c79bff' },

    { id: 'effect_default', cat: 'effect', name: 'None', rarity: 'common', price: { coins: 0 }, color: '#7d8896' },
    { id: 'effect_glowstep', cat: 'effect', name: 'Glow Step', rarity: 'uncommon', price: { coins: 700 }, color: '#5fd9ff' },
    { id: 'effect_shatter', cat: 'effect', name: 'Shatter Burst', rarity: 'rare', price: { coins: 1500 }, color: '#dfe8ff' },
    { id: 'effect_novaring', cat: 'effect', name: 'Nova Ring', rarity: 'epic', price: { gems: 110 }, color: '#ff9ad1' },
    { id: 'effect_starfall', cat: 'effect', name: 'Starfall', rarity: 'legendary', price: { gems: 240 }, color: '#ffe27a' },

    { id: 'emote_default', cat: 'emote', name: 'Wave', rarity: 'common', price: { coins: 0 }, color: '#8fa5c0' },
    { id: 'emote_flex', cat: 'emote', name: 'Flex', rarity: 'uncommon', price: { coins: 400 }, color: '#5fd97a' },
    { id: 'emote_spin', cat: 'emote', name: 'Victory Spin', rarity: 'rare', price: { coins: 900 }, color: '#4fa8ff' },
    { id: 'emote_bow', cat: 'emote', name: 'Royal Bow', rarity: 'epic', price: { gems: 90 }, color: '#b968ff' },
    { id: 'emote_starburst', cat: 'emote', name: 'Starburst', rarity: 'legendary', price: { gems: 200 }, color: '#ffb23e' }
  ];

  var MISSION_POOL = {
    daily: [
      { id: 'coins500', desc: 'Collect {t} Coins', stat: 'coinsThisPeriod', target: 500, reward: { coins: 150 } },
      { id: 'survive3m', desc: 'Survive {t} Seconds in one run', stat: 'bestSurvivalThisPeriod', target: 180, reward: { coins: 200 } },
      { id: 'combo20', desc: 'Reach Combo x{t}', stat: 'bestComboThisPeriod', target: 20, reward: { gems: 8 } },
      { id: 'matches3', desc: 'Complete {t} Matches', stat: 'matchesThisPeriod', target: 3, reward: { coins: 180 } },
      { id: 'ability15', desc: 'Use Ability {t} Times', stat: 'abilityUsesThisPeriod', target: 15, reward: { coins: 150 } },
      { id: 'score10k', desc: 'Get {t} Score in one run', stat: 'bestScoreThisPeriod', target: 10000, reward: { gems: 10 } }
    ],
    weekly: [
      { id: 'coins3000', desc: 'Collect {t} Coins', stat: 'coinsThisPeriod', target: 3000, reward: { coins: 800, gems: 10 } },
      { id: 'matches20', desc: 'Complete {t} Matches', stat: 'matchesThisPeriod', target: 20, reward: { coins: 1000 } },
      { id: 'combo40', desc: 'Reach Combo x{t}', stat: 'bestComboThisPeriod', target: 40, reward: { gems: 25 } },
      { id: 'score50k', desc: 'Get {t} Total Score across runs', stat: 'scoreSumThisPeriod', target: 50000, reward: { gems: 30 } },
      { id: 'enemies100', desc: 'Defeat {t} Enemies', stat: 'enemiesThisPeriod', target: 100, reward: { coins: 900 } }
    ]
  };

  var ACHIEVEMENTS = [
    { id: 'first_run', name: 'FIRST RUN', desc: 'Play your first game.', stat: 'gamesPlayed', target: 1, reward: { coins: 100 } },
    { id: 'coin_master', name: 'COIN MASTER', desc: 'Collect 10,000 coins (lifetime).', stat: 'lifetimeCoins', target: 10000, reward: { gems: 40 } },
    { id: 'combo_king', name: 'COMBO KING', desc: 'Reach Combo x50.', stat: 'bestCombo', target: 50, reward: { gems: 30 } },
    { id: 'speed_demon', name: 'SPEED DEMON', desc: 'Complete a run without taking damage.', stat: 'damagelessWins', target: 1, reward: { gems: 25 } },
    { id: 'legend', name: 'LEGEND', desc: 'Reach Level 50.', stat: 'level', target: 50, reward: { gems: 100 } },
    { id: 'survivor', name: 'SURVIVOR', desc: 'Survive 5 minutes in one run.', stat: 'bestSurvivalMs', target: 300000, reward: { coins: 400 } },
    { id: 'ability_master', name: 'ABILITY MASTER', desc: 'Use abilities 200 times (lifetime).', stat: 'abilityUses', target: 200, reward: { coins: 500 } }
  ];

  var DAILY_REWARDS = [
    { day: 1, type: 'coins', amount: 100 },
    { day: 2, type: 'coins', amount: 150 },
    { day: 3, type: 'gems', amount: 10 },
    { day: 4, type: 'random', amount: 1 },
    { day: 5, type: 'skin', amount: 1 },
    { day: 6, type: 'gems', amount: 20 },
    { day: 7, type: 'chest', amount: 'legendary' }
  ];

  var CHEST_TABLE = {
    common: { coinsMin: 50, coinsMax: 150, gemChance: 0.1, gemMin: 2, gemMax: 5, skinChance: 0.05 },
    rare: { coinsMin: 150, coinsMax: 350, gemChance: 0.25, gemMin: 5, gemMax: 12, skinChance: 0.12 },
    epic: { coinsMin: 300, coinsMax: 600, gemChance: 0.5, gemMin: 10, gemMax: 25, skinChance: 0.25 },
    legendary: { coinsMin: 600, coinsMax: 1200, gemChance: 0.9, gemMin: 25, gemMax: 60, skinChance: 0.5 }
  };

  var LEVEL_UNLOCK_TABLE = {
    3: 'Map: DESERT RUN unlocked',
    5: 'Character: DASHER unlocked',
    7: 'Map: FROZEN LAB unlocked',
    10: 'Character: FROST unlocked',
    12: 'Map: SKY CITY unlocked',
    16: 'Map: VOLCANO CORE unlocked',
    18: 'Character: PHANTOM unlocked'
  };

  function xpForLevel(level) {
    return Math.round(120 * Math.pow(level, 1.42) + 80);
  }

  RV.Data = {
    RARITY: RARITY,
    RARITY_COLOR: RARITY_COLOR,
    CHARACTERS: CHARACTERS,
    MAPS: MAPS,
    SHOP_ITEMS: SHOP_ITEMS,
    MISSION_POOL: MISSION_POOL,
    ACHIEVEMENTS: ACHIEVEMENTS,
    DAILY_REWARDS: DAILY_REWARDS,
    CHEST_TABLE: CHEST_TABLE,
    LEVEL_UNLOCK_TABLE: LEVEL_UNLOCK_TABLE,
    xpForLevel: xpForLevel,
    getCharacter: function (id) { return CHARACTERS.filter(function (c) { return c.id === id; })[0]; },
    getMap: function (id) { return MAPS.filter(function (m) { return m.id === id; })[0]; },
    getShopItem: function (id) { return SHOP_ITEMS.filter(function (s) { return s.id === id; })[0]; }
  };
})(window.RV || (window.RV = {}));
