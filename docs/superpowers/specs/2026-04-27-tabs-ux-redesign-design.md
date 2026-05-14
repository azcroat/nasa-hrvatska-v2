# Tabs UX Redesign — Design Spec
**Date:** 2026-04-27  
**Scope:** Learn, Practice, Croatia, and Profile tabs — full UX/UI elevation to match the quality of the Home tab redesign completed in the prior session.  
**Approach:** Option A — Unified Design System Elevation: one consistent hero pattern, section header style, card vocabulary, and typography scale across all four tabs. Each tab keeps its identity color; structure and visual language are shared.

---

## Section 1 — Shared Design System

### 1.1 Tab Identity Colors
Each tab has a primary and secondary gradient color that is applied to its hero, section header tints, card accent bars, and active state indicators.

| Tab | Primary | Secondary | Token name |
|-----|---------|-----------|-----------|
| Learn | `#6366f1` | `#4f46e5` | `--tab-learn` |
| Practice | `#0e7490` | `#0369a1` | `--tab-practice` |
| Croatia | `#B80020` | `#003DA5` | `--tab-croatia` |
| Profile | `#059669` | `#047857` | `--tab-profile` |

### 1.2 Hero Pattern (consistent across all four tabs)
Every tab opens with the same structural hero:
1. **Thin stripe** — 3px gradient bar using the tab's primary→secondary color, top of card.
2. **Gradient banner** — `linear-gradient(150deg, secondary, primary, lighter variant)` background.
3. **Overline** — 8px / 900 weight / 0.12em letter-spacing / uppercase / `rgba(255,255,255,0.65)` — tab name or section name.
4. **Title** — 20px / 900 weight / `#ffffff` — current stage, level, or section name.
5. **Subtitle** — 11px / `rgba(255,255,255,0.65)` — supporting metadata (lesson count, CEFR level, streak, etc.).

The content inside the hero varies per tab; the structure does not.

### 1.3 Section Headers
Every content section uses the same header component:
- `28px × 28px` rounded icon container (tinted with 12% of the tab color) holding an emoji icon.
- **Bold title** — 14px / 900 weight / `var(--heading)` (light: `#1e293b`).
- **Muted subtitle** — 11px / 500 weight / `var(--subtext)` (light: `#64748b`).
- No free-floating overline text or standalone uppercase labels.

### 1.4 Card Variants

**Exercise / lesson card** (full-width):
- `1.5px solid var(--card)` border, `10px` radius.
- `3px` left-accent bar in the category or tab color.
- Emoji icon | `13px/800` label | `11px/500` description | `10px/700` meta row (CEFR badge + duration).

**Feature card** (2-column grid):
- Same border and radius as above.
- `32px × 32px` icon container (tinted) with emoji.
- `12px/800` title, `10px/500` description.

**Progress / stat chip** (inline row):
- Small pill: `9px/800` label, `10px/700` value, rounded `6px` background tint.

### 1.5 Typography Scale
| Role | Size | Weight | Color |
|------|------|--------|-------|
| Tab / screen title | 20px | 900 | `var(--heading)` |
| Section header | 14px | 900 | `var(--heading)` |
| Card label | 13px | 800 | `var(--heading)` |
| Card description | 11px | 500 | `var(--subtext)` |
| Meta / badge | 10px | 700 | `#5f6b7a` (WCAG AA) |
| Overline | 8px | 900 | `#5f6b7a` (WCAG AA) |

**WCAG note:** `#94a3b8` at opacity < 1 on white fails WCAG AA (2.42:1). All overlines and muted labels must use `#5f6b7a` or darker (≥ 4.5:1 on white). The `opacity: 0.75` pattern on overlines is removed.

---

## Section 2 — Learn Tab

### 2.1 Current Problems
- **LearnPath buried** below a wall of feature cards — users cannot find the primary A1→C1 sequential track without scrolling past 10+ items.
- **AI Micro-lesson card** uses cyan (`#0e7490`) which conflicts with the Practice tab's color identity and looks orphaned.
- **Browse More** is an unlabeled dump of additional cards with no clear purpose hierarchy.
- **Mixed card styles** compete: standalone lesson cards, 2-col grids, and a full-width AI promo card all live in the same column with no visual rhythm.

