import React, { useState, useMemo, useRef, useCallback } from 'react';
import { H, Bar, sh } from '../../data.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// The 6 core aspect rules every Croatian learner MUST internalize.
// Research basis: Novak Milić (2010), Comrie (1976), Dickey (2000).
// ─────────────────────────────────────────────────────────────────────────────
const ASPECT_RULES = [
  {
    id: 'habitual',
    label: 'Habitual / Repeated',
    icon: '🔄',
    short: 'Repeated or habitual → imperfective',
    explanation: 'When an action happens regularly, routinely, or repeatedly — always imperfective. Key markers: svaki dan, uvijek, često, redovito, ponekad.',
    example: { hr: 'Svaki dan pišem pismo.', en: 'Every day I write a letter. (habit → impf)' },
    counterex: { hr: 'Napisao sam pismo.', en: 'I wrote the letter. (single completed event → pf)' },
  },
  {
    id: 'completed',
    label: 'Single Completed Event',
    icon: '✓',
    short: 'One-time completed action → perfective',
    explanation: 'When a single, bounded event happened and is done — perfective. The action has a clear endpoint reached. Key markers: jednom, odmah, napokon, iznenada.',
    example: { hr: 'Napokon sam napisao pismo.', en: 'I finally wrote the letter. (done, endpoint reached → pf)' },
    counterex: { hr: 'Pisao sam pismo.', en: 'I was writing a letter. (process, no endpoint → impf)' },
  },
  {
    id: 'ongoing',
    label: 'Ongoing / In-Progress',
    icon: '⏳',
    short: 'Present tense = always imperfective',
    explanation: 'Croatian present tense is inherently imperfective — you cannot use perfective verbs in present to describe current action. Perfective present has future meaning only.',
    example: { hr: 'Pišem ti poruku sada.', en: 'I am writing you a message now. (impf — only option)' },
    counterex: { hr: 'Napišem ti poruku sutra.', en: 'I will write you a message tomorrow. (pf present = future)' },
  },
  {
    id: 'negation',
    label: 'Negation',
    icon: '🚫',
    short: 'Negation → usually imperfective',
    explanation: 'Negated actions typically use imperfective because completion is denied — the action is presented as not having occurred (or as an unachieved process). Exceptions exist with completed past.',
    example: { hr: 'Nisam pisao pismo.', en: 'I was not writing a letter. / I did not write a letter. (usual)' },
    counterex: { hr: 'Nisam napisao pismo.', en: 'I did not finish writing the letter. (specific: failure to complete)' },
  },
  {
    id: 'sequence',
    label: 'Narrative Sequence',
    icon: '📖',
    short: 'Sequential narrative events → perfective',
    explanation: 'A chain of actions that move the story forward — each completed before the next begins. Perfective gives the narrative its momentum. Think: "first X happened, then Y, then Z."',
    example: { hr: 'Ustao sam, popio kavu i otišao.', en: 'I got up, drank coffee and left. (chain → pf pf pf)' },
    counterex: { hr: 'Ustajao sam, pio kavu i odlazio.', en: 'I would get up, drink coffee and leave. (habitual → impf impf impf)' },
  },
  {
    id: 'simultaneous',
    label: 'Simultaneous / While',
    icon: '⚡',
    short: 'Parallel / background actions → imperfective',
    explanation: 'Actions happening at the same time, or a background action during which something else occurs — imperfective. Key markers: dok (while), za vrijeme (during), istovremeno (simultaneously).',
    example: { hr: 'Dok sam pisao, zvonio je telefon.', en: 'While I was writing, the phone rang. (background → impf)' },
    counterex: { hr: 'Napisao sam pismo dok je ona spavala.', en: 'I wrote (completed) the letter while she slept. (completed within window → pf)' },
  },
];

