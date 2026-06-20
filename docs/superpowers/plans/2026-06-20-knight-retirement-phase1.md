# Knight Retirement — Phase 1 (Coaching → prof. Kovač) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Re-render the global in-exercise coaching companion (`KnightCompanion`) as prof. Kovač — a static `CharacterPortrait` whose coaching state (tip / correct / wrong / celebrate / idle) is shown via **ring colour + a corner status glyph + the speech bubble** — keeping all four `knight:*` event listeners and the bottom-left placement, and touching none of the ~20 event dispatchers.

**Architecture:** Re-presentation. A new pure `coachVisual(mood)` maps the dispatched mood string → `{ ring, glyph, klass }`. `KnightCompanion` keeps its filename, mount point (`App.tsx`), event listeners (`knight:speak`/`knight:flash`/`knight:quest-done`/`knight:celebrate`), bubble, celebrate burst, tap-message, native-safe path, and hidden-on-home logic — but renders Kovač + ring + glyph instead of `CroatianKnight`, and drops the knight-only facial plumbing (`SCREEN_MOOD_MAP`, `getStreakMood`, the 30s idle "glancing" attention-getter).

**Tech Stack:** React 18 + TS; Framer Motion (web) + `_isNative` plain-element fallback; `CharacterPortrait` (locked cast); Vitest + @testing-library/react.

## Global Constraints
- Locked flat cast: render `CharacterPortrait name="kovac"`. Static portrait — no facial moods; state via ring + glyph + bubble.
- Do NOT touch `src/lib/knightSpeak.ts` or any dispatcher; internal `knight:*` event names stay.
- Preserve the `_isNative` plain-element path (Capacitor Framer-Motion opacity bug).
- WCAG AA: white glyph on saturated ring fills (✓/✗/💭/★) — fills are `#15803d`/`#991b1b`/`#5b21b6`/`#C8980A`, all ≥4.5:1 vs white.
- Branch `feat/uxui-knight-retirement-phase1` (spec already committed there). ASCII commits + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Never push to master.
- `CroatianKnight.tsx` is NOT deleted in Phase 1 (still used by ~19 other sites until Phases 3–4); this task only stops `KnightCompanion` from importing it.

## File Structure
- `src/components/shared/coachVisual.ts` — **new.** Pure `coachVisual(mood)` + types. No React.
- `src/components/shared/coachVisual.test.ts` — **new.** Mapping unit gate.
- `src/components/shared/KnightCompanion.tsx` — **rewrite** the render layer (Kovač + ring + glyph); keep listeners/bubble/burst/tap/native/home logic.
- `src/components/shared/KnightCompanion.test.tsx` — **new.** Component tests.
- `e2e/accessibility.spec.js` — **modify** one stale comment (line ~337).

---

## Task 1: `coachVisual` mapping + unit gate

**Files:**
- Create: `src/components/shared/coachVisual.ts`
- Test: `src/components/shared/coachVisual.test.ts`

**Interfaces:**
- Produces: `type CoachClass = 'positive' | 'negative' | 'thinking' | 'idle'`; `interface CoachVisual { ring: string; glyph: string | null; klass: CoachClass }`; `function coachVisual(mood: string): CoachVisual`.
- `ring` is a CSS `linear-gradient(...)` string; `glyph` is a single char or null.

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/coachVisual.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { coachVisual } from './coachVisual';

const POSITIVE = ['encouraged', 'proud', 'happy', 'winking'];
const GOLD = ['celebrating', 'victory', 'levelup', 'onfire', 'tearsofjoy'];
const NEGATIVE = ['oops', 'sad', 'struggling', 'worried', 'droop'];

