# Black Cat: 9 Lives (js13kGames)
A tiny neon arcade game for **js13kGames**.

- **Theme:** black cat with 9 lives
- **Goal:** collect cheese (+1 score) and avoid angry dogs
- **Lives:** start with 9; every **10 points** adds **+1 life**
- **Levels:** each level requires **10 cheese** to advance; palette + tune change per level
- **Music:** tiny chiptune bleeps (press **M** to mute)
- **Controls:** **WASD/Arrows** to move, **Space** to start/restart

## Repo layout
```
/src
  index.html   # dev page loading main.js (readable)
  main.js      # readable, commented source
/build.py      # simple inliner/minifier to produce a single-file dist
/dist
  index.html   # built single-file for submission
  game.zip     # zipped package (<= 13 KiB) ready for submission
```

## Build
Requires Python 3 (no external deps).

```bash
python build.py
```
This will inline & minify `/src/main.js` into `/dist/index.html` and produce `/dist/game.zip`.

## js13k compliance
- One self-contained `index.html` (no external assets/libs).
- Zip size under **13 × 1024 bytes**.
- Works in latest Chrome + Firefox.
- LocalStorage uses a namespaced key (`bc9l_*`).

## License
MIT (see LICENSE).
