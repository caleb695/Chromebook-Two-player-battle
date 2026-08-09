# Battle Arena - Two Player Local Combat Game

A local two-player battle game that runs entirely in a web browser. Play offline on a Chromebook by opening `index.html` directly. No installation, no server, no internet connection required after download.

## How to Download and Play

1. **Download from GitHub:**
   - Click the green "Code" button on the repository page
   - Select "Download ZIP"
   - Extract the ZIP file to a folder on your computer

2. **Launch the game:**
   - Open the extracted folder
   - Double-click `index.html` to open in your web browser
   - The game works best in Chrome/Chromium (Chromebook ready)

3. **Play a match:**
   - From the main menu press **Play**.
   - Player 1 picks a champion on the left, Player 2 picks one on the right.
   - Choose an arena from the strip below, then press **Start Match**.
   - Fight on the same keyboard until someone reaches zero health or the timer runs out.

## Controls

### Player 1 (Keyboard)
| Action | Key |
|--------|-----|
| Move Up | **W** |
| Move Left | **A** |
| Crouch/Block | **S** |
| Move Right | **D** |
| Attack | **Space** |
| Special Ability | **Q** |

### Player 2 (Keyboard)
| Action | Key |
|--------|-----|
| Move Up | **↑** (Arrow Up) |
| Move Left | **←** (Arrow Left) |
| Crouch/Block | **↓** (Arrow Down) |
| Move Right | **→** (Arrow Right) |
| Attack | **Enter** |
| Special Ability | **Shift** |

## Features

- **8 Unique Characters** - Each with distinct stats, abilities, and visual style
- **12 Battle Maps** - Each with unique terrain, obstacles, and hazards
- **Best-of Rounds** - Choose 1, 3, 5 round matches or endless mode
- **Combat System** - Health bars, damage, knockback, invulnerability frames
- **Progression** - Earn credits, unlock mystery boxes, track stats
- **Settings** - Volume, fullscreen, round length, effects toggle
- **Audio** - Procedurally generated music and sound effects (works offline)
- **Visual Effects** - Particles, hit flashes, round transitions, victory effects

## Character List

| Character | Health | Speed | Damage | Special Ability |
|-----------|--------|-------|--------|-----------------|
| Knight | High | Medium | High | Shield Block |
| Rogue | Low | Very Fast | Medium | Dash Strike |
| Wizard | Low | Slow | High | Fireball Projectile |
| Robot | Medium | Medium | Medium | Energy Blast |
| Ninja | Low | Very Fast | Medium | Teleport |
| Viking | Very High | Slow | Very High | Berserker Rage |
| Archer | Low | Medium | Medium | Rain of Arrows |
| Fire Mage | Medium | Medium | High | Fire Storm |
| Paladin (Unlockable) | High | Medium | Medium | Holy Light |
| Shadow (Unlockable) | Low | Very Fast | High | Shadow Strike |

## Map List

| Map | Theme | Features |
|-----|-------|----------|
| Training Ground | Simple arena | Flat, no obstacles |
| Forest Arena | Forest | Trees as obstacles |
| Desert Ruins | Desert | Broken walls for cover |
| Ice Cavern | Ice cavern | Slippery movement zones |
| Volcano Arena | Volcano | Lava hazards |
| Castle Courtyard | Castle | Open arena with columns |
| Ancient Temple | Temple | Pillars for cover |
| Space Station | Sci-fi | Walls and open areas |
| Pirate Island | Pirates | Water hazards |
| Crystal Cave | Cave | Crystal obstacles |
| Haunted Graveyard | Halloween | Gravestone cover |
| Cyberpunk City | Futuristic | Neon walls and zones |

## Game Modes

- **Best of 1** - Quick single-round match
- **Best of 3** - First to win 2 rounds
- **Best of 5** - First to win 3 rounds
- **Endless Mode** - No round limit, play until quit

## Progression

Earn credits by winning matches:
- Win a round: +10 credits
- Win a match: +25 credits bonus
- Complete a match: Tracked in statistics

Spend 100 credits in **Character Select** on a locked character (Paladin or Shadow) to unlock them. Progress is saved locally on the device.

## License

MIT License - Feel free to modify and share!

## Credits

Created as a pure HTML/CSS/JavaScript project. No external libraries or dependencies. Runs entirely offline.