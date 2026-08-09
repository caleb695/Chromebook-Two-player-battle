# Battle Arena - Two Player Local Combat Game

A local two-player battle game that runs entirely in a web browser. Play offline on a Chromebook by opening `index.html` directly. No installation, no server, no internet connection required after download.

## How to Download and Play

**Option A — Play on GitHub Pages (recommended if your school blocks opening local files):**
1. Open this repo on GitHub and go to **Settings → Pages**.
2. Under **Branch**, set **Source** to *Deploy from a branch*, choose `main` / root folder, then **Save**.
3. Wait ~1 minute for the build. The game is then live at:
   `https://<your-username>.github.io/<repo-name>/`
4. Bookmark that URL. It hosts the exact files in this repo — nothing extra is uploaded, and it works even when double-clicking `index.html` on a school Chromebook is blocked. (A `.nojekyll` file is already included so GitHub serves the files exactly as they are.)
5. If a school network *also* blocks GitHub Pages, use Option B below.

**Option B — Play offline from a downloaded copy (no internet needed):**
1. Click the green **Code** button on the repository page, then **Download ZIP**.
2. Extract the ZIP into a folder on the Chromebook.
3. Double-click `index.html` to open it in Chrome — no server, no install, no internet required after download.

**Play a match:**
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

- **GitHub Pages ready** - All asset paths are relative, so the game serves correctly from `https://<user>.github.io/<repo>/`. A `.nojekyll` file is included so no Jekyll processing happens.
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