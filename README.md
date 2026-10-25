# Parselands

An endless 2D pixel-art side-scroller themed on [LlamaIndex](https://www.llamaindex.ai). A gradient llama runs forever across four biomes, jumping messy scans, ducking under OCR noise, and parsing every page it can reach. Everything (sprites, tiles, music, sound effects) is generated in code, so the whole game is one HTML file.

Made by Abdullah Sultan · [amsultan.site](https://www.amsultan.site)

## Play

Open `index.html` in a browser. No build step or server needed.

## Controls

| Action | Keys | Touch |
| --- | --- | --- |
| Jump (hold for higher) | Space / W / ↑ | Jump button or tap the screen |
| Crouch (in air = dive) | S / ↓ | Crouch button |
| Pause | P / Esc | Pause button |
| Toggle music | M | Music button |

## What's in the game

- **Biomes:** Parse Plains, Extract Canyon, Index Grove (night) and Workflow Highlands, cycling every ~40 seconds.
- **Collectibles:** pages (+10), tables and charts (+25), handwritten notes (+100), and Life Crystals that heal or add a heart.
- **Power-ups:** LlamaCloud (double jump), Agent (auto-collect) and LiteParse (2x points).
- **Hazards:** Messy Scans and Unparsed Crates to jump over, OCR Noise to crouch under, and the Unindexed Void below.
- **Audio:** an original chiptune loop that changes key per biome, plus a full set of sound effects (WebAudio, no audio files).
- **Game over:** a `parse_report.json` with your distance, pages, score and best run (saved in your browser).

## Project layout

```
index.html     the built, playable game
build.sh       rebuilds index.html from src/
src/p1.html    title, fonts, CSS and overlay markup
src/p2.js      utilities, brand palette, biomes, sprite and tile builders
src/p3.js      chiptune audio engine, song and sound effects
src/p4.js      game state, procedural world generation, physics
src/p5.js      rendering, HUD, input and boot
```

Edit files in `src/`, then run `./build.sh` to regenerate `index.html`.

## Deploying

It's a static file, so any static host works. For GitHub Pages: Settings → Pages → deploy from the `main` branch, root folder.
