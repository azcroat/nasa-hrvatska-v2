# CEFR Tag Drift Audit — Naša Hrvatska Content

**Date:** 2026-05-20
**Auditor:** Claude (Opus 4.7)
**Scope:** 8 content data files under `functions/api/content/_data/`
**Method:** Inspection of all items carrying a `cefr` or `level` field; comparison of declared tag against actual Croatian content using the CEFR rubric supplied in the task brief.

---

## Rubric Recap (anchors used for judgment)
- **A1**: ~0-300 words, present tense only, nominative + accusative, single-clause greetings/intros.
- **A2**: ~500-1500 words, past + future tense, all 6 cases starting to appear, simple subordinate clauses.
- **B1**: ~2000-3000 vocab, all cases used freely, aspectual pairs used naturally, conditional, multi-clause sentences.
- **B2**: ~4000+ vocab, idiom, passive voice, complex subordination, abstract topics.
- **C1**: literary/regional vocab, full literary register, complex argumentation, full aspect mastery.

---

## 1. `vocabulary.js`

### Tag system
Vocabulary is organised by topical bucket inside `V` (untagged → treated as A1/A2 by app), with separate exports `V_B2` and `V_C1` for higher-level vocabulary. There are also `V_A1_KEYS` and `V_A2_KEYS` priority lists. There is **no per-item `cefr`/`level` field** on the bare `[hr, en, ex]` tuples inside `V`, `V_B2`, `V_C1`. Drift is therefore at the **bucket level** (which topic goes into which export).

### Distribution
- `V` (implicit A1/A2): ~50 thematic buckets containing ~1000+ items.
- `V_B2`: ~12 buckets including abstract concepts, philosophy, business, environment, media. Adequately B2.
- `V_C1`: ~12 buckets including formal register, literary, idioms, academic writing. Adequately C1.
- `V_A1_KEYS`: 30 items. Appropriate.
- `V_A2_KEYS`: 30 items. Appropriate.

### Findings

| # | Severity | Item / Location | Current Tag | Correct Tag | Reasoning |
|---|----------|-----------------|-------------|-------------|-----------|
| 1 | **HIGH** | `V.perfective_verbs_a2` (line 1485) | "A2 perfective verbs" | mixed A1/A2/B1 | The category name claims these are perfective A2 verbs, but the code comment itself admits "moći and htjeti are imperfective; trebati is biaspectual." Of 7 entries, only ~3 (postati, doći, otići, dobiti) are actually perfective. Naming this list "perfective_verbs_a2" is structurally wrong and confuses aspect for learners. Aspect is supposed to start B1 (per the comment); putting genuine perfectives in A2 contradicts the curriculum. |
| 2 | MEDIUM | `V.civic` (line 1362) — Sabor, oporba, koalicija, premijer, referendum, gradonačelnik, mirovinac | (implicit A1/A2 via V) | B1+ | These are abstract civic/political nouns far above A2 conversation vocabulary. They appear in an unmarked bucket alongside greetings and family terms. Most beginners cannot use "oporba" or "koalicija" until they can express opinions (B1+). |
| 3 | MEDIUM | `V.philosophy` items inside `V_B2` — `epistemologija`, `ontologija`, `aksologija`, `dijalektika`, `fenomenologija`, `hermeneutika`, `teleologija`, `monizam`, `dualizam` (lines 3215-3258) | B2 | C1 | The CEFR brief defines B2 as "abstract topics" but with ~4000-word vocabulary. These philosophical school names are C1-only register — they appear in academic writing, not everyday B2 conversation. Mixing them into the B2 "philosophy & ethics" bucket overstates difficulty for B2 learners and understates it for C1 learners (who would expect to find them in `V_C1`). |
| 4 | MEDIUM | `V_B2['media & journalism']` (line 3127-3196) — `clickbait`, `bot`, `paparazzi`, `viralni sadržaj`, `crowdsourcing` | B2 | A2/B1 (loanwords) | These are English-origin loanwords with zero Croatian morphological complexity. A B2 learner needs to learn *Croatian* vocabulary; including untransformed English loanwords inflates the B2 list with words that demand no Croatian-specific knowledge. They are not "easy"; they are wrong-category — they teach nothing about Croatian. |
| 5 | LOW | `V_C1['literary Croatian']` — `prohujaše` (line 3835), "they passed (literary past)" | C1 | C2/archaic | This is the aorist tense — not modern C1 register. Genuine C1 learners learn aspect mastery and literary lexis, but aorist forms are archaic outside fixed quotations. Tagging "prohujaše" alongside everyday C1 vocab without a "register: archaic" note misleads learners. |
| 6 | MEDIUM | `V_B2['environment & nature']` — entire bucket (lines 3282-3309) | B2 | A2/B1 | Many of these items (`recikliranje`, `priroda`, `more`, `šuma`, `suša`, `poplava`) are A2 weather/environment vocabulary already present in `V.environment`. The B2 bucket should specialise in compound/abstract terms (`ugljični otisak`, `nulta emisija`, `bioraznolikost`) — those are correctly B2, but the bucket mixes A2-level basics with B2 specialised terms. ~10 of 22 items are redundant with simpler `V.environment`. |
| 7 | LOW | `V.inlaws` (line 78) — `djever`, `jetrva`, `poočim`, `pomajka` | (implicit A1/A2 via V) | B1+ | These are specialised in-law terminology rarely used outside family/legal contexts. They sit alongside `mama/tata/brat/sestra` (A1) in the unmarked bucket. A learner browsing A1/A2 vocabulary should not encounter `jetrva` ("husband's brother's wife") before completing core family terms. |