### 2.2 Proposed Layout (top → bottom)
1. **Hero** — indigo gradient, "Learn" overline, stage name (e.g. "Stage 2 — Beginner"), lesson count subtitle. Thin indigo stripe above.
2. **Continue Learning** — section header (⭐ "Continue Learning" / "Tap to resume"), single featured lesson card with indigo left-accent bar.
3. **Your Path** — section header (🗺️ "Your Path" / "A1 → C1 · 22 lessons"), then `<LearnPathWidget>` immediately below. This is the primary navigation — no longer buried.
4. **Today's Recommendation** — section header (🎵 or 🧩 based on content type), single AI-selected lesson card. Replaces standalone cyan AI card.
5. **Grammar** — section header (📖 "Grammar" / "Cases, tenses, aspect"), 2-col feature card grid.
6. **Reading & Stories** — section header (📚 "Reading & Stories" / "Authentic text"), 2-col feature card grid.
7. **Pronunciation** — section header (🎙️ "Pronunciation" / "Sounds & accents"), 2-col feature card grid.
8. **Quick Vocabulary** — section header (⚡ "Quick Vocab" / "Swipe to learn"), horizontal scroll strip.

### 2.3 Changes to LearnTab.tsx
- **Reorder state/sections**: Move `<LearnPathWidget>` block from near-bottom to position 3 (after Continue Learning section).
- **Remove AI card cyan styling**: Replace standalone AI Micro-lesson card with the unified `ExerciseCard`-style component using indigo accent color.
- **Remove Browse More toggle**: Flatten all exercise sections into labeled groups — Grammar, Reading & Stories, Pronunciation — always visible.
- **Add hero**: New `LearnHero` div at top of return using indigo gradient following the design system hero pattern.
- **Replace section overlines**: Every `<div className="text-xs font-black ...">` overline → new `SectionHeader` component (icon + title + subtitle).

---

## Section 3 — Practice Tab

### 3.1 Current Problems
- **AI Voice Conversation is buried**: The flagship feature (full-sentence spoken Croatian with real-time feedback) appears ~60% down the page below QuestTracker, SpeedChallenge, AdaptiveInsightsCard, a queue, and Today's Picks.
- **Today's Picks is cramped**: 3 items in a narrow viewport with small font creates a scan-unfriendly cluster.
- **QuestTracker is visually heavy**: An always-expanded card with progress bars takes prime real estate for a peripheral feature.
- **Category layout**: Category sections (Grammar, Vocab, Practical, Advanced) have no visual hierarchy — all sections look equally important.

### 3.2 Proposed Layout (top → bottom)
1. **Hero** — teal gradient, "Practice" overline, CEFR level (e.g. "A2 Level"), active quests count subtitle. Thin teal stripe above.
2. **AI Voice Conversation feature** — full-width prominent card immediately below hero. Icon + "Speak Croatian" label + description + "Start Conversation" CTA button. Teal gradient background or heavy teal left-accent bar (3px). This is the signature feature and should be the first interactive element.
3. **Intent strip** — 4 horizontally-scrollable pill chips: "Weakest Areas" · "Drill" · "Quick Game" · "All Exercises". Teal active state. Scrollable, no wrapping.
4. **Adaptive Queue** — section header (🎯 "Practice Now" / "Your weakest areas — due for review"), exercise cards from `adaptiveQueue` array.
5. **Quests** — section header (🏆 "Quests" / "X of Y complete"), collapsed to a horizontal progress-dot strip by default. Tap → expands to full `<QuestTracker>`. Default collapsed preserves vertical space.
6. **SpeedChallenge** — section header (⚡ "Speed Challenge" / "Beat your best time"), collapsed card showing last score + "Play" button. Tap → expands.
7. **Category Sections** (Grammar / Vocab / Practical / Advanced) — each with section header using category tint color (purple/teal/green/amber), exercise cards with left-accent bar in matching color.

