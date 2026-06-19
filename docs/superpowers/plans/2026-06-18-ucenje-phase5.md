# Phase 5 — Učenje (Learn) Redesign Implementation Plan

> Execute task-by-task; each ends with a verified, committed deliverable.

**Goal:** Collapse the 16-section `LearnTab` into a calm, guided surface — a tutor-hosted hero (prof. Kovač), one prominent **Continue** card, the vertical A1→C1 path (`LearnPathWidget`), and a quiet **"Browse all"** link — **without orphaning any feature**. Every extra entry point moves into `BrowseContentModal`.

**Architecture:** Keep the spine (`LearnPathWidget`, `nextItem`/Continue logic, `launchPathItem`, `evalCk` gates, CEFR calc, `BrowseContentModal`). First make Browse the comprehensive catalog (add the orphaned entries), then strip the LearnTab surface.

## Global Constraints
- Plain CSS + tokens; Outfit/Playfair; palette teal/red/terracotta/stone/gold. ASCII commit msgs + Co-Authored-By. Branch `feat/uxui-ucenje-phase5`; don't push to master. Merging deploys.
- **No orphaned features:** every entry point removed from LearnTab must remain reachable (Browse, path, or another tab). Verified by the orphan audit.
- Verify each step (typecheck/eslint/unit/build); desktop e2e (`learn.spec`) before done. CI E2E gates desktop only.

## Orphaned entry points to ADD to Browse (from audit)
`micro_lesson`, `grammar_track`, `pronunciation_course`, `phoneme_practice`, `heritage_mode`, `heritage_path`, `practical_croatian`, `frequency_track`, `advanced_vocab`, `grammarmap`, `production_drill` (+ verify `pitch_accent` vs `pitchaccent`).

## File Structure
- Modify `src/components/learn/BrowseContentModal.tsx` — add a "Paths & Tools" section with the orphaned entries (icon/label/desc preserved from LearnTab; launch via `setScr(...)` + `onClose()`).
- Modify `src/components/learn/LearnTab.tsx` — collapse to: hero (prof. Kovač `CharacterPortrait`) + Continue card (keep) + `LearnPathWidget` (keep) + Browse link. Remove sections: Today's Recommendation, Grammar, Reading, Pronunciation, Special Paths, Quick Vocab Pills, Goal-Based Focus, Your Journey Strip, B1+ Explorer, CEFR Fluency Track (keep a compact level chip in hero), B2 banner.
- Modify `e2e/learn.spec.js` — assert the calm surface (Continue + "Your Path" + Browse link) and that Browse exposes the relocated items; drop assertions for removed surface cards.

## Tasks
### Task 1: Make Browse the full catalog (add orphaned entries)
- [ ] Verify the `pitch_accent`/`pitchaccent` screen id (grep router/`_TAB_FOR_SCR`); use the id the router handles. If both alias, fine; if not, note the bug.
- [ ] In `BrowseContentModal.tsx`, add a "Paths & Tools" section listing the 11 orphaned entries (each: icon + label + desc from LearnTab; onClick `onClose()` then `setScr(target)` — match the existing Browse item pattern). Pronunciation Course/Pitch Accent/Phoneme under a "Pronunciation" subgroup; Heritage Path/Mode/Practical/Top500/Advanced Vocab/Grammar Track/Micro-Lesson/Grammar Map/Production Drill grouped sensibly.
- [ ] Verify: typecheck + eslint; render Browse in a temp screenshot or rely on `browse`-related unit/e2e. Commit `feat(learn): add paths & tools to Browse (pre-collapse, no orphans)`.

### Task 2: Collapse LearnTab to the calm surface
- [ ] Replace the hero with a tutor-hosted hero (prof. Kovač `CharacterPortrait` + stage title + compact CEFR chip + Ref button).
- [ ] Keep the Continue card (elevate as the primary CTA) and `LearnPathWidget`.
- [ ] Add the quiet "Browse all" link (opens `BrowseContentModal`).
- [ ] Remove all other sections + their now-unused helpers/imports/state (vocab-pill data, goal tips, journey strip, B1+ explorer, CEFR track, B2 banner). Keep `nextItem`/`evalCk`/CEFR calc that the kept pieces use.
- [ ] Verify: typecheck + eslint + unit + build. Commit `feat(learn): collapse Ucenje to tutor hero + Continue + path + Browse`.

### Task 3: Reconcile learn.spec + verify
- [ ] Update `e2e/learn.spec.js`: assert "Your Path" + Continue + Browse link on the calm surface; for the relocated cards (Grammar Track, Graded Stories, etc.), assert they're reachable via Browse (open Browse, click) or drop. Keep "no console errors".
- [ ] Rebuild dist; run `learn.spec` (+ any browse spec) on Desktop Chrome locally.
- [ ] Commit `test(e2e): learn.spec for the collapsed Ucenje surface`.

## Self-Review
- Every orphaned entry point added to Browse (audit list) → no feature unreachable. Continue/path spine intact. learn.spec matches new surface. prof. Kovač hero uses committed CharacterPortrait.
