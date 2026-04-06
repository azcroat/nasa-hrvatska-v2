import React from 'react';
import { motion } from 'framer-motion';
import { Spk } from '../../data.jsx';

const LABELS = ['A', 'B', 'C', 'D', 'E'];

// ── DuoLingo-style grammar hint engine ───────────────────────────────────────
// Returns a specific grammar explanation based on the question's Croatian word
// or category, rather than the generic "take note of this word" fallback.
const CATEGORY_HINTS = {
  greetings:  'Croatian greetings change based on time of day: "Dobro jutro" (morning), "Dobar dan" (afternoon), "Dobra večer" (evening).',
  farewells:  '"Doviđenja" is formal; "Bok" and "Poka" are casual. Match the formality to your context.',
  food:       'Food nouns: feminine nouns end in -a (kava, pizza), neuter nouns end in -o or -e (meso, vino).',
  verbs:      'Croatian infinitives end in -ti or -ći. The present tense drops that ending and adds personal endings (-m, -š, -ø, -mo, -te, -ju/-e).',
  numbers:    'Numbers 1–4 take special case agreement with nouns. From 5 onward, nouns take the genitive plural.',
  colours:    'Colours in Croatian are adjectives — they agree with the noun\'s gender: crveni (m), crvena (f), crveno (n).',
  family:     'Croatian family terms distinguish gender strictly: "brat" (brother), "sestra" (sister). There\'s no gender-neutral equivalent.',
  body:       'Body parts are mostly feminine (-a ending: ruka, noga) or masculine (nos, prst). Gender determines adjective endings.',
  nature:     'Nature vocabulary often reflects gender by ending: more (n), rijeka (f), brijeg (m).',
  travel:     'Travel phrases often use the locative case for locations: "u gradu" (in the city), "na plaži" (at the beach).',
  time:       '"Sada" (now), "jučer" (yesterday), "sutra" (tomorrow). Croatian doesn\'t use articles — no "the" or "a".',
  emotions:   'Emotion words often use the verb "biti" (to be) with an adjective: "Sretan sam" (I am happy). Adjective agrees with subject gender.',
  phrases:    'Common phrases often use the dative case for indirect objects: "Daj mi" (give me), "Reci mi" (tell me).',
  grammar:    'Remember: in Croatian every letter is pronounced exactly as written — one letter, one sound, always.',
};

// Pattern-based hints derived from the Croatian word itself
function _detectHintFromWord(hr) {
  if (!hr) return null;
  const w = hr.trim().toLowerCase();
  // Verb infinitives
  if (/[a-zčćšžđ]ti$/.test(w) || /[a-zčćšžđ]ći$/.test(w)) {
    return `"${hr}" is a verb infinitive (ends in -ti/-ći). Present tense: drop the ending and add -m / -š / - / -mo / -te / -ju.`;
  }
  // Feminine nouns (-a ending)
  if (/[aeiouaeiou]$/.test(w) && w.endsWith('a') && w.length > 2) {
    return `"${hr}" ends in -a — likely a feminine noun. Its accusative singular also ends in -u: "${hr.slice(0, -1)}u".`;
  }
  // Neuter nouns (-o / -e ending)
  if (w.endsWith('o') || w.endsWith('e')) {
    return `"${hr}" ends in -o/-e — likely a neuter noun. Neuter nouns have the same form in nominative and accusative singular.`;
  }
  // Past tense -ao/-la/-lo
  if (w.endsWith('ao') || w.endsWith('la') || w.endsWith('lo')) {
    return `This looks like a past tense form. Croatian past tense uses "bio/bila/bilo" for "to be" and -ao/-la/-lo endings for other verbs.`;
  }
  return null;
}

function getGrammarHint(q) {
  // 1. Use question-specific hint/explanation if present
  if (q.hint) return q.hint;
  if (q.explanation) return q.explanation;
  // 2. Category-based hint
  const cat = (q.category || q.cat || '').toLowerCase();
  for (const [key, hint] of Object.entries(CATEGORY_HINTS)) {
    if (cat.includes(key)) return hint;
  }
  // 3. Word-pattern detection
  const wordHint = _detectHintFromWord(q.hr);
  if (wordHint) return wordHint;
  // 4. Rotating pool of general tips (keyed by question index to stay stable during session)
  const GENERAL_TIPS = [
    'Croatian is fully phonetic — every letter makes exactly one sound, always. Once you know the 30-letter alphabet, you can read anything.',
    'Croatian nouns have 7 grammatical cases. The most common are: nominative (subject), accusative (direct object), and genitive (possession/negation).',
    'Verb aspect is key in Croatian: imperfective verbs describe ongoing actions; perfective verbs describe completed ones. "Pisati" vs "napisati".',
    'Word order in Croatian is flexible but clitics (short unstressed pronouns) must appear in second position: "Vidim te" not "Te vidim".',
    'Croatian adjectives agree with the noun they describe in gender, number, and case. Master this and sentences click into place.',
    'The letter "č" sounds like "ch" in "church"; "š" like "sh" in "shoe"; "ž" like "zh" in "measure". All consistent, no exceptions.',
    'Tip: words you miss here are automatically added to your Spaced Repetition queue for targeted review later.',
  ];
  const idx = (q._qIdx ?? 0) % GENERAL_TIPS.length;
  return GENERAL_TIPS[idx];
}

