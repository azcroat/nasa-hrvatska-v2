# Tabs UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate Learn, Practice, Croatia, and Profile tabs to match the design system established in the Home tab redesign — consistent heroes, section headers, card vocabulary, and typography across all four tabs.

**Architecture:** Pure layout/styling changes only — no data wiring, no logic, no new screens. Each tab gets an indigo/teal/Croatian-flag/emerald hero stripe, `section-hdr` class headers replacing ad-hoc overlines, and structural reordering to surface the most valuable content above the fold. The existing `section-hdr` / `tab-hero-body` CSS classes are already defined in `src/index.css` and must be reused rather than duplicated.

**Tech Stack:** React 18 + TypeScript (strict), Vite, inline styles + CSS classes from `src/index.css`

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/components/learn/LearnTab.tsx` | Modify | Hero added, LearnPath moved up, Browse More removed, section-hdr headers added, AI card recoloured to indigo |
| `src/components/practice/PracticeTab.tsx` | Modify | Hero replaces plain header, AI Voice moved above fold, quests/speed collapsed by default, Today's Pick section removed |
| `src/components/croatia/CroatiaTab.tsx` | Modify | Hero pills block deleted, anchor strip active colour changed to `#B80020` |
| `src/components/profile/ProfileHeader.tsx` | Modify | Avatar row consolidated, knight to corner, stats bar added, WCAG opacity fixed, emerald stripe added |
| `src/components/profile/ProfileTab.tsx` | Modify | Sync badge passed to header, standalone sync indicator removed, seg-bar replaced with icon-above-label strip |

---

## Task 1: LearnTab — Hero + Reorder LearnPath + AI Card to Indigo

**Files:**
- Modify: `src/components/learn/LearnTab.tsx` (lines 113–347)

### Context
The current LearnTab opens with a plain "🗺️ My Path" text header. The LearnPathWidget is buried after the Browse More hidden content (~line 716). The AI Micro-lesson card uses cyan (`#0e7490`) which bleeds into Practice tab's identity color.

- [ ] **Step 1: Remove `showMoreContent` state and add `showBrowse` check**

In `src/components/learn/LearnTab.tsx`, on the line declaring `showMoreContent`:
```tsx
// REMOVE this line:
const [showMoreContent, setShowMoreContent] = useState(false);
```
`showBrowse` and `pendingLesson` state remain. The `useState` import is still needed.

- [ ] **Step 2: Run TypeScript check**

```bash
cd "C:\Users\jschr\Dropbox\Croatian Learning Application\Source Code\nasa-hrvatska-v2"
npx tsc --noEmit 2>&1 | head -30
```
Expected: errors only about `showMoreContent` being undefined — confirm you removed the right variable. If there are other errors, stop and investigate.

- [ ] **Step 3: Replace the "My Path" header + Continue Learning block with hero + section headers**

Find the opening of the `return` statement (around line 230) where the "My Path" header div starts:

```tsx
// REPLACE this block (the flex header + Continue Learning):
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--heading)' }}>
          🗺️ My Path
        </div>
        {/* Grammar reference is a secondary action — text link keeps the primary CTA dominant */}
        <button
          onClick={() => setScr('grammar-ref')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--info)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
            padding: '8px 4px',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          📖 Grammar reference
        </button>
      </div>
```

Replace with:

```tsx
      {/* ── LEARN TAB HERO ──────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(150deg,#4f46e5 0%,#6366f1 45%,#7c3aed 100%)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(99,102,241,.35)',
        }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg,#6366f1,#4f46e5)' }} />
        <div className="tab-hero-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                flexShrink: 0,
                background: 'rgba(255,255,255,.14)',
                border: '1.5px solid rgba(255,255,255,.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              📚
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,.65)',
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}
              >
                Learn
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.1,
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {currentStage ? currentStage.title : 'My Path'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 3 }}>
                {totalDone} of {totalItems} lessons complete · {cefrLevel}
              </div>
            </div>
            <button
              onClick={() => setScr('grammar-ref')}
              style={{
                background: 'rgba(255,255,255,.15)',
                border: '1px solid rgba(255,255,255,.25)',
                borderRadius: 10,
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                flexShrink: 0,
              }}
            >
              📖 Ref
            </button>
          </div>
          {/* CEFR progress bar */}
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,.15)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 2,
                background: 'rgba(255,255,255,.6)',
                width: `${overallPct}%`,
                transition: 'width .6s',
              }}
            />
          </div>
        </div>
      </div>
```

- [ ] **Step 4: Add section header before Continue Learning card**

Immediately after the closing `</div>` of the hero (before the `{nextItem && (` block), insert:

