# The Lantern Vault

[![make.fun](https://img.shields.io/badge/make.fun-best--stealth--game-blue)](https://make.fun/c/best-stealth-game-20261121-1759)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A complete top-down 2D stealth game, built for make.fun's **"Make the best stealth game"** bounty (`best-stealth-game-20261121-1759`).

## The heist

A night thief slips through a moonlit museum vault. Four lantern-guards
— Warden Bram, Keeper Sova, Patrol Marek and Lantern Ilya — walk fixed
patrol routes you can learn. Dodge their vision cones, hide in shadow
pools and tall-grass planters, slip behind the display cases, steal the
three relics (Moon Idol, Sun Coin, Star Mask) and reach the green EXIT
unseen.

## How it plays

- **WASD / arrows** — move. **Shift** — sneak (slower, quieter, harder to spot). **M** — mute. **Enter** — start / restart. Mouse optional (click to start).
- **Detection is a suspicion meter, not an instant fail.** A guard who
  glimpses you turns suspicious and investigates your last-seen spot;
  at full suspicion the alarm sounds and the guard chases. Break line
  of sight, hide in shadow or grass, and suspicion cools down.
- **Noise matters.** Moving normally carries a visible noise ring
  guards can hear; sneaking is quiet.
- **Scoring.** Win by reaching the EXIT. Your rank depends on relics
  collected and alarms raised: GHOST (3 relics, 0 alerts) down to RUNNER.

## Tech

Vanilla canvas, no libraries, no build step, no network requests — every
file lives under `game/`. Sound is WebAudio oscillators only (footsteps,
alarm sting, relic chime, getaway arpeggio). Source is split by job:

| File | Job |
| --- | --- |
| `game/src/main.js` | Game loop, screens, win/caught, screenshot scenes |
| `game/src/config.js` | Tuning: speeds, sight, suspicion, colours, ranks |
| `game/src/world.js` | Level: walls, shadows, bushes, relics, exit, routes |
| `game/src/vision.js` | Line of sight, vision cones, hearing |
| `game/src/guards.js` | Guard states: patrol / investigate / chase |
| `game/src/input.js` | Keyboard + mouse |
| `game/src/audio.js` | WebAudio sounds (oscillators only) |
| `game/src/render.js` | All canvas drawing + HUD |

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshot scenes (used for the entry's screenshots, staged from real
game state): `?shot=cover`, `?shot=mid`, `?shot=alert`, `?shot=win`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored `vendor/makefun-game.ts`.

## License

MIT — see [LICENSE](LICENSE).
