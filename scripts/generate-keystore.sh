#!/usr/bin/env bash
# generate-keystore.sh
# Generates the Android release keystore for Naša Hrvatska.
# Run ONCE, store the .jks file somewhere safe (Dropbox / 1Password), NEVER commit it.
#
# Usage:
#   bash scripts/generate-keystore.sh
#
# After running, copy the fingerprint output and paste it into:
#   public/.well-known/assetlinks.json  → "sha256_cert_fingerprints"
#   Google Play Console → App integrity → App signing → "Upload key fingerprint"

set -e

KEYSTORE_PATH="./nasa-hrvatska-release.jks"
KEY_ALIAS="nasa-hrvatska"
VALIDITY_DAYS=10950   # 30 years — Play Store requires > 25 years

echo ""
echo "=== Naša Hrvatska — Android Release Keystore Generator ==="
echo ""
echo "You will be prompted for a keystore password and your details."
echo "Store these credentials somewhere safe — you cannot recover them."
echo ""

keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -dname "CN=Nasa Hrvatska, OU=App, O=Nasa Hrvatska, L=Zagreb, ST=Zagreb, C=HR"

echo ""
echo "=== Keystore generated: $KEYSTORE_PATH ==="
echo ""
echo "=== SHA-256 fingerprint (paste into assetlinks.json and Play Console) ==="
keytool -list -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  2>/dev/null | grep "SHA256:"

echo ""
echo "Next steps:"
echo "  1. Copy the SHA256 fingerprint above"
echo "  2. Paste into public/.well-known/assetlinks.json (sha256_cert_fingerprints)"
echo "  3. Upload nasa-hrvatska-release.jks to Google Play Console → App signing"
echo "  4. Add to android/app/build.gradle signingConfigs block (see ANDROID_BUILD.md)"
echo "  5. NEVER commit the .jks file — add to .gitignore"
