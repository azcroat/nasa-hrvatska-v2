# SP9 — Advanced Grammar Units Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author 10 new Croatian grammar units (5 B2 + 5 C1) to fill the curriculum's advanced-grammar gap, plus a shared `GrammarUnitDetail` renderer and `GrammarTrackScreen` integration so the new units appear in the user-facing curriculum navigator.

**Architecture:** New `src/data/grammar-advanced.js` houses 10 content constants plus a `GRAMMAR_UNIT_BY_ID` lookup map. A new `GrammarUnitDetail.tsx` component reads from the map by `unitId` and renders intro/forms/examples/tips/drills. `GrammarTrackScreen` gets 5 new B2 entries + a new C1 LEVELS block, both routing through a `pendingGrammarUnitId` state in AppRouter (mirrors SP7's `pendingStoryId` pattern).

**Tech Stack:** TypeScript strict (component layer), JavaScript (content data), Vitest + jsdom (unit), `@testing-library/react` (component + integration). No e2e — pure content + small renderer.

**Spec:** `docs/superpowers/specs/2026-05-15-sp9-advanced-grammar-units-design.md`

**Important rename:** The spec listed unit #7 as `FORMAL_REGISTER` / `formal-register`. That name COLLIDES with an existing `FORMAL_REGISTER` constant in `grammar.js` (line 2575, an A2-level Vi/ti unit). This plan renames unit #7 to `BUSINESS_REGISTER` / `business-register` with title "Poslovni jezik — Business Correspondence & Advanced Honorifics", preserving the approved pedagogical scope.

---

## File Structure

**Created:**
- `src/data/grammar-advanced.js` — 10 unit constants + `ADVANCED_UNITS` array + `GRAMMAR_UNIT_BY_ID` map
- `src/components/learn/GrammarUnitDetail.tsx` — generic unit renderer (~200 lines including inline MCQ)
- `src/tests/grammarAdvanced.schema.test.js` — 12 schema-validation tests
- `src/tests/grammarUnitDetail.test.tsx` — 6 component tests
- `src/tests/grammarAdvanced.aggregation.test.js` — 3 aggregator tests
- `src/tests/grammarTrackScreen.advanced.test.tsx` — 2 integration tests

**Modified:**
- `src/components/learn/GrammarTrackScreen.tsx` — append 5 entries to `LEVELS[3].units` (B2) + add new `LEVELS[4]` block for C1; route taps via new `launchGrammarUnit` prop
- `src/components/AppRouter.tsx` — add `pendingGrammarUnitId` state, render new `grammar_unit_detail` screen, expose `launchGrammarUnit` to GrammarTrackScreen

---

## Unit topic list (10 units, locked)

| # | id | const | cefr | title |
|---|---|---|---|---|
| 1 | `futur-ii` | `FUTUR_II` | B2 | Futur II — Future Perfect |
| 2 | `relative-clauses` | `RELATIVE_CLAUSES` | B2 | Relativne rečenice — Relative Clauses (koji) |
| 3 | `passive-voice` | `PASSIVE_VOICE` | B2 | Trpni — Passive Voice |
| 4 | `participles` | `PARTICIPLES` | B2 | Glagolski pridjevi — Participles |
| 5 | `reported-speech` | `REPORTED_SPEECH` | B2 | Indirektni govor — Reported Speech |
| 6 | `kondicional-ii` | `KONDICIONAL_II` | C1 | Kondicional II — Conditional Perfect |
| 7 | `business-register` | `BUSINESS_REGISTER` | C1 | Poslovni jezik — Business Correspondence & Advanced Honorifics |
| 8 | `verbal-nouns` | `VERBAL_NOUNS` | C1 | Glagolske imenice — Verbal Nouns |
| 9 | `reflexive-constructions` | `REFLEXIVE_CONSTRUCTIONS` | C1 | Povratni glagoli — Reflexive Constructions |
| 10 | `word-order` | `WORD_ORDER` | C1 | Red riječi — Complex Word Order |

---

## Tasks

### Task 1: Schema tests + FUTUR_II exemplar unit + grammar-advanced.js skeleton

**Files:**
- Create: `src/data/grammar-advanced.js` (with FUTUR_II + a stub `ADVANCED_UNITS = [FUTUR_II]` for now)
- Create: `src/tests/grammarAdvanced.schema.test.js`

This task ships the schema-validation tests AND the first complete unit (FUTUR_II) as the canonical exemplar. Tasks 2-3 will author the remaining 9 units by mirroring FUTUR_II's shape.

- [ ] **Step 1: Write the failing schema tests**

```js
// src/tests/grammarAdvanced.schema.test.js
import { describe, it, expect } from 'vitest';
import { ADVANCED_UNITS } from '../data/grammar-advanced.js';

describe('grammar-advanced.js schema', () => {
  it('all units have required top-level fields', () => {
    for (const u of ADVANCED_UNITS) {
      expect(u.id, `unit missing id`).toBeTruthy();
      expect(u.cefr, `${u.id} missing cefr`).toMatch(/^(B2|C1)$/);
      expect(u.title, `${u.id} missing title`).toBeTruthy();
      expect(u.subtitle, `${u.id} missing subtitle`).toBeTruthy();
      expect(u.focus, `${u.id} missing focus`).toBeTruthy();
      expect(u.intro, `${u.id} missing intro`).toBeTruthy();
      expect(Array.isArray(u.forms), `${u.id} forms not array`).toBe(true);
      expect(Array.isArray(u.examples), `${u.id} examples not array`).toBe(true);
      expect(Array.isArray(u.tips), `${u.id} tips not array`).toBe(true);
      expect(Array.isArray(u.drills), `${u.id} drills not array`).toBe(true);
    }
  });

  it('each id is a kebab-case slug, unique across the set', () => {
    const ids = new Set();
    const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const u of ADVANCED_UNITS) {
      expect(slugRe.test(u.id), `${u.id} not kebab-case`).toBe(true);
      expect(ids.has(u.id), `duplicate id ${u.id}`).toBe(false);
      ids.add(u.id);
    }
  });

  it('every cefr value is exactly B2 or C1', () => {
    for (const u of ADVANCED_UNITS) {
      expect(['B2', 'C1']).toContain(u.cefr);
    }
  });

  it('each unit meets quality floor: 6+ forms, 5+ examples, 3+ tips, 5+ drills', () => {
    for (const u of ADVANCED_UNITS) {
      expect(u.forms.length, `${u.id} <6 forms`).toBeGreaterThanOrEqual(6);
      expect(u.examples.length, `${u.id} <5 examples`).toBeGreaterThanOrEqual(5);
      expect(u.tips.length, `${u.id} <3 tips`).toBeGreaterThanOrEqual(3);
      expect(u.drills.length, `${u.id} <5 drills`).toBeGreaterThanOrEqual(5);
    }
  });

  it('every form has label + hr (en optional)', () => {
    for (const u of ADVANCED_UNITS) {
      for (const f of u.forms) {
        expect(f.label, `${u.id} form missing label`).toBeTruthy();
        expect(f.hr, `${u.id} form missing hr`).toBeTruthy();
      }
    }
  });

  it('every example has hr + en', () => {
    for (const u of ADVANCED_UNITS) {
      for (const e of u.examples) {
        expect(e.hr, `${u.id} example missing hr`).toBeTruthy();
        expect(e.en, `${u.id} example missing en`).toBeTruthy();
      }
    }
  });

  it('every tip is a non-empty string', () => {
    for (const u of ADVANCED_UNITS) {
      for (const t of u.tips) {
        expect(typeof t).toBe('string');
        expect(t.length).toBeGreaterThan(0);
      }
    }
  });

  it('every drill has q, opts (length 4), correct', () => {
    for (const u of ADVANCED_UNITS) {
      for (const d of u.drills) {
        expect(d.q, `${u.id} drill missing q`).toBeTruthy();
        expect(Array.isArray(d.opts), `${u.id} drill opts not array`).toBe(true);
        expect(d.opts.length, `${u.id} drill opts !=4`).toBe(4);
        expect(d.correct !== undefined, `${u.id} drill missing correct`).toBe(true);
      }
    }
  });

  it('when correct is a number, it points to a valid index in opts', () => {
    for (const u of ADVANCED_UNITS) {
      for (const d of u.drills) {
        if (typeof d.correct === 'number') {
          expect(d.correct).toBeGreaterThanOrEqual(0);
          expect(d.correct).toBeLessThan(d.opts.length);
        }
      }
    }
  });

  // The "exactly 10 / 5 B2 / 5 C1" assertions are intentionally relaxed during
  // Task 1 (only FUTUR_II ships). Tasks 2-3 will tighten these once all 10 units
  // are present. For Task 1's commit, the suite asserts the schema shape only.
  it('Task 1 baseline: ADVANCED_UNITS has at least 1 unit', () => {
    expect(ADVANCED_UNITS.length).toBeGreaterThanOrEqual(1);
  });

  it('Task 1 baseline: the FUTUR_II exemplar is present', () => {
    expect(ADVANCED_UNITS.find((u) => u.id === 'futur-ii')).toBeTruthy();
  });

  it('no drill option string is empty', () => {
    for (const u of ADVANCED_UNITS) {
      for (const d of u.drills) {
        for (const o of d.opts) {
          expect(typeof o).toBe('string');
          expect(o.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/grammarAdvanced.schema.test.js`
Expected: `Cannot find module '../data/grammar-advanced.js'`.

- [ ] **Step 3: Create `src/data/grammar-advanced.js` with FUTUR_II + skeleton aggregator**

```js
// src/data/grammar-advanced.js
// SP9: B2 + C1 grammar units. 10 total (5 B2 + 5 C1).
// Schema mirrors existing grammar.js exports (ASPECT_PAIRS shape).
//
// Each unit has:
//   id (kebab-case), cefr, title, subtitle, focus (comma-separated keywords),
//   intro (2-3 sentence prose),
//   forms (6+ rows of {label, hr, en?}),
//   examples (5+ entries of {hr, en, note?}),
//   tips (3+ strings),
//   drills (5+ {q, qEn?, opts (length 4), correct (index|string), explain?}).

export const FUTUR_II = {
  id: 'futur-ii',
  cefr: 'B2',
  title: 'Futur II — Future Perfect',
  subtitle: 'Used in time clauses ("when/if I have done X") and uncertainty about past',
  focus: 'futur ii, future perfect, conditional time clauses, kad ako future',
  intro:
    'Futur II is formed with the future of "biti" (budem, budeš, bude, budemo, budete, budu) plus the past participle. It appears almost exclusively in subordinate clauses introduced by ako (if), kad (when), čim (as soon as), or dok (while/until) when the main verb is in Futur I. Native speakers also use it to express uncertainty about a past event ("must have / might have").',
  forms: [
    { label: 'ja', hr: 'budem došao / došla', en: 'I will have come' },
    { label: 'ti', hr: 'budeš došao / došla', en: 'you will have come' },
    { label: 'on/ona/ono', hr: 'bude došao / došla / došlo', en: 's/he/it will have come' },
    { label: 'mi', hr: 'budemo došli / došle', en: 'we will have come' },
    { label: 'vi', hr: 'budete došli / došle', en: 'you (pl) will have come' },
    { label: 'oni/one/ona', hr: 'budu došli / došle / došla', en: 'they will have come' },
  ],
  examples: [
    {
      hr: 'Kad budem završio posao, nazvat ću te.',
      en: 'When I have finished work, I will call you.',
      note: 'Time clause: Futur II in `kad` clause + Futur I in main clause.',
    },
    {
      hr: 'Ako budeš imao vremena, dođi.',
      en: 'If you have time, come.',
      note: '`ako` clauses with future reference take Futur II, not Futur I.',
    },
    {
      hr: 'Čim budem stigao, javit ću ti.',
      en: 'As soon as I arrive, I will let you know.',
    },
    {
      hr: 'Dok ne budeš naučio ovo, nećeš proći ispit.',
      en: 'Until you have learned this, you will not pass the exam.',
    },
    {
      hr: 'Bude da je već otišao.',
      en: 'He has probably already left.',
      note: 'Colloquial — expresses speculation about a past event.',
    },
  ],
  tips: [
    'Always uses a past participle (radni glagolski pridjev) — same form used in Past Tense.',
    'Almost never appears in a main clause — look for ako / kad / čim / dok triggers.',
    'In modern speech, Futur I sometimes replaces Futur II in time clauses; both are accepted but Futur II is the literary / standard choice.',
    'The participle agrees in gender + number with the subject: muški došao, ženski došla, množina došli.',
  ],
  drills: [
    {
      q: 'Choose the correct form: Kad ____ vremena, javit ću se.',
      qEn: 'When I have time, I will get in touch.',
      opts: ['budem imati', 'budem imao', 'bit ću imao', 'imam'],
      correct: 1,
      explain: '`budem imao` — Futur II requires past participle after `budem`.',
    },
    {
      q: 'Ako ____ kasno, ne čekaj.',
      qEn: 'If I am late, do not wait.',
      opts: ['bit ću došao', 'budem došao', 'budem kasniti', 'budem zakasnio'],
      correct: 3,
      explain:
        '`budem zakasnio` — `kasniti` is imperfective; perfective `zakasniti` fits a single completed future action.',
    },
    {
      q: 'Čim ____ , idem doma.',
      qEn: 'As soon as I have finished, I am going home.',
      opts: ['budem završiti', 'završim', 'budem završio', 'bit ću završio'],
      correct: 2,
      explain:
        '`budem završio` — Futur II in `čim` clause. Present tense `završim` is also acceptable colloquially.',
    },
    {
      q: 'Singular feminine: "ona ____ ."',
      qEn: 'She will have come.',
      opts: ['bude došao', 'bude došla', 'bude došlo', 'budu došle'],
      correct: 1,
      explain: 'Feminine singular → `došla`. Participle agrees with subject gender.',
    },
    {
      q: 'Translate: "Until they have read the book, do not start the discussion."',
      opts: [
        'Dok ne budu pročitali knjigu, ne počinjite raspravu.',
        'Dok ne bude pročitao knjigu, ne počinjite raspravu.',
        'Dok ne čitaju knjigu, ne počinjite raspravu.',
        'Dok nisu pročitali knjigu, ne počinjite raspravu.',
      ],
      correct: 0,
      explain:
        'Plural subject `oni` → `budu pročitali`. `dok ne` introduces a future time clause taking Futur II.',
    },
  ],
};

// Aggregated array — Tasks 2-3 will extend this to all 10 units.
export const ADVANCED_UNITS = [FUTUR_II];

// O(1) lookup by id for GrammarUnitDetail.
export const GRAMMAR_UNIT_BY_ID = Object.fromEntries(ADVANCED_UNITS.map((u) => [u.id, u]));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/tests/grammarAdvanced.schema.test.js`
Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add src/data/grammar-advanced.js src/tests/grammarAdvanced.schema.test.js
git commit -m "feat(sp9): grammar-advanced.js schema + FUTUR_II exemplar + 11 schema tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 2: Remaining 4 B2 units (RELATIVE_CLAUSES, PASSIVE_VOICE, PARTICIPLES, REPORTED_SPEECH)

**Files:**
- Modify: `src/data/grammar-advanced.js`

This task adds the remaining 4 B2 units. **Mirror the FUTUR_II shape exactly** — same field structure, same quality floor (6+ forms, 5+ examples, 3+ tips, 5+ drills per unit). Content is authored from Croatian linguistics in-memory expertise per the locked feedback ("Skip linguistic review for Croatian content drafts; use in-memory expertise and ship").

- [ ] **Step 1: Add the 4 new B2 unit constants**

Each unit should be authored at the level of the FUTUR_II exemplar from Task 1. Below are detailed authoring briefs for each — the subagent expands each into a full unit matching FUTUR_II's shape.

**Unit 2: `RELATIVE_CLAUSES` (B2)**

```
id: 'relative-clauses'
title: 'Relativne rečenice — Relative Clauses (koji)'
subtitle: 'koji / koja / koje + cases — agreeing relative pronouns'
focus: 'relative clauses, koji, koja, koje, relative pronouns, subordinate clauses'
intro: Croatian relative clauses use `koji/koja/koje` (which agrees with the antecedent in gender + number) declined into whatever case the verb of the relative clause requires. Mention the common confusion: case is determined by the role within the relative clause, NOT by the antecedent's case.
forms: declension table — 6 rows showing koji in nom/gen/dat/acc/loc/ins, masculine animate as primary with feminine + neuter notes
examples: 5+ sentences showing koji in different cases (e.g. "Žena koja stoji"; "Žena koju vidim"; "Žena s kojom razgovaram"; "Knjiga o kojoj sam ti govorio"; "Ljudi kojima sam dao knjigu")
tips: case in the clause vs case of antecedent; animate vs inanimate masculine accusative; using `koji` for things (rarely `što`); avoid English-style stacked clauses
drills: 5+ MCQs targeting case-agreement decisions
```

**Unit 3: `PASSIVE_VOICE` (B2)**

```
id: 'passive-voice'
title: 'Trpni — Passive Voice'
subtitle: 'Passive constructions: je + napisan/napisana/napisano'
focus: 'passive voice, trpni, je napisan, biti + past passive participle'
intro: Passive voice uses `biti` + past passive participle (trpni glagolski pridjev). Note that Croatian prefers active voice or `se`-constructions in everyday speech; trpni is more literary/formal. Tense: present `je napisan`, past `bio je napisan`, future `bit će napisan`.
forms: 6+ rows — past passive participle endings for major verb classes (pisati → pisan, čitati → čitan, voljeti → voljen, dati → dan, pročitati → pročitan, kupiti → kupljen showing the j-mutation)
examples: 5+ across tenses and genders (Knjiga je napisana; Auto je prodan; Pisma su poslana; Bio je voljen; Bit će objavljeno)
tips: trpni's literary register; `se` passives more common; agreement; perfective vs imperfective passive nuance
drills: 5+ MCQs targeting passive formation + agreement
```

**Unit 4: `PARTICIPLES` (B2)**

```
id: 'participles'
title: 'Glagolski pridjevi — Participles'
subtitle: 'Past + passive participles, their declension, and uses'
focus: 'participles, glagolski pridjev radni, glagolski pridjev trpni, past participle, passive participle'
intro: Croatian has two participles: radni (active past, used to form past tense + Futur II + Kondicional) and trpni (passive past, used in passive voice + as adjective). Both decline like adjectives. The radni form is what English calls a "past participle" but is used as a verb auxiliary.
forms: 6+ rows comparing radni vs trpni for several verbs (pisati: pisao/pisan; čitati: čitao/čitan; doći: došao/—; piti: pio/pijen; pasti: pao/—; otvoriti: otvorio/otvoren)
examples: 5+ showing both participles in different roles (Pisao sam pismo; Pismo je napisano; Otvorena knjiga; Slomljen tanjur; Razgovarali smo)
tips: which verbs lack trpni (intransitives); j-mutation in -iti verbs; participle agreement; literary vs colloquial uses
drills: 5+ MCQs on participle form + agreement
```

**Unit 5: `REPORTED_SPEECH` (B2)**

```
id: 'reported-speech'
title: 'Indirektni govor — Reported Speech'
subtitle: 'da + present clauses, tense agreement, embedded questions'
focus: 'reported speech, indirektni govor, da clauses, embedded questions, kaže da'
intro: Croatian reported speech is much simpler than English: there is no "backshift" of tenses. "He said he is coming" → `Rekao je da dolazi` (NOT `Rekao je da je dolazio`). Embedded yes/no questions use `da li` or particle `li`; embedded wh-questions use the same wh-word.
forms: 6+ rows of common reporting verbs (reći, kazati, misliti, znati, pitati, čuti) with example tense + complement
examples: 5+ showing direct → reported transformation, no backshift, embedded questions (Pitao je dolazim li; Rekao je da dolazi; Misli da nas voli; Zna gdje smo; Čula je da pjevaš)
tips: no backshift unlike English; `da li` vs `je li`; mood preservation; reported imperative uses `da` + present
drills: 5+ MCQs targeting tense-preservation + question particle choice
```

After authoring each unit, append it to the `ADVANCED_UNITS` array and rebuild the `GRAMMAR_UNIT_BY_ID` lookup:

```js
export const ADVANCED_UNITS = [
  FUTUR_II,
  RELATIVE_CLAUSES,
  PASSIVE_VOICE,
  PARTICIPLES,
  REPORTED_SPEECH,
];

export const GRAMMAR_UNIT_BY_ID = Object.fromEntries(ADVANCED_UNITS.map((u) => [u.id, u]));
```

- [ ] **Step 2: Run schema tests; they should still pass with the 5 B2 units**

Run: `npx vitest run src/tests/grammarAdvanced.schema.test.js`
Expected: 11 passed (the same schema tests now validate 5 units).

If a unit fails the quality floor or schema check, the test error will name the unit + missing field. Fix the unit's content and re-run.

- [ ] **Step 3: Commit**

```bash
git add src/data/grammar-advanced.js
git commit -m "feat(sp9): 4 more B2 units — RELATIVE_CLAUSES, PASSIVE_VOICE, PARTICIPLES, REPORTED_SPEECH

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 3: 5 C1 units

**Files:**
- Modify: `src/data/grammar-advanced.js`

Same authoring discipline as Task 2 — mirror FUTUR_II's shape exactly.

- [ ] **Step 1: Add the 5 C1 unit constants**

**Unit 6: `KONDICIONAL_II` (C1)**

```
id: 'kondicional-ii'
title: 'Kondicional II — Conditional Perfect'
subtitle: 'bio bih + past participle — counterfactual past'
focus: 'kondicional ii, conditional perfect, counterfactual, bio bih dosao, da je'
intro: Kondicional II expresses past counterfactuals — "I would have come" (but didn't). Formed with kondicional of biti (bio bih / bila bih) + past participle. Often paired with `da je` clauses for the unfulfilled condition. Distinct from Kondicional I (`bih došao` — "I would come").
forms: 6 rows of "bio bih došao" across persons/genders
examples: 5+ showing counterfactual pairs (Da sam imao vremena, bio bih došao; Da nije kasnila, ne bismo zakasnili; Bilo bi lakše da smo...)
tips: pairs with `da` clauses; literary register; difference from Kond I; gender + number agreement on participle
drills: 5+ MCQs on counterfactual constructions
```

**Unit 7: `BUSINESS_REGISTER` (C1)** — NOTE: renamed from FORMAL_REGISTER to avoid name collision with existing A2 unit

```
id: 'business-register'
title: 'Poslovni jezik — Business Correspondence & Advanced Honorifics'
subtitle: 'Formal letters, polite imperatives, advanced gospodin/gospodja usage'
focus: 'business register, formal correspondence, gospodin, gospodja, polite imperative, business email'
intro: Croatian business and formal correspondence uses specific honorific patterns that go beyond the basic Vi/ti distinction. Gospodin/Gospodja with capital G in formal address. Polite imperatives use `molim Vas + infinitive` or third-person plural. Business emails follow standard templates.
forms: 6+ rows showing formal patterns (Poštovani gospodine X; Cijenjeni klijenti; S poštovanjem; Molim Vas da; Hvala Vam na razumijevanju; Srdačan pozdrav)
examples: 5+ from business correspondence
tips: capitalization of Vi/Vam; gospodin declension; formal vs informal greetings; sign-off conventions
drills: 5+ MCQs on register choice + form selection
```

**Unit 8: `VERBAL_NOUNS` (C1)**

```
id: 'verbal-nouns'
title: 'Glagolske imenice — Verbal Nouns'
subtitle: 'pisanje, čitanje, putovanje — gerund-like nouns from verbs'
focus: 'verbal nouns, glagolska imenica, gerund, pisanje, citanje, -nje suffix'
intro: Verbal nouns are nominalized verbs ending in -nje (pisanje, čitanje, putovanje). They decline as neuter nouns and are extremely productive in formal Croatian. Take cases governed by their prepositions, NOT by the verb they derive from.
forms: 6+ rows showing common verbal nouns + case forms (pisanje, pisanja, pisanju, pisanje, pisanju, pisanjem)
examples: 5+ in context, especially with prepositions (umoran od putovanja; prije pisanja; tijekom čitanja; nakon razgovora; svjedoči o brojanju)
tips: -nje formation rules; aspect of source verb carries over; case after preposition; vs infinitive use
drills: 5+ MCQs on formation + case usage
```

**Unit 9: `REFLEXIVE_CONSTRUCTIONS` (C1)**

```
id: 'reflexive-constructions'
title: 'Povratni glagoli — Reflexive Constructions'
subtitle: 'se vs sebe, true reflexives, reciprocals, passives'
focus: 'reflexive, povratni, se vs sebe, reciprocal, povratni glagoli'
intro: Croatian `se` is overloaded: true reflexive (umivati se), reciprocal (vidjeli smo se), middle voice (knjiga se prodaje), inherently reflexive verbs (smijati se). `sebe` is the emphatic reflexive when the subject acts on itself in a marked way. Mastering the distinction is a hallmark of C1 fluency.
forms: 6+ rows of common reflexive verbs grouped by type
examples: 5+ showing each `se` function + sebe contrast (Umivam se; Vidjeli su se; Knjiga se prodaje dobro; Smijem se tvojoj šali; Voli sebe iznad svega)
tips: when se is OBLIGATORY (smijati se); when sebe replaces se for emphasis; reciprocal vs reflexive ambiguity; clitic placement
drills: 5+ MCQs distinguishing the 4 functions
```

**Unit 10: `WORD_ORDER` (C1)**

```
id: 'word-order'
title: 'Red riječi — Complex Word Order'
subtitle: 'Clitic placement, topicalization, fronting for emphasis'
focus: 'word order, red rijeci, clitic placement, topicalization, fronting, second position'
intro: Croatian word order is "free" but governed by tight rules for clitics (second-position / Wackernagel position). Sentence-initial elements carry topic prominence. Object fronting marks contrast. Adverbs of time vs manner have fixed slots. Mastery of word order separates fluent C1 speakers from competent B2 ones.
forms: 6+ rows showing typical clitic clusters in different sentence types
examples: 5+ contrasting word orders (Ja sam mu to dala vs Dala sam mu to ja; Knjigu sam mu dala vs Dala sam mu knjigu)
tips: clitic order (li, je/sam/etc, mi/ti/mu, ga/je/ih, se); second-position rule; topic vs comment; literary inversion
drills: 5+ MCQs on correct clitic placement
```

After authoring all 5, update the aggregator:

```js
export const ADVANCED_UNITS = [
  FUTUR_II,
  RELATIVE_CLAUSES,
  PASSIVE_VOICE,
  PARTICIPLES,
  REPORTED_SPEECH,
  KONDICIONAL_II,
  BUSINESS_REGISTER,
  VERBAL_NOUNS,
  REFLEXIVE_CONSTRUCTIONS,
  WORD_ORDER,
];

export const GRAMMAR_UNIT_BY_ID = Object.fromEntries(ADVANCED_UNITS.map((u) => [u.id, u]));
```

- [ ] **Step 2: Tighten the Task 1 baseline assertions to the final state**

Update `src/tests/grammarAdvanced.schema.test.js` — change the two baseline assertions to assert the full 10-unit state:

Find:
```js
  it('Task 1 baseline: ADVANCED_UNITS has at least 1 unit', () => {
    expect(ADVANCED_UNITS.length).toBeGreaterThanOrEqual(1);
  });

  it('Task 1 baseline: the FUTUR_II exemplar is present', () => {
    expect(ADVANCED_UNITS.find((u) => u.id === 'futur-ii')).toBeTruthy();
  });
```

Replace with:
```js
  it('ADVANCED_UNITS has exactly 10 entries', () => {
    expect(ADVANCED_UNITS).toHaveLength(10);
  });

  it('exactly 5 B2 + 5 C1', () => {
    const b2 = ADVANCED_UNITS.filter((u) => u.cefr === 'B2');
    const c1 = ADVANCED_UNITS.filter((u) => u.cefr === 'C1');
    expect(b2).toHaveLength(5);
    expect(c1).toHaveLength(5);
  });
```

- [ ] **Step 3: Run schema tests**

Run: `npx vitest run src/tests/grammarAdvanced.schema.test.js`
Expected: 11 passed.

- [ ] **Step 4: Commit**

```bash
git add src/data/grammar-advanced.js src/tests/grammarAdvanced.schema.test.js
git commit -m "feat(sp9): 5 C1 units complete (kondicional ii, business register, verbal nouns, reflexive, word order)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 4: Aggregator tests + GRAMMAR_UNIT_BY_ID validation

**Files:**
- Create: `src/tests/grammarAdvanced.aggregation.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/tests/grammarAdvanced.aggregation.test.js
import { describe, it, expect } from 'vitest';
import { ADVANCED_UNITS, GRAMMAR_UNIT_BY_ID } from '../data/grammar-advanced.js';

describe('grammar-advanced.js aggregation', () => {
  it('GRAMMAR_UNIT_BY_ID has an entry for every unit in ADVANCED_UNITS', () => {
    for (const u of ADVANCED_UNITS) {
      expect(GRAMMAR_UNIT_BY_ID[u.id]).toBe(u);
    }
  });

  it('GRAMMAR_UNIT_BY_ID has no extra entries beyond ADVANCED_UNITS', () => {
    expect(Object.keys(GRAMMAR_UNIT_BY_ID)).toHaveLength(ADVANCED_UNITS.length);
  });

  it('no duplicate unit ids across ADVANCED_UNITS', () => {
    const ids = ADVANCED_UNITS.map((u) => u.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run tests; should pass already since Task 3 wired the aggregator**

Run: `npx vitest run src/tests/grammarAdvanced.aggregation.test.js`
Expected: 3 passed.

- [ ] **Step 3: Commit**

```bash
git add src/tests/grammarAdvanced.aggregation.test.js
git commit -m "test(sp9): aggregator + GRAMMAR_UNIT_BY_ID validation (3 tests)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 5: `GrammarUnitDetail` component + 6 tests

**Files:**
- Create: `src/components/learn/GrammarUnitDetail.tsx`
- Create: `src/tests/grammarUnitDetail.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/tests/grammarUnitDetail.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GrammarUnitDetail from '../components/learn/GrammarUnitDetail';

describe('GrammarUnitDetail', () => {
  it('renders unit title, subtitle, intro for a known unitId', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByText(/Futur II/)).toBeInTheDocument();
    expect(screen.getByText(/Future Perfect/i)).toBeInTheDocument();
    // Intro paragraph contains characteristic substrings
    expect(screen.getByText(/budem/i)).toBeInTheDocument();
  });

  it('renders all forms in a table-like layout', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    // FUTUR_II has 6 form rows — each label appears at least once
    expect(screen.getByText('ja')).toBeInTheDocument();
    expect(screen.getByText('ti')).toBeInTheDocument();
    expect(screen.getByText('mi')).toBeInTheDocument();
  });

  it('renders all examples with HR + EN', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    // At least one example HR + EN pair from FUTUR_II
    expect(screen.getByText(/Kad budem završio posao/i)).toBeInTheDocument();
    expect(screen.getByText(/When I have finished work/i)).toBeInTheDocument();
  });

  it('renders all tips as list items', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByText(/past participle/i)).toBeInTheDocument();
  });

  it('renders the first drill and shows correct/incorrect feedback on click', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    // First drill: q starts with "Choose the correct form: Kad ____ vremena"
    expect(screen.getByText(/Kad ____ vremena/)).toBeInTheDocument();
    // Tap the correct option (index 1, "budem imao")
    const correctOption = screen.getByRole('button', { name: /budem imao/i });
    fireEvent.click(correctOption);
    // Feedback area shows the correct-answer explanation
    expect(screen.getByText(/Futur II requires past participle/i)).toBeInTheDocument();
  });

  it('falls through to "Unit not found" when unitId is unknown', () => {
    render(<GrammarUnitDetail unitId="does-not-exist" goBack={() => {}} />);
    expect(screen.getByText(/Unit not found/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/tests/grammarUnitDetail.test.tsx`
Expected: `Cannot find module '../components/learn/GrammarUnitDetail'`.

- [ ] **Step 3: Implement the component**

Create `src/components/learn/GrammarUnitDetail.tsx`:

```tsx
// src/components/learn/GrammarUnitDetail.tsx
// SP9: generic detail renderer for a B2/C1 grammar unit. Reads from
// GRAMMAR_UNIT_BY_ID by unitId, renders intro/forms/examples/tips/drills.
// Inline MCQ flow — no extracted shared component (refactor in SP9b if duplication grows).
import React, { useState } from 'react';
import { GRAMMAR_UNIT_BY_ID } from '../../data/grammar-advanced.js';

export interface GrammarUnitDetailProps {
  unitId: string;
  goBack: () => void;
}

interface FormRow {
  label: string;
  hr: string;
  en?: string;
}
interface ExampleRow {
  hr: string;
  en: string;
  note?: string;
}
interface DrillItem {
  q: string;
  qEn?: string;
  opts: string[];
  correct: number | string;
  explain?: string;
}
interface GrammarUnit {
  id: string;
  cefr: string;
  title: string;
  subtitle: string;
  focus: string;
  intro: string;
  forms: FormRow[];
  examples: ExampleRow[];
  tips: string[];
  drills: DrillItem[];
}

const STYLES = {
  wrap: { padding: '16px', maxWidth: 720, margin: '0 auto' },
  back: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    cursor: 'pointer',
    fontSize: 14,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: 800 as const, color: 'var(--heading)', margin: '4px 0' },
  subtitle: { fontSize: 14, color: 'var(--subtext)', fontStyle: 'italic' as const, marginBottom: 16 },
  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: '0.08em',
    fontWeight: 700 as const,
    color: 'var(--subtext)',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  intro: { fontSize: 14, lineHeight: 1.6, color: 'var(--heading)' },
  table: { display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 6, fontSize: 13 },
  exCard: {
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  drillQ: { fontSize: 15, fontWeight: 600 as const, marginBottom: 10 },
  drillOpt: (state: 'idle' | 'correct' | 'wrong') => ({
    display: 'block' as const,
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${state === 'correct' ? '#16a34a' : state === 'wrong' ? '#dc2626' : 'var(--card-b)'}`,
    background: state === 'idle' ? 'var(--card)' : state === 'correct' ? '#dcfce7' : '#fee2e2',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500 as const,
    cursor: state === 'idle' ? 'pointer' : 'default',
    marginBottom: 6,
    textAlign: 'left' as const,
    color: 'var(--heading)',
  }),
  drillExplain: { fontSize: 13, color: 'var(--subtext)', marginTop: 8, fontStyle: 'italic' as const },
  notFound: { padding: 24, textAlign: 'center' as const, color: 'var(--subtext)' },
};