```tsx
      {/* ── CONTINUE LEARNING ───────────────────────────────────────────── */}
      {nextItem && (
        <div className="section-hdr" style={{ marginBottom: 10 }}>
          <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>⭐</div>
          <div className="section-hdr-text">
            <div className="section-hdr-title">Continue Learning</div>
            <div className="section-hdr-sub">Tap to resume where you left off</div>
          </div>
        </div>
      )}
```

Then the existing `{nextItem && ( <button ... > )}` block follows as-is. No change to the Continue Learning button itself.

- [ ] **Step 5: Move LearnPathWidget up — add "Your Path" section header immediately after Continue Learning button**

Find the closing `)}` of the Continue Learning button block (around line 347), and immediately after it insert the LearnPathWidget with a section header:

```tsx
      {/* ── YOUR PATH ───────────────────────────────────────────────────── */}
      <div className="section-hdr" style={{ marginTop: 20 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>🗺️</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Your Path</div>
          <div className="section-hdr-sub">A1 → C1 · {totalItems} lessons</div>
        </div>
      </div>
      <LearnPathWidget
        sc={sc}
        currentStage={currentStage as any}
        currentStageDone={currentStageDone}
        overallPct={overallPct}
        stagePct={stagePct}
        totalDone={totalDone}
        totalItems={totalItems}
        nextItem={nextItem}
        cefrLevel={cefrLevel}
        cefrPct={cefrPct}
        setScr={setScr}
        setTab={setTab}
        st={st}
        handleLaunchPathItem={handleLaunchPathItem}
      />
```

- [ ] **Step 6: Change AI Micro-lesson card from cyan to indigo**

Find the AI Micro-lesson card block (around line 349):

```tsx
      {/* ── AI MICRO-LESSON CARD ──────────────────────────────────────── */}
      <button
        onClick={() => setScr('micro_lesson')}
        className="feature-card"
        style={{
          marginBottom: 20,
          border: '1.5px solid #bae6fd',
          background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
        }}
      >
        <div
          className="feature-card-icon"
          style={{ background: 'linear-gradient(135deg,#0e7490,#0369a1)' }}
        >
          🎯
        </div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#0c4a6e' }}>
            AI Micro-Lesson
          </div>
          <div className="feature-card-desc" style={{ color: '#0369a1' }}>
            Personalized 5-min lesson from your weak words
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#0369a1' }}>→</div>
      </button>
```

Replace with:

```tsx
      {/* ── TODAY'S RECOMMENDATION ──────────────────────────────────── */}
      <div className="section-hdr" style={{ marginTop: 8 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>🎯</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Today's Recommendation</div>
          <div className="section-hdr-sub">Personalized for your weak spots</div>
        </div>
      </div>
      <button
        onClick={() => setScr('micro_lesson')}
        className="feature-card"
        style={{
          marginBottom: 20,
          border: '1.5px solid #c7d2fe',
          background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)',
        }}
      >
        <div
          className="feature-card-icon"
          style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
        >
          🎯
        </div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#312e81' }}>
            AI Micro-Lesson
          </div>
          <div className="feature-card-desc" style={{ color: '#4f46e5' }}>
            Personalized 5-min lesson from your weak words
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#4f46e5' }}>→</div>
      </button>
```

- [ ] **Step 7: Delete the original LearnPathWidget block near the bottom**

Find and delete the existing LearnPathWidget block (around line 716–733) — it now lives after Continue Learning. The block to delete is:

```tsx
      {/* ── PATH WIDGET ─────────────────────────────────────────────────── */}
      <LearnPathWidget
        sc={sc}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentStage={currentStage as any}
        currentStageDone={currentStageDone}
        overallPct={overallPct}
        stagePct={stagePct}
        totalDone={totalDone}
        totalItems={totalItems}
        nextItem={nextItem}
        cefrLevel={cefrLevel}
        cefrPct={cefrPct}
        setScr={setScr}
        setTab={setTab}
        st={st}
        handleLaunchPathItem={handleLaunchPathItem}
      />
```

- [ ] **Step 8: TypeScript check + build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -10
```
Expected: zero TypeScript errors, build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/components/learn/LearnTab.tsx
git commit -m "feat(learn): add indigo hero, promote LearnPath above fold, recolour AI card"
```

---

## Task 2: LearnTab — Remove Browse More + Add Section Headers

**Files:**
- Modify: `src/components/learn/LearnTab.tsx` (lines ~376–714)

### Context
After Task 1 the LearnPath is promoted. Now we flatten the "Browse More" toggle so all content is always visible, and wrap each group with a `section-hdr`.

