#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSITION_DIR="$ROOT_DIR/resources/hyperframes/flows"
OUTPUT_DIR="$ROOT_DIR/public/flow-videos"

mkdir -p "$OUTPUT_DIR"
node "$ROOT_DIR/scripts/generate-flow-hyperframes.mjs"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx es necesario para renderizar los videos."
  exit 1
fi

cd "$COMPOSITION_DIR"
npx --yes hyperframes render --output "$OUTPUT_DIR/nexo-flujos.mp4" --fps 30 --quality standard --workers 1
for composition in individual/*.html; do
  slug="$(basename "$composition" .html)"
  npx --yes hyperframes render . --composition "$composition" --output "$OUTPUT_DIR/$slug.mp4" --fps 30 --quality standard --workers 1
  echo "Video generado en $OUTPUT_DIR/$slug.mp4"
done
