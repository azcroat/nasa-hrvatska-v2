/**
 * SlangScreen — Croatian Slang & Expressions
 *
 * An honest, educational guide to informal Croatian including
 * colloquial slang, exclamations, and the culturally significant
 * art of Croatian swearing. Gated behind an adult content acknowledgement.
 */
import React, { useState } from 'react';
import { speak } from '../../data.jsx';

// ── Content ──────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'classics',
    icon: '🔥',
    title: 'The Classics',
    subtitle: 'The essential Croatian expletives — artfully constructed',
    color: '#dc2626', light: '#fff1f2', border: '#fca5a5',
    entries: [
      {
        hr: 'Jebem ti mater',
        en: 'I f*** your mother',
        ph: 'YEH-bem tee MAH-tehr',
        level: '🌶🌶🌶',
        note: 'The foundational Croatian curse. Everything else builds from this construction. "Jebem" = I f***, "ti" = your, "mater" = mother (archaic accusative of "majka"). Versatile — can express rage, awe, or even affection depending on tone.',
        variants: [
          { hr: 'Jebem ti mater po rebru', en: 'I f*** your mother by the rib — extra elaboration for emphasis' },
          { hr: 'Jebem mu mater', en: 'I f*** his/its mother — third person, used when raging at a situation' },
          { hr: 'Jebo te bog', en: 'May God f*** you — invokes the divine for maximum impact' },
        ],
      },
      {
        hr: 'Jebote',
        en: 'F*** me / Holy sh** / Wow',
        ph: 'YEH-boh-teh',
        level: '🌶🌶',
        note: 'Short for "jebo te" (may [someone] f*** you). Functionally equivalent to "Jesus Christ!" or "Holy sh**!" in English. Used constantly for surprise, frustration, amazement, or disbelief. Frequency of use: very high.',
        variants: [
          { hr: 'Jebote pa to je nevjerojatno', en: 'Holy sh**, that\'s unbelievable' },
          { hr: 'Ma jebote...', en: 'Oh for f***\'s sake...' },
        ],
      },
      {
        hr: 'Jebi ga',
        en: 'F*** it / Forget it / Whatever',
        ph: 'YEH-bee gah',
        level: '🌶🌶',
        note: '"Jeb" = f***, "i" = imperative suffix, "ga" = it/him. Closest English equivalent is "f*** it" but used far more casually. You\'ll hear this constantly — it\'s almost a verbal comma.',
        variants: [
          { hr: 'Jebi ga, bit će bolje', en: 'F*** it, it\'ll get better' },
          { hr: 'A jebi ga', en: 'Ah, forget it / What can you do' },
        ],
      },
      {
        hr: 'Boli me kurac',
        en: 'I couldn\'t give less of a sh**',
        ph: 'BOH-lee meh KOO-rahts',
        level: '🌶🌶🌶',
        note: 'Literally "my d*** hurts" but means "I don\'t care at all." Grammatically: "boli" (hurts) + "me" (me) + "kurac" (d***). A masterpiece of Croatian indifference. Shortened to "bome kurac" in casual speech.',
        variants: [
          { hr: 'Boli me briga', en: 'Polite version: "I couldn\'t care less" (same structure, family-friendly)' },
          { hr: 'Boli ga kurac za nas', en: 'He doesn\'t give a damn about us' },
        ],
      },
      {
        hr: 'Idi u pizdu materinu',
        en: 'Go f*** yourself (literal: go into your mother\'s...)',
        ph: 'EE-dee oo PEEZ-doo mah-TEH-ree-noo',
        level: '🌶🌶🌶',
        note: 'The Croatian nuclear option. A profound dismissal. "Idi" = go, "u" = into, "pizdu" = (vulgar), "materinu" = mother\'s (possessive). Reserve for situations that have gone completely off the rails.',
        variants: [
          { hr: 'Idi u tri pičke materine', en: 'Go into your mother\'s three... — triple emphasis version' },
        ],
      },
      {
        hr: 'Picka mu materina',
        en: 'Son of a b**** / Motherf***er',
        ph: 'PEECH-kah moo mah-TEH-ree-nah',
        level: '🌶🌶🌶',
        note: 'Used exactly like "son of a b****" or "motherf***er" in English — for shock, anger, amazement. Can also be said with admiration: "Picka mu materina, on je dobar" = "Holy sh**, he\'s good."',
        variants: [],
      },
    ],
  },
  {
    id: 'exclamations',
    icon: '😤',
    title: 'Everyday Exclamations',
    subtitle: 'Mild to medium — usable around most adults',
    color: '#d97706', light: '#fffbeb', border: '#fde68a',
    entries: [
      {
        hr: 'Sranje',
        en: 'Sh** / Crap',
        ph: 'SRAH-nyeh',
        level: '🌶',
        note: 'The all-purpose "sh**." Use for minor disasters, frustrations, or surprises. Widely used across all age groups. Plural "sranja" = "a bunch of crap/nonsense."',
        variants: [
          { hr: 'Kakvo sranje', en: 'What a mess / What a load of crap' },
          { hr: 'Ne seri', en: 'Stop talking sh** / Don\'t bullsh** me' },
        ],
      },
      {
        hr: 'Govno',
        en: 'Sh** (literal feces)',
        ph: 'GOV-noh',
        level: '🌶',
        note: 'The literal word for sh**. Used exactly like in English — as a noun ("that\'s sh**") or as an exclamation. "Govnar" = a sh***y person / someone worthless.',
        variants: [
          { hr: 'To je čisto govno', en: 'That\'s pure sh**' },
          { hr: 'Govnar jedan', en: 'You little sh**' },
        ],
      },
      {
        hr: 'Majku mu',
        en: 'Damn it / F*** (mild)',
        ph: 'MY-koo moo',
        level: '🌶',
        note: 'Shortened version of the full mater curse. "Majku mu" = "his mother" (accusative) — implied "f*** his mother." Widely used as a mild expletive, equivalent to "damn it."',
        variants: [
          { hr: 'Majku ti', en: 'Your mother — directed at someone' },
          { hr: 'Majku mu svoju', en: 'Damn it all — reflexive intensified version' },
        ],
      },
      {
        hr: 'Kurčina',
        en: 'Big d*** / Big shot (ironic)',
        ph: 'KOOR-chee-nah',
        level: '🌶🌶',
        note: 'Augmentative of "kurac." Used ironically for someone who acts important. "Ma koji kurčina" = "who does he think he is?" Also used in compound expressions for emphasis.',
        variants: [
          { hr: 'Ma koji kurac', en: 'What the hell / What kind of nonsense' },
          { hr: 'Ni kurac', en: 'Absolutely nothing / Not a damn thing' },
        ],
      },
      {
        hr: 'Crkni',
        en: 'Drop dead',
        ph: 'TSRK-nee',
        level: '🌶🌶',
        note: 'From "crknuti" (to die like an animal). "Crkni" is the imperative — "drop dead / go die." Used between friends can be affectionate teasing. Context is everything.',
        variants: [
          { hr: 'Crkni mi', en: 'Oh, come on / Give me a break (softened)' },
        ],
      },
    ],
  },
  {
    id: 'slang',
    icon: '😎',
    title: 'Street Slang',
    subtitle: 'Everyday informal expressions — sound like a local',
    color: '#7c3aed', light: '#faf5ff', border: '#ddd6fe',
    entries: [
      {
        hr: 'Kužiš?',
        en: 'You get it? / You know what I mean?',
        ph: 'KOO-zhish',
        level: '✅',
        note: 'From "kužiti" (to understand/sniff out). Used constantly at the end of sentences like "you know?" Equivalent to Italian "capisce?" Mandatory in any authentic Croatian conversation.',
        variants: [
          { hr: 'Skontaj', en: 'Figure it out / Get it through your head' },
          { hr: 'Skužio sam', en: 'I figured it out / I got it' },
        ],
      },
      {
        hr: 'Fora',
        en: 'Joke / Cool thing / The point',
        ph: 'FOH-rah',
        level: '✅',
        note: 'Borrowed from Italian "fuori" (outside). Means joke, a cool trick, or "the point of something." "Koja fora" = "what a cool/funny thing." "To je fora" = "that\'s the joke" or "that\'s the cool thing."',
        variants: [
          { hr: 'Koja fora!', en: 'That\'s hilarious! / What a trick!' },
          { hr: 'Nema fore', en: 'No joke / Seriously / That\'s not cool' },
        ],
      },
      {
        hr: 'Baja / Brate',
        en: 'Bro / Dude / Man',
        ph: 'BAH-yah / BRAH-teh',
        level: '✅',
        note: '"Brat" = brother, "brate" is the vocative case (direct address). "Baja" is more slang, regional (Dalmatia especially). Both are used like "bro" — to address friends, to express disbelief, to soften a statement.',
        variants: [
          { hr: 'Jesi li normalan, brate', en: 'Are you normal, bro? (Are you out of your mind?)' },
          { hr: 'Ma baja, ne mogu', en: 'Dude, I can\'t even' },
        ],
      },
      {
        hr: 'Ful / Fuliran',
        en: 'Super / Totally / Really',
        ph: 'FOOL / foo-LEE-rahn',
        level: '✅',
        note: 'From English "full." "Ful" intensifies adjectives. "To je ful dobro" = "that\'s really good." "Fuliran" = fully into something / cool. Common in Zagreb youth speech.',
        variants: [
          { hr: 'Ful dobro', en: 'Really good / Super good' },
          { hr: 'On je ful frajer', en: 'He\'s a total cool guy' },
        ],
      },
      {
        hr: 'Frajer / Frajera',
        en: 'Cool guy / Cool girl',
        ph: 'FRY-er / FRY-eh-rah',
        level: '✅',
        note: 'From German "Freier." Used for a cool, attractive, stylish person. Can be used sarcastically — "koji frajer" (what a "cool" guy) = what a jerk.',
        variants: [
          { hr: 'Prava frajera', en: 'A real cool girl' },
          { hr: 'Koji frajer misli da je', en: 'Who does he think he is (ironic)' },
        ],
      },
      {
        hr: 'Bezveze',
        en: 'Pointless / For nothing / Lame',
        ph: 'bez-VEH-zeh',
        level: '✅',
        note: '"Bez" = without, "veze" = connection/reason. Used for anything pointless, lame, or for no reason. "Radim bezveze" = I\'m doing nothing useful. One of the most used words in Croatian casual speech.',
        variants: [
          { hr: 'To je bezveze', en: 'That\'s pointless / That\'s lame' },
          { hr: 'Bezveznjak', en: 'A lame person / a loser' },
        ],
      },
      {
        hr: 'Ma daj!',
        en: 'Come on! / No way! / Are you serious?',
        ph: 'mah DIE',
        level: '✅',
        note: '"Ma" = well/but (filler) + "daj" = give/come on. Used to express disbelief, mild frustration, or encouragement. Tone determines meaning entirely. One of the most useful phrases in Croatian.',
        variants: [
          { hr: 'Ma daj, nije moguće', en: 'No way, that\'s not possible' },
          { hr: 'Daj već jednom', en: 'Come on already / Just do it' },
        ],
      },
      {
        hr: 'Lud / Luda',
        en: 'Crazy / Wild / Insane',
        ph: 'LOOD / LOO-dah',
        level: '✅',
        note: 'The Croatian "crazy." "Lud" = crazy (masc), "luda" = crazy (fem). Used for people, situations, and as a compliment for something amazing. "To je ludo" = that\'s insane/amazing.',
        variants: [
          { hr: 'Jesi li lud?', en: 'Are you crazy?' },
          { hr: 'Ludi vikend', en: 'A wild/crazy weekend' },
          { hr: 'Ludnica', en: 'Madhouse / total chaos' },
        ],
      },
      {
        hr: 'Kaj ima? / Šta ima?',
        en: 'What\'s up? / What\'s going on?',
        ph: 'KAI EE-mah / SHTAH EE-mah',
        level: '✅',
        note: '"Kaj" = what (Zagreb/northern dialect), "šta" = what (standard). "Ima" = there is. The standard greeting among friends. "Kaj ima novo?" = "What\'s new?" Respond with "ništa" (nothing) or "sve po starom" (same as usual).',
        variants: [
          { hr: 'Sve ok?', en: 'All good?' },
          { hr: 'Sve po starom', en: 'Same as usual / Nothing new' },
        ],
      },
    ],
  },
  {
    id: 'art',
    icon: '🎨',
    title: 'The Art of the Curse',
    subtitle: 'Cultural masterclass — construction and creativity',
    color: '#0e7490', light: '#f0f9ff', border: '#7dd3fc',
    entries: [
      {
        hr: 'The "Jeb-" Construction',
        en: 'How Croatian swears are built',
        ph: '—',
        level: '📚',
        note: 'The root "jeb-" (from "jebati," to f***) is uniquely productive in Croatian. Unlike English where "f***" is roughly fixed, Croatian speakers add prefixes, suffixes, and case endings to create infinite variations. "Zajebati" = to mess up/screw over. "Izjebati" = to f*** up completely. "Pojebati" = to f*** (completed action). "Nadjebati" = to out-f*** / to dominate.',
        variants: [
          { hr: 'Zajebao si', en: 'You screwed up / You messed that up' },
          { hr: 'Izjebano', en: 'Completely f***ed up (situation)' },
          { hr: 'Pojebali su ga', en: 'They screwed him over' },
        ],
      },
      {
        hr: 'Curse Intensity Scale',
        en: 'Knowing when and how hard to hit',
        ph: '—',
        level: '📚',
        note: 'Croatian swearing has levels. Light: "sranje," "govno," "majku mu." Medium: "jebote," "jebi ga." Heavy: "jebem ti mater." Nuclear: full constructions with "mater" + relatives. Reading the room is critical — among close friends these are terms of affection; with strangers they escalate fast.',
        variants: [
          { hr: 'Između prijatelja', en: 'Among friends — almost all phrases are acceptable, tone = love' },
          { hr: 'U javnosti', en: 'In public — stick to "sranje" and "jebote" maximum' },
        ],
      },
      {
        hr: 'Nije me briga / Briga me',
        en: 'I don\'t care (the polite ladder)',
        ph: 'NEE-yeh meh BREE-gah / BREE-gah meh',
        level: '📚',
        note: 'Croatian has a beautiful ladder of "I don\'t care" expressions from polite to nuclear. "Nije me briga" (polite), "boli me briga" (stronger), "boli me kurac" (explicit). Same meaning, increasing intensity. Master all three.',
        variants: [
          { hr: 'Nije me briga', en: 'I don\'t care (neutral/polite)' },
          { hr: 'Boli me briga', en: 'I really don\'t care (mild expletive)' },
          { hr: 'Boli me kurac', en: 'I absolutely do not give a damn (explicit)' },
        ],
      },
      {
        hr: 'Affectionate Swearing',
        en: 'When curses mean the opposite',
        ph: '—',
        level: '📚',
        note: 'Perhaps the most important concept: in Croatian culture, swearing at someone can be an expression of deep affection. "Jebem ti mater" said with a smile while hugging someone = "you absolute legend, I love you." The same words, different tone, completely opposite meaning. Context and tone are everything.',
        variants: [
          { hr: 'Jebote, faca si!', en: 'F*** me, you\'re a legend! (huge compliment)' },
          { hr: 'Picka mu materina, uspio si', en: 'Holy sh**, you did it! (said in awe/pride)' },
        ],
      },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SlangScreen({ goBack, award }) {
  const [gated, setGated] = useState(true);
  const [activeSection, setActiveSection] = useState('classics');
  const [expanded, setExpanded] = useState(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  function handleUnlock() {
    setGated(false);
    if (award && !xpAwarded) { award(15); setXpAwarded(true); }
  }

  if (gated) {
    return (
      <div className="scr-wrap" style={{ paddingBottom: 100 }}>
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
          borderRadius: 24, color: '#fff', marginBottom: 20,
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🤬</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, marginBottom: 12, color: '#fff' }}>
            Psovanje kao umjetnost
          </h2>
          <p style={{ fontSize: 14, opacity: .8, lineHeight: 1.7, marginBottom: 8 }}>
            <em>Swearing as an artform</em>
          </p>
          <p style={{ fontSize: 13, opacity: .7, lineHeight: 1.6, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
            This module covers authentic Croatian slang, colloquial expressions,
            and culturally significant swear words with full context and pronunciation.
            Content is intended for adult learners of the Croatian language.
          </p>
          <div style={{
            background: 'rgba(255,255,255,.08)', borderRadius: 14,
            padding: '14px 20px', marginBottom: 28, fontSize: 13,
            lineHeight: 1.6, opacity: .85, textAlign: 'left',
          }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>📚 What you'll learn:</div>
            <div>• Classic Croatian expletives and their grammatical structure</div>
            <div>• When, how, and with whom each expression is appropriate</div>
            <div>• Everyday slang that makes you sound like a local</div>
            <div>• The cultural art of affectionate swearing</div>
          </div>
          <button
            onClick={handleUnlock}
            style={{
              padding: '16px 40px', borderRadius: 16, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#dc2626,#b91c1c)',
              color: '#fff', fontSize: 16, fontWeight: 900,
              fontFamily: "'Outfit',sans-serif",
              boxShadow: '0 8px 32px rgba(220,38,38,.4)',
            }}>
            I'm an adult — Let's learn 🔥
          </button>
          <div style={{ marginTop: 16, fontSize: 11, opacity: .5 }}>+15 XP for accessing this module</div>
        </div>
        <button onClick={goBack} style={{ width: '100%', padding: 14, background: 'none', border: '1.5px solid var(--card-b)', borderRadius: 14, color: 'var(--subtext)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
          ← Back
        </button>
      </div>
    );
  }

  const section = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="scr-wrap" style={{ paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
        borderRadius: 20, padding: '20px', marginBottom: 16, color: '#fff', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🤬</div>
        <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Playfair Display',serif" }}>
          Croatian Slang & Expressions
        </div>
        <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>
          Tap any entry to expand pronunciation, usage notes, and variations
        </div>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => { setActiveSection(s.id); setExpanded(null); }}
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 20,
              border: `1.5px solid ${activeSection === s.id ? s.color : 'var(--card-b)'}`,
              background: activeSection === s.id ? s.light : 'var(--card)',
              color: activeSection === s.id ? s.color : 'var(--subtext)',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              transition: 'all .2s',
            }}>
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      {/* Section subtitle */}
      <div style={{
        background: section.light, border: `1.5px solid ${section.border}`,
        borderRadius: 12, padding: '10px 14px', marginBottom: 14,
        fontSize: 12, color: section.color, fontWeight: 700,
      }}>
        {section.subtitle}
      </div>

      {/* Entries */}
      {section.entries.map((entry, i) => {
        const isOpen = expanded === i;
        return (
          <div
            key={i}
            style={{
              background: 'var(--card)', border: `1.5px solid ${isOpen ? section.color : 'var(--card-b)'}`,
              borderRadius: 16, marginBottom: 10, overflow: 'hidden',
              transition: 'border-color .2s',
              boxShadow: isOpen ? `0 4px 20px ${section.color}22` : '0 1px 4px rgba(0,0,0,.06)',
            }}>

            {/* Entry header — always visible */}
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${section.light}`,
                border: `1.5px solid ${section.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {entry.level}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 16, fontWeight: 900, color: 'var(--heading)',
                  fontFamily: "'Playfair Display',serif", lineHeight: 1.2,
                }}>
                  {entry.hr}
                </div>
                <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2, fontWeight: 600 }}>
                  {entry.en}
                </div>
              </div>
              {entry.ph !== '—' && (
                <button
                  onClick={e => { e.stopPropagation(); speak(entry.hr, 'hr'); }}
                  aria-label={`Hear ${entry.hr}`}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none',
                    background: `linear-gradient(135deg,${section.color},${section.color}cc)`,
                    color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  🔊
                </button>
              )}
              <div style={{ fontSize: 14, color: 'var(--subtext)', opacity: .4, flexShrink: 0 }}>
                {isOpen ? '▲' : '▼'}
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${section.border}` }}>

                {/* Phonetic */}
                {entry.ph !== '—' && (
                  <div style={{
                    background: section.light, borderRadius: 10,
                    padding: '8px 12px', marginTop: 12, marginBottom: 12,
                    fontSize: 13, color: section.color, fontWeight: 700,
                    fontFamily: 'monospace',
                  }}>
                    🗣 /{entry.ph}/
                  </div>
                )}

                {/* Cultural note */}
                <div style={{
                  fontSize: 13, color: 'var(--text)', lineHeight: 1.7,
                  background: 'var(--bar-bg)', borderRadius: 10, padding: '12px 14px',
                  marginBottom: entry.variants.length ? 12 : 0,
                }}>
                  {entry.note}
                </div>

                {/* Variants */}
                {entry.variants.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                      Variations & Examples
                    </div>
                    {entry.variants.map((v, vi) => (
                      <div key={vi} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '8px 10px', borderRadius: 10,
                        background: section.light, border: `1px solid ${section.border}`,
                        marginBottom: vi < entry.variants.length - 1 ? 6 : 0,
                      }}>
                        <button
                          onClick={() => speak(v.hr, 'hr')}
                          aria-label={`Hear ${v.hr}`}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: 'none',
                            background: section.color, color: '#fff', fontSize: 12,
                            cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                          🔊
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: section.color, fontFamily: "'Playfair Display',serif" }}>
                            {v.hr}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2, fontWeight: 500 }}>
                            {v.en}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Cultural footnote */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
        borderRadius: 16, padding: '16px 20px', marginTop: 8, marginBottom: 16,
        color: '#fff', fontSize: 12, lineHeight: 1.7, opacity: .9,
      }}>
        <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>🇭🇷 Cultural Note</div>
        Croatian swearing is a deeply social, highly contextual artform. The same phrase can be a
        declaration of love between close friends and a serious insult between strangers. Tone,
        relationship, and setting determine meaning entirely. When in doubt, listen first — you'll
        quickly learn the rhythm of when these words express warmth versus hostility.
      </div>

      <button onClick={goBack} style={{
        width: '100%', padding: 14, background: 'none',
        border: '1.5px solid var(--card-b)', borderRadius: 14,
        color: 'var(--subtext)', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
      }}>
        ← Back to Practice
      </button>
    </div>
  );
}
