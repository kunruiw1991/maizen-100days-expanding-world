'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { ERAS, GEAR_TIERS } = require('../js/data.js');
const { ExpandingWorldState, STORAGE_KEY } = require('../js/state.js');

function createMockStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k)
  };
}

test('Data integrity: 8 chronological 100-Day eras & 4 gear tiers', () => {
  assert.equal(ERAS.length, 8);
  assert.equal(GEAR_TIERS.length, 4);
  assert.equal(ERAS[0].day, 1);
  assert.equal(ERAS[ERAS.length - 1].day, 100);
  assert.equal(ERAS[ERAS.length - 1].dimension, 'end');
  for (let i = 1; i < ERAS.length; i++) {
    assert.ok(ERAS[i].day >= ERAS[i - 1].day);
  }
});

test('Full Day 1 -> Day 100 expansion, Nether auto-crafting & Ender Dragon victory', () => {
  const st = new ExpandingWorldState(ERAS, createMockStorage());
  assert.equal(st.day, 1);
  assert.equal(st.overworldRadius, 2);

  // Expand through all eras
  for (let i = 0; i < 7; i++) {
    const res = st.expandWorldNextEra();
    assert.equal(res.expanded, true);
  }
  assert.equal(st.day, 100);
  assert.equal(st.dimension, 'end');
  assert.equal(st.overworldRadius, 25);
  assert.equal(st.gearTier, 3);
  assert.equal(st.expandWorldNextEra().expanded, false);

  // Destroy all 4 End Crystals
  for (let c = 0; c < 4; c++) {
    assert.equal(st.destroyEndCrystal(), true);
  }
  assert.equal(st.endCrystalsRemaining, 0);
  assert.equal(st.destroyEndCrystal(), false);

  // Slay Ender Dragon
  let lastHit = null;
  for (let h = 0; h < 10 && !st.dragonDefeated; h++) {
    lastHit = st.hitEnderDragon(36);
  }
  assert.equal(st.dragonDefeated, true);
  assert.equal(lastHit.defeated, true);
  assert.equal(st.hitEnderDragon(36).hit, false);
});

test('Mining, Eye of Ender auto-craft, gear upgrades & Golden Apple heal', () => {
  const st = new ExpandingWorldState(ERAS, createMockStorage());
  st.mineResource('blazeRod', 2);
  st.mineResource('enderPearl', 2);
  assert.equal(st.inv.eyeOfEnder, 4);
  assert.equal(st.inv.blazeRod, 0);
  assert.equal(st.inv.enderPearl, 0);
  assert.equal(st.mineResource('unknown', 1), false);

  // Upgrade gear 0 -> 3
  assert.equal(st.upgradeGear().tier, 1);
  st.mineResource('diamond', 5);
  assert.equal(st.upgradeGear().tier, 2);
  assert.equal(st.upgradeGear().tier, 3);
  assert.equal(st.upgradeGear().upgraded, false);

  // Golden Apple heal
  st.hp = 4;
  assert.equal(st.eatGoldenApple(), true);
  assert.equal(st.hp, 10);
});

test('Persistence, dimension switching & corrupted JSON guard', () => {
  const storage = createMockStorage();
  const s1 = new ExpandingWorldState(ERAS, storage);
  s1.goToEra(4); // Nether
  assert.equal(s1.dimension, 'nether');
  s1.save();

  const s2 = new ExpandingWorldState(ERAS, storage);
  assert.equal(s2.load(), true);
  assert.equal(s2.dimension, 'nether');
  assert.equal(s2.day, 61);

  assert.equal(s2.setDimension('invalid'), false);
  assert.equal(s2.setDimension('overworld'), true);

  storage.setItem(STORAGE_KEY, '{corrupt');
  assert.equal(s2.load(), false);
});
