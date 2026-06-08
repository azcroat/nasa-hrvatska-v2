# Comprehension Checkpoints — Design Spec

**Date:** 2026-06-07
**Author:** Lead engineering (Claude, paired with jschr)
**Status:** Draft for review
**Feature flag:** `CHECKPOINTS_ENABLED` (default `false` until item banks + speaking endpoint validated in prod)

---

## 1. Goal

Recurring, popup **comprehension + production exams** that re-verify a user *actually holds* the CEFR level the app says they've achieved — and gently demote them if they don't. The purpose is to drive genuine mastery toward fluency, the app's ultimate goal, rather than letting activity (XP grinding) stand in for competency.

Three user-stated requirements, verbatim intent:

1. **Staged per level** — each CEFR level (A1→C1) has its own checkpoint exam.
2. **Popup every 5 days** — re-test true comprehension at the *current certified* level on a cadence.
3. **Fail → go back one level**, then focus practice on the demonstrated gaps; and as users progress they must **not forget earlier levels** (retention).
4. **Speaking is mandatory** — not listening comprehension, but **productive speaking ability** (can they *speak* Croatian at the level). Required to pass every level.

---

## 2. What exists today (grounded in code)

The app already has a strong foundation in `src/lib/cefrCertification.ts` and `src/lib/cefr.ts`:

- **Two notions of level**, already separated and shipped (hard-gating live since 2026-05-20, `CERTIFICATION_REQUIRED = true`):
  - **Eligible** — activity-derived, `getUserCefr(xp, lc, gc)` in `cefr.ts`.
  - **Certified** — `getCertifiedLevel()`, the highest level whose equivalency test the user has *passed*. This is the source of truth for content unlock via `getEffectiveLevelForUnlock(eligible)`.
- **Certification store** (`localStorage['nh_cefr_certifications']`, schema `v:1`): `{ passes, attempts, lastFailedAt, v }`. Synced cross-device via `snapshotCertifications()` / `mergeRemoteCertifications()`.
- **Scoring engine**: `computePassed(scores)` — pass = ≥80% overall **and** ≥80% on every present skill. `PASS_THRESHOLD = 0.8`.
- **Skill model** (`SkillScores`): `vocab` (req), `grammar` (req), `reading?`, `listening?`. **No `speaking`.**
- **Item banks**: `src/data/cefrEquivalencyItems.ts` (~50 items/level: ~20 vocab / 20 grammar / 10 reading), plus per-transition JSON (`a2_to_b1.json`, etc.). `EquivalencySkill = 'vocab' | 'grammar' | 'reading'`.
- **Retake gating**: `canTakeEquivalencyTest()` — 7-day cooldown OR 5 lessons.
- **Existing exam UI**: `EquivalencyTestScreen.tsx`, `EquivalencyTestCard.tsx` (manual, advancement-only, triggered when eligible > certified).
- **Speaking-adjacent infra** (practice only, not gating): `PronunciationAssessScreen.tsx`, `SpeakingSprintScreen.tsx`; AI endpoints under `functions/api/*` (Claude), `audio.ts._ttsPost` shows the **Firebase Bearer auth pattern** all `/api` calls use.
- **Adaptive layer**: `src/lib/adaptive.ts` (FSRS spaced-repetition, `getWeakTopics`, `recordTopicResult`); `src/lib/learnerErrors.ts`.
- **Popup gating precedent**: `src/lib/onboardingGates.ts` (`shouldShowGoalModal`), gated on `syncReady` so returning users on fresh devices aren't re-prompted (lesson from PRs #12/#13).

### Gaps vs. the vision

| Requirement | Today | Net-new |
|---|---|---|
| Recurring 5-day popup | ❌ everything manual/onboarding-only | Scheduler + invite modal |
| Demotion on fail | ❌ certified only goes up | Demotion-with-grace engine |
| Retention of earlier levels | ⚠️ FSRS for drills only | Retention items in exam |
| Speaking (productive) required | ❌ not even a skill type | Speaking subsystem + mandatory gate |

**Key reuse insight:** the existing **equivalency test = "advance to next level"**. The new **checkpoint = "re-verify the current level."** They share item banks, exam UI, scoring, and speaking — so we generalize the exam runner rather than fork it.

---

## 3. Scope & non-goals