- [ ] **Step 1: Add Grammar section header before Past/Future Tense grid**

Find the `{/* ── ANIMATED LESSONS: PAST + FUTURE TENSE ── */}` comment (around line 376). Insert immediately before it:

```tsx
      {/* ── GRAMMAR ─────────────────────────────────────────────────────── */}
      <div className="section-hdr" style={{ marginTop: 8 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>📖</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Grammar</div>
          <div className="section-hdr-sub">Cases, tenses, aspect</div>
        </div>
      </div>
```

- [ ] **Step 2: Add Reading & Stories section header**

Find the `{/* ── GRADED STORIES + PRONUNCIATION COURSE ── */}` comment (around line 453). Insert immediately before it:

```tsx
      {/* ── READING & STORIES ───────────────────────────────────────────── */}
      <div className="section-hdr" style={{ marginTop: 8 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>📚</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Reading &amp; Stories</div>
          <div className="section-hdr-sub">Authentic Croatian text</div>
        </div>
      </div>
```

- [ ] **Step 3: Add Pronunciation section header + move hidden Pitch/Phoneme cards out of Browse More**

Find the `{/* ── BROWSE MORE — progressive disclosure ── */}` comment (around line 503). Replace the entire Browse More toggle block AND the `{showMoreContent && ( <> ... </> )}` hidden block with:

```tsx
      {/* ── PRONUNCIATION ───────────────────────────────────────────────── */}
      <div className="section-hdr" style={{ marginTop: 8 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>🎙️</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Pronunciation</div>
          <div className="section-hdr-sub">Sounds &amp; accents</div>
        </div>
      </div>
      {/* Pronunciation course + Pitch Accent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setScr('pronunciation_course')}
          className="feature-card feature-card--col"
          style={{
            border: '1.5px solid #ddd6fe',
            background: 'linear-gradient(135deg,#faf5ff,#ede9fe)',
          }}
        >
          <div
            className="feature-card-icon"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}
          >
            🗣️
          </div>
          <div>
            <div className="feature-card-title" style={{ color: '#4c1d95' }}>
              Pronunciation
            </div>
            <div className="feature-card-desc" style={{ color: '#7c3aed' }}>
              Master Č, Š, Ž, LJ, NJ &amp; more
            </div>
          </div>
        </button>
        <button
          onClick={() => setScr('pitch_accent')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
            boxShadow: '0 4px 14px rgba(124,58,237,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🎵</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>
              Pitch Accent
            </div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>
              4 accents · What no other app teaches
            </div>
          </div>
        </button>
      </div>
      {/* Phoneme Trainer + Heritage Mode */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setScr('phoneme_practice')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#0e7490,#0891b2)',
            boxShadow: '0 4px 14px rgba(14,116,144,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🔤</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>
              Phoneme Trainer
            </div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>
              Č vs Ć · Š Ž LJ NJ · Sound right
            </div>
          </div>
        </button>
        <button
          onClick={() => setScr('heritage_mode')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#1e3a5f,#2563eb)',
            boxShadow: '0 4px 14px rgba(37,99,235,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🌍</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>
              Heritage Mode
            </div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>
              Diaspora learner? Identify your gaps
            </div>
          </div>
        </button>
      </div>

      {/* ── SPECIAL PATHS ───────────────────────────────────────────────── */}
      <div className="section-hdr" style={{ marginTop: 8 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>🧬</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Special Paths</div>
          <div className="section-hdr-sub">Heritage, practical &amp; advanced tracks</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <button
          onClick={() => setScr('heritage_path')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#7c2d12,#c2410c)',
            boxShadow: '0 4px 14px rgba(194,65,12,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🧬</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>
              Heritage Path
            </div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>
              Grew up hearing Croatian? Start here.
            </div>
          </div>
        </button>
        <button
          onClick={() => setScr('practical_croatian')}
          className="feature-card feature-card--col"
          style={{
            background: 'linear-gradient(135deg,#065f46,#059669)',
            boxShadow: '0 4px 14px rgba(5,150,105,.3)',
          }}
        >
          <div style={{ fontSize: 28 }}>🗺️</div>
          <div>
            <div className="feature-card-title" style={{ color: '#fff' }}>
              Practical Croatian
            </div>
            <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>
              Shop · Doctor · Immigration · Visit
            </div>
          </div>
        </button>
      </div>
      {cefrLevel === 'B2' && (
        <div
          style={{
            background: 'linear-gradient(135deg,rgba(124,58,237,.12),rgba(91,33,182,.08))',
            border: '1.5px solid rgba(124,58,237,.35)',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>🎓</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#5b21b6' }}>
              Advanced vocabulary unlocked!
            </div>
            <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 2 }}>
              You have reached B2 level. Explore 146 new words across politics, tech,
              environment &amp; idioms below.
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setScr('frequency_track')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg,#1e3a5f,#0e7490)',
          boxShadow: '0 4px 14px rgba(14,116,144,.3)',
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 32, flexShrink: 0 }}>📊</div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#fff' }}>
            Top 500 Croatian Words
          </div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>
            Master the words that make up 80% of everyday speech
          </div>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: 18 }}>›</div>
      </button>
      <button
        onClick={() => setScr('advanced_vocab')}
        className="feature-card"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
          boxShadow: '0 4px 14px rgba(124,58,237,.35)',
          marginBottom: 20,
          color: 'white',
          border: 'none',
        }}
      >
        <div style={{ fontSize: 32, flexShrink: 0 }}>🎓</div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#fff' }}>
            B2+ Vocabulary
          </div>
          <div className="feature-card-desc" style={{ color: 'rgba(255,255,255,.8)' }}>
            Advanced themes: politics, tech, environment, idioms
          </div>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,.7)', fontSize: 18 }}>›</div>
      </button>
```