### 3.3 Changes to PracticeTab.tsx
- **Reorder**: Move AI Voice Conversation block to position immediately after hero (before QuestTracker).
- **Collapsed state for QuestTracker**: Add `questsExpanded` boolean state, default `false`. Render dot-strip summary when collapsed, full `<QuestTracker>` when expanded.
- **Collapsed state for SpeedChallenge**: Add `speedExpanded` boolean state, default `false`.
- **Add intent strip**: Horizontal `<div>` with `overflow-x: auto`, 4 pill `<button>` elements. Active pill sets filter state; "All Exercises" shows all categories.
- **Add hero**: New `PracticeHero` div at top using teal gradient per design system.
- **Replace Today's Picks**: Rename section to "Practice Now" using section header component; use `adaptiveQueue` data (already computed) rather than `todaysPicks`.
- **Remove AdaptiveInsightsCard from above-fold**: Move to below category sections, or fold into collapsed SpeedChallenge card as a secondary stats view.

---

## Section 4 — Croatia Tab

### 4.1 Current Problems
- **Hero pills duplicate the anchor strip**: The hero contains pill buttons for History / Life / Stories / Media, and immediately below the hero is a sticky anchor strip with the same four items. The user sees the same navigation twice within ~200px.
- **Anchor strip is plain**: No icons, small text, no visual weight to distinguish the active section.

### 4.2 Proposed Changes
1. **Remove hero pills entirely**: Delete the pill row from the hero. The anchor strip is the single source of section navigation.
2. **Upgrade anchor strip**: Each anchor item gets a small emoji icon above the label (Discover 🌊 / History 🏰 / Life 🥘 / Stories 📖 / Media 🎬). Active item gets a `3px` bottom border in the active section's color (Croatian flag gradient for all, or per-section tint). Font: `11px / 800`.
3. **Hero preserved**: Keep the existing Croatian flag gradient hero, flag stripe, šahovnica pattern, and "Naša Hrvatska" title. It communicates cultural identity strongly. Only the redundant pill row is removed.
4. **Section headers**: Each section (DiscoverTab, CultureTab, etc.) gets unified section headers per the design system, replacing whatever overline patterns currently exist within each sub-component.

### 4.3 Changes to CroatiaTab.tsx
- **Delete** the `{/* Hero pills */}` `<div>` block containing the four pill `<button>` elements linking to anchors.
- **Upgrade `anchors` strip**: In the sticky anchor strip `<div>`, change each `<button>` to show icon above label. Add `borderBottom: activeAnchor === anchor.id ? '3px solid #B80020' : '3px solid transparent'` for active indicator.
- **No other structural changes** to the section routing or IntersectionObserver logic.

---

## Section 5 — Profile Tab

### 5.1 Current Problems
- **ProfileHeader is vertically sprawling**: Avatar → name → CroatianKnight → "Level X Learner" text → XP bar is a tall stack. The knight visually separates the user's name from their level, creating a confusing hierarchy.
- **No stats in the header**: Users must tap into the Stats sub-tab to see their lesson count, streak, or XP. These are primary identity signals and should be visible immediately.
- **Seg-bar is dated**: The three-option segmented control (Stats / Insights / Settings) reads like a generic iOS component with no visual connection to the tab's emerald identity.
- **Sync status is a standalone element**: A small badge floating between the header and the seg-bar has no compositional home.
- **`opacity: 0.75` on "Level X Learner"** and `opacity: 0.45` on email text fail WCAG AA contrast on the dark header background.

### 5.2 Proposed Layout — ProfileHeader
```
┌──────────────────────────────────────────────────────┐
│  ▓▓▓ 3px emerald stripe                             │
│                                                      │
│  ┌──┐  Jordan Schreiner          [sync badge]       │
│  │AB│  C1 Learner · A1→C1 Path                     │
│  └──┘                                                │
│  ████████████████░░░░  4,820 / 6,000 XP             │
│                                                      │
│  [ Lessons  ]  [ Streak ]  [ XP     ]  [ Accuracy ] │
│  [  142     ]  [  23    ]  [ 4,820  ]  [   87%    ] │
│                                                      │
│                              🏇 (Hrvoje corner)     │
└──────────────────────────────────────────────────────┘
```

