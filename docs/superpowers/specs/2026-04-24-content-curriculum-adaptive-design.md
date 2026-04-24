# Content Curriculum & Adaptive Learning System Design

## Goal

Deliver a fully adaptive Croatian learning experience: the right content, at the right difficulty, at the right time — for every user. Closes five roadmap items from the 2026-04-04 content audit in one unified implementation.

## Roadmap Items Addressed

1. Dedicated past tense practice (A2) — FSRS-scheduled exercises, not just the animated lesson
2. Dedicated future tense practice (A2-B1) — same treatment
3. B2+ vocabulary depth expansion — ~120 new terms across 4 categories
4. Improved speaking/production variety — 3 new prompt types in SpeakingScreen
5. Adaptive learning system — all of the above delivered adaptively

## Architecture

Three integrated layers, each independently useful, together forming a closed feedback loop:

```
Layer 1 — FSRS Scheduler (extended)
  Extends the existing srs.js FSRS-4.5 engine from vocabulary to all skill categories.
  Each of 16 skill categories is an FSRS "card" — rated after each practice session.
  Storage: new adaptive/{userId} Firestore doc (separate from srs/{userId} vocabulary cards).
  Granularity: per category, not per individual exercise. Category-level tracking gives
  ~90% of the benefit at ~10% of the storage cost.

Layer 2 — Category Weakness Router
  Reads adaptive/{userId} after each session to build a weighted practice queue.
  Priority: FSRS-due categories first → lowest recentAccuracy second → balanced fill third.
  Practice Tab UI is unchanged; users experience smart routing invisibly.

Layer 3 — In-Session Difficulty Adjuster
  Each exercise tagged with a difficulty tier (1–5) in a new metadata file.
  Session hook tracks correctStreak and wrongStreak:
    3 correct in a row → difficulty +1 (cap 5), reset streaks
    2 wrong  in a row → difficulty -1 (floor 1), reset streaks
  Difficulty adjusts silently — no UI indicator, just harder or easier content.
```

## 16 Skill Categories

| Category | Content types |
|---|---|
| `genitive` | Case drills, grammar exercises |
| `accusative` | Case drills |
| `dative-locative` | Case drills |
| `instrumental` | Case drills |
| `vocative` | Case drills |
| `past-tense` | Tense exercises, tense-flip drills |
| `future-tense` | Tense exercises |
| `aspect-imperfective` | Aspect drills |
| `aspect-perfective` | Aspect drills |
| `aspect-negation` | Production drills (negate + flip aspect) |
| `conditional` | Grammar exercises |
| `clitics` | Production drills |
| `vocab-a2` | Flashcards, matching, typing |
| `vocab-b1` | Flashcards, matching, typing |
| `vocab-b2` | Flashcards, matching, typing |
| `speaking` | SpeakingScreen prompts |

## File Structure

### New files

| File | Responsibility |
|---|---|
| `src/lib/adaptiveScheduler.ts` | FSRS rating for categories; session queue builder; recentAccuracy decay |
| `src/data/exerciseMeta.ts` | Difficulty (1–5) + category tag for every exercise ID in exercises.js |
| `src/hooks/useAdaptiveSession.ts` | In-session streak tracking; difficulty selection; onCorrect/onWrong API |
| `src/hooks/useAdaptivePractice.ts` | Loads `adaptive/{userId}` from Firestore; calls queue builder; exposes `practiceQueue` to PracticeTab |

### Modified files

| File | Change |
|---|---|
| `src/data/exercises.js` | ~40 new past-tense and future-tense exercises (20 per tense, difficulties 2–4) |
| `src/data/vocabulary.js` | ~120 new B2+ terms across 4 categories (philosophy-ethics expanded, media-journalism expanded, legal new, psychology new) |
| `src/components/practice/SpeakingScreen.tsx` | 3 new prompt types: picture description, question response, dialogue completion |
| `src/components/practice/PracticeTab.tsx` | Replace static layout with `useAdaptivePractice` hook for smart routing |
| `src/components/practice/ProductionDrillScreen.tsx` | Wire `useAdaptiveSession` for difficulty adjustment |
| `src/components/practice/GrammarScreen.tsx` | Wire `useAdaptiveSession`; rate category on completion |
| `firestore.rules` | Add `adaptive/{userId}` — owner read/write, same pattern as `srs/{userId}` |

## Data Models

### `adaptive/{userId}` Firestore document

```typescript
interface AdaptiveDoc {
  categories: {
    [category: SkillCategory]: {
      // FSRS card fields
      stability: number;       // days until 90% retrievability
      difficulty: number;      // FSRS difficulty 1–10
      state: 0|1|2|3;         // New, Learning, Review, Relearning
      due: number;             // Unix ms timestamp
      reps: number;
      lapses: number;
      // Weakness tracking
      recentAccuracy: number;  // 0.0–1.0, EWMA decay (α=0.3)
      lastSeen: number;        // Unix ms timestamp
    }
  };
  updatedAt: number;
}
```

