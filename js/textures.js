/* ============================================================================
   js/textures.js — Crisp 16x16 Pixel-Art Minecraft Voxel Textures (Three.js)
   ============================================================================ */
(function (root) {
  'use strict';

  function makePixelTex(drawFn) {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    drawFn(ctx);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function noiseFill(ctx, palette, seed) {
    let s = seed || 1337;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function createTextures() {
    const grassTop = makePixelTex((ctx) => noiseFill(ctx, ['#5cb83b', '#4fa331', '#65c443', '#47942c'], 11));
    const dirt = makePixelTex((ctx) => noiseFill(ctx, ['#8a5d3b', '#7b5132', '#966642', '#6b4428'], 22));
    const grassSide = makePixelTex((ctx) => {
      noiseFill(ctx, ['#8a5d3b', '#7b5132', '#966642', '#6b4428'], 23);
      for (let x = 0; x < 16; x++) {
        const drop = 3 + ((x * 7 + 3) % 3);
        for (let y = 0; y < drop; y++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#5cb83b' : '#4ca030';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
    const oakLog = makePixelTex((ctx) => {
      noiseFill(ctx, ['#6b4e2e', '#5d4327', '#755633', '#4f3820'], 31);
      for (let x = 2; x < 16; x += 4) {
        ctx.fillStyle = '#47321c';
        ctx.fillRect(x, 0, 1, 16);
      }
    });
    const oakPlanks = makePixelTex((ctx) => {
      noiseFill(ctx, ['#b88d52', '#ad8249', '#c2975a', '#a17740'], 32);
      ctx.fillStyle = '#75532a';
      for (let y = 0; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);
    });
    const leaves = makePixelTex((ctx) => noiseFill(ctx, ['#2f7d24', '#398f2d', '#24661b', '#419c34'], 33));
    const stone = makePixelTex((ctx) => noiseFill(ctx, ['#85898e', '#767a80', '#92969c', '#6c7075'], 41));
    const diamondOre = makePixelTex((ctx) => {
      noiseFill(ctx, ['#7c8086', '#6d7177', '#898d93'], 42);
      ctx.fillStyle = '#38e8ff';
      [[3, 4], [4, 4], [4, 5], [10, 3], [11, 3], [11, 4], [6, 11], [7, 11], [7, 12], [12, 10]].forEach(([x, y]) => {
        ctx.fillRect(x, y, 2, 2);
      });
    });
    const redstoneOre = makePixelTex((ctx) => {
      noiseFill(ctx, ['#7c8086', '#6d7177', '#898d93'], 43);
      ctx.fillStyle = '#ef4444';
      [[3, 3], [9, 5], [5, 10], [11, 11], [8, 8]].forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));
    });
    const obsidian = makePixelTex((ctx) => noiseFill(ctx, ['#181024', '#231636', '#110b1a', '#2e1d47'], 51));
    const portal = makePixelTex((ctx) => noiseFill(ctx, ['#9333ea', '#a855f7', '#7e22ce', '#c084fc'], 52));
    const netherrack = makePixelTex((ctx) => noiseFill(ctx, ['#7a2525', '#691e1e', '#8c2d2d', '#571818'], 61));
    const netherBrick = makePixelTex((ctx) => {
      noiseFill(ctx, ['#3b1b22', '#47212a', '#2e141a'], 62);
      ctx.fillStyle = '#1f0d11';
      for (let y = 0; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);
    });
    const warpedNylium = makePixelTex((ctx) => noiseFill(ctx, ['#14948a', '#1ab3a6', '#0e7870', '#20c4b6'], 63));
    const sandstone = makePixelTex((ctx) => noiseFill(ctx, ['#e2d29b', '#d9c78c', '#eadba8', '#cbb87b'], 71));
    const darkOak = makePixelTex((ctx) => noiseFill(ctx, ['#472d19', '#3b2413', '#52341d'], 72));
    const redCarpet = makePixelTex((ctx) => noiseFill(ctx, ['#b91c1c', '#dc2626', '#991b1b'], 73));
    const bookshelf = makePixelTex((ctx) => {
      ctx.fillStyle = '#a87d44';
      ctx.fillRect(0, 0, 16, 16);
      const bookCols = ['#dc2626', '#2563eb', '#16a34a', '#eab308', '#9333ea'];
      for (const rowY of [2, 9]) {
        ctx.fillStyle = '#3b2413';
        ctx.fillRect(0, rowY, 16, 5);
        for (let x = 1; x < 15; x += 2) {
          ctx.fillStyle = bookCols[(x + rowY) % bookCols.length];
          ctx.fillRect(x, rowY, 2, 5);
        }
      }
    });
    const endStone = makePixelTex((ctx) => noiseFill(ctx, ['#e6e2aa', '#dad596', '#f0ecba', '#ccc786'], 81));
    const copperTrial = makePixelTex((ctx) => {
      noiseFill(ctx, ['#c26b47', '#b45c39', '#39967f', '#2f826d'], 82);
      ctx.strokeStyle = '#5c311f';
      ctx.strokeRect(1, 1, 14, 14);
    });
    const wheat = makePixelTex((ctx) => noiseFill(ctx, ['#eab308', '#ca8a04', '#facc15', '#a16207'], 83));
    const craftingTop = makePixelTex((ctx) => {
      noiseFill(ctx, ['#b88d52', '#a87e46'], 91);
      ctx.fillStyle = '#5c3d1e';
      ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 15, 16, 1);
      ctx.fillRect(0, 0, 1, 16); ctx.fillRect(15, 0, 1, 16);
      ctx.fillRect(5, 1, 1, 14); ctx.fillRect(10, 1, 1, 14);
      ctx.fillRect(1, 5, 14, 1); ctx.fillRect(1, 10, 14, 1);
    });

    const mat = (tex, extra) => new THREE.MeshLambertMaterial(Object.assign({ map: tex }, extra || {}));

    return {
      grassBlock: [
        mat(grassSide), mat(grassSide), mat(grassTop), mat(dirt), mat(grassSide), mat(grassSide)
      ],
      dirt: mat(dirt),
      oakLog: mat(oakLog),
      oakPlanks: mat(oakPlanks),
      leaves: mat(leaves),
      stone: mat(stone),
      diamondOre: mat(diamondOre),
      redstoneOre: mat(redstoneOre),
      obsidian: mat(obsidian),
      portal: new THREE.MeshBasicMaterial({ map: portal, transparent: true, opacity: 0.78 }),
      netherrack: mat(netherrack),
      netherBrick: mat(netherBrick),
      warpedNylium: mat(warpedNylium),
      sandstone: mat(sandstone),
      darkOak: mat(darkOak),
      redCarpet: mat(redCarpet),
      bookshelf: mat(bookshelf),
      endStone: mat(endStone),
      copperTrial: mat(copperTrial),
      wheat: mat(wheat),
      crafting: [mat(oakPlanks), mat(oakPlanks), mat(craftingTop), mat(oakPlanks), mat(oakPlanks), mat(oakPlanks)],
      lava: new THREE.MeshBasicMaterial({ color: 0xff5a1f }),
      gold: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      whiteCloud: new THREE.MeshLambertMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.9 })
    };
  }

  const EXPORT = { createTextures };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXPORT;
  } else {
    root.MaizenTextures = EXPORT;
  }
})(typeof window !== 'undefined' ? window : globalThis);