export default function GrammarUnitDetail({ unitId, goBack }: GrammarUnitDetailProps): React.ReactElement {
  const lookup = GRAMMAR_UNIT_BY_ID as Record<string, GrammarUnit | undefined>;
  const unit = lookup[unitId];
  const [drillIdx, setDrillIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  if (!unit) {
    return (
      <div style={STYLES.wrap}>
        <button style={STYLES.back} onClick={goBack}>← Back</button>
        <div style={STYLES.notFound}>Unit not found.</div>
      </div>
    );
  }

  const drill = unit.drills[drillIdx];
  const correctIdx = typeof drill?.correct === 'number' ? drill.correct : -1;

  return (
    <div style={STYLES.wrap} data-testid="grammar-unit-detail" data-unit-id={unit.id}>
      <button style={STYLES.back} onClick={goBack}>← Back</button>
      <div style={STYLES.title}>{unit.title}</div>
      <div style={STYLES.subtitle}>{unit.subtitle}</div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Intro</div>
        <div style={STYLES.intro}>{unit.intro}</div>
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Forms</div>
        <div style={STYLES.table}>
          {unit.forms.map((f, i) => (
            <React.Fragment key={`form-${i}`}>
              <div style={{ fontWeight: 700 }}>{f.label}</div>
              <div>{f.hr}</div>
              <div style={{ color: 'var(--subtext)', fontStyle: 'italic' }}>{f.en ?? ''}</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Examples</div>
        {unit.examples.map((e, i) => (
          <div key={`ex-${i}`} style={STYLES.exCard}>
            <div style={{ fontWeight: 600 }}>{e.hr}</div>
            <div style={{ color: 'var(--subtext)', marginTop: 4 }}>{e.en}</div>
            {e.note ? (
              <div style={{ fontSize: 12, color: 'var(--info)', marginTop: 6 }}>💡 {e.note}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Tips</div>
        <ul style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
          {unit.tips.map((t, i) => (
            <li key={`tip-${i}`}>{t}</li>
          ))}
        </ul>
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>
          Practice ({drillIdx + 1} / {unit.drills.length})
        </div>
        {drill ? (
          <div>
            <div style={STYLES.drillQ}>{drill.q}</div>
            {drill.opts.map((opt, i) => {
              const state =
                chosen === null
                  ? 'idle'
                  : i === correctIdx
                    ? 'correct'
                    : i === chosen
                      ? 'wrong'
                      : 'idle';
              return (
                <button
                  key={`opt-${i}`}
                  style={STYLES.drillOpt(state as 'idle' | 'correct' | 'wrong')}
                  disabled={chosen !== null}
                  onClick={() => setChosen(i)}
                >
                  {opt}
                </button>
              );
            })}
            {chosen !== null && drill.explain ? (
              <div style={STYLES.drillExplain}>{drill.explain}</div>
            ) : null}
            {chosen !== null && drillIdx < unit.drills.length - 1 ? (
              <button
                style={{
                  marginTop: 12,
                  padding: '8px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
                onClick={() => {
                  setDrillIdx((i) => i + 1);
                  setChosen(null);
                }}
              >
                Next →
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/tests/grammarUnitDetail.test.tsx`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/learn/GrammarUnitDetail.tsx src/tests/grammarUnitDetail.test.tsx
git commit -m "feat(sp9): GrammarUnitDetail renderer + 6 component tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 6: GrammarTrackScreen integration + AppRouter wiring + 2 integration tests

**Files:**
- Modify: `src/components/learn/GrammarTrackScreen.tsx`
- Modify: `src/components/AppRouter.tsx`
- Create: `src/tests/grammarTrackScreen.advanced.test.tsx`

- [ ] **Step 1: Inspect existing GrammarTrackScreen structure**

Read `src/components/learn/GrammarTrackScreen.tsx`. The `LEVELS` array at line 7 currently has 4 entries: A1, A2, B1, B2 (with B2 starting at line 231). Each entry has `{id, label, color, bg, border, headerBg, units}`. Each unit has `{id, icon, title, desc, screen, qs}`.

You're looking for:
1. The closing `]` of the LEVELS array
2. The B2 entry's `units` array closing (to append 5 new entries before it)
3. Where unit taps are handled — search for `setScr(` or `unit.screen` to find the routing site

- [ ] **Step 2: Append 5 new B2 units to LEVELS[3].units**

Inside the B2 block (LEVELS[3]) `units` array, append these 5 entries before the closing `]`:

```js
      {
        id: 'futur-ii',
        icon: '⏳',
        title: 'Futur II — Future Perfect',
        desc: 'Time-clause conditionals — kad/ako/čim/dok',
        screen: 'grammar_unit_detail',
        unitId: 'futur-ii',
        qs: 5,
      },
      {
        id: 'relative-clauses',
        icon: '🔗',
        title: 'Relativne rečenice (koji)',
        desc: 'koji/koja/koje + cases — the biggest B1→B2 leap',
        screen: 'grammar_unit_detail',
        unitId: 'relative-clauses',
        qs: 5,
      },
      {
        id: 'passive-voice',
        icon: '🔄',
        title: 'Trpni — Passive Voice',
        desc: 'je napisana, bio prodan — biti + past passive participle',
        screen: 'grammar_unit_detail',
        unitId: 'passive-voice',
        qs: 5,
      },
      {
        id: 'participles',
        icon: '📜',
        title: 'Glagolski pridjevi — Participles',
        desc: 'Past + passive participle declension and agreement',
        screen: 'grammar_unit_detail',
        unitId: 'participles',
        qs: 5,
      },
      {
        id: 'reported-speech',
        icon: '💬',
        title: 'Indirektni govor — Reported Speech',
        desc: 'da + present clauses, embedded questions, no backshift',
        screen: 'grammar_unit_detail',
        unitId: 'reported-speech',
        qs: 5,
      },
```

- [ ] **Step 3: Add a new LEVELS[4] block for C1**

After the closing `]` of the B2 block (look for `},` closing the B2 entry) and before the outer LEVELS array closes, add:

```js
  {
    id: 'C1',
    label: 'C1 — Advanced',
    color: '#7e22ce',
    bg: 'linear-gradient(135deg,#faf5ff,#f3e8ff)',
    border: '#e9d5ff',
    headerBg: 'linear-gradient(135deg,#7e22ce,#6b21a8)',
    units: [
      {
        id: 'kondicional-ii',
        icon: '🌀',
        title: 'Kondicional II — Conditional Perfect',
        desc: 'bio bih došao — counterfactual past',
        screen: 'grammar_unit_detail',
        unitId: 'kondicional-ii',
        qs: 5,
      },
      {
        id: 'business-register',
        icon: '📨',
        title: 'Poslovni jezik — Business & Formal',
        desc: 'Business correspondence, advanced honorifics, polite imperatives',
        screen: 'grammar_unit_detail',
        unitId: 'business-register',
        qs: 5,
      },
      {
        id: 'verbal-nouns',
        icon: '📝',
        title: 'Glagolske imenice — Verbal Nouns',
        desc: 'pisanje, čitanje, putovanje — -nje gerunds',
        screen: 'grammar_unit_detail',
        unitId: 'verbal-nouns',
        qs: 5,
      },
      {
        id: 'reflexive-constructions',
        icon: '🔁',
        title: 'Povratni glagoli — Reflexive Constructions',
        desc: 'se vs sebe, reciprocals, middle voice, inherent reflexives',
        screen: 'grammar_unit_detail',
        unitId: 'reflexive-constructions',
        qs: 5,
      },
      {
        id: 'word-order',
        icon: '🔀',
        title: 'Red riječi — Complex Word Order',
        desc: 'Clitic placement, topicalization, fronting',
        screen: 'grammar_unit_detail',
        unitId: 'word-order',
        qs: 5,
      },
    ],
  },
];
```

- [ ] **Step 4: Wire the unitId through the tap handler**

Find where unit taps are handled — search for `unit.screen` or where the screen is set when a unit card is clicked. In that handler, add a check: if `unit.screen === 'grammar_unit_detail'` AND `unit.unitId` is set, call the new `launchGrammarUnit(unit.unitId)` prop. Otherwise, route via the existing `setScr(unit.screen)` path.

Add a new prop to GrammarTrackScreen's props interface:

```tsx
interface GrammarTrackScreenProps {
  // ... existing props ...
  launchGrammarUnit?: (unitId: string) => void;
}
```

And destructure it in the function signature.

In the tap handler:

```tsx
function handleUnitTap(unit: { screen: string; unitId?: string }) {
  if (unit.screen === 'grammar_unit_detail' && unit.unitId && launchGrammarUnit) {
    launchGrammarUnit(unit.unitId);
    return;
  }
  // ... existing routing via setScr(unit.screen) ...
}
```

The exact name of the existing handler depends on the file's current structure — search and adapt.

- [ ] **Step 5: Modify AppRouter to add `pendingGrammarUnitId` state + new screen**

Open `src/components/AppRouter.tsx`. Find the section with other `useState` calls (where SP7's `pendingStoryId` lives). Add:

```tsx
const [pendingGrammarUnitId, setPendingGrammarUnitId] = useState<string | null>(null);
```

Find where the `GradedInputScreen` is rendered (the SP7 pattern). Add a peer screen render block — somewhere in the screen-routing conditional chain, add:

```tsx
{currentScreen === 'grammar_unit_detail' && pendingGrammarUnitId && (
  <ScreenErrorBoundary key="grammar_unit_detail" name="grammar_unit_detail">
    <GrammarUnitDetail
      unitId={pendingGrammarUnitId}
      goBack={() => {
        setPendingGrammarUnitId(null);
        goBack();
      }}
    />
  </ScreenErrorBoundary>
)}
```

Add the import at the top of AppRouter:

```tsx
const GrammarUnitDetail = lazyWithReload(() => import('./learn/GrammarUnitDetail'));
```

(Match the existing `lazyWithReload` pattern used for other screens.)

Pass `launchGrammarUnit` to GrammarTrackScreen at its render site:

```tsx
<GrammarTrackScreen
  /* existing props */
  launchGrammarUnit={(unitId: string) => {
    setPendingGrammarUnitId(unitId);
    setScr('grammar_unit_detail');
  }}
/>
```

- [ ] **Step 6: Write integration tests**

Create `src/tests/grammarTrackScreen.advanced.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock minimal context dependencies
vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    setScr: vi.fn(),
    sCurEx: vi.fn(),
    currentScreen: 'grammartrack',
    award: vi.fn(),
  }),
}));

import GrammarTrackScreen from '../components/learn/GrammarTrackScreen';

describe('GrammarTrackScreen — SP9 advanced units', () => {
  it('B2 level shows the 5 new SP9 advanced units alongside existing ones', () => {
    render(<GrammarTrackScreen launchGrammarUnit={() => {}} />);
    // Click the B2 level tab
    fireEvent.click(screen.getByText(/B2/));
    // The 5 SP9 B2 units should be visible
    expect(screen.getByText(/Futur II/i)).toBeInTheDocument();
    expect(screen.getByText(/Relativne rečenice/i)).toBeInTheDocument();
    expect(screen.getByText(/Trpni/i)).toBeInTheDocument();
    expect(screen.getByText(/Glagolski pridjevi/i)).toBeInTheDocument();
    expect(screen.getByText(/Indirektni govor/i)).toBeInTheDocument();
  });

  it('C1 level shows the 5 new SP9 C1 units', () => {
    render(<GrammarTrackScreen launchGrammarUnit={() => {}} />);
    // Click the C1 level tab
    fireEvent.click(screen.getByText(/C1/));
    expect(screen.getByText(/Kondicional II/i)).toBeInTheDocument();
    expect(screen.getByText(/Poslovni jezik/i)).toBeInTheDocument();
    expect(screen.getByText(/Glagolske imenice/i)).toBeInTheDocument();
    expect(screen.getByText(/Povratni glagoli/i)).toBeInTheDocument();
    expect(screen.getByText(/Red riječi/i)).toBeInTheDocument();
  });
});
```

If the GrammarTrackScreen's UI uses level-tab buttons with different selectors (icons, labels), adapt the test's tab-click selectors accordingly. The test's intent — verifying that the 5 B2 + 5 C1 unit titles render — should remain.

- [ ] **Step 7: Run tests**

```
npx vitest run src/tests/grammarTrackScreen.advanced.test.tsx
```
Expected: 2 passed.

Run the full suite to confirm no regression:
```
npx tsc --noEmit
npx vitest run
```
Both must pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/learn/GrammarTrackScreen.tsx src/components/AppRouter.tsx src/tests/grammarTrackScreen.advanced.test.tsx
git commit -m "feat(sp9): wire B2+C1 units into GrammarTrackScreen + AppRouter routing

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

### Task 7: Acceptance gate verification + spec follow-up

**Files:**
- Modify: `docs/superpowers/specs/2026-05-15-sp9-advanced-grammar-units-design.md`

- [ ] **Step 1: Run the full unit + integration suite**

Run: `npx vitest run`
Expected: all green. New tests: 11 (schema) + 6 (component) + 3 (aggregator) + 2 (integration) = 22 new tests.

- [ ] **Step 2: Privacy + name-collision grep**

```bash
grep -rn "FORMAL_REGISTER\b" src/
```
Expected: matches in `src/data/grammar.js` (the existing A2 unit, preserved). NO matches with `cefr: 'C1'` — confirms the rename to `BUSINESS_REGISTER` succeeded.

```bash
grep -rn "BUSINESS_REGISTER\b" src/
```
Expected: matches in `src/data/grammar-advanced.js` (the new C1 unit) and the integration test.

- [ ] **Step 3: Bundle size sanity check**

Run: `npm run build 2>&1 | tail -30`

Expected: the grammar-advanced.js chunk + GrammarUnitDetail bundle adds < 30 KB minified+gzipped (content-heavy per the spec's acceptance gate #10). If the local build hits the Windows-Dropbox EPERM error, skip and rely on CI's Build & Deploy job.

- [ ] **Step 4: Append acceptance record to the spec**

Open `docs/superpowers/specs/2026-05-15-sp9-advanced-grammar-units-design.md` and append at the end:

```markdown

---

## Follow-up — what shipped (2026-05-15)

### Acceptance gate — actual results

| Gate | Result | Evidence |
|---|---|---|
| 1. Schema correctness | PASS | 11 schema tests green in `src/tests/grammarAdvanced.schema.test.js` |
| 2. Component renderer | PASS | 6 tests green in `src/tests/grammarUnitDetail.test.tsx` |
| 3. Aggregation | PASS | 3 tests green in `src/tests/grammarAdvanced.aggregation.test.js`; no duplicate IDs |
| 4. GrammarTrackScreen integration | PASS | 2 integration tests green in `src/tests/grammarTrackScreen.advanced.test.tsx` |
| 5. Quality floor (6/5/3/5) | PASS | Enforced by schema test #4 across all 10 units |
| 6. CEFR distribution | PASS | 5 B2 + 5 C1 (schema test asserts exactly this split) |
| 7. No regression | PASS | Full vitest suite green (<observed-count> passed) |
| 8. Drill correctness | PASS | Every `correct` index points to a valid `opts` entry (schema tests #8, #9) |
| 9. Croatian-accurate content | PASS | Authored from in-memory `croatian_linguistics_expertise.md` per locked feedback |
| 10. Bundle size | PASS | grammar-advanced.js + GrammarUnitDetail.tsx add <30 KB minified delta |

### Commits

- `<SHA-1>` feat(sp9): grammar-advanced.js schema + FUTUR_II exemplar + 11 schema tests
- `<SHA-2>` feat(sp9): 4 more B2 units — RELATIVE_CLAUSES, PASSIVE_VOICE, PARTICIPLES, REPORTED_SPEECH
- `<SHA-3>` feat(sp9): 5 C1 units complete (kondicional ii, business register, verbal nouns, reflexive, word order)
- `<SHA-4>` test(sp9): aggregator + GRAMMAR_UNIT_BY_ID validation (3 tests)
- `<SHA-5>` feat(sp9): GrammarUnitDetail renderer + 6 component tests
- `<SHA-6>` feat(sp9): wire B2+C1 units into GrammarTrackScreen + AppRouter routing
- `<SHA-7>` docs(sp9): acceptance-gate verification record

Full unit + integration suite: **<observed-count> passed**, 0 failed.

### Notable adaptation

The spec listed unit #7 as `FORMAL_REGISTER`, but that constant name was already taken by an existing A2-level unit in `grammar.js` (line 2575, the Vi/ti distinction). Renamed to `BUSINESS_REGISTER` with title "Poslovni jezik — Business Correspondence & Advanced Honorifics", preserving the approved pedagogical scope (advanced honorifics, business correspondence, polite imperatives beyond basic Vi/ti).
```

Fill in commit SHAs and the observed test count from the final vitest run.

- [ ] **Step 5: Commit + push**

```bash
git add docs/superpowers/specs/2026-05-15-sp9-advanced-grammar-units-design.md
git commit -m "docs(sp9): acceptance-gate verification record

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin master
```

---

## Self-Review checklist (executor runs before declaring SP9 complete)

- [ ] All 7 tasks committed in order with green tests at each step
- [ ] `grammar-advanced.js` exports exactly 10 unit constants + `ADVANCED_UNITS` array (length 10, 5 B2 + 5 C1) + `GRAMMAR_UNIT_BY_ID` map
- [ ] `GrammarUnitDetail.tsx` renders all 5 sections (title, intro, forms, examples, tips, drills)
- [ ] `GrammarTrackScreen` shows the 5 B2 units + new C1 block with 5 units
- [ ] `AppRouter` plumbs `pendingGrammarUnitId` state and renders `grammar_unit_detail` screen
- [ ] No name collision: `FORMAL_REGISTER` in grammar.js (A2) and `BUSINESS_REGISTER` in grammar-advanced.js (C1) coexist
- [ ] No `@ts-nocheck`, no `any` in new TypeScript code, no lint warnings
- [ ] No coverage threshold drops in `vitest.config.js`
- [ ] No skipped tests added by this work
- [ ] Spec follow-up section filled with real SHAs and pass counts
