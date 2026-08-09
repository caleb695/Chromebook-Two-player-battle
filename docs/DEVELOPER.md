# Battle Arena — Developer Guide

This document explains how the game is built and how to extend it. The entire
game is static HTML + CSS + vanilla JavaScript with **zero external
dependencies** — it runs by opening `index.html` in a browser, completely
offline.

## File Structure

```
index.html          Main HTML, screens and script loader
css/style.css       All styling / UI theme
js/characters.js    Character data (8 unlocked + 2 unlockable)
js/maps.js          Map / arena data (12 maps)
js/audio.js         Procedural audio engine (Web Audio API)
js/game.js          Core engine: physics, combat, projectiles, rounds, canvas rendering
js/main.js          Menu / UI controller, screens, HUD, settings
LICENSE             MIT license
README.md           Player-facing documentation
```

Scripts are loaded in `index.html` in dependency order:
`characters -> maps -> audio -> game -> main`.

## Global Data Contracts

### `window.CHARACTERS` (js/characters.js)

An array of character objects. Each has:

```js
{
  id, name, unlocked, description,
  primary,            // hex color for body
  secondary,          // hex color for limbs
  accent,             // hex accent color
  stats: {
    speed,            // px / second
    maxHealth,
    damage,
    attackSpeed,      // ms between attacks
    attackRange,      // px (melee reach)
    specialCooldown   // ms between specials
  },
  weapon,             // 'sword'|'dagger'|'staff'|'bow'|'hammer'|'claws'|'gauntlet'|'fire'|'scythe'|'mace'
  attackType,         // 'melee' | 'ranged'
  special,            // 'shield'|'dash'|'teleport'|'ranged'|'rage'|'rain'
  specialName,
  specialDesc
}
```

`unlocked:false` characters (Paladin, Shadow) are gated behind spending 100
credits in the character-select screen. The unlock list is stored in
localStorage under `battleArena.progress`.

### `window.MAPS` (js/maps.js)

An array of map objects. Each has:

```js
{
  id, name, theme, unlocked,
  bgTop, bgBottom,   // background gradient colors
  floor,             // arena floor color
  line,              // grid line color
  w, h,              // arena dimensions (1000 x 620)
  obstacles: [ { x, y, w, h } ],        // solid cover that blocks movement + projectiles
  hazards:   [ { x, y, w, h, type } ],  // 'lava'|'water' deal damage; 'ice' = slippery speed zone
  spawns: { p1: {x,y}, p2: {x,y} }
}
```

Hazard behavior is handled in `game.js`:
- `lava` / `water`: 6 damage per tick while standing in them.
- `ice`: slippery movement + a speed boost (used as a speed zone).

## Engine API (`window.Battle`)

Created in `game.js`:

- `setupCanvas(canvasEl)` — bind the `<canvas>`.
- `start()` — start the rAF render loop.
- `startMatch({ p1, p2, map })` — begin a match (ids only).
- `getMatch()` — current match object (for polling state).
- `getHud()` — a serializable snapshot for the HUD (hp, names, special %, round, score, timer).
- `onKeyDown / onKeyUp(e)` — feed keyboard events to the engine.
- `pause() / resume() / quit()` — controls.
- `getSettings() / updateSettings(obj)` — read / write settings (persisted to localStorage).
- `getProgress() / isUnlocked(id) / addCredits(n) / saveProgress()` — progression helpers.
- `setEffects(bool)` — toggle particles/flashes.

## Combat Model

- **Melee attacks** test an arc in the facing direction, applying the
  character's damage. **Ranged attacks** spawn projectiles that travel and
  collide with opponents and obstacles.
- **Invulnerability frames** (0.45s) after being hit prevent rapid multi-hit.
- **Knockback** pushes the victim away from the attacker.
- **Special abilities** map to behaviors: shield (blocks most damage), dash
  (fast lunge + damage), teleport (blink), ranged (heavy projectile), rain
  (3-arrow spread), rage (damage + speed buff).
- **Burn**: Fire Mage projectiles apply a damage-over-time burn.
- **Round end**: a player's HP reaching 0 (or the round timer expiring) ends
  the round; the first player to the required number of round wins takes the
  match.

## Settings

Persisted under `battleArena.settings`. Keys:
`volume`, `effects` (boolean), `roundLength` (seconds), `rounds`
(1, 3, 5, or 99 for endless mode).

## Audio

`audio.js` generates all sounds from oscillators and a looped procedural
music pattern with the Web Audio API — nothing is downloaded, so sound works
offline. `GameAudio.resume()` must be called from a user gesture, which the
menu handles.