**In scope (v1):**
- Checkpoint scheduler on **active days** (not calendar days).
- Generalized exam runner shared by equivalency + checkpoint.
- `speaking` as a first-class, **required** skill; productive task scored by Whisper(STT)→Claude(rubric) behind a swappable interface.
- Retention items from earlier levels in each checkpoint.
- Demotion engine: one level down **with a grace attempt**.
- Top-tier popup UX (mockups approved: invite → MCQ → speaking → result/pass/demote).
- Cross-device-safe state, gated on `syncReady`.

**Non-goals (explicit v2):**
- **Azure Pronunciation Assessment** (phoneme-level pronunciation sub-score). v1 derives a coarse intelligibility proxy from STT confidence; the `SpeakingScorer` interface makes Azure a drop-in later.
- Writing skill assessment.
- Renewing/refreshing an already-passed *equivalency* (advancement) test.

---

## 4. Locked design decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Cadence** | Every **5 active days** since last checkpoint | Humane; never ambushes a user returning from a break. Calendar timers fire mid-vacation and feel punitive. |
| **Demotion** | **One level down, with a grace attempt** | Fail #1 → warning + immediate targeted retry on weak skills (no cooldown). Fail #2 *consecutive* → demote one level. Protects against a single bad day / mic glitch while still enforcing mastery. |
| **Speaking pipeline** | **Cloud STT (Cloudflare Workers AI Whisper) → Claude rubric**, behind `SpeakingScorer` interface | Reliable on iPad/Safari (where Web Speech API is flaky and not actually private); no new vendor (Whisper runs on the CF stack the app already deploys to); trivial cost; reuses Claude `/api`. Interface keeps it swappable. |
| **Speaking bar** | `<80%` blocks (→ grace/demote); **80–87% = pass + speaking-focus flag** carried to next level; `≥88%` clean | Borderline *band*, not an exact number — speaking scores are continuous/noisy. Matches the "advance but focus on speaking" intent. |
| **Pronunciation v1** | Intelligibility **proxy** from STT confidence | Azure phoneme scoring deferred to v2 behind the same interface. |

---

## 5. Architecture

Designed as small, independently testable units with explicit interfaces. Pure logic is isolated from React and from I/O so it can be unit-tested without a DOM or network.

### 5.1 Module map

```
src/lib/
  activeDayTracker.ts        (pure)  record/count distinct active days
  checkpointSchedule.ts      (pure)  isCheckpointDue(state, now) → bool + reason
  checkpointPolicy.ts        (pure)  interpret an attempt → outcome (clean/focus/grace/demote)
  examBlueprint.ts           (pure)  describe an exam (sections, retention, speaking)
  examComposer.ts            (pure)  blueprint + item banks → concrete Exam (with retention picks)
  cefrCertification.ts       (EXTEND) add `speaking`; demoteOneLevel(); checkpoint fields + sync
  speaking/
    SpeakingScorer.ts        (interface + types)
    whisperClaudeScorer.ts   (impl: calls /api/assess-speaking)

src/data/
  speakingTasks.ts           per-level productive speaking prompts (A1→C1)

src/components/exam/
  ExamRunner.tsx             generic runner: MCQ sections + speaking section → SkillScores
  SpeakingTaskScreen.tsx     prompt → record → assess → sub-scores (mockup state A/B/C)
  CheckpointInviteModal.tsx  the 5-active-day popup invite (approved screen 1)
  CheckpointResultScreen.tsx pass / pass-with-focus / grace / demote (approved screens 3 & 4)

functions/api/
  assess-speaking.ts         CF Pages Function: Firebase-auth'd; audio → Whisper → Claude rubric
```

### 5.2 Data model changes (`cefrCertification.ts`)

Add `speaking` to `SkillScores` as **optional in the type** (legacy equivalency tests have none) but **required by checkpoint scoring** (see §5.5):

```ts
export interface SkillScores {
  vocab: SkillScore;
  grammar: SkillScore;
  reading?: SkillScore;
  listening?: SkillScore;
  speaking?: SkillScore;   // NEW
}
```

Extend `CertificationState` (bump schema to `v:2`, with a `v:1→v:2` migration that defaults the new block):