`recentAccuracy` uses exponential weighted moving average (α=0.3) so recent sessions count more than old ones. Formula: `newAccuracy = 0.3 * sessionScore + 0.7 * oldAccuracy`.

### Exercise metadata (`src/data/exerciseMeta.ts`)

```typescript
export type SkillCategory =
  | 'genitive' | 'accusative' | 'dative-locative' | 'instrumental' | 'vocative'
  | 'past-tense' | 'future-tense'
  | 'aspect-imperfective' | 'aspect-perfective' | 'aspect-negation'
  | 'conditional' | 'clitics'
  | 'vocab-a2' | 'vocab-b1' | 'vocab-b2'
  | 'speaking';

export interface ExerciseMeta {
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: SkillCategory;
}

export const EXERCISE_META: Record<string, ExerciseMeta> = {
  // Covers all exercise IDs in exercises.js.
  // Difficulty assigned by exercise type (structural rule, not per-item judgment):
  //   1 = recognition     — multiple choice from 4 options (MC_* types, BOJE, MATCH)
  //   2 = constrained     — fill blank with given word bank (FILL_BANK, UNJUMBLE)
  //   3 = guided          — fill blank, no word bank (DECL, WORDFORM, TENSEFLIP)
  //   4 = free production — transform a full sentence (SENTBUILD, PRODUCTION negate/transform)
  //   5 = open production — complex transform or generate from context (TRANSLATE_DRILLS, VBPERSONS advanced)
  // Category assigned by grammar/vocabulary domain of the exercise array it belongs to.
};
```

### Session hook (`src/hooks/useAdaptiveSession.ts`)

```typescript
interface AdaptiveSessionState {
  currentDifficulty: 1 | 2 | 3 | 4 | 5;
  correctStreak: number;
  wrongStreak: number;
  categoryAccuracy: Record<SkillCategory, { correct: number; total: number }>;
}

// Returns:
// onCorrect(category): updates streak → may raise difficulty → returns next difficulty
// onWrong(category):   updates streak → may lower difficulty → returns next difficulty
// getNextExercise(category): returns exercise ID matching currentDifficulty in category
// sessionSummary(): accuracy by category for FSRS rating on session end
```

## Adaptive Scheduler (`src/lib/adaptiveScheduler.ts`)

### FSRS rating

After a practice session on a category, the session accuracy maps to an FSRS rating:
- Accuracy ≥ 0.90 → `Easy` (4)
- Accuracy 0.70–0.89 → `Good` (3)
- Accuracy 0.50–0.69 → `Hard` (2)
- Accuracy < 0.50 → `Again` (1)

FSRS updates stability and schedules the next due date, reusing the algorithm already in `src/lib/srs.js`.

### Session queue builder

```typescript
function buildPracticeQueue(adaptiveDoc: AdaptiveDoc, maxSlots: number): QueueItem[] {
  const now = Date.now();
  const due = categories.filter(c => adaptiveDoc.categories[c]?.due <= now);
  const weak = categories
    .filter(c => !due.includes(c))
    .sort((a, b) => (adaptiveDoc.categories[a]?.recentAccuracy ?? 0.5)
                  - (adaptiveDoc.categories[b]?.recentAccuracy ?? 0.5));
  const balanced = categories.filter(c => !due.includes(c) && !weak.slice(0,3).includes(c));

  return [...due, ...weak.slice(0, 3), ...balanced]
    .slice(0, maxSlots)
    .map(category => ({ category, difficulty: getDifficultyForUser(adaptiveDoc, category) }));
}
```

`getDifficultyForUser` returns the difficulty tier matching the user's current FSRS stability for that category — low stability → lower difficulty, high stability → higher difficulty.

### recentAccuracy decay

On each session end, categories not practiced decay slightly:
`recentAccuracy = max(recentAccuracy - 0.01, 0.0)` per day since lastSeen.
This prevents old strong categories from permanently blocking weak ones from surfacing.

## New Content

### Past tense exercises (20 items, `exercises.js`)

Exercise types: tense-flip (present → past), conjugation completion, error correction.
Difficulties: 8× difficulty-2 (multiple choice), 8× difficulty-3 (fill blank), 4× difficulty-4 (transform sentence).
Category tag: `past-tense`.

Example (difficulty-3):
```
Prompt: "Jučer sam _____ (čitati) knjigu."
Answer: "čitao/čitala"
Note: masculine čitao, feminine čitala
```

### Future tense exercises (20 items, `exercises.js`)

Same structure as past tense.
Category tag: `future-tense`.

Example (difficulty-4):
```
Prompt: Transform to future: "Idem u školu svaki dan."
Answer: "Ići ću u školu svaki dan."
Note: short future — ići ću, not idem ću
```

