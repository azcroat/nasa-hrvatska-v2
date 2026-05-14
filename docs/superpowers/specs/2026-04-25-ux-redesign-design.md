# UX Redesign — Daily Session Hub Design Spec

**Date:** 2026-04-25
**Scope:** All 5 tabs — Today, Learn (unchanged), Practice, Croatia, Me (Profile)
**Approach:** Approach 1 — Daily Session Hub (approved by user)

---

## 1. Problem Statement

The HomeTab currently presents 12+ sections simultaneously (PathProgressCard, CampaignBanner, WelcomeBackBanners, SpeedChallenge, WeakWordsPanel, AITutorCard, DailyCroatianSection, StatsWidget, HeroSection, and more). Users have no clear answer to "what should I do today?" Practice tab shows all 50+ exercises to all users regardless of level. The two tabs create overwhelm and choice paralysis without guiding users toward consistent daily habits.

---

## 2. Architecture Overview

### Core concept
A `useDailySession` hook owns one daily session object: 3–6 activities selected from three priority sources (FSRS reviews → adaptive weak spots → CEFR-filtered exercises → Croatia immersion slot). The HomeTab renders a single three-state session card. The PracticeTab gates exercises by CEFR level, showing locked exercises as aspirational teasers. Profile gains a session streak widget. Croatia gains a Daily Immersion session slot in its Discover section.

### Data flow
```
localStorage sources          useDailySession hook        Consumers
─────────────────────         ────────────────────        ─────────
nh_sr (FSRS reviews)    ───▶  buildSession()        ───▶  HomeTab (SessionCard)
nh_cat_sr (category SR) ───▶  restoreSession()      ───▶  App.jsx (markDone wiring)
nh_recent_exercises     ───▶  markDone(id)
authUser.cefr           ───▶  recordSessionComplete()
nh_daily_session        ◀───  persist / restore
nh_session_history      ◀───  completion record
```

### Key invariants
- Session activities are stable for the full day — mount/unmount does not rebuild
- `markDone` is idempotent (double-call safe)
- CEFR gating is display-only — no routing blocked, locked tiles show aspirational toasts
- Croatia tab structure is unchanged — only a session slot card and 3 soft-hint banners added

---

## 3. New Files

| File | Responsibility |
|------|---------------|
| `src/hooks/useDailySession.ts` | Daily session state, buildSession(), markDone(), session persistence |
| `src/lib/cefr.ts` | `CEFR_ORDER`, `cefrRank()`, `isUnlocked()` — pure functions, no side effects |
| `src/components/home/SessionCard.tsx` | Three-state session card component (active / in-progress / complete) |

---

## 4. Modified Files

| File | Change |
|------|--------|
| `src/components/home/HomeTab.tsx` | Remove 12 section components; render `<SessionCard>` + 3 stat pills + knight greeting |
| `src/components/practice/PracticeTab.tsx` | Add CEFR badge header, split EXERCISES render into available/locked sections |
| `src/components/profile/StatsTab.tsx` | Add session streak widget (reads `nh_session_history`) |
| `src/components/profile/InsightsTab.tsx` | Remove "Review →" buttons from Growth Opportunities; add "✓ In today's session" note |
| `src/components/croatia/DiscoverTab.tsx` | Add Daily Immersion session-slot card at top |
| `src/components/croatia/AIConversation.tsx` | Add soft B1+ hint banner |
| `src/components/croatia/RoleplayScreen.tsx` | Add soft B1+ hint banner |
| `src/components/croatia/TextingScreen.tsx` | Add soft B1+ hint banner |
| `src/App.tsx` | Wire `markDone` on home navigation; pass session hook return values to HomeTab |

---

## 5. Section 1 — HomeTab: Daily Session Hub

### 5.1 Three session states

**State A — Active (no activities completed today)**
- Knight greeting ("Dobro jutro, [name]!")
- Session card: headline "Today's Session", activity list preview (labels only), estimated minutes
- Primary CTA: "▶ Begin Session →" → launches `nextActivity.screen`
- 3 stat pills below card: streak · XP today · words due

**State B — In-progress (1+ activities completed, not all done)**
- Session card: headline "Continue Session →", progress bar (fill = `progress` 0–1), completed count
- Primary CTA: "Continue →" → launches next incomplete activity
- Same 3 stat pills

