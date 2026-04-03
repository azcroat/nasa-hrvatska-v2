#!/usr/bin/env bash
# generate-android-icons.sh
# Generates all required Android launcher icon densities from public/icon-1024.png.
# Requires: ImageMagick (magick command) — install via https://imagemagick.org
#
# Usage:
#   bash scripts/generate-android-icons.sh
#
# Output:
#   Writes ic_launcher.png + ic_launcher_foreground.png to each mipmap-* folder.
#   The adaptive icon background colour is already set in:
#     android/app/src/main/res/values/ic_launcher_background.xml (#0E7490 teal)

set -e

SRC="public/icon-1024.png"
RES="android/app/src/main/res"

if [ ! -f "$SRC" ]; then
  echo "ERROR: $SRC not found. Run from repo root."
  exit 1
fi

if ! command -v magick &>/dev/null; then
  echo "ERROR: ImageMagick not found. Install from https://imagemagick.org"
  exit 1
fi

echo "Generating Android icons from $SRC..."

# Launcher icon sizes (density → px)
declare -A SIZES=(
  [mipmap-mdpi]=48
  [mipmap-hdpi]=72
  [mipmap-xhdpi]=96
  [mipmap-xxhdpi]=144
  [mipmap-xxxhdpi]=192
)

for DENSITY in "${!SIZES[@]}"; do
  SIZE="${SIZES[$DENSITY]}"
  DIR="$RES/$DENSITY"
  mkdir -p "$DIR"

  # Standard launcher icon (square, white background)
  magick "$SRC" -resize "${SIZE}x${SIZE}" -background white -gravity center -extent "${SIZE}x${SIZE}" "$DIR/ic_launcher.png"

  # Round icon (circular mask)
  magick "$SRC" -resize "${SIZE}x${SIZE}" \
    \( +clone -threshold 100% -fill white -draw "circle $((SIZE/2)),$((SIZE/2)) $((SIZE/2)),0" \) \
    -alpha off -compose copy_opacity -composite \
    -background white -flatten "$DIR/ic_launcher_round.png"

  # Foreground layer for adaptive icon (108dp canvas, icon centred in safe zone)
  # Safe zone is 66dp of the 108dp canvas — icon occupies inner 72% to avoid clipping
  ADAPTIVE_SIZE=$((SIZE * 108 / 72))
  magick "$SRC" -resize "${SIZE}x${SIZE}" -background none -gravity center \
    -extent "${ADAPTIVE_SIZE}x${ADAPTIVE_SIZE}" \
    "$DIR/ic_launcher_foreground.png"

  echo "  $DENSITY: ${SIZE}px ✓"
done

echo ""
echo "Done. All mipmap densities written to $RES"
echo ""
echo "Verify in Android Studio: app > res > mipmap > ic_launcher"
