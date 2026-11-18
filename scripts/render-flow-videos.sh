#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSITIONS="$ROOT_DIR/resources/hyperframes/flows"
OUTPUT_DIR="$ROOT_DIR/public/flow-videos"
PLATFORM_OUTPUT_DIR="$ROOT_DIR/resources/hyperframes/platform-videos"
STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT

node "$ROOT_DIR/scripts/generate-flow-hyperframes.mjs"
mkdir -p "$OUTPUT_DIR" "$PLATFORM_OUTPUT_DIR" "$STAGING/output"

if [[ -n "${HYPERFRAMES_BIN:-}" ]]; then
    HYPERFRAMES=("$HYPERFRAMES_BIN")
else
    HYPERFRAMES=(npx --yes hyperframes@0.8.191)
fi

render() {
    local source="$1" slug="$2" directory="$STAGING/$2"
    mkdir -p "$directory"
    cp -R "$COMPOSITIONS/.preview" "$directory/.preview"
    sed 's@\.\./\.preview@./.preview@g' "$source" > "$directory/index.html"
    if ! (
        cd "$directory"
        "${HYPERFRAMES[@]}" render . --output "$STAGING/output/$slug.mp4" --fps "${NEXO_VIDEO_FPS:-15}" --quality standard --workers 1
    ) > "$directory/render.log" 2>&1 || grep -Eq '\[Browser:PAGEERROR\]|sub_timeline_script_failure|NEXO Hyperframes' "$directory/render.log"; then
        cat "$directory/render.log" >&2
        return 1
    fi
    ffmpeg -v error -ss 0.5 -i "$STAGING/output/$slug.mp4" -frames:v 1 -vf scale=640:-1 -q:v 3 "$STAGING/output/$slug.jpg"
    echo "Render verificado: $slug"
}

parallel="${NEXO_VIDEO_JOBS:-3}"
pids=()
failed=0
for composition in "$COMPOSITIONS/index.html" "$COMPOSITIONS"/individual/*.html; do
    slug="$(basename "$composition" .html)"
    [[ "$slug" != index ]] || slug=nexo-flujos
    render "$composition" "$slug" &
    pids+=("$!")
    if (( ${#pids[@]} == parallel )); then
        for pid in ${pids[@]+"${pids[@]}"}; do wait "$pid" || failed=1; done
        pids=()
    fi
done
for pid in ${pids[@]+"${pids[@]}"}; do wait "$pid" || failed=1; done
[[ "$failed" == 0 ]] || exit 1

bash "$ROOT_DIR/scripts/render-onboarding-gifs.sh" "$STAGING/output"

platform_slugs="$(node -e 'for (const { id, roles } of require(process.argv[1])) {
    if (roles.length === 1 && roles[0] === "Superadmin") console.log(id);
}' "$COMPOSITIONS/catalog.json")"

for asset in "$STAGING"/output/*; do
    filename="$(basename "$asset")"
    if grep -Fxq "${filename%.*}" <<< "$platform_slugs"; then
        mv "$asset" "$PLATFORM_OUTPUT_DIR/"
    else
        mv "$asset" "$OUTPUT_DIR/"
    fi
done
