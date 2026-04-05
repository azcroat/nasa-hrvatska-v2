# CLAUDE.md — Naša Hrvatska

This file gives Claude Code full context to work effectively on this codebase without re-deriving architecture or conventions from scratch.

---

## Project Overview

**Naša Hrvatska** is a Croatian language-learning PWA (Progressive Web App) for the diaspora and heritage learners. It combines gamification (XP, streaks, hearts, leagues, knight mascot), spaced-repetition flashcards (FSRS), grammar tracks, cultural content, and AI tutoring.

- **Live URL**: https://nasahrvatska.com
- **Repo**: AzCroat/nasa-hrvatska-v2
- **Deployment**: Cloudflare Pages — every `git push origin master` auto-deploys. No manual deploy step.
- **Stack**: React 18 + Vite, Firebase (Auth + Firestore), Cloudflare Pages Functions (serverless API), Capacitor (iOS/Android), TypeScript (partial migration in progress)

---

## Development Commands

```bash
npm run dev              # Vite dev server
npm run build            # Production build (runs prebuild: convert images + generate icons)
npm run preview          # Preview production build locally
npm run test             # Vitest unit tests (run once)
npm run test:watch       # Vitest in watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright end-to-end (builds first)
npm run lint             # ESLint (src + functions)
npm run lint:fix         # Auto-fix ESLint issues
npm run typecheck        # tsc --noEmit (TypeScript check without emit)
npm run verify:firestore # Verify Firestore security rules
npm run cap:sync         # Build + sync Capacitor native projects
```

---

## Directory Structure

```
src/
├── App.jsx                    # Root component — mounts context providers, routing, sync
├── data.jsx                   # Re-export barrel + legacy helpers (LEARN_PATH, flashcard data)
├── context/
│   ├── AppContext.jsx          # Global state: screen nav (scr), favs, jWords, dchl*
│   └── StatsContext.tsx        # Stats state via useReducer (statsReducer.ts)
├── hooks/
│   ├── useScreenLauncher.js    # Screen navigation + BLACK_HOLE_SCREENS dwell-timer XP awards
│   ├── useSyncManager.js       # Bidirectional Firebase sync (save + load)
│   ├── useAuth.js              # Firebase auth state
│   ├── useAward.ts             # XP + badge award logic
│   └── ...                    # 20+ other hooks
├── lib/
│   ├── firebase.js             # Firebase init, all Firestore read/write functions
│   ├── progressSnapshot.ts     # Single source of truth for what gets persisted to Firebase
│   ├── mergeStatsFromRemote.ts # Remote→local merge logic (additive, never destroys progress)
│   ├── sanitizeStats.ts        # Validates/clamps stats before they're applied
│   ├── statsReducer.ts         # useReducer for stats (XP, lc, gc, badges, vs, etc.)
│   ├── srs.js                  # Spaced repetition (FSRS algorithm)
│   ├── streak.js               # Streak calculation
│   ├── appUtils.js             # getStreak, getStreakFreezes, shared utilities
│   ├── dateUtils.js            # localDateStr, weekKey — canonical date helpers
│   ├── constants/
│   │   ├── storage.js          # All localStorage key names in one place
│   │   └── timings.js          # All timeout/delay constants (MS, TIMEOUTS)
│   └── ...                    # 25+ other lib modules
├── components/
│   ├── home/                  # HomeTab, DailyCroatianSection, PathProgressCard, etc.
│   ├── learn/                 # All lesson screens (50+), LearnTab, GrammarTrack
│   ├── practice/              # Flashcards, McGame, Dialogue, Speaking, Writing, etc.
│   ├── profile/               # StatsTab, Leaderboard, FriendsScreen, WeeklyLeague, etc.
│   ├── croatia/               # CultureTab, CityOfDay, EasterScreen, etc.
│   └── shared/                # CroatianKnight, CelebrationModal, AppToasts, AppModals, etc.
├── data/                      # Lesson content, word lists, grammar data (split from data.jsx)
└── types/
    └── index.ts               # Shared TypeScript types (Stats, etc.)

functions/
└── api/                       # Cloudflare Pages Functions (serverless)
    ├── ai-chat.js             # AI Tutor (Anthropic Claude API)
    ├── league.js              # Weekly League — requires PUSH_SUBSCRIPTIONS KV binding
    ├── contact.js             # Contact form → Resend
    ├── daily-culture.js       # Daily cultural fact generation
    └── ...                    # 15+ other API endpoints

public/                        # Static assets, SW, icons
scripts/                       # Build scripts (image conversion, icon generation)
wrangler.toml                  # Cloudflare Workers config for scheduled push notifications
```

