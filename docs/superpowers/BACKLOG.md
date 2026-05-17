# Naša Hrvatska — Remaining Follow-Up Backlog

**Compiled:** 2026-05-16 (after SP11e + SP11f shipped).
**Scope:** every deferred / out-of-scope / follow-up item surfaced from SP1–SP11d acceptance docs and design specs, triaged into actionable categories with effort estimates and dependencies. Bundle-IP track is now CLOSED; this is everything else.

Read this before scheduling the next sprint.

---

## Triage rubric

| Tier | Meaning | Action |
|---|---|---|
| **NOW** | Time-gated or trivial verification work | Do today |
| **NEXT** | Small (<4h), bounded, low risk, high value | Plan + ship in one focused session |
| **PLAN** | Multi-day feature sprint, needs its own spec + plan + execution loop | Schedule as own sprint |
| **PRODUCT** | Needs product decision before any engineering | Block on user input |
| **SKIP** | Explicit non-goal from prior design docs OR superseded by SP11e/f | Do nothing |

---

## NOW — Time-gated / trivial

### 1. 24h CF 5xx check on `/api/content/{core, lessons, grammar, stories}`
- **Effort:** 5 minutes of dashboard review.
- **When:** ~2026-05-17 18:30 CDT (24h after SP11f deploy).
- **Why:** Standard post-deploy verification carried forward from SP11/11b/11c/11d.
- **What to check:** Cloudflare → Functions logs → filter `status:5xx` → confirm zero hits across the 4 endpoints for the prior 24h.
- **What to do if there are 5xx:** Trace the request path. Likely V composition error at cold start, or a content-shape mismatch. Roll back if needed via CF Pages one-click deploy revert.

### 2. SP4a real-device verification
- **Effort:** ~15 minutes (3 device checks, requires physical access).
- **Owner:** jschr (only — requires iPhone/iPad/Pixel hardware).
- **Why:** Before any future audio work, confirm SP4a `useRecorder` works on iOS Safari real device, iOS Capacitor real iPhone, and Android Capacitor real Pixel. CI Playwright projects already pass.
- **What to do:** Open `https://nasahrvatska.com` on each device, navigate to ShadowingScreen, attempt mic recording, confirm waveform + transcript.

---

## NEXT — Short bounded sprints (each <4h, plan + ship in one session)

### 3. SP3 — `max-lines` ESLint rule
- **Effort:** ~2h (set threshold, identify offenders, decide policy).
- **Why:** SP3 plan deferred this as the "final step" — never executed.
- **Key decision:** what threshold? Current state: content.tsx (2162), LearnPath.tsx (~900), HomeTab.tsx (~600+). Strict (~400) requires splitting ~20 files. Lenient (~1500) only catches content.tsx. Recommended: 1000 with per-file overrides for content.tsx (data file, exempt) and 2-3 known large components.
- **Deliverable:** `eslint.config.js` update + per-file overrides + commit.

### 4. SP3 — ErrorBoundary consolidation
- **Effort:** ~2h (read both impls, decide merge strategy, refactor callers).
- **Why:** SP3 plan deferred this. Two implementations exist: `src/components/shared/ErrorBoundary.tsx` and `src/components/shared/ScreenErrorBoundary.tsx`. Likely they diverged for different render contexts.
- **Pre-work:** diff the two, document why they exist, decide if one supersedes the other or if both have legitimate reasons.
- **Risk:** consolidating wrong could break crash recovery on specific screens. Read consumers carefully before merging.

### 5. Enterprise Quality — Firebase SDK bundling optimization
- **Effort:** ~3h (audit imports, switch to modular SDK, verify bundle delta).
- **Why:** Enterprise-quality plan listed as out-of-scope. Modular Firebase imports can save 100-200KB.
- **Pre-work:** `npm run build` → check current Firebase chunk size. If <80KB already gzipped, skip — diminishing returns.
- **Approach:** replace `import firebase from 'firebase/app'` with named tree-shakeable imports (`import { initializeApp } from 'firebase/app'`).

---

## PLAN — Multi-day feature sprints (each needs own spec + plan)

These are too large to ship in a single execution session. Each should get the full superpowers brainstorming → writing-plans → executing-plans cycle.

### 6. SP5b — Extend user-context layer to remaining 7 AI endpoints
- **Estimated effort:** 1-2 days.
- **Spec exists?** Partial (SP5 design doc references it as a follow-up slice).
- **Dependencies:** SP5 user-context layer (already shipped).
- **Scope per SP5 design's "out of scope" list:**
  - Extend layer to remaining 7 AI endpoints
  - Migrate the multi-mode `callAI` helper
  - Wire `appendRecentError` into per-unit grammar drill screens
  - Add timeout/retry to `_aiPost`
