/* ============================================================================
   js/state.js — Deterministic 100-Day Expanding World State Machine
   Unit-testable in Node.js and browser; manages world border, gear, dimensions & boss
   ============================================================================ */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'maizen_100days_expanding_v1';

  class ExpandingWorldState {
    constructor(eras, storage) {
      this.eras = eras || (root.MaizenData && root.MaizenData.ERAS) || [];
      this.storage = storage !== undefined ? storage : (typeof localStorage !== 'undefined' ? localStorage : null);
      this.reset(false);
    }

    reset(shouldSave) {
      this.eraIndex = 0;
      this.day = 1;
      this.dimension = 'overworld'; // 'overworld' | 'nether' | 'end'
      this.overworldRadius = 2; // Expands up to 25 (51x51 island!)
      this.hp = 10;
      this.maxHp = 10;
      this.gearTier = 0; // 0: Wood, 1: Iron, 2: Diamond, 3: Enchanted Diamond
      this.activeSlot = 'pickaxe';
      this.soundEnabled = true;

      this.inv = {
        wood: 0,
        stone: 0,
        iron: 0,
        diamond: 0,
        blazeRod: 0,
        enderPearl: 0,
        eyeOfEnder: 0,
        goldenApple: 1
      };

      this.endCrystalsRemaining = 4;
      this.dragonHp = 200;
      this.dragonMaxHp = 200;
      this.dragonDefeated = false;

      if (shouldSave !== false) this.save();
    }

    getCurrentEra() {
      return this.eras[this.eraIndex] || this.eras[0];
    }

    /**
     * Jump to any of the 8 iconic 100-day eras (also auto-unlocks authentic world border & baseline gear!)
     */
    goToEra(idx) {
      const clamped = Math.max(0, Math.min(this.eras.length - 1, idx));
      this.eraIndex = clamped;
      const era = this.eras[clamped];
      this.day = era.day;
      this.dimension = era.dimension;

      // Ensure Overworld radius matches at least this era's expansion
      const owEras = this.eras.filter((e, i) => i <= clamped && e.dimension === 'overworld');
      if (owEras.length > 0) {
        const targetRad = Math.max(...owEras.map((e) => e.borderRadius));
        this.overworldRadius = Math.max(this.overworldRadius, targetRad);
      }

      // Authentic progression floor so jumping straight to Nether / Dragon feels balanced!
      if (clamped >= 1) this.inv.wood = Math.max(this.inv.wood, 6);
      if (clamped >= 2) {
        this.gearTier = Math.max(this.gearTier, 1);
        this.inv.diamond = Math.max(this.inv.diamond, 5);
      }
      if (clamped >= 3) {
        this.gearTier = Math.max(this.gearTier, 2);
      }
      if (clamped >= 4) {
        this.gearTier = Math.max(this.gearTier, 3);
      }
      if (clamped >= 5) {
        this.inv.goldenApple = Math.max(this.inv.goldenApple, 3);
      }
      if (clamped >= 6) {
        this.inv.eyeOfEnder = Math.max(this.inv.eyeOfEnder, 4);
      }
      if (clamped === 7 && this.dragonDefeated) {
        // Keep victory state unless reset
      }

      this.save();
      return era;
    }

    /**
     * Advance to next era / expand the world border!
     */
    expandWorldNextEra() {
      if (this.eraIndex + 1 < this.eras.length) {
        const nextEra = this.goToEra(this.eraIndex + 1);
        return { expanded: true, era: nextEra };
      }
      // Already at Day 100
      return { expanded: false, era: this.getCurrentEra() };
    }

    setDimension(dim) {
      if (!['overworld', 'nether', 'end'].includes(dim)) return false;
      this.dimension = dim;
      if (dim === 'nether' && this.day < 61) {
        this.day = 61;
        this.eraIndex = Math.max(this.eraIndex, 4);
        this.overworldRadius = Math.max(this.overworldRadius, 16);
        this.gearTier = Math.max(this.gearTier, 2);
      } else if (dim === 'end') {
        this.day = 100;
        this.eraIndex = 7;
        this.overworldRadius = Math.max(this.overworldRadius, 25);
        this.gearTier = Math.max(this.gearTier, 3);
      }
      this.save();
      return true;
    }

    mineResource(kind, amount) {
      const n = amount || 1;
      if (Object.prototype.hasOwnProperty.call(this.inv, kind)) {
        this.inv[kind] += n;
        // Auto-craft Eyes of Ender whenever player holds both Blaze Rod & Ender Pearl!
        while (this.inv.blazeRod > 0 && this.inv.enderPearl > 0) {
          this.inv.blazeRod -= 1;
          this.inv.enderPearl -= 1;
          this.inv.eyeOfEnder += 2;
        }
        this.save();
        return true;
      }
      return false;
    }

    upgradeGear() {
      if (this.gearTier >= 3) return { upgraded: false, tier: this.gearTier };
      if (this.gearTier === 0 && (this.inv.wood >= 2 || this.day >= 11)) {
        this.gearTier = 1;
        this.save();
        return { upgraded: true, tier: 1 };
      }
      if (this.gearTier === 1 && (this.inv.diamond >= 3 || this.day >= 40)) {
        if (this.inv.diamond >= 3) this.inv.diamond -= 3;
        this.gearTier = 2;
        this.save();
        return { upgraded: true, tier: 2 };
      }
      if (this.gearTier === 2 && (this.inv.diamond >= 2 || this.day >= 56)) {
        if (this.inv.diamond >= 2) this.inv.diamond -= 2;
        this.gearTier = 3;
        this.save();
        return { upgraded: true, tier: 3 };
      }
      // Kid-friendly direct progression: grant +1 tier if enough wood/stone gathered or boost resources
      this.gearTier += 1;
      this.save();
      return { upgraded: true, tier: this.gearTier };
    }

    eatGoldenApple() {
      if (this.inv.goldenApple <= 0 && this.hp >= this.maxHp) return false;
      if (this.inv.goldenApple > 0) this.inv.goldenApple -= 1;
      this.hp = this.maxHp;
      this.save();
      return true;
    }

    destroyEndCrystal() {
      if (this.endCrystalsRemaining <= 0) return false;
      this.endCrystalsRemaining -= 1;
      // Crystal explosion also damages the Dragon!
      this.dragonHp = Math.max(10, this.dragonHp - 18);
      this.save();
      return true;
    }

    hitEnderDragon(baseDamage) {
      if (this.dragonDefeated) return { hit: false, defeated: true };
      const mult = this.endCrystalsRemaining > 0 ? 0.45 : 1.0;
      const tierBonus = 1 + this.gearTier * 0.45;
      const dmg = Math.max(8, Math.round((baseDamage || 24) * mult * tierBonus));
      this.dragonHp = Math.max(0, this.dragonHp - dmg);
      if (this.dragonHp === 0) {
        this.dragonDefeated = true;
      }
      this.save();
      return { hit: true, damage: dmg, defeated: this.dragonDefeated };
    }

    save() {
      if (!this.storage) return false;
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify({
          eraIndex: this.eraIndex,
          day: this.day,
          dimension: this.dimension,
          overworldRadius: this.overworldRadius,
          hp: this.hp,
          gearTier: this.gearTier,
          inv: this.inv,
          endCrystalsRemaining: this.endCrystalsRemaining,
          dragonHp: this.dragonHp,
          dragonDefeated: this.dragonDefeated
        }));
        return true;
      } catch (_) {
        return false;
      }
    }

    load() {
      if (!this.storage) return false;
      try {
        const raw = this.storage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        if (typeof d.eraIndex === 'number') this.eraIndex = Math.max(0, Math.min(this.eras.length - 1, d.eraIndex));
        if (typeof d.day === 'number') this.day = Math.max(1, Math.min(100, d.day));
        if (['overworld', 'nether', 'end'].includes(d.dimension)) this.dimension = d.dimension;
        if (typeof d.overworldRadius === 'number') this.overworldRadius = Math.max(2, Math.min(30, d.overworldRadius));
        if (typeof d.hp === 'number') this.hp = Math.max(1, Math.min(this.maxHp, d.hp));
        if (typeof d.gearTier === 'number') this.gearTier = Math.max(0, Math.min(3, d.gearTier));
        if (d.inv && typeof d.inv === 'object') Object.assign(this.inv, d.inv);
        if (typeof d.endCrystalsRemaining === 'number') this.endCrystalsRemaining = Math.max(0, Math.min(4, d.endCrystalsRemaining));
        if (typeof d.dragonHp === 'number') this.dragonHp = Math.max(0, Math.min(this.dragonMaxHp, d.dragonHp));
        this.dragonDefeated = Boolean(d.dragonDefeated);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  const EXPORT = { ExpandingWorldState, STORAGE_KEY };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXPORT;
  } else {
    root.MaizenState = EXPORT;
  }
})(typeof window !== 'undefined' ? window : globalThis);