**State C — Complete (all activities done)**
- Green complete card: "🎉 Session Complete!", completed count, session XP earned
- Secondary link: "Keep practicing →" routes to Practice tab
- Tomorrow preview: "3–5 activities tomorrow"
- Knight celebration animation

### 5.2 Removed from HomeTab

All of the following are removed. Their functionality is preserved in other tabs:
- `PathProgressCard` → Learn tab
- `CampaignBanner` → removed entirely (content is stale)
- `WelcomeBackBanners` → replaced by knight greeting in session card
- `UnitCompleteBanner` → replaced by session complete state
- `WeakWordsPanel` → surfaces via session engine (adaptive priority 2)
- `AITutorCard` → Practice tab
- `DailyCroatianSection` → Croatia tab Discover section
- `DailyListeningCard` → Practice tab (kept there, removed from Home)
- `StatsWidget` → 3 stat pills on session card (condensed)
- `HeroSection` → removed (replaced by knight greeting)
- `SpeedChallenge` → Practice tab (kept there, removed from Home)
- `WeeklyRecapModal` → Profile Stats tab

### 5.3 What stays on HomeTab

- Knight mascot (Vitez Hrvoje) — greeting and celebration reactions
- Tab bar / navigation
- The 3 stat pills (streak, XP today, words due) — condensed, below session card

---

## 6. Section 2 — PracticeTab: CEFR Gating

### 6.1 CEFR level source

`authUser?.cefr ?? 'A1'` — set by the CEFR Test screen, stored on the auth user object. Defaults to A1 for new users.

### 6.2 Gating logic

```typescript
// src/lib/cefr.ts
export const CEFR_ORDER = ['A1','A1+','A2','A2+','B1','B1+','B2','B2+','C1','C1+'];

export function cefrRank(cefr: string): number {
  const i = CEFR_ORDER.indexOf(cefr);
  return i === -1 ? 0 : i;
}

export function isUnlocked(exerciseCefr: string, userCefr: string): boolean {
  return cefrRank(exerciseCefr) <= cefrRank(userCefr);
}
```

### 6.3 Render structure

```
PracticeTab
├── Header row: "Practice" title + CEFR badge ("A2 · Your Level")
├── "Progress to B1" nudge bar (only when nextTier exists)
├── Section: "Available Now"
│   └── Exercise tiles (full color, tappable, launch screen)
└── Section: "Unlock at B1 🔒"
    └── Locked exercise tiles (grey, tappable → toast: "Available at B1")
        └── "+ N more unlock at B1 · Keep going →" footer
```

### 6.4 CEFR unlock ladder (abridged)

| Level | Unlocks |
|-------|---------|
| A1 | Flashcards, MC Quiz, Match Game, Speed Challenge, SRS Review, Smart Review, Grammar Blind Spots, Daily Listening |
| A1+ | Translate (Znam), Questions, Gender, Pronouns, Opposites, Speaking Sprint, Dialogue Sim, Pronunciation Test, CEFR Test |
| A2 | Sentence Cloze, Listening, Typing, Word Order, Prepositions, Build Sentences, Tile Assembly, 20 Core Verbs, Negation, Translate Drills |
| A2+ | AI Listening, AI Story, Video Lesson, Production Drill, Sound Contrast, Slang (Svaki Dan, Gen Z) |
| B1 | Aspect Drill, Free Writing, Dictation, Case Constellation, Accusative Drill, Future Tense, Comparatives, Slang (Dalmatian, Zagreb) |
| B1+ | Clitic Drill, Pitch Accent, Shadowing, Slang (Šatrovački, Classics) |
| B2 | Slang (Psovanje kao Kunst), remaining advanced content |

### 6.5 Locked tile behaviour

Tapping a locked tile shows a non-blocking toast (2 seconds): *"Available at B1 — keep learning to unlock"*. Does not navigate. Does not block access if the user finds another way in.

### 6.6 Category grid removed

The current collapsible category tiles (grammar/vocab/practical/advanced grid) are replaced by the flat available/locked list. The intent tabs (Review/Drill/Challenge) remain but filter locked exercises out automatically.

---

## 7. Section 3 — Session Engine: useDailySession

### 7.1 TypeScript interfaces

