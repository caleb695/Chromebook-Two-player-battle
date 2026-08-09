// Global character definitions for the game.
// Assigns window.CHARACTERS (array of 10 characters) and window.CHARACTERS_BY_ID.

(function () {
  'use strict';

  var CHARACTERS = [
    {
      id: 'knight',
      name: 'Knight',
      unlocked: true,
      description: 'A stalwart defender clad in steel plate. The Knight leads the charge with an unbreakable sword arm.',
      primary: '#8a9bb0',
      secondary: '#4a6ea8',
      accent: '#c0c8d4',
      stats: {
        speed: 150,
        maxHealth: 150,
        damage: 22,
        attackSpeed: 520,
        attackRange: 60,
        specialCooldown: 6500
      },
      weapon: 'sword',
      attackType: 'melee',
      special: 'shield',
      specialName: 'Ironwall',
      specialDesc: 'Raises a shield that deflects incoming damage briefly.'
    },
    {
      id: 'rogue',
      name: 'Rogue',
      unlocked: true,
      description: 'A swift shadow in dark purple, striking from the dark with deadly daggers.',
      primary: '#5b2c7a',
      secondary: '#3a1c4f',
      accent: '#b565d7',
      stats: {
        speed: 215,
        maxHealth: 100,
        damage: 18,
        attackSpeed: 440,
        attackRange: 55,
        specialCooldown: 5200
      },
      weapon: 'dagger',
      attackType: 'melee',
      special: 'dash',
      specialName: 'Dash Strike',
      specialDesc: 'Performs a quick lunge that damages all enemies in its path.'
    },
    {
      id: 'wizard',
      name: 'Wizard',
      unlocked: true,
      description: 'A master of the arcane, weaving powerful magic from a distance.',
      primary: '#4169e1',
      secondary: '#9370db',
      accent: '#add8e6',
      stats: {
        speed: 150,
        maxHealth: 90,
        damage: 26,
        attackSpeed: 640,
        attackRange: 55,
        specialCooldown: 7000
      },
      weapon: 'staff',
      attackType: 'ranged',
      special: 'ranged',
      specialName: 'Arcane Barrage',
      specialDesc: 'Fires a powerful magic bolt that pierces through enemies.'
    },
    {
      id: 'robot',
      name: 'Robot',
      unlocked: true,
      description: 'A balanced mechanical unit with silver plating and cyan energy. Reliable in any situation.',
      primary: '#aebfc9',
      secondary: '#1e90ff',
      accent: '#00ffff',
      stats: {
        speed: 160,
        maxHealth: 130,
        damage: 20,
        attackSpeed: 560,
        attackRange: 55,
        specialCooldown: 6000
      },
      weapon: 'gauntlet',
      attackType: 'ranged',
      special: 'ranged',
      specialName: 'Energy Blast',
      specialDesc: 'Charges up and fires a powerful energy orb at enemies.'
    },
    {
      id: 'ninja',
      name: 'Ninja',
      unlocked: true,
      description: 'An elusive assassin in black and red. Blinks across the battlefield with unmatched agility.',
      primary: '#1a1a1a',
      secondary: '#8b0000',
      accent: '#ff4500',
      stats: {
        speed: 230,
        maxHealth: 95,
        damage: 17,
        attackSpeed: 400,
        attackRange: 50,
        specialCooldown: 4800
      },
      weapon: 'claws',
      attackType: 'melee',
      special: 'teleport',
      specialName: 'Blink',
      specialDesc: 'Short-range blink in the facing direction, striking enemies on arrival.'
    },
    {
      id: 'viking',
      name: 'Viking',
      unlocked: true,
      description: 'A heavy-hitting brute wielding a great hammer. Slow, but unstoppable when enraged.',
      primary: '#6b4a2b',
      secondary: '#4a342a',
      accent: '#8a8f98',
      stats: {
        speed: 120,
        maxHealth: 165,
        damage: 28,
        attackSpeed: 680,
        attackRange: 65,
        specialCooldown: 7500
      },
      weapon: 'hammer',
      attackType: 'melee',
      special: 'rage',
      specialName: 'Berserker Rage',
      specialDesc: 'Temporarily increases damage and movement speed in a frenzy.'
    },
    {
      id: 'archer',
      name: 'Archer',
      unlocked: true,
      description: 'A nimble hunter in leathers firing deadly arrows from afar with precise aim.',
      primary: '#2e8b57',
      secondary: '#8b7355',
      accent: '#c4a35a',
      stats: {
        speed: 175,
        maxHealth: 105,
        damage: 16,
        attackSpeed: 420,
        attackRange: 55,
        specialCooldown: 5800
      },
      weapon: 'bow',
      attackType: 'ranged',
      special: 'rain',
      specialName: 'Rain of Arrows',
      specialDesc: 'Fires a spread of three arrows that rain down on enemies.'
    },
    {
      id: 'firemage',
      name: 'Fire Mage',
      unlocked: true,
      description: 'A caster of living flame. Fireball projectiles ignite enemies, dealing lasting burn.',
      primary: '#ff4500',
      secondary: '#8b2500',
      accent: '#ffd700',
      stats: {
        speed: 160,
        maxHealth: 120,
        damage: 24,
        attackSpeed: 620,
        attackRange: 55,
        specialCooldown: 6800
      },
      weapon: 'fire',
      attackType: 'ranged',
      special: 'ranged',
      specialName: 'Fire Storm',
      specialDesc: 'Releases a burning fireball that ignites and burns enemies over time.'
    },
    {
      id: 'paladin',
      name: 'Paladin',
      unlocked: false,
      description: 'A holy guardian in gleaming gold and white, shielding allies and restoring vitality.',
      primary: '#ffd700',
      secondary: '#f0f0f0',
      accent: '#fffacd',
      stats: {
        speed: 155,
        maxHealth: 155,
        damage: 20,
        attackSpeed: 540,
        attackRange: 60,
        specialCooldown: 7200
      },
      weapon: 'mace',
      attackType: 'melee',
      special: 'shield',
      specialName: 'Holy Light',
      specialDesc: 'Blocks incoming damage and heals slightly over a short time.'
    },
    {
      id: 'shadow',
      name: 'Shadow',
      unlocked: false,
      description: 'A ghostly apparition of near-black darkness. Strikes with a phantom scythe at blinding speed.',
      primary: '#0d0d12',
      secondary: '#1a2b4f',
      accent: '#5a7bd6',
      stats: {
        speed: 225,
        maxHealth: 95,
        damage: 25,
        attackSpeed: 460,
        attackRange: 55,
        specialCooldown: 5000
      },
      weapon: 'scythe',
      attackType: 'melee',
      special: 'dash',
      specialName: 'Shadow Strike',
      specialDesc: 'A dashing strike with bonus damage, phasing through foes.'
    }
  ];

  var CHARACTERS_BY_ID = {};
  for (var i = 0; i < CHARACTERS.length; i++) {
    CHARACTERS_BY_ID[CHARACTERS[i].id] = CHARACTERS[i];
  }

  window.CHARACTERS = CHARACTERS;
  window.CHARACTERS_BY_ID = CHARACTERS_BY_ID;
})();