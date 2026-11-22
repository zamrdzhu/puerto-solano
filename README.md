# PUERTO SOLANO 3D — sun-soaked open-world crime

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/zamrdzhu/puerto-solano/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/zamrdzhu/puerto-solano/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**PUERTO SOLANO 3D: sun-soaked open-world crime — 10 story missions, 5-star
SPPD pursuit with roadblocks, spike strips & helicopter, traffic, car theft,
saves and 3 radio stations.**

Entry for the make.fun contest **gta6-01** — bounty page:
https://make.fun/bounty/gta6-01

An original 3D open-world crime game that runs in a desktop browser from
plain static files. No build step, no network: three.js is vendored under
`game/vendor/`, and every other line of the game is hand-written classic
scripts under `game/src/` sharing a `window.PS` namespace.

## The city

Puerto Solano is a procedural port city on a bay, generated from a seeded
RNG (the layout is identical on every load): a downtown road grid with
window-lit buildings, palm trees, streetlights and props; a beach strip
with animated water; a marina with docks and boats; industrial corners and
a hill suburb. A full day cycle (golden hour by default) and changing
weather — clear, rain and fog — light the streets.

## What you can do

- **Explore on foot** — an articulated low-poly character with walk/run
  animation and a third-person camera.
- **Steal and drive anything** — press E by any parked or traffic car.
  Arcade driving: acceleration, steering, braking, reverse, handbrake
  drift, skid marks, damage smoke, building and car collisions.
- **Traffic AI** — sedans, taxis and trucks follow the road grid, turn at
  intersections and stop for each other.
- **5-star SPPD wanted system** — car theft, collisions, gunfire and
  mission events raise your stars. Cruisers pursue and ram; at 3+ stars
  you meet roadblocks and spike strips (blown tires wreck your handling
  until you swap cars or wait); at 4+ stars a helicopter with a spotlight
  joins the chase. Stay hidden and the heat decays; get cornered while
  slow and the busted meter fills.
- **Combat** — hold the mouse to shoot on foot, with muzzle flash, hit
  reactions and weapon pickups, against the Coral gang in shootout
  missions (they shoot back).
- **10 story missions** for Marisol Vega, Diego Solano, Captain Ruiz and
  the Crew: go-to, timed delivery, chase-and-ram, police escape, dockside
  shootout, a tail-you-must-not-be-spotted, a checkpoint race, cargo
  recovery, an escort, and a three-stage finale, The Solano Heist.
  Dialogue banners, glowing checkpoint pillars, minimap blips and cash
  rewards throughout.
- **Full HUD** — health and busted bars, cash, flashing wanted stars,
  weapon, mission timer, objective banners, interaction prompts, radio
  station label and a live minimap (roads, traffic, police, enemies,
  mission marker, north).
- **Pure WebAudio sound** — engine hum tied to speed, sirens, collision
  thuds, gunshots, checkpoint chimes and 3 procedural radio stations
  (cycle with R). No audio files.
- **Saves** — progress, cash and position persist in localStorage; the
  title screen offers New Game / Continue. Pause, Busted and Wasted
  states included.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Move / drive |
| E | Enter / exit a car |
| Mouse (hold) | Shoot on foot |
| Shift | Run |
| Space | Handbrake |
| R | Cycle radio station |
| P / Esc | Pause |

## Run it

```
node main.ts          # hands the game in: writes dossier.json + game/ to $MAKEFUN_OUTPUT_DIR (or /output)
node serve.ts         # serve game/ locally, then open http://localhost:8080
```

Node 22, standard library only for the hand-in program. The game itself
is static: open `game/index.html` in desktop Chrome.

## Layout

- `main.ts` — the hand-in entrypoint (copies `game/` + `screenshots/`,
  writes `dossier.json` via the vendored make.fun library).
- `game/index.html` — page shell, title/pause/busted/wasted overlays, HUD.
- `game/src/` — one file per system: `config.js` (tuning + mission data),
  `city.js`, `vehicles.js`, `player.js`, `police.js`, `missions.js`,
  `combat.js`, `hud.js`, `audio.js`, `weather.js`, `effects.js`,
  `save.js`, `main.js` (boot, loop, screenshot staging via `?shot=`).
- `game/vendor/three.min.js` — vendored three.js r128 (MIT).
- `screenshots/` — four 1280×720 frames staged deterministically from the
  game itself (`shots.json` lists their `?shot=` queries).

## License

MIT — see `LICENSE`. three.js is MIT-licensed by its authors.
