/* ============================================================================
   js/main.js — 60 FPS Three.js Engine, Companion AI, Expanding World & Pill HUD
   ============================================================================ */
(function (root) {
  'use strict';

  const { ERAS } = root.MaizenData;
  const { VoxelAudio } = root.MaizenAudio;
  const { ExpandingWorldState } = root.MaizenState;
  const { createTextures } = root.MaizenTextures;
  const models = root.MaizenModels;
  const { VoxelWorld } = root.MaizenWorld;

  const state = new ExpandingWorldState(ERAS);
  const audio = new VoxelAudio();

  // DOM References
  const canvas = document.getElementById('game-canvas');
  const btnGallery = document.getElementById('btn-gallery');
  const btnExpandDay = document.getElementById('btn-expand-day');
  const dayCounter = document.getElementById('day-counter');
  const borderSize = document.getElementById('border-size');
  const dimBtns = Array.from(document.querySelectorAll('.dim-btn'));
  const resWood = document.getElementById('res-wood');
  const resDiamond = document.getElementById('res-diamond');
  const resEye = document.getElementById('res-eye');
  const hpVal = document.getElementById('hp-val');
  const btnSound = document.getElementById('btn-sound');
  const icoSoundOn = btnSound.querySelector('.ico-sound-on');
  const icoSoundOff = btnSound.querySelector('.ico-sound-off');
  const btnReset = document.getElementById('btn-reset');
  const resetConfirm = document.getElementById('reset-confirm');
  const btnResetYes = document.getElementById('btn-reset-yes');
  const btnResetNo = document.getElementById('btn-reset-no');
  const bossBar = document.getElementById('boss-bar');
  const bossFill = document.getElementById('boss-fill');
  const crystalBadge = document.getElementById('crystal-badge');
  const toastEl = document.getElementById('toast');
  const hotbarBtns = Array.from(document.querySelectorAll('.hotbar-pill .tool-btn'));
  const tierDot = document.getElementById('tier-dot');
  const galleryOverlay = document.getElementById('gallery-overlay');
  const galleryBackdrop = document.getElementById('gallery-backdrop');
  const btnGalleryClose = document.getElementById('btn-gallery-close');
  const galleryGrid = document.getElementById('gallery-grid');

  // Touch controls
  const stickBase = document.getElementById('stick-base');
  const stickKnob = document.getElementById('stick-knob');
  const btnTouchJump = document.getElementById('btn-touch-jump');
  const btnTouchAct = document.getElementById('btn-touch-act');

  // Three.js Setup
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 220);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x3b485c, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfffbeb, 0.95);
  sun.position.set(18, 32, 16);
  scene.add(sun);

  const tex = createTextures();
  const world = new VoxelWorld(scene, tex, models);

  // Create Star Trio: JJ (Player), Mikey (Turtle Companion), Banana Buddy (Yellow Companion)!
  const jj = models.createMaizenAvatar('jj');
  const mikey = models.createMaizenAvatar('mikey');
  const buddy = models.createMaizenAvatar('buddy');
  scene.add(jj, mikey, buddy);

  const player = {
    x: 0,
    y: 0,
    z: 0.7,
    vy: 0,
    yaw: 0,
    swingTimer: 0
  };
  mikey.position.set(0.85, 0, 0.15);
  buddy.position.set(-0.85, 0, -0.35);

  // Camera orbit parameters (framed cleanly like thumbnail on Day 1!)
  const camOrbit = {
    yaw: 0.36,
    pitch: 0.42,
    dist: 7.4,
    dragging: false,
    downX: 0,
    downY: 0,
    moved: false
  };

  // Floating 3D particles for mining, expanding, crystal shatter & victory fireworks
  const fxList = [];
  function spawnBurst(x, y, z, colorHex, count) {
    const geo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < (count || 12); i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      scene.add(m);
      fxList.push({
        mesh: m,
        vx: (Math.random() - 0.5) * 8,
        vy: 3 + Math.random() * 6,
        vz: (Math.random() - 0.5) * 8,
        life: 0.65 + Math.random() * 0.45
      });
    }
  }

  let toastTimer = null;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1400);
  }

  function hideResetConfirm() {
    resetConfirm.classList.add('hidden');
    btnReset.classList.remove('hidden');
  }

  function syncCharactersToState() {
    jj.userData.setGearTier(state.gearTier);
    mikey.userData.setGearTier(Math.max(0, state.gearTier - 1));
    buddy.userData.setGearTier(state.gearTier);
  }

  function moveTrioToEraLandmark(idx) {
    const spawns = [
      { x: 0, z: 0.7, yaw: 0.36, pitch: 0.42, dist: 7.4 },       // Day 1: Sky Pillar
      { x: 0, z: 2.2, yaw: 0.28, pitch: 0.44, dist: 12.5 },      // Day 11: Village & Animal Ranch
      { x: -7.5, z: -6.2, yaw: 0.45, pitch: 0.42, dist: 10.5 },  // Day 40: Diamond Mine & Trial
      { x: 11.2, z: 12.6, yaw: -0.75, pitch: 0.42, dist: 9.8 },  // Day 56: Bookshelf Enchanting & Grinder
      { x: 0, z: 2.2, yaw: 0.25, pitch: 0.38, dist: 14.5 },      // Day 61: Nether Blazes & Endermen
      { x: 17.5, z: -8.5, yaw: 0.18, pitch: 0.38, dist: 12.0 },  // Day 95: Woodland Mansion Red Carpet
      { x: 0, z: 15.2, yaw: 0.25, pitch: 0.46, dist: 10.5 },     // Day 99: Stronghold End Portal
      { x: 0, z: 6.5, yaw: 0.18, pitch: 0.24, dist: 16.5 }       // Day 100: The End + Ender Dragon!
    ];
    const sp = spawns[Math.max(0, Math.min(spawns.length - 1, idx))];
    player.x = sp.x;
    player.z = sp.z;
    player.y = 0;
    mikey.position.set(sp.x + 1.0, 0, sp.z - 0.5);
    buddy.position.set(sp.x - 1.0, 0, sp.z - 0.5);
    camOrbit.yaw = sp.yaw;
    camOrbit.pitch = sp.pitch;
    camOrbit.dist = sp.dist;
  }

  function adjustCameraForEra() {
    moveTrioToEraLandmark(state.eraIndex);
  }

  function syncUI() {
    const era = state.getCurrentEra();
    dayCounter.textContent = `D${String(state.day).padStart(2, '0')}`;
    borderSize.textContent = state.dimension === 'overworld'
      ? `${state.overworldRadius * 2 + 1}×${state.overworldRadius * 2 + 1}`
      : (state.dimension === 'nether' ? 'NETHER' : 'END');

    dimBtns.forEach((b) => b.classList.toggle('active', b.dataset.dim === state.dimension));
    resWood.textContent = state.inv.wood;
    resDiamond.textContent = state.inv.diamond;
    resEye.textContent = state.inv.eyeOfEnder;
    hpVal.textContent = state.hp;
    tierDot.textContent = String(state.gearTier);

    btnSound.classList.toggle('active-soft', state.soundEnabled);
    btnSound.setAttribute('aria-pressed', String(state.soundEnabled));
    icoSoundOn.classList.toggle('hidden', !state.soundEnabled);
    icoSoundOff.classList.toggle('hidden', state.soundEnabled);

    hotbarBtns.forEach((b) => {
      if (b.dataset.slot === 'expand') return;
      b.classList.toggle('active', b.dataset.slot === state.activeSlot);
    });

    // Boss bar only visible in The End!
    if (state.dimension === 'end' && !state.dragonDefeated) {
      bossBar.classList.remove('hidden');
      bossFill.style.width = `${Math.round((state.dragonHp / state.dragonMaxHp) * 100)}%`;
      crystalBadge.textContent = `🔮 ${state.endCrystalsRemaining}`;
    } else {
      bossBar.classList.add('hidden');
    }

    world.rebuild(state);
    syncCharactersToState();
    renderGallery();
  }

  function renderGallery() {
    galleryGrid.innerHTML = '';
    ERAS.forEach((era, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'era-card';
      btn.style.background = era.gradient;
      btn.setAttribute('aria-label', era.label);
      if (idx === state.eraIndex) btn.classList.add('active');
      btn.innerHTML = `
        <span class="era-day-badge">DAY ${era.day}</span>
        <span class="era-emoji" aria-hidden="true">${era.emoji}</span>
        <span class="era-size">${era.borderLabel}</span>
      `;
      btn.addEventListener('click', () => {
        audio.unlock();
        audio.play('expand');
        state.goToEra(idx);
        player.x = 0; player.z = state.dimension === 'end' ? 8 : 0.7; player.y = 0;
        adjustCameraForEra();
        galleryOverlay.classList.add('hidden');
        showToast(`${era.emoji} DAY ${era.day}`);
        spawnBurst(player.x, 1.8, player.z, 0xfacc15, 16);
        syncUI();
      });
      galleryGrid.appendChild(btn);
    });
  }

  /* ==========================================================================
     INTERACTIVE ACTIONS (Mine, Fight, Upgrade, Portal, Crystals & Dragon Boss!)
     ========================================================================== */
  function performPrimaryAction(targetObj) {
    audio.unlock();
    player.swingTimer = 0.25;

    // Direct raycasted object interaction
    if (targetObj && targetObj.userData) {
      const ud = targetObj.userData;
      if (ud.action === 'mine') {
        state.mineResource(ud.resource || 'wood', ud.amount || 1);
        audio.play(ud.resource === 'diamond' ? 'diamond' : 'mine');
        spawnBurst(targetObj.position.x, targetObj.position.y + 0.6, targetObj.position.z, ud.resource === 'diamond' ? 0x38bdf8 : 0xfacc15, 10);
        showToast(`${ud.label || '⛏️'} +${ud.amount || 1}`);
        syncUI();
        return;
      }
      if (ud.action === 'upgrade') {
        const up = state.upgradeGear();
        audio.play('upgrade');
        spawnBurst(player.x, 1.5, player.z, 0xc084fc, 16);
        showToast(up.upgraded ? `🛡️ TIER ${up.tier}` : '✨ MAX GEAR');
        syncUI();
        return;
      }
      if (ud.action === 'portal') {
        audio.play('portal');
        state.setDimension(ud.destination);
        player.x = 0; player.z = ud.destination === 'end' ? 8 : 1; player.y = 0;
        adjustCameraForEra();
        showToast(ud.destination === 'end' ? '🐉 THE END' : (ud.destination === 'nether' ? '🔥 NETHER' : '🌳 OVERWORLD'));
        syncUI();
        return;
      }
      if (ud.action === 'fight') {
        audio.play('sword');
        spawnBurst(targetObj.position.x, targetObj.position.y + 1.2, targetObj.position.z, 0xf97316, 12);
        const reward = ud.reward || 'diamond';
        state.mineResource(reward, 1);
        showToast(reward === 'blazeRod' ? '🔥 +1' : (reward === 'enderPearl' ? '🟢 +1' : '💎 +1'));
        syncUI();
        return;
      }
      if (ud.action === 'crystal') {
        if (state.destroyEndCrystal()) {
          audio.play('crystal');
          spawnBurst(targetObj.position.x, targetObj.position.y, targetObj.position.z, 0xf0abfc, 22);
          showToast(`🔮 ${state.endCrystalsRemaining}/4`);
          syncUI();
        }
        return;
      }
      if (ud.action === 'dragon') {
        const res = state.hitEnderDragon(36);
        audio.play(res.defeated ? 'victory' : 'dragonHit');
        if (world.dragon) {
          spawnBurst(world.dragon.position.x, world.dragon.position.y, world.dragon.position.z, res.defeated ? 0xfacc15 : 0xe879f9, res.defeated ? 42 : 16);
        }
        showToast(res.defeated ? '🏆 DAY 100 VICTORY!' : `⚔️ -${res.damage}`);
        syncUI();
        return;
      }
    }

    // Smart fallback action when tapping ground or pressing Action button
    if (state.dimension === 'end') {
      if (state.endCrystalsRemaining > 0 && world.crystals.length > 0) {
        performPrimaryAction(world.crystals[0]);
      } else if (world.dragon && !state.dragonDefeated) {
        performPrimaryAction(world.dragon);
      }
      return;
    }

    if (state.dimension === 'nether' && world.mobs.length > 0) {
      // Strike closest Nether mob (Blaze / Enderman)
      let best = world.mobs[0];
      let bestD = Infinity;
      for (const mob of world.mobs) {
        const d = Math.hypot(mob.position.x - player.x, mob.position.z - player.z);
        if (d < bestD) { bestD = d; best = mob; }
      }
      performPrimaryAction(best);
      return;
    }

    // Overworld contextual gather/mine
    if (state.overworldRadius >= 12) {
      state.mineResource('diamond', 1);
      audio.play('diamond');
      spawnBurst(player.x, 1.2, player.z, 0x38bdf8, 10);
      showToast('💎 +1');
    } else {
      state.mineResource('wood', 1);
      audio.play('mine');
      spawnBurst(player.x, 1.2, player.z, 0xb45309, 8);
      showToast('🪵 +1');
    }
    syncUI();
  }

  function triggerExpandWorld() {
    audio.unlock();
    const res = state.expandWorldNextEra();
    if (res.expanded) {
      audio.play('expand');
      player.x = 0; player.z = res.era.dimension === 'end' ? 8 : 0.7; player.y = 0;
      adjustCameraForEra();
      spawnBurst(0, 2, 0, 0x4ade80, 24);
      showToast(`🌍 DAY ${res.era.day} · ${res.era.borderLabel}`);
    } else {
      // Already Day 100: jump right into the Ender Dragon fight or trigger Victory strike!
      if (state.dimension !== 'end') {
        state.setDimension('end');
        adjustCameraForEra();
      }
      showToast('🐉 DAY 100');
    }
    syncUI();
  }

  /* ==========================================================================
     INPUT: KEYBOARD, POINTER ORBIT/RAYCAST & IPAD TOUCH THUMBSTICK
     ========================================================================== */
  const keys = new Set();
  window.addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (e.code === 'Space') {
      if (player.y <= 0.02) player.vy = 6.8;
    } else if (e.code === 'KeyE') {
      triggerExpandWorld();
    } else if (e.code === 'Digit1') { state.activeSlot = 'pickaxe'; syncUI(); }
    else if (e.code === 'Digit2') { state.activeSlot = 'sword'; syncUI(); }
    else if (e.code === 'Digit3') { performPrimaryAction({ userData: { action: 'upgrade' } }); }
    else if (e.code === 'Digit4') {
      const nextDim = state.dimension === 'overworld' ? (state.day >= 99 ? 'end' : 'nether') : (state.dimension === 'nether' ? 'end' : 'overworld');
      performPrimaryAction({ userData: { action: 'portal', destination: nextDim } });
    } else if (e.code === 'Digit5') {
      if (state.eatGoldenApple()) { audio.play('apple'); showToast('🍎 ❤️10'); syncUI(); }
    } else if (e.code === 'Escape') {
      galleryOverlay.classList.add('hidden');
      hideResetConfirm();
    }
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  canvas.addEventListener('pointerdown', (e) => {
    audio.unlock();
    hideResetConfirm();
    camOrbit.dragging = true;
    camOrbit.downX = e.clientX;
    camOrbit.downY = e.clientY;
    camOrbit.moved = false;
  });

  window.addEventListener('pointermove', (e) => {
    if (!camOrbit.dragging) return;
    const dx = e.clientX - camOrbit.downX;
    const dy = e.clientY - camOrbit.downY;
    if (Math.hypot(dx, dy) > 6) camOrbit.moved = true;
    camOrbit.yaw -= dx * 0.0065;
    camOrbit.pitch = Math.max(0.18, Math.min(1.18, camOrbit.pitch + dy * 0.0055));
    camOrbit.downX = e.clientX;
    camOrbit.downY = e.clientY;
  });

  window.addEventListener('pointerup', (e) => {
    if (!camOrbit.dragging) return;
    camOrbit.dragging = false;
    if (!camOrbit.moved && e.target === canvas) {
      // Crisp tap/click on 3D world -> raycast against interactables!
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(world.interactables, true);
      if (hits.length > 0) {
        let obj = hits[0].object;
        while (obj && (!obj.userData || !obj.userData.action) && obj.parent) obj = obj.parent;
        performPrimaryAction(obj);
      } else {
        performPrimaryAction(null);
      }
    }
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    camOrbit.dist = Math.max(5.5, Math.min(28, camOrbit.dist + e.deltaY * 0.01));
  }, { passive: false });

  // Virtual Thumbstick for iPad / Mobile
  const stick = { active: false, dx: 0, dy: 0 };
  stickBase.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    stick.active = true;
    stickBase.setPointerCapture(e.pointerId);
  });
  stickBase.addEventListener('pointermove', (e) => {
    if (!stick.active) return;
    const r = stickBase.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const rx = Math.max(-32, Math.min(32, e.clientX - cx));
    const ry = Math.max(-32, Math.min(32, e.clientY - cy));
    stick.dx = rx / 32;
    stick.dy = ry / 32;
    stickKnob.style.transform = `translate(${rx}px, ${ry}px)`;
  });
  const resetStick = () => {
    stick.active = false;
    stick.dx = 0;
    stick.dy = 0;
    stickKnob.style.transform = 'translate(0, 0)';
  };
  stickBase.addEventListener('pointerup', resetStick);
  stickBase.addEventListener('pointercancel', resetStick);
  btnTouchJump.addEventListener('click', () => { if (player.y <= 0.02) player.vy = 6.8; });
  btnTouchAct.addEventListener('click', () => performPrimaryAction(null));

  /* ==========================================================================
     TOOLBAR & HOTBAR HANDLERS
     ========================================================================== */
  btnExpandDay.addEventListener('click', triggerExpandWorld);
  btnGallery.addEventListener('click', () => galleryOverlay.classList.remove('hidden'));
  btnGalleryClose.addEventListener('click', () => galleryOverlay.classList.add('hidden'));
  galleryBackdrop.addEventListener('click', () => galleryOverlay.classList.add('hidden'));

  dimBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.unlock();
      audio.play('portal');
      state.setDimension(btn.dataset.dim);
      player.x = 0; player.z = btn.dataset.dim === 'end' ? 8 : 0.7; player.y = 0;
      adjustCameraForEra();
      syncUI();
    });
  });

  hotbarBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const slot = btn.dataset.slot;
      audio.unlock();
      if (slot === 'expand') {
        triggerExpandWorld();
        return;
      }
      if (slot === 'upgrade') {
        performPrimaryAction({ userData: { action: 'upgrade' } });
        return;
      }
      if (slot === 'eye') {
        const dest = state.dimension === 'overworld' ? (state.day >= 95 ? 'end' : 'nether') : (state.dimension === 'nether' ? 'end' : 'overworld');
        performPrimaryAction({ userData: { action: 'portal', destination: dest } });
        return;
      }
      if (slot === 'apple') {
        if (state.eatGoldenApple()) {
          audio.play('apple');
          spawnBurst(player.x, 1.5, player.z, 0xfacc15, 14);
          showToast('🍎 ❤️10');
          syncUI();
        }
        return;
      }
      state.activeSlot = slot;
      audio.play('mine');
      syncUI();
    });
  });

  btnSound.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    audio.setEnabled(state.soundEnabled);
    syncUI();
  });

  btnReset.addEventListener('click', () => {
    btnReset.classList.add('hidden');
    resetConfirm.classList.remove('hidden');
  });
  btnResetNo.addEventListener('click', hideResetConfirm);
  btnResetYes.addEventListener('click', () => {
    hideResetConfirm();
    state.reset(true);
    player.x = 0; player.z = 0.7; player.y = 0;
    adjustCameraForEra();
    showToast('🌱 DAY 1');
    syncUI();
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ==========================================================================
     60 FPS GAME LOOP
     ========================================================================== */
  let lastTs = 0;
  let elapsed = 0;

  function tick(ts) {
    const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    elapsed += dt;

    // Movement (camera-relative WASD + virtual stick)
    let inX = stick.dx;
    let inZ = stick.dy;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) inX -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) inX += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) inZ -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) inZ += 1;

    const moving = Math.hypot(inX, inZ) > 0.08;
    if (moving) {
      const len = Math.hypot(inX, inZ);
      inX /= len; inZ /= len;
      const spd = 7.2;
      const sinY = Math.sin(camOrbit.yaw);
      const cosY = Math.cos(camOrbit.yaw);
      const wx = inX * cosY + inZ * sinY;
      const wz = -inX * sinY + inZ * cosY;
      player.x += wx * spd * dt;
      player.z += wz * spd * dt;
      player.yaw = Math.atan2(wx, wz);

      // Clamp cleanly inside current Expanding World Border!
      const limit = (state.dimension === 'overworld' ? state.overworldRadius : (state.dimension === 'nether' ? 16 : 15)) - 0.65;
      player.x = Math.max(-limit, Math.min(limit, player.x));
      player.z = Math.max(-limit, Math.min(limit, player.z));
    }

    // Jump gravity
    player.vy -= 18 * dt;
    player.y = Math.max(0, player.y + player.vy * dt);
    if (player.y === 0) player.vy = 0;

    // Animate JJ
    jj.position.set(player.x, player.y, player.z);
    jj.rotation.y = player.yaw;
    const walkPhase = moving ? Math.sin(elapsed * 12) * 0.55 : 0;
    jj.userData.legL.rotation.x = walkPhase;
    jj.userData.legR.rotation.x = -walkPhase;
    if (player.swingTimer > 0) {
      player.swingTimer = Math.max(0, player.swingTimer - dt);
      jj.userData.armR.rotation.x = -Math.sin((player.swingTimer / 0.25) * Math.PI) * 1.4;
    } else {
      jj.userData.armR.rotation.x = -walkPhase * 0.6;
    }

    // Animate Mikey & Banana Buddy companions smoothly following JJ!
    const targets = [
      { rig: mikey, ox: 0.95, oz: -0.65 },
      { rig: buddy, ox: -0.95, oz: -0.85 }
    ];
    for (const c of targets) {
      const tx = player.x + c.ox;
      const tz = player.z + c.oz;
      const dx = tx - c.rig.position.x;
      const dz = tz - c.rig.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.25) {
        c.rig.position.x += dx * Math.min(1, dt * 4.2);
        c.rig.position.z += dz * Math.min(1, dt * 4.2);
        c.rig.rotation.y = Math.atan2(dx, dz);
        const w = Math.sin(elapsed * 11) * 0.45;
        c.rig.userData.legL.rotation.x = w;
        c.rig.userData.legR.rotation.x = -w;
      } else {
        c.rig.rotation.y = player.yaw;
        c.rig.userData.legL.rotation.x = 0;
        c.rig.userData.legR.rotation.x = 0;
      }
      c.rig.position.y = Math.abs(Math.sin(elapsed * 3.5 + c.ox)) * 0.08;
    }

    // Animate Mobs, Spinning End Crystals & Swooping 3D Ender Dragon!
    for (const mob of world.mobs) {
      if (mob.userData.rods) {
        mob.userData.rods.rotation.y += dt * 3.2;
        mob.position.y = 0.6 + Math.sin(elapsed * 3 + mob.position.x) * 0.35;
      }
    }
    for (const cry of world.crystals) {
      cry.rotation.y += dt * 2.4;
      cry.rotation.x += dt * 1.1;
    }
    if (world.dragon) {
      const ang = elapsed * 0.65;
      const rx = Math.sin(ang) * 7.5;
      const rz = -5.5 + Math.cos(ang) * 4.2;
      world.dragon.position.set(rx, 5.4 + Math.sin(elapsed * 2.2) * 1.1, rz);
      world.dragon.rotation.y = Math.atan2(Math.cos(ang) * 7.5, -Math.sin(ang) * 4.2);
      const flap = Math.sin(elapsed * 7.5) * 0.55;
      world.dragon.userData.wingL.rotation.z = flap;
      world.dragon.userData.wingR.rotation.z = -flap;
    }

    // Update 3D burst particles
    for (let i = fxList.length - 1; i >= 0; i--) {
      const f = fxList[i];
      f.life -= dt;
      if (f.life <= 0) {
        scene.remove(f.mesh);
        fxList.splice(i, 1);
        continue;
      }
      f.vy -= 14 * dt;
      f.mesh.position.x += f.vx * dt;
      f.mesh.position.y += f.vy * dt;
      f.mesh.position.z += f.vz * dt;
      f.mesh.rotation.x += dt * 6;
      f.mesh.scale.setScalar(Math.max(0.05, f.life));
    }

    // Smooth 3rd-person orbit camera tracking JJ
    const lookY = state.dimension === 'end' ? 3.2 : 1.4;
    const cx = player.x + Math.sin(camOrbit.yaw) * Math.cos(camOrbit.pitch) * camOrbit.dist;
    const cy = player.y + 1.6 + Math.sin(camOrbit.pitch) * camOrbit.dist;
    const cz = player.z + Math.cos(camOrbit.yaw) * Math.cos(camOrbit.pitch) * camOrbit.dist;
    camera.position.set(cx, cy, cz);
    camera.lookAt(player.x, player.y + lookY, player.z);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  // Expose clean inspection API for Playwright E2E
  root.__GAME__ = {
    state,
    ERAS,
    syncUI,
    goToEra: (idx) => {
      state.goToEra(idx);
      player.x = 0;
      player.z = state.dimension === 'end' ? 8 : 0.7;
      player.y = 0;
      adjustCameraForEra();
      syncUI();
    },
    performAction: () => performPrimaryAction(null),
    expandWorld: triggerExpandWorld
  };

  syncUI();
  requestAnimationFrame(tick);
})(window);