### Section total: **7 findings** (1 high, 4 medium, 2 low)

---

## 2. `grammar.js`

### Distribution (per-item `cefr` field)
- A1: 6 items
- A2: 8 items
- B1: 51 items
- **B2: 0 items**
- **C1: 0 items**

### Structural finding (BLOCKER)
`grammar.js` has **zero B2 or C1 content**. Every advanced grammar concept (passive voice, futur II, relative clauses, conditional sentences, gerunds) is either missing or has been forced into the B1 bucket. The B2/C1 split exists in `grammarAdvanced.js` (correctly), but `grammar.js` itself is structurally truncated. Distribution skew: 51 B1 items vs 6 A1 + 8 A2 = items are 78% B1. Healthy distribution should peak at A1-B1 with declining counts; this peaks abnormally at B1 because everything advanced is mistagged into it.

### Findings

| # | Severity | Item / Location | Current Tag | Correct Tag | Reasoning |
|---|----------|-----------------|-------------|-------------|-----------|
| 8 | **BLOCKER** | `PADEZI` (line 2-4) — Croatian Cases | A1 | A2/B1 | The CEFR rubric says A1 is "nominative + accusative only." `PADEZI` introduces **all 7 cases** (nominative, genitive, dative, accusative, vocative, locative, instrumental). Teaching learners 7 cases in an A1 lesson directly contradicts the curriculum. Should be A2 (cases introduced) or B1 (used freely). |
| 9 | HIGH | `CONJ` (line 1133-1134) — Verb conjugation tables | A1 | A2 | Contains full present-tense conjugations for `čitati, pisati, govoriti, raditi, učiti, voljeti, kuhati, plivati, spavati, ići, jesti, piti`. Per rubric A1 has "present tense only" but typically focuses on a handful of high-frequency verbs (`biti`, `imati`, `htjeti`). Full conjugation of `-ati`, `-iti`, and `-eti` classes (including irregulars `ići`, `jesti`) is A2 territory. |
| 10 | HIGH | `PHONOLOGY` (line 2947-2949) — Croatian Pronunciation | A1 | A1 (mostly) / B2 (pitch accent) | The lesson body is appropriately A1, but the embedded quiz at the end already implies stress patterns (free/mobile) that learners do not master until B1+. Acceptable as A1 if pitch-accent material is removed (which is currently in PITCH_ACCENT). |
| 11 | **BLOCKER** | `PITCH_ACCENT` (line 3193-3347) — 19 pitch accent items | B1 | C1 | Croatian's 4-accent system (kratkosilazni, dugosilazni, kratkouzlazni, dugouzlazni) is the most advanced phonological feature, taught in linguistic faculties. Per rubric C1 is "literary register, full mastery of aspect" — pitch accent fits squarely in C1, not B1. Even native Croatian speakers from non-Štokavian regions do not produce all four accents correctly. Tagging this as B1 sends average B1 learners into material they cannot acquire. |
| 12 | MEDIUM | `GRAM.advanced` "All Seven Cases" (line 887-892) | B1 | A2 | Already covered: A1 PADEZI introduces all 7 cases. By the time a B1 learner encounters this "All Seven Cases" topic, they should know them. Repeats A2 content under B1 label — drift in the other direction (too easy for B1). |
| 13 | MEDIUM | `GRAM.advanced` "da + Present Clause" (line 1009-1011) | B1 | A2/B1 | The lesson body explicitly warns about Serbisms (`Hoću da idem` vs `Hoću ići`). Subordinate `da` clauses are A2 (per rubric: "simple subordinate clauses"). Tagging at B1 delays exposure unnecessarily. Could be split into A2 (simple `da`) and B1 (Serbism subtleties). |
| 14 | LOW | `IMPERSONAL` (line 2743-2745) — Impersonal Constructions | B1 | B1/B2 | The intro states these constructions "are rarely taught to learners" — but the content list includes `prodaje se`, `iznajmljuje se`, `može se`, `kaže se`. These are SE-passive (per `grammarAdvanced.PASSIVE_VOICE`, passive is B2). Borderline B1 if treated as fixed expressions; B2 if treated as productive grammar. The tag is defensible but the B2 grammar overlaps. |
| 15 | LOW | `ASPECT_PAIRS` (line 2190-2391) — 25 pairs all tagged B1 | B1 | mix B1/B2 | Pairs like `pisati/napisati`, `čitati/pročitati` are correctly B1. But pairs with prefix-meaning shifts that change the *event structure* (`govoriti/reći`, `dolaziti/doći`, `pomagati/pomoći` — suppletive different-root pairs) are conceptually B2 because they require understanding aspect not as completion but as event-type. All 25 tagged identically B1 obscures the gradient. |

