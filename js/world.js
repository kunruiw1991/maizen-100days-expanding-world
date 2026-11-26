/* ============================================================================
   js/world.js — Dynamic 3D Expanding World Builder (Overworld, Nether, The End)
   Faithfully constructs every iconic Maizen landmark as the World Border expands
   ============================================================================ */
(function (root) {
  'use strict';

  class VoxelWorld {
    constructor(scene, tex, models) {
      this.scene = scene;
      this.tex = tex;
      this.models = models;
      this.worldGroup = new THREE.Group();
      this.scene.add(this.worldGroup);
      this.interactables = []; // clickable/mineable/attackable 3D objects
      this.mobs = [];
      this.crystals = [];
      this.dragon = null;
      this.borderMesh = null;
      this.builtSignature = '';
    }

    _clear() {
      while (this.worldGroup.children.length > 0) {
        this.worldGroup.remove(this.worldGroup.children[0]);
      }
      this.interactables = [];
      this.mobs = [];
      this.crystals = [];
      this.dragon = null;
      this.borderMesh = null;
    }

    _box(w, h, d, mat, x, y, z, meta) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      if (meta) {
        mesh.userData = meta;
        this.interactables.push(mesh);
      }
      this.worldGroup.add(mesh);
      return mesh;
    }

    rebuild(state) {
      const sig = `${state.dimension}:${state.overworldRadius}:${state.endCrystalsRemaining}:${state.dragonDefeated}`;
      if (sig === this.builtSignature) return;
      this.builtSignature = sig;
      this._clear();

      if (state.dimension === 'overworld') {
        this._buildOverworld(state.overworldRadius);
      } else if (state.dimension === 'nether') {
        this._buildNether();
      } else {
        this._buildTheEnd(state);
      }
    }

    _buildWorldBorder(radius, colorHex) {
      const size = radius * 2 + 1;
      const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, 14, size));
      const mat = new THREE.LineDashedMaterial({
        color: colorHex || 0xffffff,
        dashSize: 0.7,
        gapSize: 0.45,
        transparent: true,
        opacity: 0.85
      });
      const lines = new THREE.LineSegments(geo, mat);
      lines.computeLineDistances();
      lines.position.y = 6.5;
      this.borderMesh = lines;
      this.worldGroup.add(lines);
    }

    _buildOverworld(r) {
      this.scene.background = new THREE.Color(0x7cc5ff);
      this.scene.fog = new THREE.Fog(0x7cc5ff, 34, 92);

      const size = r * 2 + 1;
      // Expanding Grass Surface & Deep Sky Pillar Underside!
      this._box(size, 1, size, this.tex.grassBlock, 0, -0.5, 0);
      this._box(size, 3, size, this.tex.dirt, 0, -2.5, 0);
      this._box(Math.max(3, size - 2), 9, Math.max(3, size - 2), this.tex.stone, 0, -8.5, 0);

      // Iconic Fluffy Minecraft Sky Clouds surrounding the floating island (thumb_maxres.jpg!)
      const cloudCoords = [[-16, -3, -14], [18, -4, -12], [-18, -2, 16], [19, -3, 18], [0, 14, -22], [22, 13, 2], [-22, 12, -2]];
      for (const [cx, cy, cz] of cloudCoords) {
        this._box(9, 1.1, 5, this.tex.whiteCloud, cx, cy, cz);
      }

      this._buildWorldBorder(r, 0xffffff);

      // ---- ERA 1 (Day 1 · r >= 2): Starting Pillar Tree, Crafting Table & Furnace ----
      this._buildTree(1.2, 0, -1.2);
      this._box(0.95, 0.95, 0.95, this.tex.crafting, -1.2, 0.48, -1.1, { action: 'upgrade', label: '🛠️' });
      this._box(0.95, 0.95, 0.95, this.tex.stone, -1.2, 0.48, 0.1, { action: 'mine', resource: 'stone', label: '🪨' });

      // ---- ERA 2 (Day 11 · r >= 7): Plains Village Houses, Wheat Farm & Animal Ranch! ----
      if (r >= 7) {
        this._buildVillageHouse(-5.2, 0, -4.8);
        this._buildVillageHouse(5.4, 0, -5.0);
        // Golden Wheat Farm
        this._box(4.2, 0.35, 3.2, this.tex.wheat, -5.2, 0.18, 4.4, { action: 'mine', resource: 'wood', label: '🌾' });
        // Fenced Animal Ranch with Sheep & Cow!
        this._buildRanch(5.2, 0, 4.5);
        this._buildTree(-5.5, 0, 0.5);
        this._buildTree(5.8, 0, 0.5);
      }

      // ---- ERA 3 (Day 40 · r >= 12): Diamond & Redstone Ore Mine + Copper Trial Chamber! ----
      if (r >= 12) {
        // Exposed Diamond & Redstone Mine Outcrop
        for (let i = 0; i < 4; i++) {
          this._box(1.2, 1.2, 1.2, this.tex.diamondOre, -9.8 + i * 1.3, 0.6 + (i % 2) * 0.9, -9.5, {
            action: 'mine', resource: 'diamond', amount: 2, label: '💎'
          });
        }
        this._box(1.3, 1.3, 1.3, this.tex.redstoneOre, -9.8, 0.65, -7.8, {
          action: 'mine', resource: 'diamond', amount: 1, label: '🔴'
        });
        // Copper Trial Chamber Spawner Pavilion (Day 50 in video!)
        this._box(4.2, 3.0, 4.2, this.tex.copperTrial, 9.6, 1.5, -9.5, {
          action: 'mine', resource: 'diamond', amount: 2, label: '🧱'
        });
        const creeper = this.models.createHostileMob('creeper');
        creeper.position.set(8.5, 0, -5.5);
        creeper.userData.action = 'fight';
        this.worldGroup.add(creeper);
        this.mobs.push(creeper);
        this.interactables.push(creeper);
      }

      // ---- ERA 4 (Day 56 · r >= 16): Tall Sky Mob Grinder Tower + Bookshelf Enchanting Room + Nether Portal! ----
      if (r >= 16) {
        // Iconic Towering Cobblestone Sky Mob Grinder (sb0_06!)
        this._box(2.2, 11.5, 2.2, this.tex.stone, -13.5, 5.75, 11.5);
        this._box(7.0, 2.2, 7.0, this.tex.stone, -13.5, 12.2, 11.5, { action: 'upgrade', label: '✨' });

        // Bookshelf Enchanting Room (Day 56!)
        this._box(4.4, 2.0, 0.6, this.tex.bookshelf, 12.5, 1.0, 10.5, { action: 'upgrade', label: '📖' });
        this._box(0.6, 2.0, 4.4, this.tex.bookshelf, 14.4, 1.0, 12.4, { action: 'upgrade', label: '📖' });
        this._box(1.1, 0.85, 1.1, this.tex.obsidian, 12.4, 0.45, 12.4, { action: 'upgrade', label: '📖' });

        // Glowing Purple Obsidian Nether Portal (Day 61!)
        this._buildNetherPortal(0, 0, -14.2, 'nether');
      }

      // ---- ERA 6 (Day 95 · r >= 22): Desert Pyramid + Woodland Mansion with Red Carpet! ----
      if (r >= 22) {
        // Desert Pyramid (Day 71!)
        this._box(6.5, 2.2, 6.5, this.tex.sandstone, -18.5, 1.1, -17.5);
        this._box(4.2, 2.0, 4.2, this.tex.sandstone, -18.5, 3.1, -17.5);
        this._box(2.0, 1.5, 2.0, this.tex.sandstone, -18.5, 4.8, -17.5);
        this._box(1.1, 1.1, 1.1, this.tex.gold, -18.5, 0.6, -13.4, { action: 'mine', resource: 'goldenApple', amount: 2, label: '🍎' });

        // Woodland Mansion with Iconic Red Carpet & Golden Apple Chest (Day 95!)
        this._box(9.5, 6.0, 6.5, this.tex.darkOak, 17.5, 3.0, -17.5);
        this._box(2.4, 0.14, 7.5, this.tex.redCarpet, 17.5, 0.08, -11.5);
        this._box(1.2, 1.0, 1.2, this.tex.gold, 17.5, 0.55, -10.5, { action: 'mine', resource: 'goldenApple', amount: 2, label: '🍎' });
      }

      // ---- ERA 7 (Day 99 · r >= 25): Stronghold End Portal Frame! ----
      if (r >= 25) {
        this._buildEndPortalFrame(0, 0, 19.5);
      }
    }

    _buildTree(x, y, z) {
      this._box(0.85, 3.2, 0.85, this.tex.oakLog, x, y + 1.6, z, { action: 'mine', resource: 'wood', amount: 2, label: '🪵' });
      this._box(2.8, 2.0, 2.8, this.tex.leaves, x, y + 3.8, z, { action: 'mine', resource: 'wood', amount: 1, label: '🍃' });
    }

    _buildVillageHouse(x, y, z) {
      this._box(3.4, 2.6, 3.2, this.tex.oakPlanks, x, y + 1.3, z);
      this._box(4.0, 0.8, 3.8, this.tex.oakLog, x, y + 2.95, z);
    }

    _buildRanch(x, y, z) {
      this._box(4.4, 0.7, 0.25, this.tex.oakPlanks, x, y + 0.35, z - 2.0);
      this._box(4.4, 0.7, 0.25, this.tex.oakPlanks, x, y + 0.35, z + 2.0);
      this._box(0.25, 0.7, 4.2, this.tex.oakPlanks, x - 2.1, y + 0.35, z);
      this._box(0.25, 0.7, 4.2, this.tex.oakPlanks, x + 2.1, y + 0.35, z);
      const sheep = this.models.createAnimal('sheep');
      sheep.position.set(x - 0.8, 0, z);
      const cow = this.models.createAnimal('cow');
      cow.position.set(x + 0.9, 0, z + 0.4);
      cow.rotation.y = -1.2;
      this.worldGroup.add(sheep, cow);
    }

    _buildNetherPortal(x, y, z, destDim) {
      this._box(4.0, 0.9, 1.0, this.tex.obsidian, x, y + 0.45, z);
      this._box(4.0, 0.9, 1.0, this.tex.obsidian, x, y + 5.1, z);
      this._box(0.9, 4.6, 1.0, this.tex.obsidian, x - 1.55, y + 2.75, z);
      this._box(0.9, 4.6, 1.0, this.tex.obsidian, x + 1.55, y + 2.75, z);
      this._box(2.2, 3.8, 0.4, this.tex.portal, x, y + 2.75, z, { action: 'portal', destination: destDim, label: '🌀' });
    }

    _buildEndPortalFrame(x, y, z) {
      this._box(5.6, 0.6, 5.6, this.tex.stone, x, y + 0.3, z);
      const pool = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 0.3, 3.4),
        new THREE.MeshBasicMaterial({ color: 0x091c24 })
      );
      pool.position.set(x, y + 0.55, z);
      pool.userData = { action: 'portal', destination: 'end', label: '🐉' };
      this.worldGroup.add(pool);
      this.interactables.push(pool);

      // Glowing Green Eyes of Ender rim!
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      for (let i = -1; i <= 1; i++) {
        this._box(0.55, 0.45, 0.55, eyeMat, x + i * 1.4, y + 0.72, z - 2.1);
        this._box(0.55, 0.45, 0.55, eyeMat, x + i * 1.4, y + 0.72, z + 2.1);
        this._box(0.55, 0.45, 0.55, eyeMat, x - 2.1, y + 0.72, z + i * 1.4);
        this._box(0.55, 0.45, 0.55, eyeMat, x + 2.1, y + 0.72, z + i * 1.4);
      }
    }

    _buildNether() {
      this.scene.background = new THREE.Color(0x3a0f12);
      this.scene.fog = new THREE.Fog(0x3a0f12, 18, 66);

      // Lava Sea below
      this._box(96, 0.5, 96, this.tex.lava, 0, -4.5, 0);
      // Crimson Netherrack Central Island
      this._box(22, 1.5, 22, this.tex.netherrack, 0, -0.75, 0);
      // Nether Brick Fortress Bridge (left — Blazes!)
      this._box(12, 1.2, 8, this.tex.netherBrick, -12, -0.5, -4);
      this._box(1.5, 6, 1.5, this.tex.netherBrick, -16.5, 3, -7);
      this._box(1.5, 6, 1.5, this.tex.netherBrick, -16.5, 3, -1);

      // Teal Warped Forest Island (right — Endermen!)
      this._box(12, 1.2, 10, this.tex.warpedNylium, 12, -0.5, -2);
      this._box(1.0, 4.2, 1.0, this.tex.warpedNylium, 14, 2.1, -4);
      this._box(3.4, 1.8, 3.4, this.tex.warpedNylium, 14, 4.6, -4);

      this._buildNetherPortal(0, 0, 8.5, 'overworld');
      this._buildWorldBorder(19, 0xf97316);

      // Spawn Blazes & Endermen!
      for (const [bx, bz] of [[-11, -3], [-14, -6]]) {
        const blaze = this.models.createHostileMob('blaze');
        blaze.position.set(bx, 0, bz);
        blaze.userData.action = 'fight';
        this.worldGroup.add(blaze);
        this.mobs.push(blaze);
        this.interactables.push(blaze);
      }
      for (const [ex, ez] of [[10, -2], [14, 1]]) {
        const em = this.models.createHostileMob('enderman');
        em.position.set(ex, 0, ez);
        em.userData.action = 'fight';
        this.worldGroup.add(em);
        this.mobs.push(em);
        this.interactables.push(em);
      }
    }

    _buildTheEnd(state) {
      this.scene.background = new THREE.Color(0x160d24);
      this.scene.fog = new THREE.Fog(0x160d24, 26, 90);

      // Iconic Pale End Stone Island!
      this._box(34, 2.0, 34, this.tex.endStone, 0, -1.0, 0);
      this._buildWorldBorder(17, 0xc084fc);

      // Central Bedrock Fountain / Return Portal
      this._box(4.8, 0.7, 4.8, this.tex.obsidian, 0, 0.35, 0);
      if (state.dragonDefeated) {
        this._box(3.2, 0.4, 3.2, this.tex.portal, 0, 0.7, 0, { action: 'portal', destination: 'overworld', label: '🏆' });
      }

      // 4 Towering Obsidian Pillars + Spinning Magenta End Crystals!
      const pillarCoords = [[-10, -10, 9], [10, -10, 11], [-10, 10, 10], [10, 10, 8]];
      pillarCoords.forEach(([px, pz, ph], idx) => {
        this._box(2.4, ph, 2.4, this.tex.obsidian, px, ph / 2, pz);
        if (idx < state.endCrystalsRemaining) {
          const crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.95),
            new THREE.MeshBasicMaterial({ color: 0xf0abfc, wireframe: false })
          );
          crystal.position.set(px, ph + 1.35, pz);
          crystal.userData = { action: 'crystal', index: idx, label: '🔮' };
          this.worldGroup.add(crystal);
          this.crystals.push(crystal);
          this.interactables.push(crystal);
        }
      });

      // Spawn the Giant 3D Swooping Ender Dragon!
      if (!state.dragonDefeated) {
        const dragon = this.models.createEnderDragon();
        dragon.position.set(0, 11, -8);
        dragon.userData.action = 'dragon';
        this.worldGroup.add(dragon);
        this.dragon = dragon;
        this.interactables.push(dragon);
      }
    }
  }

  const EXPORT = { VoxelWorld };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXPORT;
  } else {
    root.MaizenWorld = EXPORT;
  }
})(typeof window !== 'undefined' ? window : globalThis);
