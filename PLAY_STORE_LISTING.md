# Naša Hrvatska — Google Play Store Listing

## App Details

| Field | Value |
|-------|-------|
| **App ID** | com.nasahrvatska.app |
| **Category** | Education |
| **Content Rating** | Everyone (Everyone 10+ in USA) |
| **Target Age** | 13+ |
| **Price** | Free |
| **In-App Purchases** | No |

---

## App Title (30 characters max)

```
Naša Hrvatska – Learn Croatian
```
*(30 characters — exact max)*

---

## Short Description (80 characters max)

```
Learn Croatian with AI pronunciation, flashcards & cultural stories. Free.
```
*(74 characters)*

---

## Full Description (4,000 characters max)

```
Learn to speak Croatian — the language of the Adriatic coast, Dalmatian seafood, Karlovačko beer, and family you haven't met yet.

NAŠA HRVATSKA IS DIFFERENT
Most language apps teach tourist phrases. We teach Croatian the way Croatians actually speak it — with proper declensions, verbal aspects, clitic ordering, pitch accent, and cultural context that makes you sound like you belong.

WHAT YOU GET — ALL FREE
• 1,000+ Croatian words with native pronunciation
• Flashcard spaced repetition (proven memory science)
• Multiple-choice vocabulary drills across 50+ categories
• Sentence tile assembly — tap words to build sentences
• Listening comprehension with real audio
• Speaking sprint — hear a prompt, speak in Croatian, compare with a native response
• Verbal aspect drills (the hardest part of Croatian, taught properly)
• Conjugation practice — all tenses, all persons
• Case system drills — all 7 Croatian cases with real examples
• AI conversation partner — practice speaking to an AI Croatian speaker
• Cultural stories — history, food, music, football, the kafić culture
• Knight companion mascot that celebrates your progress

SCIENCE-BACKED LEARNING
• Spaced repetition scheduling (FSRS algorithm) — review words at the optimal moment
• CEFR-aligned levels: A1 through B2
• Challenge Mode with hearts — 5 per day, regenerate every 4 hours
• Daily streak tracking and reminders
• Weak word detection — automatically surfaces words you keep getting wrong
• XP and leaderboard — compete with yourself or your family

CROATIAN CULTURE BUILT IN
Learning a language without its culture is like visiting Split without seeing Diocletian's Palace. We teach you:
• How to order like a local at a konoba
• The art of sitting in a kafić for three hours without feeling rushed
• Croatian football passion (Hajduk vs Dinamo is serious)
• Klapa music, Sinjska alka, Baška Tablet, and why Croats say "Lijepa naša"
• How to navigate Zagreb's upper and lower town
• Dalmatian vs Zagreb vocabulary differences

WHO IT'S FOR
• Diaspora reconnecting with heritage Croatian
• Partners of Croatians who want to impress the family
• Travellers visiting Croatia, Bosnia, or Herzegovina
• Language learners who've tried other apps and want something more serious
• Anyone who's eaten peka, drunk Karlovačko, and wants to say more than "hvala"

PRIVACY FIRST
• No ads, ever
• No selling your data
• Firebase sync for cross-device progress
• Optional analytics with cookie consent
• Full privacy policy in-app and at nasa-hrvatska.pages.dev/privacy.html

TECHNICAL
• Works offline — core learning content available without internet
• Dark mode support
• Adjustable font size
• Push notifications for streak reminders (opt-in)
• Android back button support
• Adaptive icon for Android 8+

Start with "Dobar dan" — end up talking about the Battle of Sisak.

Učimo zajedno. Let's learn together.
```

*(Character count: ~2,800 — well within the 4,000 limit; room to expand)*

---

## Keywords / Tags (Play Store categories and search terms)

**Primary keywords:**
- Croatian language learning
- Learn Croatian
- Croatian for beginners
- Croatian vocabulary
- Croatian phrases

**Secondary keywords:**
- Hrvatska
- CEFR Croatian
- Croatian flashcards
- Croatian grammar
- Dalmatian language

**Long-tail:**
- Croatian heritage language app
- Learn Croatian for travel
- Croatian diaspora app
- Croatian pronunciation practice
- Croatian spaced repetition

---

## Content Rating Questionnaire Answers

**Violence:** None
**Sexual content:** None
**Profanity:** None
**Controlled substances:** None
**User-generated content:** Yes (journal entries, stored locally on device only)
**Personal information collection:** Yes (email for account, learning progress)
**Share location:** No
**Share personal info with third parties:** Analytics (opt-in, PostHog), Crash reports (Sentry)
**Target audience:** 13 and over