---

## Critical Architecture: Stats & Progress

### Stats object shape (`Stats` type in `src/types/index.ts`)
```typescript
{ xp: number, lc: number, gc: number, badges: string[], vs: string[], ... }
```
- `xp` — experience points
- `lc` — lesson completions (informational/cultural screens)
- `gc` — grammar completions
- `vs` — array of visited screen keys (used by LEARN_PATH `ck` functions)
- `badges` — earned badge IDs

### statsReducer (src/lib/statsReducer.ts)
All stat mutations go through `dispatch({ type, payload })`. Never mutate stats directly. Key action types: `AWARD_XP`, `COMPLETE_LESSON`, `COMPLETE_GRAMMAR`, `VISIT_SCREEN`, `LOAD_REMOTE`.

### progressSnapshot (src/lib/progressSnapshot.ts)
**Single source of truth** for what gets persisted to Firebase. `buildProgressSnapshot()` is called by the sync manager before every save. If you add a new field to sync, add it here AND in `applyRemoteProgress` (useSyncManager.js).

### mergeStatsFromRemote (src/lib/mergeStatsFromRemote.ts)
Remote data is always merged **additively** — `Math.max()` for numbers, union for arrays. Remote data never reduces local progress. This is the safety guarantee against data loss.

---

## Critical Architecture: Learn Path

### LEARN_PATH (src/data/content.jsx)
Array of lesson descriptors. Each entry has a `ck(stats)` function that returns `true` when the lesson is "completed." Pattern for screens that award credit via dwell timer:
```javascript
ck: function(s) { return (s.vs && s.vs.includes('screenKey')) || s.lc >= N; }
```
Always use `vs.includes(screenKey)` as the primary check. The `lc >= N` fallback is for users who completed the lesson before the `vs` system existed.

### BLACK_HOLE_SCREENS (src/hooks/useScreenLauncher.js)
Object mapping screen key → stat type (`'lc'` or `'gc'`). When a user spends 20 seconds on a screen in this map, it automatically:
1. Adds the screen key to `stats.vs`
2. Increments `stats.lc` or `stats.gc`
3. Awards 15 XP

Every screen that appears in LEARN_PATH and doesn't have a quiz must be in `BLACK_HOLE_SCREENS`.

### CEFR Level (src/components/profile/StatsTab.jsx)
```javascript
getCEFR(xp, lc, gc) → { level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2', ... }
// score = xp + (lc * 15) + (gc * 25)
```
This is the **single source of truth** for both the CEFR badge and the Learn Path stage indicator. Both use `CEFR_TO_STAGE_IDX` mapping. Never derive stage from `lc` thresholds alone.

---

## Critical Architecture: Firebase Sync

### Firestore document paths
- User progress: `users/{uid_sanitized}` (uid with `.#$/[]` replaced by `_`)
- Leaderboard: `leaderboard/{uid_sanitized}`
- Family: `families/{6-char-code}`
- Family XP: `families/{code}.memberXP.{uid_sanitized}`

### fbSaveProgress (src/lib/firebase.js)
Saves to both `users/{id}` and `leaderboard/{id}` atomically. Always called via `buildProgressSnapshot()`. Writes `weekXP` from localStorage `nh_week_xp_{weekKey}`.

### fbJoinFamily (src/lib/firebase.js)
Accepts `(code, uid, email, name, weekXP)`. The 5th param `weekXP` must be passed by callers so the join-time leaderboard entry has correct weekly XP.

### Firestore security rules
CEFR level is stored as a **string** (e.g., `"B1"`) in Firestore rules. Never write it as an integer.

### Multi-tab safety
Firestore is initialized with `persistentMultipleTabManager()` to allow multiple browser tabs without the "exclusive access" assertion error (b815).

---

## Cloudflare Pages Functions

