// Battle Arena — Procedural audio via the Web Audio API.
// All sounds and music are generated from oscillators, so nothing is
// downloaded and the game works fully offline.
(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var musicGain = null;
  var musicTimer = null;
  var musicStep = 0;
  var savedTrack = null;
  var config = { volume: 0.7, effects: true };

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.value = config.volume;
      musicGain = ctx.createGain();
      musicGain.connect(master);
      musicGain.gain.value = 0.22;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slide, dest) {
    if (!ctx) return;
    var t = (when == null ? ctx.currentTime : when);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide !== 0 && slide !== undefined) o.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, vol, filterFreq, when) {
    if (!ctx) return;
    var t = (when == null ? ctx.currentTime : when);
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq || 1200;
    var g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  function playSound(kind) {
    if (!config.effects) return;
    if (!ensure()) return;
    switch (kind) {
      case 'menu':
        tone(523, 0.12, 'sine', 0.5); tone(784, 0.14, 'sine', 0.4, ctx.currentTime + 0.1); break;
      case 'select':
        tone(660, 0.08, 'square', 0.3); break;
      case 'move':
        tone(220, 0.04, 'triangle', 0.25); break;
      case 'attack':
        noise(0.08, 0.35, 2000); tone(260, 0.08, 'sawtooth', 0.22, ctx.currentTime); break;
      case 'shoot':
        tone(520, 0.12, 'sawtooth', 0.3, ctx.currentTime, 500); break;
      case 'hit':
        noise(0.1, 0.5, 700); tone(140, 0.14, 'square', 0.35, ctx.currentTime, -80); break;
      case 'block':
        tone(180, 0.09, 'triangle', 0.35); noise(0.05, 0.3, 600); break;
      case 'special':
        tone(180, 0.4, 'sawtooth', 0.4, ctx.currentTime, 500); tone(360, 0.4, 'sine', 0.3, ctx.currentTime, 400); break;
      case 'dash':
        tone(300, 0.2, 'sawtooth', 0.35, ctx.currentTime, 500); break;
      case 'teleport':
        tone(400, 0.1, 'sine', 0.3, ctx.currentTime, -200);
        tone(800, 0.12, 'sine', 0.25, ctx.currentTime + 0.08, -400); break;
      case 'hazard':
        noise(0.2, 0.2, 400); tone(90, 0.25, 'sine', 0.3, ctx.currentTime, -20); break;
      case 'round':
        tone(392, 0.2, 'sine', 0.5); tone(523, 0.2, 'sine', 0.5, ctx.currentTime + 0.18);
        tone(659, 0.26, 'sine', 0.5, ctx.currentTime + 0.36); break;
      case 'victory':
        [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'square', 0.4, ctx.currentTime + i * 0.16); }); break;
      case 'defeat':
        [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.24, 'sine', 0.4, ctx.currentTime + i * 0.18); }); break;
    }
  }

  // Toggle attribution of the battle theme — checks whether the mode was set by
  // the menu (before the first user gesture the AudioContext may be suspended).
  var pendingTrack = 'menu';
  function tick() {
    if (!ctx) return;
    var step = musicStep % 16;
    var root = [110, 82, 98][Math.floor((musicStep / 16) % 3)];
    var bassDur = 0.28;
    tone(root, bassDur, 'triangle', 0.5, ctx.currentTime, 0, musicGain);
    if (step % 4 === 0) {
      var arp = [root * 2, root * 2.5, root * 3, root * 4];
      var f = arp[Math.floor(Math.random() * arp.length)];
      tone(f, 0.16, 'sine', 0.28, ctx.currentTime, 0, musicGain);
    }
    tone(root * 4.01, 0.12, 'square', 0.05, ctx.currentTime, 0, musicGain);
    musicStep++;
  }

  function playMusic(kind) {
    ensure();
    pendingTrack = kind || 'battle';
    if (!ctx) return;
    stopMusic();
    musicStep = 0;
    musicTimer = setInterval(tick, 190);
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }

  function setVolume(v) {
    config.volume = v;
    if (master) master.gain.value = v;
  }

  function setEffects(b) { config.effects = b; }

  window.GameAudio = {
    play: playSound,
    playMusic: playMusic,
    stopMusic: stopMusic,
    setVolume: setVolume,
    setEffects: setEffects,
    get config() { return config; },
    // resume must be called from a user gesture (e.g. clicking Play)
    resume: function () { return ensure(); }
  };
})();