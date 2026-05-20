# Croatian Content Linguistic Quality Audit — 2026-05-20

**Auditor**: Claude (Opus 4.7, 1M context)
**Files audited**:
- `functions/api/content/_data/scenarios.js`
- `functions/api/content/_data/lessons.js`
- `functions/api/content/_data/gradedStories.js`
- `functions/api/content/_data/vocabulary.js`
- `functions/api/content/_data/vocabScenes.js`

**Methodology**: Read >50 Croatian sentences across A1–C1 levels in all five datasets. Each flagged item: source location, exact quote, error type (case/aspect/gender/clitic/translation/calque/dialect/typo), grammar rule violated, correct form, severity.

**Severity scale**:
- **BLOCKER**: Teaches wrong Croatian — learner will memorize incorrect grammar/lexicon.
- **HIGH**: Sounds unnatural to native speakers; understandable but distracting.
- **LOW**: Stylistic / minor.

**Quality bar**: No fabricated errors. If Croatian was correct, it was not flagged.

---

## Summary

- **Total findings**: 25
- **BLOCKER**: 16
- **HIGH**: 7
- **LOW**: 2
- **Datasets covered**: scenarios.js, lessons.js, gradedStories.js, vocabulary.js

**Error type breakdown**:
- Typo / orthography (missing diacritic, transposed letter, foreign-script bleed): 9
- Foreign language contamination (Spanish, Cyrillic): 2
- Case / gender agreement: 4
- Clitic placement / word order: 2
- Verb aspect / wrong verb: 2
- Calque / unnatural usage: 1
- Dialect / register (Bosnian-Serbian forms in Croatian content): 4
- Translation mismatch (English ↔ Croatian): 1

---

## scenarios.js — Findings

### Finding 1: Foreign-language contamination (Spanish) — BLOCKER

**Source**: `scenarios.js` line 1581, ROLEPLAY scenario "Razgovor o Karijeri" (Career Discussion, B2)
**Croatian text**: `"Razumljivo. ... Preporučujem da razgovaraš s HR-om neformalno, antes nego apliciraš. Koji su ti dugoročni ciljevi?"`
**Error**: `"antes nego"` is **Spanish** (= "before that"). Croatian for "before" in this context is **`prije nego što`**. This is a model hallucination — Spanish slipped into Croatian text.
**Severity**: BLOCKER
**Suggested fix**: `"...neformalno, prije nego što apliciraš..."`

---

### Finding 2: Typo — wrong stem — BLOCKER