```typescript
// src/hooks/useDailySession.ts

export interface SessionActivity {
  id: string;             // exercise id, e.g. 'srsreview', 'cloze', 'cityofday'
  label: string;          // shown in session card, e.g. "Sentence Cloze"
  screen: string;         // screen name passed to setScr(), e.g. 'cloze'
  category: SkillCategory;
}

export interface DailySession {
  date: string;           // 'YYYY-MM-DD' — invalid if !== today
  activities: SessionActivity[];
  completedIds: string[];
  estimatedMinutes: number;
}

export interface UseDailySessionReturn {
  session: DailySession;
  isComplete: boolean;
  progress: number;       // 0.0–1.0
  markDone: (id: string) => void;
  nextActivity: SessionActivity | null;
  tomorrowLabel: string;
}
```

### 7.2 buildSession() — four priority sources

```
Priority 1 — FSRS word reviews (getDueReviews())
  → Add 'srsreview' activity if dueReviews.length > 0 (max 1 slot)

Priority 2 — Adaptive category (getDueCategoryQueue(6))
  → Add top due category mapped to a screen via CATEGORY_SCREEN_MAP (max 1 slot)

Priority 3 — CEFR-appropriate fill (EXERCISES array)
  → Filter: isUnlocked(ex.cefr, userCefr)
  → Exclude: nh_recent_exercises (last 6 played)
  → Shuffle, take until total = 3–5 activities

Priority 4 — Croatia immersion (always 1 slot)
  → cityofday if not visited today (nh_cityofday_date !== today)
  → else CROATIA_SESSION_ACTIVITIES[(dayOfMonth % 7) + 1]
```

Total activities per session: 4–6.

### 7.3 CATEGORY_SCREEN_MAP

```typescript
const CATEGORY_SCREEN_MAP: Record<SkillCategory, string> = {
  genitive:         'prepdrill',
  accusative:       'akudrill',
  'dative-locative':'cloze',
  instrumental:     'cloze',
  vocab:            'znam',
  listening:        'listening',
  speaking:         'speaking_sprint',
  grammar:          'cloze',
  reading:          'readlist',
  writing:          'writing',
  culture:          'history',
};
```

### 7.4 Session persistence

- Key: `nh_daily_session`
- On mount: parse stored value; if `date === localDateStr()` → restore; else → `buildSession()`
- On `markDone(id)`: update `completedIds`, persist to localStorage
- On session complete: call `recordSessionComplete(date)` → write to `nh_session_history`

### 7.5 markDone wiring in App.tsx

`markDone` is called from App.tsx in two places:
1. After `setScr('home')` — check if previous screen (`prevScreenRef.current`) matches any `session.activities[].screen` → call `markDone(matchedActivity.id)`
2. Inside `award()` wrapper — if current screen is in session activities → call `markDone(currentScreen)`

`markDone` is idempotent: `if (prev.completedIds.includes(id)) return prev`.

### 7.6 Edge cases

| Scenario | Behaviour |
|----------|-----------|
| New user (no FSRS, no category SR data) | Priorities 1 and 2 empty; fills from Priority 3 only; always resolves to ≥3 activities |
| All recent exercises used | Re-use full CEFR pool without recency filter as fallback |
| User closes app mid-exercise | Activity not marked done; shows again on next open (short redo, acceptable) |
| Midnight during active session | No reset until next mount; fresh session on next app open |
| Session complete, user wants more | "Keep practicing →" link to Practice tab; session state stays complete |
| CEFR level advances mid-session | Today's session unchanged; tomorrow's `buildSession()` uses new level |

---

## 8. Section 4 — ProfileTab: Consolidation

### 8.1 Session streak widget (StatsTab.tsx)

Appears below the existing stat grid. Shows:
- Streak count: "5-day session streak"
- Dot calendar: 7 dots (past 6 days + today), filled = completed, green = today, empty = missed

```typescript
// src/lib/sessionHistory.ts (new small utility, or inline in StatsTab)
function getSessionStreak(): number {
  try {
    const history = JSON.parse(localStorage.getItem('nh_session_history') || '{}');
    let streak = 0;
    const d = new Date();
    while (history[localDateStr(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  } catch { return 0; }
}
```

Written when session completes via `recordSessionComplete(date)` called in `useDailySession.markDone`.

### 8.2 InsightsTab.tsx — Growth Opportunities simplification

Remove the "Review →" `<button>` from each weak-area row in the Growth Opportunities section. The session engine surfaces these as Priority 2 activities — routing from Insights is redundant.

Replace with a small note below the accuracy line:
- If the category is today's session Priority 2 activity: `"✓ In today's session"`
- Otherwise: nothing (row is information only)