### B2+ vocabulary expansion (~120 new terms, `vocabulary.js`)

| Category (V_B2 key) | New terms | Running total |
|---|---|---|
| `philosophy-ethics` | +30 (add: epistemologija, ontologija, empirizam, racionalizam, utilitarizam, etc.) | ~55 |
| `media-journalism` | +25 (add: algoritam, mjehurić filtera, clickbait, dezinformacija, bot, etc.) | ~45 |
| `legal` | +35 (new category: tužba, optužnica, presuda, branitelj, tužitelj, svjedok, etc.) | 35 |
| `psychology` | +30 (new category: kognitivna distorzija, pristranost potvrde, afekt, trauma, etc.) | 30 |

All new terms enter the FSRS pool under `vocab-b2`. Existing V_B2 terms are already in the pool; new ones start as `state: New`.

### Speaking prompt variety (SpeakingScreen)

Three new `promptType` values added to the SpeakingScreen prompt array:

**`picture-description`** — User sees a scene image and must describe it in Croatian.
Prompts paired with existing `public/images/scenes/` images (dubrovnik-ai, dalmatian-coast, plitvice, zagreb, croatian-food).
Example: "Opišite ovu sliku na hrvatskom. Što vidite?" (Describe this image in Croatian. What do you see?)

**`question-response`** — User must answer a Croatian question with a full sentence.
Example question: "Što si radio/radila prošlog vikenda?" (What did you do last weekend?)
Expected: full sentence in past tense.

**`dialogue-completion`** — User is given conversational context (2 prior turns) and must produce the next turn.
Example context: A: "Hej, kako si?" B: "Super, hvala. A ti?" → User produces A's response.

All new prompts are tagged to `speaking` category with difficulties 2–4 matching complexity.

## Practice Tab — Smart Routing

`PracticeTab.tsx` currently renders a static grid of exercise type buttons. After this change:

1. On mount: call `buildPracticeQueue(adaptiveDoc, 6)` → get 6 prioritized {category, difficulty} slots
2. Render the same visual grid, but each card's `onPress` is bound to the adaptive queue slot
3. If no `adaptive/{userId}` doc exists (new user): fall through to existing static layout unchanged

No visual redesign. The routing is invisible to the user — they tap "Practice" and get the right content.

## Firestore Rules Addition

```javascript
// ─── Adaptive learning — per-category FSRS state ──────────────────────────
// Same pattern as srs/{userId}: owner read/write, no size cap (data is compact).
// Schema: { categories: map, updatedAt: number }
match /adaptive/{userId} {
  allow read: if isOwner(userId);
  allow create, update: if isOwner(userId)
    && request.resource.data.keys().hasAll(['categories', 'updatedAt'])
    && request.resource.data.updatedAt is number;
  allow delete: if isOwner(userId);
}
```

## Error Handling

- `adaptive/{userId}` doc missing (new user, first session): all categories default to `{ state: New, recentAccuracy: 0.5 }`. Queue builder treats all as unscheduled; first run uses balanced fill.
- Firestore write fails on session end: FSRS rating is lost for that session; user sees no error. Next session starts from pre-session state. Acceptable — one missed rating doesn't degrade the system.
- `EXERCISE_META` lookup miss (exercise ID not in metadata): default to `{ difficulty: 3, category: 'vocab-b1' }`. Logged to console in development.
- SpeakingScreen picture-description: if image fails to load, fall back to text-only prompt describing the scene.

## Testing

- Unit: `adaptiveScheduler.ts` — queue ordering (due beats weak beats balanced), recentAccuracy EWMA, FSRS rating mapping
- Unit: `useAdaptiveSession.ts` — streak logic (3 correct → difficulty+1, 2 wrong → difficulty-1, cap/floor enforcement)
- Unit: `exerciseMeta.ts` — all 400 exercise IDs present, all difficulties 1–5, all categories valid
- Unit: new vocabulary — all 120 new terms have 2-field minimum (Croatian, English)
- Unit: new exercises — all 40 past/future tense exercises have answer field and category tag
- Integration: `adaptive/{userId}` Firestore rules — owner can read/write, other user denied
- E2E: complete a grammar session → verify `adaptive/{userId}` updated with new recentAccuracy

## What This Does NOT Do

- **No difficulty UI indicator** — users don't see "Easy / Medium / Hard" labels. The system adapts silently.
- **No path branching** — the LEARN_PATH sequence (A1→C1) is unchanged. Adaptive routing applies to Practice Tab only, not the sequential lesson path.
- **No writing assessment** — writing production grading remains AI-based (WritingScreen unchanged).
- **No cross-device conflict resolution** — if two devices write `adaptive/{userId}` simultaneously, last write wins. The data is low-stakes enough that this is acceptable.