### Environment variables (set in Cloudflare dashboard)
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | AI Tutor, story generation |
| `AZURE_TTS_KEY` / `AZURE_TTS_REGION` | Croatian TTS pronunciation |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Server-side Firebase Admin SDK |
| `CRON_SECRET` | Auth token for scheduled worker → API calls |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push notifications |
| `RESEND_API_KEY` | Contact form emails |
| `DEEPGRAM_API_KEY` | Speech-to-text (speaking practice) |
| `ADMIN_EMAIL` | Admin-only API access |

### KV namespace bindings (Cloudflare Pages → Settings → Functions)
| Variable | Namespace ID | Purpose |
|---|---|---|
| `PUSH_SUBSCRIPTIONS` | `4652e2388967424db09395a2be0aad81` | Push notification subscriber storage |

### Scheduled worker (wrangler.toml)
Separate Cloudflare Worker (`nasa-hrvatska-scheduler`) runs daily at 9am UTC for streak reminder push notifications. Deployed independently via `wrangler deploy`.

---

## Code Conventions

- **File naming**: `PascalCase.jsx` for React components, `camelCase.js/ts` for utilities
- **No default exports from lib files** — use named exports
- **localStorage access**: use key constants from `src/lib/constants/storage.js` for new keys; legacy code uses raw strings
- **Date helpers**: always use `localDateStr()` and `weekKey()` from `src/lib/dateUtils.js` — never `new Date().toISOString()` for date comparisons
- **XP awards**: always through `dispatch({ type: 'AWARD_XP', ... })` or the `useAward` hook — never by mutating stats directly
- **Firebase calls**: all in `src/lib/firebase.js` — no Firestore imports in components
- **Error handling**: use `errorReporter.ts` for non-fatal errors; `ErrorBoundary` component catches render crashes
- **TypeScript**: new files in `src/lib/` and `src/hooks/` should be `.ts`/`.tsx`. Existing `.js` files are being migrated gradually — don't convert them unless that's the task.
- **Code style**: ESLint + lint-staged enforced on commit. Run `npm run lint:fix` before committing.

---

## Testing

- **Unit tests**: `src/tests/` using Vitest + Testing Library. Run with `npm test`.
- **E2E tests**: `e2e/` using Playwright. Run with `npm run test:e2e` (requires build).
- **Key test files**:
  - `stats-hydration.test.js` — merge/sanitize logic
  - `gameLogic.test.js` — McGame, hearts, XP
  - `content-validation.test.js` — LEARN_PATH integrity checks
  - `leaderboard.test.js` — family XP logic
- Firebase is **never mocked in integration tests** — real Firestore rules are tested via `verify:firestore`.

---

## MANDATORY: E2E Spec Audit Before Every Commit

**This rule exists because hours were wasted on CI failures caused by UI changes that were not reflected in E2E specs.**

Before committing ANY change that touches a component, tab, screen, or navigation element, you MUST:

1. **Identify every spec file in `e2e/` that references the modified area** — search by component name, tab name, button label, or screen text.
2. **Read each identified spec file in full.**
3. **Verify every `getByText`, `getByRole`, `getByPlaceholder`, and `expect` assertion still matches the current UI.**
4. **Update any stale assertions in the same commit as the UI change** — never in a separate follow-up commit.

### Spec-to-component mapping (always check these pairs):

| If you change... | Check these spec files |
|---|---|
| HomeTab / HeroSection / QuestTracker | `home.spec.js`, `daily-challenge-sync.spec.js`, `profile-persist.spec.js` |
| LearnTab / LearnPathWidget / vocab pills | `learn.spec.js`, `lesson-complete.spec.js`, `navigation.spec.js` |
| PracticeTab / intent tiles / game panels | `practice.spec.js`, `offline.spec.js` |
| CultureTab / CroatiaTab | `croatia.spec.js`, `navigation.spec.js` |
| StatsTab / Leaderboard / ProfileTab | `family.spec.js`, `profile-persist.spec.js` |
| TabBar / navigation labels | `navigation.spec.js`, `daily-challenge-sync.spec.js`, `croatia.spec.js`, `offline.spec.js` |
| LoginScreen / auth flow | `auth.spec.js`, `accessibility.spec.js` |
| Any screen accessible from Practice tab | `practice.spec.js`, `offline.spec.js` |

### Nav tab names (never get these wrong):
`Home` | `Learn` | `Practice` | `Croatia` | `Profile`

### The rule in plain English:
**You changed the UI. You own the tests. They ship together or not at all.**

