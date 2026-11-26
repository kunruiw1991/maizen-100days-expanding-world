/* ============================================================================
   js/models.js — Authentic 3D Voxel Models: JJ, Mikey, Banana Buddy, Mobs & Dragon
   ============================================================================ */
(function (root) {
  'use strict';

  function makeFaceCanvas(drawFn) {
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

  function createMaizenAvatar(kind) {
    const g = new THREE.Group();
    const m = (col) => new THREE.MeshLambertMaterial({ color: col });

    let headMat, bodyColor, armColor, legColor, shoeColor;
    if (kind === 'jj') {
      // JJ: Red hoodie, white inner shirt, brown hair, cyan eyes, purple sneakers!
      const jjFace = makeFaceCanvas((ctx) => {
        ctx.fillStyle = '#f3cba5'; ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#5c3a21'; ctx.fillRect(0, 0, 16, 6);
        ctx.fillRect(0, 6, 3, 3); ctx.fillRect(13, 6, 3, 3);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(3, 8, 4, 3); ctx.fillRect(9, 8, 4, 3);
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(4, 8, 2, 3); ctx.fillRect(10, 8, 2, 3);
      });
      headMat = [m(0x5c3a21), m(0x5c3a21), m(0x5c3a21), m(0xf3cba5), new THREE.MeshLambertMaterial({ map: jjFace }), m(0x5c3a21)];
      bodyColor = 0xdc2626;
      armColor = 0xdc2626;
      legColor = 0x1f2937;
      shoeColor = 0xa855f7;
    } else if (kind === 'mikey') {
      // Mikey: Green turtle with yellow-gold belly shell & happy red-tongue face!
      const mikeyFace = makeFaceCanvas((ctx) => {
        ctx.fillStyle = '#22c55e'; ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#111827'; ctx.fillRect(2, 7, 2, 2); ctx.fillRect(12, 7, 2, 2);
        ctx.fillRect(5, 9, 6, 3);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(8, 10, 3, 2);
      });
      headMat = [m(0x22c55e), m(0x22c55e), m(0x22c55e), m(0x22c55e), new THREE.MeshLambertMaterial({ map: mikeyFace }), m(0x16a34a)];
      bodyColor = 0x22c55e;
      armColor = 0x22c55e;
      legColor = 0x16a34a;
      shoeColor = 0x15803d;
    } else {
      // Banana Buddy: Bright yellow blocky companion with happy red-tongue face!
      const budFace = makeFaceCanvas((ctx) => {
        ctx.fillStyle = '#facc15'; ctx.fillRect(0, 0, 16, 16);
        ctx.fillStyle = '#111827'; ctx.fillRect(2, 7, 2, 2); ctx.fillRect(12, 7, 2, 2);
        ctx.fillRect(5, 9, 6, 3);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(8, 10, 3, 2);
      });
      headMat = [m(0xfacc15), m(0xfacc15), m(0xfacc15), m(0xfacc15), new THREE.MeshLambertMaterial({ map: budFace }), m(0xeab308)];
      bodyColor = 0xfacc15;
      armColor = 0xfacc15;
      legColor = 0xeab308;
      shoeColor = 0xca8a04;
    }

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), headMat);
    head.position.y = 1.66;
    g.add(head);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.72, 0.34), m(bodyColor));
    torso.position.y = 0.98;
    g.add(torso);

    // JJ white undershirt strip or Mikey yellow turtle belly shell
    if (kind === 'jj') {
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.36), m(0xf8fafc));
      shirt.position.y = 0.98;
      g.add(shirt);
    } else if (kind === 'mikey') {
      const belly = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.37), m(0xeab308));
      belly.position.y = 0.98;
      g.add(belly);
    }

    // Dynamic Armor Overlay (visible at Gear Tier >= 1!)
    const armorMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const armorChest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.74, 0.4), armorMat);
    armorChest.position.y = 0.98;
    armorChest.visible = false;
    g.add(armorChest);

    const armorHelm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.24, 0.68), armorMat);
    armorHelm.position.y = 1.9;
    armorHelm.visible = false;
    g.add(armorHelm);

    // Arms & Legs (articulated pivots)
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, 0.24), m(armColor));
    armL.position.set(-0.42, 0.98, 0);
    g.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.42, 1.24, 0);
    const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.68, 0.24), m(armColor));
    armRMesh.position.y = -0.26;
    armR.add(armRMesh);

    // Held Tool / Sword in right hand!
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
    const toolGroup = new THREE.Group();
    toolGroup.position.set(0, -0.54, 0.32);
    toolGroup.rotation.x = 0.65;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), m(0x78350f));
    toolGroup.add(handle);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.58, 0.07), bladeMat);
    blade.position.y = 0.44;
    toolGroup.add(blade);
    armR.add(toolGroup);
    g.add(armR);

    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.62, 0.26), m(legColor));
    legL.position.set(-0.16, 0.31, 0);
    g.add(legL);
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.16, 0.28), m(shoeColor));
    shoeL.position.set(-0.16, 0.08, 0);
    g.add(shoeL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.62, 0.26), m(legColor));
    legR.position.set(0.16, 0.31, 0);
    g.add(legR);
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.16, 0.28), m(shoeColor));
    shoeR.position.set(0.16, 0.08, 0);
    g.add(shoeR);

    g.userData = {
      kind,
      armL,
      armR,
      legL,
      legR,
      armorChest,
      armorHelm,
      armorMat,
      bladeMat,
      setGearTier(tier) {
        const colors = [0xa16207, 0xcbd5e1, 0x38bdf8, 0xc084fc];
        const col = colors[Math.max(0, Math.min(3, tier))];
        bladeMat.color.setHex(col);
        armorMat.color.setHex(col);
        armorChest.visible = tier >= 1;
        armorHelm.visible = tier >= 2;
      }
    };
    return g;
  }

  function createAnimal(kind) {
    const g = new THREE.Group();
    const col = kind === 'sheep' ? 0xf8fafc : (kind === 'cow' ? 0x5c3a21 : 0xf472b6);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.65, 1.15), new THREE.MeshLambertMaterial({ color: col }));
    body.position.y = 0.65;
    g.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: kind === 'sheep' ? 0xe5d3b3 : col }));
    head.position.set(0, 0.9, 0.72);
    g.add(head);
    for (const [lx, lz] of [[-0.25, -0.35], [0.25, -0.35], [-0.25, 0.35], [0.25, 0.35]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), new THREE.MeshLambertMaterial({ color: 0x3f2e21 }));
      leg.position.set(lx, 0.2, lz);
      g.add(leg);
    }
    g.userData = { kind };
    return g;
  }

  function createHostileMob(kind) {
    const g = new THREE.Group();
    if (kind === 'blaze') {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      head.position.y = 1.6;
      g.add(head);
      const rods = new THREE.Group();
      rods.position.y = 1.1;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const rod = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
        rod.position.set(Math.cos(ang) * 0.7, (i % 2) * 0.25, Math.sin(ang) * 0.7);
        rods.add(rod);
      }
      g.add(rods);
      g.userData = { kind: 'blaze', rods, hp: 30, reward: 'blazeRod' };
    } else if (kind === 'enderman') {
      const mat = new THREE.MeshLambertMaterial({ color: 0x111318 });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), mat);
      head.position.y = 2.65;
      g.add(head);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.05), eyeMat);
      eyeL.position.set(-0.18, 2.66, 0.33);
      const eyeR = eyeL.clone();
      eyeR.position.x = 0.18;
      g.add(eyeL, eyeR);
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.32), mat);
      torso.position.y = 1.85;
      g.add(torso);
      for (const x of [-0.42, 0.42]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 0.14), mat);
        arm.position.set(x, 1.6, 0);
        g.add(arm);
      }
      for (const x of [-0.15, 0.15]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), mat);
        leg.position.set(x, 0.7, 0);
        g.add(leg);
      }
      g.userData = { kind: 'enderman', hp: 35, reward: 'enderPearl' };
    } else {
      // Creeper!
      const cMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62), cMat);
      head.position.y = 1.55;
      g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.88, 0.34), cMat);
      body.position.y = 0.82;
      g.add(body);
      const feet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.56), new THREE.MeshLambertMaterial({ color: 0x15803d }));
      feet.position.y = 0.19;
      g.add(feet);
      g.userData = { kind: 'creeper', hp: 25, reward: 'diamond' };
    }
    return g;
  }

  function createEnderDragon() {
    const g = new THREE.Group();
    const dark = new THREE.MeshLambertMaterial({ color: 0x14131c });
    const spineMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe879f9 });

    // Massive blocky body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 5.2), dark);
    g.add(body);

    // Neck & Snout Head
    const neck = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 2.2), dark);
    neck.position.set(0, 0.4, 3.3);
    g.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.9), dark);
    head.position.set(0, 0.6, 4.9);
    g.add(head);
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.1), eyeMat);
    eyeL.position.set(-0.45, 0.78, 5.88);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.45;
    g.add(eyeL, eyeR);

    // Tail segments
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.9 - i * 0.12, 0.85 - i * 0.1, 1.2), dark);
      seg.position.set(0, 0.1, -3.2 - i * 1.15);
      g.add(seg);
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.5), spineMat);
      fin.position.set(0, 0.6, -3.2 - i * 1.15);
      g.add(fin);
    }

    // Articulated Flapping Wings!
    const wingL = new THREE.Group();
    wingL.position.set(-1.1, 0.6, 0.5);
    const wingLMesh = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.18, 3.2), new THREE.MeshLambertMaterial({ color: 0x1e1b2e }));
    wingLMesh.position.set(-3.4, 0, -0.4);
    wingL.add(wingLMesh);
    g.add(wingL);

    const wingR = new THREE.Group();
    wingR.position.set(1.1, 0.6, 0.5);
    const wingRMesh = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.18, 3.2), new THREE.MeshLambertMaterial({ color: 0x1e1b2e }));
    wingRMesh.position.set(3.4, 0, -0.4);
    wingR.add(wingRMesh);
    g.add(wingR);

    g.userData = { wingL, wingR, kind: 'ender_dragon' };
    return g;
  }

  const EXPORT = { createMaizenAvatar, createAnimal, createHostileMob, createEnderDragon };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXPORT;
  } else {
    root.MaizenModels = EXPORT;
  }
})(typeof window !== 'undefined' ? window : globalThis);