// ── Particle burst on correct answer ─────────────────────────────────────────
const PARTICLES = ['⭐','✨','🌟','💫','⚡','✨','⭐','🌟','💥','✨'];
const PARTICLE_POSITIONS = [
  [-30, -20], [-40, 0], [-30, 20], [0, 30], [0, -30],
  [-20, 40], [20, 40], [30, 0], [20, -40], [-20, -40],
];

function ParticleBurst({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      {PARTICLES.map((e, i) => {
        const [topOff, leftOff] = PARTICLE_POSITIONS[i];
        return (
          <div key={i} style={{
            position: 'absolute', fontSize: 14 + (i % 3) * 4,
            animation: `xpFloat .8s ${i * 0.05}s ease forwards`,
            top: topOff, left: leftOff, opacity: 0,
          }}>
            {e}
          </div>
        );
      })}
    </div>
  );
}

export default function McQuestionArea({
  q,
  answered,
  selected,
  revealCorrect,
  glowIndex,
  burst,
  qTransition,
  score,
  questions,
  isLast,
  firstOptionRef,
  onAnswer,
  onKey,
}) {
  return (
    <>
      {/* Question card */}
      <div
        className="c"
        style={{
          marginBottom: 20,
          background: 'linear-gradient(145deg,var(--card),var(--card))',
          borderLeft: '4px solid var(--info)',
          opacity: qTransition ? 0 : 1,
          transform: qTransition ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          {q.hr && <Spk text={q.hr} label="" />}
          <p style={{
            fontSize: 26, fontWeight: 900, fontFamily: "'Playfair Display',serif",
            color: 'var(--heading)', lineHeight: 1.2, flex: 1,
          }}>
            {q.hr}
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600 }}>
          What does this mean in English?
        </p>
      </div>

      {/* SR-only announcer */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {answered &&
          (q.opts[selected] === q.correct
            ? `Correct! Score: ${score} of ${questions.length}.`
            : `Incorrect. The answer is ${q.correct}. Score: ${score} of ${questions.length}.`)}
      </div>

      {/* Options */}
      <div style={{
        position: 'relative', opacity: qTransition ? 0 : 1,
        transform: qTransition ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        {q.opts.map((o, i) => {
          const isCorrect = answered && o === q.correct;
          const isWrong = answered && selected === i && o !== q.correct;
          const isRevealedCorrect = revealCorrect && o === q.correct && !isCorrect;
          const isGlowing = glowIndex === i && answered && !isCorrect;
          return (
            <div key={i} style={{ position: 'relative' }}>
              <motion.button
                ref={i === 0 ? firstOptionRef : null}
                className={'ob' + (isCorrect ? ' ok' : isWrong ? ' no' : '')}
                aria-pressed={answered && selected === i}
                aria-label={`Option ${i + 1}: ${o}`}
                onKeyDown={e => onKey(e, i)}
                onClick={() => onAnswer(o, i)}
                whileTap={!answered ? { scale: 0.97 } : {}}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 14, fontSize: 15,
                  transition: 'background .2s ease, border-color .2s ease, transform .12s ease',
                  ...(isRevealedCorrect ? { background: 'var(--success-bg)', borderColor: 'var(--success-b)', color: 'var(--success)' } : {}),
                  ...(isGlowing ? { animation: 'correctGlow 0.5s ease infinite', borderColor: 'var(--success-b)' } : {}),
                }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                  background: isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : isRevealedCorrect ? 'var(--success)' : 'var(--bar-bg)',
                  color: isCorrect || isWrong || isRevealedCorrect ? '#fff' : 'var(--subtext)',
                  transition: 'all .2s',
                }}>
                  {isCorrect ? '✓' : isWrong ? '✕' : isRevealedCorrect ? '✓' : LABELS[i]}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{o}</span>
                {isRevealedCorrect && <span style={{ fontSize: 11, marginLeft: 4 }}>✓</span>}
                {isCorrect && <span style={{ fontSize: 18 }}>🎯</span>}
              </motion.button>
              <ParticleBurst active={burst === i} />
            </div>
          );
        })}
      </div>

      {/* Keyboard hint — desktop only via CSS .kb-hints */}
      <div className="kb-hints" aria-hidden="true" style={{ marginTop: 8, justifyContent: 'center' }}>
        <span>Select:</span>
        {(q?.opts || []).map((_, i) => (
          <span key={i}><span className="kb-key" data-key={i + 1} /></span>
        ))}
        <span style={{ marginLeft: 4 }}>Confirm: <span className="kb-key">↵</span></span>
      </div>
      <span className="sr-only" aria-live="polite">Tip: press 1–4 to choose an answer</span>

      {/* Grammar hint on wrong answer */}
      {answered && q.opts[selected] !== q.correct && (
        <div style={{
          marginTop: 8, padding: '10px 14px',
          background: 'var(--info-bg)',
          border: '1px solid var(--info-b, rgba(14,116,144,0.2))',
          borderRadius: 10, fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5,
        }}>
          💡 {getGrammarHint(q)}
        </div>
      )}

      {/* CTA button rendered by parent McGame as sticky .cta-bar */}
    </>
  );
}