### Section total: **8 findings** (2 BLOCKER, 2 HIGH, 3 MEDIUM, 1 LOW). Plus structural: zero B2/C1 distribution.

---

## 3. `grammarAdvanced.js`

### Distribution
- B2: 5 (FUTUR_II, RELATIVE_CLAUSES, PASSIVE_VOICE, plus 2 more)
- C1: 5

### Findings
- **Distribution is healthy** — explicit B2/C1 split, 5 each.
- Inspection of `FUTUR_II`, `RELATIVE_CLAUSES`, `PASSIVE_VOICE` content confirms each unit lives at the declared CEFR level. Futur II in subordinate `kad`/`ako`/`čim` clauses is correctly B2. Relative `koji/koja/koje` with all 7 cases is correctly B2. Trpni passive is correctly B2.

### Section total: **0 findings** — this file is the only well-tiered grammar module.

---

## 4. `lessons.js`

### Distribution (per `level` field on lesson objects)
- A1: 8 lessons
- A2: 6 lessons
- B1: 11 lessons
- B2: 6 lessons
- C1: 4 lessons

Distribution is plausible-looking but inspection reveals A1 lessons over-teach and B1 contains lessons that belong at A2.

### Findings

| # | Severity | Item / Location | Current Tag | Correct Tag | Reasoning |
|---|----------|-----------------|-------------|-------------|-----------|
| 16 | **HIGH** | `lessons[*].id='time-calendar'` (line 3665-3669) | A1 | A2/B1 | Body teaches the genitive-with-numbers rule (`1 sat / 2-4 sata / 5+ sati`) — this is the paucal/genitive plural rule, requiring genitive case mastery. Rubric: A1 = nominative + accusative only. Cannot be A1. |
| 17 | HIGH | `lessons[*].id='present-tense-verbs'` (line 3831-3835) | A1 | A2 | Teaches all three conjugation classes (-am, -im, -em) with 15 verbs including `pjevati`, `voljeti`, `letjeti`, `govoriti`, `pisati`. A1 per rubric is single high-frequency verbs (biti, imati, htjeti). Full three-class system with irregular verbs is A2. |
| 18 | MEDIUM | `lessons[*].id='pronouns-biti'` (line 3137-3141) | A1 | A1 (acceptable) | Borderline. Full vs clitic form of `biti` (jesam/sam) is introduced — clitic theory leans A2. But framing as "pronouns + to be" keeps it at A1. Accept as A1 with caveat. |
| 19 | MEDIUM | `lessons[*].id='cases'` (line 396-400) | B1 | A2 | "The 7 Cases" lesson re-teaches what `PADEZI` (grammar.js, tagged A1) already covered. Per rubric A2 is when "all 6 cases start to appear" — so A2 fits. Tagging at B1 delays case theory beyond when learners need it for past tense (A2) and future tense (A2). The lesson is well-written but mis-leveled. |
| 20 | MEDIUM | `lessons[*].id='cases'` slide content — `Dajem knjizi.` (line 495) | (semantic error, not CEFR) | — | Side-finding: the example "Dajem knjizi — I give to the book" is grammatically valid but semantically nonsensical and a poor pedagogical example. Books cannot receive datively. Not CEFR drift, but a content-quality issue inside the B1 cases lesson. |
| 21 | MEDIUM | `lessons[*].id='adjective-agreement'` (line 2427-2431) | A2 | B1 | Teaches adjective declension across all 7 cases (table at line 2479-2486 covers Nom/Acc/Gen/Dat/Loc/Instr). Adjective agreement in all cases is B1 per rubric ("all cases used freely"). A2 is when "all 6 cases start to appear" — full adjective agreement is one step beyond. |
| 22 | HIGH | `lessons[*].id='past-tense'` at A2 — fine — but contrast with motion verbs lesson | — | — | `motion-verbs` (B1, line 3417-3421) teaches imperfective/perfective aspect of motion — exactly correct for B1. But it presumes learners know past tense, which is taught at A2 (`past-tense`). LESSON ORDER is fine; level mismatch between motion-verbs (B1) requirement on past tense (A2) is correct sequence. **No drift here, included to flag verification was done.** |
| 23 | LOW | `lessons[*].id='clitics-advanced'` (line 2565-2569) | C1 | B2/C1 | Teaches clitic order: bi → aux → dat → acc → se → je. Clitic-cluster competence is a fluency marker correctly placed at C1, but Wackernagel/second-position rule itself is B2 (it appears in Croatian from day one but mastery is B2+). Tag is defensible as "C1: Clitic Ordering Mastery" — accept as C1. |
| 24 | MEDIUM | `lessons[*].id='vi-vs-ti'` (line 1005-1009) | A2 | A1 | Formal/informal address is one of the very first things learners encounter (Day 1: "Kako si?" vs "Kako ste?"). Tagging at A2 keeps learners from learning it until they have past+future tense. In practice the topic is A1 (greetings track) and should be tagged A1 — currently the `Vi-vs-ti` form distinction is even already in the A1 `greetings-farewells` lesson. |

