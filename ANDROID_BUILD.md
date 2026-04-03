# Naša Hrvatska — Android Build & Play Store Submission Guide

## Prerequisites

- Java 17+ (`java -version`)
- Android Studio Hedgehog or newer (for SDK Manager and signing)
- ImageMagick (`magick --version`) — for icon generation only

---

## 1. Generate the Release Keystore (one-time)

```bash
bash scripts/generate-keystore.sh
```

- Saves `nasa-hrvatska-release.jks` in the repo root
- **Back this file up to Dropbox / 1Password immediately**
- **Never commit it** — it's in `.gitignore`
- Copy the SHA-256 fingerprint printed at the end

---

## 2. Paste SHA-256 into assetlinks.json

Edit `public/.well-known/assetlinks.json`:

```json
"sha256_cert_fingerprints": [
  "AA:BB:CC:..."   ← paste your fingerprint here
]
```

Then rebuild and push so the file deploys to Cloudflare Pages.

---

## 3. Add Signing Config to build.gradle

Edit `android/app/build.gradle` and add inside the `android {}` block:

```groovy
signingConfigs {
    release {
        storeFile file('../../../../nasa-hrvatska-release.jks')
        storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
        keyAlias "nasa-hrvatska"
        keyPassword System.getenv("KEY_PASSWORD") ?: ""
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        // ... (minifyEnabled etc. already set)
    }
}
```

Set env vars before building:

```bash
export KEYSTORE_PASSWORD="your-keystore-password"
export KEY_PASSWORD="your-key-password"
```

---

## 4. Generate Android Icons (one-time, or when icon changes)

```bash
bash scripts/generate-android-icons.sh
```

Requires ImageMagick. Writes all mipmap densities from `public/icon-1024.png`.

---

## 5. Build the Web App

```bash
npm run build
```

---

## 6. Sync Web Assets to Android

```bash
npx cap sync android
```

---

## 7. Build the Release AAB

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 8. Play Store Submission Checklist

- [ ] App ID: `com.nasahrvatska.app`
- [ ] versionCode incremented in `android/app/build.gradle`
- [ ] versionName updated (e.g. `"2.0.0"`)
- [ ] AAB built and signed with release keystore
- [ ] SHA-256 fingerprint in `assetlinks.json` matches Play Console
- [ ] App screenshots captured (phone + 7-inch tablet)
- [ ] Store listing: short description (80 chars), full description (4000 chars)
- [ ] Content rating questionnaire completed
- [ ] Data Safety form completed (declares: PostHog analytics, Sentry crash reporting)
- [ ] Privacy policy URL: `https://nasa-hrvatska.pages.dev/privacy`
- [ ] Target audience: 13+ (language learning)
- [ ] Category: Education

---

## 9. Data Safety Declarations (Play Console)

| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Crash logs | Yes | With Sentry (EU processor) | App stability |
| App interactions | Yes (opt-in only) | With PostHog (EU processor) | Analytics |
| User IDs | Yes (Firebase Auth UID) | No | Account sync |
| Audio | No (processed on-device) | No | — |

---

## 10. Update assetlinks.json After Play App Signing

When you enable Play App Signing in the Play Console, Google re-signs your app
with their own certificate. You'll need to add Google's SHA-256 as a second entry:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.nasahrvatska.app",
      "sha256_cert_fingerprints": [
        "YOUR_UPLOAD_KEY_SHA256",
        "GOOGLE_PLAY_SIGNING_KEY_SHA256"
      ]
    }
  }
]
```

Both fingerprints are shown in Play Console → App integrity → App signing.
