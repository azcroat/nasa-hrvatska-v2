// @ts-nocheck
import React, { useState, useMemo } from 'react';

const GRAMMAR_TOPICS = [
  {
    id: 'cases',
    title: '7 Grammatical Cases',
    emoji: '🔄',
    summary:
      'Croatian nouns, pronouns and adjectives change endings based on their role in the sentence.',
    sections: [
      {
        name: 'Nominative (Nominativ)',
        desc: 'Subject of the sentence — who or what is doing the action.',
        example: 'Pas trči. — The dog runs.',
        tip: 'Always the dictionary form. No preposition.',
      },
      {
        name: 'Genitive (Genitiv)',
        desc: 'Possession, quantity, negation, and many prepositions (od, do, iz, bez, kod, za...).',
        example: 'Čaša vode — A glass of water. Nema kruha — There is no bread.',
        tip: 'After numbers 5+: pet knjiga (five books).',
      },
      {
        name: 'Dative (Dativ)',
        desc: 'Indirect object — to whom / for whom. Prepositions: prema, k/ka.',
        example: 'Dajem knjgu prijatelju. — I give the book to a friend.',
        tip: 'Clitics: mi, ti, mu, joj, nam, vam, im.',
      },
      {
        name: 'Accusative (Akuzativ)',
        desc: 'Direct object — who or what receives the action. Most common case after verbs.',
        example: 'Vidim psa. — I see the dog.',
        tip: 'Motion prepositions: u, na, za, kroz + accusative.',
      },
      {
        name: 'Vocative (Vokativ)',
        desc: 'Addressing someone directly.',
        example: 'Marko! Prijatelju!',
        tip: 'Mostly used in speech and writing letters.',
      },
      {
        name: 'Locative (Lokativ)',
        desc: 'Location — always with a preposition (u, na, o, pri, po).',
        example: 'Živim u gradu. — I live in the city.',
        tip: 'Never used without a preposition.',
      },
      {
        name: 'Instrumental (Instrumental)',
        desc: 'Means/instrument, accompaniment (with). Prepositions: s/sa.',
        example: 'Pišem olovkom. — I write with a pencil. Idem s prijateljem.',
        tip: 'After "biti" (to be) in some constructions: Bio je učiteljem.',
      },
    ],
  },
  {
    id: 'tenses',
    title: 'Verb Tenses',
    emoji: '⏰',
    summary: 'Croatian has present, past (perfect), future, and pluperfect tenses.',
    sections: [
      {
        name: 'Present (Prezent)',
        desc: 'Ongoing or habitual actions.',
        example: 'Govorim hrvatski. — I speak Croatian.',
        tip: 'Conjugation varies by verb type (a-verbs, e-verbs, i-verbs).',
      },
      {
        name: 'Past (Perfekt)',
        desc: 'Completed past actions. Formed with biti auxiliary + past active participle.',
        example: 'Govorio sam. (m) / Govorila sam. (f) — I spoke / I was speaking.',
        tip: 'The auxiliary "sam/si/je/smo/ste/su" is a clitic — never sentence-initial.',
      },
      {
        name: 'Future I (Futur I)',
        desc: 'Future actions. Formed with ću/ćeš/će... + infinitive (or shortened form).',
        example: 'Govorit ću. / Govoriću. — I will speak.',
        tip: "Short form: govorit ću. In speech often merged: Govorit'ću.",
      },
      {
        name: 'Conditional (Kondicional)',
        desc: 'Hypothetical situations. Formed with bi + past active participle.',
        example: 'Govorio bih. — I would speak. Kad bih imao vremena, učio bih više.',
        tip: '"Bi" is the same for all persons in written Croatian.',
      },
    ],
  },
  {
    id: 'aspect',
    title: 'Verb Aspect (Vid)',
    emoji: '🔁',
    summary:
      'Every Croatian verb is either imperfective (ongoing process) or perfective (completed action). This is one of the biggest differences from English.',
    sections: [
      {
        name: 'Imperfective (Nesvršeni)',
        desc: 'Describes an ongoing, repeated, or habitual action — the process, not the result.',
        example: 'pisati (to write/be writing), čitati (to read/be reading), gledati (to watch)',
        tip: 'Use in: present tense, describing how long something took, habitual past.',
      },
      {
        name: 'Perfective (Svršeni)',
        desc: 'Describes a completed action with a clear endpoint — the result matters.',
        example:
          'napisati (to write = complete), pročitati (to read = finish reading), pogledati (to watch = finish watching)',
        tip: 'Perfective verbs CANNOT form a true present tense — the "present" form has future meaning.',
      },
      {
        name: 'Aspect Pairs',
        desc: 'Most verbs come in imperfective/perfective pairs.',
        example: 'pisati → napisati, čitati → pročitati, raditi → uraditi/napraviti',
        tip: 'Prefixes (na-, po-, za-, pro-, do-...) often turn imperfective into perfective.',
      },
    ],
  },
  {
    id: 'clitics',
    title: 'Clitics (Klitike)',
    emoji: '🔗',
    summary:
      'Clitics are unstressed short forms of pronouns and the verb biti. They have strict placement rules.',
    sections: [
      {
        name: 'What are clitics?',
        desc: 'Short unstressed words that attach to the second position in a clause, never sentence-initial.',
        example: 'Dao sam mu ga. — I gave it to him. (NOT: Mu sam ga dao.)',
        tip: 'Second position = after the first stressed word or phrase.',
      },
      {
        name: 'Order of clitics',
        desc: 'When multiple clitics appear together, they follow a fixed order: biti > reflexive se/si > dative > accusative.',
        example: 'Dao sam mu ga. (biti=sam, dative=mu, accusative=ga)',
        tip: 'Mnemonic: "se" always comes before other pronouns.',
      },
      {
        name: 'Pronoun clitics',
        desc: 'Dative: mi, ti, mu, joj, nam, vam, im. Accusative: me, te, ga/ga, je/ju, nas, vas, ih.',
        example: 'Vidim ga. — I see him. Daj mi to. — Give me that.',
        tip: 'Long forms (mene, tebe, njega...) used for emphasis or after prepositions.',
      },
    ],
  },
  {
    id: 'gender',
    title: 'Noun Gender',
    emoji: '⚥',
    summary:
      'Every Croatian noun is masculine, feminine, or neuter. Gender affects adjective and verb agreement.',
    sections: [
      {
        name: 'Masculine',
        desc: 'Usually end in a consonant.',
        example: 'grad (city), pas (dog), stol (table), prijatelj (friend)',
        tip: 'Exceptions: tata (dad), muškarac (man) — masculine despite -a ending.',
      },
      {
        name: 'Feminine',
        desc: 'Usually end in -a.',
        example: 'žena (woman), kuća (house), knjiga (book), ruka (hand)',
        tip: 'Some consonant-ending nouns are feminine: stvar (thing), noć (night), ljubav (love).',
      },
      {
        name: 'Neuter',
        desc: 'Usually end in -o or -e.',
        example: 'dijete (child), more (sea), selo (village), ime (name)',
        tip: 'Neuter nouns that end in -e often have irregular plurals: dijete → djeca.',
      },
    ],
  },
];

