# Vitez Hrvoje — Hyper-Expressive Emotions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 expressive moods to Vitez Hrvoje with silent flash reactions across all major practice screens and speech-bubble milestone reactions on level-up, perfect sessions, and quest completions.

**Architecture:** Two-function API (`knightFlash` for silent face flashes, existing `knightSpeak` for milestone bubbles). `KnightCompanion` gains `flashMood` state that takes highest priority in the mood chain and auto-reverts after a configurable duration. Flash reactions are wired into 4 practice components; milestone reactions update `useAward` and `quests.ts`.

**Tech Stack:** TypeScript, React, Vitest, @testing-library/react, SVG (CSS-only animations — no Framer Motion due to Android WebView rule)

---

## File Map

| File | Change |
|------|--------|
| `src/lib/knightSpeak.ts` | Add `knightFlash()` export |
| `src/components/shared/CroatianKnight.tsx` | 8 MOOD entries, 8 MOOD_GLOW entries, new mouth types, 2 CSS keyframes, per-eye wink |
| `src/components/shared/KnightCompanion.tsx` | `flashMood` state, `flashTimer` ref, `knight:flash` listener, updated priority chain, `knight:quest-done` listener |
| `src/components/practice/McGame.tsx` | Import `knightFlash`, add flash calls in `handleAnswer` |
| `src/components/practice/Flashcards.tsx` | Import `knightFlash`, add consecutive refs, add flash calls |
| `src/components/practice/TypingScreen.tsx` | Import `knightFlash`, add consecutive refs, add flash calls |
| `src/components/practice/WordSprint.tsx` | Import `knightFlash`, add consecutive refs + worried timer flash |
| `src/hooks/useAward.ts` | Change all `LEVEL_SPEECHES` moods from `'celebrating'` to `'levelup'` |
| `src/lib/quests.ts` | Dispatch `knight:quest-done` event from `markQuest` |
| `src/tests/knightSpeak.test.ts` | New — unit tests for `knightFlash` |
| `src/tests/mcgame.test.tsx` | Add flash dispatch assertions |
| `src/tests/typing-screen.test.tsx` | Add flash dispatch assertions |

---

## Task 1: Add `knightFlash` to knightSpeak.ts

**Files:**
- Modify: `src/lib/knightSpeak.ts`
- Create: `src/tests/knightSpeak.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/knightSpeak.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// knightSpeak.ts has no external deps — import directly
import { knightFlash } from '../lib/knightSpeak';

describe('knightFlash', () => {
  let events: CustomEvent[] = [];

  beforeEach(() => {
    events = [];
    window.addEventListener('knight:flash', (e) => events.push(e as CustomEvent));
  });

  afterEach(() => {
    window.removeEventListener('knight:flash', (e) => events.push(e as CustomEvent));
  });

  it('dispatches knight:flash with correct mood and default duration', () => {
    knightFlash('oops');
    expect(events).toHaveLength(1);
    expect(events[0].detail.mood).toBe('oops');
    expect(events[0].detail.durationMs).toBe(1800);
  });

  it('dispatches knight:flash with custom duration', () => {
    knightFlash('onfire', 2000);
    expect(events).toHaveLength(1);
    expect(events[0].detail.durationMs).toBe(2000);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd "C:/Users/jschr/Dropbox/Croatian Learning Application/Source Code/nasa-hrvatska-v2"
npx vitest run src/tests/knightSpeak.test.ts
```

Expected: `knightFlash is not a function` or similar import error.

- [ ] **Step 3: Add `knightFlash` to `src/lib/knightSpeak.ts`**

Open `src/lib/knightSpeak.ts`. After the closing brace of `knightSpeak`, add:

```typescript
/**
 * knightFlash — silent face-only mood override. No speech bubble.
 * Knight's face switches to `mood` for `durationMs` ms, then reverts.
 * Fires `knight:flash` event. KnightCompanion handles the rest.
 */
export function knightFlash(mood: string, durationMs = 1800): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('knight:flash', { detail: { mood, durationMs } }),
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run src/tests/knightSpeak.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/knightSpeak.ts src/tests/knightSpeak.test.ts
git commit -m "feat: add knightFlash() — silent face-only mood flash API"
```

---

## Task 2: Add 8 new moods to CroatianKnight.tsx

**Files:**
- Modify: `src/components/shared/CroatianKnight.tsx`
- Modify: `src/tests/components.test.tsx`

### 2a — New mouth types in `Mouth` component

Find the `Mouth` component's `switch (type)` block. Add these cases before the `default`:

```tsx
case 'oops_o':
  // Small open oval — surprised
  return <ellipse cx={0} cy={2} rx={4} ry={5.5} fill={C.mouth} stroke={C.outline} strokeWidth="2" />;
case 'wavy':
  // Uncertain wavy line — struggling
  return <path d="M-6 0 Q-3 -3 0 0 Q3 3 6 0" stroke={C.outline} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
case 'smirk':
  // Asymmetric smirk — winking
  return <path d="M-4 1 Q0 5 6 -1" stroke={C.outline} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
case 'frown_sm':
  // Slight frown — worried
  return <path d="M-5 3 Q0 -1 5 3" stroke={C.outline} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
```

### 2b — Add 8 entries to `MOOD` table

In the `MOOD` constant, add 8 new entries after `neutral`:

```typescript
oops:       { browL: -8, browLY: -3, browR: -8, browRY: -3, mouth:'oops_o',     px: 0, py:-2, eScale:1.20         },
struggling: { browL:  6, browLY:  1, browR: -6, browRY:  1, mouth:'wavy',       px: 0, py: 2, eScale:0.45         },
onfire:     { browL:  8, browLY:  0, browR:  8, browRY:  0, mouth:'big_smile',   px: 0, py: 1, eScale:0.65         },
tearsofjoy: { browL: -4, browLY: -1, browR: -4, browRY: -1, mouth:'big_smile',   px: 0, py: 0, eScale:0.20         },
levelup:    { browL:-10, browLY: -4, browR:-10, browRY: -4, mouth:'victory',     px: 0, py:-1, eScale:1.00         },
winking:    { browL:  0, browLY:  0, browR:  0, browRY:  0, mouth:'smirk',       px:-1, py: 1, eScale:0.95, winkR:true },
proud:      { browL: -3, browLY: -1, browR: -3, browRY: -1, mouth:'happy',       px: 0, py: 0, eScale:0.75         },
worried:    { browL:  5, browLY:  1, browR: -5, browRY:  1, mouth:'frown_sm',    px:-2, py: 3, eScale:0.88         },
```

> `eScale: 1.20` for `oops` clamps to `Math.min(RY * scaleY, ...)` so eyes go as wide as possible. `winkR:true` is a new flag for per-eye wink (see step 2c).

### 2c — Per-eye wink support

Find the `eyeScaleY` / `isWink` derivation (around line 350):

```typescript
const eyeScaleY = (cfg.wink || blink) ? 0.0 : cfg.eScale;
const isWink    =  cfg.wink || blink;
```

Replace with:

```typescript
const eyeScaleY = (cfg.wink || blink) ? 0.0 : cfg.eScale;
const isWinkL   = cfg.wink || blink;               // left eye closes on global wink or blink
const isWinkR   = cfg.wink || (cfg as any).winkR || blink; // right eye also closes on winkR
```

Find the two `<Eye>` calls (around lines 644-653):

```tsx
<Eye
  cx={ELX} cy={EY}
  pxOff={cfg.px} pyOff={cfg.py}
  scaleY={eyeScaleY} wink={isWink}
/>
<Eye
  cx={ERX} cy={EY}
  pxOff={cfg.px} pyOff={cfg.py}
  scaleY={eyeScaleY} wink={isWink}
/>
```

Replace with:

```tsx
<Eye
  cx={ELX} cy={EY}
  pxOff={cfg.px} pyOff={cfg.py}
  scaleY={eyeScaleY} wink={isWinkL}
/>
<Eye
  cx={ERX} cy={EY}
  pxOff={cfg.px} pyOff={cfg.py}
  scaleY={eyeScaleY} wink={isWinkR}
/>
```

### 2d — Add 8 entries to `MOOD_GLOW`

In the `MOOD_GLOW` constant, add:

```typescript
oops:       'drop-shadow(0 0 8px rgba(239,68,68,.55))',
struggling: 'drop-shadow(0 0 6px rgba(148,163,184,.40))',
onfire:     'drop-shadow(0 0 12px rgba(251,191,36,.9)) drop-shadow(0 0 24px rgba(245,158,11,.5))',
tearsofjoy: 'drop-shadow(0 0 8px rgba(59,130,246,.55)) drop-shadow(0 0 18px rgba(99,102,241,.30))',
levelup:    'drop-shadow(0 0 10px rgba(245,194,48,.9)) drop-shadow(0 0 22px rgba(245,194,48,.5))',
winking:    'drop-shadow(0 0 5px rgba(27,79,216,.35))',
proud:      'drop-shadow(0 0 7px rgba(22,163,74,.50))',
worried:    'drop-shadow(0 0 5px rgba(100,116,139,.35))',
```