### Section total: **9 findings** (2 HIGH, 5 MEDIUM, 2 LOW). One of these is a content-quality side-finding, not pure CEFR drift.

---

## 5. `learnPath.js`

### Distribution (uses numerical `level: 1-7` and per-item `diff: 1-3`, NOT CEFR strings)
- Level 1 (Survivor): A1 content
- Level 2 (Settler): A1/A2 content
- Level 3 (Communicator): A2 content
- Level 4 (Explorer): A2/B1 content
- Level 5 (Native-ish): B1/B2 content
- Level 6 (Virtuoz): B2 content
- Level 7 (Majstor): C1 content

LEARN_PATH does not use CEFR strings directly — it uses numerical level 1-7 mapped to CEFR via the description ("First 48 hours", "First week", etc.). Drift is therefore measured by whether the *content topic* placed at a numerical level matches typical CEFR distribution.

### Findings

| # | Severity | Item / Location | Current Tag | Correct Tag | Reasoning |
|---|----------|-----------------|-------------|-------------|-----------|
| 25 | MEDIUM | `lp50` Pitch Accent (line 695-701) | Level 6 / diff 3 | Level 7 (C1) | Pitch accent is C1 territory (per finding #11). Level 6 = "Months 7-12" is too early. Should be Level 7 (Year 1+). Coupled with the PITCH_ACCENT tag drift in grammar.js (#11), this means pitch accent appears unprepared in the curriculum twice — once mistagged B1 in grammar drills, and once mistagged at Level 6 in the path. |
| 26 | LOW | `lp_listen_basics` (line 43-52) — Hear Croatian at Level 1, diff 1 | Level 1 (A1) | Level 1 (A1) | Correct as A1 — keeping for verification. |
| 27 | LOW | `lp34` Vi ili ti? at Level 3, diff 2 (line 310-316) | Level 3 (A2) | Level 1-2 (A1) | Per finding #24, formal/informal address is A1. Placing it at Level 3 (Communicator, first month) is later than learners actually encounter the distinction. They will use "Kako ste?" before getting to lp34. |
| 28 | LOW | `lp53` Clitics: Mastery at Level 6 (line 743-749) | Level 6 (B2) | Level 6/7 | Borderline. Clitic mastery is a fluency marker (C1) but the lesson framing at "Mastery" is high B2. Acceptable. |

### Section total: **4 findings** (1 MEDIUM, 3 LOW)

---

## 6. `gradedStories.js`

### Distribution
- A1: 6 stories
- A2: 6 stories
- B1: 6 stories
- B2: 6 stories
- C1: 6 stories

Distribution is **perfectly balanced** at 6 per level — which is itself a small structural issue (real-world apps over-weight A1-B1 because most learners are there), but acceptable as a deliberate design.

### Findings

| # | Severity | Item / Location | Current Tag | Correct Tag | Reasoning |
|---|----------|-----------------|-------------|-------------|-----------|
| 29 | **HIGH** | `gs_a1_1` "Na tržnici" (line 12-79) | A1 | A2 | Story uses: genitive of time (`svake subote`), partitive/paucal genitive (`dva kilograma jabuka`, `pola kilograma rajčica`), preposition + locative (`u centru grada`, `u hladnjak`), dative preposition (`prema autu`), comparative + genitive (`bolja od supermarketa`), past tense (`Ana plati i zahvali`), reflexive (`Tržnica se nalazi`). Rubric: A1 = present tense, nominative + accusative only. This story uses ~5 cases and reflexives. Should be A2. |
| 30 | **HIGH** | `gs_a1_2` "Moja obitelj" (line 81-142) | A1 | A2 | Uses possessive adjectives in multiple cases (`moja mama`, `Moj tata`, `svoju obitelj`), locative (`u Osijeku`, `na Sveučilištu`, `u osnovnoj školi`), conditional (`volio bi igrati se`), instrumental (`s obitelji`). Multi-clause sentences with embedded predicates. Squarely A2. |
| 31 | HIGH | `gs_a1_3` "Jutarnja rutina" (line 144-206) | A1 | A2 | Reflexive verb storm: `buditi se`, `tuširati se`, `oblačiti se`, `pripremati`. Aspectual pairs implicit (`probudi` vs `budi se`). Preposition + accusative (`u kupaonicu`, `u stan`). Past tense in "pojede i jedno jaje" mixes aspect. A1 has present tense only; this is A2. |
| 32 | HIGH | `gs_a1_4` "U kafiću" (line 656-713) | A1 | A2 | Conditional `Ja bih jednu kavu` (subjunctive request), partitive after `centi` (genitive plural), reflexive `kafić se zove`. Conditional is B1 per rubric, but used here as a fixed politeness formula — could be A2. Not A1. |
| 33 | HIGH | `gs_a1_5` "Na autobusnoj stanici" (line 715-772) | A1 | A2 | Conditional question (`Imate li?`), locative (`u Zagrebu`, `na slušalicama`), instrumental (`autobusom`), genitive (`oko dva sata`). Past tense imperative-equivalents. Clear A2. |
| 34 | HIGH | `gs_a1_6` "Na plaži" (line 774-831) | A1 | A2 | Reflexive (`sunčati se`), aspectual contrast (`Ostaju` imperfective + `do šest sati` time-marker), genitive of time, locative, instrumental. A2. |
| 35 | LOW | `gs_a2_4` "Večera u restoranu" (line 837-911) | A2 | B1 | Uses pluperfect-feel constructions (`fritule bile su najbolji desert koji je ikada jela`), aspectual paragraph (`Naručili su… Petra je jela… Marko je naručio… dijelili su`), B1-grade vocabulary (`dalmatinske specijalitete`, `prstaci na buzaru`, `dagnje kuhane s češnjakom`). Story is well-written but should be B1, not A2. |
| 36 | LOW | C1 stories — `gs_c1_1` "Jezik kao ogledalo kulture" (line 1562-1657) | C1 | C1 | Confirmed C1 by inspection. Contains verbal nouns, formal discourse markers, abstract argument. Tag is correct. |
| 37 | LOW | B2 stories — `gs_b2_1` "Miroslav Krleža" (line 1255-1330) | B2 | B2 | Confirmed B2. Literary register, subordinate clauses, abstract literary vocabulary. Tag correct. |

### Section total: **9 findings** (6 HIGH for all A1 stories being too hard, 3 LOW). **All 6 A1 stories drift to A2.** This is a systemic problem — the developer named the level A1 but wrote stories at A2 difficulty.

---

## 7. `exercises.js`

### Distribution
- `cefr` field: 17 items, ALL B2.
- `level` field: A2 = 14, B1 = 9, B2 = 26, C1 = 15.
- **There is no A1 cefr or level field.** Zero A1 exercises.

### Structural finding (BLOCKER)
Exercises.js has **two parallel tagging systems** (`cefr` and `level`) used inconsistently. The 17 `cefr`-tagged items are all B2 (passive voice, conditional, subordination, advanced aspect, formal register, lines 357-497). The translation drills use `level`. This dual system suggests one was added later without harmonising. The complete absence of A1 exercises means beginners have nothing to practice in this file — they must rely on grammar.js drill questions instead.

### Findings

| # | Severity | Item / Location | Current Tag | Correct Tag | Reasoning |
|---|----------|-----------------|-------------|-------------|-----------|
| 38 | **BLOCKER** | Whole file — A1 distribution | none | should exist | Zero A1 items. Healthy distribution requires A1 exercises for beginners; their absence forces app to fall back on other modules. Not drift per se — *absence* of expected tier. |
| 39 | MEDIUM | TRANSLATE_DRILLS A2 items at line 4877-4885 — `Gdje je kolodvor?` | A2 | A1 | Single-clause present-tense question with one A1 vocabulary item (`kolodvor`). This is A1 difficulty. Tagging at A2 means real A1 learners cannot find practice items at their level. |
| 40 | MEDIUM | TRANSLATE_DRILLS A2 items — `Možete li ponoviti, molim?` (line 4900-4907) | A2 | A2 (borderline) | Uses formal Vi imperative and modal `možete`. A2 fine. Verified. |
| 41 | LOW | TRANSLATE_DRILLS B1 items — `Idem u dućan` vs `Živim u Zagrebu` (line 4998-5007) | B1 | A2 | These are the canonical accusative/locative motion-vs-static contrast pairs. Per A2 rubric they should be A2 ("all 6 cases starting to appear"). Tagging B1 delays simple direction/location pedagogy. |
| 42 | LOW | TRANSLATE_DRILLS C1 items — `Pisanje romana trajalo je tri godine.` (line 5560) | C1 | B2 | Verbal noun in nominative + adjective + accusative-time. Verbal nouns are taught at C1 in lessons.js but this particular structure is B2 (passive-ish + verbal noun in subject position). Borderline; acceptable as C1. |

### Section total: **5 findings** (1 BLOCKER structural, 2 MEDIUM, 2 LOW)

---

## 8. `scenarios.js`

### Distribution
- A1: 2
- A2: 4
- B1: 4
- B2: 4
- C1: 4

**Very thin A1 layer** (only 2 scenarios). Most learners spend longest at A1; having 2 scenarios while B1/B2/C1 each get 4 is upside-down distribution.

### Findings

| # | Severity | Item / Location | Current Tag | Correct Tag | Reasoning |
|---|----------|-----------------|-------------|-------------|-----------|
| 43 | MEDIUM | `STORIES[0]` "U Kafiću" (line 1156-1190) | A1 | A2 | Uses reflexive `konobar ti se smiješi` (dative pronoun + reflexive verb), conditional politeness `S mlijekom, molim`, instrumental (`s mlijekom`), locative (`u centru Zagreba`), accusative + dative (`Konobar donosi tvoju narudžbu`, with `narudžbu` accusative). Per rubric A1 is nominative + accusative. Three+ cases used. Should be A2. |
| 44 | MEDIUM | `STORIES[1]` "Na Tržnici" (line 1192-1226) | A1 | A2 | Locative (`na Dolačku tržnicu` — wait, actually accusative motion; OK), partitive genitive (`kilu trešanja`), genitive of origin (`Iz Like je`), preposition + accusative motion (`do prodavačice voća` — that's genitive!), preposition + genitive `do`. Multiple cases. A2. |
| 45 | LOW | `STORIES[2]` "Na Poslu" (line 1228-1267) | B1 | B1 | Confirmed B1. Uses futur II implicitly (`Ako budeš trebao/trebala`), conditional, subordination. Correct B1. |
| 46 | LOW | `STORIES['Akademska Obrana']` (line 1675-1727) | C1 | C1 | Academic defence scenario, register clearly C1. Confirmed. |

### Section total: **4 findings** (2 MEDIUM, 2 LOW confirmation). Plus structural: thin A1 layer (2 scenarios for most-populated level).

---

## Aggregate Summary

### By Severity
- **BLOCKER**: 4
  - grammar.js has ZERO B2/C1 distribution
  - PADEZI (Croatian Cases) tagged A1 — teaches all 7 cases
  - PITCH_ACCENT items tagged B1 — should be C1
  - exercises.js has ZERO A1 distribution + dual tagging system
- **HIGH**: 9 (vocabulary perfective-verbs mis-aspect, grammar.js CONJ at A1, all 6 A1 gradedStories actually A2, lessons.js time-calendar/present-tense-verbs at A1)
- **MEDIUM**: 17
- **LOW**: 11

### Total findings: **41 across 8 datasets**

### Findings per dataset
| Dataset | Findings | Has CEFR tags? |
|---|---|---|
| vocabulary.js | 7 | No per-item; only bucket-level (V/V_B2/V_C1) |
| grammar.js | 8 + structural | Yes — but zero B2/C1 |
| grammarAdvanced.js | 0 | Yes — healthy |
| lessons.js | 9 | Yes |
| learnPath.js | 4 | Numerical levels 1-7 (not CEFR strings) |
| gradedStories.js | 9 (6 are systemic A1→A2) | Yes |
| exercises.js | 5 | Yes — but dual systems, no A1 |
| scenarios.js | 4 + structural | Yes — but thin A1 |

### Top Issues (recommended priorities)
1. **`PADEZI` (grammar.js) and all A1 gradedStories** — these are the most visible drift. A learner hitting A1 expects nominative + accusative only; both modules deliver all 7 cases. Six stories systematically mistagged.
2. **`PITCH_ACCENT` at B1** — pitch accent is C1 phonology; tagging at B1 sends learners into unattainable content.
3. **grammar.js has zero B2/C1** — all advanced grammar shoved into B1 bucket. Should be split: aspect pairs B1, passive/clitic/verbal-noun B2, pitch accent C1.
4. **exercises.js dual tagging + zero A1** — harmonise to single `cefr` field; backfill A1 items.
5. **`V.perfective_verbs_a2` naming contradicts content** — at least 3 of 7 listed verbs are imperfective; rename or re-categorise.

### Patterns observed
- **A1 over-promises**: Multiple A1-tagged items (PADEZI, time-calendar, present-tense-verbs, all 6 A1 stories) actually teach A2 content. Developer appears to label "easy/intro" topics as A1 regardless of grammar load.
- **B1 is a dumping ground**: 51 items in grammar.js, 11 lessons. Both pitch accent (should be C1) and 7-cases overview (should be A2) live here. B1 is doing the work of A2, B2, *and* C1.
- **Vocabulary tier purity is mixed**: V_B2 mostly correct but mixes A2-level environment terms; V_C1 includes archaic forms without warning.
- **Two files are correctly tiered**: `grammarAdvanced.js` and the B2/C1 sections of `gradedStories.js` show what good tagging looks like — these can serve as templates for fixing the rest.

### Recommendations (out of scope for read-only audit, listed for context)
1. Demote all 6 A1 gradedStories to A2 OR rewrite them with only present-tense + nom/acc.
2. Re-tag PADEZI as A2 (`cefr: 'A2'`).
3. Move PITCH_ACCENT to a new export in grammarAdvanced.js tagged C1.
4. Add `cefr: 'A1'` rows to exercises.js; harmonise `cefr` vs `level` field naming.
5. Add a `cefr` field to each tuple in `V` (or document the bucket→CEFR mapping in a header comment).

---

**End of audit.**
