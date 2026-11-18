#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_DIR="${1:-$ROOT_DIR/public/flow-videos}"
ONBOARDING="$ROOT_DIR/resources/hyperframes/flows/onboarding.json"
CATALOG="$ROOT_DIR/resources/hyperframes/flows/catalog.json"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

slugs="$(node -e 'const [playlist, catalog] = process.argv.slice(1).map((path) => require(path));
for (const { id } of playlist) {
    if (!catalog.some((guide) => guide.id === id && guide.roles.includes("Admin"))) {
        throw new Error("Paso sin guía para administradores: " + id);
    }
    console.log(id);
}' "$ONBOARDING" "$CATALOG")"

while IFS= read -r slug; do
    ffmpeg -nostdin -hide_banner -loglevel error -i "$VIDEO_DIR/$slug.mp4" \
        -filter_complex 'fps=8,scale=800:-1:flags=lanczos,split[frames][colors];[colors]palettegen=stats_mode=diff:max_colors=128[palette];[frames][palette]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle' \
        -loop 0 "$STAGING/$slug.gif"
done <<< "$slugs"

for gif in "$STAGING"/*.gif; do mv "$gif" "$VIDEO_DIR/"; done