Changes:
- **Consolidate avatar row**: Avatar (84px) + name + CEFR badge + sync badge all on one horizontal line.
- **Move knight** to decorative bottom-right corner at ~40% opacity. No longer interrupts the name→level hierarchy.
- **Journey stats bar**: 4-cell dark-tinted row directly below the XP bar — Lessons / Streak / XP / Accuracy as inline `value + label` pairs. These are the most-wanted at-a-glance stats.
- **Fix opacity on text**: "Level X Learner" → full opacity white / `rgba(255,255,255,0.85)` minimum (≥ 4.5:1 on dark background). Email → `rgba(255,255,255,0.65)` minimum.
- **Emerald stripe**: 3px `linear-gradient(90deg,#059669,#047857)` stripe at top of header card.

### 5.3 Proposed Layout — Sub-tab Strip
Replace the 3-option `<SegBar>` component with a wider strip that uses icon-above-label format:

```
┌─────────────────────────────────────────────────────┐
│   📊        💡        ⚙️                            │
│   Stats    Insights  Settings                       │
│   ────                                              │  ← emerald underline on active
└─────────────────────────────────────────────────────┘
```

- Full-width 3-column strip, no pill background.
- Active tab: icon + label in emerald (`#059669`), `3px` bottom border.
- Inactive: icon + label in `var(--subtext)`.

### 5.4 Changes to ProfileTab.tsx and ProfileHeader.tsx

**ProfileHeader.tsx:**
- Restructure hero body: avatar + name + badge on one flex row; knight moved to absolute-positioned corner `<div>`.
- Add journey stats bar as a new flex row with 4 cells.
- Fix opacity values on "Level X Learner" and email text.
- Add 3px emerald stripe at top.

**ProfileTab.tsx:**
- Replace `<SegBar>` with new `ProfileSubTabs` strip component (inline, no external dependency).
- Move sync status badge inside ProfileHeader (pass as prop or render via context).
- Unify Stats sub-tab section headers to design system pattern (icon + title + subtitle).

---

## Implementation Notes

### Component Changes Summary
| File | Type | Change |
|------|------|--------|
| `src/components/learn/LearnTab.tsx` | Modify | Hero, reorder LearnPath up, remove Browse More toggle, replace overlines with SectionHeader |
| `src/components/practice/PracticeTab.tsx` | Modify | Hero, reorder AI Voice feature up, intent strip, collapse quests/speed, replace overlines |
| `src/components/croatia/CroatiaTab.tsx` | Modify | Remove hero pills, upgrade anchor strip with icons and active underline |
| `src/components/profile/ProfileHeader.tsx` | Modify | Consolidate avatar row, add stats bar, move knight, fix contrast, add emerald stripe |
| `src/components/profile/ProfileTab.tsx` | Modify | Replace SegBar with icon-above-label strip, integrate sync badge into header |

### New Shared Component
A `SectionHeader` component should be introduced at `src/components/shared/SectionHeader.tsx`:
```tsx
interface SectionHeaderProps {
  icon: string;        // emoji
  title: string;
  subtitle?: string;
  tintColor?: string;  // rgba for icon container background
}
```
This replaces all ad-hoc overline/title pairs across all four tabs.

### No Breaking Changes
- All existing data wiring (exercises array, adaptiveQueue, QuestTracker, LearnPathWidget, etc.) is preserved.
- Only layout order and styling change.
- All existing state variables are preserved; new `questsExpanded` and `speedExpanded` booleans are additive.

### WCAG Compliance
All text must meet 4.5:1 contrast ratio (WCAG 2.1 AA):
- Remove all `opacity: 0.75` patterns on overline/subtitle text.
- Use `#5f6b7a` instead of `#94a3b8` for muted text on white/light backgrounds.
- On dark gradient headers: minimum `rgba(255,255,255,0.65)` for secondary text.

---

## Out of Scope
- Content changes (lessons, exercises, quiz questions).
- Backend / Firestore changes.
- Android build / Capacitor changes.
- LearnPath sequential flow logic (covered in a prior session's spec).
- New exercise types or screens.
