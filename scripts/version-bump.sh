#!/usr/bin/env bash
# version-bump.sh
# Atomically increments versionCode in android/app/build.gradle, updates
# versionName, and syncs package.json — all in one command.
#
# Usage:
#   bash scripts/version-bump.sh patch   → 2.0.0 → 2.0.1  (bug fixes)
#   bash scripts/version-bump.sh minor   → 2.0.0 → 2.1.0  (new features)
#   bash scripts/version-bump.sh major   → 2.0.0 → 3.0.0  (breaking changes)
#
# What it does:
#   1. Reads current version from package.json
#   2. Bumps according to semver type
#   3. Updates package.json "version" field
#   4. Reads current versionCode from android/app/build.gradle
#   5. Increments versionCode by 1
#   6. Updates versionName to new semver in build.gradle
#   7. Prints summary — you then commit and push

set -e

BUMP_TYPE="${1:-patch}"

if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

PKG="package.json"
GRADLE="android/app/build.gradle"

if [ ! -f "$PKG" ]; then
  echo "ERROR: Run from the repo root — $PKG not found"
  exit 1
fi
if [ ! -f "$GRADLE" ]; then
  echo "ERROR: Run from the repo root — $GRADLE not found"
  exit 1
fi

# ── Read current version ─────────────────────────────────────────────────────
CURRENT=$(grep '"version"' "$PKG" | head -1 | sed 's/.*"version": *"\([^"]*\)".*/\1/')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

echo "Current version: $CURRENT (code: $(grep 'versionCode' "$GRADLE" | head -1 | tr -dc '0-9'))"

# ── Bump semver ──────────────────────────────────────────────────────────────
case "$BUMP_TYPE" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

# ── Read and increment versionCode ──────────────────────────────────────────
OLD_CODE=$(grep 'versionCode' "$GRADLE" | head -1 | tr -dc '0-9')
NEW_CODE=$((OLD_CODE + 1))

# ── Apply changes ────────────────────────────────────────────────────────────

# package.json
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS sed requires '' for in-place
  sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" "$PKG"
else
  sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" "$PKG"
fi

# android/app/build.gradle — versionCode
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/versionCode $OLD_CODE/versionCode $NEW_CODE/" "$GRADLE"
  sed -i '' "s/versionName \"$CURRENT\"/versionName \"$NEW_VERSION\"/" "$GRADLE"
else
  sed -i "s/versionCode $OLD_CODE/versionCode $NEW_CODE/" "$GRADLE"
  sed -i "s/versionName \"$CURRENT\"/versionName \"$NEW_VERSION\"/" "$GRADLE"
fi

echo ""
echo "✓ Version bumped: $CURRENT → $NEW_VERSION"
echo "✓ versionCode:    $OLD_CODE → $NEW_CODE"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Rebuild: npm run build && npx cap sync android"
echo "  3. Build AAB: cd android && ./gradlew bundleRelease"
echo "  4. Commit: git add -A && git commit -m 'chore: bump version to $NEW_VERSION (code $NEW_CODE)'"
echo "  5. Tag: git tag v$NEW_VERSION && git push origin master --tags"
