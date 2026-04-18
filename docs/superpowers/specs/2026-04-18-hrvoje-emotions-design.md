# Vitez Hrvoje — Hyper-Expressive Emotions

**Date**: 2026-04-18  
**Feature**: Option A — 8 new moods + split silent/bubble reaction system  
**Status**: Approved, pending implementation

---

## Background

Vitez Hrvoje is the Croatian knight mascot rendered in `CroatianKnight.tsx`. He currently has 10 moods: happy, thinking, celebrating, victory, sad, encouraged, ready, marching, glancing, neutral. The reaction system uses a single `knightSpeak(mood, text, delay?)` function that always shows a speech bubble.

The goal is to make Hrvoje feel alive and reactive across all major practice screens — celebrating streaks, commiserating on mistakes, and marking milestones — without being intrusive.

---

## New Moods (8 total)

All rendered purely with SVG paths + CSS inside `getMoodExpression()` in `CroatianKnight.tsx`. No Framer Motion (Android WebView compatibility rule). Each gets a `MOOD_GLOW` entry and any required new CSS keyframes.

| Mood key | Eyes | Mouth | Brow | Extra |
|----------|------|-------|------|-------|
| `oops` | Wide round O (surprised) | Small open O | Both raised flat | Pink blush dots on cheeks |
| `struggling` | Squinted / half-closed | Wavy uncertain line | Furrowed diagonal | Single sweat bead |
| `onfire` | Determined narrow squint | Big wide grin | Excited V-shape | Amber `MOOD_GLOW` + `knight-flicker` keyframe |
| `tearsofjoy` | Happy crescents (eyes shut) | Big smile | Relaxed | Two tear drops + gold shimmer |
| `levelup` | Star-shaped pupils | Wide open grin | Raised high | Pulsing gold ring via `knight-levelup-ring` keyframe |
| `winking` | Right eye closed, left open | Sly smirk | Normal asymmetric | — |
| `proud` | Slightly lidded, content | Warm closed smile | Gently raised | Subtle body scale 1.02 (CSS transform) |
| `worried` | Normal, pupils shifted down | Slight downward curve | Furrowed center | Sweat bead |

### New CSS keyframes

```css
@keyframes knight-flicker {
  0%, 100% { filter: drop-shadow(0 0 8px #f59e0b); }
  50%       { filter: drop-shadow(0 0 18px #fbbf24); }
}

@keyframes knight-levelup-ring {
  0%   { transform: scale(1);   opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
```

---

## API Layer

### `src/lib/knightSpeak.ts`

One new export added. Existing `knightSpeak` is unchanged.

```typescript
/** Existing — unchanged */
export function knightSpeak(mood: string, text: string, delay = 0): void {
  const fire = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('knight:speak', { detail: { mood, text } }));
  };
  if (delay > 0) setTimeout(fire, delay);
  else fire();
}

/**
 * Trigger a silent face-only flash — no speech bubble.
 * The knight's face switches to `mood` for `durationMs` ms then reverts.
 * If called while a flash is already showing, the new flash replaces it.
 */
export function knightFlash(mood: string, durationMs = 1800): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('knight:flash', { detail: { mood, durationMs } })
  );
}
```

**Default durations by mood:**

| Mood | Duration |
|------|----------|
| `oops`, `winking`, `worried` | 1,500ms |
| `struggling`, `onfire` | 2,000ms |

Callsites pass the duration explicitly to match their mood.

---

## KnightCompanion Changes

### New state

