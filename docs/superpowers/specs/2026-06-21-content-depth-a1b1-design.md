# Content Depth — A1–B1 High-Traffic Pools

**Date:** 2026-06-21
**Status:** Approved direction (deepen thin A1–B1 pools first); pending spec review → batched execution
**Context:** Content-depth audit measured thin pools that drive the "repetitive lessons" complaint at the levels most users occupy. The Today's-Session rotation/difficulty defects are fixed (#74/#75/#76); this addresses the remaining cause — small item pools that recur within days even when rotated.

## Goal

Roughly **double** the highest-traffic A1–B1 drill pools so a daily user does not re-see the same items for weeks, and add a **minimum-depth test** so a pool can never silently regress to "thin" again.

## Scope (measured → target)

| Pool | File | Format | Now | Target |
|---|---|---|---|---|
| Genitive drill | `src/components/practice/GenitiveDrill.tsx` (`DATA`) | `{ q, opts:[4], answer }` | 20 | **50** |
| Accusative drill | `src/components/practice/AccusativeDrill.tsx` (`DATA`) | `{ q, opts:[4], answer }` | 20 | **50** |
| Locative drill | `src/components/practice/LocativeDrill.tsx` (`DATA`) | `{ q, opts:[4], answer }` | 20 | **50** |
| Clitic drill | `src/components/practice/CliticDrill.tsx` (`DATA`) | `{ q, opts:[4], answer }` | 22 | **50** |
| Cloze sentences | `src/components/practice/ClozeEngine.tsx` (`SENTENCE_BANK`) | `{ sentence, blank, options:[4], translation, hint }` | 26 | **60** |
| ZNAM comprehension | `src/data/vocabulary.js` (`ZNAM.sections[].sentences`) | `{ en, hr, alts:[3] }` | 40 | **100** |

Out of scope for this phase: PADEZI 7-item case quiz (`grammar.js`), B2/C1 ceiling content (the separate ceiling phase), per-item difficulty tags (the in-drill difficulty phase).

## Authoring standard

- Grammatically correct, natural Croatian (authored directly per the user's standing "skip linguistic review, ship" guidance).
- CEFR-appropriate vocabulary for the drill's level; everyday, high-frequency words.
- Distractors must be plausible (right part of speech / wrong case-ending), not throwaway.
- No duplicate prompts within a pool; preserve each file's exact item shape and field names.
- Cloze: keep the case/section comments so the bank stays organized; spread new items across all cases already present.
- ZNAM: extend existing sections and/or add new sections so all sit at a comparable depth.

## Verification

- **New depth-guard test** (`src/tests/contentDepth.test.ts`): asserts each pool meets its **minimum** count (`GenitiveDrill.DATA ≥ 50`, … `ZNAM total ≥ 100`). This is the regression guard that makes "thin pool" a test failure, not a silent complaint. (Counts read by importing the modules / parsing the arrays.)
- **Shape validity:** each new item has the required fields and `options/opts` length 4 (alts length 3 for ZNAM); the answer is one of the options. Asserted in the same test where feasible.
- **Existing contract tests** for each drill stay green (they exercise the full pool).
- **Gate:** tsc 0, eslint 0, build 0, full suite green.

## Execution (batches — one commit each)

1. GenitiveDrill 20→50
2. AccusativeDrill 20→50
3. LocativeDrill 20→50
4. CliticDrill 22→50
5. ClozeEngine 26→60
6. ZNAM 40→100
7. Depth-guard test + final gate

Each batch: add items → run that drill's contract test + the depth-guard → commit. This keeps reviewable, revertable units and lets the pool counts climb verifiably.
