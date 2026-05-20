# Croatian City Entry Writer — Quality Brief

You are writing rich, Wikipedia-quality entries for Croatian cities/towns/villages for the Naša Hrvatska Croatian-language learning application. These entries are read by adult language learners and must be accurate, culturally specific, and free of generic AI-slop padding.

## SCHEMA (every field required)

```json
{
  "name": "Town Name (with diacritics: č, ć, đ, š, ž, ž)",
  "region": "Dalmatia | Istria | Kvarner | Slavonia | Lika | Gorski Kotar | Central Croatia | Podravina | Zagorje | Međimurje | Konavle | ...",
  "icon": "ONE relevant emoji (🏰 castle, 🏖️ beach, ⚓ port, 🍷 wine, 🏛️ history, 🌳 nature, ⛪ church, 💧 water, etc.)",
  "color": "ONE of: #dc2626 (red), #0e7490 (teal), #0284c7 (blue), #16a34a (green), #7c3aed (purple), #92400e (brown), #78716c (gray)",
  "tagline": "5-9 word evocative subtitle. Must reflect actual historical/cultural identity, not generic.",
  "intro": "2-3 sentence introduction (~50-80 words). Specific place identity. NO generic phrases like 'charming village' or 'picturesque'.",
  "history": "1-2 paragraph history (~80-150 words). REAL events, dates, names. Reference specific rulers, wars, populations, industries.",
  "facts": ["5 specific factual items. Each ~15-30 words. Concrete: dates, measurements, named people, named buildings, named records, named events. NO generic 'famous for its beautiful coastline'."],
  "vocab": [
    {"hr": "Croatian word", "en": "English meaning", "note": "10-25 word explanation tied to THIS specific place"},
    {"hr": "Croatian word", "en": "English meaning", "note": "10-25 word explanation tied to THIS specific place"},
    {"hr": "Croatian word", "en": "English meaning", "note": "10-25 word explanation tied to THIS specific place"}
  ],
  "didYouKnow": "1 surprising/specific factoid (~25-40 words). Must be verifiable, place-specific, not generic."
}
```

## QUALITY EXAMPLES

### EXAMPLE 1 — Trsteno (good)

```json
{
  "name": "Trsteno",
  "region": "Dalmatia",
  "icon": "🌳",
  "color": "#16a34a",
  "tagline": "Renaissance Arboretum on the Adriatic",
  "intro": "Trsteno is a tiny coastal village between Dubrovnik and Ston, famous for one thing: the 15th-century Trsteno Arboretum, the oldest Renaissance garden in Croatia and one of the oldest botanical gardens in Europe. Two ancient plane trees (over 500 years old) frame the entrance.",
  "history": "The Trsteno estate was acquired by the Dubrovnik noble Gučetić family in 1494, and they spent the next century creating a Renaissance pleasure garden. The two giant plane trees they planted in front of the entrance still stand — among the tallest and oldest in Europe. The garden survived Ragusan, Austrian, Italian, and Yugoslav rule. In 2014-15 it served as the Red Keep gardens for Game of Thrones.",
  "facts": [
    "The Trsteno Arboretum (1494) is the oldest Renaissance botanical garden in Croatia and one of the oldest in Europe",
    "The two oriental plane trees at Trsteno's entrance are over 500 years old and 60+ metres tall — among the tallest planes in Europe",
    "The Gučetić family villa at Trsteno still stands — its 16th-century chapel preserves Renaissance frescoes",
    "Trsteno served as the Red Keep gardens of King's Landing in Game of Thrones seasons 3-5",
    "The arboretum's Neptune fountain (built 1736) still works using an original Renaissance aqueduct"
  ],
  "vocab": [
    {"hr": "arboretum", "en": "arboretum / tree garden", "note": "Trsteno arboretum — the oldest in Croatia, founded 1494 by the Gučetić family"},
    {"hr": "platana", "en": "plane tree", "note": "Trsteno's two giant platane — over 500 years old. Symbol of botanical longevity"},
    {"hr": "Gučetići", "en": "the Gučetić noble family of Dubrovnik", "note": "The Gučetić family — one of the great Ragusan noble houses. Founded the Trsteno arboretum"}
  ],
  "didYouKnow": "The Trsteno plane trees were so massive by the 19th century that branches damaged in storms were used to make complete church benches — one tree branch could yield a 4-metre pew."
}
```

