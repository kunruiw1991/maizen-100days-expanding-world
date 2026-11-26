/* ============================================================================
   js/data.js — 8 Iconic 100-Day Expanding World Eras from youtu.be/t5wy_OsuMvM
   ============================================================================ */
(function (root) {
  'use strict';

  const ERAS = [
    {
      id: 'era_pillar',
      index: 0,
      day: 1,
      borderRadius: 2, // 3x3 starting sky pillar around spawn
      borderLabel: '3×3',
      dimension: 'overworld',
      emoji: '🌱',
      gradient: 'linear-gradient(135deg, #38bdf8 0%, #22c55e 100%)',
      timestamp: '00:20',
      label: 'Day 1 · 1-Block Sky Pillar'
    },
    {
      id: 'era_village',
      index: 1,
      day: 11,
      borderRadius: 7,
      borderLabel: '15×15',
      dimension: 'overworld',
      emoji: '🏘️',
      gradient: 'linear-gradient(135deg, #4ade80 0%, #ca8a04 100%)',
      timestamp: '07:10',
      label: 'Day 11 · Village & Animal Ranch'
    },
    {
      id: 'era_diamonds',
      index: 2,
      day: 40,
      borderRadius: 12,
      borderLabel: '25×25',
      dimension: 'overworld',
      emoji: '💎',
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #334155 100%)',
      timestamp: '19:40',
      label: 'Day 40 · Diamond Mine & Copper Trial'
    },
    {
      id: 'era_enchant',
      index: 3,
      day: 56,
      borderRadius: 16,
      borderLabel: '33×33',
      dimension: 'overworld',
      emoji: '📖',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #b45309 100%)',
      timestamp: '25:15',
      label: 'Day 56 · Sky Mob Grinder & Enchanting'
    },
    {
      id: 'era_nether',
      index: 4,
      day: 61,
      borderRadius: 18,
      borderLabel: 'NETHER',
      dimension: 'nether',
      emoji: '🔥',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #0d9488 100%)',
      timestamp: '28:20',
      label: 'Day 61 · Nether Blazes & Endermen'
    },
    {
      id: 'era_mansion',
      index: 5,
      day: 95,
      borderRadius: 22,
      borderLabel: '45×45',
      dimension: 'overworld',
      emoji: '🏰',
      gradient: 'linear-gradient(135deg, #78350f 0%, #991b1b 100%)',
      timestamp: '35:40',
      label: 'Day 95 · Desert Temple & Woodland Mansion'
    },
    {
      id: 'era_stronghold',
      index: 6,
      day: 99,
      borderRadius: 25,
      borderLabel: '51×51',
      dimension: 'overworld',
      emoji: '👁️',
      gradient: 'linear-gradient(135deg, #059669 0%, #1e293b 100%)',
      timestamp: '38:15',
      label: 'Day 100 · Eye of Ender & Stronghold Portal'
    },
    {
      id: 'era_dragon',
      index: 7,
      day: 100,
      borderRadius: 24,
      borderLabel: 'THE END',
      dimension: 'end',
      emoji: '🐉',
      gradient: 'linear-gradient(135deg, #7e22ce 0%, #111827 100%)',
      timestamp: '39:30',
      label: 'Day 100 · Slay the Ender Dragon!'
    }
  ];

  const GEAR_TIERS = [
    { tier: 0, name: 'Wood', color: '#a16207', swordDamage: 12, armorBonus: 0, costDiamond: 0 },
    { tier: 1, name: 'Iron', color: '#cbd5e1', swordDamage: 20, armorBonus: 2, costDiamond: 0 },
    { tier: 2, name: 'Diamond', color: '#38bdf8', swordDamage: 32, armorBonus: 4, costDiamond: 4 },
    { tier: 3, name: 'Enchanted Diamond', color: '#c084fc', swordDamage: 48, armorBonus: 6, costDiamond: 6 }
  ];

  const EXPORT = { ERAS, GEAR_TIERS };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXPORT;
  } else {
    root.MaizenData = EXPORT;
  }
})(typeof window !== 'undefined' ? window : globalThis);