```ts
export interface CheckpointState {
  lastCheckpointAt: number | null;       // epoch ms
  activeDaysAtLastCheckpoint: number;     // snapshot of cumulative active-day count
  consecutiveFails: Partial<Record<CefrLevel, number>>;  // grace counter, per level
  focusSkills: Partial<Record<CefrLevel, SkillKey[]>>;   // carry-forward focus flags
  // SkillKey = 'vocab' | 'grammar' | 'reading' | 'listening' | 'speaking'
  demotions: Array<{ from: CefrLevel; to: CefrLevel; at: number; reason: 'checkpoint_fail' }>;
  snoozedUntil: number | null;            // "remind me tonight"
}
export interface CertificationState {
  passes; attempts; lastFailedAt;
  checkpoints: CheckpointState;           // NEW
  v: 2;                                    // bumped
}
```

`snapshotCertifications` / `mergeRemoteCertifications` extend to cover `checkpoints`:
- `lastCheckpointAt`, `activeDaysAtLastCheckpoint`: take **MAX** (most-recent checkpoint wins).
- `consecutiveFails`: take **MAX** per level (don't let a stale device erase a pending grace state).
- `demotions`: union by `at`.
- `snoozedUntil`: take **MAX**.

**Demotion primitive:**
```ts
export function demoteOneLevel(reason): { from: CefrLevel; to: CefrLevel } | null
```
Removes the top entry from `passes` so `getCertifiedLevel()` drops one rank (e.g., remove `passes['B1']` → certified becomes `A2`); records the demotion; sets `consecutiveFails[level]=0`. Content above the new level re-locks automatically via existing `getEffectiveLevelForUnlock`. The one-time grandfather migration flag stays set, so demotion is **not** undone on next launch.

### 5.3 Active-day tracking (`activeDayTracker.ts`)

Pure module; persistence injected for testability. Stores a cumulative count of **distinct local calendar days the app was opened/used** in `localStorage['nh_active_days']` (`{ lastDay: 'YYYY-MM-DD', count: number }`). `recordActiveDay(today)` increments `count` only when `today !== lastDay`. Reuses the same daily signal the streak system already keys on (`lastSeen`), so it never double-counts.

`activeDaysSinceLastCheckpoint = count - checkpoints.activeDaysAtLastCheckpoint`.

### 5.4 Scheduling (`checkpointSchedule.ts`)

```ts
isCheckpointDue({ certState, activeDayCount, now }): { due: boolean; reason }
```
Due when **all** hold:
1. `CHECKPOINTS_ENABLED` flag on.
2. Certified level ≥ A1. **A1 checkpoints run but are non-demoting** — A1 is the floor (see §5.6); A2+ checkpoints can demote.
3. `activeDayCount - activeDaysAtLastCheckpoint >= 5`.
4. Not snoozed (`now >= snoozedUntil`).
5. Not currently mid-exam (guarded at the App layer).

**Never blocks mid-lesson.** The invite is offered on **HomeTab entry / app foreground**, never during an active exercise — same discipline as the goal modal. "Remind me tonight" sets `snoozedUntil = end-of-local-day`; on next open after that, due again. The check itself runs **only after `syncReady`** (App layer), so a returning user on a fresh device isn't ambushed before their checkpoint history restores (PR #12/#13 lesson).

### 5.5 Exam composition (`examBlueprint.ts` + `examComposer.ts`)

A **blueprint** describes an exam; the **composer** turns it into concrete items.

Checkpoint blueprint for certified level *L*:
- **Core comprehension** at *L*: vocab + grammar + reading (drawn from existing `cefrEquivalencyItems` for *L*).
- **Retention**: 2 items from levels **below** *L*, weighted toward weak topics via `adaptive.getWeakTopics()`. **Counted within the core pass/fail overall** (see §5.6) — forgetting earlier material can pull a user below the bar and, after the grace attempt, demote them. Failed retention items also seed that earlier level's review into the adaptive queue.
- **Speaking**: **1 productive task** from `speakingTasks.ts` at *L* by default. A **second task is auto-added** when (a) the previous checkpoint flagged speaking, or (b) the first task scores ≤0.87 (borderline/just-fail) — adaptive measurement: extra reliability only where it changes the pass/fail decision. Final speaking score = mean of the tasks taken.

`composeExam(blueprint, banks, adaptiveState, rng)` is pure (seeded RNG passed in — no `Math.random()`, consistent with the workflow/runtime constraints and reproducible tests).

### 5.6 Result interpretation (`checkpointPolicy.ts`)

Pure function — the heart of the grace/demote/focus logic:

```ts
interpretCheckpoint({ level, scores, certState }): CheckpointOutcome
```
Rules (speaking **required** here; reading/listening optional as today):
- Compute per-skill bands: `<0.80` = fail; `0.80–0.87` = pass-with-focus; `≥0.88` = clean. Overall must also be `≥0.80`.
- **All required skills ≥0.80 and overall ≥0.80** → **PASS.**
  - Any skill in the focus band → attach `focusSkills[nextOrSameLevel]` (e.g. speaking) and reset `consecutiveFails[level]=0`. Refreshes `lastCheckpointAt` + `activeDaysAtLastCheckpoint`.
- **Any required skill <0.80 (or overall <0.80):**
  - If `consecutiveFails[level] == 0` → **GRACE**: increment to 1; offer an *immediate* targeted retry on the failed skills only (no cooldown). No demotion.
  - If `consecutiveFails[level] >= 1` → **DEMOTE**: `demoteOneLevel('checkpoint_fail')`; set focus flags = the failed skills; route to focused practice.

**Retention counts toward demotion (locked decision):** retention items are folded into the core pass/fail overall and the relevant earlier-skill score. Misses lower the overall; if that pushes overall (or a required skill) below `0.80`, the GRACE→DEMOTE path applies exactly as for current-level skills. The grace attempt still cushions a one-off slip. Failed retention items additionally inject that earlier level's topics into the adaptive review queue and set focus flags, so remediation targets the forgotten material. This is the deliberately demanding "retain everything toward fluency" choice.

**A1 floor:** at certified A1 there is nothing to demote to. An A1 checkpoint runs the same exam + speaking but is **non-demoting**: a failing result yields GRACE/retry and a "solidify your foundation" outcome that flags A1 focus skills and **holds A1→A2 advancement** until a later A1 checkpoint passes. `demoteOneLevel` applies only at A2 and above.

The outcome object tells the UI which `CheckpointResultScreen` variant to show and what focus list to display.

### 5.7 Speaking subsystem

**Interface** (`SpeakingScorer.ts`) — the swappable boundary:
```ts
export interface SpeakingAssessment {
  transcript: string;
  scores: { range: number; accuracy: number; fluency: number; task: number; pronunciation?: number }; // 0..1
  overall: number;       // 0..1, weighted
  confidence: number;    // 0..1 STT confidence → intelligibility proxy
}
export interface SpeakingScorer {
  assess(audio: Blob, ctx: { level: CefrLevel; prompt: string }): Promise<SpeakingAssessment | null>;
}
```
`null` = technical failure (mic denied, STT/Claude error, low confidence). **Fairness rule:** a `null` speaking result is *never* scored as a fail and never demotes — the UI offers a retry; if repeatedly impossible, the checkpoint is abandoned (not failed).

**v1 impl** (`whisperClaudeScorer.ts`): POSTs audio to `/api/assess-speaking` with the **Firebase Bearer** token (reuse the `audio.ts._ttsPost` pattern — never raw `fetch`). Maps response to `SpeakingAssessment`. Overall = weighted mean (accuracy + range + fluency + task; pronunciation excluded in v1).

**Backend** (`functions/api/assess-speaking.ts`, CF Pages Function):
1. `_verifyToken` (Firebase Bearer) — hard-reject anonymous (the codebase's flagged anon-AI-cost risk).
2. Enforce **max clip length** (≤90s) and **per-user rate limit** via KV TTL.
3. STT: **Cloudflare Workers AI Whisper** (`@cf/openai/whisper`) → transcript + confidence.
4. Rubric: Claude (`/api` model) with a strict per-level CEFR speaking rubric (range/accuracy/fluency/task), returns JSON scores.
5. Respond `{ transcript, scores, confidence }`. CORS + cache headers per `skill_cloudflare_pages_functions`.

### 5.8 UI flow (mockups approved)

```
HomeTab foreground (syncReady) ─ isCheckpointDue? ─► CheckpointInviteModal
   "Start the check" ─► ExamRunner
        ├─ MCQ sections (vocab/grammar/reading + 2 retention)   [approved screen 2]
        └─ SpeakingTaskScreen (record → assess → sub-scores)    [approved speaking A/B/C]
   ExamRunner done → interpretCheckpoint → CheckpointResultScreen:
        PASS clean      [approved screen 3]
        PASS + focus    (screen 3 + focus note)
        GRACE           ("almost — shore this up", retry CTA)
        DEMOTE          [approved screen 4: B1→A2, XP/streak untouched, focus list]
   "Remind me tonight" → snoozedUntil = end of day
```
All result screens fit without scroll (per design review). XP and streak are **never** touched by a checkpoint outcome (explicit on the demote screen) — demotion affects *certified level / content unlock* only.

---

## 6. Security, cost, privacy

- `/api/assess-speaking` is **auth-gated** (Firebase Bearer) and **rate-limited** + **clip-capped** — closes the anon-AI-cost vector already noted in the codebase.
- Audio leaves the device to the app's own CF backend only; transcript is not persisted beyond scoring. Disclose in privacy copy. (This is the accepted trade for iPad reliability; browser STT was rejected for unreliability, not privacy.)
- No secrets added client-side; Whisper/Claude run server-side on existing CF infra.

## 7. Telemetry

Sentry breadcrumbs + events: `checkpoint_due`, `checkpoint_invite_shown`, `checkpoint_started`, `checkpoint_snoozed`, `speaking_assess_ok|fail`, `checkpoint_outcome` (clean/focus/grace/demote). Aggregate pass/demote rates to tune the speaking bar post-launch.

## 8. Testing strategy

- **Unit (pure, no DOM):** `activeDayTracker` (distinct-day counting), `checkpointSchedule` (due logic incl. snooze/A1 guard), `checkpointPolicy` (every band × grace/demote permutation), `examComposer` (retention selection, seeded), `cefrCertification` v1→v2 migration + `demoteOneLevel` + extended sync merge.
- **Speaking:** `whisperClaudeScorer` with a mocked endpoint; assert `null`-on-failure never fails the exam (fairness invariant).
- **Component:** `ExamRunner` (MCQ + mocked SpeakingScorer → SkillScores), `CheckpointResultScreen` variants, `CheckpointInviteModal` snooze.
- **Integration (Firestore emulator):** checkpoint state round-trips and merges cross-device; a demotion on device A is reflected on device B.
- **E2E (Playwright, audio stubbed per `skill_playwright_e2e_patterns`):** due → invite → defer; due → full pass; due → fail → grace → fail → demote. `colorScheme:light`, `data-testid`s.
- **Backend:** `assess-speaking` rejects anonymous, enforces clip cap + rate limit.

## 9. Rollout

1. Land behind `CHECKPOINTS_ENABLED = false`. Ship schema `v:2` migration first (safe no-op for the feature).
2. Author `speakingTasks.ts` (2 prompts/level A1–C1) and the Claude rubric prompt; validate `/api/assess-speaking` in prod with a manual harness.
3. Validate speaking scores against a handful of known-level samples; calibrate the rubric.
4. Flip `CHECKPOINTS_ENABLED = true`. Monitor telemetry; tune the 80% speaking bar if demote rate is implausibly high (reliability check).

## 10. File-by-file change list

**New:** `activeDayTracker.ts`, `checkpointSchedule.ts`, `checkpointPolicy.ts`, `examBlueprint.ts`, `examComposer.ts`, `speaking/SpeakingScorer.ts`, `speaking/whisperClaudeScorer.ts`, `data/speakingTasks.ts`, `components/exam/{ExamRunner,SpeakingTaskScreen,CheckpointInviteModal,CheckpointResultScreen}.tsx`, `functions/api/assess-speaking.ts` + tests for each.

**Modified:** `cefrCertification.ts` (speaking skill, `v:2` + migration, `checkpoints` block, `demoteOneLevel`, extended sync), `cefr.ts` (no change to unlock logic — demotion flows through existing `getEffectiveLevelForUnlock`), `progressSnapshot.ts` / `applyRemoteProgress.ts` (carry `checkpoints` in sync), `App.tsx` (mount checkpoint gate after `syncReady`, foreground/HomeTab only), `onboardingGates.ts` (sibling gate helper if shared), `EquivalencyTestScreen.tsx` (refactor its inner exam into the shared `ExamRunner`).

---

## 11. Resolved decisions (2026-06-07)

1. **Speaking task count** — 1 by default; a second task is auto-added only when speaking was previously flagged *or* the first task scores ≤0.87. Adaptive reliability spent only at the decision boundary. (See §5.5.)
2. **Retention failures** — **count toward the core pass/fail overall that drives demotion**: forgetting earlier-level material can push a user below the bar and, after the grace attempt, demote them. Failed retention items also inject earlier-level review + set focus flags. (See §5.5 / §5.6.)
3. **A1 checkpoint** — runs, but **non-demoting** (A1 is the floor): failure → grace/retry, foundation focus flags, and holds A1→A2 advancement until a later A1 checkpoint passes. (See §5.4 / §5.6.)