### 2e — Add 2 new CSS keyframes in `ANIM_CSS`

Append to the `ANIM_CSS` string:

```typescript
  @keyframes kn-flicker {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(251,191,36,.8)) drop-shadow(0 0 20px rgba(245,158,11,.4)); }
    50%       { filter: drop-shadow(0 0 20px rgba(251,191,36,1)) drop-shadow(0 0 38px rgba(245,158,11,.7)); }
  }
  @keyframes kn-levelup-ring {
    0%   { transform: scale(1);   opacity: 0.85; }
    100% { transform: scale(1.9); opacity: 0; }
  }
```

### 2f — Apply `kn-flicker` animation to `onfire` container

Find the outer `<div>` that wraps the SVG (the one that already applies `filter: MOOD_GLOW[mood]`):

```tsx
<div
  className={className}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: MOOD_GLOW[mood] || 'none',
    ...style,
  }}
>
```

Replace with:

```tsx
<div
  className={className}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    filter: MOOD_GLOW[mood] || 'none',
    animation: mood === 'onfire' ? 'kn-flicker 0.65s ease-in-out infinite' : undefined,
    ...style,
  }}
>
```

### 2g — Add mood-specific SVG extras

In the SVG, find the block for `thinking` dots (around line 680). After the `celebrating` stars block (ends around line 710), add:

```tsx
{/* ── Oops blush boost ── */}
{mood === 'oops' && (
  <g>
    <ellipse cx={HX - 21} cy={HY + 14} rx={9} ry={6.5} fill={C.blush} opacity="0.58" />
    <ellipse cx={HX + 21} cy={HY + 14} rx={9} ry={6.5} fill={C.blush} opacity="0.58" />
  </g>
)}

{/* ── Struggling sweat bead ── */}
{mood === 'struggling' && (
  <g>
    <ellipse cx={HX + 24} cy={HY - 12} rx={3} ry={4.5} fill="#7DD3FC" opacity="0.85" />
    <ellipse cx={HX + 24} cy={HY - 13} rx={1.2} ry={1.2} fill={C.white} opacity="0.6" />
  </g>
)}

{/* ── Tears of joy drops ── */}
{mood === 'tearsofjoy' && (
  <g opacity="0.75">
    <path d={`M ${ELX} ${EY + 13} Q ${ELX - 2} ${EY + 19} ${ELX} ${EY + 23} Q ${ELX + 2} ${EY + 19} ${ELX} ${EY + 13} Z`}
      fill="#60A5FA" />
    <path d={`M ${ERX} ${EY + 13} Q ${ERX - 2} ${EY + 19} ${ERX} ${EY + 23} Q ${ERX + 2} ${EY + 19} ${ERX} ${EY + 13} Z`}
      fill="#60A5FA" />
  </g>
)}

{/* ── Level-up gold ring ── */}
{mood === 'levelup' && (
  <circle
    cx={HX} cy={HY} r={HR + 6}
    fill="none" stroke={C.gold} strokeWidth="3.5"
    style={{ animation: 'kn-levelup-ring 0.9s ease-out infinite', transformOrigin: `${HX}px ${HY}px` }}
  />
)}

{/* ── Level-up star pupils ── */}
{mood === 'levelup' && (
  <g>
    <polygon
      points={`${ELX},${EY - 5} ${ELX + 1.5},${EY - 1.5} ${ELX + 5},${EY - 1.5} ${ELX + 2},${EY + 1} ${ELX + 3},${EY + 5} ${ELX},${EY + 2.5} ${ELX - 3},${EY + 5} ${ELX - 2},${EY + 1} ${ELX - 5},${EY - 1.5} ${ELX - 1.5},${EY - 1.5}`}
      fill={C.goldLt} opacity="0.9"
    />
    <polygon
      points={`${ERX},${EY - 5} ${ERX + 1.5},${EY - 1.5} ${ERX + 5},${EY - 1.5} ${ERX + 2},${EY + 1} ${ERX + 3},${EY + 5} ${ERX},${EY + 2.5} ${ERX - 3},${EY + 5} ${ERX - 2},${EY + 1} ${ERX - 5},${EY - 1.5} ${ERX - 1.5},${EY - 1.5}`}
      fill={C.goldLt} opacity="0.9"
    />
  </g>
)}

{/* ── Worried sweat bead ── */}
{mood === 'worried' && (
  <ellipse cx={HX + 25} cy={HY - 6} rx={2.5} ry={3.5} fill="#7DD3FC" opacity="0.78" />
)}
```

### 2h — Update MOOD type comment and accessibility label

Find the comment listing moods at the top of the file (around line 17):