### EXAMPLE 2 — Plaški (good)

```json
{
  "name": "Plaški",
  "region": "Lika",
  "icon": "⛪",
  "color": "#7c3aed",
  "tagline": "Lika's Old Orthodox Centre",
  "intro": "Plaški is a Lika village south of Karlovac and north of Plitvice, the historic seat of one of the older Orthodox dioceses in Croatia — the Diocese of Gornji Karlovac (Upper Karlovac). The 18th-century Orthodox cathedral, the bishop's residence, and the surrounding karst landscape define Plaški's character.",
  "history": "Plaški was settled in waves of Serbian and Bunjevac migration into the Habsburg Military Frontier from the 16th century onwards. The Orthodox diocese was established here in 1721, and the cathedral built in 1756. The Homeland War occupied Plaški from 1991 to August 1995. Today the village has only a few hundred residents — Orthodox and Catholic, Serbian and Croatian — and the cathedral has been carefully restored.",
  "facts": [
    "Plaški was the historic seat of the Orthodox Diocese of Upper Karlovac (Gornji Karlovac) — established 1721",
    "The Orthodox Cathedral of the Presentation (1756) is one of the oldest surviving Serbian Orthodox cathedrals in Croatia",
    "Plaški was the centre of one of the largest 18th-century Orthodox printing operations in Habsburg territory",
    "The Homeland War caused most of Plaški's pre-war population to leave; today the village has under 1,500 residents",
    "The Karlovac–Plaški–Knin railway line passes through the village — historically a strategic mountain rail route"
  ],
  "vocab": [
    {"hr": "pravoslavlje", "en": "Orthodox Christianity", "note": "Plaški's pravoslavna katedrala — Orthodox cathedral. One of the oldest in Croatia"},
    {"hr": "eparhija", "en": "Orthodox diocese", "note": "The Plaški eparhija — established 1721. Historical seat of the Upper Karlovac Orthodox diocese"},
    {"hr": "graničar", "en": "military-frontier soldier", "note": "Graničari — the Habsburg military-frontier troops. Lika villages like Plaški provided generations of graničari"}
  ],
  "didYouKnow": "The Plaški Orthodox cathedral's 18th-century iconostasis was painted by the Serbian master Teodor Kračun in the 1780s — among the finest baroque-influenced Orthodox church paintings in Croatia."
}
```

## QUALITY BAR — DO NOT VIOLATE

1. **NO generic Croatian-tourism phrasing.** Banned: "charming", "picturesque", "stunning", "must-visit", "hidden gem", "Mediterranean jewel".
2. **EVERY fact must be VERIFIABLE.** If you don't know a real fact, write fewer items (minimum 4) rather than inventing.
3. **Croatian vocab must be ACTUAL CROATIAN WORDS** with correct spelling including diacritics (č, ć, đ, š, ž). The `note` must tie to THIS specific place, not generic.
4. **Dates and numbers must be REAL.** If you're not sure, write "in the 15th century" not "1467".
5. **History must reference REAL people and events.** Habsburg/Venetian/Ottoman period? Reference the actual period and rulers. Homeland War? Reference what actually happened there if you know.
6. **Croatian regions are real categorical names**, not invented. Use: Dalmatia, Istria, Kvarner, Lika, Gorski Kotar, Slavonia, Podravina, Zagorje, Međimurje, Central Croatia. If a place is in Konavle (south of Dubrovnik), use "Konavle" or "Dalmatia". Be specific.

## YOUR ASSIGNMENT

You will receive a list of city names. Write ONE entry per city, in JSON format matching the schema above. Output a single JSON file with:

```json
{
  "newCities": [
    { ... entry 1 ... },
    { ... entry 2 ... },
    ...
  ]
}
```

DO NOT write entries for cities NOT on your list. DO NOT skip cities on your list. If you genuinely don't know a city, write the best entry you can with the certain facts (location, region) and minimum 4 facts.

Output file path will be given in your specific instructions.