---

## 9. Section 5 — Croatia Tab: Session Integration

### 9.1 CROATIA_SESSION_ACTIVITIES pool

```typescript
const CROATIA_SESSION_ACTIVITIES: SessionActivity[] = [
  { id: 'cityofday',  label: 'City of the Day',    screen: 'cityofday',  category: 'culture'   },
  { id: 'top100',     label: 'Top 100 Phrases',     screen: 'top100',     category: 'vocab'     },
  { id: 'grocery',    label: 'Grocery Scenario',    screen: 'grocery',    category: 'practical' },
  { id: 'transport',  label: 'Transport Scenario',  screen: 'transport',  category: 'practical' },
  { id: 'recipes',    label: 'Croatian Recipes',    screen: 'recipes',    category: 'culture'   },
  { id: 'history',    label: 'Croatian History',    screen: 'history',    category: 'culture'   },
  { id: 'proverbs',   label: 'Croatian Proverbs',   screen: 'proverbs',   category: 'culture'   },
  { id: 'popculture', label: 'Pop Culture',         screen: 'popculture', category: 'culture'   },
];
```

### 9.2 Priority 4 selection logic

```typescript
const todayVisited = localStorage.getItem('nh_cityofday_date') === localDateStr();
const rotationIndex = new Date().getDate() % (CROATIA_SESSION_ACTIVITIES.length - 1);
const croatiaActivity = todayVisited
  ? CROATIA_SESSION_ACTIVITIES[1 + rotationIndex]  // skip cityofday at index 0
  : CROATIA_SESSION_ACTIVITIES[0];                 // cityofday when unvisited
activities.push(croatiaActivity);
```

### 9.3 Daily Immersion card in DiscoverTab.tsx

Shown at the top of the Discover section when the Croatia activity is `cityofday` and the session is active (not complete). Renders:
- Header: "Today's Immersion · In your session"
- Content: activity label + sub-line ("City of the Day · 1 fact + 3 Croatian phrases")
- CTA button: "▶ Open City of the Day →" — calls `setScr('cityofday')`

Hidden when: session is complete, or today's Croatia activity is not `cityofday`.

### 9.4 Soft B1+ hints

A single shared banner component (`<CefrSoftHint level="B1+" />`) placed at the top of three screens:

```tsx
// src/components/shared/CefrSoftHint.tsx
export function CefrSoftHint({ level }: { level: string }) {
  return (
    <div className="cefr-soft-hint">
      Most rewarding once you reach {level} — but dive in anytime, it's good practice.
    </div>
  );
}
```

Added to: `AIConversation.tsx`, `RoleplayScreen.tsx`, `TextingScreen.tsx`.

---

## 10. Code Size Estimate

| Area | New lines | Changed lines |
|------|-----------|---------------|
| `useDailySession.ts` (new) | ~120 | — |
| `cefr.ts` (new) | ~20 | — |
| `SessionCard.tsx` (new) | ~80 | — |
| `CefrSoftHint.tsx` (new) | ~15 | — |
| `HomeTab.tsx` | — | ~−200 (remove), +60 (session card wiring) |
| `PracticeTab.tsx` | — | ~+60 |
| `StatsTab.tsx` | — | ~+25 |
| `InsightsTab.tsx` | — | ~−15 |
| `DiscoverTab.tsx` | — | ~+25 |
| `AIConversation/Roleplay/Texting` | — | ~+3 each |
| `App.tsx` | — | ~+15 |
| **Total** | **~235 new** | **~−100 net** |

---

## 11. What Is NOT Changing

- **Learn tab** — LearnPath is unchanged
- **Croatia tab structure** — CroatiaTab, CultureTab, MediaTab, StoriesTab, all screens
- **Exercise screen internals** — no changes to any individual exercise component
- **Firebase / sync layer** — session state stays localStorage-only for now (Firestore sync deferred)
- **Auth flow** — unchanged
- **E2E test suite** — no existing tests broken; new tests needed for SessionCard and CEFR gating

---

## 12. Open Questions (deferred)

1. **Cross-device sync for session state** — agreed to tackle separately; session uses localStorage-only initially
2. **Session XP award** — how much XP does completing a session award? (Not designed here; session completion fires existing `award()` calls per activity)
3. **Learn tab integration** — should LearnPath items appear as session activities? (Not in scope; LearnPath has its own launch flow via `launchPathItem()`)
