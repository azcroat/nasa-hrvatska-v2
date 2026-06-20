# Knight Retirement — Phase 3 (decorative / onboarding / result sweep) Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Remove the knight from the ~17 remaining LIVE decorative/onboarding/result sites — hybrid: **replace** with the context host where it adds warmth, **remove** the illustration where it's filler — leaving `CroatianKnight` referenced only by the orphaned components that Phase 4 deletes.

**Architecture:** Per-site swap. `<CroatianKnight size={N} mood=... style=... />` → `<CharacterPortrait name="{host}" size={N} />` (drop `mood`; `CharacterPortrait`'s `<img>` already has `flex:'none'`; where the old knight carried positioning `style` like `float`/`margin`, wrap the portrait in a `<span style={…}>`). For REMOVE sites, delete the knight element (and any now-empty wrapper) and the `CroatianKnight` import. No event-channel or data changes.

## Global Constraints
- `CharacterPortrait` (locked cast) only; no `mood`/no new art. `import CharacterPortrait from '<rel>/family/CharacterPortrait'`.
- After editing each file, if `CroatianKnight` is no longer used in it, remove its import.
- `CroatianKnight.tsx` stays (Phase 4 deletes it once unreferenced).
- Branch `feat/uxui-knight-retirement-phase3`; ASCII commits + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- `block-bulk-edit-delete` hook blocks >~30-line single deletions — split large removals.

## Disposition (host per site)
**REPLACE:**
| File | Knight sites | Host |
|---|---|---|
| `auth/PlacementTest.tsx` | ×3 | `kovac` (assessment/tutor) |
| `home/WelcomeScreen.tsx` | ×3 | `baka` (warm first-run welcome) |
| `practice/AIStoryScreen.tsx` | 1 | `baka` (stories) |
| `croatia/StoriesTab.tsx` | 1 | `baka` |
| `croatia/HeritagePathScreen.tsx` | 1 | `baka` (heritage) |
| `learn/LessonScreen.tsx` | 1 | `kovac` |
| `learn/PitchAccentMastery.tsx` | 1 | `kovac` |
| `practice/FlashcardResultScreen.tsx` | 1 | `kovac` |
| `practice/McResult.tsx` | 1 | `kovac` |
| `practice/ReviewScreen.tsx` | 1 | `kovac` |
| `practice/FlashcardEmptyState.tsx` | 1 | `kovac` |
| `shared/EmptyState.tsx` | 1 | `kovac` |
| `home/WelcomeBackBanners.tsx` | 1 | host-of-day (`hostOfDay(Math.floor(Date.now()/86400000))`) |

**REMOVE (drop the illustration; keep surrounding text/markup):**
| File | Knight sites | Note |
|---|---|---|
| `shared/ScreenErrorBoundary.tsx` | 1 (droop) | plain error, no mascot |
| `learn/LearnPathWidget.tsx` | ×4 | path marchers/accents — text/markers remain |
| `home/StatsWidget.tsx` | 1 | stats are about the user |
| `profile/ProfileHeader.tsx` | 1 | profile is about the user |

Also: `practice/McResult.tsx:63` has a "Vitez Hrvoje is impressed" string — reword to drop "Vitez Hrvoje" (e.g. "Savršeno! Perfect quiz — prof. Kovač is impressed.").

## Execution (batched, test per batch)
- [ ] **Batch A — REMOVE group** (`ScreenErrorBoundary`, `LearnPathWidget`, `StatsWidget`, `ProfileHeader`): read each, delete the `<CroatianKnight…/>` element(s) + any emptied wrapper, drop the `CroatianKnight` import. `npm run typecheck` → clean. Commit.
- [ ] **Batch B — REPLACE: results/empty** (`FlashcardResultScreen`, `McResult` (+reword the Vitez string), `ReviewScreen`, `FlashcardEmptyState`, `EmptyState`): swap → `CharacterPortrait name="kovac"`. typecheck. Commit.
- [ ] **Batch C — REPLACE: lessons + stories/heritage** (`LessonScreen`, `PitchAccentMastery` → kovac; `AIStoryScreen`, `StoriesTab`, `HeritagePathScreen` → baka): swap. typecheck. Commit.
- [ ] **Batch D — REPLACE: onboarding + comeback** (`WelcomeScreen` ×3 → baka; `PlacementTest` ×3 → kovac; `WelcomeBackBanners` → host-of-day, import `hostOfDay` from `../home/hostFamily`/`./hostFamily`): swap. typecheck. Commit.
- [ ] After each batch, run the affected component tests if any exist (`grep -l` the file's test). Fix locator/knight assertions.

## Verification (before PR)
- [ ] `grep -rn "CroatianKnight" src/components --include=*.tsx | grep -vE "KnightCompanion|KnightBubble|KnightSpeech|KnightToast|CroatianKnight.tsx"` → **empty** (no live decorative knight left).
- [ ] `grep -rin "vitez|hrvoje" src --include=*.tsx --include=*.ts | grep -iE "text:|label|aria|title="` → only the orphaned `KnightSpeech.tsx` + `CroatianKnight.tsx` (Phase 4) remain.
- [ ] `npm run test` full suite green; `npm run typecheck` + `npm run lint` clean; `npm run build` succeeds.
- [ ] `npx playwright test e2e/accessibility.spec.js e2e/error-boundary.spec.js e2e/home.spec.js --project="Desktop Chrome"` green (axe over screens whose mascot changed/was removed).
- [ ] Manual sanity: a result screen + an empty state show prof. Kovač; an error boundary shows no mascot; onboarding shows Baka.
- [ ] PR `feat/uxui-knight-retirement-phase3` → master; code-reviewer pass; merge on authorization. After this, only orphaned components reference `CroatianKnight` → Phase 4 deletes them.
