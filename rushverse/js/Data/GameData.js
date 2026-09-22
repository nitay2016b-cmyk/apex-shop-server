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
    ],
    season: [
      { id: 'seasonCoins20k', desc: 'Collect {t} Coins this season', stat: 'coinsThisPeriod', target: 20000, reward: { gems: 60 } },
      { id: 'seasonMatches80', desc: 'Complete {t} Matches this season', stat: 'matchesThisPeriod', target: 80, reward: { coins: 3000 } },
      { id: 'seasonBosses5', desc: 'Defeat {t} Bosses this season', stat: 'bossesThisPeriod', target: 5, reward: { gems: 80 } },
      { id: 'seasonCombo60', desc: 'Reach Combo x{t} this season', stat: 'bestComboThisPeriod', target: 60, reward: { gems: 50 } },
      { id: 'seasonScore200k', desc: 'Score {t} total this season', stat: 'scoreSumThisPeriod', target: 200000, reward: { coins: 2500, gems: 20 } }
    ]
  };

  var DAILY_CHALLENGE_POOL = [
    { id: 'ch_score5k', desc: 'Score {t} in one run', stat: 'bestScoreThisPeriod', target: 5000, reward: { coins: 200 } },
    { id: 'ch_coins300', desc: 'Collect {t} Coins', stat: 'coinsThisPeriod', target: 300, reward: { coins: 150 } },
    { id: 'ch_perfectdodge10', desc: 'Perform {t} Perfect Dodges', stat: 'perfectDodgesThisPeriod', target: 10, reward: { gems: 6 } },
    { id: 'ch_nearmiss15', desc: 'Rack up {t} Near Misses', stat: 'nearMissesThisPeriod', target: 15, reward: { coins: 180 } },
    { id: 'ch_survive2m', desc: 'Survive {t} seconds in one run', stat: 'bestSurvivalThisPeriod', target: 120, reward: { coins: 200 } },
    { id: 'ch_combo15', desc: 'Reach Combo x{t}', stat: 'bestComboThisPeriod', target: 15, reward: { gems: 5 } },
    { id: 'ch_ability5', desc: 'Use your Ability {t} times', stat: 'abilityUsesThisPeriod', target: 5, reward: { coins: 120 } },
    { id: 'ch_enemies10', desc: 'Defeat {t} enemies', stat: 'enemiesThisPeriod', target: 10, reward: { coins: 160 } }
  ];

  var QUEST_LINE = [
    { id: 'q1', name: 'MISSION 1', desc: 'Complete your first run.', stat: 'gamesPlayed', target: 1, reward: { coins: 200 } },
    { id: 'q2', name: 'MISSION 2', desc: 'Reach 5,000 Score in one run.', stat: 'bestScore', target: 5000, reward: { coins: 300 } },
    { id: 'q3', name: 'MISSION 3', desc: 'Unlock your first extra Character.', stat: 'charactersOwnedCount', target: 2, reward: { gems: 30 } },
    { id: 'q4', name: 'MISSION 4', desc: 'Defeat a Boss.', stat: 'bossesDefeated', target: 1, reward: { gems: 40 } },
    { id: 'q5', name: 'MISSION 5', desc: 'Reach Combo x50.', stat: 'bestCombo', target: 50, reward: { coins: 500 } }
  ];
  var QUEST_LINE_FINAL_REWARD = { gems: 150, chest: 'legendary' };

  var TITLES = [
    { id: 'rookie', name: 'ROOKIE', unlock: { type: 'default' } },
    { id: 'speedster', name: 'SPEEDSTER', unlock: { stat: 'bestSurvivalMs', target: 120000 } },
    { id: 'coin_master_title', name: 'COIN MASTER', unlock: { stat: 'lifetimeCoins', target: 10000 } },
    { id: 'dodge_king', name: 'DODGE KING', unlock: { stat: 'perfectDodges', target: 50 } },
    { id: 'boss_slayer', name: 'BOSS SLAYER', unlock: { stat: 'bossesDefeated', target: 3 } },
    { id: 'legend_title', name: 'LEGEND', unlock: { stat: 'level', target: 50 } },
    { id: 'mythic_runner', name: 'MYTHIC RUNNER', unlock: { stat: 'bestCombo', target: 75 } }
  ];

  var BADGES = [
    { id: 'badge_first_steps', name: 'First Steps', stat: 'gamesPlayed', target: 1 },
    { id: 'badge_bronze_runner', name: 'Bronze Runner', stat: 'gamesPlayed', target: 25 },
    { id: 'badge_silver_runner', name: 'Silver Runner', stat: 'gamesPlayed', target: 100 },
    { id: 'badge_gold_runner', name: 'Gold Runner', stat: 'gamesPlayed', target: 300 },
    { id: 'badge_combo_apprentice', name: 'Combo Apprentice', stat: 'bestCombo', target: 25 },
    { id: 'badge_combo_master', name: 'Combo Master', stat: 'bestCombo', target: 75 },
    { id: 'badge_dodger', name: 'Untouchable', stat: 'perfectDodges', target: 100 },
    { id: 'badge_boss_hunter', name: 'Boss Hunter', stat: 'bossesDefeated', target: 10 }
  ];

  var AVATARS = [
    { id: 'avatar_default', icon: '\u{1F642}', unlock: { type: 'default' } },
    { id: 'avatar_fox', icon: '\u{1F98A}', unlock: { type: 'level', value: 3 } },
    { id: 'avatar_robot', icon: '\u{1F916}', unlock: { type: 'level', value: 6 } },
    { id: 'avatar_ghost', icon: '\u{1F47B}', unlock: { type: 'level', value: 10 } },
    { id: 'avatar_alien', icon: '\u{1F47D}', unlock: { type: 'level', value: 14 } },
    { id: 'avatar_dragon', icon: '\u{1F409}', unlock: { type: 'level', value: 20 } },
    { id: 'avatar_crown', icon: '\u{1F451}', unlock: { type: 'level', value: 30 } },
    { id: 'avatar_star', icon: '\u{1F31F}', unlock: { type: 'level', value: 40 } }
  ];

  var META_EVENTS = [
    { id: 'coin_rush', label: 'COIN RUSH', desc: 'Coins are worth double all week.', color: '#ffce45',
      missions: [{ id: 'ev_coins2000', desc: 'Collect {t} Coins', stat: 'coinsThisPeriod', target: 2000, reward: { coins: 500 } }] },
    { id: 'double_xp', label: 'DOUBLE XP', desc: 'Earn double XP from every match.', color: '#7ad9ff',
      missions: [{ id: 'ev_matches5', desc: 'Complete {t} Matches', stat: 'matchesThisPeriod', target: 5, reward: { gems: 15 } }] },
    { id: 'boss_week', label: 'BOSS WEEK', desc: 'Boss encounters appear far more often.', color: '#ff2f5f',
      missions: [{ id: 'ev_bosses3', desc: 'Defeat {t} Bosses', stat: 'bossesThisPeriod', target: 3, reward: { gems: 40 } }] },
    { id: 'speed_week', label: 'SPEED WEEK', desc: 'Every arena runs faster from the start.', color: '#7dff5a',
      missions: [{ id: 'ev_survive5m', desc: 'Survive {t}s in one run', stat: 'bestSurvivalThisPeriod', target: 300, reward: { coins: 700 } }] },
    { id: 'neon_night', label: 'NEON NIGHT', desc: 'Neon City glows brighter with bonus events.', color: '#ff3bd6',
      missions: [{ id: 'ev_combo35', desc: 'Reach Combo x{t}', stat: 'bestComboThisPeriod', target: 35, reward: { gems: 20 } }] },
    { id: 'frozen_event', label: 'FROZEN EVENT', desc: 'Frozen Lab hazards spread further.', color: '#bdfbff',
      missions: [{ id: 'ev_score30k', desc: 'Score {t} in one run', stat: 'bestScoreThisPeriod', target: 30000, reward: { coins: 800 } }] }
  ];

  var SEASONS = [
    { id: 1, name: 'SEASON 1: NEON DAWN', durationDays: 28,
      exclusiveMapId: 'neon_city',
      exclusiveSkinIds: ['outfit_season1', 'trail_season1'],
      xpPerLevel: 500, levels: 30 }
  ];

  var BATTLE_PASS_REWARDS = (function () {
    // 30 levels, alternating Free/Premium rewards. Free stays functionally
    // useful (coins/gems/chests); Premium adds cosmetics + bigger currency,
    // never a gameplay-power item, so nothing here is pay-to-win.
    var rows = [];
    for (var lvl = 1; lvl <= 30; lvl++) {
      var free, premium;
      if (lvl % 10 === 0) { free = { chest: 'epic' }; premium = { chest: 'legendary' }; }
      else if (lvl % 5 === 0) { free = { gems: 15 }; premium = { skin: true, gems: 10 }; }
      else if (lvl % 3 === 0) { free = { coins: 200 }; premium = { skin: true }; }
      else { free = { coins: 100 }; premium = { gems: 5, coins: 100 }; }
      rows.push({ level: lvl, xpRequired: lvl * 500, free: free, premium: premium });
    }
    return rows;
  })();

  // Season-exclusive cosmetics referenced by SEASONS[0].exclusiveSkinIds and
  // handed out through the Premium Battle Pass track.
  var SEASON_SHOP_ITEMS = [
    { id: 'outfit_season1', cat: 'outfit', name: 'Neon Dawn Suit', rarity: 'epic', price: { gems: 999999 }, color: '#ff3bd6', seasonal: true },
    { id: 'trail_season1', cat: 'trail', name: 'Neon Dawn Trail', rarity: 'epic', price: { gems: 999999 }, color: '#7ad9ff', seasonal: true }
  ];

  var ACHIEVEMENTS = [
    { id: 'first_run', name: 'FIRST RUN', desc: 'Play your first game.', stat: 'gamesPlayed', target: 1, reward: { coins: 100 } },
    { id: 'coin_master', name: 'COIN MASTER', desc: 'Collect 10,000 coins (lifetime).', stat: 'lifetimeCoins', target: 10000, reward: { gems: 40 } },
    { id: 'combo_king', name: 'COMBO KING', desc: 'Reach Combo x50.', stat: 'bestCombo', target: 50, reward: { gems: 30 } },
    { id: 'speed_demon', name: 'SPEED DEMON', desc: 'Complete a run without taking damage.', stat: 'damagelessWins', target: 1, reward: { gems: 25 } },
    { id: 'legend', name: 'LEGEND', desc: 'Reach Level 50.', stat: 'level', target: 50, reward: { gems: 100 } },
    { id: 'survivor', name: 'SURVIVOR', desc: 'Survive 5 minutes in one run.', stat: 'bestSurvivalMs', target: 300000, reward: { coins: 400 } },
    { id: 'ability_master', name: 'ABILITY MASTER', desc: 'Use abilities 200 times (lifetime).', stat: 'abilityUses', target: 200, reward: { coins: 500 } },
    { id: 'boss_slayer_ach', name: 'BOSS SLAYER', desc: 'Defeat 3 Bosses.', stat: 'bossesDefeated', target: 3, reward: { gems: 35 } },
    { id: 'untouchable_ach', name: 'UNTOUCHABLE', desc: 'Perform 25 Perfect Dodges.', stat: 'perfectDodges', target: 25, reward: { coins: 400 } }
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

  var ALL_SHOP_ITEMS = SHOP_ITEMS.concat(SEASON_SHOP_ITEMS);

  RV.Data = {
    RARITY: RARITY,
    RARITY_COLOR: RARITY_COLOR,
    CHARACTERS: CHARACTERS,
    MAPS: MAPS,
    SHOP_ITEMS: SHOP_ITEMS,
    SEASON_SHOP_ITEMS: SEASON_SHOP_ITEMS,
    MISSION_POOL: MISSION_POOL,
    DAILY_CHALLENGE_POOL: DAILY_CHALLENGE_POOL,
    QUEST_LINE: QUEST_LINE,
    QUEST_LINE_FINAL_REWARD: QUEST_LINE_FINAL_REWARD,
    TITLES: TITLES,
    BADGES: BADGES,
    AVATARS: AVATARS,
    META_EVENTS: META_EVENTS,
    SEASONS: SEASONS,
    BATTLE_PASS_REWARDS: BATTLE_PASS_REWARDS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    DAILY_REWARDS: DAILY_REWARDS,
    CHEST_TABLE: CHEST_TABLE,
    LEVEL_UNLOCK_TABLE: LEVEL_UNLOCK_TABLE,
    xpForLevel: xpForLevel,
    getCharacter: function (id) { return CHARACTERS.filter(function (c) { return c.id === id; })[0]; },
    getMap: function (id) { return MAPS.filter(function (m) { return m.id === id; })[0]; },
    getShopItem: function (id) { return ALL_SHOP_ITEMS.filter(function (s) { return s.id === id; })[0]; },
    getTitle: function (id) { return TITLES.filter(function (t) { return t.id === id; })[0]; },
    getAvatar: function (id) { return AVATARS.filter(function (a) { return a.id === id; })[0]; },
    getSeason: function (id) { return SEASONS.filter(function (s) { return s.id === id; })[0]; },
    getMetaEvent: function (id) { return META_EVENTS.filter(function (e) { return e.id === id; })[0]; }
  };
})(window.RV || (window.RV = {}));