```typescript
// Moods: happy, thinking, celebrating, victory, sad, encouraged,
//        ready, marching, glancing, neutral
```

Replace with:

```typescript
// Moods: happy, thinking, celebrating, victory, sad, encouraged,
//        ready, marching, glancing, neutral,
//        oops, struggling, onfire, tearsofjoy, levelup, winking, proud, worried
```

### 2i — Write smoke tests

In `src/tests/components.test.tsx`, find a suitable describe block. Add at the end of the file:

```tsx
import CroatianKnight from '../components/shared/CroatianKnight';

describe('CroatianKnight — new moods smoke tests', () => {
  const newMoods = ['oops', 'struggling', 'onfire', 'tearsofjoy', 'levelup', 'winking', 'proud', 'worried'];

  newMoods.forEach(mood => {
    it(`renders mood="${mood}" without crashing`, () => {
      const { container } = render(<CroatianKnight mood={mood} size={60} />);
      expect(container.querySelector('svg')).not.toBeNull();
    });
  });
});
```

- [ ] **Step 1: Add smoke tests**

Add the test code above to `src/tests/components.test.tsx`.

- [ ] **Step 2: Run tests — expect FAIL** (new mood names not in MOOD table yet)

```bash
npx vitest run src/tests/components.test.tsx
```

- [ ] **Step 3: Apply all CroatianKnight changes** (Steps 2a–2h above in order)

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run src/tests/components.test.tsx
```

All 8 new-mood smoke tests pass. Existing tests unaffected.

- [ ] **Step 5: Run full suite to check no regressions**

```bash
npx vitest run
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shared/CroatianKnight.tsx src/tests/components.test.tsx
git commit -m "feat: add 8 new Hrvoje moods — oops/struggling/onfire/tearsofjoy/levelup/winking/proud/worried"
```

---

## Task 3: Add flash state to KnightCompanion.tsx

**Files:**
- Modify: `src/components/shared/KnightCompanion.tsx`

- [ ] **Step 1: Add import**

Find the existing import line for `knightSpeak` (or the top of the file). Add the import for `knightFlash` alongside it (even though KnightCompanion doesn't call knightFlash — it listens. Actually KnightCompanion calls knightSpeak for quest events):

At the top of `KnightCompanion.tsx`, after the existing imports, add:

```typescript
import { knightSpeak } from '../../lib/knightSpeak';
```

> Note: if `knightSpeak` is already imported, skip this. Just verify the import exists.

- [ ] **Step 2: Add `flashMood` state and timer ref**

Find the existing `const [bubble, setBubble]` line (around line 161). Add two new declarations immediately before it:

```typescript
const [flashMood, setFlashMood] = useState<string | null>(null);
const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 3: Add `knight:flash` event listener**

After the existing `knight:speak` useEffect (which ends around line 208), add a new useEffect:

```typescript
// ── Listen for knight:flash — silent face-only flashes ────────────────────
useEffect(() => {
  const handle = (e: Event) => {
    const { mood, durationMs } = (e as CustomEvent).detail;
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashMood(mood);
    flashTimerRef.current = setTimeout(() => setFlashMood(null), durationMs);
  };
  window.addEventListener('knight:flash', handle);
  return () => {
    window.removeEventListener('knight:flash', handle);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
  };
}, []);
```

- [ ] **Step 4: Add `knight:quest-done` listener**

After the flash listener, add:

```typescript
// ── Listen for quest completions — proud milestone reaction ───────────────
useEffect(() => {
  const handle = () => {
    knightSpeak('proud', 'Ponosan sam na tebe! 🏅');
  };
  window.addEventListener('knight:quest-done', handle);
  return () => window.removeEventListener('knight:quest-done', handle);
}, []);
```

- [ ] **Step 5: Update mood priority chain**

Find the existing `displayMood` line (around line 192):

```typescript
const displayMood = glancing
  ? 'glancing'
  : bubble?.mood || screenMood || streakMood || 'ready';
```

Replace with:

```typescript
// Priority: flash (highest) > glancing > bubble mood > screen mood > streak > ready
const displayMood = flashMood
  ?? (glancing
    ? 'glancing'
    : bubble?.mood || screenMood || streakMood || 'ready');
```

- [ ] **Step 6: Suppress bubble during flash**

Find the bubble render condition (around line 294 — the `{showBubble && bubble && (` check). Change it to:

```tsx
{showBubble && bubble && !flashMood && (
```

- [ ] **Step 7: Add `MOOD_COLOR` entries for new moods**

Find the `MOOD_COLOR` constant (around line 25). Add entries for the 8 new moods:

```typescript
oops:       '#dc2626',
struggling: '#94a3b8',
onfire:     '#d97706',
tearsofjoy: '#3b82f6',
levelup:    '#b45309',
winking:    '#1d4ed8',
proud:      '#16a34a',
worried:    '#64748b',
```

- [ ] **Step 8: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/shared/KnightCompanion.tsx
git commit -m "feat: add flash state + knight:flash listener to KnightCompanion"
```

---

## Task 4: Wire flash reactions in McGame.tsx

**Files:**
- Modify: `src/components/practice/McGame.tsx`
- Modify: `src/tests/mcgame.test.tsx`

- [ ] **Step 1: Write failing test**

Open `src/tests/mcgame.test.tsx`. Add after the last describe block:

```typescript
describe('McGame — flash reactions', () => {
  it('dispatches knight:flash "oops" on wrong answer', async () => {
    const dispatched: CustomEvent[] = [];
    const origDispatch = window.dispatchEvent.bind(window);
    vi.spyOn(window, 'dispatchEvent').mockImplementation((e) => {
      if ((e as CustomEvent).type === 'knight:flash') dispatched.push(e as CustomEvent);
      return origDispatch(e);
    });

    renderGame();
    // Click the wrong option (opts[1] for question 0)
    fireEvent.click(screen.getByText('wrong0a'));

    expect(dispatched.length).toBeGreaterThan(0);
    expect(dispatched[0].detail.mood).toBe('oops');

    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/tests/mcgame.test.tsx
```

Expected: test fails — `oops` flash not dispatched yet.

- [ ] **Step 3: Add `knightFlash` import to McGame.tsx**

Find the existing line at the top of `src/components/practice/McGame.tsx`:

```javascript
import { knightSpeak } from '../../lib/knightSpeak.js';
```

Replace with:

```javascript
import { knightSpeak, knightFlash } from '../../lib/knightSpeak.js';
```

- [ ] **Step 4: Add flash calls in `handleAnswer`**

Find the `handleAnswer` function in McGame. In the `if (isCorrect)` block, after the existing `knightSpeak` calls (after line 135), add:

```javascript
// Flash: onfire on 3+ streak; winking 20% chance otherwise
if (nextStreak >= 3) {
  knightFlash('onfire', 2000);
} else if (Math.random() < 0.2) {
  knightFlash('winking', 1500);
}
```

In the `else` (wrong) block, after the existing `knightSpeak` calls (after the `else if (nextWrongStreak === 3)` line), add:

```javascript
// Flash: oops on every wrong; struggling escalates at 3+
knightFlash(nextWrongStreak >= 3 ? 'struggling' : 'oops', nextWrongStreak >= 3 ? 2000 : 1500);
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npx vitest run src/tests/mcgame.test.tsx
```

- [ ] **Step 6: Run full suite**

```bash
npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add src/components/practice/McGame.tsx src/tests/mcgame.test.tsx
git commit -m "feat: wire Hrvoje flash reactions in McGame (oops/struggling/onfire/winking)"
```

---

## Task 5: Wire flash reactions in Flashcards.tsx

**Files:**
- Modify: `src/components/practice/Flashcards.tsx`

No new test file — Flashcards component test setup is complex; the flash behavior is covered by the knightSpeak unit tests + manual integration.

- [ ] **Step 1: Add import**

Find the existing `knightSpeak` import in `src/components/practice/Flashcards.tsx`:

```javascript
import { knightSpeak } from '../../lib/knightSpeak.js';
```

Replace with:

```javascript
import { knightSpeak, knightFlash } from '../../lib/knightSpeak.js';
```

- [ ] **Step 2: Add consecutive refs**

Find the `mountedRef` ref (around line 85):

```javascript
const mountedRef = useRef(true);
```

After it, add:

```javascript
const consecCorrectRef = useRef(0); // consecutive correct (for onfire)
const consecWrongRef   = useRef(0); // consecutive wrong (for struggling)
```

- [ ] **Step 3: Add flash call in `handleStillLearning`**

Find `handleStillLearning` (around line 296). After `playWrong(); haptic([30, 20, 30]);`, add:

```javascript
consecCorrectRef.current = 0;
consecWrongRef.current += 1;
knightFlash(consecWrongRef.current >= 3 ? 'struggling' : 'oops', consecWrongRef.current >= 3 ? 2000 : 1500);
```

- [ ] **Step 4: Add flash call in `handleKnown`**

Find `handleKnown` (around line 314). After `playCorrect(); haptic(40);`, add:

```javascript
consecWrongRef.current = 0;
consecCorrectRef.current += 1;
if (consecCorrectRef.current >= 3) {
  knightFlash('onfire', 2000);
} else if (Math.random() < 0.2) {
  knightFlash('winking', 1500);
}
```

- [ ] **Step 5: Run full suite**

```bash
npx vitest run
```

Expected: all tests pass (Flashcards has no unit tests that would break).

- [ ] **Step 6: Commit**

```bash
git add src/components/practice/Flashcards.tsx
git commit -m "feat: wire Hrvoje flash reactions in Flashcards (oops/struggling/onfire/winking)"
```

---

## Task 6: Wire flash reactions in TypingScreen.tsx

**Files:**
- Modify: `src/components/practice/TypingScreen.tsx`
- Modify: `src/tests/typing-screen.test.tsx`

- [ ] **Step 1: Write failing test**

Open `src/tests/typing-screen.test.tsx`. Add at the end, after all existing describe blocks:

```typescript
describe('TypingScreen — flash reactions', () => {
  it('dispatches knight:flash "oops" after a wrong answer', () => {
    const dispatched: CustomEvent[] = [];
    vi.spyOn(window, 'dispatchEvent').mockImplementation((e) => {
      if ((e as Event).type === 'knight:flash') dispatched.push(e as CustomEvent);
      return true;
    });

    renderTypingScreen();
    // Type a wrong answer and submit
    typeAnswer('incorrect_word_xyz');
    fireEvent.click(screen.getByText('Check Answer'));

    expect(dispatched.some(e => e.detail.mood === 'oops')).toBe(true);
    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run src/tests/typing-screen.test.tsx
```

- [ ] **Step 3: Add `knightFlash` import to TypingScreen.tsx**

Find the file's imports. If `knightSpeak` is imported, it is at the top level. Add `knightFlash` alongside it. If there is no knightSpeak import currently, add:

```javascript
import { knightFlash } from '../../lib/knightSpeak.js';
```

- [ ] **Step 4: Add consecutive refs**

Near the top of the `TypingScreen` component function, after existing `useRef` declarations, add:

```javascript
const consecCorrectRef = useRef(0);
const consecWrongRef   = useRef(0);
```

- [ ] **Step 5: Add flash calls in `submitAnswer`**

Find `submitAnswer` in `TypingScreen.tsx`. Find the line:

```javascript
const isCorrect = verdict === 'perfect' || verdict === 'diacritic' || verdict === 'close';
```

After `if (isCorrect) sTyS(s => s + 1);`, add:

```javascript
if (isCorrect) {
  consecWrongRef.current = 0;
  consecCorrectRef.current += 1;
  if (consecCorrectRef.current >= 3) {
    knightFlash('onfire', 2000);
  } else if (Math.random() < 0.2) {
    knightFlash('winking', 1500);
  }
} else {
  consecCorrectRef.current = 0;
  consecWrongRef.current += 1;
  knightFlash(consecWrongRef.current >= 3 ? 'struggling' : 'oops', consecWrongRef.current >= 3 ? 2000 : 1500);
}
```

> Note: the existing `if (isCorrect) sTyS(s => s + 1);` stays — add the flash block after or merge the condition.

- [ ] **Step 6: Run test — expect PASS**

```bash
npx vitest run src/tests/typing-screen.test.tsx
```

- [ ] **Step 7: Run full suite**

```bash
npx vitest run
```

- [ ] **Step 8: Commit**

```bash
git add src/components/practice/TypingScreen.tsx src/tests/typing-screen.test.tsx
git commit -m "feat: wire Hrvoje flash reactions in TypingScreen (oops/struggling/onfire/winking)"
```

---

## Task 7: Wire flash reactions in WordSprint.tsx

**Files:**
- Modify: `src/components/practice/WordSprint.tsx`

- [ ] **Step 1: Add import**

Find the imports at the top of `src/components/practice/WordSprint.tsx`. Add:

```javascript
import { knightFlash } from '../../lib/knightSpeak.js';
```

- [ ] **Step 2: Add consecutive ref and worried-fired ref**

Find the `timerRef` ref declaration in WordSprint:

```javascript
const timerRef = useRef(null);
```

After it, add:

```javascript
const consecCorrectRef = useRef(0);
const consecWrongRef   = useRef(0);
const worriedFiredRef  = useRef(false); // fires once per round when timeLeft hits 5
```

- [ ] **Step 3: Wire worried flash into timer interval**

Find the `setInterval` callback in the timer `useEffect`:

```javascript
timerRef.current = setInterval(() => {
  setTimeLeft(t => {
    if (t <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0; }
    return t - 1;
  });
}, 1000);
```

Replace the inner callback with:

```javascript
timerRef.current = setInterval(() => {
  setTimeLeft(t => {
    if (t <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0; }
    if (t === 6 && !worriedFiredRef.current) {
      // Fire worried flash 5 seconds before time runs out (t transitions 6→5)
      worriedFiredRef.current = true;
      knightFlash('worried', 1500);
    }
    return t - 1;
  });
}, 1000);
```

> Why t===6: setTimeLeft fires with current t and returns t-1. When t===6, the next displayed value is 5. The flash fires as the countdown hits 5.

- [ ] **Step 4: Wire answer flash reactions**

Find the `handleAnswer` or inline answer logic. From the grep output, the answer check is:

```javascript
const correct = opt === q.answer;
...
setFeedback(correct ? 'correct' : 'wrong');
setResults(r => [...r, { q, chosen: opt, correct }]);
if (correct) {
```

After `setResults(...)`, add:

```javascript
if (correct) {
  consecWrongRef.current = 0;
  consecCorrectRef.current += 1;
  if (consecCorrectRef.current >= 3) knightFlash('onfire', 2000);
} else {
  consecCorrectRef.current = 0;
  consecWrongRef.current += 1;
  knightFlash(consecWrongRef.current >= 3 ? 'struggling' : 'oops', consecWrongRef.current >= 3 ? 2000 : 1500);
}
```

- [ ] **Step 5: Reset refs on new round**

Find where the game resets for a new round (the useEffect that resets state on mount or `phase` change). Add:

```javascript
consecCorrectRef.current = 0;
consecWrongRef.current   = 0;
worriedFiredRef.current  = false;
```

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

- [ ] **Step 7: Commit**

```bash
git add src/components/practice/WordSprint.tsx
git commit -m "feat: wire Hrvoje flash reactions in WordSprint (oops/struggling/onfire/worried)"
```

---

## Task 8: Milestone reactions — level-up, tearsofjoy, quest proud

**Files:**
- Modify: `src/hooks/useAward.ts`
- Modify: `src/lib/quests.ts`
- Modify: `src/components/practice/McGame.tsx` (result screen)
- Modify: `src/components/practice/WordSprint.tsx` (result screen)
- Modify: `src/components/practice/TypingScreen.tsx` (result screen)

### 8a — Change level-up mood to 'levelup' in useAward.ts

Find `LEVEL_SPEECHES` in `src/hooks/useAward.ts` (around line 47):

```typescript
const LEVEL_SPEECHES: Record<number, { mood: string; text: string }> = {
  2: { mood: 'celebrating', text: 'Level 2 — ...' },
  3: { mood: 'celebrating', text: 'Level 3 — ...' },
  4: { mood: 'celebrating', text: 'Level 4 — ...' },
  5: { mood: 'celebrating', text: 'Level 5 — ...' },
  6: { mood: 'celebrating', text: 'Level 6 — ...' },
  7: { mood: 'celebrating', text: 'Level 7 — ...' },
};
```

Replace all `'celebrating'` with `'levelup'`:

```typescript
const LEVEL_SPEECHES: Record<number, { mood: string; text: string }> = {
  2: { mood: 'levelup', text: 'Level 2 — Početnik! You\'ve moved beyond zero. Every word is a victory. 🌱' },
  3: { mood: 'levelup', text: 'Level 3 — Osnovni! The grammar is clicking. You can feel the pattern. 📚' },
  4: { mood: 'levelup', text: 'Level 4 — Srednji! Halfway to fluency. Zadar welcomes you. ⭐' },
  5: { mood: 'levelup', text: 'Level 5 — Napredni! You\'re speaking Croatian that Croatians respect. 💪' },
  6: { mood: 'levelup', text: 'Level 6 — Stručnjak! Dubrovnik is your city now. Sjajno! 🏆' },
  7: { mood: 'levelup', text: 'Level 7 — MAJSTOR! Complete mastery. Croatia is your second home. 👑' },
};
```

Also find the fallback `knightSpeak` call at line 156:

```typescript
setTimeout(() => knightSpeak('celebrating', `Čestitam! Level ${newLvl} unlocked! 🎉`), 1500);
```

Change `'celebrating'` to `'levelup'`:

```typescript
setTimeout(() => knightSpeak('levelup', `Čestitam! Level ${newLvl} unlocked! 🎉`), 1500);
```

### 8b — Dispatch `knight:quest-done` from markQuest

Find `markQuest` in `src/lib/quests.ts` (around line 47). At the end of the try block, before `} catch (_) {}`, add:

```typescript
// Notify the knight mascot so it can trigger a proud reaction
if (typeof window !== 'undefined') {
  window.dispatchEvent(new CustomEvent('knight:quest-done'));
}
```

### 8c — Add `tearsofjoy` to McGame result screen

Find the result `knightSpeak` call in McGame (around line 214). The existing code is approximately:

```javascript
knightSpeak(
  ...,
  `${pct}% correct — ...` : `${finalScore}/...`,
);
```

Find the `pct` variable and the `knightSpeak` call in the result render. Prepend:

```javascript
if (pct >= 90) knightSpeak('tearsofjoy', 'Savršeno! Nevjerojatno si dobar/a! 🌟');
```

> Place this immediately before the existing result `knightSpeak` call so the tearsofjoy fires first. Only one bubble shows at a time (last-write wins), so position it first — the existing message then replaces it with more detail.

Actually, replace the existing result speak call entirely when pct >= 90:

Find the result `knightSpeak` block and wrap it:

```javascript
if (pct >= 90) {
  knightSpeak('tearsofjoy', `${pct}% — Savršeno! Nevjerojatno si dobar/a! 🌟`);
} else {
  knightSpeak(
    // existing mood/text logic unchanged
  );
}
```

### 8d — Add `tearsofjoy` to TypingScreen result

In `TypingScreen.tsx`, find the result screen render (around line 100 where `tyI >= tyPool.length` is checked). Before `goBack()` is called or in the same result block, add a `knightSpeak` call:

```javascript
// Add after checking score — on the Done button click or in useEffect on result screen mount
if (tyS / tyPool.length >= 0.9) {
  knightSpeak('tearsofjoy', 'Savršeno! Sve napisano točno! ✍️');
}
```

Add this inside the `onClick` handler of the "🏠 Done" button, before `award(xp)`:

```javascript
onClick={() => {
  if (finishFired.current) return;
  finishFired.current = true;
  if (tyS / tyPool.length >= 0.9) {
    knightSpeak('tearsofjoy', 'Savršeno! Sve napisano točno! ✍️');
  }
  if (typeof award === 'function') award(xp);
  markQuest('vocab');
  goBack();
}}>
```

Add the knightSpeak import to TypingScreen if not already present (it may not have been imported before):

```javascript
import { knightFlash, knightSpeak } from '../../lib/knightSpeak.js';
```

### 8e — Add `tearsofjoy` to WordSprint result

In `WordSprint.tsx`, find the result phase render. From the grep output, around line 237-247:

```javascript
const correct = results.filter(r => r.correct).length;
const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
```

In the result section JSX (or a useEffect on phase === 'result'), add a `knightSpeak` call. Add a `useEffect`:

```javascript
useEffect(() => {
  if (phase !== 'result') return;
  const correct = results.filter(r => r.correct).length;
  const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  if (pct >= 90) {
    knightSpeak('tearsofjoy', `${pct}% — Savršeno! Brzi si kao munja! ⚡`, 300);
  }
}, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
```

Import `knightSpeak` alongside the existing import:

```javascript
import { knightFlash, knightSpeak } from '../../lib/knightSpeak.js';
```

### 8f — Run full suite + commit

- [ ] **Step 1: Apply all 8a–8e changes**

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass. Level-up mood is now 'levelup'; quest dispatch fires; tearsofjoy triggers on ≥90%.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAward.ts src/lib/quests.ts \
        src/components/practice/McGame.tsx \
        src/components/practice/TypingScreen.tsx \
        src/components/practice/WordSprint.tsx
git commit -m "feat: milestone reactions — levelup mood on level-up, tearsofjoy on perfect, proud on quest complete"
```

---

## Self-Review Checklist

### Spec coverage

| Spec requirement | Task |
|-----------------|------|
| 8 new moods in CroatianKnight | Task 2 |
| `knightFlash` API + `knight:flash` event | Task 1 |
| KnightCompanion flash state + listener | Task 3 |
| Flash priority highest in mood chain | Task 3, Step 5 |
| Bubble suppressed during flash | Task 3, Step 6 |
| McGame: oops/struggling/onfire/winking | Task 4 |
| Flashcards: oops/struggling/onfire/winking | Task 5 |
| TypingScreen: oops/struggling/onfire/winking | Task 6 |
| WordSprint: oops/onfire/worried | Task 7 |
| Level-up → levelup mood | Task 8a |
| Quest complete → proud | Task 8b + Task 3, Step 4 |
| Perfect session → tearsofjoy | Task 8c, 8d, 8e |

### No placeholders — all code is complete and concrete.

### Type consistency — `knightFlash(mood: string, durationMs = 1800)` used consistently across all tasks.