The original Pronunciation course button in the 2-col "Graded Stories + Pronunciation" grid is now replaced by the Pronunciation section above. So the existing 2-col grid at line 453 becomes **Reading only**:

Find the 2-col grid with Graded Stories + Pronunciation and change it to just the Graded Stories card (make it full-width or keep 1-col):

```tsx
      {/* Graded Stories — full width now that Pronunciation has its own section */}
      <button
        onClick={() => setScr('graded_input')}
        className="feature-card"
        style={{
          marginBottom: 10,
          border: '1.5px solid #bbf7d0',
          background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        }}
      >
        <div
          className="feature-card-icon"
          style={{ background: 'linear-gradient(135deg,#059669,#065f46)' }}
        >
          📖
        </div>
        <div style={{ flex: 1 }}>
          <div className="feature-card-title" style={{ color: '#065f46' }}>
            Graded Stories
          </div>
          <div className="feature-card-desc" style={{ color: '#059669' }}>
            A1–B2 Croatian texts with audio &amp; quiz
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#059669' }}>→</div>
      </button>
```

- [ ] **Step 4: Add Quick Vocab section header**

Find the `{/* ── VOCABULARY QUICK ACCESS ── */}` comment (around line 735). Replace the plain overline `<div>` label with a `section-hdr`:

```tsx
      {/* ── QUICK VOCAB ──────────────────────────────────────────────────── */}
      <div className="section-hdr" style={{ marginTop: 8 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(99,102,241,.12)' }}>⚡</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Quick Vocab</div>
          <div className="section-hdr-sub">Tap a topic to start</div>
        </div>
      </div>
```

Delete the old overline div that read:
```tsx
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            marginBottom: 8,
          }}
        >
          Quick Vocab — Tap to start
        </div>
```

- [ ] **Step 5: TypeScript check + build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -10
```
Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/learn/LearnTab.tsx
git commit -m "feat(learn): remove Browse More toggle, add Grammar/Reading/Pronunciation/Special section headers"
```

---

## Task 3: PracticeTab — Hero + AI Voice Conversation Above Fold

**Files:**
- Modify: `src/components/practice/PracticeTab.tsx` (lines 1485–1663)

### Context
The Practice tab opens with a plain `<h2>Practice</h2>` and CEFR badge. The AI Voice Conversation card (the flagship feature) is buried at line ~1664 after QuestTracker, SpeedChallenge, AdaptiveInsightsCard, and Today's Pick. We add a teal hero and surface the AI Voice card immediately after it.

- [ ] **Step 1: Replace the CEFR badge header + H() call with a teal hero**

Find the entire `{/* ── CEFR BADGE HEADER ── */}` block through to (and including) the `{H('🎮 Practice', 'Choose your training mode', undefined)}` line (lines 1487–1563). Replace with:

