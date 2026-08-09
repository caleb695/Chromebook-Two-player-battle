// Battle Arena — UI / menu controller.
// Handles screen navigation, character & map selection, settings, HUD updates,
// and wires user input into the core engine (window.Battle).
(function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var Battle = window.Battle;
  var AudioBus = window.GameAudio;
  var screens = {};

  // ---- selection state -------------------------------------------------------
  var state = {
    p1: { char: null },
    p2: { char: null },
    map: null,
    charSelScreen: 'charsel'     // 'charsel' or 'charsel-short'
  };

  // ---- screen switching -------------------------------------------------------
  function showScreen(id) {
    $all('.screen').forEach(function (s) { s.classList.remove('active'); });
    var el = $('#' + id);
    if (el) el.classList.add('active');
  }

  // ---- character select UI -----------------------------------------------------
  function buildCharPicker(container, playerIdx) {
    container.innerHTML = '';
    window.CHARACTERS.forEach(function (c) {
      var cell = document.createElement('div');
      cell.className = 'char-cell';
      if (state[playerIdx === 1 ? 'p1' : 'p2'].char && state[playerIdx === 1 ? 'p1' : 'p2'].char.id === c.id) cell.classList.add('selected');
      if (!Battle.isUnlocked(c.id)) { cell.classList.add('locked'); }
      cell.innerHTML = '<canvas class="mini-avatar" data-c="' + c.id + '"></canvas>'
        + '<span class="cc-name">' + c.name + '</span>'
        + (Battle.isUnlocked(c.id) ? '' : '<span class="cc-lock">🔒 100 credits</span>');
      cell.addEventListener('click', function () {
        if (!Battle.isUnlocked(c.id)) { AudioBus && AudioBus.play('block'); tryBuyUnlock(c); buildCharPicker(container, playerIdx); renderCharDetail(); return; }
        state[playerIdx === 1 ? 'p1' : 'p2'].char = c;
        AudioBus && AudioBus.play('select');
        refreshCharPicker();
        renderCharDetail();
      });
      container.appendChild(cell);
      drawMiniAvatar($('canvas[data-c="' + c.id + '"]'), c);
    });
  }

  function drawMiniAvatar(canvas, c) {
    var ctx = canvas.getContext('2d');
    var S = 46;
    canvas.width = S; canvas.height = S;
    ctx.clearRect(0, 0, S, S);
    var cx = S / 2, cy = S / 2 + 8;
    // stick figure scaled to minicanvas
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.strokeStyle = c.secondary; // legs
    ctx.beginPath(); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx - 5, cy + 9); ctx.moveTo(cx, cy - 2); ctx.lineTo(cx + 5, cy + 9); ctx.stroke();
    ctx.strokeStyle = c.primary; // torso
    ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 1); ctx.stroke();
    ctx.strokeStyle = c.primary;
    ctx.beginPath(); // arms
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 6, cy - 4); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx - 6, cy - 4); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(cx, cy - 16, 5, 0, Math.PI * 2); ctx.fill(); // head
    // weapon dot
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(cx + 8, cy - 3, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  function refreshCharPicker() {
    buildCharPicker($('#p1-char-col .char-picker'), 1);
    buildCharPicker($('#p2-char-col .char-picker'), 2);
  }

  function renderCharDetail() {
    var detail = $('#char-detail');
    var active = state.p1.char;
    if (!active) { detail.innerHTML = '<p class="hint">Pick a champion for each player to begin.</p>'; return; }
    var s = active.stats;
    var bars = function (v, max) {
      return '<span class="statbar"><span style="width:' + Math.round(v / max * 100) + '%"></span></span>';
    };
    detail.innerHTML = '<h3 style="color:' + active.primary + '">' + active.name + '</h3>'
      + '<p>' + active.description + '</p>'
      + '<div class="stats-line">'
      + 'HP ' + s.maxHealth + bars(s.maxHealth, 175)
      + 'SPD ' + s.speed + bars(s.speed, 240)
      + 'DMG ' + s.damage + bars(s.damage, 32)
      + '</div>'
      + '<p class="hint" style="margin:6px 0 0"><b>Ability:</b> ' + active.specialName + ' — ' + active.specialDesc + '</p>';
  }

  function buildMapStrip() {
    var strip = $('#map-strip');
    if (!strip) return;
    // keep label, rebuild buttons
    strip.querySelectorAll('.ms-btn').forEach(function (b) { b.remove(); });
    window.MAPS.forEach(function (m) {
      var b = document.createElement('button');
      b.className = 'ms-btn';
      b.textContent = m.name;
      if (state.map && state.map.id === m.id) b.classList.add('selected');
      b.addEventListener('click', function () {
        state.map = m;
        AudioBus && AudioBus.play('select');
        $('#map-strip .ms-btn').forEach(function (x) { x.classList.remove('selected'); });
        b.classList.add('selected');
      });
      strip.appendChild(b);
    });
  }

  // ---- map select UI ----------------------------------------------------------
  function buildMapGrid() {
    var grid = $('#map-grid');
    grid.innerHTML = '';
    window.MAPS.forEach(function (m) {
      var cell = document.createElement('div');
      cell.className = 'map-cell';
      if (state.map && state.map.id === m.id) cell.classList.add('selected');
      cell.innerHTML = '<div class="map-swatch" style="background:linear-gradient(180deg,' + m.bgTop + ',' + m.floor + ')"></div>'
        + '<span class="mc-name">' + m.name + '</span>';
      cell.addEventListener('click', function () {
        state.map = m;
        AudioBus && AudioBus.play('select');
        $all('.map-cell').forEach(function (x) { x.classList.remove('selected'); });
        cell.classList.add('selected');
        renderMapDetail(m);
      });
      grid.appendChild(cell);
    });
  }

  function renderMapDetail(m) {
    var detail = $('#map-detail');
    if (!m) { detail.innerHTML = '<span>Choose a map to fight on.</span>'; return; }
    var bits = [];
    if (m.obstacles.length) bits.push(m.obstacles.length + ' obstacles');
    if (m.hazards.length) {
      var types = (m.hazards || []).map(function (h) { return h.type; });
      bits.push('hazards: ' + types.join(', '));
    } else bits.push('no hazards');
    detail.innerHTML = '<b style="font-size:16px">' + m.name + '</b> — ' + bits.join(' · ') + ' · ' + m.theme + ' theme';
  }

  // ---- settings UI -------------------------------------------------------------
  function syncSettingsUI() {
    var s = Battle.getSettings();
    $('#set-volume').value = Math.round(s.volume * 100);
    $('#set-effects').checked = s.effects;
    $('#set-roundlen').value = s.roundLength;
    var r = s.rounds;
    $all('#set-rounds-seg button').forEach(function (b) {
      b.classList.toggle('active', String(r) === b.dataset.r);
    });
  }

  function bindSettings() {
    $('#set-volume').addEventListener('input', function () {
      var v = parseInt(this.value, 10) / 100;
      Battle.updateSettings({ volume: v });
      AudioBus && AudioBus.setVolume(v);
    });
    $('#set-effects').addEventListener('change', function () {
      Battle.updateSettings({ effects: this.checked });
      Battle.setEffects(this.checked);
      AudioBus && AudioBus.setEffects(this.checked);
    });
    $('#set-roundlen').addEventListener('input', function () {
      Battle.updateSettings({ roundLength: parseInt(this.value, 10) });
    });
    $all('#set-rounds-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        var v = parseInt(b.dataset.r, 10);
        Battle.updateSettings({ rounds: v });
        $all('#set-rounds-seg button').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
      });
    });
    $('#set-fullscreen').addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else (document.documentElement.requestFullscreen && document.documentElement.requestFullscreen());
    });
  }

  // ---- HUD ----------------------------------------------------------------------
  var hudTimer = null;
  function startHud() {
    if (hudTimer) clearInterval(hudTimer);
    hudTimer = setInterval(updateHud, 80);
    updateHud();
  }
  function stopHud() { if (hudTimer) { clearInterval(hudTimer); hudTimer = null; } }

  function updateHud() {
    var hud = Battle.getHud();
    if (!hud || hud.state === 'none') return;
    var hp1 = $('#hud-p1-hp'), hp2 = $('#hud-p2-hp');
    var pct1 = hud.p1 && hud.p1.maxHp ? hud.p1.hp / hud.p1.maxHp * 100 : 0;
    var pct2 = hud.p2 && hud.p2.maxHp ? hud.p2.hp / hud.p2.maxHp * 100 : 0;
    hp1.style.width = clamp(pct1, 0, 100) + '%';
    hp2.style.width = clamp(pct2, 0, 100) + '%';
    hp1.classList.toggle('low', pct1 < 30);
    hp2.classList.toggle('low', pct2 < 30);
    if (hud.p1) $('#hud-p1-name').textContent = hud.p1.name;
    if (hud.p2) $('#hud-p2-name').textContent = hud.p2.name;
    if (hud.p1) $('#hud-p1-special').textContent = hud.p1.specialPct >= 1 ? 'READY' : Math.round(hud.p1.specialPct * 100) + '%';
    if (hud.p2) $('#hud-p2-special').textContent = hud.p2.specialPct >= 1 ? 'READY' : Math.round(hud.p2.specialPct * 100) + '%';
    $('#hud-score').textContent = hud.score1 + ' - ' + hud.score2;
    $('#hud-round').textContent = hud.round > 1 ? 'ROUND ' + hud.round : 'ROUND 1';
    $('#hud-timer').textContent = hud.timer;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function pollMatchOver() {
    var ov = Battle.getMatch();
    if (ov && ov.state === 'matchover' && !ov._notified) {
      ov._notified = true;
      var sum = Battle.getSummary();
      $('#victory-title').textContent = (sum.winnerIdx === 1 ? '🏆 Player 1 Wins!' : (sum.winnerIdx === 2 ? '🏆 Player 2 Wins!' : 'Draw!'));
      $('#victory-detail').textContent = sum.winnerName + ' takes the match ' + sum.score1 + ' - ' + sum.score2;
      $('#victory-overlay').classList.remove('hidden');
      AudioBus && AudioBus.stopMusic();
      AudioBus && AudioBus.playMusic('menu');
    }
  }

  // ---- start a match ------------------------------------------------------------
  function launchMatch() {
    if (!state.p1.char || !state.p2.char || !state.map) {
      AudioBus && AudioBus.play('block');
      return;
    }
    AudioBus && AudioBus.resume();
    AudioBus && AudioBus.stopMusic();
    AudioBus && AudioBus.playMusic('battle');
    showScreen('screen-game');
    $('#victory-overlay').classList.add('hidden');
    $('#pause-overlay').classList.add('hidden');
    Battle.start();
    Battle.setEffects(Battle.getSettings().effects);
    Battle.startMatch({
      p1: state.p1.char.id,
      p2: state.p2.char.id,
      map: state.map.id
    });
    $('#hud-round').textContent = 'ROUND 1';
    startHud();
  }

  // ---- unlocks -------------------------------------------------------------------
  function tryBuyUnlock(c) {
    var prog = Battle.getProgress();
    if (Battle.isUnlocked(c.id)) return;
    if (prog.credits >= 100) {
      Battle.addCredits(-100);
      var list = prog.unlocked; list.push(c.id);
      Battle.saveProgress();
      AudioBus && AudioBus.play('special');
    } else {
      AudioBus && AudioBus.play('block');
    }
  }

  function refreshCredits() {
    var prog = Battle.getProgress();
    $('#credit-counter').textContent = 'Credits: ' + prog.credits;
    $('#stats-line').textContent = 'Wins: ' + (prog.stats.wins || 0) + ' / Matches: ' + (prog.stats.matches || 0);
  }

  // ---- event wiring ----------------------------------------------------------------
  function bindMenu() {
    // Menu buttons to specific screens
    $('#menu-buttons').addEventListener('click', function (e) {
      var btn = e.target.closest('.menu-btn');
      if (!btn) return;
      var target = btn.dataset.screen;
      AudioBus && AudioBus.play('select');
      if (target === 'charsel' || target === 'charsel-short') {
        state.charSelScreen = target;
        buildMapGrid();
        renderMapDetail(state.map);
        refreshCharPicker();
        refreshCredits();
        renderCharDetail();
        buildMapStrip();
        showScreen('screen-charsel');
      } else if (target === 'mapselect') {
        buildMapGrid();
        renderMapDetail(state.map);
        showScreen('screen-mapselect');
      } else if (target === 'settings') {
        syncSettingsUI();
        showScreen('screen-settings');
      } else {
        showScreen('screen-' + target);
      }
    });
  }

  function bindGenericScreens() {
    // Back buttons shared via data-screen="menu"
    $all('[data-screen="menu"]').forEach(function (btn) {
      btn.addEventListener('click', function () { AudioBus && AudioBus.play('select'); showScreen('screen-menu'); });
    });
    $('#charsel-go').addEventListener('click', launchMatch);

    state.map = window.MAPS[0];
    buildMapStrip();
  }

  function bindMatchControls() {
    $('#resume-btn').addEventListener('click', function () {
      $('#pause-overlay').classList.add('hidden');
      Battle.resume();
    });
    $('#quit-btn').addEventListener('click', function () {
      Battle.quit();
      stopHud();
      $('#pause-overlay').classList.add('hidden');
      $('#victory-overlay').classList.add('hidden');
      AudioBus && AudioBus.stopMusic();
      AudioBus && AudioBus.playMusic('menu');
      refreshCredits();
      showScreen('screen-menu');
    });
    $('#menu-again-btn').addEventListener('click', function () {
      Battle.quit();
      stopHud();
      $('#victory-overlay').classList.add('hidden');
      AudioBus && AudioBus.stopMusic();
      AudioBus && AudioBus.playMusic('menu');
      refreshCredits();
      showScreen('screen-menu');
    });
    $('#rematch-btn').addEventListener('click', launchMatch);
  }

  function handleGlobalKeys(e) {
    // Space/Enter handled by engine; prevent page scroll on arrows & space
    var arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter'];
    if (arrows.indexOf(e.code) >= 0) e.preventDefault();
    if (e.code === 'Escape' || e.code === 'KeyP') {
      var game = Battle.getMatch();
      if (game && (game.state === 'fight' || game.state === 'paused')) {
        Battle.pause();
        $('#pause-overlay').classList.toggle('hidden');
      }
    }
    Battle.onKeyDown(e);
  }

  // ---- init ------------------------------------------------------------------------
  function init() {
    Battle.loadSettings();
    var vol = Battle.getSettings().volume;
    AudioBus && AudioBus.setVolume(vol);
    AudioBus && AudioBus.setEffects(Battle.getSettings().effects);

    Battle.setupCanvas($('#game-canvas'));
    Battle.start();          // always run the draw loop (renders backdrop in menus)

    bindGenericScreens();
    bindMenu();
    bindMatchControls();
    bindSettings();
    syncSettingsUI();
    refreshCredits();

    beginGameLoop();

    document.addEventListener('keydown', handleGlobalKeys);
    document.addEventListener('keyup', function (e) { Battle.onKeyUp(e); });

    $('#year').textContent = new Date().getFullYear();

    // start menu ambience after first gesture
    var started = false;
    function warm() {
      if (started) return;
      started = true;
      AudioBus && AudioBus.resume();
      AudioBus && AudioBus.playMusic('menu');
    }
    document.addEventListener('pointerdown', warm);
    document.addEventListener('keydown', warm);
  }

  // tiny update clock for match-over detection
  function beginGameLoop() {
    setInterval(pollMatchOver, 300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();