- **Why it matters:** Right now user-context only enriches some AI calls. Others fly blind. Inconsistent learner-aware AI = inconsistent UX.
- **First step:** Write `docs/superpowers/specs/2026-XX-XX-sp5b-user-context-expansion-design.md`.

### 7. SP5c — Server-side weekly summary
- **Estimated effort:** 1-2 days.
- **Why:** Generate a Sunday-morning email/notification with the week's progress, weak topics, suggested focus.
- **Decision needed:** push channel (Web Push? email? both?). Auth/role.

### 8. SP5d — A/B framework for correction-quality lift
- **Estimated effort:** 2-3 days.
- **Why:** Currently no way to measure if AI correction changes (e.g. new prompt versions) actually improve user outcomes.
- **Approach:** lightweight client-side cohort assignment + correction-quality event logging + Firestore aggregation.

### 9. SP6b–f — Inline correction diff enhancements
- **Estimated effort:** ~5-7 days for all 5 sub-items.
- **Items (from SP6 design):**
  - **SP6b** Error-type color coding (case/aspect/etc.)
  - **SP6b** Extend CorrectionDiff to DictationScreen
  - **SP6c** "Practice this pattern" CTA on each diff span
  - **SP6d** Save-as-flashcard from a diff span
  - **SP6e** Click-to-explain on individual Croatian words
  - **SP6f** LCS-based real diff (only if real-world correction shapes break the projection)
- **Suggested order:** SP6b color coding (highest UX value) → SP6e click-to-explain → SP6d save-as-flashcard → SP6c practice-pattern → SP6f LCS (only if needed) → SP6b DictationScreen extension.

### 10. SP7b–f — Adaptive reading recommendations
- **Estimated effort:** ~3-5 days.
- **Items:**
  - **SP7b** AI-generated rationale prose (replaces the one heuristic sentence)
  - **SP7c** Cross-device sync of `nh_recent_reads` (device-local by design — confirm before implementing)
  - **SP7d** C2-tier stories (new authoring work — content, not engineering)
  - **SP7e** Click-through analytics on recommendation acceptance/completion lift
  - **SP7f** Multi-story "today's reading list" with re-ranking on completion
- **Decision needed for SP7d:** if you want C2 stories, that's content work (1-2 weeks authoring) before engineering.

### 11. SP8b–f — Phoneme heatmap follow-ups
- **Estimated effort:** ~4-6 days.
- **Items:**
  - **SP8b** Practice-this-sound CTA in popover
  - **SP8c** Pronunciation error tracking → SP5 user-context integration
  - **SP8d** Pronunciation history dashboard
  - **SP8e** Variable-speed native audio playback
  - **SP8f** Minimal-pair drill generator
- **Strong coupling:** SP8c depends on SP5b shipping first.

### 12. SP9b–g — Advanced grammar units
- **Estimated effort:** ~4-6 days.
- **Items:**
  - **SP9b** Dedicated practice screens per advanced unit
  - **SP9c** Azure TTS audio for example sentences
  - **SP9d** SP5 user-context integration for B2/C1 weak-topic tracking
  - **SP9e** HR-as-target-language tip translations (currently EN→HR; flip)
  - **SP9f** C2-level grammar units (needs C2 reading content first — block on SP7d)
  - **SP9g** AI-generated additional drills
- **Suggested order:** SP9c (TTS — easy win), SP9b (practice screens), SP9d (user-context), SP9g (AI drills), SP9e (translation flip), SP9f (block on C2 content).

### 13. SP10b–f — Observability + Sentry hardening
- **Estimated effort:** ~3-5 days.
- **Items:**
  - **SP10b** Sentry telemetry hardening (release tagging, source maps upload, user context)
  - **SP10c** Performance monitoring / Core Web Vitals
  - **SP10d** CI velocity optimization (parallelize E2E, cache layers)
  - **SP10e** Cross-browser e2e expansion (Firefox + WebKit smoke beyond current Playwright config)
  - **SP10f** Observability dashboard (single CF dashboard for 5xx, latency, error budget)
- **Suggested order:** SP10b first (informs SP10c/f), SP10d (developer ergonomics), SP10c/f (visibility), SP10e (regression coverage).

### 14. Pedagogy Foundations follow-ups
- **Estimated effort:** ~4-7 days (mostly content + curriculum design).
- **Items deferred from SP13 pedagogy-foundations spec:**
  - **L-05** Reorder case lessons by frequency
  - **L-07** Register awareness tags (formal/informal)
  - **L-09** Dialect markers in vocabulary
  - **L-10** Pitch accent discovery path
