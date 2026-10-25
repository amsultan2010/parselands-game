#!/usr/bin/env bash
# Assembles src/ into a single standalone index.html (no dependencies besides Google Fonts).
set -euo pipefail
cd "$(dirname "$0")"
{
  echo '<!doctype html>'
  echo '<html lang="en">'
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  echo '<meta name="description" content="Parselands: an endless pixel-art runner. A gradient llama parses pages across four biomes, with chiptune music.">'
  echo '</head>'
  echo '<body>'
  cat src/p1.html
  echo '<script>'
  cat src/p2.js src/p3.js src/p4.js src/p5.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > index.html
echo "Built index.html ($(wc -c < index.html) bytes)"