/**
 * @param {{ onClose?: () => void }} props
 */
export default function GrammarReference({ onClose }) {
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(/** @type {string|null} */ null);

  const filtered = useMemo(() => {
    if (!search.trim()) return GRAMMAR_TOPICS;
    const q = search.toLowerCase();
    return GRAMMAR_TOPICS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.sections.some(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.desc.toLowerCase().includes(q) ||
            s.example.toLowerCase().includes(q),
        ),
    );
  }, [search]);

  return (
    <div className="scr-wrap" style={{ paddingBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--subtext)',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Back
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>📖 Grammar Reference</h2>
      </div>

      <input
        type="search"
        placeholder="Search grammar… (e.g. genitive, aspect, clitic)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1.5px solid var(--border,#e2e8f0)',
          background: 'var(--bg2,#f8fafc)',
          color: 'var(--text,#1c1917)',
          fontSize: 14,
          fontFamily: "'Outfit',sans-serif",
          marginBottom: 16,
          boxSizing: 'border-box',
        }}
      />

      {filtered.length === 0 && (
        <p style={{ color: 'var(--subtext)', textAlign: 'center' }}>No results for "{search}"</p>
      )}

      {filtered.map((topic) => (
        <div key={topic.id} className="c" style={{ marginBottom: 12, overflow: 'hidden' }}>
          <button
            onClick={() => setOpenId(openId === topic.id ? null : topic.id)}
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              textAlign: 'left',
              fontFamily: "'Outfit',sans-serif",
            }}
            aria-expanded={openId === topic.id}
          >
            <span style={{ fontSize: 22 }}>{topic.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>
                {topic.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
                {topic.summary}
              </div>
            </div>
            <span
              style={{
                color: 'var(--subtext)',
                fontSize: 18,
                transition: 'transform .2s',
                transform: openId === topic.id ? 'rotate(180deg)' : 'none',
              }}
            >
              ▾
            </span>
          </button>

          {openId === topic.id && (
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border,#e2e8f0)' }}>
              {topic.sections.map((s) => (
                <div key={s.name} style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--heading)',
                      marginBottom: 4,
                    }}
                  >
                    {s.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text,#374151)', marginBottom: 6 }}>
                    {s.desc}
                  </div>
                  <div
                    style={{
                      background: 'linear-gradient(135deg,rgba(14,116,144,.08),rgba(22,78,99,.06))',
                      borderLeft: '3px solid #0e7490',
                      borderRadius: '0 8px 8px 0',
                      padding: '8px 12px',
                      fontSize: 13,
                      color: 'var(--heading)',
                      fontStyle: 'italic',
                      marginBottom: 4,
                    }}
                  >
                    {s.example}
                  </div>
                  {s.tip && (
                    <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 600 }}>
                      💡 {s.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