- **Note:** Aspect theory rewrite at B1 also listed — substantial curriculum work.

### 15. Exercise Contract Phase 2 + Phase 3
- **Estimated effort:** ~3-4 days.
- **Items:**
  - **Phase 2** Refactor 6 gold-standard drills into shared `QuizScaffold` component
  - **Phase 2** Add quiz checkpoints to Flashcards / Speaking / Story / Listening / Writing / SRS Review
  - **Phase 3** Integrate LearnPath items as chips in Today's Session card

### 16. Content & Curriculum Adaptive — out-of-scope items
- **Effort:** ~3-5 days for all four.
- **Items:**
  - Difficulty UI indicator for exercises (tracked but not displayed)
  - Path branching (LEARN_PATH structure currently linear)
  - Writing assessment exercises (reading/listening only currently)
  - Cross-device conflict resolution for session state

### 17. UX Redesign — open questions
- **Items needing decisions:**
  - Cross-device sync for session state (how to reconcile conflicts)
  - Session XP award logic across modalities
  - Learn-tab integration with adaptive system
- **Status:** Open questions, not implementation. Block on PRODUCT decisions.

---

## PRODUCT — Needs your decision before any engineering

### 18. Paywall / AI-tab consolidation
- SP11 spec called out as separate work tracked elsewhere.
- Engineering complexity: medium (Stripe + entitlement gating).
- **Decision needed:** what's gated, what's free, what's the pricing tier?

### 19. Server-side XP admin endpoint
- Why useful: legitimate XP correction/reset for users who hit edge cases.
- **Decision needed:** admin-only? user self-service with rate limit? OAuth role check via Firebase custom claims?

### 20. C2-tier stories + C2 grammar units (SP7d + SP9f)
- Engineering is the easy part — authoring is the bottleneck.
- **Decision needed:** do you want C2 content authored? If yes, who writes it (you, hired Croatian linguist, AI-generated then reviewed)?

---

## SKIP — Explicit non-goals from prior design docs

Do NOT do these without explicit reversal:

| Item | Source | Why no |
|---|---|---|
| Cross-device mic-state sync | SP4b non-goals | Different devices = different mics; sync is anti-pattern by design |
| Refactor `PronunciationScorer` itself | SP4a non-goals | Intentional dual-path code; clean migration would erase platform dispatch |
| C2-tier stories (engineering) | SP7 non-goals | Separate authoring workstream — see PRODUCT-20 |
| WaveformVisualizer redesign | SP4a non-goals | No mic logic; renders audio data from elsewhere |
| Whisper for every speaking exercise | SP4a non-goals | Only AIConversation/LiveTutor/Maja use Whisper today; intentional scope |
| Pre-reading vocab preview | SP7 non-goals | Separate workstream |
| Inline click-to-translate | SP7 non-goals | Separate workstream (NOT the same as SP6e click-to-explain) |
| Post-reading short-answer eval | SP7 non-goals | Separate workstream |
| Refactor `category: 'speaking'` tags | SP4b non-goals | Cosmetic, no functional impact |
| "Force re-show this exercise" debug toggle | SP4b non-goals | Dev-only utility, not user feature |
| Refactoring `category: 'speaking'` tags | SP4b non-goals | Same as above |
| Cross-device sync of `nh_recent_reads` (SP7c) | SP7 non-goals | Device-local by design |
| AI-generated rationale prose (initial scope) | SP7 non-goals at SP7-launch | Promoted to SP7b above — actively in the PLAN tier now |

---

## Recommended sequencing

If you're shipping continuously, this order maximizes value/effort:

1. **Tomorrow** — NOW items (24h CF check, optional device verification)
2. **This week (NEXT)** — SP3 max-lines + SP3 ErrorBoundary + Firebase SDK optimization (3 short sprints)
3. **Next 2 weeks (PLAN, high-value)** — SP5b (unblocks SP8c, SP9d) → SP6b color coding (high UX win) → SP10b Sentry hardening (developer ergonomics)
4. **Then** — pick from SP6c-f, SP7b/e/f, SP8b-f, SP9b-c/g, SP10c-f based on what users feedback most
5. **Block on PRODUCT decisions** — paywall, XP admin endpoint, C2 content authorship
6. **Defer indefinitely or never** — SKIP items

---

## How this doc gets used

- Read top-to-bottom at start of every new sprint planning session.
- When an item ships, delete it (don't strikethrough — keep this doc lean).
- When you discover a new follow-up during work, add it under NEXT or PLAN with effort estimate.
- When a PRODUCT decision lands, move the item out of PRODUCT into NEXT or PLAN.
- Re-triage quarterly — items can move tiers as conditions change.
