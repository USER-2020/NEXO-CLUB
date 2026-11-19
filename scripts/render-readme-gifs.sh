#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CATALOG="$ROOT_DIR/resources/hyperframes/flows/catalog.json"
OUTPUT_DIR="$ROOT_DIR/docs/media/readme"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

render_preview() {
    local slug="$1" source="$2" width="$3" seconds="$4" duration
    duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$source")"
    local frames="setpts=PTS*${seconds}/${duration},fps=8,scale=${width}:-2:flags=lanczos,split[frames][colors]"
    local palette='[colors]palettegen=stats_mode=diff:max_colors=128[palette]'
    local dither='[frames][palette]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle'
    ffmpeg -nostdin -hide_banner -loglevel error -i "$source" -filter_complex "$frames;$palette;$dither" -loop 0 "$STAGING/$slug.gif"
    echo "GIF generado: $slug"
}

render_preview nexo-flujos "$ROOT_DIR/public/flow-videos/nexo-flujos.mp4" 800 16

guides="$(node -e 'for (const { id, roles } of require(process.argv[1])) {
    const directory = roles.length === 1 && roles[0] === "Superadmin"
        ? "resources/hyperframes/platform-videos"
        : "public/flow-videos";
    console.log(id + " " + directory);
}' "$CATALOG")"

while read -r slug directory; do
    render_preview "$slug" "$ROOT_DIR/$directory/$slug.mp4" 720 12
done <<< "$guides"

mkdir -p "$OUTPUT_DIR"
for gif in "$STAGING"/*.gif; do
    mv "$gif" "$OUTPUT_DIR/"
done