---

## Git Workflow — Non-Negotiable

1. **Push immediately after every commit.** `git push origin master` is part of the commit action, not optional. Cloudflare Pages only deploys on push — a commit without a push is invisible to the user and does nothing.
2. **Never amend published commits.** Create a new commit instead.
3. **Never force-push to master.** Cloudflare deployment history can be corrupted.
4. **Never skip hooks** (`--no-verify`). Fix the underlying issue instead.

---

## CI/CD Pipeline Structure

```
quality (lint + typecheck)
    ↓
test (Vitest unit)   ←→   e2e (Playwright, 15-min timeout, 2 workers, 1 retry)
    ↓                         ↓
build-deploy (waits for quality + test, NOT e2e)
```

- Build-deploy does NOT wait for E2E. A green deploy does not mean E2E passed.
- E2E timeout is 15 minutes total. Each test has a 30s timeout + 1 retry = 60s max per test. 15 stale/hanging tests fills the budget exactly.
- **Tests are a production gate. Never relax CI timeouts, skip tests, or weaken assertions to make CI green.**

---

## This Is a Production App With Real Users

- Real users have real progress stored in localStorage and Firestore. Changes affect them immediately on deploy.
- Be conservative. Read the relevant components before modifying anything.
- Do not add features, refactor, or "improve" things beyond what was asked.
- **Never add fake/hardcoded data** — no fake learner counts ("14,800+ learners"), no fake leaderboard entries (fake names with fabricated XP), no hardcoded "active users today" numbers. All displayed data must be real.
- **Never add referral cards, links, or buttons to competing apps** — Duolingo, Babbel, iTalki, Preply, Lingopie, or any similar service. Implement features natively instead.

---

## Verification Standard

Before committing any change:
- Read the actual source files affected — never assume structure from memory.
- Verify the change is correct end-to-end. If it touches CI, check the pipeline.
- If uncertain about correctness, ask before committing — not after breaking CI.
- Do not use an apology as a substitute for the verification that should have happened upfront.

---

## NEVER DO (hard rules from production incidents)

