# P0 Readiness Audit — Naša Hrvatska

**Date:** 2026-06-22
**Scope:** P0 submission blockers (store/primetime readiness)
**Method:** 6 parallel code-grounded finders (1 per P0 dimension) → adversarial verification of every P0 claim against real `file:line` → consolidated risk register. 10 raw findings; **2 P0 confirmed** after verification; **0 P0 claims rejected/downgraded**.
**App:** React 18 + TS PWA + Capacitor Android · Cloudflare Pages/Functions · Firebase Auth + Firestore · third-party AI for TTS/STT/scoring.

---

## Verdict

> **Status at time of audit: NO-GO** — 2 confirmed P0 blockers (both privacy/compliance).
> **Status after remediation (this change set): the two blockers are resolved in code; pending (a) human/legal review of the policy wording and (b) the Google Play Data Safety form update — see "Residual actions".**

Both blockers were policy/disclosure gaps, not application-logic defects: the app captures microphone audio and sends it to third-party speech-to-text providers, but neither privacy document disclosed it, and the store-linked policy made a materially false "no data beyond email" claim. Fixes are documentation + console-form only, with **zero application-code regression risk**.

---

## Confirmed P0 blockers & remediation

### P0-1 — In-app privacy policy omitted voice/STT processors and voice egress
- **Where:** `src/components/shared/PrivacyScreen.tsx` (data-processor list)
- **Evidence:** App uploads raw microphone audio to OpenAI Whisper (`functions/api/stt.js:79`), Deepgram (`functions/api/stt.js:34`), Cloudflare Workers AI (`functions/api/assess-speaking.js:81`), and Azure STT (`functions/api/pronunciation-assess.js:169`). The processor list named only Firebase/ElevenLabs/Azure(TTS)/Anthropic/Resend/Plausible and disclosed Azure/ElevenLabs as text-to-speech only — never that the user's **voice leaves the device**.
- **Impact:** GDPR Art. 13/14 transparency failure for biometric-adjacent data; Play Data Safety mismatch.
- **Fix (done):** Added a dedicated "Voice recordings & speech-to-text" section and rewrote the data-processor list to include OpenAI, Deepgram, Cloudflare Workers AI, Azure (TTS **and** STT), Google Cloud TTS, D-ID, PostHog, and Sentry, with accurate purposes and a no-retention/no-training statement.

### P0-2 — Store-linked policy made a false claim and disclosed no AI/voice processors
- **Where:** `public/privacy.html` (the Play-Store-designated policy URL)
- **Evidence:** Line 168 stated *"no other personal data beyond your email address"* — false, contradicted by its own journal-entry line and the verified voice/text/photo egress. The page named only Firebase.
- **Impact:** A store-published policy omitting the most sensitive flow (microphone egress) is non-compliant for a voice-capturing app.
- **Fix (done):** Removed the false statement; added "Voice recordings" and "Photos you submit" to the collected-data list; added an "AI & Voice Processing" card disclosing the full processor set; bumped the "Last updated" date. `public/privacy.html` and `PrivacyScreen.tsx` now describe the same, complete data flows.

---

## Third-party data-egress inventory (single source of truth)

Derived from `functions/api/` (`fetch(` + `env.AI.run`). This table is the reference for both policies and the Play Data Safety form.

| Processor | Data sent | Purpose | Egress point |
|---|---|---|---|
| Google Firebase | email, learning progress, journal | auth + database | (SDK) |
| Anthropic (Claude) | user text, conversation, **submitted photo** | AI feedback, tutoring, scoring, photo-vocab | many `*/v1/messages`; `photo-vocab.js` |
| OpenAI (Whisper) | **voice audio** | speech-to-text | `stt.js:79` |
| Deepgram | **voice audio** | speech-to-text | `stt.js:34` |
| Cloudflare Workers AI (Whisper) | **voice audio** | speech-to-text (pronunciation) | `assess-speaking.js:81` |
| Microsoft Azure Speech | text **and voice audio** | text-to-speech + pronunciation assessment | `tts.js:90`, `pronunciation-assess.js:169` |
| ElevenLabs | text | text-to-speech | `tts.js:123` |
| Google Cloud TTS | text | text-to-speech | `tts.js:343` |
| D-ID | text | talking-avatar video | `did-stream.js:63`, `npc-video.js:116` |
| Resend | support message + display name/level/XP | support email | `contact.js:270`, `digest.js:132` |
| Plausible / PostHog / Sentry | usage / error telemetry | analytics & monitoring | (SDK) |

---

## What passed clean (zero confirmed P0)

Adversarial verification confirmed **no** P0 blockers in the other five dimensions:

| Dimension | Result |
|---|---|
| Endpoint auth & cost-abuse | No P0 (notable given prior fail-open history) |
| Signal authenticity (scores) | No P0 (notable given prior fabricated-score history; scores trace to real measurement) |
| Completion-gate & progress-loss | No P0 |
| Secrets & supply chain | No P0 (no committed secrets; CI gates enforced) |
| Core-journey correctness | No P0 |

8 of the 10 raw findings were P1/P2 (non-blocking) and are tracked separately for post-launch hardening.

---

## Cross-cutting theme (root cause)

The privacy policy was maintained as static copy that **drifted from the code** as each AI/voice vendor shipped without a matching disclosure, and **two divergent policy documents** existed with no gate tying disclosures to actual `fetch()`/`env.AI.run` egress. Recommended durable fix: a lightweight CI/review check that fails when a new external egress is added without a corresponding processor disclosure.

---

## Residual actions before final GO

1. **Human/legal review** of the revised wording in `public/privacy.html` and `PrivacyScreen.tsx` (retention claims and processor list) — code changes get the *facts* right; legal sign-off is a separate gate.
2. **Google Play Console → Data Safety:** declare **"Voice or sound recordings"** as *Collected* and *Shared*, plus photos and the text/AI flows; align to the inventory above.
3. **Process guard:** add the egress-vs-disclosure check so this drift class cannot silently re-ship.
4. Re-run the privacy-data-flows dimension → confirm P0 = 0 → flip to **GO**.

---

*Generated by the P0 readiness audit workflow (adversarially verified). Findings are code-grounded; this is an engineering readiness assessment, not legal advice.*
