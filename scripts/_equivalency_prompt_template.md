# CEFR Equivalency Test Item Writer — Brief

You are authoring 50 multiple-choice items for ONE level of the Naša Hrvatska CEFR equivalency test. Passing the test demonstrates competency at the level being tested, allowing the learner to advance to the next CEFR tier.

## Schema (every item)

```typescript
{
  q: string,           // The question as the learner sees it. English + Croatian as needed.
  o: string[],         // 4 options. Always 4. One correct.
  c: number,           // Correct option index, 0..3
  skill: 'vocab' | 'grammar' | 'reading',
  passage?: string,    // Reading items only — short passage (40-150 words) the question is about
}
```

## Quality Bar — NON-NEGOTIABLE

1. **Real Croatian content.** Every Croatian word and grammar pattern must be correct standard Croatian (Ijekavian). No Bosnian/Serbian forms (`hljeb`/`kašika`/`Juče`/`Dvjesta`), no foreign-script bleed.
2. **Right difficulty.** The level being tested defines the rubric — do NOT include items that are above the tested level (those should be in the next tier's test) or trivially below.
3. **No ambiguous wrong answers.** The 3 distractors must be CLEARLY wrong for someone at the tested level. A distractor should fail because the learner picked the wrong case ending / wrong aspect / wrong vocabulary — not because the distractor is also defensible.
4. **Skill purity.** A "vocab" item tests vocabulary recognition (English↔Croatian or fill-in-blank with one missing noun/verb). A "grammar" item tests structural choice (case ending, aspect, word order, pronoun). A "reading" item tests comprehension of a passage and the q must require reading the passage to answer.
5. **Diacritics correct.** č ć đ š ž — these are Croatian Latin alphabet, not optional.
6. **No culture trivia in vocab/grammar.** Reading passages can introduce cultural content but the test items must be linguistic, not "did you know X about Croatia".
7. **Diverse content.** Don't write 20 vocab items about food. Spread across: greetings, family, daily routines, food, travel, work, weather, body, time, numbers, places, etc.

## Distribution per test (50 items)

- 20 vocab items
- 20 grammar items
- 10 reading items (typically 3-5 passages, 2-3 questions each — passages count once but each question is one item)

## CEFR rubric anchors

- **A1**: Present tense only, ~300 words, nominative + accusative, single-clause greetings/intros.
- **A2**: Past + future tense, all 6 cases starting to appear, simple subordinate clauses, ~500-1500 words.
- **B1**: All cases used freely, aspectual pairs (imperfective/perfective), conditional, multi-clause sentences, ~2000-3000 vocab.
- **B2**: Idiomatic expressions, passive voice, complex subordination, abstract topics, ~4000+ vocab.
- **C1**: Literary/regional vocab, full literary register, complex argumentation, full aspect mastery.
- **C2**: Native-like fluency — outside our test scope; C1 is the highest test we offer.

## Output format

Write the result to your assigned file path as JSON:

```json
{
  "levelFrom": "A2",   // The level being tested
  "levelTo": "B1",     // What passing advances to
  "description": "Tests A2 competency — passing advances to B1.",
  "items": [
    { "q": "...", "o": ["...", "...", "...", "..."], "c": 1, "skill": "vocab" },
    { "q": "...", "o": ["...", "...", "...", "..."], "c": 2, "skill": "grammar" },
    {
      "q": "What is the woman doing?",
      "o": ["...", "...", "...", "..."],
      "c": 0,
      "skill": "reading",
      "passage": "Ana svako jutro pije kavu i čita novine..."
    },
    ...
  ]
}
```

## Examples (A1→A2 test items, illustrative)

```json
{
  "q": "What does 'Hvala' mean?",
  "o": ["Hello", "Goodbye", "Thank you", "Please"],
  "c": 2,
  "skill": "vocab"
}
```

```json
{
  "q": "Choose the correct form: 'Ja ___ Hrvat.'",
  "o": ["sam", "si", "je", "smo"],
  "c": 0,
  "skill": "grammar"
}
```

```json
{
  "q": "What time does Ana wake up?",
  "o": ["At 6", "At 7", "At 8", "At 9"],
  "c": 1,
  "skill": "reading",
  "passage": "Ana se budi svako jutro u sedam sati. Pije kavu i ide na posao."
}
```

## Hard constraints

- Output **EXACTLY 50 items**, no more, no less.
- 4 options per item, always.
- Every answer index must be valid (0..3).
- Every Croatian word/phrase must be verifiable standard Croatian.
- No invented dates or facts in reading passages.
- Skills distribution must hit: 20 vocab, 20 grammar, 10 reading (±2).

After writing, sanity-check your file: 50 items, distribution OK, all 4-option, no internal duplicate questions.
