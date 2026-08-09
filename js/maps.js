// Global map definitions for the game.
// Assigns window.MAPS (array of 12 maps).

(function () {
  'use strict';

  var W = 1000;
  var H = 620;

  var MAPS = [
    {
      id: 'training',
      name: 'Training Ground',
      theme: 'training',
      unlocked: true,
      bgTop: '#e8f0f5',
      bgBottom: '#c8d4dc',
      floor: '#d8dde2',
      line: '#a8b4bd',
      w: W,
      h: H,
      obstacles: [],
      hazards: [],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'forest',
      name: 'Forest Arena',
      theme: 'forest',
      unlocked: true,
      bgTop: '#7a9a5e',
      bgBottom: '#3f5a2e',
      floor: '#5d7d44',
      line: '#3a5226',
      w: W,
      h: H,
      obstacles: [
        { x: 200, y: 180, w: 44, h: 44 },
        { x: 260, y: 240, w: 44, h: 44 },
        { x: 340, y: 300, w: 44, h: 44 },
        { x: 520, y: 160, w: 44, h: 44 },
        { x: 580, y: 350, w: 44, h: 44 },
        { x: 700, y: 220, w: 44, h: 44 },
        { x: 760, y: 400, w: 44, h: 44 },
        { x: 260, y: 420, w: 44, h: 44 },
        { x: 440, y: 380, w: 44, h: 44 },
        { x: 660, y: 60, w: 44, h: 44 }
      ],
      hazards: [],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'desert',
      name: 'Desert Ruins',
      theme: 'desert',
      unlocked: true,
      bgTop: '#e0b869',
      bgBottom: '#b08a4a',
      floor: '#cba96e',
      line: '#a3874f',
      w: W,
      h: H,
      obstacles: [
        { x: 180, y: 120, w: 40, h: 220 },
        { x: 200, y: 380, w: 40, h: 180 },
        { x: 460, y: 150, w: 40, h: 160 },
        { x: 700, y: 100, w: 40, h: 260 },
        { x: 720, y: 400, w: 40, h: 160 },
        { x: 900, y: 250, w: 40, h: 120 }
      ],
      hazards: [],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'ice',
      name: 'Ice Cavern',
      theme: 'ice',
      unlocked: true,
      bgTop: '#b8e6f0',
      bgBottom: '#5a94c4',
      floor: '#a8d6ea',
      line: '#6aa6c8',
      w: W,
      h: H,
      obstacles: [
        { x: 120, y: 140, w: 40, h: 40 },
        { x: 840, y: 440, w: 40, h: 40 }
      ],
      hazards: [
        { x: 380, y: 250, w: 240, h: 120, type: 'ice' },
        { x: 180, y: 460, w: 200, h: 40, type: 'ice' },
        { x: 640, y: 100, w: 180, h: 40, type: 'ice' }
      ],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'volcano',
      name: 'Volcano Arena',
      theme: 'volcano',
      unlocked: true,
      bgTop: '#2b1c16',
      bgBottom: '#120a06',
      floor: '#3a2418',
      line: '#6a4020',
      w: W,
      h: H,
      obstacles: [
        { x: 120, y: 140, w: 60, h: 60 },
        { x: 820, y: 420, w: 60, h: 60 },
        { x: 480, y: 80, w: 50, h: 50 }
      ],
      hazards: [
        { x: 300, y: 420, w: 400, h: 80, type: 'lava' },
        { x: 760, y: 160, w: 80, h: 160, type: 'lava' },
        { x: 100, y: 200, w: 70, h: 120, type: 'lava' }
      ],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'castle',
      name: 'Castle Courtyard',
      theme: 'castle',
      unlocked: true,
      bgTop: '#aab6c4',
      bgBottom: '#7a8794',
      floor: '#98a5b2',
      line: '#75818e',
      w: W,
      h: H,
      obstacles: [
        { x: 220, y: 200, w: 50, h: 50 },
        { x: 720, y: 200, w: 50, h: 50 },
        { x: 220, y: 380, w: 50, h: 50 },
        { x: 720, y: 380, w: 50, h: 50 }
      ],
      hazards: [],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'temple',
      name: 'Ancient Temple',
      theme: 'temple',
      unlocked: true,
      bgTop: '#d8b370',
      bgBottom: '#a8844a',
      floor: '#c49c5e',
      line: '#8f6f3e',
      w: W,
      h: H,
      obstacles: [
        { x: 200, y: 220, w: 50, h: 50 },
        { x: 290, y: 300, w: 50, h: 50 },
        { x: 500, y: 200, w: 50, h: 50 },
        { x: 500, y: 330, w: 50, h: 50 },
        { x: 720, y: 240, w: 50, h: 50 },
        { x: 720, y: 360, w: 50, h: 50 }
      ],
      hazards: [],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'space',
      name: 'Space Station',
      theme: 'space',
      unlocked: true,
      bgTop: '#070b16',
      bgBottom: '#0d1424',
      floor: '#101b30',
      line: '#1e4064',
      w: W,
      h: H,
      obstacles: [
        { x: 0, y: 0, w: 20, h: H },
        { x: W - 20, y: 0, w: 20, h: H },
        { x: 340, y: 260, w: 80, h: 40 },
        { x: 520, y: 320, w: 80, h: 40 }
      ],
      hazards: [],
      spawns: { p1: { x: 80, y: 310 }, p2: { x: 920, y: 310 } }
    },
    {
      id: 'pirate',
      name: 'Pirate Island',
      theme: 'pirate',
      unlocked: true,
      bgTop: '#8fb8d8',
      bgBottom: '#3a6a94',
      floor: '#c8a465',
      line: '#a8844a',
      w: W,
      h: H,
      obstacles: [
        { x: 150, y: 120, w: 40, h: 40 },
        { x: 810, y: 460, w: 40, h: 40 },
        { x: 480, y: 180, w: 50, h: 50 }
      ],
      hazards: [
        { x: 320, y: 380, w: 160, h: 90, type: 'water' },
        { x: 640, y: 120, w: 140, h: 80, type: 'water' }
      ],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'crystal',
      name: 'Crystal Cave',
      theme: 'crystal',
      unlocked: true,
      bgTop: '#4a3a6e',
      bgBottom: '#1e1834',
      floor: '#342a52',
      line: '#5a4a8a',
      w: W,
      h: H,
      obstacles: [
        { x: 160, y: 140, w: 44, h: 44 },
        { x: 220, y: 300, w: 44, h: 44 },
        { x: 420, y: 220, w: 44, h: 44 },
        { x: 520, y: 380, w: 44, h: 44 },
        { x: 760, y: 160, w: 44, h: 44 },
        { x: 680, y: 320, w: 44, h: 44 }
      ],
      hazards: [],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'graveyard',
      name: 'Haunted Graveyard',
      theme: 'graveyard',
      unlocked: true,
      bgTop: '#2c2438',
      bgBottom: '#15101e',
      floor: '#241c30',
      line: '#4a3a5a',
      w: W,
      h: H,
      obstacles: [
        { x: 150, y: 180, w: 36, h: 36 },
        { x: 260, y: 360, w: 36, h: 36 },
        { x: 400, y: 140, w: 36, h: 36 },
        { x: 550, y: 300, w: 36, h: 36 },
        { x: 660, y: 180, w: 36, h: 36 },
        { x: 780, y: 360, w: 36, h: 36 },
        { x: 500, y: 460, w: 36, h: 36 }
      ],
      hazards: [],
      spawns: { p1: { x: 60, y: 310 }, p2: { x: 940, y: 310 } }
    },
    {
      id: 'cyber',
      name: 'Cyberpunk City',
      theme: 'cyber',
      unlocked: true,
      bgTop: '#120826',
      bgBottom: '#05030d',
      floor: '#1a0f33',
      line: '#391d5e',
      w: W,
      h: H,
      obstacles: [
        { x: 0, y: 0, w: 16, h: H },
        { x: W - 16, y: 0, w: 16, h: H },
        { x: 340, y: 140, w: 40, h: 220 },
        { x: 660, y: 280, w: 40, h: 220 }
      ],
      hazards: [
        { x: 420, y: 290, w: 160, h: 40, type: 'ice' }
      ],
      spawns: { p1: { x: 70, y: 310 }, p2: { x: 930, y: 310 } }
    }
  ];

  window.MAPS = MAPS;
})();