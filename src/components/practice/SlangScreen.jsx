/**
 * SlangScreen — Croatian Slang, Psovanje & Street Language
 * Comprehensive guide sourced from Croatian social media, forums,
 * regional dialect resources, and Gen Z usage patterns.
 */
import React, { useState } from 'react';
import { speak, sh } from '../../data.jsx';
// Azure TTS is used with IPA phoneme encoding server-side (functions/api/tts.js)
// to deliver native-quality hr-HR-GabrijelaNeural / SreckoNeural pronunciation.

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SECTIONS = [

  // ─── 1. THE CLASSICS ────────────────────────────────────────────────────────
  {
    id: 'classics', icon: '🔥', title: 'The Classics',
    subtitle: 'The essential Croatian expletives — an artform built on one root verb',
    color: '#dc2626', light: '#fff1f2', border: '#fca5a5',
    entries: [
      { hr: 'Jebem ti mater', en: 'I f*** your mother', ph: 'YEH-bem tee MAH-tehr', level: '🌶🌶🌶',
        note: 'The foundational Croatian curse. Everything builds from this. "Jebem" = I f***, "ti" = your, "mater" = mother (archaic accusative). Versatile — expresses rage, awe, or deep affection depending on tone.',
        variants: [
          { hr: 'Jebem ti mater po rebru', en: '...your mother by the rib — adding body parts for emphasis' },
          { hr: 'Jebem mu mater', en: 'Third person — used when raging at a situation, not a person' },
          { hr: 'Mamicu im jebem', en: 'Slavonian intensifier — "mamicu" is a diminutive of mama, paradoxically making it more informal and cutting' },
          { hr: 'Jebemo si mater', en: 'Reciprocal form using "si" (dative of sebe) — "we f*** each other\'s mothers" — uniquely South Slavic grammatical construction' },
          { hr: 'Tri pizde materine', en: 'Triple maternal intensification — Slavonian/Bosnian escalation for when once isn\'t nearly enough' },
          { hr: 'Jebo te Bog', en: 'May God f*** you — invoking the divine for maximum impact' },
          { hr: 'Jebo ti pas mater', en: 'May a dog f*** your mother — multi-species escalation' },
          { hr: 'Jebo ti konj mater', en: 'May a horse f*** your mother — equine variant' },
          { hr: 'Jebem ti sve po spisku', en: 'F***ing everything on your list — when listing family feels like too much effort' },
          { hr: 'Jebem ti krv mlade rode', en: 'F***ing your blood of a young stork — peak Croatian poetic creativity' },
          { hr: 'Jebem ti juhu od Isusovih kostiju', en: 'F***ing your soup made of Jesus\' bones — considered a masterpiece of the form' },
        ]},
      { hr: 'Jebote', en: 'Holy sh** / F*** me / Wow', ph: 'YEH-boh-teh', level: '🌶🌶',
        note: 'Short for "jebo te." Functionally equivalent to "Jesus Christ!" — used for surprise, frustration, amazement. Very high frequency. Almost neutral in casual Zagreb speech.',
        variants: [
          { hr: 'Ma jebote...', en: 'Oh for f***\'s sake...' },
          { hr: 'Jebote pa to je nevjerojatno', en: 'Holy sh**, that\'s unbelievable' },
        ]},
      { hr: 'Jebi ga', en: 'F*** it / Whatever / Oh well', ph: 'YEH-bee gah', level: '🌶🌶',
        note: '"Jebi ga" is used like a verbal comma among Croatians. Almost neutral in context — expressing resignation, acceptance, or mild frustration. You\'ll hear it multiple times in any casual conversation.',
        variants: [
          { hr: 'A jebi ga', en: 'Ah, forget it / What can you do — the Croatian shrug' },
          { hr: 'Jebi ga, bit će bolje', en: 'F*** it, it\'ll get better' },
        ]},
      { hr: 'Boli me kurac', en: 'I couldn\'t care less', ph: 'BOH-lee meh KOO-rahts', level: '🌶🌶🌶',
        note: 'Literally "my d*** hurts." Grammatically pristine — boli (hurts) + me (me) + kurac. Means complete indifference. The full "I don\'t care" ladder: "Nije me briga" → "Boli me briga" → "Boli me kurac."',
        variants: [
          { hr: 'Pun mi je kurac svega', en: 'I\'m fed up with everything — "my d*** is full"' },
          { hr: 'Koji kurac radiš?!', en: 'What the f*** are you doing?!' },
          { hr: 'U kurac!', en: 'F*** that! / No f***ing way!' },
          { hr: 'Kurac od ovce', en: 'A sheep\'s d*** = completely useless / worthless' },
          { hr: 'Ni kurac', en: 'Absolutely nothing / Not a damn thing' },
          { hr: 'Pičkin dim', en: 'P*ssy smoke = nothing / don\'t believe the hype' },
        ]},
      { hr: 'Idi u pizdu materinu', en: 'The Croatian nuclear option', ph: 'EE-dee oo PEEZ-doo mah-TEH-ree-noo', level: '🌶🌶🌶',
        note: 'The maximum escalation. "Idi" = go, "u pizdu" = into the c***, "materinu" = of your mother. Reserve for absolute final breaks. Three versions for increasing intensity.',
        variants: [
          { hr: 'Idi u tri pičke materine', en: 'The triple version — for when once isn\'t enough' },
          { hr: 'Idi u pičku strininu', en: 'Aunt variant — the unexpected family member escalation' },
        ]},
      { hr: 'Odjebi', en: 'F*** off', ph: 'OD-yeh-bee', level: '🌶🌶',
        note: 'Clean, direct dismissal. "Odjebi odmah" = F*** off right now. Less elaborate than the mater constructions but efficient. Often paired with "bre" for extra emphasis.',
        variants: [
          { hr: 'Jebi se', en: 'Go f*** yourself — direct' },
          { hr: 'Nabijem te na kurac', en: 'I\'ll stick you on a d*** — threat-level insult' },
          { hr: 'Jebeš tebe i tvog oca', en: 'F*** you and your father — rare father variant; most curses target mothers, this extends to the whole male line' },
        ]},
      { hr: 'Jebačina', en: 'An almighty f***-up / absolute chaos', ph: 'yeh-BAH-chee-nah', level: '🌶🌶🌶',
        note: 'The suffix -čina added to "jebanje" (fucking) creates an augmentative noun — something elevated to an epic, absurd scale. "Polarna jebačina" (polar f***-fest) is the Krankšvester classic: "Dupe od pingvina, kurac od eskima, morzeva vagina, polarna jebačina." Pure absurdist Croatian wordcraft.',
        variants: [
          { hr: 'Polarna jebačina', en: 'Polar f***-fest — the Krankšvester construction; Arctic absurdism at its finest' },
          { hr: 'Moj kurac je odavno prekinuo s tobom', en: 'My dick broke up with you long ago — anthropomorphizing the penis as a subject with relationship agency; peak Croatian literary humor' },
          { hr: 'Pucaj si u kurac', en: 'Shoot yourself in the dick — reflexive "si" (dative) makes it a self-directed action; grammatically pristine while maximally absurd' },
        ]},
      { hr: 'Šupak', en: 'A**hole', ph: 'SHOO-pahk', level: '🌶🌶',
        note: 'From "šupljina" (hole). The Croatian all-purpose "a**hole." Widely used, cross-generational. "Šupčić" is the affectionate diminutive between friends. "Kakav šupak!" = What an a**hole!',
        variants: [
          { hr: 'Kurvin sine', en: 'Son of a b**** — literally "son of a wh***"' },
          { hr: 'Đubre', en: 'Garbage / Piece of trash — "Ti si đubre"' },
          { hr: 'Glupi majmune', en: 'You stupid monkey' },
        ]},
    ],
  },

  // ─── 2. EVERYDAY EXPRESSIONS ────────────────────────────────────────────────
  {
    id: 'everyday', icon: '😤', title: 'Svaki Dan',
    subtitle: 'Mild-to-medium — usable around most adults',
    color: '#d97706', light: '#fffbeb', border: '#fde68a',
    entries: [
      { hr: 'Sranje', en: 'Sh** / Crap', ph: 'SRAH-nyeh', level: '🌶',
        note: 'All-purpose "sh**." Minor disasters, frustrations, surprises. Cross-generational. "Sranja" = a bunch of crap. "Ne seri" / "nemoj srat" = stop bullsh***ing me — "srat" is the contracted infinitive of "srati," marking fast colloquial speech.',
        variants: [
          { hr: 'Kakvo sranje', en: 'What a mess / What a load of crap' },
          { hr: 'Ne seri / Nemoj srat\'', en: 'Don\'t bullsh** me — "srat\'" is a contracted infinitive; the apostrophe marks the dropped -i, typical of fast Zagreb speech' },
          { hr: 'Napravio si sranje', en: 'You made a mess / You screwed up' },
        ]},
      { hr: 'Sjebano', en: 'F***ed up', ph: 'SYEH-bah-noh', level: '🌶🌶',
        note: 'Past participle of "sjebati." For situations, things, people, or yourself. "Sve je sjebano" = Everything is f***ed. One of the most versatile Croatian adjectives.',
        variants: [
          { hr: 'Totalno sam sjebo', en: 'I totally screwed up' },
          { hr: 'Zajebao sam', en: 'I messed it up / I f***ed that up' },
          { hr: 'Zajebavaš me', en: 'You\'re messing with me / You\'re kidding me' },
        ]},
      { hr: 'Govno', en: 'Sh** (literal)', ph: 'GOV-noh', level: '🌶',
        note: 'The literal word for sh**. "Govnar" = a sh***y person. Used as noun and exclamation. "Govno jedno" = piece of sh**.',
        variants: [
          { hr: 'Govno jedno', en: 'Piece of sh** — direct insult' },
          { hr: 'Jedi govna', en: 'Eat sh** — extreme dismissal' },
          { hr: 'Govnar', en: 'A sh***y/worthless person' },
        ]},
      { hr: 'Majku mu / Majku ti', en: 'Damn it / F*** (mild)', ph: 'MY-koo moo / MY-koo tee', level: '🌶',
        note: 'Shortened mater curse — "his/your mother" (accusative implied). Widely used as a mild expletive, equivalent to "damn it." Totally normal in conversation.',
        variants: [
          { hr: 'Majko moja', en: 'Oh my God / Oh my mother — surprise/disbelief' },
          { hr: 'Jao', en: 'Oh no / Ouch — very mild exclamation' },
          { hr: 'Ajme', en: 'Oh my / Oh dear — surprise or pain' },
        ]},
      { hr: 'Popizdio je', en: 'He lost his mind / He flipped out', ph: 'poh-peez-DEE-oh', level: '🌶🌶🌶',
        note: '"Popizditi" = to go insane with rage or excitement. Can be positive ("we all went crazy with excitement") or negative ("he completely lost it"). Very expressive verb.',
        variants: [
          { hr: 'Popizdio od sreće', en: 'Went crazy with happiness' },
          { hr: 'Pizdjen sam danas', en: 'I\'m in a sh** mood today' },
          { hr: 'Pizdarija', en: 'A total f***-up / complete mess' },
        ]},
      { hr: 'Jebu me živci', en: 'My nerves are screwing me / I\'m losing it', ph: 'YEH-boo meh ZHEEV-tsee', level: '🌶🌶',
        note: 'Abstract nouns as the agent doing the "jebanje" — a uniquely native construction. "Jebati" in 3rd person plural (jebu) + abstract subject. Not calqued from English at all. "Jebu me živci" = my nerves are f***ing me over. "Jebu me emocije" = my emotions are destroying me. Productive pattern: swap any abstract noun in.',
        variants: [
          { hr: 'Jebu me emocije', en: 'My emotions are killing me — abstract agent doing the screwing; Bore Balboa uses this exact construction' },
          { hr: 'Jebu me ove situacije', en: 'These situations are doing me in — fully productive: any plural noun can be the agent' },
          { hr: 'Jebe mi mozak', en: 'It\'s screwing with my brain — singular "jebe" + "mi" (dative) + mozak (brain); also means someone is messing with your head' },
        ]},
      { hr: 'Crkni', en: 'Drop dead', ph: 'TSRK-nee', level: '🌶🌶',
        note: 'From "crknuti" (to die like an animal). "Crkni" is imperative. Between friends it\'s often affectionate teasing. "Crknuo sam od smijeha" = I died laughing.',
        variants: [
          { hr: 'Crknuo sam od smijeha', en: 'I died laughing — common positive use' },
          { hr: 'Dabog da ti se noge osušile', en: 'May your legs dry out — old-school hex curse' },
          { hr: 'Vrag ti kosti glodao', en: 'May the Devil gnaw your bones — classical hex' },
        ]},
      { hr: 'Frka', en: 'Panic / Stress / Chaos', ph: 'FER-kah', level: '✅',
        note: 'Zagreb-heavy. "Totalna frka" = total panic. "Nema frke" = no stress, relax. One of the most used Zagreb colloquialisms.',
        variants: [
          { hr: 'Nema frke', en: 'No stress / It\'s fine / Relax' },
          { hr: 'Totalna frka', en: 'Complete chaos / Total panic' },
        ]},
      { hr: 'Katastrofa', en: 'Disaster / Total mess', ph: 'kah-tah-STROH-fah', level: '✅',
        note: 'Used as hyperbolic exclamation. "Kakva katastrofa!" = What a disaster! Perfectly valid both for real disasters and minor inconveniences (Croatians love dramatic hyperbole).',
        variants: [
          { hr: 'Kakva katastrofa', en: 'What a disaster! (mild or major)' },
          { hr: 'Bruka', en: 'Embarrassment / Shame — "kakva bruka" = how embarrassing' },
        ]},
    ],
  },

  // ─── 3. STREET SLANG ────────────────────────────────────────────────────────
  {
    id: 'slang', icon: '😎', title: 'Ulični Sleng',
    subtitle: 'Sound like a local — general everyday slang',
    color: '#7c3aed', light: '#faf5ff', border: '#ddd6fe',
    entries: [
      { hr: 'Zakon!', en: 'Awesome! / Brilliant! / The law', ph: 'ZAH-kon', level: '✅',
        note: 'Literally "the law." The most universally positive Croatian exclamation. "Ovaj film je zakon!" = This film is awesome. Usable at any age, any context.',
        variants: [
          { hr: 'Brutala!', en: 'Brutal (positive!) / Amazing — "To je brutala" = That\'s amazing' },
          { hr: 'Top!', en: 'Top notch / Excellent — "To je top"' },
          { hr: 'Oriđiđi', en: 'Original / The real deal — "On je oriđiđi" = He\'s genuine' },
        ]},
      { hr: 'Kužiš?', en: 'You get it? / You know what I mean?', ph: 'KOO-zhish', level: '✅',
        note: 'From "kužiti" (to understand/sniff out). Mandatory at the end of sentences like "you know?" Used constantly. The Croatian capisce.',
        variants: [
          { hr: 'Kontam', en: 'I get it / I understand — from "kontati"' },
          { hr: 'Skontaj', en: 'Figure it out / Get it through your head' },
          { hr: 'Skužio sam', en: 'I figured it out / I got it' },
        ]},
      { hr: 'Fora', en: 'Joke / Cool / The point', ph: 'FOH-rah', level: '✅',
        note: 'Borrowed from Italian "fuori." "Koja fora" = What a cool/funny thing. "To je fora" = That\'s the joke OR that\'s the cool thing. "Nema fore" = not cool / no joke.',
        variants: [
          { hr: 'Koja fora!', en: 'That\'s hilarious! / What a trick!' },
          { hr: 'Nema fore', en: 'No joke / Seriously / That\'s not cool' },
          { hr: 'Fora lik', en: 'Cool guy' },
        ]},
      { hr: 'Brate / Buraz', en: 'Bro / Dude / Man', ph: 'BRAH-teh / BOO-rahz', level: '✅',
        note: '"Brat" = brother, "brate" = vocative (direct address). "Buraz" = more Zagreb slang. Both used like "bro." Tone determines everything — can express disbelief, affection, or urgency. Note: "buraz moj" (not "moj buraz") — reversed possessive word order marks street register; textbook says "moj brat," the street says "buraz moj."',
        variants: [
          { hr: 'Brate moj, ne mogu', en: 'Bro, I just can\'t even' },
          { hr: 'Ma buraz, jesi normalan?', en: 'Dude, are you normal?' },
          { hr: 'Buraz moj', en: 'My bro (reversed word order) — possessive after noun = maximum street register; textbook Croatian puts possessive first' },
          { hr: 'Stari / Stara', en: 'Old man / Old lady — also means Dad/Mum in slang' },
        ]},
      { hr: 'Faca', en: 'A big deal / Someone important', ph: 'FAH-tsah', level: '✅',
        note: 'From Italian "faccia" (face). "On je faca" = He\'s someone important / He\'s a big deal. Also used admiringly: "Jebote, faca si!" = Holy sh**, you\'re a legend!',
        variants: [
          { hr: 'Jebote, faca si!', en: 'Holy sh**, you\'re a legend! (huge compliment)' },
          { hr: 'Šmeker', en: 'Smooth operator / Charmer — someone with game' },
          { hr: 'Frajer', en: 'Cool confident guy — "Kakav frajer!"' },
        ]},
      { hr: 'Ful / Baš', en: 'Super / Really / Very', ph: 'FOOL / BAHSH', level: '✅',
        note: '"Ful" from English "full." "Baš" is the milder universal intensifier. "Ful sam umoran" = I\'m totally tired. "Baš lijepo" = Really nice.',
        variants: [
          { hr: 'Ful dobro', en: 'Really good / Super good' },
          { hr: 'Fakat', en: 'For real / Seriously — from Turkish; "fakat je lud" = he\'s genuinely crazy' },
          { hr: 'Ziher', en: 'For sure / Definitely — from German "sicher"; Zagreb-heavy' },
        ]},
      { hr: 'Ma daj!', en: 'Come on! / No way! / Are you serious?', ph: 'mah DIE', level: '✅',
        note: '"Ma" (filler/softener) + "daj" (give/come on). Tone determines meaning completely: disbelief, mild frustration, encouragement. One of the most-used phrases in Croatian.',
        variants: [
          { hr: 'Ma daj, nije moguće', en: 'No way, that\'s impossible' },
          { hr: 'Daj već jednom', en: 'Come on already / Just do it' },
          { hr: 'Kako da ne', en: 'Of course... NOT — sarcastic' },
        ]},
      { hr: 'Bezveze / Bez veze', en: 'Pointless / Lame / For nothing', ph: 'bez-VEH-zeh', level: '✅',
        note: '"Bez veze" = without connection/reason. One of the most used words in Croatian casual speech. Everything bad or pointless is "bezveze."',
        variants: [
          { hr: 'Nema veze', en: 'No worries / Doesn\'t matter / It\'s fine' },
          { hr: 'Dosadnjak', en: 'Boring person — the person at the party who kills vibes' },
          { hr: 'Lapim', en: 'I\'m bored to death — "lapiti" = to be extremely bored' },
        ]},
      { hr: 'Brijati', en: 'To think / to be into / to date', ph: 'BREE-yah-tee', level: '✅',
        note: 'One of the most multi-functional Croatian verbs. "Brijem da neće doći" = I don\'t think he\'ll come. "Brijam na njega" = I\'m into him. "Brijemo se zajedno" = We\'re dating.',
        variants: [
          { hr: 'Furati', en: 'To wear / to drive / to date / to rock — "Furaj to!" = Rock it!' },
          { hr: 'Bariti', en: 'To flirt / hit on someone — "Bari je od prvog dana"' },
          { hr: 'Skompati se', en: 'To click with someone / become friends instantly' },
        ]},
      { hr: 'Pomalo', en: 'Easy / Take it slow / Gradually', ph: 'poh-MAH-loh', level: '✅',
        note: 'The coastal philosophy of life in one word. Not just "slowly" but an entire attitude — don\'t rush, enjoy the moment, it\'ll happen. The Dalmatian response to any urgency.',
        variants: [
          { hr: 'Sve pet', en: 'Everything\'s great — literally "all five (out of five)"' },
          { hr: 'To je to!', en: 'That\'s it! / That\'s the one! — approval' },
          { hr: 'Ajde / Ajmo', en: 'Come on / Let\'s go — "Ajmo!" = let\'s do this' },
        ]},
      { hr: 'Muljati', en: 'To lie / to deceive / to hustle', ph: 'MOO-lyah-tee', level: '✅',
        note: '"Ne muljaj" = Don\'t lie to me / stop hustling me. "Muljator" = a hustler/con artist. Heavy use in Zagreb.',
        variants: [
          { hr: 'Ne muljaj', en: 'Don\'t lie to me / Stop bullsh***ing' },
          { hr: 'Fejkati', en: 'To fake — direct from English; "fejka me" = he\'s faking me out' },
          { hr: 'Nacrtan se', en: 'He just showed up out of nowhere — "odjednom se nacrtao"' },
        ]},
      { hr: '\'Oće kurac', en: 'Yeah right / Fat chance / As if', ph: 'OH-cheh KOO-rahts', level: '🌶🌶',
        note: '"Hoće" contracted to "\'oće" (3rd sg. present of htjeti = to want). Literally "dick wants it" — used as a sarcastic complete denial of something. If someone says "Misliš da ću platiti?" and you answer "\'Oće kurac" — you\'re saying "fat chance." Kuku$ built an entire song around this phrase. Non-native speakers cannot guess the meaning from the words — must be learned as a unit.',
        variants: [
          { hr: '\'Oće kurac da plaća!', en: 'Yeah right he\'s paying! — sarcastic: he\'s definitely not paying' },
          { hr: 'Kurac \'oće', en: 'Reversed word order for even more emphasis — same meaning, stronger disbelief' },
          { hr: 'Isp\'o pička', en: 'He turned out to be a coward — "ispao" contracted to "isp\'o" + "pička" as predicate nominative; the -ao → -o contraction marks fast colloquial speech throughout Croatia' },
        ]},
      { hr: 'Kontrakcije — o\'šo, pos\'o, rek\'o', en: 'Contracted past tense — how Croatians actually speak', ph: '—', level: '📚',
        note: 'In fast colloquial speech, masculine past participles drop "-ao" to "-o": "otišao" → "o\'šo," "posao" → "pos\'o," "rekao" → "rek\'o," "došao" → "dos\'o," "ispao" → "isp\'o." The apostrophe marks the elision. Textbook Croatian always writes the full form. Hearing these contractions means someone is speaking naturally, not performing for you.',
        variants: [
          { hr: 'O\'šo je', en: 'He went / He left — "otišao je" in written Croatian' },
          { hr: 'Pos\'o mi je sranje', en: 'My job is sh** — "posao" contracted; both colloquial markers stacked' },
          { hr: 'Rek\'o sam ti', en: 'I told you — "rekao sam" contracted; used constantly in casual speech' },
          { hr: 'Dos\'o sam', en: 'I arrived / I came — "došao sam" contracted' },
        ]},
      { hr: 'Biti u banani', en: 'To be in trouble / to have a problem', ph: 'BOO-tee oo bah-NAH-nee', level: '✅',
        note: 'Literally "to be in a banana." "U banani smo" = We\'re in trouble. One of many Croatian idioms using random nouns to describe bad situations.',
        variants: [
          { hr: 'U banani smo', en: 'We\'re in trouble / We\'re in a jam' },
          { hr: 'Pošorati se', en: 'To get into a fight (Zagreb) — "pošorali su se" = they fought' },
          { hr: 'Brukati se', en: 'To embarrass yourself — "nemoj se brukati"' },
        ]},
    ],
  },

  // ─── 4. PEOPLE & ADDRESSES ──────────────────────────────────────────────────
  {
    id: 'people', icon: '👥', title: 'Ljudi i Adrese',
    subtitle: 'How Croatians address and describe each other',
    color: '#0e7490', light: '#f0f9ff', border: '#7dd3fc',
    entries: [
      { hr: 'Lik / Tip', en: 'Guy / Dude', ph: 'LEEK / TEEP', level: '✅',
        note: '"Lik" for any male person. "Što je to za lik?" = What kind of guy is that? "Likuša" for female. Very common — the Croatian equivalent of "dude/bloke."',
        variants: [
          { hr: 'Klinac / Klinka', en: 'Kid / Young person — "mali klinac" = little kid' },
          { hr: 'Cura', en: 'Girl / Girlfriend — standard informal' },
          { hr: 'Dečko', en: 'Boy / Boyfriend — standard informal' },
        ]},
      { hr: 'Ekipa', en: 'Squad / Crew / Friend group', ph: 'EH-kee-pah', level: '✅',
        note: '"Idemo s ekipom" = We\'re going with the crew. The primary word for your friend group. "Cijela ekipa" = the whole gang.',
        variants: [
          { hr: 'Banda', en: 'Gang / Crew — can imply more trouble than ekipa' },
          { hr: 'Mala / Mali', en: 'Little one / Girl/Guy — affectionate for someone younger' },
          { hr: 'Šef', en: 'Boss — also used to address strangers respectfully' },
          { hr: 'Dušmani', en: 'Enemies — from Turkish "düşman"; Ottoman-era borrowing used in Dalmatian and Slavonian street speech; "dušmani će uvik lajat\'" = enemies will always bark (Bore Balboa)' },
        ]},
      { hr: 'Šupak / Debil', en: 'A**hole / Moron (insults)', ph: 'SHOO-pahk / DEH-beel', level: '🌶🌶',
        note: 'The Croatian standard insult pair. "Šupak" = a**hole, "debil" = moron. Both universal across Croatia. Can be affectionate between close friends.',
        variants: [
          { hr: 'Mamlaz', en: 'Idiot / Knucklehead — "koji mamlaz!"' },
          { hr: 'Levat', en: 'Idiot (Zagreb-specific) — "kakav levat!"' },
          { hr: 'Kreten', en: 'Cretin / Moron — cross-regional' },
          { hr: 'Tukac', en: 'Idiot (Dalmatian) — "kakav tukac!"' },
          { hr: 'Jazavac', en: 'Social outcast — literally "badger"' },
        ]},
      { hr: 'Mačka / Riba', en: 'Hot woman (cat / fish)', ph: 'MACH-kah / REE-bah', level: '🌶',
        note: 'Both used for attractive women. "Mačka" (cat) is slightly more respectful. "Riba" (fish) is more objectifying. "Kakva mačka!" = What a babe! Context matters.',
        variants: [
          { hr: 'Čista 10', en: 'A perfect ten — "ona je čista 10"' },
          { hr: 'Snack', en: 'Attractive person — English loanword used natively by Gen Z' },
          { hr: 'Sladak / Slatka', en: 'Sweet / Cute' },
        ]},
      { hr: 'Cinkaroš', en: 'Snitch / Whistleblower', ph: 'tseen-kah-ROSH', level: '🌶',
        note: '"Ne budi cinkaroš" = Don\'t be a snitch. "Cinkati" = to snitch. Universal rule across all Croatian social groups.',
        variants: [
          { hr: 'Ne budi cinkaroš', en: 'Don\'t be a snitch' },
          { hr: 'Džaba-džabist', en: 'Freeloader — someone who never pays for anything' },
          { hr: 'Palamudit', en: 'Show-off / Acting smart — Dalmatian' },
        ]},
      { hr: 'Pizdjen/a', en: 'In a foul mood', ph: 'PEEZ-dyen', level: '🌶🌶',
        note: '"Pizdjena sam danas" = I\'m in a sh** mood today. Describes that particular feeling when everything is irritating you. Extremely common, especially after bad sleep.',
        variants: [
          { hr: 'Ljut ko pas', en: 'Angry as a dog — furious' },
          { hr: 'Idan/Idna', en: 'Angry / Furious — Dalmatian; "totalno sam idan"' },
          { hr: 'Grinta', en: 'Nagging / Complaining — "što toliko grintaš?"' },
        ]},
    ],
  },

  // ─── 5. DALMATIAN ───────────────────────────────────────────────────────────
  {
    id: 'dalmatian', icon: '☀️', title: 'Dalmatinski',
    subtitle: 'Split, Dalmatia & coast — a world of its own',
    color: '#0369a1', light: '#f0f9ff', border: '#93c5fd',
    entries: [
      { hr: 'Fjaka', en: 'The art of doing nothing', ph: 'FYAH-kah', level: '⚓',
        note: 'The defining Dalmatian concept. Not just laziness — fjaka is a meditative, philosophical state of not doing anything and being completely at peace with that. The coast\'s answer to hustle culture.',
        variants: [
          { hr: 'Tramak', en: 'Reluctance to do tasks — related to fjaka; refusing unnecessary effort' },
          { hr: 'Pomalo', en: 'Easy / Take it slow — the coastal philosophy in one word' },
          { hr: 'Guštati', en: 'To enjoy / savor — "guštam u ovom" = I\'m really savoring this' },
        ]},
      { hr: 'Ćakula', en: 'Chat / Gossip / Small talk', ph: 'CHAH-koo-lah', level: '⚓',
        note: '"Idemo na ćakulu" = Let\'s have a chat. The art of sitting and talking with no agenda. Essential coastal social activity.',
        variants: [
          { hr: 'Bufun / Bufunat', en: 'Jokester / To clown around — someone always fooling' },
          { hr: 'Burdil', en: 'Madness / Total chaos — "kakav burdil!"' },
          { hr: 'Brontulat', en: 'Complaining / talking nonsense constantly' },
        ]},
      { hr: 'Šoldi', en: 'Money (Dalmatian)', ph: 'SHOL-dee', level: '⚓',
        note: 'From Italian "soldi." The Dalmatian word for money. Zagreb says "lova" or "kinta" — Dalmatia says "šoldi." Also "mukte" = free/for nothing.',
        variants: [
          { hr: 'Mukte', en: 'Free / For nothing — "dobio sam mukte" = I got it for free' },
          { hr: 'Spiza', en: 'Groceries / Food shopping — "idem po spizu"' },
          { hr: 'Piaca / Pijaca', en: 'Market — from Italian "piazza"; the social hub' },
        ]},
      { hr: 'Pegulan', en: 'Unlucky person', ph: 'peh-GOO-lahn', level: '⚓',
        note: '"Ima pegulu" = He\'s got bad luck. "Pegulan" = chronically unlucky person. Dalmatian-specific. The person who always somehow ends up in the worst situation.',
        variants: [
          { hr: 'Dišpeta / Iz dišpeta', en: 'Spite / Out of spite — "napravio to iz dišpeta"' },
          { hr: 'Priša', en: 'Pressure / Rushing — "nemoj mi praviti prišu" = don\'t rush me' },
          { hr: 'A nec!', en: 'No way! / No chance! — strong Dalmatian refusal' },
        ]},
      { hr: 'Makina', en: 'Car (Dalmatian)', ph: 'MAH-kee-nah', level: '⚓',
        note: 'From Italian "macchina." Zagreb says "kola" or "auto" — Dalmatia says "makina." Part of a rich Italian vocabulary layer across all of coastal life.',
        variants: [
          { hr: 'Šjor', en: 'Mister / Gentleman — from Italian "signore"; respectful address' },
          { hr: 'Barba', en: 'Uncle / Old man — respectful informal address for older men' },
          { hr: 'Cukarin', en: 'Sweetie / Sugar — term of endearment; from Italian "zucchero"' },
          { hr: 'Ojro', en: 'Euro (money) — phonological adaptation of "euro" into Dalmatian speech; also general slang for cash' },
        ]},
      { hr: 'Uvik / Nisan / Sisa\' sa planine', en: 'Ikavian dialect markers — instant coast identification', ph: 'OO-veek / NEE-sahn', level: '⚓',
        note: 'Three words that instantly mark a Dalmatian speaker. "Uvik" = uvijek (always) — Ikavian vowel shift (ij→i). "Nisan" = nisam (I am not) — final -m dropped, characteristic of Dalmatian/Chakavian. "Sisa\' sa planine" = literally "sucked from the mountain" — calling someone a naive provincial. Bore Balboa: "dušmani će uvik lajat\'" — one word, instant coastal ID.',
        variants: [
          { hr: 'Uvik', en: 'Always (Dalmatian) — standard Croatian: uvijek; the "ij→i" Ikavian shift marks coastal origin' },
          { hr: 'Nisan', en: 'I\'m not (Dalmatian) — standard: nisam; dropped final -m is a Dalmatian/Chakavian phonological feature' },
          { hr: 'Sisa\' sa planine', en: 'Sucked from the mountain — dismissing someone as a naive provincial; the contraction "sisa\'" (-ao → -o → -a\') marks fast Dalmatian speech' },
        ]},
      { hr: 'Retaj / Redikul', en: 'Fool / Laughingstock (Dalmatian insults)', ph: 'REH-tai / REH-dee-kool', level: '🌶',
        note: '"Redikul" from Italian "ridicolo" = ridiculous. "Retaj" = a fool, dropout, someone who dropped out of the normal social order. Distinctly Dalmatian insults that don\'t translate elsewhere.',
        variants: [
          { hr: 'Tukac', en: 'Idiot — the standard Dalmatian go-to insult' },
          { hr: 'Greza / Grezulja', en: 'Ugly / rough — "totalna grezulja" = completely rough/unattractive' },
          { hr: 'Štraca', en: 'Rag / promiscuous woman — Dalmatian derogatory; from Italian "straccio"' },
        ]},
      { hr: 'Picigin', en: 'The sport of Split', ph: 'PEE-tsee-geen', level: '⚓',
        note: 'Traditional Split ball game played in very shallow sea water — players keep a ball in the air with acrobatic kicks and dives. Icon of Split beach culture. Knowing this word = instant local respect.',
        variants: [
          { hr: 'Mol / Mul', en: 'Pier / Marina — "skočiti s mola" = jump from the pier (rite of passage)' },
          { hr: 'Badić', en: 'Swimsuit — the essential summer vocabulary' },
          { hr: 'Šugaman', en: 'Towel — cannot go to the beach without your šugaman' },
        ]},
    ],
  },

  // ─── 6. ZAGREB / KAJKAVIAN ──────────────────────────────────────────────────
  {
    id: 'zagreb', icon: '🏙️', title: 'Zagrebački',
    subtitle: 'Capital city slang — where German meets Slavic',
    color: '#16a34a', light: '#f0fdf4', border: '#86efac',
    entries: [
      { hr: 'Kaj', en: 'What (Kajkavian)', ph: 'KAI', level: '🏙️',
        note: 'The defining Zagreb word. "Kaj" replaces "što/šta" (standard Croatian). "Kaj ima?" = What\'s up? The single fastest way to identify a Zagrebčan.',
        variants: [
          { hr: 'Kaj ima?', en: 'What\'s up? — the Zagreb greeting' },
          { hr: 'Doma', en: 'At home — used in both Zagreb and Dalmatia' },
          { hr: 'Tekma', en: 'Match / Game — "gledamo tekmu" = we\'re watching the match' },
        ]},
      { hr: 'Cugati / Cuga', en: 'To drink (booze) / A drinking session', ph: 'TSOO-gah-tee / TSOO-gah', level: '🍺',
        note: 'Zagreb-heavy. "Idemo cugati" = Let\'s go drinking. "Hoćemo li na cugu?" = Shall we go for drinks? The equivalent of going for pints.',
        variants: [
          { hr: 'Birc', en: 'Bar / Pub — from German "Wirtshaus"; the Zagreb local bar' },
          { hr: 'Viksa', en: 'Holiday home / weekend house — short for "vikendica"' },
          { hr: 'Špica', en: 'The main scene — being seen on Tkalčićeva; Zagreb\'s social stage' },
        ]},
      { hr: 'Murja', en: 'The Police', ph: 'MOOR-yah', level: '🏙️',
        note: '"Dolazi murja!" = The cops are coming! Zagreb street slang for police. Not used in Dalmatia (they say "policija" or regional variants).',
        variants: [
          { hr: 'Šora', en: 'A fight (Zagreb) — "bila je šora" = there was a fight' },
          { hr: 'Nogoš', en: 'Football — short for "nogomet"; used casually' },
          { hr: 'Trac', en: 'Tram — short for "tramvaj"; the Zagreb lifeline' },
        ]},
      { hr: 'Frajla', en: 'Miss / Young lady', ph: 'FRAY-lah', level: '🏙️',
        note: 'From German "Fräulein." The Zagreb German influence — Zagreb was heavily influenced by Austro-Hungarian culture. Slightly old-fashioned now but still heard.',
        variants: [
          { hr: 'Ziher', en: 'For sure / Definitely — from German "sicher"' },
          { hr: 'Šljiva mi je', en: 'I\'m cold — literally "my plum is cold"; uniquely Zagreb' },
          { hr: 'Šora', en: 'Fight — from German "Schar" (crowd/brawl)' },
        ]},
      { hr: 'Pazi kaj se dela', en: 'Watch what\'s happening', ph: 'PAH-zee kai seh DEH-lah', level: '🏙️',
        note: 'Two Kajkavian markers stacked: "kaj" (what/that) instead of standard "što," and "dela" (is being done) instead of standard "radi." This single sentence broadcasts Zagreb street origin immediately. Kuku$ uses exactly this construction. Any Zagreb native will recognize a non-Kajkavian speaker the moment they say "što se radi" instead.',
        variants: [
          { hr: 'Kaj ima?', en: 'What\'s up? — the Kajkavian greeting; standard Croatian: "što ima?"' },
          { hr: 'Kvart', en: 'Neighborhood / Block — from German "Quartier" via Austro-Hungarian Zagreb; "kruzamo po kvartu" = we\'re cruising the neighborhood (Kuku$)' },
          { hr: 'Kruzamo / Tegamo', en: 'Cruising / Hanging around — "kruzamo" from English "cruise" with Croatian endings; "tegamo" = Zagreb street verb for lingering menacingly; both from Kuku$ lyrics' },
          { hr: 'Kesu riješit\'', en: 'Sort out the money — "kesa" (bag) = cash in Zagreb slang; "riješiti" (to solve) = to handle business; contracted infinitive marks colloquial register' },
        ]},
    ],
  },

  // ─── 7. ŠATROVAČKI ──────────────────────────────────────────────────────────
  {
    id: 'satrovski', icon: '🔄', title: 'Šatrovački',
    subtitle: 'Syllable-reversal street language — the Croatian secret code',
    color: '#9333ea', light: '#faf5ff', border: '#d8b4fe',
    entries: [
      { hr: 'What is Šatrovački?', en: 'Croatia\'s street code — syllables swapped', ph: '—', level: '📚',
        note: 'Šatrovački is a form of slang where words are split and syllables reversed, sometimes with vowel changes. Originated in criminal and underground culture, now common among youth. "Vopi" instead of "pivo," "ćešho" instead of "hoćeš." Once you learn the pattern you can invent any word.',
        variants: [
          { hr: 'Vopi', en: '"Pivo" (beer) reversed — the most famous example' },
          { hr: 'Ćešho', en: '"Hoćeš" (do you want) reversed' },
        ]},
      { hr: 'Vopi', en: 'Beer (pivo reversed)', ph: 'VOH-pee', level: '🔄',
        note: 'The most famous šatrovački word. "Pivo" → split at consonant → "pi-vo" → swap → "vo-pi" = "vopi." Ask for a "vopi" at a Zagreb bar and locals will love you.',
        variants: [
          { hr: 'Zika', en: '"Muzika" (music) — reversed and shortened' },
          { hr: 'Mado', en: '"Doma" (home) reversed' },
          { hr: 'Trasu', en: '"Sutra" (tomorrow) reversed' },
        ]},
      { hr: 'Vutra', en: 'Weed / Grass (trava reversed)', ph: 'VOO-trah', level: '🔄',
        note: '"Trava" (grass/weed) → reversed → "vutra." Šatrovački was originally used to discuss illegal activity without being understood. This is the classic example.',
        variants: [
          { hr: 'Voplo', en: '"Lopov" (thief) reversed' },
          { hr: 'Garaci', en: '"Cigara" (cigarette) reversed' },
          { hr: 'Brodo', en: '"Dobro" (good) reversed' },
        ]},
      { hr: 'Žišku', en: 'You get it? (kužiš reversed)', ph: 'ZHISH-koo', level: '🔄',
        note: '"Kužiš" reversed = "žišku." A meta-šatrovački phrase — asking if they understand the slang system in the slang system itself.',
        variants: [
          { hr: 'Zipa', en: '"Pazi" (watch out / careful) reversed' },
          { hr: 'Đido', en: '"Dođi" (come here) reversed' },
          { hr: 'Lahva', en: '"Hvala" (thank you) reversed — say this and watch faces light up' },
        ]},
    ],
  },

  // ─── 8. GEN Z / INTERNET ────────────────────────────────────────────────────
  {
    id: 'genz', icon: '📱', title: 'Gen Z & Internet',
    subtitle: 'How Croatian youth actually talk online and IRL in 2025',
    color: '#db2777', light: '#fdf2f8', border: '#f9a8d4',
    entries: [
      { hr: 'Mid', en: 'Mediocre / Nothing special', ph: 'MID', level: '📱',
        note: 'English Gen Z loanword fully adopted. "To je mid" = That\'s mid / mediocre. The ultimate lukewarm review. "Taj film je mid" = That film was mid. Used constantly by Croatian youth.',
        variants: [
          { hr: 'Bussin', en: 'Excellent / Hits different — "to je bussin"' },
          { hr: 'No cap', en: 'No lie / For real — "no cap, fakat je lud" = no lie, he\'s genuinely crazy' },
          { hr: 'Bet', en: 'Bet / For sure — "bet, ajmo" = bet, let\'s go' },
        ]},
      { hr: 'Rizz', en: 'Game / Charisma / Charm', ph: 'REEZ', level: '📱',
        note: '"Ima rizz" = He has game/charisma. Used exactly as in English Gen Z. "Nema rizz" = He\'s got no game. A fundamental quality assessment word for Croatian Gen Z.',
        variants: [
          { hr: 'Aura', en: '"Ima auru" = He has aura / presence / an energy about him' },
          { hr: 'Drip', en: '"Kakav drip" = What style/drip — referring to fashion/style' },
          { hr: 'Slay', en: '"Slayala si" = You slayed / nailed it' },
        ]},
      { hr: 'Delulu', en: 'Delusional', ph: 'deh-LOO-loo', level: '📱',
        note: '"Ona je totalno delulu" = She\'s completely delusional. Croatian Gen Z adopted this exactly from English TikTok. Shortened from "delusional" — describes someone completely disconnected from reality.',
        variants: [
          { hr: 'Cringe', en: '"To je cringe" = That\'s cringe — used directly' },
          { hr: 'Sus', en: '"Malo je sus" = A bit suspicious (Among Us origin)' },
          { hr: 'Red flag', en: '"Totalni red flag" = Total red flag' },
        ]},
      { hr: 'Ghostati', en: 'To ghost someone', ph: 'GHOST-ah-tee', level: '📱',
        note: '"Ghostao me" = He ghosted me. Croatian Gen Z adapted English "ghost" with Croatian verb endings. "Ghostanje" = ghosting as a noun. A fundamental part of modern Croatian dating vocabulary.',
        variants: [
          { hr: 'Hypeati', en: 'To hype up — "nemoj me hypeati" = don\'t get me hyped up' },
          { hr: 'Cancelati', en: 'To cancel someone — "cancelali su ga" = they cancelled him' },
          { hr: 'Shipati', en: 'To ship (as a couple) — "shipam ih" = I ship them' },
        ]},
      { hr: 'Hejtat', en: 'To hate on / low-key hate', ph: 'HEY-taht', level: '📱',
        note: 'From English "hate." "Što hejtaš?" = Why are you hating? "Hejteri će hejtat" = Haters gonna hate. Complete Croatian conjugation fully established.',
        variants: [
          { hr: 'Fomo', en: 'Fear of missing out — used directly: "imam fomo"' },
          { hr: 'Simp', en: '"Ne budi simp" = Don\'t be a simp' },
          { hr: 'Bestie', en: '"Ti si moj bestie" = You\'re my bestie' },
        ]},
      { hr: 'Vibes', en: 'Vibes / The feel / Energy', ph: 'VYBS', level: '📱',
        note: '"Kakvi vibes" = What vibes. "Ne štima mi vibe" = The vibe doesn\'t feel right. Used directly from English but with Croatian sentence structure around it.',
        variants: [
          { hr: 'Lit', en: '"Večeras je bilo lit" = Tonight was lit' },
          { hr: 'GOAT', en: '"On je goat" = He\'s the greatest of all time' },
          { hr: 'Skibidi', en: 'Nonsense / chaotic — the Skibidi meme penetrated Croatian youth speech deeply' },
        ]},
    ],
  },

  // ─── 9. DRUNK & HUNGOVER ────────────────────────────────────────────────────
  {
    id: 'pijani', icon: '🍺', title: 'Pijani & Mamurani',
    subtitle: 'Drunk, hungover, broke — the essential survival vocabulary',
    color: '#b45309', light: '#fffbeb', border: '#fcd34d',
    entries: [
      { hr: 'Nakresan / Srušen', en: 'Drunk / Wrecked', ph: 'nah-KREH-sahn / SROO-shen', level: '🍺',
        note: '"Nakresan" = drunk (like tiles knocked crooked). "Srušen" = demolished/wrecked — very drunk. The Croatian drunk scale: "u zuju" (tipsy) → "nakresan" → "nacugan" → "srušen."',
        variants: [
          { hr: 'U zuju', en: 'Tipsy — the pleasant early stage; "već sam u zuju"' },
          { hr: 'Nacugan', en: 'Wasted — past participle of "nacugati se"' },
          { hr: 'Naroljan', en: 'Completely wasted — past participle of "naroljati se"' },
        ]},
      { hr: 'Pijan ko smuk', en: 'Drunk as a snake', ph: 'PEE-yahn koh SMOOK', level: '🍺',
        note: 'Classic Croatian drunk simile. "Smuk" = a type of snake. Also "pijan ko majka" (drunk as a mother — a confusing but beloved comparison) and "pijan ko pička" (the explicit version).',
        variants: [
          { hr: 'Pijan ko majka', en: 'Drunk as a mother — colorful hyperbole' },
          { hr: 'Pijan ko pička', en: 'Completely hammered — explicit intensifier' },
          { hr: 'Idemo se nacugati', en: 'Let\'s go get wasted — the invitation' },
        ]},
      { hr: 'Mamuran', en: 'Hungover', ph: 'mah-MOO-rahn', level: '🍺',
        note: 'The inevitable morning after. "Totalno sam mamuran" = I\'m totally hungover. "Mamurluk" = the hangover as a noun. "Krepao od mamurluka" = dying from the hangover.',
        variants: [
          { hr: 'Mamurluk', en: 'A hangover (noun) — "imam grozan mamurluk"' },
          { hr: 'Krepavam od mamurluka', en: 'I\'m dying of a hangover — for dramatic effect' },
          { hr: 'Mrtav od mamurluka', en: 'Dead from a hangover — the nuclear version' },
        ]},
      { hr: 'Švorc', en: 'Broke / No money', ph: 'SHVORTS', level: '💸',
        note: 'The standard "I\'m broke." "Totalno sam švorc" = I\'m completely broke. "Na nuli" (at zero) and "bez love/kinte" are alternatives by intensity.',
        variants: [
          { hr: 'Na nuli', en: 'At zero / flat broke' },
          { hr: 'Nema kinte', en: 'No money — "kinta" from Zagreb slang' },
          { hr: 'Lova / Pare / Šoldi', en: 'Money — Zagreb: lova/kinta; Dalmatia: šoldi; standard: pare' },
        ]},
      { hr: 'Čaga / Žurka', en: 'Dance party / Party', ph: 'CHAH-gah / ZHOOR-kah', level: '🎉',
        note: '"Žurka" = party (pan-Croatian). "Čaga" = more specifically a dance party. "Festin" = feast/party (Dalmatian, from Italian "festino"). "Idemo na čagu" = Let\'s go dance.',
        variants: [
          { hr: 'Festin', en: 'Feast / Party (Dalmatian) — from Italian; grand celebration' },
          { hr: 'Noćni izlazak', en: 'Night out — "idemo na noćni"' },
          { hr: 'Đuskati / Čagati', en: 'To dance — "idemo đuskati" = let\'s dance' },
        ]},
    ],
  },

  // ─── 10. FOOTBALL ───────────────────────────────────────────────────────────
  {
    id: 'football', icon: '⚽', title: 'Nogomet',
    subtitle: 'Football culture — where half the country\'s passion lives',
    color: '#dc2626', light: '#fff1f2', border: '#fecaca',
    entries: [
      { hr: 'Vatreni', en: 'The Fiery Ones — Croatia national team', ph: 'vah-TREH-nee', level: '⚽',
        note: 'The nickname for the Croatian national football team. "Idemo Vatreni!" = Let\'s go Fiery Ones! In 2018 they reached the World Cup final. "Idemo Hrvatska!" is the standard chant.',
        variants: [
          { hr: 'Idemo Hrvatska!', en: 'Let\'s go Croatia! — the national chant' },
          { hr: 'Šahovnica', en: 'Checkerboard — the Croatian coat of arms; synonym for national identity in football' },
          { hr: 'Lijepa naša', en: 'Our beautiful (one) — Croatian anthem, chanted at matches' },
        ]},
      { hr: 'Vječni derbi', en: 'The Eternal Derby', ph: 'VYE-chnee DEHR-bee', level: '⚽',
        note: 'Dinamo Zagreb vs Hajduk Split — the most intense domestic rivalry in Croatian football. "Vječni" = eternal. This match has occasionally stopped the country. Do not casually ask a Croatian which side they support — it is not a casual question.',
        variants: [
          { hr: 'Hajduk do neba!', en: 'Hajduk to the heavens! — the essential Hajduk battle cry; said with full lung capacity' },
          { hr: 'Bili smo, jesmo i bit ćemo!', en: 'We were, we are, and we will be! — Hajduk\'s identity chant; a declaration of existence beyond sport' },
          { hr: 'Plavi', en: 'The Blues — Dinamo Zagreb nickname' },
          { hr: 'Bijeli', en: 'The Whites — Hajduk Split nickname; wearing white to a derby is a statement' },
        ]},
      { hr: 'Torcida', en: 'Hajduk Split\'s ultras — Europe\'s oldest', ph: 'tor-TSEE-dah', level: '⚽',
        note: 'Founded 28 October 1950 in Split — the oldest organized supporter group in Europe, predating every Italian, English, and German ultra group. Named after the Brazilian "torcida" (supporters) spotted at the 1950 World Cup. For Hajduk families, Torcida is not a club — it is identity, bloodline, and Dalmatian pride passed from grandparents to grandchildren.',
        variants: [
          { hr: 'Torcido, volim te!', en: 'Torcida, I love you! — chanted from the Poljud stands; purely emotional, not rational' },
          { hr: 'Hajduk je naš!', en: 'Hajduk is ours! — collective ownership; Hajduk is genuinely fan-owned through HNK Hajduk foundation' },
          { hr: 'Ubij Dinamovca!', en: 'Kill the Dynamo fan! — terrace hyperbole; said with passion, not literal intent' },
          { hr: 'Dinamo je sranje', en: 'Dinamo is sh** — the minimum acceptable position for any Hajduk supporter' },
          { hr: 'Cigani', en: 'Gypsies — Torcida\'s insult for BBB / Dinamo fans; highly offensive outside the derby context' },
          { hr: 'Tovari', en: 'Donkeys — BBB\'s insult for Torcida; the donkey is Torcida\'s ironic adopted symbol' },
        ]},
      { hr: 'Poljud', en: 'Hajduk\'s cathedral', ph: 'POH-lyood', level: '⚽',
        note: 'Stadion Poljud in Split — opened 1979 for the Mediterranean Games. To Hajduk fans it is not a stadium, it is sacred ground. "Na Poljudu" = at Poljud. When Hajduk scores at Poljud the whole of Split shakes. The Torcida north stand is one of the loudest in European football.',
        variants: [
          { hr: 'Na Poljudu', en: 'At Poljud — "idemo na Poljud" = we\'re going to the match; for Hajduk fans this needs no further explanation' },
          { hr: 'Sjever', en: 'The North Stand — where Torcida stands; the engine room of Split football passion' },
          { hr: 'Ajmo Bili!', en: 'Come on Whites! — the chant from the stands; "Bili" = the Whites, Hajduk\'s people\'s nickname' },
          { hr: 'Kad mi idemo na derbi, cijeli Split zna', en: 'When we go to the derby, all of Split knows — the pre-match atmosphere is a city-wide event' },
        ]},
      { hr: 'Ajmo! / Idemo! / Naprijed!', en: 'Come on! / Let\'s go! / Forward!', ph: 'AY-mo / EE-demo / NAH-pryehd', level: '⚽',
        note: 'The three essential football encouragement chants. "Ajmo!" when they need to try harder. "Idemo!" when they\'re on the attack. "Naprijed!" when they\'re defending a lead.',
        variants: [
          { hr: 'Gol!', en: 'Goal! — said with as much lung capacity as possible' },
          { hr: 'Pobjeda!', en: 'Victory! — chanted after winning' },
          { hr: 'Tekma', en: 'Match / Game — "gledamo tekmu" = we\'re watching the match' },
        ]},
    ],
  },

  // ─── 11. REGIONAL COMPARISON ────────────────────────────────────────────────
  {
    id: 'regional', icon: '🗺️', title: 'Zagreb vs Split',
    subtitle: 'The same thing — completely different word. A field guide.',
    color: '#065f46', light: '#ecfdf5', border: '#6ee7b7',
    entries: [
      { hr: 'Kaj / Ča / Što', en: '"What" — three dialects, one Croatia', ph: 'KAI / CHAH / SHTOH', level: '🗺️',
        note: 'Croatia has three dialects: Kajkavian (Zagreb/north) uses "kaj," Čakavian (coast/islands) uses "ča," Štokavian (standard/east) uses "što/šta." Meeting someone new? Their "what" tells you where they\'re from.',
        variants: [
          { hr: 'Kaj ima? (Zagreb)', en: 'What\'s up? — Zagreb' },
          { hr: 'Ča ima? (Dalmatia)', en: 'What\'s up? — coastal/island' },
          { hr: 'Šta ima? (standard)', en: 'What\'s up? — everywhere else' },
        ]},
      { hr: 'Lova vs Šoldi', en: 'Money — Zagreb vs Dalmatia', ph: 'LOH-vah vs SHOL-dee', level: '🗺️',
        note: '"Lova" or "kinta" in Zagreb. "Šoldi" (from Italian "soldi") in Dalmatia. Same word, different cultural DNA — Zagreb\'s German/Slavic heritage vs Dalmatia\'s Italian/Mediterranean heritage.',
        variants: [
          { hr: 'Kola (Zagreb) vs Makina (Split)', en: 'Car — German vs Italian loanword' },
          { hr: 'Birc (Zagreb) vs Konoba (Dalmatia)', en: 'Bar — "birc" from German; "konoba" = traditional tavern' },
          { hr: 'Baka (Zagreb) vs Nona (Dalmatia)', en: 'Grandma — the most emotional regional difference' },
        ]},
      { hr: 'Baka / Dida vs Nona / Nono', en: 'Grandparents — Zagreb vs Coast', ph: 'BAH-kah / DEE-dah vs NOH-nah / NOH-noh', level: '🗺️',
        note: 'Possibly the single most emotionally charged regional difference. Zagreb grandchildren say "baka" and "dida/djed." Coastal grandchildren say "nona" and "nono/nonić." Both from Italian "nonna/nonno" for coast, Slavic for Zagreb.',
        variants: [
          { hr: 'Nona / Nonić', en: 'Grandma / Grandpa — coastal/Dalmatian' },
          { hr: 'Baka / Dida', en: 'Grandma / Grandpa — Zagreb and inland' },
          { hr: 'Naša kuhinja vs naša kužina', en: 'Our kitchen — Zagreb standard vs Dalmatian Italian loanword' },
        ]},
      { hr: 'Generacijski jaz', en: 'The generation gap in words', ph: '—', level: '📚',
        note: 'Grandparents use German/Italian/Austro-Hungarian loanwords from their era: "frajla," "šuster" (cobbler), "cajger" (clock hand). Grandkids use English/Internet loanwords: "ghostati," "mid," "rizz." Same family, completely different linguistic universes.',
        variants: [
          { hr: 'Šuster (grandpa)', en: 'Cobbler / Shoemaker — from German "Schuster"; grandkids wouldn\'t know this' },
          { hr: 'Ghostati (grandkid)', en: 'To ghost — grandparents have no word for this concept' },
          { hr: 'Frajla (grandpa) vs Snack (grandkid)', en: 'How each generation describes an attractive woman' },
        ]},
    ],
  },

  // ─── 12. THE ART OF THE CURSE ───────────────────────────────────────────────
  {
    id: 'art', icon: '🎨', title: 'Psovanje kao Umjetnost',
    subtitle: 'The grammar, culture, and mastery of Croatian swearing',
    color: '#1a1a2e', light: '#f1f5f9', border: '#94a3b8',
    entries: [
      { hr: 'The Jeb- Construction', en: 'How Croatian builds infinite curses from one root', ph: '—', level: '📚',
        note: 'The root "jeb-" (from "jebati") is uniquely productive. Unlike English "f***" which is roughly fixed, Croatian adds prefixes, suffixes, and abstract subjects creating completely distinct meanings. Krankšvester and Kuku$ have explored virtually every grammatical position this word can occupy.',
        variants: [
          { hr: 'Zajebao si', en: 'You screwed up / You messed that up (za- = imperfective)' },
          { hr: 'Pojebali su ga', en: 'They completely did him over (po- = completed action)' },
          { hr: 'Nadjebao sam ga', en: 'I dominated/outdid him (nad- = over/above)' },
          { hr: 'Ujebali su me', en: 'They conned/tricked me (u- = into)' },
          { hr: 'Jebu me živci', en: 'Abstract noun as agent — "my nerves are screwing me"; any abstract plural noun can drive this construction' },
          { hr: 'Jebeno', en: 'F***ing (adverb) — "jebeno dobro" = f***ing good; the -no suffix turns the verb into an adverbial intensifier, fully productive mid-sentence' },
          { hr: 'Jebačina', en: '-čina augmentative suffix — elevates jebanje to an epic, absurd scale; "polarna jebačina" (Krankšvester) = the Arctic f***-fest' },
        ]},
      { hr: 'The Mater Elaboration Scale', en: 'From mild to nuclear — know your level', ph: '—', level: '📚',
        note: 'Croatian mater curses have levels. Each addition escalates intensity. Basic: "majku mu." Medium: "jebem ti mater." Elaborated: "+po rebru" or "+pa back." Creative: "+mlade rode/juhu od Isusovih kostiju." Nuclear: full family list. Never deploy nuclear in unfamiliar company.',
        variants: [
          { hr: 'Između prijatelja', en: 'Among close friends — almost everything is acceptable, tone = love' },
          { hr: 'S neznancima', en: 'With strangers — maximum "jebote" or "jebi ga"; nothing mater-related' },
          { hr: 'Na poslu', en: 'At work — "sranje" and "govno" only; anything else = HR incident' },
        ]},
      { hr: 'Affectionate Swearing', en: 'When curses mean the exact opposite', ph: '—', level: '📚',
        note: 'The most important concept: Croatian swearing is deeply social and tone-dependent. "Jebem ti mater" said with a smile while hugging someone = "you absolute legend." "Picka mu materina, uspio si" = "holy sh** you actually did it" (pure pride). Same words — completely opposite meanings. This is the artform.',
        variants: [
          { hr: 'Jebote, faca si!', en: 'Holy sh**, you\'re a legend! — said with genuine admiration' },
          { hr: 'Picka mu materina, uspio si!', en: 'Holy sh**, he/you did it! — overwhelming pride' },
          { hr: 'Jebo te, pa to je nevjerojatno', en: 'F*** you (= you amazing person), that\'s incredible' },
        ]},
      { hr: 'The I Don\'t Care Ladder', en: 'Five levels of not caring — exactly calibrated', ph: '—', level: '📚',
        note: 'Croatian has a beautifully precise indifference vocabulary. Use the wrong level and you\'ll either understate or shock. Learn all five rungs of the ladder.',
        variants: [
          { hr: 'Nije me briga', en: '1. Polite — I don\'t care (neutral, professional context fine)' },
          { hr: 'Baš me briga', en: '2. Mild — I really don\'t care (casual, slight edge)' },
          { hr: 'Boli me briga', en: '3. Medium — I genuinely couldn\'t care less (mild expletive)' },
          { hr: 'Boli me kurac', en: '4. Strong — I absolutely do not give a damn (explicit)' },
          { hr: 'Pun mi je kurac svega', en: '5. Nuclear — I\'m completely fed up with everything (explicit + exhausted)' },
        ]},
    ],
  },

];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SlangScreen({ goBack, award }) {
  const [gated, setGated]   = useState(() => localStorage.getItem('slangAgeConfirmed') !== 'true');
  const [activeSection, setActiveSection] = useState(() => {
    const init = localStorage.getItem('slangInitSection');
    if (init) { localStorage.removeItem('slangInitSection'); return init; }
    return 'classics';
  });
  const [expanded, setExpanded] = useState(null);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);

  // ── Section XP tracking ────────────────────────────────────────────────────
  const [visitedSections, setVisitedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('slangVisited') || '[]'); } catch { return []; }
  });

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizXpGiven, setQuizXpGiven] = useState(false);

  function handleUnlock() {
    localStorage.setItem('slangAgeConfirmed', 'true');
    setGated(false);
    if (award && !xpAwarded) { award(15); setXpAwarded(true); }
  }

  function switchSection(id) {
    setActiveSection(id);
    setExpanded(null);
    setQuizMode(false);
    if (!visitedSections.includes(id)) {
      const next = [...visitedSections, id];
      setVisitedSections(next);
      localStorage.setItem('slangVisited', JSON.stringify(next));
      if (award) award(5);
    }
  }

  function startQuiz(sec) {
    const allEntries = SECTIONS.flatMap(s => s.entries);
    const pool = sh(sec.entries
      .filter(e => e.en && e.en.length < 60 && e.ph !== '—'))
      .slice(0, Math.min(6, sec.entries.length));
    if (pool.length < 2) return;
    const qs = pool.map(entry => {
      const wrong = sh(allEntries
        .filter(e => e !== entry && e.en && e.en.length < 60))
        .slice(0, 3);
      const opts = sh([...wrong.map(e => e.en), entry.en]);
      return { hr: entry.hr, correct: entry.en, opts };
    });
    setQuizQuestions(qs);
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizScore(0);
    setQuizDone(false);
    setQuizXpGiven(false);
    setQuizMode(true);
  }

  function handleQuizAnswer(opt) {
    if (quizSelected !== null) return;
    setQuizSelected(opt);
    const correct = opt === quizQuestions[quizIdx].correct;
    if (correct) setQuizScore(s => s + 1);
    setTimeout(() => {
      if (quizIdx + 1 >= quizQuestions.length) {
        setQuizDone(true);
      } else {
        setQuizIdx(i => i + 1);
        setQuizSelected(null);
      }
    }, 1100);
  }

  function finishQuiz() {
    const xp = quizScore * 3;
    if (award && !quizXpGiven && xp > 0) { award(xp); setQuizXpGiven(true); }
  }

  // ── Age Gate ──────────────────────────────────────────────────────────────
  if (gated) {
    return (
      <div className="scr-wrap" style={{ paddingBottom: 100 }}>
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
          borderRadius: 24, color: '#fff', marginBottom: 20,
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔞</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, marginBottom: 12, color: '#fff' }}>
            Age Confirmation Required
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, opacity: .9, marginBottom: 24 }}>
            This section contains adult language.<br />
            <strong>Are you 18 or older?</strong>
          </p>
          <div style={{
            background: 'rgba(255,255,255,.08)', borderRadius: 14,
            padding: '16px 20px', marginBottom: 28, fontSize: 13,
            lineHeight: 1.7, textAlign: 'left',
          }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>📚 12 sections — 150+ entries:</div>
            <div>🔥 The Classics — jeb- construction mastery</div>
            <div>😤 Everyday Exclamations</div>
            <div>😎 Street Slang — sound like a local</div>
            <div>👥 People & Addresses</div>
            <div>☀️ Dalmatian / Split dialect</div>
            <div>🏙️ Zagreb / Kajkavian slang</div>
            <div>🔄 Šatrovački — Croatian secret syllable code</div>
            <div>📱 Gen Z & Internet language 2025</div>
            <div>🍺 Drunk, Hungover & Broke vocabulary</div>
            <div>⚽ Football culture language</div>
            <div>🗺️ Zagreb vs Split — regional comparison</div>
            <div>🎨 The Art of the Curse — grammar masterclass</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleUnlock} style={{
              padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color: '#fff', fontSize: 15, fontWeight: 900,
              fontFamily: "'Outfit',sans-serif",
              boxShadow: '0 8px 32px rgba(220,38,38,.4)',
            }}>
              Yes, continue
            </button>
            <button onClick={goBack} style={{
              padding: '14px 32px', borderRadius: 14, cursor: 'pointer',
              background: 'rgba(255,255,255,.12)',
              border: '1.5px solid rgba(255,255,255,.25)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: "'Outfit',sans-serif",
            }}>
              No, go back
            </button>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, opacity: .5 }}>+15 XP for unlocking this module</div>
        </div>
      </div>
    );
  }

  // ── Search mode ───────────────────────────────────────────────────────────
  const q = searchQ.toLowerCase().trim();
  const searchResults = q.length >= 2 ? SECTIONS.flatMap(s =>
    s.entries
      .filter(e =>
        e.hr.toLowerCase().includes(q) ||
        e.en.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        e.variants.some(v => v.hr.toLowerCase().includes(q) || v.en.toLowerCase().includes(q))
      )
      .map(e => ({ ...e, sectionColor: s.color, sectionLight: s.light, sectionBorder: s.border, sectionIcon: s.icon, sectionTitle: s.title }))
  ) : [];

  const section = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  function EntryCard({ entry, color, light, border, keyId }) {
    const isOpen = expanded === keyId;
    return (
      <div style={{
        background: 'var(--card)',
        border: `1.5px solid ${isOpen ? color : 'var(--card-b)'}`,
        borderRadius: 16, marginBottom: 10, overflow: 'hidden',
        boxShadow: isOpen ? `0 4px 20px ${color}22` : '0 1px 4px rgba(0,0,0,.06)',
        transition: 'border-color .2s',
      }}>
        <button
          onClick={() => setExpanded(isOpen ? null : keyId)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
          }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", lineHeight: 1.2 }}>
              {entry.hr}
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 2, fontWeight: 600 }}>
              {entry.en}
            </div>
          </div>
          {entry.ph !== '—' && (
            <button
              onClick={e => { e.stopPropagation(); speak(entry.hr); }}
              aria-label={`Hear ${entry.hr}`}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: `linear-gradient(135deg,${color},${color}cc)`,
                color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🔊</button>
          )}
          <div style={{ fontSize: 14, color: 'var(--subtext)', opacity: .4, flexShrink: 0 }}>
            {isOpen ? '▲' : '▼'}
          </div>
        </button>

        {isOpen && (
          <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${border}` }}>
            {entry.ph !== '—' && (
              <div style={{
                background: light, borderRadius: 10, padding: '8px 12px',
                marginTop: 12, marginBottom: 12,
                fontSize: 13, color: color, fontWeight: 700, fontFamily: 'monospace',
              }}>
                🗣 /{entry.ph}/
              </div>
            )}
            <div style={{
              fontSize: 13, color: 'var(--rt-c)', lineHeight: 1.7,
              background: 'var(--bar-bg)', borderRadius: 10, padding: '12px 14px',
              marginBottom: entry.variants.length ? 12 : 0,
            }}>
              {entry.note}
            </div>
            {entry.variants.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                  Variations & Examples
                </div>
                {entry.variants.map((v, vi) => (
                  <div key={vi} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    background: light, border: `1px solid ${border}`,
                    marginBottom: vi < entry.variants.length - 1 ? 6 : 0,
                  }}>
                    <button
                      onClick={() => speak(v.hr)}
                      aria-label={`Hear ${v.hr}`}
                      style={{
                        width: 28, height: 28, borderRadius: 8, border: 'none',
                        background: color, color: '#fff', fontSize: 12,
                        cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>🔊</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: color, fontFamily: "'Playfair Display',serif" }}>{v.hr}</div>
                      <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2, fontWeight: 500 }}>{v.en}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="scr-wrap" style={{ paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
        borderRadius: 20, padding: '18px 20px', marginBottom: 14,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 36 }}>🤬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Playfair Display',serif" }}>Slang & Psovanje</div>
            <div style={{ fontSize: 11, opacity: .65, marginTop: 2 }}>12 sections · 150+ expressions · all with pronunciation</div>
          </div>
        </div>
        {/* Search */}
        <div style={{ marginTop: 14, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: .5, fontSize: 14 }}>🔍</span>
          <input
            type="search"
            placeholder="Search any word or phrase…"
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setSearching(e.target.value.length >= 2); }}
            onFocus={() => setSearching(searchQ.length >= 2)}
            onBlur={() => setTimeout(() => setSearching(false), 200)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,.2)',
              background: 'rgba(255,255,255,.1)', color: '#fff',
              fontSize: 13, fontFamily: "'Outfit',sans-serif",
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Search results */}
      {searching && searchQ.length >= 2 && (
        <div style={{ marginBottom: 14 }}>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--subtext)', fontSize: 13 }}>
              No matches for "{searchQ}"
            </div>
          ) : (
            searchResults.map((e, i) => (
              <EntryCard key={i} entry={e} color={e.sectionColor} light={e.sectionLight} border={e.sectionBorder} keyId={`s${i}`} />
            ))
          )}
        </div>
      )}

      {/* Section tabs */}
      {!searching && (
        <>
          <div style={{ display: 'flex', gap: 7, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => switchSection(s.id)}
                style={{
                  flexShrink: 0, padding: '7px 12px', borderRadius: 20,
                  border: `1.5px solid ${activeSection === s.id ? s.color : 'var(--card-b)'}`,
                  background: activeSection === s.id ? s.light : 'var(--card)',
                  color: activeSection === s.id ? s.color : 'var(--subtext)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
                  position: 'relative',
                }}>
                {s.icon} {s.title}
                {visitedSections.includes(s.id) && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#16a34a', border: '1.5px solid var(--card)' }} />}
              </button>
            ))}
          </div>

          {/* Section header with subtitle + Quick Quiz button */}
          <div style={{
            background: section.light, border: `1.5px solid ${section.border}`,
            borderRadius: 12, padding: '9px 14px', marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <div style={{ fontSize: 12, color: section.color, fontWeight: 700, flex: 1 }}>
              {section.subtitle}
            </div>
            {!quizMode && (
              <button
                onClick={() => startQuiz(section)}
                style={{
                  padding: '5px 11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: section.color, color: '#fff',
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                  fontFamily: "'Outfit',sans-serif",
                }}>
                🎯 Quiz
              </button>
            )}
            {quizMode && (
              <button
                onClick={() => setQuizMode(false)}
                style={{
                  padding: '5px 11px', borderRadius: 10, border: `1px solid ${section.border}`,
                  cursor: 'pointer', background: 'var(--card)', color: section.color,
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                  fontFamily: "'Outfit',sans-serif",
                }}>
                ✕ Exit Quiz
              </button>
            )}
          </div>

          {/* ── QUIZ MODE ─────────────────────────────────────────────────── */}
          {quizMode && !quizDone && quizQuestions.length > 0 && (
            <div style={{
              background: 'var(--card)', border: `2px solid ${section.color}`,
              borderRadius: 20, padding: '20px', marginBottom: 14,
              boxShadow: `0 4px 24px ${section.color}22`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Question {quizIdx + 1} of {quizQuestions.length}
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: section.color }}>
                  {quizScore} / {quizIdx} ✓
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: 'var(--bar-bg)', borderRadius: 4, marginBottom: 20 }}>
                <div style={{ height: '100%', width: `${((quizIdx) / quizQuestions.length) * 100}%`, background: section.color, borderRadius: 4, transition: 'width .3s' }} />
              </div>
              {/* Question */}
              <div style={{
                textAlign: 'center', padding: '20px 16px',
                background: `linear-gradient(135deg,${section.light},var(--card))`,
                borderRadius: 14, marginBottom: 16, border: `1px solid ${section.border}`,
              }}>
                <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  What does this mean?
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: section.color, fontFamily: "'Playfair Display',serif", lineHeight: 1.3 }}>
                  {quizQuestions[quizIdx].hr}
                </div>
                <button onClick={() => speak(quizQuestions[quizIdx].hr)} style={{ marginTop: 10, padding: '4px 12px', borderRadius: 8, border: 'none', background: section.color, color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  🔊 Hear it
                </button>
              </div>
              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quizQuestions[quizIdx].opts.map((opt, oi) => {
                  const isCorrect = opt === quizQuestions[quizIdx].correct;
                  const isSelected = quizSelected === opt;
                  let bg = 'var(--card)'; let borderC = 'var(--card-b)'; let txtC = 'var(--rt-c)';
                  if (quizSelected !== null) {
                    if (isCorrect) { bg = '#dcfce7'; borderC = '#16a34a'; txtC = '#15803d'; }
                    else if (isSelected) { bg = '#fee2e2'; borderC = '#dc2626'; txtC = '#dc2626'; }
                  }
                  return (
                    <button key={oi} onClick={() => handleQuizAnswer(opt)} disabled={quizSelected !== null} style={{
                      width: '100%', padding: '12px 14px', borderRadius: 12,
                      border: `1.5px solid ${borderC}`, background: bg, color: txtC,
                      fontSize: 13, fontWeight: 700, cursor: quizSelected ? 'default' : 'pointer',
                      fontFamily: "'Outfit',sans-serif", textAlign: 'left', transition: 'all .2s',
                    }}>
                      {quizSelected !== null && isCorrect ? '✓ ' : quizSelected !== null && isSelected ? '✗ ' : ''}{opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── QUIZ DONE ─────────────────────────────────────────────────── */}
          {quizMode && quizDone && (
            <div style={{
              background: 'var(--card)', border: `2px solid ${section.color}`,
              borderRadius: 20, padding: '28px 20px', marginBottom: 14, textAlign: 'center',
              boxShadow: `0 4px 24px ${section.color}22`,
            }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>
                {quizScore >= quizQuestions.length * 0.8 ? '🏆' : quizScore >= quizQuestions.length * 0.5 ? '💪' : '📚'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: section.color, fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>
                {quizScore} / {quizQuestions.length} correct
              </div>
              <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
                {quizScore >= quizQuestions.length * 0.8 ? 'Odlično! You\'re a natural!' : quizScore >= quizQuestions.length * 0.5 ? 'Dobro! Keep practicing.' : 'Keep studying — you\'ll get there!'}
              </div>
              <div style={{
                background: section.light, border: `1px solid ${section.border}`,
                borderRadius: 12, padding: '10px 16px', marginBottom: 20,
                fontSize: 13, fontWeight: 800, color: section.color,
              }}>
                +{quizScore * 3} XP earned
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { finishQuiz(); startQuiz(section); }} style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: section.color, color: '#fff', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                }}>Try Again</button>
                <button onClick={() => { finishQuiz(); setQuizMode(false); }} style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: `1.5px solid ${section.border}`, background: 'var(--card)',
                  color: section.color, fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                }}>Done</button>
              </div>
            </div>
          )}

          {/* ── ENTRIES (hidden during quiz) ─────────────────────────────── */}
          {!quizMode && section.entries.map((entry, i) => (
            <EntryCard key={i} entry={entry} color={section.color} light={section.light} border={section.border} keyId={i} />
          ))}
        </>
      )}

      {/* Progress + Footer note */}
      {!searching && (
        <>
          <div style={{
            background: 'var(--card)', border: '1.5px solid var(--card-b)',
            borderRadius: 16, padding: '14px 16px', marginTop: 8, marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--heading)' }}>📊 Your Progress</div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
                {visitedSections.length} of {SECTIONS.length} sections explored · +5 XP each
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{visitedSections.length}/{SECTIONS.length}</div>
              <div style={{ height: 4, width: 72, background: 'var(--bar-bg)', borderRadius: 4, marginTop: 4 }}>
                <div style={{ height: '100%', width: `${(visitedSections.length / SECTIONS.length) * 100}%`, background: '#16a34a', borderRadius: 4, transition: 'width .5s' }} />
              </div>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 16,
            color: '#fff', fontSize: 12, lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 6 }}>🇭🇷 Cultural Note</div>
            Croatian swearing is deeply social and tone-dependent. The same phrase can be a declaration of love between friends or a serious insult between strangers. Tone, relationship, and setting determine meaning entirely. When in doubt, listen first.
          </div>
        </>
      )}

      <button onClick={goBack} style={{
        width: '100%', padding: 14, background: 'none',
        border: '1.5px solid var(--card-b)', borderRadius: 14,
        color: 'var(--subtext)', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
      }}>← Back to Practice</button>
    </div>
  );
}