```typescript
const [flashMood, setFlashMood] = useState<string | null>(null);
const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### New event listener (alongside existing `knight:speak` listener)

```typescript
useEffect(() => {
  const handle = (e: Event) => {
    const { mood, durationMs } = (e as CustomEvent).detail;
    if (flashTimer.current) clearTimeout(flashTimer.current); // cancel prior flash
    setFlashMood(mood);
    flashTimer.current = setTimeout(() => setFlashMood(null), durationMs);
  };
  window.addEventListener('knight:flash', handle);
  return () => window.removeEventListener('knight:flash', handle);
}, []);
```

### Updated mood priority (highest → lowest)

```
flashMood → glancing → bubble.mood → screenMood → streakMood → 'ready'
```

Flash mood takes highest priority. The effective mood passed to `<CroatianKnight>` becomes:

```typescript
const activeMood = flashMood ?? (isGlancing ? 'glancing' : bubble.mood ?? screenMood ?? streakMood ?? 'ready');
```

### Bubble suppression during flash

The speech bubble renders only when `bubble.visible && !flashMood`. When the flash expires and `flashMood` returns to `null`, the bubble reappears if still within its display window.

---

## Screen Wiring

### Flash reactions (silent, face-only)

Consecutive counters tracked via `useRef` inside each component — never persisted, reset on unmount.

| Trigger | Mood | Duration | Screens |
|---------|------|----------|---------|
| Wrong answer | `oops` | 1,500ms | McGame, Flashcards, TypingScreen, SpeedChallenge |
| 3+ consecutive wrong answers | `struggling` | 2,000ms | McGame, Flashcards, TypingScreen |
| 3+ consecutive correct answers | `onfire` | 2,000ms | McGame, Flashcards, SpeedChallenge |
| Correct answer (20% random) | `winking` | 1,500ms | McGame, TypingScreen |
| Last 5 seconds on timer | `worried` | 1,500ms | SpeedChallenge, TypingScreen |

**Implementation pattern** (same in all screens):

```typescript
const consecutiveRef = useRef(0);

// On wrong answer:
consecutiveRef.current = 0;
knightFlash('oops', 1500);

// On correct answer:
consecutiveRef.current += 1;
if (consecutiveRef.current >= 3) knightFlash('onfire', 2000);
else if (Math.random() < 0.2) knightFlash('winking', 1500);
```

### Milestone reactions (with speech bubble)

| Trigger | Mood | Croatian text | Location |
|---------|------|---------------|----------|
| XP level-up | `levelup` | "Bravo! Nova razina!" | `fbAwardXP` / level-up callback |
| Session complete with ≥90% score | `tearsofjoy` | "Savršeno! Odlično radiš!" | Result screens |
| Quest / achievement unlock | `proud` | "Ponosan sam na tebe!" | QuestTracker on quest complete |

These use the existing `knightSpeak(mood, text)` — no changes needed to the speak path.

---

## Error Handling

- **Flash overlap**: `clearTimeout(flashTimer.current)` before each new flash prevents double-revert
- **Rapid-fire flashes**: Last flash wins — timer resets, mood overrides
- **SSR guard**: `typeof window === 'undefined'` check in `knightFlash` (matches `knightSpeak`)
- **Missing mood**: `CroatianKnight` falls back to `'ready'` for any unrecognised mood key — new moods must be added before wiring callsites

---

## Testing

- **Unit**: `knightFlash` dispatches `knight:flash` with correct `{ mood, durationMs }` detail
- **Component**: KnightCompanion renders `flashMood` on flash event; reverts to `null` after timer; clears prior timer on second flash
- **Integration**: McGame wrong answer → Hrvoje shows `oops` face → returns to base mood after 1,500ms
- **No new E2E Playwright tests**: Animation-timing tests are brittle (established by Practice tab CI incident); existing accessibility tests unaffected by this feature

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/shared/CroatianKnight.tsx` | 8 new mood expressions in `getMoodExpression()`, 8 new `MOOD_GLOW` entries, 2 new CSS keyframes |
| `src/components/shared/KnightCompanion.tsx` | `flashMood` state, `flashTimer` ref, `knight:flash` listener, updated mood priority, bubble suppression |
| `src/lib/knightSpeak.ts` | `knightFlash()` export |
| `src/components/practice/McGame.tsx` | Flash wiring (oops, struggling, onfire, winking) |
| `src/components/practice/Flashcards.tsx` | Flash wiring (oops, struggling, onfire) |
| `src/components/learn/TypingScreen.tsx` | Flash wiring (oops, struggling, winking, worried) |
| `src/components/practice/SpeedChallenge.tsx` | Flash wiring (oops, onfire, worried) |
| `src/hooks/useLevelUp.ts` *(or equivalent)* | `knightSpeak('levelup', 'Bravo! Nova razina!')` on level-up |
| Result screen component(s) | `knightSpeak('tearsofjoy', 'Savršeno! …')` on ≥90% |
| `src/components/practice/QuestTracker.tsx` | `knightSpeak('proud', 'Ponosan sam na tebe!')` on quest complete |