1. **Never recommend clearing localStorage or unregistering the service worker** as a fix. This destroys user progress. The only safe SW fix is DevTools → Application → Service Workers → Unregister (manual user action).
2. **Never commit secrets** to the repo. All keys live in Cloudflare dashboard env vars.
3. **Never write CEFR level as an integer** to Firestore — always a string (`"B1"`, not `1`). Firestore security rules enforce string type.
4. **Never reduce a stat** during a remote merge. Merges are always additive (`Math.max`, union).
5. **Never bypass the `_syncReady` gate** in useSyncManager — it prevents saves before auth + remote load completes, which would overwrite remote progress with stale local data.
6. **Never add a screen to LEARN_PATH without also adding it to BLACK_HOLE_SCREENS** (if it's an informational screen without a built-in quiz).
7. **Never call `fbSaveProgress` directly from a component** — always use the sync manager's `doSyncNow()` or the auto-save effect.
8. **Never force-push to master** — Cloudflare deploys are triggered by push; force-pushing can corrupt the deployment history.
9. **Never recommend clearing localStorage, clearing site data, or any DevTools action that touches localStorage.** This destroys user progress. The ONLY safe SW troubleshooting step is: DevTools → Application → Service Workers → Unregister → Reload.
10. **Never write data to Firestore on behalf of a user without their explicit instruction and a verified data source.** Fabricating or estimating user data and writing it to production is unauthorized.
11. **Never regress these sync architecture guarantees** (established 2026-03-18, see project_nasa_hrvatska_sync_audit.md in memory):
    - The `!syncReady` hero gate — never add `lc===0 || xp===0` conditions back
    - The persistence fallback chain in `initFirebase()` — never revert to `.catch(()=>{})` on `browserLocalPersistence`
    - The immediate `fetchIfNewer()` call on polling mount — never remove it
    - The `_unloadRef.current` fields (favs, jWords) — never strip from unload ref
12. **The sw-migration.js cache prefix must remain a prefix match** (`nasa-hrvatska-v.`), never a hardcoded version number. Hardcoding caused ALL caches to wipe on every deploy.
13. **Firestore sync runs every 2 minutes** for signed-in users (not just on tab close). Never revert this to beforeunload-only.

---

## Deployment Checklist

```bash
# 1. Run tests before pushing
npm test && npm run typecheck && npm run lint

# 2. Commit with a descriptive message
git add <specific files>
git commit -m "Description of change"

# 3. Push — this triggers Cloudflare Pages auto-deploy
git push origin master

# 4. Verify deploy in ~2 minutes at https://nasahrvatska.com
```

---

## Key Third-Party Integrations

| Service | Purpose | Auth method |
|---|---|---|
| Firebase Auth | User accounts | Email/password + Google OAuth |
| Firestore | User progress sync | Security rules (UID-based) |
| Cloudflare Pages | Hosting + serverless functions | Git integration |
| Cloudflare KV | Push subscription storage | KV namespace binding |
| Anthropic API | AI Tutor, stories, explanations | API key (server-side only) |
| Azure Cognitive Services | Croatian TTS | Key + region (server-side only) |
| Sentry | Error tracking | `VITE_SENTRY_DSN` |
| PostHog | Product analytics | `VITE_POSTHOG_KEY` |
| Resend | Transactional email | `RESEND_API_KEY` |
| Deepgram | Speech-to-text | `DEEPGRAM_API_KEY` |

---

## Anthropic Skills Reference

Skills are specialized instruction sets that define how to handle specific task types. When a task matches a skill's domain, apply its rules exactly — they override generic defaults.

---

### skill-creator
**Trigger:** User asks you to create or design a new skill / SKILL.md file.

**Rules:**
- Every skill has YAML frontmatter (`name`, `description`) followed by a markdown body
- Body must define: trigger conditions, workflow steps, output format, critical constraints
- Test the skill by mentally executing it against 3 realistic user prompts before finalizing
- Skills are platform-aware — note if behavior differs between Claude.ai, API, and Claude Code

---

### frontend-design
**Trigger:** Building any UI, component, or visual feature — including in this app.

**Rules:**
- Commit to a bold, specific aesthetic direction — no generic "clean modern" cop-outs
- Choose unique, distinctive fonts; avoid Inter, Roboto, and purple gradient defaults
- Use a dominant hue + sharp accent; cohesive palette over variety
- Staggered reveal animations on load; prefer asymmetric/grid-breaking layouts over centered stacks
- **Explicitly avoid:** generic AI aesthetics, purple gradients, Inter font overuse, cookie-cutter card grids
- Production-grade code only — no placeholder lorem ipsum, no TODO stubs shipped

**Applied to this project:** The app uses its own design system (CSS classes like `exercise-card`, `vocab-pill`, `fc-card`, `ob`, `b bp`). Match existing conventions; don't introduce Tailwind or shadcn unless explicitly asked.

---

### webapp-testing
**Trigger:** Writing or debugging Playwright E2E tests, or any automated browser testing task.

**Rules:**
- Decision tree: static HTML → inspect directly; dynamic app → start dev server first
- Always use `page.waitForLoadState('networkidle')` or explicit role/text waits before assertions — never fixed `waitForTimeout` except as last resort
- Selector priority: `getByRole` (accessibility) → `getByText` → CSS class → ID
- `getByRole('button', { name: 'X', exact: true })` requires the accessible name to be EXACTLY "X" — if the button has emoji or extra text in its label, use `exact: false` (default) or regex
- Close/restore browser context between tests; never share state across test boundaries
- Screenshot on failure for debugging; use `--headed` mode when selector hunting

**Applied to this project:** See the MANDATORY E2E Spec Audit section above. This project's E2E suite is at `e2e/` using Playwright with `@playwright/test`. Fixtures are in `e2e/fixtures/seed-auth.js`.

---

### claude-api
**Trigger:** Building or modifying any feature that calls the Anthropic API (AI Tutor, story generation, explanations in `functions/api/`).

**Rules:**
- **Default model:** `claude-opus-4-6` (most capable; use this unless cost is a hard constraint)
- **Thinking:** Use `{type: "adaptive"}` for complex reasoning tasks
- **Streaming:** Default for any response >500 tokens or latency-sensitive UX
- **Never** set `budget_tokens` on Opus 4.6 or Sonnet 4.6 — it's not supported
- Detect language from project files (this project uses JavaScript/TypeScript)
- Surface decision: single call → workflow → agent (escalate only when simpler won't work)

**Applied to this project:** API calls live in `functions/api/ai-chat.js` (AI Tutor) and related endpoints. API key is `ANTHROPIC_API_KEY` in Cloudflare env vars — never in source code.

---

### xlsx
**Trigger:** Creating, editing, or analyzing any `.xlsx`, `.xlsm`, `.csv`, or `.tsv` file (investment models, financial data).

**Rules:**
- Zero formula errors permitted: no `#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`, `#NAME?`
- Color coding standard: **blue** = inputs, **black** = formulas, **green** = internal links, **red** = external links, **yellow** = key assumptions
- Never hardcode a value that should be a formula — always cell-reference formulas
- Tool choice: pandas for analysis/data manipulation; openpyxl for formulas + formatting
- **Mandatory final step:** Run `python scripts/recalc.py output.xlsx` to calculate all formulas before delivering
- Deliverable is always a spreadsheet file — never HTML, Word, or a script

---

### pdf
**Trigger:** Reading, extracting from, or creating PDF files.

**Rules:**
- **Read/extract:** Use `pdfplumber` (text + table extraction with layout awareness), `pypdf` (merge/split/rotate/encrypt)
- **OCR:** `pytesseract` + `pdf2image` for scanned documents
- **Create:** `reportlab` for programmatic PDF generation
- **Critical:** Never use Unicode subscript chars (₀₁₂₃) in reportlab — use `<sub>`/`<super>` XML tags inside Paragraph objects
- CLI tools available: `pdftotext`, `qpdf`, `pdftk`

---

### pptx
**Trigger:** Creating, reading, editing, or combining `.pptx` PowerPoint files.

**Rules:**
- **Read:** `python -m markitdown` or unpack to XML
- **Create:** PptxGenJS (JavaScript) or python-pptx
- **Edit:** unpack → manipulate XML → repack
- Design standards: 60–70% dominant color, dark title / light content contrast, one visual motif, varied layouts, 0.5" margins, 36–44pt titles / 14–16pt body
- QA checklist: check overlaps, text overflow, alignment, contrast, placeholder remnants before delivering
- No accent lines under titles; no wall-of-text slides

---

### docx
**Trigger:** Creating, editing, or reading `.docx` Word documents.

**Rules:**
- **Read:** pandoc or XML unpacking
- **Create/edit:** docx-js (JavaScript) or python-docx
- Always set page size explicitly: US Letter = 12240×15840 DXA; A4 = 11906×16838 DXA
- Use `WidthType.DXA` for table widths — never PERCENTAGE
- Never use unicode bullet characters — use `LevelFormat.BULLET`
- Smart quotes via XML entities (`&#x201C;` `&#x201D;` `&#x2018;` `&#x2019;`)
- `PageBreak` must nest inside a `Paragraph` object — never standalone

---

### mcp-builder
**Trigger:** Building a Model Context Protocol (MCP) server.

**Four-phase workflow:**
1. **Research & Planning** — study MCP spec at `modelcontextprotocol.io`, choose TypeScript (recommended) or Python, plan tool coverage
2. **Implementation** — project structure, API client/auth/error utilities, tool schemas with Zod (TS) or Pydantic (Python), include `outputSchema`/`structuredContent`, add annotations (`readOnlyHint`, `destructiveHint`)
3. **Review & Test** — DRY/type coverage, test with MCP Inspector (`npx @modelcontextprotocol/inspector`)
4. **Evaluations** — write 10 complex realistic questions to verify tool coverage

**Stack:** TypeScript + Streamable HTTP (stateless JSON) for remote servers; stdio for local tools.

---

### web-artifacts-builder
**Trigger:** Building complex self-contained HTML artifacts for Claude.ai.

**Stack:** React + TypeScript (Vite), Tailwind CSS 3.4.1, shadcn/ui (40+ components), Parcel bundling.

**Workflow:**
1. `scripts/init-artifact.sh <project-name>` — scaffold
2. Edit source files
3. `scripts/bundle-artifact.sh` — creates self-contained `bundle.html`
4. Present bundle to user

**Design rules:** Avoid centered layouts, purple gradients, uniform rounded corners, Inter font. Apply `frontend-design` skill rules.

---

### canvas-design
**Trigger:** Creating visual artwork, design compositions, or museum-quality visual outputs.

**Two-stage process:**
1. Write a design philosophy document (4–6 paragraphs: form, space, color, composition)
2. Express the philosophy as a visual output (`.pdf` or `.png`) — 90% visual, 10% text

Output is museum-quality. Minimal text, no overlapping elements, iterative polish. Both deliverables are separate downloadable files.

---

### algorithmic-art
**Trigger:** Generating computational/generative art using p5.js.

**Two-phase workflow:**
1. Develop a computational aesthetic philosophy (4–6 paragraphs)
2. Express it as a p5.js generative art HTML artifact

**Fixed elements:** Anthropic branding (Poppins/Lora fonts), sidebar with Seed/Parameters/Colors/Actions, seed navigation. Canvas is 1200×1200px. Fully self-contained HTML. Seed-based reproducibility (Art Blocks pattern). "Beauty lives in the process."

---

### theme-factory
**Trigger:** User wants to apply a visual theme to an artifact or interface, or explore color/font combinations.

**10 preset themes:** Ocean Depths, Forest Dawn, Midnight Galaxy, Desert Sunset, Arctic Frost, Urban Concrete, Tropical Bloom, Vintage Paper, Neon Cyberpunk, Mountain Mist.

**Workflow:** View showcase → select theme → confirm → apply consistently (hex palette + font pairings from themes directory). Custom themes also supported.

---

### brand-guidelines
**Trigger:** Any work using Anthropic brand assets, colors, or typography.

**Anthropic official palette:**
- Dark: `#141413`
- Light: `#faf9f5`
- Orange: `#d97757`
- Blue: `#6a9bcc`
- Green: `#788c5d`

**Typography:** Headings → Poppins (Arial fallback); Body → Lora (Georgia fallback). Accent colors for non-text shapes only.

---

### doc-coauthoring
**Trigger:** Collaboratively writing, refining, or structuring documents with the user.

**Three-stage workflow:**
1. **Context Gathering** — understand audience, purpose, tone, length constraints
2. **Refinement & Structure** — outline → draft → iterate with user feedback
3. **Reader Testing** — review from target reader's perspective before finalizing

Manage artifacts iteratively; never overwrite a draft without preserving the previous version in the conversation.

---

### internal-comms
**Trigger:** Writing internal company communications (status updates, newsletters, incident reports, FAQs).

**Format types:**
- **3P updates:** Progress / Plans / Problems (bullet structure)
- **Company newsletters:** Section headers, key highlights, action items
- **FAQ responses:** Q&A pairs, concise and scannable
- **Status/leadership updates:** Executive summary first, detail below
- **Incident reports:** Timeline, impact, root cause, resolution, prevention

**Workflow:** Identify communication type → load matching format guideline → follow structure. If type is ambiguous, ask for clarification.

---

### slack-gif-creator
**Trigger:** Creating animated GIFs for Slack (emoji reactions or message GIFs).

**Specs:**
- Emoji GIFs: 128×128px, <3s duration
- Message GIFs: 480×480px
- Frame rate: 10–30 FPS, 48–128 color palette

**Utilities:** GIFBuilder (assemble/optimize), Validators (`validate_gif`, `is_slack_ready`), Easing Functions (`ease_out`, `bounce_out`, `elastic_out`). Animation types: shake, pulse, bounce, rotation, fade, slide, zoom, particle burst. Uses PIL primitives only.

---

### design-an-interface
**Trigger:** User wants to design an API, explore interface options, compare module shapes, or mentions "design it twice." Apply whenever the question is about *the shape* of a module's interface — not implementation.

**Core principle (from "A Philosophy of Software Design"):** Your first idea is unlikely to be the best. Generate multiple radically different designs, then compare them.

**5-step workflow:**

**1. Gather requirements first**
- What problem does this module solve?
- Who are the callers? (other modules, external users, tests)
- What are the key operations?
- What should be hidden inside vs exposed?

**2. Generate 3+ parallel designs** — each with a different constraint:
- Agent 1: "Minimize method count — aim for 1–3 methods max"
- Agent 2: "Maximize flexibility — support many use cases"
- Agent 3: "Optimize for the most common case"
- Agent 4: "Take inspiration from [specific paradigm/library]"

Each design must produce: interface signature, usage example, what it hides internally, and trade-offs.

**3. Present designs** sequentially — let the user absorb each before showing the next.

**4. Compare on:**
- **Interface simplicity** — fewer methods, simpler params
- **General-purpose vs specialized** — flexibility vs focus
- **Implementation efficiency** — does the shape allow efficient internals?
- **Depth** — small interface hiding significant complexity = deep module (good); large interface over thin implementation = shallow module (avoid)
- **Ease of correct use** vs ease of misuse

Compare in prose, not tables. Highlight where designs diverge most.

**5. Synthesize** — the best design often combines insights from multiple options. Ask which design best fits the primary use case and whether any elements from other designs are worth incorporating.

**Anti-patterns:**
- Never let designs be too similar — enforce radical difference
- Never skip the comparison step — contrast is the whole value
- Never implement — this skill is about interface shape only
- Never evaluate based on implementation effort

---

### debugging-wizard
**Trigger:** Investigating errors, analyzing stack traces, finding root causes of unexpected behavior, troubleshooting crashes, log analysis, or any "not working / bug / exception / crash" request.

**Core workflow (always in this order):**
1. **Reproduce** — establish consistent reproduction steps before touching code
2. **Isolate** — narrow to smallest failing case
3. **Hypothesize & test** — one theory at a time; verify or disprove before moving on
4. **Fix** — implement and verify solution
5. **Prevent** — add regression test / safeguard

**MUST DO:**
- Gather complete error messages and stack traces before forming hypotheses
- Test one hypothesis at a time — never make multiple changes simultaneously
- Remove all debug code (`console.log`, `debugger`, `pdb.set_trace()`) before committing

**MUST NOT DO:**
- Guess without testing
- Assume cause without evidence
- Debug in production without safeguards
- Leave debug statements in committed code

**Key debugging commands:**
```bash
# Python
python -m pdb script.py          # b 42 | n | s | p var | bt

# JavaScript (Node)
node --inspect-brk script.js     # attach Chrome DevTools at chrome://inspect

# Git bisect (regression hunting)
git bisect start
git bisect bad                   # current commit broken
git bisect good v1.2.0           # last known good
# test midpoint → git bisect good/bad → repeat → git bisect reset

# Go
dlv debug ./cmd/server           # break main.go:55 | continue | print var
```

**Output format for every bug investigation:**
1. **Root Cause** — what specifically caused the issue
2. **Evidence** — stack trace, log line, or failing test that proves it
3. **Fix** — exact code change
4. **Prevention** — regression test or safeguard to add

---

### performance-optimization
**Trigger:** User asks you to review, audit, or optimize code for performance.

**Analyze all of these areas:**

**Database & Data Access**
- N+1 query problems and missing eager loading
- Missing database indexes on frequently queried columns
- Inefficient joins or subqueries
- Missing pagination on large result sets
- Absent query result caching
- Connection pooling issues

**Algorithm Efficiency**
- O(n²) or worse time complexity when better exists
- Nested loops that could be optimized
- Redundant calculations or repeated work
- Inefficient data structure choices
- Missing memoization or dynamic programming

**Memory Management**
- Memory leaks or retained references
- Loading entire datasets when streaming is possible
- Excessive object instantiation in loops
- Large data structures kept in memory unnecessarily

**Async & Concurrency**
- Blocking I/O that should be async
- Sequential operations that could run in parallel
- Missing `Promise.all()` or concurrent execution patterns
- Synchronous file operations

**Network & I/O**
- Excessive API calls (missing request batching)
- No response caching strategy
- Large payloads without compression
- Missing CDN usage for static assets

**Frontend Performance**
- Render-blocking JavaScript or CSS
- Missing code splitting or lazy loading
- Unoptimized images or assets
- Excessive DOM manipulations or reflows
- Missing virtualization for long lists
- No debouncing/throttling on expensive operations

**Caching**
- Missing HTTP caching headers
- No application-level caching layer
- Absent memoization for pure functions
- Static assets without cache busting

**Output format for each issue:**
1. **Issue** — describe the performance problem
2. **Location** — file/function/line numbers
3. **Impact** — severity (Critical/High/Medium/Low) + expected degradation
4. **Current Complexity** — time/space complexity where applicable
5. **Recommendation** — specific optimization strategy
6. **Code Example** — optimized version
7. **Expected Improvement** — quantify gains if measurable

If code is well-optimized: confirm status, list properly implemented best practices, note minor improvements possible.