const ASPECT_KEYFRAMES = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulseBar {
  0%   { width: 0; opacity: 0.4; }
  100% { width: 100%; opacity: 1; }
}
@keyframes dotAppear {
  0%   { opacity: 0; transform: scale(0); }
  70%  { transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes correctPop {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
`;

// ─── Phase indicator ─────────────────────────────────────────────────────────
function PhaseBar({ phase, total }) {
  const PHASES = ['Pair', 'Fill-In', 'Why?', 'Compare'];
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {PHASES.slice(0, total).map((label, i) => (
        <div key={i} style={{
          flex: 1, padding: '5px 0', borderRadius: 6, textAlign: 'center',
          fontSize: 10, fontWeight: 700, letterSpacing: '.04em',
          background: i < phase ? 'var(--success,#16a34a)' : i === phase ? 'var(--info,#0284c7)' : 'var(--bar-bg)',
          color: i <= phase ? '#fff' : 'var(--subtext)',
          transition: 'all .25s',
        }}>
          {i < phase ? '✓' : label}
        </div>
      ))}
    </div>
  );
}

// ─── Aspect timeline visualizer ───────────────────────────────────────────────
function AspectTimeline({ aspect, dimmed }) {
  const isPf = aspect === 'pf';
  const color = dimmed ? 'var(--subtext)' : (isPf ? 'var(--success,#16a34a)' : 'var(--info,#0284c7)');
  const bgColor = dimmed ? 'var(--bar-bg)' : (isPf ? 'rgba(22,163,74,.07)' : 'rgba(2,132,199,.07)');
  const borderColor = dimmed ? 'var(--card-b)' : (isPf ? '#bbf7d0' : '#bae6fd');

  return (
    <div style={{
      background: bgColor, border: `1.5px solid ${borderColor}`,
      borderRadius: 10, padding: '10px 14px',
      opacity: dimmed ? 0.45 : 1, transition: 'opacity .3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{isPf ? '✓' : '🔄'}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {isPf ? 'Perfective — completed, bounded' : 'Imperfective — ongoing / habitual'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 22 }}>
        {isPf ? (
          <div style={{ flex: 1, height: 3, background: dimmed ? 'var(--bar-bg)' : 'var(--success,#16a34a)', borderRadius: 2, position: 'relative' }}>
            {!dimmed && (
              <div style={{
                position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--success,#16a34a)',
                animation: 'dotAppear .5s ease forwards',
                boxShadow: '0 0 0 3px #bbf7d0',
              }} />
            )}
          </div>
        ) : (
          <div style={{ flex: 1, height: 10, background: dimmed ? 'var(--bar-bg)' : '#e0f2fe', borderRadius: 6, overflow: 'hidden' }}>
            {!dimmed && (
              <div style={{
                height: '100%', background: 'linear-gradient(90deg, var(--info,#0284c7) 0%, #7dd3fc 60%, var(--info,#0284c7) 100%)',
                backgroundSize: '200% 100%', borderRadius: 6,
                animation: 'pulseBar 1.2s ease forwards', width: 0,
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rule explanation card ────────────────────────────────────────────────────
function RuleCard({ rule, highlight }) {
  return (
    <div style={{
      background: highlight ? 'rgba(14,116,144,.08)' : 'var(--bar-bg)',
      border: highlight ? '1.5px solid var(--info,#0284c7)' : '1.5px solid var(--card-b)',
      borderRadius: 12, padding: '12px 14px', marginBottom: 8,
      animation: highlight ? 'slideIn .3s ease' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{rule.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: highlight ? 'var(--info,#0284c7)' : 'var(--heading)' }}>
          Rule: {rule.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.55, marginBottom: 8 }}>
        {rule.explanation}
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--heading)', fontWeight: 600 }}>✓ {rule.example.hr}</div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>{rule.example.en}</div>
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 8, padding: '8px 10px' }}>
        <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--heading)', fontWeight: 600 }}>↔ {rule.counterex.hr}</div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>{rule.counterex.en}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AspectDrillScreen({ goBack, award, ASPECT_PAIRS }) {
  const finishFired = useRef(false);

  // ── Level gate ───────────────────────────────────────────────────────────
  const userLevel = typeof localStorage !== 'undefined' ? (localStorage.getItem('nh_level') || 'A1') : 'A1';
  const aspectReady = ['B1','B2','C1','C2'].includes(userLevel);

  // ── Session mode: 'drill' or 'reference' ────────────────────────────────
  const [sessionMode, setSessionMode] = useState('drill');

  // ── Mistake tracking ─────────────────────────────────────────────────────
  const [mistakeIds, setMistakeIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('nh_aspect_mistakes') || '[]');
      return new Set(stored);
    } catch { return new Set(); }
  });
  const [mistakesOnly, setMistakesOnly] = useState(false);

  function recordMistake(en) {
    setMistakeIds(prev => {
      const next = new Set(prev);
      next.add(en);
      localStorage.setItem('nh_aspect_mistakes', JSON.stringify([...next]));
      return next;
    });
  }
  function clearMistake(en) {
    setMistakeIds(prev => {
      const next = new Set(prev);
      next.delete(en);
      localStorage.setItem('nh_aspect_mistakes', JSON.stringify([...next]));
      return next;
    });
  }

  // ── Items pool ───────────────────────────────────────────────────────────
  const allItems = useMemo(() => {
    if (!ASPECT_PAIRS?.length) return [];
    return sh([...ASPECT_PAIRS]);
  }, [ASPECT_PAIRS]);

  const items = useMemo(() => {
    if (mistakesOnly && mistakeIds.size > 0) {
      const filtered = allItems.filter(item => mistakeIds.has(item.en));
      return filtered.length ? filtered : allItems;
    }
    return allItems;
  }, [allItems, mistakesOnly, mistakeIds]);

  // ── Phase system — 4 phases per pair ────────────────────────────────────
  // Phase 0: Pair recognition (impf vs pf — which is which?)
  // Phase 1: Fill-in context  (choose correct form given sentence clue)
  // Phase 2: Why?             (identify which of 6 rules applies)
  // Phase 3: Minimal pair     (two sentences — which meaning matches?)
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [revealRule, setRevealRule] = useState(false);

  const item = items[idx] || null;

  // ── Build question for current phase ────────────────────────────────────
  const question = useMemo(() => {
    if (!item) return null;

    // Find which rule governs this pair
    const ruleId = item.rule ? ASPECT_RULES.find(r =>
      item.rule.toLowerCase().includes(r.id) ||
      item.rule.toLowerCase().includes(r.label.toLowerCase().split(' ')[0])
    )?.id || guessRule(item) : guessRule(item);

    const rule = ASPECT_RULES.find(r => r.id === ruleId) || ASPECT_RULES[0];

    // Context sentences from the pair
    const ctxParts = (item.ctx || '').split('/').map(s => s.trim());
    const impfSentence = ctxParts[0] || `${item.impf} — ongoing or habitual`;
    const pfSentence   = ctxParts[1] || `${item.pf} — completed, done`;

    if (phase === 0) {
      // RECOGNITION — given English meaning, which Croatian form is imperfective?
      const askImpf = (idx % 2 === 0);
      return {
        type: 'recognition',
        prompt: askImpf
          ? `Which is the IMPERFECTIVE (ongoing/habitual) form of "${item.en}"?`
          : `Which is the PERFECTIVE (completed/one-time) form of "${item.en}"?`,
        hint: 'Think about the formation: prefixes and suffixes change meaning',
        opts: sh([item.impf, item.pf]),
        correct: askImpf ? item.impf : item.pf,
        correctAspect: askImpf ? 'impf' : 'pf',
        explain: askImpf
          ? `${item.impf} is imperfective. ${item.pf} is perfective. ${item.rule || 'The prefix or suffix marks completion.'}`
          : `${item.pf} is perfective. ${item.impf} is imperfective. ${item.rule || 'The prefix or suffix marks completion.'}`,
        rule,
        impfSentence,
        pfSentence,
      };
    }

    if (phase === 1) {
      // FILL-IN — context sentence with blank, choose the right form
      const useImpf = (idx + 1) % 2 === 0;
      const sentence = useImpf ? impfSentence : pfSentence;
      // Replace the verb in the sentence with blank (find Croatian verb form)
      const targetVerb = useImpf ? item.impf : item.pf;
      const wrongVerb  = useImpf ? item.pf   : item.impf;

      // Build gapped sentence: replace the first occurrence of either verb form
      const gapped = gapSentence(sentence, targetVerb, wrongVerb);

      return {
        type: 'fillin',
        prompt: `Choose the correct form to complete the sentence:`,
        sentence: gapped,
        hint: useImpf ? 'Look for time/frequency clues suggesting ongoing or habitual action' : 'Look for clues suggesting a single, completed event',
        opts: sh([targetVerb, wrongVerb]),
        correct: targetVerb,
        correctAspect: useImpf ? 'impf' : 'pf',
        explain: useImpf
          ? `${targetVerb} (imperfective) fits because the sentence describes a habitual or ongoing action. ${rule.short}.`
          : `${targetVerb} (perfective) fits because the sentence describes a single completed event. ${rule.short}.`,
        rule,
        impfSentence,
        pfSentence,
        fullSentence: sentence,
      };
    }

    if (phase === 2) {
      // WHY? — identify which of the 6 rules applies to the given context
      const forImpf = (idx % 2 === 0);
      const sentence = forImpf ? impfSentence : pfSentence;
      const correct = rule;

      // Pick 2 distractor rules (different from the correct one)
      const distractors = ASPECT_RULES.filter(r => r.id !== rule.id);
      const d = sh([...distractors]).slice(0, 2);
      const opts = sh([correct, ...d]);

      return {
        type: 'why',
        prompt: `"${sentence}" — this uses the ${forImpf ? 'imperfective' : 'perfective'} because:`,
        hint: 'Read the sentence carefully. What does the context tell you about how the action happens?',
        opts: opts.map(r => ({ id: r.id, label: `${r.icon} ${r.short}` })),
        correct: correct.id,
        correctLabel: `${correct.icon} ${correct.short}`,
        correctAspect: forImpf ? 'impf' : 'pf',
        explain: `The key signal here is "${sentence.split(' ').slice(0,4).join(' ')}..." — ${rule.explanation}`,
        rule,
        sentence,
        impfSentence,
        pfSentence,
      };
    }

    if (phase === 3) {
      // MINIMAL PAIR — two sentences shown, user picks which describes a completed action
      return {
        type: 'compare',
        prompt: `Which sentence describes a COMPLETED, one-time action?`,
        hint: 'Look for signals: did it have a clear endpoint? Was it done once?',
        opts: sh([
          { label: impfSentence, aspect: 'impf' },
          { label: pfSentence,   aspect: 'pf'   },
        ]),
        correct: 'pf',
        correctAspect: 'pf',
        explain: `"${pfSentence}" is perfective — a single, bounded, completed event. "${impfSentence}" is imperfective — ongoing, habitual, or in-progress.`,
        rule,
        impfSentence,
        pfSentence,
      };
    }

    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, phase, idx]);

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const isCorrect = question.type === 'why'
      ? opt === question.correct
      : question.type === 'compare'
        ? opt === 'pf'
        : opt === question.correct;

    if (isCorrect) {
      setScore(s => s + 1);
      if (mistakeIds.has(item.en)) clearMistake(item.en);
    } else {
      recordMistake(item.en);
    }
  }

  function isAnswerCorrect() {
    if (!answered || selected === null) return false;
    if (question.type === 'why') return selected === question.correct;
    if (question.type === 'compare') return selected === 'pf';
    return selected === question.correct;
  }

  function handleNext() {
    const totalPhases = 4;
    if (phase < totalPhases - 1) {
      setPhase(p => p + 1);
      setAnswered(false);
      setSelected(null);
      setRevealRule(false);
    } else if (idx < items.length - 1) {
      setIdx(i => i + 1);
      setPhase(0);
      setAnswered(false);
      setSelected(null);
      setRevealRule(false);
    } else {
      setDone(true);
    }
  }

  // ── Level gate ───────────────────────────────────────────────────────────
  if (!aspectReady) {
    return (
      <div className="scr-wrap">
        <style>{ASPECT_KEYFRAMES}</style>
        {H('🔄 Verb Aspect Drill', 'Production Practice', goBack)}
        <div className="c" style={{ padding: '24px 20px', marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Available at B1</div>
          <p style={{ color: 'var(--subtext)', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
            Aspect <em>production</em> is a B1 target. At {userLevel}, focus on <strong>recognizing</strong> aspect
            pairs — you'll see them in the Verb Aspect lesson. Active drilling starts when you reach B1.
          </p>
          <p style={{ color: 'var(--subtext)', fontSize: 13, lineHeight: 1.55, margin: '0 0 20px', fontStyle: 'italic' }}>
            "Imperfective before perfective — recognition before production." — Novak Milić (2010)
          </p>
          <button className="b bg" onClick={goBack}>Go back</button>
        </div>
      </div>
    );
  }

  if (!allItems.length) return null;

  // ── Reference mode ───────────────────────────────────────────────────────
  if (sessionMode === 'reference') {
    return (
      <div className="scr-wrap">
        <style>{ASPECT_KEYFRAMES}</style>
        {H('📖 Aspect Rules', 'The 6 rules you must master', goBack)}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setSessionMode('drill')} className="b bp" style={{ flex: 1, fontSize: 12, padding: '8px 0' }}>
            ← Back to Drill
          </button>
        </div>
        <div style={{ marginBottom: 8, padding: '10px 14px', background: 'rgba(14,116,144,.08)', borderRadius: 10, fontSize: 12, color: 'var(--info,#0284c7)', fontWeight: 700, lineHeight: 1.5 }}>
          💡 The single hardest thing about Croatian for English speakers. Master these 6 rules — they explain 95% of aspect choices.
        </div>
        {ASPECT_RULES.map(rule => <RuleCard key={rule.id} rule={rule} highlight={false} />)}
        <button className="b bp" style={{ width: '100%', marginTop: 8 }} onClick={() => setSessionMode('drill')}>
          Drill these rules →
        </button>
      </div>
    );
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (done) {
    const total = items.length * 4; // 4 phases per item
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'Excellent!' : pct >= 75 ? 'Strong work!' : pct >= 60 ? 'Good effort!' : 'Keep drilling!';
    const emoji = pct >= 90 ? '🌟' : pct >= 75 ? '🎉' : pct >= 60 ? '💪' : '🔄';

    return (
      <div className="scr-wrap">
        <style>{ASPECT_KEYFRAMES}</style>
        {H('🔄 Verb Aspects')}
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: 64 }}>{emoji}</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: '#164e63', marginTop: 8 }}>
            {grade}
          </h2>
          <p style={{ color: 'var(--subtext)', marginTop: 8 }}>{score}/{total} points · {pct}%</p>
          {mistakeIds.size > 0 && (
            <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: 12, padding: '12px 16px', textAlign: 'left', marginTop: 20 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: '#dc2626', marginBottom: 6 }}>
                📌 {mistakeIds.size} pair{mistakeIds.size !== 1 ? 's' : ''} to review:
              </p>
              <p style={{ fontSize: 12, color: '#78716c', margin: 0 }}>
                {[...mistakeIds].join(' · ')}
              </p>
            </div>
          )}
          <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '16px 20px', textAlign: 'left', marginTop: 20 }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: '#92400e', marginBottom: 10 }}>🔑 The 6 rules in brief:</p>
            {ASPECT_RULES.map(r => (
              <div key={r.id} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{r.icon}</span>
                <span style={{ fontSize: 12, color: '#78350f', lineHeight: 1.45 }}><strong>{r.label}:</strong> {r.short}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button className="b bg" onClick={() => {
              setIdx(0); setPhase(0); setAnswered(false); setSelected(null); setScore(0); setDone(false); setRevealRule(false);
            }}>Retry</button>
            {mistakeIds.size > 0 && (
              <button className="b bg" style={{ background: '#fff1f2', borderColor: '#fca5a5', color: '#dc2626' }} onClick={() => {
                setMistakesOnly(true); setIdx(0); setPhase(0); setAnswered(false); setSelected(null); setScore(0); setDone(false);
              }}>Drill Mistakes</button>
            )}
            <button className="b bp" onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              award(score * 4 + 10);
              goBack();
            }}>Finish</button>
          </div>
        </div>
      </div>
    );
  }

  if (!question || !item) return null;
  const correct = isAnswerCorrect();
  const totalItems = items.length;

  return (
    <div className="scr-wrap">
      <style>{ASPECT_KEYFRAMES}</style>
      {H('🔄 Verb Aspect Drill')}

      {/* ── Top controls ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setSessionMode('reference')}
          style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1.5px solid var(--card-b)', background: 'var(--card)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--info,#0284c7)' }}
        >📖 6 Rules</button>
        <button
          onClick={() => setMistakesOnly(m => !m)}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: mistakesOnly ? '1.5px solid #dc2626' : '1.5px solid var(--card-b)',
            background: mistakesOnly ? '#fff1f2' : 'var(--card)',
            color: mistakesOnly ? '#dc2626' : 'var(--subtext)',
          }}
        >🎯 {mistakeIds.size > 0 ? `Mistakes (${mistakeIds.size})` : 'Mistakes only'}</button>
      </div>

      {/* ── Progress ── */}
      <Bar v={idx + 1} mx={totalItems} color="#d97706" h={5} />
      <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 700, textAlign: 'right', marginBottom: 8 }}>
        Pair {idx + 1}/{totalItems}
      </div>

      {/* ── Phase indicator ── */}
      <PhaseBar phase={phase} total={4} />

      <div className="c" style={{ padding: '18px 16px' }}>
        {/* ── Pair header (always visible) ── */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'center',
          padding: '10px 14px', background: 'var(--bar-bg)', borderRadius: 10,
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--info,#0284c7)' }}>{item.impf}</div>
            <div style={{ fontSize: 10, color: 'var(--info,#0284c7)', fontWeight: 700 }}>IMPERFECTIVE</div>
          </div>
          <div style={{ color: 'var(--subtext)', alignSelf: 'center', fontWeight: 700 }}>⟷</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--success,#16a34a)' }}>{item.pf}</div>
            <div style={{ fontSize: 10, color: 'var(--success,#16a34a)', fontWeight: 700 }}>PERFECTIVE</div>
          </div>
        </div>

        {/* ── Phase 0: Recognition ── */}
        {question.type === 'recognition' && (
          <div style={{ animation: 'slideIn .3s ease' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 6, lineHeight: 1.4 }}>
              {question.prompt}
            </p>
            {!answered && (
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 12, fontStyle: 'italic' }}>
                💡 {question.hint}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {question.opts.map((opt, i) => {
                let bg = 'var(--card)'; let border = '2px solid var(--card-b)'; let color = 'var(--heading)';
                if (answered) {
                  if (opt === question.correct) { bg = '#f0fdf4'; border = '2px solid #86efac'; color = '#166534'; }
                  else if (opt === selected) { bg = '#fff1f2'; border = '2px solid #fca5a5'; color = '#dc2626'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(opt)} style={{
                    flex: 1, padding: '14px 8px', borderRadius: 12, border, background: bg, color,
                    fontSize: 16, fontWeight: 900, cursor: answered ? 'default' : 'pointer',
                    transition: 'all .18s', fontFamily: 'inherit',
                    animation: answered && opt === question.correct ? 'correctPop .3s ease' : 'none',
                  }}>{opt}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Phase 1: Fill-in ── */}
        {question.type === 'fillin' && (
          <div style={{ animation: 'slideIn .3s ease' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 10 }}>
              {question.prompt}
            </p>
            <div style={{
              background: 'var(--bar-bg)', borderRadius: 10, padding: '12px 14px',
              marginBottom: 12, fontSize: 14, lineHeight: 1.7, color: 'var(--heading)',
            }}>
              {question.sentence}
            </div>
            {!answered && (
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 10, fontStyle: 'italic' }}>
                💡 {question.hint}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {question.opts.map((opt, i) => {
                let bg = 'var(--card)'; let border = '2px solid var(--card-b)'; let color = 'var(--heading)';
                if (answered) {
                  if (opt === question.correct) { bg = '#f0fdf4'; border = '2px solid #86efac'; color = '#166534'; }
                  else if (opt === selected) { bg = '#fff1f2'; border = '2px solid #fca5a5'; color = '#dc2626'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(opt)} style={{
                    flex: 1, padding: '14px 8px', borderRadius: 12, border, background: bg, color,
                    fontSize: 15, fontWeight: 900, cursor: answered ? 'default' : 'pointer',
                    transition: 'all .18s', fontFamily: 'inherit',
                  }}>{opt}</button>
                );
              })}
            </div>
            {answered && (
              <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic', marginBottom: 8 }}>
                Full sentence: <strong>{question.fullSentence}</strong>
              </div>
            )}
          </div>
        )}

        {/* ── Phase 2: WHY? ── */}
        {question.type === 'why' && (
          <div style={{ animation: 'slideIn .3s ease' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 10, lineHeight: 1.5 }}>
              {question.prompt}
            </p>
            {!answered && (
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 10, fontStyle: 'italic' }}>
                💡 {question.hint}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {question.opts.map((opt, i) => {
                let bg = 'var(--card)'; let border = '2px solid var(--card-b)'; let color = 'var(--heading)';
                if (answered) {
                  if (opt.id === question.correct) { bg = '#f0fdf4'; border = '2px solid #86efac'; color = '#166534'; }
                  else if (opt.id === selected) { bg = '#fff1f2'; border = '2px solid #fca5a5'; color = '#dc2626'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(opt.id)} style={{
                    padding: '11px 14px', borderRadius: 12, border, background: bg, color,
                    fontSize: 12, fontWeight: 700, cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left', transition: 'all .18s', fontFamily: 'inherit', lineHeight: 1.4,
                  }}>{opt.label}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Phase 3: Minimal pair compare ── */}
        {question.type === 'compare' && (
          <div style={{ animation: 'slideIn .3s ease' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 6 }}>
              {question.prompt}
            </p>
            {!answered && (
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 10, fontStyle: 'italic' }}>
                💡 {question.hint}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {question.opts.map((opt, i) => {
                let bg = 'var(--card)'; let border = '2px solid var(--card-b)'; let color = 'var(--heading)';
                if (answered) {
                  if (opt.aspect === 'pf') { bg = '#f0fdf4'; border = '2px solid #86efac'; color = '#166534'; }
                  else if (opt.aspect === selected) { bg = '#fff1f2'; border = '2px solid #fca5a5'; color = '#dc2626'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(opt.aspect)} style={{
                    padding: '14px 16px', borderRadius: 12, border, background: bg, color,
                    fontSize: 13, fontWeight: 700, cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left', transition: 'all .18s', fontFamily: 'inherit', lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}>
                    {opt.label}
                    {answered && opt.aspect === 'pf' && <span style={{ fontStyle: 'normal', fontWeight: 800, marginLeft: 6 }}>← perfective ✓</span>}
                    {answered && opt.aspect === 'impf' && <span style={{ fontStyle: 'normal', fontWeight: 700, marginLeft: 6, fontSize: 11 }}>← imperfective</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Answer feedback ── */}
        {answered && (
          <div style={{
            marginTop: 4, background: correct ? '#f0fdf4' : '#fff1f2',
            border: `1.5px solid ${correct ? '#86efac' : '#fca5a5'}`,
            borderRadius: 10, padding: '12px 14px',
            animation: 'slideIn .2s ease',
          }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: correct ? '#166534' : '#dc2626', margin: '0 0 6px' }}>
              {correct ? '✓ Correct!' : '✗ Not quite'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--subtext)', margin: 0, lineHeight: 1.55 }}>
              {question.explain}
            </p>
          </div>
        )}

        {/* ── Rule reveal ── */}
        {answered && (
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => setRevealRule(r => !r)}
              style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--info,#0284c7)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              {revealRule ? '▾ Hide rule' : '▸ Show full rule explanation'}
            </button>
            {revealRule && <RuleCard rule={question.rule} highlight={true} />}
          </div>
        )}

        {/* ── Aspect timeline (shown after answer) ── */}
        {answered && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
              Visualized
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <AspectTimeline aspect={question.correctAspect} dimmed={false} />
              <AspectTimeline aspect={question.correctAspect === 'pf' ? 'impf' : 'pf'} dimmed={true} />
            </div>
          </div>
        )}

        {/* ── Next button ── */}
        {answered && (
          <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={handleNext}>
            {phase < 3
              ? `Next phase (${['Pair','Fill-In','Why?','Compare'][phase + 1]}) →`
              : idx < items.length - 1
                ? 'Next pair →'
                : 'See results'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function guessRule(item) {
  const ctx = (item.ctx || '').toLowerCase();
  const rule = (item.rule || '').toLowerCase();

  if (ctx.includes('svaki') || ctx.includes('uvijek') || ctx.includes('često') || ctx.includes('svako') || rule.includes('habit')) return 'habitual';
  if (ctx.includes('dok') || ctx.includes('za vrijeme') || ctx.includes('istovremeno') || rule.includes('simultan')) return 'simultaneous';
  if (ctx.includes('nije') || ctx.includes('nisam') || ctx.includes('ne ') || rule.includes('negat')) return 'negation';
  if ((ctx.match(/,/g) || []).length >= 2 || rule.includes('sequence') || rule.includes('narrative')) return 'sequence';
  if (ctx.includes('sada') || ctx.includes('upravo') || rule.includes('ongoing') || rule.includes('progress')) return 'ongoing';
  return 'completed'; // default: single completed event
}

function gapSentence(sentence, target, _wrong) {
  // Try to find a conjugated form of the target verb stem in the sentence
  // and replace it with ___
  if (!sentence) return `___ (${target})`;
  const stem = target.length > 4 ? target.slice(0, 4) : target.slice(0, 3);
  const words = sentence.split(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/[.,!?]/g, '');
    if (w.toLowerCase().startsWith(stem.toLowerCase()) && w.length > stem.length) {
      words[i] = words[i].replace(w, '___');
      return words.join(' ');
    }
  }
  // Fallback: gap the second word (usually the verb)
  if (words.length >= 3) {
    words[2] = '___';
    return words.join(' ');
  }
  return `___ ${sentence}`;
}