```tsx
      {/* ── PRACTICE TAB HERO ───────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(150deg,#0369a1 0%,#0e7490 45%,#0891b2 100%)',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(14,116,144,.35)',
        }}
      >
        <div style={{ height: 3, background: 'linear-gradient(90deg,#0e7490,#0369a1)' }} />
        <div className="tab-hero-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                flexShrink: 0,
                background: 'rgba(255,255,255,.14)',
                border: '1.5px solid rgba(255,255,255,.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              🎮
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: 'rgba(255,255,255,.65)',
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  marginBottom: 3,
                }}
              >
                Practice
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.1,
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                {userCefr} Level
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 3 }}>
                {practiceQuestsDone.done} of {practiceQuestsDone.total} quests done today
              </div>
            </div>
            {nextCefrTier && (
              <div
                style={{
                  background: 'rgba(255,255,255,.15)',
                  border: '1px solid rgba(255,255,255,.25)',
                  borderRadius: 10,
                  padding: '5px 9px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                → {nextCefrTier}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── LOCKED TILE TOAST ── */}
      {lockedToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30,30,40,.92)',
            color: '#fff',
            borderRadius: 12,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {lockedToast}
        </div>
      )}
```

- [ ] **Step 2: Move AI Voice Conversation block to immediately after the hero**

Cut the entire `{/* ── AI VOICE CONVERSATION — signature feature hero ── */}` block (lines ~1664–1744) and paste it immediately after the hero `</div>` (after the locked tile toast block), before QuestTracker. No code changes inside the block — just reposition it.

- [ ] **Step 3: Remove Today's Pick section**

Find and delete the `{/* ── TODAY'S PICK — always visible, always first ── */}` block including its section-hdr and `todays-picks-grid` div (lines ~1647–1662). The adaptive queue "Practice Now" section already serves this role.

- [ ] **Step 4: TypeScript check + build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -10
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/PracticeTab.tsx
git commit -m "feat(practice): add teal hero, surface AI Voice Conversation above fold, remove Today's Pick"
```

---

## Task 4: PracticeTab — Collapse Quests and SpeedChallenge by Default

**Files:**
- Modify: `src/components/practice/PracticeTab.tsx`

### Context
QuestTracker and SpeedChallenge are full-height expanded components that take significant vertical real estate. They should be collapsed by default with a tap-to-expand affordance.

- [ ] **Step 1: Add `questsExpanded` and `speedExpanded` state**

In the state declarations block (after the existing `const [openCat, setOpenCat]` and `const [activeIntent, setActiveIntent]` declarations), add:

```tsx
  const [questsExpanded, setQuestsExpanded] = useState(false);
  const [speedExpanded, setSpeedExpanded] = useState(false);