→ **Expected rating: Everyone** (or Everyone 10+)

---

## Data Safety Form (Play Console → Data Safety)

### Data collected and shared:

| Category | Data type | Collected | Shared | Purpose | Optional? |
|----------|-----------|-----------|--------|---------|-----------|
| Personal info | Email address | Yes | No | Account creation | No |
| Personal info | User ID (Firebase UID) | Yes | No | Account sync | No |
| App activity | App interactions (XP, lessons) | Yes | PostHog (opt-in) | Analytics | Yes |
| App activity | Crash logs | Yes | Sentry | App stability | No |
| Audio | Voice recordings | No (on-device only, never uploaded) | No | — | — |

### Data handling:
- Data is encrypted in transit (TLS 1.2+)
- Data is encrypted at rest (Firebase/Google infrastructure)
- Users can request deletion: privacy@nasahrvatska.com
- Users can see their data in-app (Settings → Profile)

---

## Store Listing Graphics Requirements

### App Icon
- **Already generated:** all mipmap densities via `scripts/generate-android-icons.sh`
- High-res icon for store: **512 × 512 px PNG** (upload to Play Console)
- Source: `public/icon-1024.png` → scale down with ImageMagick or Figma

### Feature Graphic (required)
- **Size:** 1024 × 500 px (landscape)
- **Format:** PNG or JPEG, no alpha channel
- **Content:** App name "Naša Hrvatska", Croatian flag motif, tagline
- **Suggested design:** Deep teal gradient background (#0e7490), white app name in Playfair Display, Croatian coat of arms in corner, tagline "Learn Croatian. Really."
- **DO NOT** include device frames in the feature graphic
- **DO NOT** include price or promotional claims ("Free", "#1", etc.)
- Create in Canva, Figma, or Adobe Express → export as PNG

### Phone Screenshots (required — at least 2, up to 8)
- **Size:** 1080 × 1920 px minimum (16:9 or 9:16)
- **Format:** PNG or JPEG
- **Content suggestions (in order):**
  1. Home tab — streak ring, CEFR badge, daily lesson card
  2. Flashcard screen — Croatian word + pronunciation button
  3. Multiple choice game — correct answer highlighted
  4. Practice tab — filter pills, exercise cards
  5. Speaking sprint — waveform, Croatian prompt
  6. Cultural story screen
  7. Profile / Stats — XP chart, badge collection
  8. Dark mode — any screen showing dark theme
- **Tool:** Use Android emulator screenshots or Chrome DevTools → Samsung Galaxy frame
- **Note:** Play Console automatically adds a device frame if you don't include one

### 7-inch Tablet Screenshots (optional but recommended)
- **Size:** 1200 × 1920 px minimum
- Only required if you declare tablet support in the manifest

---

## Privacy Policy URL

```
https://nasa-hrvatska.pages.dev/privacy.html
```

*(Deployed on Cloudflare Pages — always current)*

---

## Store Contact Details

- **Developer name:** Naša Hrvatska
- **Email:** jschreiner75@gmail.com
- **Website:** https://nasa-hrvatska.pages.dev
- **Privacy policy:** https://nasa-hrvatska.pages.dev/privacy.html

---

## Play Store Submission Checklist

### Before uploading AAB:
- [ ] Run `bash scripts/version-bump.sh patch` (or minor/major)
- [ ] Run `npm run build`
- [ ] Run `npx cap sync android`
- [ ] Run `cd android && ./gradlew bundleRelease`
- [ ] Verify AAB at `android/app/build/outputs/bundle/release/app-release.aab`

### In Play Console:
- [ ] Create app (package name: `com.nasahrvatska.app`)
- [ ] Upload AAB to Internal Testing track first
- [ ] Complete Store Listing (title, description, screenshots, feature graphic)
- [ ] Complete Content Rating questionnaire
- [ ] Complete Data Safety form
- [ ] Add Privacy Policy URL
- [ ] Set target age group: 13+
- [ ] App Access: all features available without special credentials
- [ ] Enable Play App Signing (mandatory for new apps)
- [ ] After enabling Play App Signing: update `assetlinks.json` with BOTH fingerprints
- [ ] Test internal track on physical device
- [ ] Promote to Production when satisfied

### Post-launch:
- [ ] Monitor Android Vitals (crash rate, ANR rate)
- [ ] Monitor Reviews
- [ ] Set up reply templates for common questions