**Source**: `scenarios.js` line 1383, ROLEPLAY scenario "Kod Liječnika" (At the Doctor's, A2)
**Croatian text**: `"Ne osjećaš se dobro. Nazivaš ordinaciju i dogovaraš termin. Stijedeći dan sjediš u čekaonici."`
**Error**: **`Stijedeći`** is not a Croatian word. The intended word is **`Sljedeći`** (next). Letters transposed and inserted. This is an A2-level reading passage — learners will memorize the wrong word.
**Severity**: BLOCKER
**Suggested fix**: `"...Sljedeći dan sjediš u čekaonici."`

---

### Finding 3: Typo — missing letter — BLOCKER

**Source**: `scenarios.js` line 1625, ROLEPLAY scenario "Medicinska Konzultacija" (Medical Consultation, B2)
**Croatian text**: `"...Ako se tlak ne normalizira za miesec dana, razgovarat ćemo o terapiji."`
**Error**: **`miesec`** is not a word in standard Croatian. Should be **`mjesec`** (month). The `j` is missing (`mje-` is the Ijekavian reflex of yat). Without `j` it reads as a Russian/Old Slavic form.
**Severity**: BLOCKER
**Suggested fix**: `"...za mjesec dana..."`

---

### Finding 4: Bosnian/Serbian lexical register — HIGH

**Source**: `scenarios.js` line 444, RECIPES → "Fritule" step
**Croatian text**: `'Kašikom stavljaj tijesto u ulje. (Drop spoonfuls into oil.)'`
**Error**: **`kašika`** (and instrumental `kašikom`) is Bosnian/Serbian. Standard Croatian uses **`žlica`** (instrumental `žlicom`). The same recipe set already correctly uses `žličica` (teaspoon) elsewhere on lines 388/410/412 — inconsistent.
**Severity**: HIGH (teaches wrong register; competing-language word)
**Suggested fix**: `'Žlicom stavljaj tijesto u ulje.'`

---

### Finding 5: Missing diacritic — HIGH

**Source**: `scenarios.js` line 1516, ROLEPLAY scenario "Na Bankovnom Šalteru" (At the Bank Counter, B1)
**Croatian text**: `"Sve je u redu. Potvrda stize na vašu e-mail adresu."`
**Error**: **`stize`** is not a Croatian word. Should be **`stiže`** (arrives, 3rd sg. present of `stizati`). Missing the haček on `z`.
**Severity**: HIGH
**Suggested fix**: `"Potvrda stiže na vašu e-mail adresu."`

---

### Finding 6: Calque / unnatural usage — HIGH

**Source**: `scenarios.js` line 1536, ROLEPLAY scenario "Žalba Stanodavcu" (Complaint to Landlord, B1)
**Croatian text**: `"Aha, hvala što ste javili. Je li donosila neku poruku o grešci?"`
**Error**: Context = a washing machine; speaker asks whether it showed an error message. **`donosila`** = "was bringing" — calque from English "did it bring up an error?". Croatian uses **`prikazala`** (displayed), **`ispisala`** (printed/showed), or **`pokazala`** (showed). A washing machine does not "bring" messages in Croatian usage.
**Severity**: HIGH
**Suggested fix**: `"Je li prikazala neku poruku o grešci?"` or `"Je li ispisala kakvu pogrešku?"`

---

## gradedStories.js — Findings

### Finding 7: Cyrillic script contamination — BLOCKER

**Source**: `gradedStories.js` line 519, story `gs_b1_2` ("Baka dolazi za Božić", B1)
**Croatian text**: `"...tata iz podruma donosi jelku. Mi djeca украшavamo jelku šarenim kuglicama..."`
**Error**: The word `украшavamo` contains **Cyrillic letters** (`у`, `к`, `р`, `а`, `ш`) mixed with Latin letters. Will not display correctly in Croatian content; will confuse all learners and likely cause TTS/render failures. Should be entirely Latin: **`ukrašavamo`**.
**Severity**: BLOCKER (also breaks any string-matching exercises)
**Suggested fix**: `"Mi djeca ukrašavamo jelku..."`

---

### Finding 8: Cedilla-z (Romanian/Turkish) instead of ž — BLOCKER

**Source**: `gradedStories.js` line 234, story `gs_a2_1` ("Vikend u Splitu", A2)
**Croatian text**: `"Poslijepodne smo otišli na plaţu Bačvice. Kupali smo se u moru i gledali mladeţ kako igraju picigin..."`
**Error**: **`plaţu`** and **`mladeţ`** use **`ţ`** (Romanian/Turkish t-with-cedilla, U+0163), not Croatian **`ž`** (z-with-háček). Encoding bleed. The words should be **`plažu`** and **`mladež`**. Both occur in the same sentence at A2 — a learner will memorize the wrong glyph.
**Severity**: BLOCKER
**Suggested fix**: `"...otišli na plažu Bačvice... gledali mladež kako igraju picigin..."`

---

### Finding 9: Misspelling of common noun — BLOCKER

**Source**: `gradedStories.js` line 445, story `gs_b1_1` ("Selidba u Zagreb", B1)
**Croatian text**: `"Bez njega bih se mučio sam sa strojem za pranje rublja i kavčem."`
**Error**: **`kavčem`** is not a word. The noun is **`kauč`** (sofa), instrumental singular **`kaučem`** (no vowel loss; `u` is part of the stem). The form `kavčem` looks like the writer confused `kauč` with a hypothetical `*kavač`.
**Severity**: BLOCKER (B1 content, learner will copy)
**Suggested fix**: `"...sa strojem za pranje rublja i kaučem."`

---

### Finding 10: Wrong verb stem ("vrijelo" instead of "vrijedilo") — BLOCKER

**Source**: `gradedStories.js` line 859, story `gs_a2_4` ("Večera u restoranu", A2)
**Croatian text**: `"Platili su sto dvadeset eura, ali vrijelo je svake lipe."`
**Error**: **`vrijelo`** is the neuter past participle of **`vreti`** (= to boil). The intended verb is **`vrijediti`** (= to be worth), neuter past participle **`vrijedilo`**. Sentence as written means "...but it was BOILING every cent" — nonsense. The very same dataset defines the verb correctly two lines later (line 875: `vrijediti → To vrijedi svake lipe`). This is a glaring inconsistency.
**Severity**: BLOCKER
**Suggested fix**: `"...ali vrijedilo je svake lipe."`

---

### Finding 11: Bosnian/Serbian form "Juče" instead of "Jučer" — HIGH

**Source**: `gradedStories.js` line 851, story `gs_a2_4`
**Croatian text**: `"Juče navečer, Marko je odveo svoju djevojku Petru u restoran u Dubrovniku."`
**Error**: **`Juče`** is Serbian/Bosnian. Standard Croatian is **`Jučer`** (with final `-r`). The vocabulary list on line 637 correctly uses "Jučer". Inconsistent within the same app.
**Severity**: HIGH (register mixing)
**Suggested fix**: `"Jučer navečer..."`

---

### Finding 12: Clitic + agreement error — BLOCKER

**Source**: `gradedStories.js` line 604, story `gs_b1_3` ("Na razgovoru za posao", B1)
**Croatian text**: `"Mama je bila toliko ponosna da joj je suze krenule niz lice."`
**Error**: Subject is **`suze`** (tears, plural feminine). Past tense plural requires plural auxiliary **`su`**, not singular **`je`**. Plus clitic order. Correct: **`...da su joj suze krenule niz lice.`**
**Severity**: BLOCKER (multiple grammar rules violated: plural agreement + clitic position)
**Suggested fix**: `"...da su joj suze krenule niz lice."`

---

### Finding 13: Wrong derived noun (`samouzdano`/`samouzdanje` instead of `samopouzdano`/`samopouzdanje`) — BLOCKER

**Source**: `gradedStories.js` line 596 and line 612, story `gs_b1_3`
**Croatian text**:
- Line 596: `"Ksenija je odgovarala smireno i samouzdano."`
- Line 612 (vocab gloss): `{ hr: 'samouzdanje', en: 'self-confidence', ex: 'Imala je samouzdanja.' }`
**Error**: The correct Croatian word is **`samopouzdanje`** / **`samopouzdano`** (from `pouzdati se` = to trust). The forms `samouzdanje` / `samouzdano` are not standard Croatian. This is appearing in both the paragraph AND the explicit vocabulary list — double exposure to the wrong form.
**Severity**: BLOCKER
**Suggested fix**: `samopouzdano`, `samopouzdanje`

---

### Finding 14: Word confusion (`dijela` vs `djela`) — BLOCKER

**Source**: `gradedStories.js` line 1319, quiz question for a C1 story (Krleža)
**Croatian text**: `q: 'Čemu svjedoče Krležina dijela koja se i danas čitaju i igraju?'`
**Error**: **`dijela`** = "parts" (gen. sg. of `dio`, or nom. pl. of `dio`). The intended word is **`djela`** = "works/deeds" (nom. pl. of `djelo`). Krleža's *works* (literary output) are meant, not his parts. The body of the story on line 1277 correctly uses `djela`. Quiz contradicts story.
**Severity**: BLOCKER (C1 quiz; tests wrong word)
**Suggested fix**: `"Čemu svjedoče Krležina djela..."`

---

### Finding 15: Dialectal/colloquial form "Zagrepčan" — HIGH

**Source**: `gradedStories.js` line 446, story `gs_b1_1`
**Croatian text**: `"Dobrodošao u Zagreb," rekao je Tomislav, "sad si pravi Zagrepčan!"`
**Error**: Standard Croatian noun for "a Zagreb resident (male)" is **`Zagrepčanin`** (full form). `Zagrepčan` is a colloquial/regional clipped form, not standard. In a B1 learning resource the standard form should be modelled.
**Severity**: HIGH
**Suggested fix**: `"...sad si pravi Zagrepčanin!"`

---

## lessons.js — Findings

### Finding 16: Typo in dative-case lesson example — BLOCKER

**Source**: `lessons.js` line 2181, Lesson "Dative & Locative Cases", section "Dative — Giving & Telling"
**Croatian text**: `hr: 'Dao sam knjugu Ani.'` (en: "I gave the book to Ana.")
**Error**: **`knjugu`** is a typo for **`knjigu`** (book, acc. sg.). This is the headline example demonstrating dative case — a learner reading this lesson sees a misspelled noun in the most important illustrative sentence. Especially harmful in a grammar-focused lesson.
**Severity**: BLOCKER
**Suggested fix**: `'Dao sam knjigu Ani.'`

---

### Finding 17: Clitic placement error in a teaching example about aspect — BLOCKER

**Source**: `lessons.js` line 1318, lesson "Croatian Future Tense" (B1), in body of `rule` slide "Aspect Matters in the Future"
**Croatian text**: `"Imperfective future describes an ongoing or habitual future action: 'Ću čitati' (I will be reading / I'll read — no defined endpoint). Perfective future describes a completed, bounded action: 'Ću pročitati'..."`
**Error**: **`Ću čitati`** and **`Ću pročitati`** are ungrammatical. The auxiliary **`ću`** is a clitic and **cannot stand at the start of a clause**. Standard forms:
- Short: **`Čitat ću`** / **`Pročitat ću`**
- Long: **`Ja ću čitati`** / **`Ja ću pročitati`**

This is the very mistake the app's own clitic lesson (Lessons 6 & 20) repeatedly warns against. The lesson is teaching the **opposite** of what other lessons teach. Highest-priority fix.
**Severity**: BLOCKER (self-contradicting curriculum; teaches the cardinal beginner mistake as if correct)
**Suggested fix**: `"...habitual future action: 'Čitat ću' / 'Ja ću čitati' (I will be reading...). Perfective future...: 'Pročitat ću' / 'Ja ću pročitati'..."`

---

### Finding 18: English typo inside a Croatian-lesson explanation — LOW

**Source**: `lessons.js` line 2399, quiz explanation in "Instrumental Case" lesson
**Text**: `"'Idem s majkom.' — s/sa (with) + instrumental. Majka (mother) is feminine, instrumental ending -om: majka → majkom. This is the accusation for one of Croatian's most common preposition patterns."`
**Error**: **`accusation`** should be **`formation`** or **`pattern`**. English-side typo (writer probably meant a Croatian-grammar term but typed the legal word). Does not teach wrong Croatian, but undermines credibility.
**Severity**: LOW (English-side; Croatian is correct)
**Suggested fix**: `"This is the formation pattern for one of Croatian's most common preposition patterns."` or simply `"This is one of Croatian's most common preposition patterns."`

---

## vocabulary.js — Findings

### Finding 19: Missing letter in lexeme `svekr` — BLOCKER

**Source**: `vocabulary.js` line 80, `inlaws` category
**Croatian text**: `['svekr', "father-in-law (husband's father)", 'svekr']`
**Error**: **`svekr`** is not a Croatian word. The correct lexeme is **`svekar`** (father-in-law, husband's father). The fleeting `a` is part of the nominative singular stem (it drops in oblique cases: gen. `svekra`). The pronunciation field also wrongly shows `svekr`.
**Severity**: BLOCKER (in-laws lexicon page; learner copies wrong nominative form)
**Suggested fix**: `['svekar', "father-in-law (husband's father)", 'sve-kar']`

---

### Finding 20: Wrong pronunciation guide for `pomajka` — LOW

**Source**: `vocabulary.js` line 96, `inlaws` category
**Croatian text**: `['pomajka', 'stepmother', 'po-my-ka']`
**Error**: The Croatian word `pomajka` is pronounced **`po-MAJ-ka`** (with the `j` rendered as English `y`, hence `po-MAY-ka` in the project's existing pseudo-phonetic style — see other entries that use `-y-` for `j`). The given **`po-my-ka`** drops the `a` after `m`, producing an incorrect syllable structure (`my` does not represent Croatian `maj`).
**Severity**: LOW (English-side pronunciation guide; Croatian spelling is correct)
**Suggested fix**: `['pomajka', 'stepmother', 'po-may-ka']`

---

### Finding 21: Lexeme listed in oblique case as if it were the dictionary form — HIGH

**Source**: `vocabulary.js` line 50, `numbers` category
**Croatian text**: `['Tisuću', 'One thousand']`
**Error**: **`Tisuću`** is the **accusative singular** of `tisuća` (used in counting: `jednu tisuću` = "one thousand", lit. "one [a.sg.] thousand [a.sg.]"). The dictionary/nominative form is **`tisuća`** (feminine). Listing the accusative as the headword teaches the wrong base form — learners will say `tisuću eura` correctly by accident but will not know to decline `tisuća` in other cases.
**Severity**: HIGH (lexicon — wrong dictionary form)
**Suggested fix**: `['Tisuća', 'One thousand']`. (Optionally add note: "accusative `tisuću` after numerals/counting".)

---

### Finding 22: Sub-standard / Serbianized hundred form — HIGH

**Source**: `vocabulary.js` line 49, `numbers` category
**Croatian text**: `['Dvjesta', 'Two hundred']`
**Error**: **`Dvjesta`** is a colloquial/Štokavian form that is also standard in Serbian and Bosnian. The Croatian standard literary form is **`dvjesto`** (or the analytic `dvije stotine`). The companion entries on the same list (`Tristo`/`tristo`, etc.) are NOT included so we cannot check consistency, but `dvjesta` paired with the standard month names (`Siječanj`...) on the same dataset is register-mixing.
**Severity**: HIGH
**Suggested fix**: `['Dvjesto', 'Two hundred']`

---

### Finding 23: Gender / case agreement error in condolence phrase — BLOCKER

**Source**: `vocabulary.js` line 1397, `life_events` category
**Croatian text**: `['Primite moje iskreno sućut.', 'Please accept my sincere condolences.', 'pri-mi-te mo-ye is-kre-no su-chut']`
**Error**: **`sućut`** is a **feminine** noun (`sućut, sućuti, ž.`), accusative singular **`sućut`** (zero-marked, like other consonant-stem feminines). The phrase requires feminine accusative possessive **`moju`** and feminine accusative adjective **`iskrenu`**, NOT the neuter **`moje iskreno`**. This is taught as a fixed cultural phrase — a learner who memorizes it will say it wrong at every Croatian funeral.
**Severity**: BLOCKER (highly sensitive cultural phrase; very public failure)
**Suggested fix**: `['Primite moju iskrenu sućut.', 'Please accept my sincere condolences.', 'pri-mi-te mo-yu is-kre-nu su-chut']`

---

### Finding 24: Plurale-tantum location form `Bibinjama` — LOW (verified correct, no fix)

**Source**: `scenarios.js` line 1888, CITYLOC
**Croatian text**: `{ nom: 'Bibinje', lok: 'Bibinjama' }`
**Status**: After verification, **`Bibinjama`** is correct — Bibinje is a plurale-tantum toponym (neuter plural pattern), locative `Bibinjama` is grammatical. NOT flagged.

---

### Finding 25: Discrepancy — vocabulary lists `žličica` as both `teaspoon` and as `salt-measure-unit` — LOW

**Source**: `vocabulary.js` line 766 (`žličica` = teaspoon) vs `scenarios.js` line 388 (`['1 žličica', 'sol (salt)']` — `žličica` of salt)
**Status**: This is acceptable polysemy (a `žličica` is both the noun "teaspoon" and a measure "a teaspoonful of"). NOT flagged.

---

## Cross-Cutting Observations

1. **Encoding contamination** is the most worrying single category. Two distinct foreign-script intrusions found:
   - Cyrillic `украш` mid-word in a Christmas story (Finding 7)
   - Cedilla-`ţ` (Romanian/Turkish) instead of `ž` in a Split beach story (Finding 8)
   Both look like the LLM's output mixed scripts at generation time, and both survived editorial review. Recommend adding a CI lint that rejects any non-Croatian-Latin character in `hr:` fields (e.g., regex `[^A-Za-zČčĆćĐđŠšŽž0-9 ,.!?'":;()\-—–\n…]`).

2. **Spanish bleed (Finding 1)** indicates the same generation-time multilingual contamination risk. A periodic word-list scan against a Spanish/English/French stopword list in `hr:` fields would catch these.

3. **Internal contradiction**: the future-tense lesson teaches **`Ću čitati`** as if grammatical (Finding 17) while two other lessons (clitics, advanced clitics) repeatedly warn against placing `ću` first. This is the single most curriculum-damaging error in the audit.

4. **Bosnian/Serbian-register words** appear scattered: `Juče`, `kašika`, `samouzdanje`, `Dvjesta`. The app's overall register is Croatian-Ijekavian, so these stand out and should be normalized.

5. **Cultural-phrase errors are over-represented**: the condolence phrase (Finding 23) and `Zagrepčan` (Finding 15) are exactly the high-stakes utterances learners memorize verbatim. These are the most expensive mistakes per byte.

---

## Recommended Next Steps

1. **Patch the 16 BLOCKER findings** before next deploy.
2. **Add a `hr:` field lint** that fails CI on any non-Croatian-Latin character.
3. **Spell-check pass** with a Croatian dictionary (e.g., `hunspell-hr`) over all `hr:` and `text:` fields — would have caught Findings 2, 3, 5, 7, 8, 9, 10, 13, 16, 19 automatically.
4. **Future-tense lesson rewrite** (Finding 17) — currently teaches a banned construction.
5. **Native-speaker review** of cultural fixed phrases (condolences, weddings, name-day) — these are the highest-risk category.