```

- [ ] **Step 2: Wrap QuestTracker with collapsed/expanded render**

Find `{/* ── DAILY QUESTS — moved here from Today tab ── */}` (around line 1565). Replace the `<QuestTracker ... />` call with:

```tsx
      {/* ── DAILY QUESTS ─────────────────────────────────────────────────── */}
      {!questsExpanded ? (
        <button
          onClick={() => setQuestsExpanded(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 14,
            cursor: 'pointer',
            marginBottom: 14,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div className="section-hdr-icon" style={{ background: 'rgba(14,116,144,.12)', width: 36, height: 36, borderRadius: 10, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🏆</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>Quests</div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
              {practiceQuestsDone.done} of {practiceQuestsDone.total} complete
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[practiceQuestsDone.speak, practiceQuestsDone.grammar, practiceQuestsDone.master, practiceQuestsDone.reading].map((done, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: done ? '#0e7490' : 'var(--card-b)',
                  border: done ? 'none' : '1.5px solid var(--card-b)',
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)' }}>›</div>
        </button>
      ) : (
        <>
          <button
            onClick={() => setQuestsExpanded(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtext)', fontSize: 11, fontWeight: 700, marginBottom: 6, padding: '4px 0', fontFamily: "'Outfit',sans-serif" }}
          >
            ‹ Collapse quests
          </button>
          <QuestTracker
            questsDone={questsDone}
            allQuestsDone={allQuestsDone}
            onQuestStart={(questId, screen) => {
              if (questId === 'speak' || questId === 'speak2') {
                const pool = allCats
                  .flatMap((t) => (V as Record<string, string[][]>)[t] || [])
                  .filter((w) => w && w[0] && w[1]);
                const items = sh(pool).slice(0, 6);
                onLaunchSpeaking(items.length ? items : [['Dobar dan', 'Good day', 'DOH-bar dahn']]);
              } else if (questId === 'grammar' || questId === 'grammar2') {
                if (launchPathItem) launchPathItem({ go: 'grammar' });
                else setScr('grammar');
              } else if (questId === 'vocab' || questId === 'vocab2') {
                if (launchPathItem) launchPathItem({ go: 'lesson' });
                else setScr('learnpath');
              } else if (questId === 'perfect') {
                const pool = allCats
                  .flatMap((t) => (V as Record<string, string[][]>)[t] || [])
                  .filter((w) => w && w[0] && w[1]);
                onLaunchFlash(sh(pool).slice(0, 20));
              } else {
                setScr(screen);
              }
            }}
          />
        </>
      )}
```

- [ ] **Step 3: Wrap SpeedChallenge with collapsed/expanded render**

Find `{/* ── SPEED CHALLENGE — daily timed vocabulary quiz ── */}` (around line 1593). Replace `<SpeedChallenge />` with:

```tsx
      {/* ── SPEED CHALLENGE ──────────────────────────────────────────────── */}
      {!speedExpanded ? (
        <button
          onClick={() => setSpeedExpanded(true)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 14,
            cursor: 'pointer',
            marginBottom: 14,
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(217,119,6,.12)', flexShrink: 0 }}>⚡</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>Speed Challenge</div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>Beat your best time — tap to play</div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)' }}>›</div>
        </button>
      ) : (
        <>
          <button
            onClick={() => setSpeedExpanded(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--subtext)', fontSize: 11, fontWeight: 700, marginBottom: 6, padding: '4px 0', fontFamily: "'Outfit',sans-serif" }}
          >
            ‹ Collapse
          </button>
          <SpeedChallenge />
        </>
      )}
```

- [ ] **Step 4: TypeScript check + build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -10
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/practice/PracticeTab.tsx
git commit -m "feat(practice): collapse QuestTracker and SpeedChallenge by default, tap-to-expand"
```

---

## Task 5: CroatiaTab — Remove Hero Pills + Upgrade Anchor Strip Active Indicator

**Files:**
- Modify: `src/components/croatia/CroatiaTab.tsx` (lines 167–207 and 250)

### Context
The hero currently contains 4 pill buttons (History / Life / Stories / Media) that duplicate the sticky anchor strip immediately below. The active indicator on the strip uses `var(--info)` (blue) instead of the Croatian flag red.

- [ ] **Step 1: Delete the hero pills block**

Find and delete the entire clickable pills div inside `<div className="tab-hero-body">` — specifically this block (lines ~167–206):

```tsx
          {/* Clickable pills — scroll to the matching section */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { label: '🏰 History', anchor: 'section-history', bg: 'rgba(212,0,48,.5)' },
              { label: '🏘️ Life', anchor: 'section-life', bg: 'rgba(0,61,165,.5)' },
              { label: '📖 Stories', anchor: 'section-stories', bg: 'rgba(22,163,74,.4)' },
              { label: '🎵 Media', anchor: 'section-media', bg: 'rgba(124,58,237,.45)' },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => scrollTo(t.anchor)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.9)',
                  background: t.bg,
                  border: '1px solid rgba(255,255,255,.2)',
                  borderRadius: 20,
                  padding: '5px 13px',
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  transition: 'background .15s,transform .1s',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onPointerDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onPointerUp={(e) => {
                  e.currentTarget.style.transform = '';
                }}
                onPointerLeave={(e) => {
                  e.currentTarget.style.transform = '';
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
```

The `<div style={{ fontSize: 'var(--text-sm)', ... }}>Culture, history, daily life & immersion</div>` subtitle line that precedes it stays — only the pills block is deleted.

- [ ] **Step 2: Change anchor strip active indicator from `var(--info)` to `#B80020`**

In the anchor strip `ANCHORS.map()` render (lines ~232–292), find the `borderBottom` style on the anchor buttons:

```tsx
                borderBottom: isActive ? '2px solid var(--info)' : '2px solid transparent',
```

Change to:

```tsx
                borderBottom: isActive ? '2px solid #B80020' : '2px solid transparent',
```

Also change the active `color`:

```tsx
                color: isActive ? 'var(--info)' : 'var(--subtext)',
```

Change to:

```tsx
                color: isActive ? '#B80020' : 'var(--subtext)',
```

And the CEFR sub-label active color:

```tsx
                    color: isActive ? 'var(--info)' : 'var(--subtext)',
```

Change to:

```tsx
                    color: isActive ? '#B80020' : 'var(--subtext)',
```

- [ ] **Step 3: TypeScript check + build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -10
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/croatia/CroatiaTab.tsx
git commit -m "feat(croatia): remove duplicate hero pills, upgrade anchor strip to Croatian red active indicator"
```

---

## Task 6: ProfileHeader — Consolidate Layout + Stats Bar + WCAG Fixes

**Files:**
- Modify: `src/components/profile/ProfileHeader.tsx`

### Context
Current layout: avatar (centered) → name → knight (between name and level text) → "Level X Learner" (opacity:0.75 — WCAG fail) → XP bar → email (opacity:0.45 — WCAG fail). Redesign: horizontal avatar row + emerald stripe + journey stats bar + knight to decorative corner.

- [ ] **Step 1: Add `getStreak` import**

At the top of `ProfileHeader.tsx`, change:

```tsx
import { lXP, nXP } from '../../lib/appUtils.js';
```

To:

```tsx
import { lXP, nXP, getStreak } from '../../lib/appUtils.js';
```

- [ ] **Step 2: Add `syncTime` prop and streak computation**

Change the function signature from:

```tsx
export default function ProfileHeader() {
```

To:

```tsx
export default function ProfileHeader({ syncTime = 0 }: { syncTime?: number }) {
```

Then immediately inside the function body, after the `useStats` call, add:

```tsx
  const streak = getStreak();
```

- [ ] **Step 3: Replace entire ProfileHeader JSX**

Replace everything from `return (` through the final `);` with:

```tsx
  return (
    <div
      style={{
        background: 'linear-gradient(160deg,#030c1a 0%,#071830 30%,#0a2848 60%,#0d3562 100%)',
        borderRadius: 24,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 56px rgba(0,0,0,.45), 0 4px 16px rgba(0,0,0,.3)',
      }}
    >
      {/* Emerald identity stripe */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#059669,#047857)' }} />

      {/* Šahovnica pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect width='14' height='14' fill='rgba(212,0,48,0.04)'/%3E%3Crect x='14' y='14' width='14' height='14' fill='rgba(212,0,48,0.04)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '100%',
          background: 'radial-gradient(ellipse at 50% 20%, rgba(5,150,105,.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ padding: '20px 20px 18px', position: 'relative', zIndex: 1 }}>
        {/* ── ROW 1: Avatar + Name + CEFR + Sync ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.14)',
              backdropFilter: 'blur(12px)',
              border: '2px solid rgba(255,255,255,.28)',
              boxShadow: '0 8px 24px rgba(0,0,0,.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 22,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {name ? name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 17,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-.01em',
                textShadow: '0 2px 12px rgba(0,0,0,.5)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name || au?.d}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div
                style={{
                  background: 'rgba(5,150,105,.3)',
                  border: '1px solid rgba(5,150,105,.5)',
                  borderRadius: 6,
                  padding: '2px 7px',
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,.9)',
                }}
              >
                Level {level} Learner
              </div>
            </div>
          </div>
          {/* Sync badge */}
          {syncTime > 0 && (
            <div
              style={{
                background: 'rgba(16,185,129,.15)',
                border: '1px solid rgba(16,185,129,.3)',
                borderRadius: 7,
                padding: '4px 8px',
                fontSize: 9,
                fontWeight: 800,
                color: '#6ee7b7',
                flexShrink: 0,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              ☁️ Synced
            </div>
          )}
        </div>

        {/* ── XP BAR ── */}
        {(() => {
          const xpFloor = lXP(level);
          const xpCeil = nXP(level);
          const xpInLevel = (st.xp || 0) - xpFloor;
          const xpNeeded = xpCeil - xpFloor;
          const pct = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
          const xpRemaining = Math.max(0, xpCeil - (st.xp || 0));
          return (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.65)',
                  marginBottom: 5,
                }}
              >
                <span>Level {level}</span>
                <span style={{ color: 'rgba(255,255,255,.85)' }}>
                  {xpRemaining > 0 ? xpRemaining + ' XP to Level ' + (level + 1) : 'Max Level!'}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,.15)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(90deg,#059669,#047857)',
                    width: pct + '%',
                    transition: 'width .6s ease',
                  }}
                />
              </div>
            </div>
          );
        })()}

        {/* ── JOURNEY STATS BAR ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            background: 'rgba(0,0,0,.25)',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.06)',
          }}
        >
          {[
            { label: 'Lessons', value: st.lc || 0 },
            { label: 'Streak', value: `${streak.count}🔥` },
            { label: 'XP', value: st.xp || 0 },
            { label: 'Grammar', value: st.gc || 0 },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '8px 4px',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,.07)' : 'none',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  marginTop: 3,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative knight — bottom right corner */}
      <CroatianKnight
        size={48}
        mood="encouraged"
        style={{
          position: 'absolute',
          bottom: 10,
          right: 12,
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </div>
  );
```

- [ ] **Step 4: TypeScript check + build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -10
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/ProfileHeader.tsx
git commit -m "feat(profile): consolidate avatar row, add emerald stripe + journey stats bar, fix WCAG contrast, knight to corner"
```

---

## Task 7: ProfileTab — Sub-tab Strip + Pass Sync Time to Header

**Files:**
- Modify: `src/components/profile/ProfileTab.tsx`

### Context
ProfileTab needs to (a) pass `lastSyncedAt` to ProfileHeader as the new `syncTime` prop, (b) remove the now-redundant standalone sync indicator div, and (c) replace the `.seg-bar` / `.seg-pill` component with an icon-above-label strip that uses the emerald identity color.

- [ ] **Step 1: Pass `syncTime` to ProfileHeader + remove standalone sync indicator**

Find the `<ProfileHeader />` call and update it:

```tsx
      <ProfileHeader syncTime={authUser && lastSyncedAt > 0 ? lastSyncedAt : 0} />
```

Then find and delete the entire sync status indicator block:

```tsx
      {/* ── SYNC STATUS INDICATOR — only shown after first successful sync ── */}
      {authUser && lastSyncedAt > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: 'var(--success, #16a34a)',
            fontWeight: 600,
            marginBottom: 12,
            paddingLeft: 2,
          }}
        >
          <span style={{ fontSize: 13 }}>☁️</span>
          <span>
            {(() => {
              const diff = Math.round((Date.now() - lastSyncedAt) / 60000);
              if (diff < 1) return 'Synced just now';
              if (diff === 1) return 'Synced 1 min ago';
              return `Synced ${diff} min ago`;
            })()}
          </span>
        </div>
      )}
```

- [ ] **Step 2: Replace the `.seg-bar` sub-tab with icon-above-label strip**

Find the `{/* ── SUB-TAB PILL SELECTOR ── */}` block and replace it entirely with:

```tsx
      {/* ── SUB-TAB STRIP ── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1.5px solid var(--card-b)',
          marginBottom: 16,
          background: 'var(--card)',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
        }}
      >
        {[
          { id: 'stats', icon: '📊', label: 'Stats' },
          { id: 'insights', icon: '💡', label: 'Insights' },
          { id: 'settings', icon: '⚙️', label: 'Settings' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setPTab(t.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '11px 4px 9px',
              fontSize: 10,
              fontWeight: ptab === t.id ? 800 : 600,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: ptab === t.id ? '#059669' : 'var(--subtext)',
              borderBottom: ptab === t.id ? '3px solid #059669' : '3px solid transparent',
              transition: 'color .15s, border-color .15s',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
```

- [ ] **Step 3: TypeScript check + build**

```bash
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -10
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/ProfileTab.tsx
git commit -m "feat(profile): replace seg-bar with icon-above-label strip, integrate sync badge into ProfileHeader"
```

---

## Final: Visual Verification

- [ ] **Run dev server and spot-check all four tabs**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser (or the running port) and verify:

1. **Learn tab**: Indigo hero with stage name shows at top. LearnPathWidget appears early (section 2). Grammar/Pronunciation/Special sections all visible without tapping anything. AI card is indigo (not cyan).
2. **Practice tab**: Teal hero shows at top. AI Voice Conversation is the first interactive card below the hero. QuestTracker and SpeedChallenge show as collapsed rows. Today's Pick section is gone.
3. **Croatia tab**: Hero has no pill buttons. Anchor strip shows emoji + label. Active anchor shows Croatian red (#B80020) underline.
4. **Profile tab**: Header shows avatar + name in one horizontal row. Knight is at bottom-right corner at low opacity. Stats bar (Lessons/Streak/XP/Grammar) visible in header. Sub-tab strip shows 📊/💡/⚙️ icons above labels with emerald active underline.

- [ ] **Push to trigger Cloudflare deploy**

```bash
git push origin master
```

---

## Self-Review Against Spec

| Spec requirement | Task |
|-----------------|------|
| Hero on all 4 tabs | T1 (Learn), T3 (Practice), Croatia already had one, T6 (Profile header is the hero) |
| section-hdr on all tabs | T1, T2 (Learn), T3 (Practice), Croatia Stories/Media already have them |
| LearnPath moved above fold | T1 |
| AI card indigo | T1 |
| Browse More removed | T2 |
| Grammar/Reading/Pronunciation/Special sections | T2 |
| AI Voice above fold | T3 |
| Quests collapsed | T4 |
| SpeedChallenge collapsed | T4 |
| Today's Pick removed | T3 |
| Croatia hero pills deleted | T5 |
| Croatia anchor strip active = #B80020 | T5 |
| ProfileHeader: avatar row consolidated | T6 |
| ProfileHeader: emerald stripe | T6 |
| ProfileHeader: stats bar | T6 |
| ProfileHeader: knight to corner | T6 |
| ProfileHeader: WCAG opacity fixed | T6 |
| ProfileTab: sub-tab strip | T7 |
| ProfileTab: sync badge in header | T7 |
