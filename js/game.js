// Battle Arena — Core game engine.
// Renders the arena on a canvas, simulates two players, combat, projectiles,
// hazards, rounds and match victory. Exposes window.Battle for main.js.
(function () {
  'use strict';

  // ---- shared helpers -----------------------------------------------------
  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---- Engine state -------------------------------------------------------
  var canvas, ctx, W, H, dpr;
  var keys = {};           // map of physical key -> true
  var players = [null, null];
  var projectiles = [];
  var particles = [];
  var damageNumbers = [];
  var match = null;        // { p1, p2, mapId, winsToWin, roundLength, settings }

  var effectsEnabled = true;

  // ---- settings / persistence ---------------------------------------------
  var DEFAULT_SETTINGS = {
    volume: 0.7,
    effects: true,
    roundLength: 99,
    rounds: 3      // 1, 3, 5, or 99 for endless
  };
  var SETTINGS = null;
  var PROGRESS = null;     // { credits, unlockedChars[], stats }

  function loadSettings() {
    try {
      var s = JSON.parse(localStorage.getItem('battleArena.settings') || 'null');
      SETTINGS = Object.assign({}, DEFAULT_SETTINGS, s || {});
      var p = JSON.parse(localStorage.getItem('battleArena.progress') || 'null');
      PROGRESS = p || { credits: 0, unlocked: [], stats: { matches: 0, wins: 0 } };
    } catch (e) { SETTINGS = Object.assign({}, DEFAULT_SETTINGS); PROGRESS = { credits: 0, unlocked: [], stats: { matches: 0, wins: 0 } }; }
    var ready = [];
    for (var i = 0; i < (window.CHARACTERS || []).length; i++) {
      if (!window.CHARACTERS[i].unlocked || PROGRESS.unlocked.indexOf(window.CHARACTERS[i].id) >= 0) ready.push(window.CHARACTERS[i].id);
    }
    PROGRESS.unlocked = ready;
  }
  function saveSettings() { try { localStorage.setItem('battleArena.settings', JSON.stringify(SETTINGS)); } catch (e) {} }
  function saveProgress() {
    try {
      localStorage.setItem('battleArena.progress', JSON.stringify(PROGRESS));
    } catch (e) {}
  }
  function isUnlocked(id) {
    return (PROGRESS.unlocked || []).indexOf(id) >= 0;
  }
  function addCredits(n) { PROGRESS.credits += n; saveProgress(); }

  // ---- character lookup ---------------------------------------------------
  function charById(id) { return window.CHARACTERS_BY_ID && window.CHARACTERS_BY_ID[id]; }

  // ---- canvas setup -------------------------------------------------------
  function setupCanvas(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }
  function resizeCanvas() {
    if (!canvas) return;
    var cssW = 1000, cssH = 620;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = cssW + 'px';
    W = cssW; H = cssH;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---- input ---------------------------------------------------------------
  var BINDINGS = {
    p1: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'Space', special: 'KeyQ' },
    p2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', attack: 'Enter', special: 'ShiftLeft' }
  };

  function onKeyDown(e) {
    if (e.code === 'Escape' || e.code === 'KeyP') { if (e.code === 'Escape') e.preventDefault(); onPauseToggle(); return; }
    if (e.repeat) return;
    keys[e.code] = true;
    if (e.code === 'Space' || e.code === 'Enter') e.preventDefault();
  }
  function onKeyUp(e) { keys[e.code] = false; }

  function readMovement(p, bind) {
    var dx = 0, dy = 0;
    if (keys[bind.up]) dy -= 1;
    if (keys[bind.down]) dy += 1;
    if (keys[bind.left]) dx -= 1;
    if (keys[bind.right]) dx += 1;
    if (dx !== 0 || dy !== 0) {
      var len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;
    }
    p.inputX = dx; p.inputY = dy;
    p.blocking = !!keys[bind.down];
    p.wantAttack = !!keys[bind.attack];
    p.wantSpecial = !!keys[bind.special];
  }

  // ---- particle helpers ----------------------------------------------------
  function spawnParticles(x, y, color, n, spread) {
    if (!effectsEnabled) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = (0.5 + Math.random() * 1.4) * (spread || 1);
      particles.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.4 + Math.random() * 0.3, max: 0.7, color: color, size: 2 + Math.random() * 3
      });
    }
  }
  function addDamageNumber(x, y, amt, color, crit) {
    damageNumbers.push({ x: x + (Math.random() - 0.5) * 14, y: y - 22, vx: (Math.random() - 0.5) * 40, vy: -60, amt: Math.round(amt), life: 0.8, color: color, crit: crit });
  }

  // ---- physics --------------------------------------------------------------
  function circleRectCollide(cx, cy, r, rect, onIce) {
    var nx = clamp(cx, rect.x, rect.x + rect.w);
    var ny = clamp(cy, rect.y, rect.y + rect.h);
    var dx = cx - nx, dy = cy - ny;
    var distSq = dx * dx + dy * dy;
    if (distSq > r * r) return 0;
    var dist = Math.sqrt(distSq);
    var push = r - dist;
    if (dist === 0) {
      // center inside rect: push along smallest penetration axis
      var left = cx - rect.x, right = rect.x + rect.w - cx, top = cy - rect.y, bot = rect.y + rect.h - cy;
      var m = Math.min(left, right, top, bot);
      if (m === left) { cx = rect.x - r; px = -1; }
      else if (m === right) { cx = rect.x + rect.w + r; px = 1; }
      else if (m === top) { cy = rect.y - r; py = -1; }
      else { cy = rect.y + rect.h + r; py = 1; }
      return 1;
    }
    var nx2 = dx / dist, ny2 = dy / dist;
    if (!onIce) return { nx: nx2, ny: ny2, pushX: nx2 * push, pushY: ny2 * push };
    return { nx: 0, ny: 0, pushX: 0, pushY: 0 }; // on ice: slide rather than bounce
  }

  function resolvePlayerMapCollisions(p, map) {
    var onIce = p.hazardType === 'ice';
    for (var i = 0; i < map.obstacles.length; i++) {
      var o = map.obstacles[i];
      // Expand obstacle by player radius for circle-rect test against center.
      var res = circleRectCollide(p.x, p.y, p.r, { x: o.x - p.r, y: o.y - p.r, w: o.w + p.r * 2, h: o.h + p.r * 2 }, onIce && false);
      if (!res) continue;
      if (res === 1) continue;
      if (!onIce) { p.x += res.pushX; p.y += res.pushY; }
      p.vx = 0; p.vy = 0;
    }
    p.x = clamp(p.x, p.r, map.w - p.r);
    p.y = clamp(p.y, p.r + 20, map.h - p.r);
  }

  function playerOnHazard(p, map) {
    var type = null;
    for (var i = 0; i < map.hazards.length; i++) {
      var hz = map.hazards[i];
      if (p.x + p.r > hz.x && p.x - p.r < hz.x + hz.w && p.y + p.r > hz.y && p.y - p.r < hz.y + hz.h) {
        type = hz.type;
        break;
      }
    }
    p.hazardType = type;
    return type;
  }

  // ---- match setup ----------------------------------------------------------
  function startMatch(cfg) {
    if (!cfg) return;
    var settings = SETTINGS;
    var p1char = charById(cfg.p1) || window.CHARACTERS[0];
    var p2char = charById(cfg.p2) || window.CHARACTERS[1];
    var map = null;
    if (cfg.map) {
      for (var mi = 0; mi < window.MAPS.length; mi++) if (window.MAPS[mi].id === cfg.map) { map = window.MAPS[mi]; break; }
    }
    if (!map) map = window.MAPS[0];

    match = {
      p1char: p1char, p2char: p2char, map: map,
      score1: 0, score2: 0,
      round: 1,
      winsToWin: settings.rounds >= 99 ? 999999 : Math.ceil(settings.rounds / 2),
      endless: settings.rounds >= 99,
      roundLength: settings.roundLength,
      state: 'intro',       // intro -> fight -> roundover -> matchover -> paused
      stateTimer: 0,
      elapsed: 0,
      lastT: performance.now()
    };
    setupRound(match);
  }

  function setupRound(m) {
    var s1 = m.p1char.stats, s2 = m.p2char.stats;
    players[0] = makePlayer(0, m.p1char, m.map.spawns.p1);
    players[1] = makePlayer(1, m.p2char, m.map.spawns.p2);
    projectiles.length = 0;
    particles.length = 0;
    damageNumbers.length = 0;
    m.elapsed = 0;
    m.roundOver = null;
    m.state = 'intro';
    m.stateTimer = 2.0;
    m.introMsg = 'ROUND ' + m.round;
    window.GameAudio && window.GameAudio.play('round');
  }

  function makePlayer(idx, c, spawn) {
    var s = c.stats;
    return {
      idx: idx,
      char: c,
      x: spawn.x, y: spawn.y,
      vx: 0, vy: 0,
      r: 15,
      facing: idx === 0 ? 1 : -1,
      hp: s.maxHealth, maxHp: s.maxHealth,
      blocking: false, wantAttack: false, wantSpecial: false, inputX: 0, inputY: 0,
      attackCd: 0, specialCd: 0,
      invuln: 0,           // invulnerability frames after being hit
      attackAnim: 0,
      onIce: false, hazardType: null,
      hazardTick: 0,
      shieldActive: false, shieldTimer: 0,
      rageTimer: 0, rageMult: 1,
      burning: 0, burnTick: 0,
      flash: 0,
      hitStopUsed: false
    };
  }

  // ---- combat ---------------------------------------------------------------
  function getDamage(p) {
    return p.char.stats.damage * (p.rageTimer > 0 ? 1.5 : 1);
  }

  function attack(p, m) {
    if (p.attackCd > 0) return;
    p.attackCd = p.char.stats.attackSpeed;
    p.attackAnim = 0.22;
    window.GameAudio && window.GameAudio.play(p.char.attackType === 'melee' ? 'attack' : 'shoot');

    if (p.char.attackType === 'melee') {
      // Arc-based melee hit test against opponent
      var ox = p.x, oy = p.y;
      var range = p.char.stats.attackRange;
      var ex = ox + Math.cos(angleOf(p)) * range;
      var ey = oy + Math.sin(angleOf(p)) * range;
      var opp = players[1 - p.idx];
      if (opp.invuln <= 0) {
        var ax = p.x + Math.cos(angleOf(p)) * range / 2;
        var ay = p.y + Math.sin(angleOf(p)) * range / 2;
        var d2 = (opp.x - ax) * (opp.x - ax) + (opp.y - ay) * (opp.y - ay);
        var hitR = range / 2 + opp.r;
        if (d2 < hitR * hitR) {
          applyDamage(opp, getDamage(p), p, true);
        }
      }
    } else {
      // Fire a projectile from in front of the player
      var spd = 340;
      var dxn = Math.cos(angleOf(p)), dyn = Math.sin(angleOf(p));
      if (dxn === 0 && dyn === 0) { dxn = p.facing; dyn = 0; }
      projectiles.push(makeProjectile(p, p.x + dxn * 22, p.y + dyn * 22 - 8, dxn, dyn, spd));
    }
  }

  function angleOf(p) {
    if (p.inputX !== 0 || p.inputY !== 0) {
      p.facing = p.inputX >= 0 ? 1 : -1;
      var a = Math.atan2(p.inputY, p.inputX);
      // store facing as angle for drawing; facing sign for flip
      return a;
    }
    return p.facing >= 0 ? 0 : Math.PI;
  }

  function makeProjectile(owner, x, y, dx, dy, spd) {
    var burning = owner.char.id === 'firemage';
    return {
      ownerIdx: owner.idx, owner: owner,
      x: x, y: y,
      dx: dx || 1, dy: dy || 0,
      speed: spd,
      dmg: burning ? getDamage(owner) * 0.9 : getDamage(owner),
      r: 6,
      life: 1.6,
      color: owner.char.accent || '#ffffff',
      glow: owner.char.attackType === 'ranged' ? owner.char.primary : null,
      burning: burning,
      arc: owner.idx === 0 ? 1 : -1
    };
  }

  function applyDamage(target, amt, source, isMelee) {
    if (target.invuln > 0 || target.specialCd <= 0 && target.shieldActive) return;
    // shield blocks
    if (target.shieldActive) {
      amt *= 0.15;
      window.GameAudio && window.GameAudio.play('block');
      spawnParticles(target.x, target.y, '#bfd9ff', 8, 1.4);
      addDamageNumber(target.x, target.y, Math.round(amt), '#9fd0ff');
      // still knockback but less
      knockback(target, source, amt);
      target.invuln = 0.28;
      return;
    }
    target.hp -= amt;
    target.invuln = 0.45;
    target.flash = 0.22;
    window.GameAudio && window.GameAudio.play('hit');
    spawnParticles(target.x, target.y, '#ff5a5a', 10, 1.2);
    addDamageNumber(target.x, target.y, Math.round(amt), '#ff6a5a', false);
    knockback(target, source, amt);
    if (source && source.burnOnHit) {
      target.burning = 2.5;
    }
  }

  function burnSource(p) {
    return p.char && p.char.id === 'firemage';
  }

  function knockback(target, source, amt) {
    var d = 1;
    if (source) {
      var dx = target.x - source.x, dy = target.y - source.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      d = 1;
    } else {
      d = 1;
    }
    // simple knockback away from source
    if (source) {
      var kx = (target.x - source.x), ky = (target.y - source.y);
      var kl = Math.sqrt(kx * kx + ky * ky) || 1;
      target.vx += (kx / kl) * (90 + amt * 1.5);
      target.vy += (ky / kl) * (90 + amt * 1.5);
    }
  }

  // ---- special abilities -----------------------------------------------------
  function useSpecial(p, m) {
    if (p.specialCd > 0) return;
    p.specialCd = p.char.stats.specialCooldown;
    window.GameAudio && window.GameAudio.play('special');

    var sp = p.char.special;
    if (sp === 'shield') {
      p.shieldActive = true;
      p.shieldTimer = 1.6;
      if (p.char.id === 'paladin') p.hp = Math.min(p.maxHp, p.hp + 12);
      spawnParticles(p.x, p.y, '#9fd0ff', 14, 1.5);
    } else if (sp === 'dash') {
      var d = angleOf(p);
      var ddx = Math.cos(d), ddy = Math.sin(d);
      p.vx = ddx * 620; p.vy = ddy * 620;
      p.invuln = 0.3;
      // damage enemies passed through during dash
      p.dashTeam = 0.3;
      spawnParticles(p.x, p.y, p.char.accent, 12, 1.5);
      window.GameAudio && window.GameAudio.play('dash');
    } else if (sp === 'teleport') {
      var ta = angleOf(p);
      var tx = p.x + Math.cos(ta) * 150, ty = p.y + Math.sin(ta) * 150;
      spawnParticles(p.x, p.y, p.char.accent, 16, 1.8);
      // push out of obstacles/walls
      p.x = clamp(tx, p.r, m.map.w - p.r);
      p.y = clamp(ty, p.r + 20, m.map.h - p.r);
      for (var o = 0; o < m.map.obstacles.length; o++) {
        var ob = m.map.obstacles[o];
        circleRectCollide(p.x, p.y, p.r, ob, false);
      }
      p.invuln = 0.4;
      spawnParticles(p.x, p.y, p.char.accent, 14, 1.8);
      window.GameAudio && window.GameAudio.play('teleport');
    } else if (sp === 'ranged') {
      // powerful single projectile
      var dxn2 = Math.cos(angleOf(p)) || p.facing, dyn2 = Math.sin(angleOf(p));
      var pr = makeProjectile(p, p.x + dxn2 * 22, p.y + dyn2 * 22 - 8, dxn2, dyn2, 520);
      pr.dmg = getDamage(p) * 1.7;
      pr.r = 9;
      pr.special = true;
      projectiles.push(pr);
      window.GameAudio && window.GameAudio.play('shoot');
      // paladin? no.
    } else if (sp === 'rain') {
      // three-arrow spread for archer
      var base = angleOf(p);
      for (var i = -1; i <= 1; i++) {
        var a = base + i * 0.22;
        var pj = makeProjectile(p, p.x + Math.cos(a) * 22, p.y + Math.sin(a) * 22 - 8, Math.cos(a), Math.sin(a), 380);
        pj.dmg = getDamage(p) * 0.8;
        projectiles.push(pj);
      }
      window.GameAudio && window.GameAudio.play('shoot');
    } else if (sp === 'rage') {
      p.rageTimer = 3.0;
      p.rageMult = 1.5;
      spawnParticles(p.x, p.y, '#ff8844', 16, 2);
    }
  }

  // ---- update loop -----------------------------------------------------------
  function update(dt) {
    if (!match || match.state === 'paused' || match.state === 'matchover') return;
    var m = match;

    m.stateTimer -= dt;
    if (m.state === 'intro') {
      updateIdle(dt);
      if (m.stateTimer <= 0) { m.state = 'fight'; m.stateTimer = m.roundLength; }
      return;
    }
    if (m.state === 'roundover') {
      updateIdle(dt);
      if (m.stateTimer <= 0) { advanceAfterRound(); }
      return;
    }

    // fight state (stateTimer already decremented once above — reuse it so the
    // displayed round timer ticks at real speed)
    m.elapsed += dt;
    m.roundTimer = m.stateTimer;

    // read inputs
    readMovement(players[0], BINDINGS.p1);
    readMovement(players[1], BINDINGS.p2);

    for (var pi = 0; pi < 2; pi++) updatePlayer(players[pi], dt, m);

    updateProjectiles(dt, m);
    updateParticles(dt);
    updateDamageNumbers(dt);

    // check round end
    var p1 = players[0], p2 = players[1];
    if (p1.hp <= 0 || p2.hp <= 0) {
      endRound(m, p1.hp === p2.hp ? 0 : (p1.hp > p2.hp ? 1 : 2));
    } else if (m.stateTimer <= 0) {
      endRound(m, p1.hp === p2.hp ? 0 : (p1.hp > p2.hp ? 1 : 2));
    }
  }

  function updateIdle(dt) {
    // keep players animated during intro/roundover
    for (var i = 0; i < 2; i++) {
      var p = players[i];
      if (!p) continue;
      if (p.hazardTick > 0) p.hazardTick -= dt;
      if (p.burning > 0) p.burning -= dt;
    }
  }

  function updatePlayer(p, dt, m) {
    // timers
    if (p.attackCd > 0) p.attackCd -= dt * 1000;
    if (p.specialCd > 0) p.specialCd -= dt * 1000;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.flash > 0) p.flash -= dt;
    if (p.shieldTimer > 0) { p.shieldTimer -= dt; if (p.shieldTimer <= 0) p.shieldActive = false; }
    if (p.rageTimer > 0) { p.rageTimer -= dt; if (p.rageTimer <= 0) p.rageMult = 1; }
    if (p.attackAnim > 0) p.attackAnim -= dt;
    if (p.dashTeam > 0) p.dashTeam -= dt;

    // hazard damage-over-time
    var hz = playerOnHazard(p, m.map);
    if ((hz === 'lava' || hz === 'water') && p.invuln <= 0) {
      if (p.hazardTick <= 0) {
        p.hazardTick = 0.6;
        applyDamage(p, 6, null, false);
        window.GameAudio && window.GameAudio.play('hazard');
        if (p.hp <= 0) return;
      }
    }
    if (hz === 'lava') spawnParticles(p.x, p.y, '#ff7733', 1, 0.8);

    // burn damage over time
    if (p.burning > 0) {
      p.burnTick = (p.burnTick || 0) - dt;
      if (p.burnTick <= 0) {
        p.burnTick = 0.7;
        applyDamage(p, p.char.stats.damage * 0.2, null, false);
        spawnParticles(p.x, p.y, '#ff7733', 3, 0.8);
        window.GameAudio && window.GameAudio.play('hazard');
        if (p.hp <= 0) return;
      }
      p.burning -= dt;
    }

    // friction / movement
    var onIce = hz === 'ice';
    p.onIce = onIce;
    var accel = onIce ? 2600 : 3200;
    var maxSpeed = p.char.stats.speed * (p.rageTimer > 0 ? 1.3 : 1) * (onIce ? 1.6 : 1);
    var friction = onIce ? 0.6 : 7;

    if (p.dashTeam > 0) {
      // dash: keep velocity, low damping
      p.vx *= (1 - Math.min(1, dt * 3));
      p.vy *= (1 - Math.min(1, dt * 3));
    } else {
      p.vx += p.inputX * accel * dt;
      p.vy += p.inputY * accel * dt;
      // cap speed
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp > maxSpeed) { p.vx = p.vx / sp * maxSpeed; p.vy = p.vy / sp * maxSpeed; }
      // friction toward 0
      p.vx *= Math.max(0, 1 - friction * dt);
      p.vy *= Math.max(0, 1 - friction * dt);
      // snap tiny
      if (Math.abs(p.vx) < 0.5) p.vx = 0;
      if (Math.abs(p.vy) < 0.5) p.vy = 0;
    }

    // apply velocity
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    resolvePlayerMapCollisions(p, m.map);

    // attack
    if (p.wantAttack && p.attackCd <= 0) attack(p, m);

    // special
    if (p.wantSpecial && p.specialCd <= 0) useSpecial(p, m);

    // dash out-damage
    if (p.dashTeam > 0) {
      var opp = players[1 - p.idx];
      if (opp && opp.invuln <= 0) {
        var dd = Math.sqrt((opp.x - p.x) ** 2 + (opp.y - p.y) ** 2) || 1;
        if (dd < opp.r + p.r + 8) {
          applyDamage(opp, getDamage(p) * (p.char.special === 'dash' ? 1.3 : 1), p, false);
        }
      }
    }
  }

  function updateProjectiles(dt, m) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var pr = projectiles[i];
      pr.x += pr.dx * pr.speed * dt;
      pr.y += pr.dy * pr.speed * dt;
      pr.life -= dt;
      pr.trailTimer = (pr.trailTimer || 0) - dt;
      if (pr.trailTimer <= 0) {
        pr.trailTimer = 0.03;
        if (effectsEnabled) particles.push({ x: pr.x, y: pr.y, vx: 0, vy: 0, life: 0.25, max: 0.25, color: pr.color, size: 3 });
      }

      var dead = pr.life <= 0 || pr.x < -10 || pr.x > m.map.w + 10 || pr.y < -10 || pr.y > m.map.h + 10;

      // hit walls / obstacles
      for (var o = 0; o < m.map.obstacles.length && !dead; o++) {
        var ob = m.map.obstacles[o];
        if (rectsOverlap(pr.x - pr.r, pr.y - pr.r, pr.r * 2, pr.r * 2, ob.x, ob.y, ob.w, ob.h)) {
          dead = true;
          spawnParticles(pr.x, pr.y, pr.color, 6, 1);
        }
      }

      // hit player (not owner)
      if (!dead) {
        var opp = players[1 - pr.ownerIdx];
        if (opp && opp.invuln <= 0) {
          var ddx = (opp.x - pr.x), ddy = (opp.y - pr.y);
          var dr2 = ddx * ddx + ddy * ddy;
          var rad = opp.r + pr.r;
          if (dr2 < rad * rad) {
            dead = true;
            applyDamage(opp, pr.dmg * (pr.special ? 1.3 : 1), pr.owner, false);
            if (pr.burning) opp.burning = 2.5;
            spawnParticles(pr.x, pr.y, pr.color, 10, 1.1);
          }
        }
      }

      if (dead) projectiles.splice(i, 1);
    }
  }

  function updateParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 40 * dt;
      p.vx *= (1 - dt * 2);
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function updateDamageNumbers(dt) {
    for (var i = damageNumbers.length - 1; i >= 0; i--) {
      var d = damageNumbers[i];
      d.life -= dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 120 * dt;
      if (d.life <= 0) damageNumbers.splice(i, 1);
    }
  }

  // ---- round / match flow -----------------------------------------------------
  function endRound(m, winnerIdx) {
    if (m.roundOver !== null) return;
    // winnerIdx is 1-based player number (1 or 2), or 0 for a draw.
    if (winnerIdx === 0) {
      m.roundOver = -1;
      setupRound(m);
      return;
    }
    m.roundOver = winnerIdx;
    m.state = 'roundover';
    m.stateTimer = 2.4;
    if (winnerIdx === 1) m.score1++;
    else m.score2++;
    addCredits(10);
    window.GameAudio && window.GameAudio.play('victory');
  }

  function advanceAfterRound() {
    var m = match;
    var matchWon = false;
    if (!m.endless) {
      matchWon = (m.score1 >= m.winsToWin || m.score2 >= m.winsToWin);
    }
    if (matchWon) {
      finishMatch(m, m.score1 > m.score2 ? 1 : 2);
      return;
    }
    m.round++;
    setupRound(m);
  }

  function finishMatch(m, winnerIdx) {
    m.state = 'matchover';
    m.overallWinner = winnerIdx;
    window.GameAudio && window.GameAudio.play(winnerIdx === 1 ? 'victory' : 'defeat');
    PROGRESS.stats.matches++;
    if (winnerIdx === 1) PROGRESS.stats.wins++;
    addCredits(25);
    saveProgress();
  }

  function onPauseToggle() {
    if (!match) return;
    if (match.state === 'fight' || match.state === 'intro') {
      match.state = 'paused';
      window.GameAudio && GameAudio.play('menu');
    } else if (match.state === 'paused') {
      match.state = 'fight';
      match.lastT = performance.now();
    }
  }

  function resumeMatch() { if (match && match.state === 'paused') { match.state = 'fight'; match.lastT = performance.now(); } }

  function quitToMenu() {
    match = null;
    players[0] = players[1] = null;
    projectiles.length = 0;
  }

  function isMatchOver() { return match && match.state === 'matchover'; }

  function getMatchSummary() {
    if (!match) return null;
    var w = match.overallWinner ? players[match.overallWinner - 1] : players[0];
    return {
      winnerIdx: match.overallWinner,
      winnerName: w && w.char ? w.char.name : '',
      winnerChar: w && w.char,
      score1: match.score1, score2: match.score2
    };
  }

  // ---- rendering ----------------------------------------------------------------
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (!match || !match.map) { drawMenuBackdrop(); return; }

    var m = match;
    var map = m.map;

    // background gradient
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, map.bgTop);
    grd.addColorStop(1, map.bgBottom);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // floor
    ctx.fillStyle = map.floor;
    ctx.fillRect(0, 0, W, H);

    // floor grid
    ctx.strokeStyle = map.line;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy <= H; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    ctx.globalAlpha = 1;

    drawHazards(map);
    drawObstacles(map, m);

    // projectiles (under players, but above floor)
    for (var i = 0; i < projectiles.length; i++) drawProjectile(projectiles[i]);

    // players
    if (players[0]) drawPlayer(players[0], m);
    if (players[1]) drawPlayer(players[1], m);

    // particles
    for (var pi = 0; pi < particles.length; pi++) {
      var p = particles[pi];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // damage numbers
    for (var d = 0; d < damageNumbers.length; d++) {
      var dn = damageNumbers[d];
      ctx.globalAlpha = clamp(dn.life / 0.8, 0, 1);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = dn.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(dn.amt.toFixed ? String(Math.floor(dn.amt)) : String(dn.amt), dn.x, dn.y);
      ctx.fillText(dn.amt.toFixed ? String(Math.floor(dn.amt)) : String(dn.amt), dn.x, dn.y);
    }
    ctx.globalAlpha = 1;

    // round banner
    if (m.state === 'intro') {
      var fadeIn = clamp((2.0 - m.stateTimer) / 0.4, 0, 1);
      ctx.globalAlpha = fadeIn;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 52px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255,209,102,0.6)';
      ctx.shadowBlur = 18;
      ctx.fillText(m.introMsg, W / 2, H / 2 - 10);
      ctx.font = '600 20px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('FIGHT! awaits...', W / 2, H / 2 + 26);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    if (m.state === 'roundover') {
      var msg = m.roundOver === -1 ? 'DRAW — REPLAY' : (m.roundOver === 1 ? 'ROUND TO PLAYER 1' : 'ROUND TO PLAYER 2');
      ctx.globalAlpha = clamp((2.4 - m.stateTimer) > 0.1 ? 1 : ((2.4 - m.stateTimer) / 0.2), 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd166';
      ctx.font = '800 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 1;
      ctx.fillText(msg, W / 2, H / 2);
      ctx.textAlign = 'left';
    }

    if (m.state === 'matchover') {
      var sum = getMatchSummary();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffd166';
      ctx.font = '900 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MATCH OVER', W / 2, H / 2 - 30);
      ctx.fillStyle = '#fff';
      ctx.font = '600 28px sans-serif';
      ctx.fillText((sum && sum.winnerName) + ' wins the match!', W / 2, H / 2 + 12);
      ctx.font = '500 20px sans-serif';
      ctx.fillText(m.score1 + ' - ' + m.score2, W / 2, H / 2 + 48);
      ctx.textAlign = 'left';
    }
  }

  function drawMenuBackdrop() {
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#171a2b');
    grd.addColorStop(1, '#0d0f1a');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(90,160,255,0.12)';
    ctx.font = '900 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔', W / 2, H / 2);
    ctx.textAlign = 'left';
  }

  function drawHazards(map) {
    for (var i = 0; i < map.hazards.length; i++) {
      var hz = map.hazards[i];
      if (hz.type === 'lava') {
        ctx.fillStyle = '#ff7733';
        ctx.fillRect(hz.x, hz.y, hz.w, hz.h);
        ctx.fillStyle = '#ffd166';
        ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 120) * 0.2;
        for (var lx = hz.x + 8; lx < hz.x + hz.w; lx += 22) {
          ctx.beginPath(); ctx.arc(lx, hz.y + hz.h / 2 + Math.sin(performance.now() / 180 + lx) * 6, 3 + Math.sin(performance.now() / 150 + lx) * 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (hz.type === 'water') {
        ctx.fillStyle = '#3a6bd6';
        ctx.fillRect(hz.x, hz.y, hz.w, hz.h);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 400) * 0.12;
        for (var wx = hz.x + 10; wx < hz.x + hz.w; wx += 18) {
          ctx.beginPath(); ctx.arc(wx, hz.y + 12 + Math.sin(performance.now() / 300 + wx) * 4, 2.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (hz.type === 'ice') {
        ctx.fillStyle = 'rgba(170,225,250,0.5)';
        ctx.fillRect(hz.x, hz.y, hz.w, hz.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        for (var ix = hz.x + 6; ix < hz.x + hz.w; ix += 14) {
          ctx.beginPath(); ctx.moveTo(ix, hz.y); ctx.lineTo(ix, hz.y + hz.h); ctx.stroke();
        }
        // speed boost label implied by sparkle
        ctx.fillStyle = '#9fd0ff';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ SPEED ZONE', hz.x + hz.w / 2, hz.y + hz.h / 2 + 4);
        ctx.textAlign = 'left';
      }
    }
  }

  function drawObstacles(map, m) {
    var theme = map.theme;
    for (var i = 0; i < map.obstacles.length; i++) {
      var o = map.obstacles[i];
      var cx = o.x + o.w / 2;
      if (theme === 'forest') {
        // tree trunk
        ctx.fillStyle = '#6b4a2b';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = '#2e5a1c';
        ctx.beginPath(); ctx.arc(cx, o.y - 6, o.w * 0.7, 0, Math.PI * 2); ctx.fill();
      } else if (theme === 'space') {
        ctx.fillStyle = '#29456e';
        roundRect(ctx, o.x, o.y, o.w, o.h, 4); ctx.fill();
        ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1; ctx.stroke();
      } else if (theme === 'cyber') {
        ctx.fillStyle = '#3a2a6e';
        roundRect(ctx, o.x, o.y, o.w, o.h, 4); ctx.fill();
        ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 2; ctx.stroke();
      } else if (theme === 'crystal') {
        ctx.fillStyle = '#a06bd0';
        ctx.beginPath(); ctx.moveTo(cx, o.y); ctx.lineTo(o.x + o.w, o.y + o.h); ctx.lineTo(o.x, o.y + o.h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d0a0ff';
        ctx.beginPath(); ctx.moveTo(cx, o.y); ctx.lineTo(o.x + o.w, o.y + o.h); ctx.lineTo(cx, o.y + o.h); ctx.closePath(); ctx.fill();
      } else if (theme === 'graveyard') {
        // gravestone
        ctx.fillStyle = '#5a5f72';
        ctx.beginPath(); ctx.moveTo(cx, o.y); ctx.arcTo(o.x + o.w, o.y, o.x + o.w, o.y + o.h, 6);
        ctx.lineTo(o.x, o.y + o.h); ctx.arcTo(o.x, o.y, cx, o.y, 6); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#544d46';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(o.x, o.y, o.w, 4);
      }
      // soft shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h, o.w / 2, 0, Math.PI); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
  }

  function drawProjectile(pr) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.fillStyle = pr.color;
    if (pr.glow) { ctx.shadowColor = pr.glow; ctx.shadowBlur = 12; }
    ctx.beginPath(); ctx.arc(0, 0, pr.r, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(pr.dx * pr.r * 0.5, pr.dy * pr.r * 0.5, pr.r * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPlayer(p, m) {
    var c = p.char;
    var tx = p.x, ty = p.y + 12; // feet anchor

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(p.x, ty, p.r * 0.85, p.r * 0.4, 0, 0, Math.PI * 2); ctx.fill();

    // idle bob
    var bob = Math.sin(performance.now() / 200) * 1.5;
    if (Math.abs(p.vx) > 4 || Math.abs(p.vy) > 4) bob = Math.sin(performance.now() / 60) * 2.2;

    // flash on hit
    ctx.globalAlpha = 1;
    if (p.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(p.x, p.y - 8, p.r + 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // invulnerability blink
    if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) ctx.globalAlpha = 0.45;

    ctx.save();
    ctx.translate(p.x, p.y - 26 + bob); // top of figure (head center around here)

    // draw stickman centered
    drawStickman(ctx, c, p, m);

    ctx.restore();

    // shield bubble
    if (p.shieldActive) {
      ctx.strokeStyle = '#9fd0ff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(p.x, p.y - 24, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // rage aura
    if (p.rageTimer > 0) {
      ctx.fillStyle = 'rgba(255,136,68,0.25)';
      ctx.beginPath(); ctx.arc(p.x, p.y - 24, 22, 0, Math.PI * 2); ctx.fill();
    }

    // blocking indicator (crouch/block)
    if (p.blocking) {
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(p.x, p.y - 12, p.r + 6, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // heat hazard glow
    if (p.hazardType === 'lava') {
      ctx.fillStyle = 'rgba(255,119,51,0.35)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2); ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function drawStickman(ctx, c, p, m) {
    var s = c.stats;
    // proportions (origin is head center)
    var scale = 1;
    var headR = 8;
    var bodyLen = 22;
    var legLen = 16;
    var armLen = 14;
    var face = p.idx === 0 ? 1 : -1; // which direction body faces
    var f = p.facing;

    var moving = Math.abs(p.vx) > 4 || Math.abs(p.vy) > 4;
    var walk = moving ? Math.sin(performance.now() / 90) * 5 : 0;

    // legs
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, bodyLen - 6);
    ctx.lineTo(-5 + walk, legLen + bodyLen - 4);
    ctx.moveTo(0, bodyLen - 6);
    ctx.lineTo(5 - walk, legLen + bodyLen - 4);
    ctx.stroke();

    // body (torso)
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, headR);
    ctx.lineTo(0, bodyLen);
    ctx.stroke();

    // arms
    var attack = p.attackAnim > 0;
    var armUp = attack ? -armLen * 0.9 : 0;
    var swing = attack ? Math.sin((0.22 - p.attackAnim) / 0.22 * Math.PI) : 0;
    // hold weapon arm forward, other arm back
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    // back arm
    ctx.moveTo(0, headR + 6);
    ctx.lineTo(-8 - walk * 0.4, headR + 6 + armLen + (moving ? walk * 0.3 : 0));
    // front arm with weapon
    ctx.moveTo(0, headR + 6);
    ctx.lineTo((armUp + swing * 8) * f, headR + 6 + armLen * 0.7);
    ctx.stroke();

    // weapon
    drawWeapon(ctx, c, f);
    if (attack) drawSwingArc(ctx, c);

    // head
    ctx.fillStyle = '#f5d7b5';
    ctx.beginPath(); ctx.arc(0, headR - 4, headR - 1, 0, Math.PI * 2); ctx.fill();
    // visor / eyes
    ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.arc(f * 3, headR - 5, 2, 0, Math.PI * 2); ctx.fill();

    // character-specific headgear marker (accent)
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, headR - 6, headR + 1, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();

    // special glow during cast
    if (p.char.special === 'ranged' && p.specialCd <= 0 && p.attackAnim === 0 && c.attackType === 'ranged') {}
  }

  function drawSwingArc(ctx, c) {
    // optional arc flash for melee swings
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -0.9, 0.9);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawWeapon(ctx, c, f) {
    var w = c.weapon;
    var len = 16;
    ctx.lineWidth = 3;
    if (w === 'bow') {
      ctx.strokeStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.arc(f * 4, 6, 12, -1.2, 1.2);
      ctx.stroke();
      ctx.strokeStyle = '#ddd';
      ctx.beginPath(); ctx.moveTo(f * -6, 8); ctx.lineTo(f * 2, 8); ctx.stroke();
    } else if (w === 'staff') {
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(f * 6, 2); ctx.lineTo(f * 2, 16); ctx.stroke();
      ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(f * 6, 2, 4, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = '#cfcfd6';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(f * 10, 10); ctx.lineTo(f * 22, 0); ctx.stroke();
      if (w === 'sword') { ctx.strokeStyle = '#e8d9a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f * 22, 0); ctx.lineTo(f * 30, -6); ctx.stroke(); }
      else if (w === 'hammer') { ctx.fillStyle = '#9aa0aa'; ctx.beginPath(); ctx.arc(f * 22, -2, 6, 0, Math.PI * 2); ctx.fill(); }
      else if (w === 'dagger') { ctx.strokeStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(f * 10, 10); ctx.lineTo(f * 24, 8); ctx.stroke(); }
      else if (w === 'claws') { ctx.strokeStyle = '#ffb3b3'; ctx.lineWidth = 2; for (var i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(f * 10, 10 + i * 2); ctx.lineTo(f * 22, 8 + i * 2); ctx.stroke(); } }
      else if (w === 'scythe') { ctx.strokeStyle = '#cfcfd6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f * 12, 8); ctx.lineTo(f * 22, 0); ctx.stroke(); ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f * 22, 0, 4, 0, Math.PI * 2); ctx.stroke(); }
      else if (w === 'fire') { ctx.fillStyle = '#ff7733'; ctx.beginPath(); ctx.arc(f * 16, 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(f * 16, 2, 2.5, 0, Math.PI * 2); ctx.fill(); }
      else if (w === 'gauntlet') { ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(f * 14, 4, 4, 0, Math.PI * 2); ctx.fill(); }
      else if (w === 'mace') { ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.arc(f * 20, 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#a0a0b0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(f * 8, 10); ctx.lineTo(f * 18, 4); ctx.stroke(); }
    }
  }

  // ---- animation loop --------------------------------------------------------
  var rafId = null;
  var lastFrame = 0;
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    update(dt);
    draw();
  }

  function start() {
    if (rafId) cancelAnimationFrame(rafId);
    lastFrame = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  // ---- public API --------------------------------------------------------------
  window.Battle = {
    setupCanvas: setupCanvas,
    start: start,
    startMatch: startMatch,
    onKeyDown: onKeyDown,
    onKeyUp: onKeyUp,
    pause: onPauseToggle,
    resume: resumeMatch,
    quit: quitToMenu,
    isMatchOver: isMatchOver,
    getMatch: function () { return match; },
    getSummary: getMatchSummary,
    getSettings: function () { return SETTINGS; },
    updateSettings: function (obj) { Object.assign(SETTINGS, obj); saveSettings(); },
    setEffects: function (b) { effectsEnabled = b; },
    loadSettings: loadSettings,
    getProgress: function () { return PROGRESS; },
    isUnlocked: isUnlocked,
    addCredits: addCredits,
    saveProgress: saveProgress,
    getHud: function () {
      return {
        p1: players[0] && playerHud(players[0]),
        p2: players[1] && playerHud(players[1]),
        round: match ? match.round : 1,
        score1: match ? match.score1 : 0,
        score2: match ? match.score2 : 0,
        timer: match ? Math.max(0, Math.ceil(match.stateTimer || 0)) : 0,
        state: match ? match.state : 'none'
      };
    }
  };

  function playerHud(p) {
    return {
      name: p.char.name, hp: p.hp, maxHp: p.maxHp,
      specialPct: p.specialCd > 0 ? 1 - p.specialCd / p.char.stats.specialCooldown : 1,
      shield: p.shieldActive
    };
  }

  // bootstrap settings
  loadSettings();
})();