describe('coachVisual', () => {
  it('maps positive moods to a green ring + check glyph', () => {
    for (const m of POSITIVE) {
      const v = coachVisual(m);
      expect(v.klass).toBe('positive');
      expect(v.glyph).toBe('✓');
      expect(v.ring).toContain('linear-gradient');
    }
  });

  it('maps celebratory moods to a gold ring + star glyph', () => {
    for (const m of GOLD) {
      const v = coachVisual(m);
      expect(v.klass).toBe('positive');
      expect(v.glyph).toBe('★');
      expect(v.ring).toContain('#C8980A');
    }
  });

  it('maps negative moods to a red ring + cross glyph', () => {
    for (const m of NEGATIVE) {
      const v = coachVisual(m);
      expect(v.klass).toBe('negative');
      expect(v.glyph).toBe('✗');
    }
  });

  it('maps thinking to a purple ring + thought glyph', () => {
    const v = coachVisual('thinking');
    expect(v.klass).toBe('thinking');
    expect(v.glyph).toBe('💭');
  });

  it('maps idle/neutral and unknown moods to a teal ring + no glyph', () => {
    for (const m of ['ready', 'neutral', 'marching', 'glancing', 'totally-unknown', '']) {
      const v = coachVisual(m);
      expect(v.klass).toBe('idle');
      expect(v.glyph).toBeNull();
      expect(v.ring).toContain('#0e7490');
    }
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test -- src/components/shared/coachVisual.test.ts`
Expected: FAIL — `Cannot find module './coachVisual'`.

- [ ] **Step 3: Implement `coachVisual.ts`**

```ts
// Maps a coaching "mood" (dispatched via knight:speak / knight:flash) to the
// visual treatment of the Kovač coaching companion. The portrait is static, so
// state is shown by RING colour + a corner GLYPH, not a facial expression.
export type CoachClass = 'positive' | 'negative' | 'thinking' | 'idle';

export interface CoachVisual {
  ring: string; // CSS linear-gradient
  glyph: string | null; // corner status glyph, or null when idle
  klass: CoachClass;
}

const GOLD = new Set(['celebrating', 'victory', 'levelup', 'onfire', 'tearsofjoy']);
const POSITIVE = new Set(['encouraged', 'proud', 'happy', 'winking']);
const NEGATIVE = new Set(['oops', 'sad', 'struggling', 'worried', 'droop']);

const RING = {
  teal: 'linear-gradient(135deg,#0e7490,#164e63)',
  green: 'linear-gradient(135deg,#16a34a,#15803d)',
  gold: 'linear-gradient(135deg,#FFE070,#C8980A)',
  red: 'linear-gradient(135deg,#dc2626,#991b1b)',
  purple: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
};

export function coachVisual(mood: string): CoachVisual {
  if (GOLD.has(mood)) return { ring: RING.gold, glyph: '★', klass: 'positive' };
  if (POSITIVE.has(mood)) return { ring: RING.green, glyph: '✓', klass: 'positive' };
  if (NEGATIVE.has(mood)) return { ring: RING.red, glyph: '✗', klass: 'negative' };
  if (mood === 'thinking') return { ring: RING.purple, glyph: '💭', klass: 'thinking' };
  return { ring: RING.teal, glyph: null, klass: 'idle' };
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `npm run test -- src/components/shared/coachVisual.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/coachVisual.ts src/components/shared/coachVisual.test.ts
git commit -m "feat(coach): coachVisual mood->ring+glyph mapping

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Re-render `KnightCompanion` as prof. Kovač

**Files:**
- Rewrite: `src/components/shared/KnightCompanion.tsx`
- Test: `src/components/shared/KnightCompanion.test.tsx`

**Interfaces:**
- Consumes: `coachVisual` from `./coachVisual`; `CharacterPortrait` from `../family/CharacterPortrait`; `useApp` (for `currentScreen`); `knightSpeak` from `../../lib/knightSpeak`.
- Produces: default-export `KnightCompanion()` — unchanged signature/mount. Root testid `data-testid="coach-companion"`; portrait `data-testid="portrait-kovac"`; glyph `data-testid="coach-glyph"`.

- [ ] **Step 1: Write the failing test**

Create `src/components/shared/KnightCompanion.test.tsx`:

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// useApp drives currentScreen (controls hidden-on-home). Mock it per test.
let mockScreen = 'lesson';
vi.mock('../../context/AppContext', () => ({ useApp: () => ({ currentScreen: mockScreen }) }));
vi.mock('../../data', () => ({ getStreak: () => ({ count: 0 }) }));

import KnightCompanion from './KnightCompanion';

describe('KnightCompanion (prof. Kovač coaching companion)', () => {
  beforeEach(() => {
    mockScreen = 'lesson';
    localStorage.clear();
  });

  it('renders the Kovač portrait button on a non-home screen', () => {
    render(<KnightCompanion />);
    expect(screen.getByTestId('coach-companion')).toBeInTheDocument();
    expect(screen.getByTestId('portrait-kovac')).toBeInTheDocument();
  });

  it('renders nothing on the home/dashboard screen', () => {
    mockScreen = 'dashboard';
    const { container } = render(<KnightCompanion />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a speech bubble with the prof. Kovač label on knight:speak', () => {
    render(<KnightCompanion />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent('knight:speak', { detail: { mood: 'thinking', text: 'Pazi na padež!' } }),
      );
    });
    expect(screen.getByText('Pazi na padež!')).toBeInTheDocument();
    expect(screen.getByText(/prof\. Kovač/i)).toBeInTheDocument();
  });

  it('shows the ✗ glyph on a negative knight:flash and ✓ on a positive one', () => {
    render(<KnightCompanion />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent('knight:flash', { detail: { mood: 'oops', durationMs: 1800 } }),
      );
    });
    expect(screen.getByTestId('coach-glyph')).toHaveTextContent('✗');
    act(() => {
      window.dispatchEvent(
        new CustomEvent('knight:flash', { detail: { mood: 'encouraged', durationMs: 1800 } }),
      );
    });
    expect(screen.getByTestId('coach-glyph')).toHaveTextContent('✓');
  });

  it('shows a tutor message bubble on tap', () => {
    render(<KnightCompanion />);
    fireEvent.click(screen.getByRole('button', { name: /prof\. Kovač/i }));
    // a bubble appears (the tap pool text contains an em dash / tutor phrasing)
    expect(screen.getByText(/prof\. Kovač/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

Run: `npm run test -- src/components/shared/KnightCompanion.test.tsx`
Expected: FAIL (current component renders `CroatianKnight`, no `coach-companion`/`coach-glyph` testids, no "prof. Kovač" label).

- [ ] **Step 3: Rewrite `KnightCompanion.tsx`**

Replace the ENTIRE file with:

```tsx
/**
 * KnightCompanion — global in-exercise coaching companion for non-home screens.
 *
 * Despite the legacy filename, it renders prof. Kovač (host-family tutor), not
 * the retired knight. Mounted once in App.tsx. On home it returns null (the home
 * greeter owns that screen). Elsewhere it shows a fixed bottom-left mini portrait
 * and listens for the coaching events:
 *   - knight:speak  → speech bubble (mood drives ring colour + glyph)
 *   - knight:flash  → silent ring colour + corner glyph for durationMs
 *   - knight:quest-done → a proud bubble
 *   - knight:celebrate  → particle burst
 * The static portrait can't emote, so state is shown via ring + glyph + bubble
 * (see coachVisual). The internal knight:* event names are intentionally kept —
 * the ~20 dispatchers are unchanged.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterPortrait from '../family/CharacterPortrait';
import { useApp } from '../../context/AppContext';
import { dbgInfo } from '../../lib/debugLog';
import { knightSpeak } from '../../lib/knightSpeak';
import { coachVisual } from './coachVisual';

// On Android WebView (Capacitor), Framer Motion entry animations with opacity:0
// can stall permanently. Skip entry animation on native.
const _isNative =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  !window.location.port;

// Messages shown when the user taps the companion — prof. Kovač's tutor voice.
const TAP_POOL: { mood: string; text: string }[] = [
  { mood: 'encouraged', text: 'Polako, ali sigurno — slowly but surely. Solid progress. 💪' },
  { mood: 'happy', text: 'Svaki dan po malo — a little every day. Fluency is an accumulation. 🔥' },
  { mood: 'thinking', text: 'Croatian is perfectly phonetic — every letter, one sound, always. 📐' },
  {
    mood: 'proud',
    text: '„Koliko jezika znaš, toliko vrijediš." The more languages you know, the more you are worth. 🇭🇷',
  },
  { mood: 'encouraged', text: 'Greške su dio učenja — mistakes are part of learning. Keep going. ✍️' },
];

// ─── Celebration particle burst ───────────────────────────────────────────────
const PARTY_COLORS = ['#CC0022', '#F4F0E2', '#D4A400', '#EE3042', '#FFDC3C'];
interface Particle {
  id: number;
  angle: number;
  dist: number;
  color: string;
  size: number;
}
function CelebrationBurst({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => {
    if (!active) return;
    setRunKey((k) => k + 1);
    setParticles(
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        angle: (i / 10) * 360 + (i * 7 - 12),
        dist: 34 + (i % 4) * 6,
        color: PARTY_COLORS[i % PARTY_COLORS.length] ?? '#CC0022',
        size: 5 + (i % 3) * 2,
      })),
    );
  }, [active]);
  if (!particles.length) return null;
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 5 }}>
      {particles.map((p) => (
        <motion.div
          key={`${runKey}-${p.id}`}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
            y: Math.sin((p.angle * Math.PI) / 180) * p.dist - 8,
            scale: 0,
            opacity: 0,
          }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: p.id * 0.04 }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
        />
      ))}
    </div>
  );
}

let _tapIdx = 0; // rotates through TAP_POOL across renders

export default function KnightCompanion() {
  const { currentScreen } = useApp();

  const [flashMood, setFlashMood] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bubble, setBubble] = useState<{ mood: string; text: string } | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [celebBurst, setCelebBurst] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHome =
    !currentScreen ||
    currentScreen === 'dashboard' ||
    currentScreen === 'welcome' ||
    currentScreen === 'placement' ||
    currentScreen === 'new-placement';

  // knight:speak → bubble (text + mood)
  useEffect(() => {
    const handler = (e: Event) => {
      const d = ((e as CustomEvent).detail || {}) as { mood?: string; text?: string };
      setBubble({ mood: d.mood || 'happy', text: d.text || 'Sjajno!' });
      setShowBubble(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowBubble(false), 4000);
    };
    window.addEventListener('knight:speak', handler);
    return () => {
      window.removeEventListener('knight:speak', handler);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // knight:flash → silent ring + glyph for durationMs
  useEffect(() => {
    const handle = (e: Event) => {
      const { mood, durationMs } = (e as CustomEvent).detail as { mood: string; durationMs: number };
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

  // knight:quest-done → proud bubble
  useEffect(() => {
    const handle = () => knightSpeak('proud', 'Ponosan sam na tebe! 🏅');
    window.addEventListener('knight:quest-done', handle);
    return () => window.removeEventListener('knight:quest-done', handle);
  }, []);

  // knight:celebrate → particle burst
  useEffect(() => {
    const onCelebrate = () => {
      setCelebBurst(false);
      requestAnimationFrame(() => setCelebBurst(true));
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => window.removeEventListener('knight:celebrate', onCelebrate);
  }, []);

  dbgInfo(`[Coach] render | screen="${currentScreen}" isHome=${isHome} flash="${flashMood}"`);

  if (isHome) return null;

  // Priority: flash (silent feedback) > active bubble mood > idle.
  const displayMood = flashMood ?? bubble?.mood ?? 'ready';
  const cv = coachVisual(displayMood);
  const glyphVisible = flashMood !== null || (showBubble && bubble !== null);
  const glyph = glyphVisible ? cv.glyph : null;

  const handleTap = () => {
    const msg = TAP_POOL[_tapIdx % TAP_POOL.length] ?? TAP_POOL[0]!;
    _tapIdx++;
    setBubble(msg);
    setShowBubble(true);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowBubble(false);
      setBubble(null);
    }, 3800);
  };

  const ringBtnStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
    left: 14,
    width: 70,
    height: 70,
    borderRadius: '50%',
    background: cv.ring,
    padding: 4,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9500,
    boxShadow: '0 4px 18px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.10)',
    transition: 'background .3s ease',
  };
  const innerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    background: '#fbf6ec',
    border: '2px solid rgba(255,255,255,.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const glyphStyle: React.CSSProperties = {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 900,
    color: '#fff',
    border: '2.5px solid #fff',
    boxShadow: '0 2px 6px rgba(0,0,0,.25)',
    background:
      cv.klass === 'negative'
        ? '#dc2626'
        : cv.klass === 'thinking'
          ? '#7c3aed'
          : glyph === '★'
            ? '#C8980A'
            : '#16a34a',
  };

  const buttonInner = (
    <>
      <span style={innerStyle}>
        <CharacterPortrait name="kovac" title="prof. Kovač" size={58} />
      </span>
      {glyph && (
        <span data-testid="coach-glyph" style={glyphStyle}>
          {glyph}
        </span>
      )}
      <CelebrationBurst active={celebBurst} />
    </>
  );

  return (
    <div data-testid="coach-companion">
      {/* speech bubble */}
      <AnimatePresence>
        {showBubble && bubble && !flashMood && (
          <motion.div
            key="coach-bubble"
            initial={_isNative ? false : { opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={_isNative ? {} : { opacity: 0, y: 6, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              position: 'fixed',
              bottom: 'calc(152px + env(safe-area-inset-bottom, 0px))',
              left: 14,
              zIndex: 9501,
              maxWidth: 230,
              cursor: 'pointer',
            }}
            onClick={() => setShowBubble(false)}
          >
            <div
              style={{
                position: 'relative',
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: 14,
                padding: '10px 13px 9px',
                boxShadow: '0 6px 24px rgba(0,0,0,.16)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: '#7c3aed',
                  marginBottom: 4,
                }}
              >
                prof. Kovač
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--subtext)', lineHeight: 1.58, fontWeight: 500 }}>
                {bubble.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mini portrait button */}
      {_isNative ? (
        <button
          onClick={handleTap}
          aria-label="prof. Kovač, your Croatian coach"
          title="prof. Kovač — tap for a tip"
          style={ringBtnStyle}
        >
          {buttonInner}
        </button>
      ) : (
        <motion.button
          onClick={handleTap}
          aria-label="prof. Kovač, your Croatian coach"
          title="prof. Kovač — tap for a tip"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ x: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          style={ringBtnStyle}
        >
          {buttonInner}
        </motion.button>
      )}
    </div>
  );
}
```

> Source-character note: type the real diacritics (`Kovač`, `padež`, `Greške`, `učenja`, `„…"`) in the `.tsx`; they are correct UTF-8 there. This plan file keeps prose ASCII only in commit messages.

- [ ] **Step 4: Run test — verify it passes**

Run: `npm run test -- src/components/shared/KnightCompanion.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck` → clean (no `CroatianKnight`/`getStreak`/`SCREEN_MOOD_MAP` dangling refs).
Run: `npx eslint src/components/shared/KnightCompanion.tsx src/components/shared/coachVisual.ts` → clean (no unused imports — `getStreak`, `CroatianKnight` removed).

- [ ] **Step 6: Confirm no other importer breaks**

Run: `grep -rn "KnightCompanion" src --include=*.ts --include=*.tsx | grep -v "KnightCompanion.tsx\|KnightCompanion.test.tsx"`
Expected: only `App.tsx` (the mount) — unchanged, still valid.

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/KnightCompanion.tsx src/components/shared/KnightCompanion.test.tsx
git commit -m "feat(coach): render the in-exercise companion as prof. Kovac

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: E2E reconciliation

**Files:**
- Modify: `e2e/accessibility.spec.js` (~line 337, stale comment)

**Context:** No GATED e2e asserts the knight companion. `accessibility.spec.js:337` has a comment referencing the knight's `kn-breathe`/`kn-aura-pulse` CSS animations (gone now). The `heavy-user-*.spec.js` "Knight mascot visible" checks are `testIgnore`d (not in CI) AND soft (`if/else info`) AND match on `Bok|Dobrodošli` too — they will be cleaned up in Phase 4's text sweep, not here.

- [ ] **Step 1: Update the stale comment**

In `e2e/accessibility.spec.js` around line 337, replace the comment that references `kn-breathe 3.4s infinite` + `kn-aura-pulse 2.4s infinite` with one describing the coaching companion's portrait + ring (no knight SVG animations). Read the surrounding lines first; change only the comment text, not the assertion logic.

- [ ] **Step 2: Build, then run the gated specs that touch non-home chrome**

Run: `npm run build`
Run: `npx playwright test e2e/accessibility.spec.js e2e/navigation.spec.js --project="Desktop Chrome"`
Expected: PASS (the companion still renders a focusable labelled button; axe sees a labelled control with adequate contrast).

- [ ] **Step 3: Commit**

```bash
git add e2e/accessibility.spec.js
git commit -m "test(coach): refresh stale knight-animation comment in a11y spec

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final verification (before PR)
- [ ] `npm run test` → full unit suite green (new coachVisual + KnightCompanion specs; nothing else imported the removed knight-only helpers).
- [ ] `npm run typecheck` + `npm run lint` → clean.
- [ ] `npm run build` → succeeds.
- [ ] `npx playwright test --project="Desktop Chrome"` (or at least accessibility/navigation/home/error-boundary) → green; space out reruns (CI cancels in-progress E2E on rapid pushes).
- [ ] Manual sanity (dev server): on a lesson screen the bottom-left shows Kovač; a wrong answer flashes a red ring + ✗; a correct answer green + ✓; a tip shows a bubble labelled "prof. Kovač"; home shows no companion.
- [ ] PR `feat/uxui-knight-retirement-phase1` → `master`; one code-reviewer pass; merge on your authorization (= prod deploy). Phase 1 only — `CroatianKnight` remains for Phases 2–4.

## Self-Review (against the spec)
- Coaching renderer → Kovač, state via ring+glyph+bubble, no facial moods → Tasks 1–2. ✓
- All 4 `knight:*` listeners preserved; dispatchers/`knightSpeak.ts` untouched; internal event names kept → Task 2 (listeners verbatim). ✓
- Native-safe path preserved → Task 2 (`_isNative`). ✓
- Drop SCREEN_MOOD_MAP/getStreakMood/glance → Task 2 (removed; `getStreak` import dropped). ✓
- `CroatianKnight` not deleted in Phase 1 → confirmed (only KnightCompanion stops importing it; Task 2 Step 6 checks only App.tsx mounts the companion). ✓
- WCAG glyph contrast → Global Constraints (white on #15803d/#991b1b/#5b21b6/#C8980A). ✓
- Types consistent: `coachVisual(mood) → {ring,glyph,klass}` defined in Task 1, consumed in Task 2 identically. ✓
- Testids (`coach-companion`/`coach-glyph`/`portrait-kovac`) defined in Task 2 component and asserted in its test. ✓
