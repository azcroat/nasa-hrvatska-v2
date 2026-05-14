import React, { useState, useMemo, useRef } from 'react';
import { H, Bar, sh, ASPECT_PAIRS } from '../../data';
import AspectPhaseBar from './AspectPhaseBar';
import AspectRuleCard from './AspectRuleCard';
import AspectQuestionPanel from './AspectQuestionPanel';
import { useStats } from '../../context/StatsContext.tsx';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';

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
    explanation:
      'When an action happens regularly, routinely, or repeatedly — always imperfective. Key markers: svaki dan, uvijek, često, redovito, ponekad.',
    example: { hr: 'Svaki dan pišem pismo.', en: 'Every day I write a letter. (habit → impf)' },
    counterex: {
      hr: 'Napisao sam pismo.',
      en: 'I wrote the letter. (single completed event → pf)',
    },
  },
  {
    id: 'completed',
    label: 'Single Completed Event',
    icon: '✓',
    short: 'One-time completed action → perfective',
    explanation:
      'When a single, bounded event happened and is done — perfective. The action has a clear endpoint reached. Key markers: jednom, odmah, napokon, iznenada.',
    example: {
      hr: 'Napokon sam napisao pismo.',
      en: 'I finally wrote the letter. (done, endpoint reached → pf)',
    },
    counterex: {
      hr: 'Pisao sam pismo.',
      en: 'I was writing a letter. (process, no endpoint → impf)',
    },
  },
  {
    id: 'ongoing',
    label: 'Ongoing / In-Progress',
    icon: '⏳',
    short: 'Present tense = always imperfective',
    explanation:
      'Croatian present tense is inherently imperfective — you cannot use perfective verbs in present to describe current action. Perfective present has future meaning only.',
    example: {
      hr: 'Pišem ti poruku sada.',
      en: 'I am writing you a message now. (impf — only option)',
    },
    counterex: {
      hr: 'Napišem ti poruku sutra.',
      en: 'I will write you a message tomorrow. (pf present = future)',
    },
  },
  {
    id: 'negation',
    label: 'Negation',
    icon: '🚫',
    short: 'Negation → usually imperfective',
    explanation:
      'Negated actions typically use imperfective because completion is denied — the action is presented as not having occurred (or as an unachieved process). Exceptions exist with completed past.',
    example: {
      hr: 'Nisam pisao pismo.',
      en: 'I was not writing a letter. / I did not write a letter. (usual)',
    },
    counterex: {
      hr: 'Nisam napisao pismo.',
      en: 'I did not finish writing the letter. (specific: failure to complete)',
    },
  },
  {
    id: 'sequence',
    label: 'Narrative Sequence',
    icon: '📖',
    short: 'Sequential narrative events → perfective',
    explanation:
      'A chain of actions that move the story forward — each completed before the next begins. Perfective gives the narrative its momentum. Think: "first X happened, then Y, then Z."',
    example: {
      hr: 'Ustao sam, popio kavu i otišao.',
      en: 'I got up, drank coffee and left. (chain → pf pf pf)',
    },
    counterex: {
      hr: 'Ustajao sam, pio kavu i odlazio.',
      en: 'I would get up, drink coffee and leave. (habitual → impf impf impf)',
    },
  },
  {
    id: 'simultaneous',
    label: 'Simultaneous / While',
    icon: '⚡',
    short: 'Parallel / background actions → imperfective',
    explanation:
      'Actions happening at the same time, or a background action during which something else occurs — imperfective. Key markers: dok (while), za vrijeme (during), istovremeno (simultaneously).',
    example: {
      hr: 'Dok sam pisao, zvonio je telefon.',
      en: 'While I was writing, the phone rang. (background → impf)',
    },
    counterex: {
      hr: 'Napisao sam pismo dok je ona spavala.',
      en: 'I wrote (completed) the letter while she slept. (completed within window → pf)',
    },
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function guessRule(item: any) {
  const ctx = (item.ctx || '').toLowerCase();
  const rule = (item.rule || '').toLowerCase();
  if (
    ctx.includes('svaki') ||
    ctx.includes('uvijek') ||
    ctx.includes('često') ||
    ctx.includes('svako') ||
    rule.includes('habit')
  )
    return 'habitual';
  if (
    ctx.includes('dok') ||
    ctx.includes('za vrijeme') ||
    ctx.includes('istovremeno') ||
    rule.includes('simultan')
  )
    return 'simultaneous';
  if (
    ctx.includes('nije') ||
    ctx.includes('nisam') ||
    ctx.includes('ne ') ||
    rule.includes('negat')
  )
    return 'negation';
  if (
    (ctx.match(/,/g) || []).length >= 2 ||
    rule.includes('sequence') ||
    rule.includes('narrative')
  )
    return 'sequence';
  if (
    ctx.includes('sada') ||
    ctx.includes('upravo') ||
    rule.includes('ongoing') ||
    rule.includes('progress')
  )
    return 'ongoing';
  return 'completed';
}

function gapSentence(sentence: string, target: string, _wrong: string) {
  if (!sentence) return `___ (${target})`;
  const stem = target.length > 4 ? target.slice(0, 4) : target.slice(0, 3);
  const words = sentence.split(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i]!.replace(/[.,!?]/g, '');
    if (w.toLowerCase().startsWith(stem.toLowerCase()) && w.length > stem.length) {
      words[i] = words[i]!.replace(w, '___');
      return words.join(' ');
    }
  }
  if (words.length >= 3) {
    words[2] = '___';
    return words.join(' ');
  }
  return `___ ${sentence}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AspectPair = any;

export default function AspectDrillScreen({
  goBack,
  award,
  _testPairs,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
  /** Injected in tests only — overrides the imported ASPECT_PAIRS constant. */
  _testPairs?: AspectPair[];
}) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);

  const [sessionMode, setSessionMode] = useState('drill');

  const [mistakeIds, setMistakeIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('nh_aspect_mistakes') || '[]');
      return new Set(stored);
    } catch {
      return new Set();
    }
  });
  const [mistakesOnly, setMistakesOnly] = useState(false);

  function recordMistake(en: string) {
    setMistakeIds((prev) => {
      const next = new Set(prev);
      next.add(en);
      localStorage.setItem('nh_aspect_mistakes', JSON.stringify([...next]));
      return next;
    });
  }
  function clearMistake(en: string) {
    setMistakeIds((prev) => {
      const next = new Set(prev);
      next.delete(en);
      localStorage.setItem('nh_aspect_mistakes', JSON.stringify([...next]));
      return next;
    });
  }

  const sourcePairs = _testPairs ?? ASPECT_PAIRS;

  const allItems = useMemo(() => {
    if (!sourcePairs?.length) return [];
    return sh([...sourcePairs]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_testPairs]);

  const items = useMemo(() => {
    if (mistakesOnly && mistakeIds.size > 0) {
      const filtered = allItems.filter((item) => mistakeIds.has(item.en));
      return filtered.length ? filtered : allItems;
    }
    return allItems;
  }, [allItems, mistakesOnly, mistakeIds]);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [revealRule, setRevealRule] = useState(false);

  const item = items[idx] || null;

  const question = useMemo(() => {
    if (!item) return null;

    const ruleId = item.rule
      ? ASPECT_RULES.find(
          (r) =>
            item.rule.toLowerCase().includes(r.id) ||
            item.rule.toLowerCase().includes(r.label.toLowerCase().split(' ')[0]),
        )?.id || guessRule(item)
      : guessRule(item);

    const rule = ASPECT_RULES.find((r) => r.id === ruleId) || ASPECT_RULES[0]!;

    const ctxParts = (item.ctx || '').split('/').map((s: string) => s.trim());
    const impfSentence = ctxParts[0] || `${item.impf} — ongoing or habitual`;
    const pfSentence = ctxParts[1] || `${item.pf} — completed, done`;

    if (phase === 0) {
      const askImpf = idx % 2 === 0;
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
      const useImpf = (idx + 1) % 2 === 0;
      const sentence = useImpf ? impfSentence : pfSentence;
      const targetVerb = useImpf ? item.impf : item.pf;
      const wrongVerb = useImpf ? item.pf : item.impf;
      const gapped = gapSentence(sentence, targetVerb, wrongVerb);
      return {
        type: 'fillin',
        prompt: `Choose the correct form to complete the sentence:`,
        sentence: gapped,
        hint: useImpf
          ? 'Look for time/frequency clues suggesting ongoing or habitual action'
          : 'Look for clues suggesting a single, completed event',
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
      const forImpf = idx % 2 === 0;
      const sentence = forImpf ? impfSentence : pfSentence;
      const correct = rule;
      const distractors = ASPECT_RULES.filter((r) => r.id !== rule.id);
      const d = sh([...distractors]).slice(0, 2);
      const opts = sh([correct, ...d]);
      return {
        type: 'why',
        prompt: `"${sentence}" — this uses the ${forImpf ? 'imperfective' : 'perfective'} because:`,
        hint: 'Read the sentence carefully. What does the context tell you about how the action happens?',
        opts: opts.map((r) => ({ id: r.id, label: `${r.icon} ${r.short}` })),
        correct: correct.id,
        correctLabel: `${correct.icon} ${correct.short}`,
        correctAspect: forImpf ? 'impf' : 'pf',
        explain: `The key signal here is "${sentence.split(' ').slice(0, 4).join(' ')}..." — ${rule.explanation}`,
        rule,
        sentence,
        impfSentence,
        pfSentence,
      };
    }

    if (phase === 3) {
      return {
        type: 'compare',
        prompt: `Which sentence describes a COMPLETED, one-time action?`,
        hint: 'Look for signals: did it have a clear endpoint? Was it done once?',
        opts: sh([
          { label: impfSentence, aspect: 'impf' },
          { label: pfSentence, aspect: 'pf' },
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
  }, [item, phase, idx]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleAnswer(opt: any) {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const currentQuestion = question;
    const currentItem = item;
    if (!currentQuestion || !currentItem) return;
    const isCorrect =
      currentQuestion.type === 'why'
        ? opt === currentQuestion.correct
        : currentQuestion.type === 'compare'
          ? opt === 'pf'
          : opt === currentQuestion.correct;
    recordTopicResult('aspect', isCorrect);
    if (isCorrect) {
      setScore((s) => s + 1);
      if (mistakeIds.has(currentItem.en)) clearMistake(currentItem.en);
    } else {
      recordMistake(currentItem.en);
    }
  }

  function isAnswerCorrect() {
    if (!answered || selected === null || !question) return false;
    if (question.type === 'why') return selected === question.correct;
    if (question.type === 'compare') return selected === 'pf';
    return selected === question.correct;
  }

  function handleNext() {
    const totalPhases = 4;
    if (phase < totalPhases - 1) {
      setPhase((p) => p + 1);
      setAnswered(false);
      setSelected(null);
      setRevealRule(false);
    } else if (idx < items.length - 1) {
      setIdx((i) => i + 1);
      setPhase(0);
      setAnswered(false);
      setSelected(null);
      setRevealRule(false);
    } else {
      setDone(true);
    }
  }

  if (!allItems.length) return null;

  // ── Reference mode ───────────────────────────────────────────────────────
  if (sessionMode === 'reference') {
    return (
      <div className="scr-wrap">
        <style>{ASPECT_KEYFRAMES}</style>
        {H('📖 Aspect Rules', 'The 6 rules you must master', goBack)}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setSessionMode('drill')}
            className="b bp"
            style={{ flex: 1, fontSize: 12, padding: '8px 0' }}
          >
            ← Back to Drill
          </button>
        </div>
        <div
          style={{
            marginBottom: 8,
            padding: '10px 14px',
            background: 'rgba(14,116,144,.08)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--info,#0284c7)',
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          💡 The single hardest thing about Croatian for English speakers. Master these 6 rules —
          they explain 95% of aspect choices.
        </div>
        {ASPECT_RULES.map((rule) => (
          <AspectRuleCard key={rule.id} rule={rule} highlight={false} />
        ))}
        <button
          className="b bp"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => setSessionMode('drill')}
        >
          Drill these rules →
        </button>
      </div>
    );
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (done) {
    const total = items.length * 4;
    const pct = Math.round((score / total) * 100);
    const grade =
      pct >= 90
        ? 'Excellent!'
        : pct >= 75
          ? 'Strong work!'
          : pct >= 60
            ? 'Good effort!'
            : 'Keep drilling!';
    const emoji = pct >= 90 ? '🌟' : pct >= 75 ? '🎉' : pct >= 60 ? '💪' : '🔄';
    return (
      <div className="scr-wrap">
        <style>{ASPECT_KEYFRAMES}</style>
        {H('🔄 Verb Aspects', 'Perfective vs imperfective', goBack)}
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: 64 }}>{emoji}</div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 28,
              color: '#164e63',
              marginTop: 8,
            }}
          >
            {grade}
          </h2>
          <p style={{ color: 'var(--subtext)', marginTop: 8 }}>
            {score}/{total} points · {pct}%
          </p>
          {mistakeIds.size > 0 && (
            <div
              style={{
                background: '#fff1f2',
                border: '1.5px solid #fecdd3',
                borderRadius: 12,
                padding: '12px 16px',
                textAlign: 'left',
                marginTop: 20,
              }}
            >
              <p style={{ fontWeight: 800, fontSize: 13, color: '#dc2626', marginBottom: 6 }}>
                📌 {mistakeIds.size} pair{mistakeIds.size !== 1 ? 's' : ''} to review:
              </p>
              <p style={{ fontSize: 12, color: '#78716c', margin: 0 }}>
                {[...mistakeIds].join(' · ')}
              </p>
            </div>
          )}
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: 14,
              padding: '16px 20px',
              textAlign: 'left',
              marginTop: 20,
            }}
          >
            <p style={{ fontWeight: 800, fontSize: 13, color: '#92400e', marginBottom: 10 }}>
              🔑 The 6 rules in brief:
            </p>
            {ASPECT_RULES.map((r) => (
              <div
                key={r.id}
                style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{r.icon}</span>
                <span style={{ fontSize: 12, color: '#78350f', lineHeight: 1.45 }}>
                  <strong>{r.label}:</strong> {r.short}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
            <button
              className="b bg"
              onClick={() => {
                setIdx(0);
                setPhase(0);
                setAnswered(false);
                setSelected(null);
                setScore(0);
                setDone(false);
                setRevealRule(false);
              }}
            >
              Retry
            </button>
            {mistakeIds.size > 0 && (
              <button
                className="b bg"
                style={{ background: '#fff1f2', borderColor: '#fca5a5', color: '#dc2626' }}
                onClick={() => {
                  setMistakesOnly(true);
                  setIdx(0);
                  setPhase(0);
                  setAnswered(false);
                  setSelected(null);
                  setScore(0);
                  setDone(false);
                }}
              >
                Drill Mistakes
              </button>
            )}
            <button
              className="b bp"
              onClick={() => {
                if (finishFired.current) return;
                finishFired.current = true;
                if (typeof award === 'function') award(score * 4 + 10, false, 'grammar');
                markQuest('grammar');
                // Grant gc credit so LearnPath ck(gc>=5) passes (replaces the 20s dwell timer)
                if (!stats.vs?.includes('aspect')) {
                  setStats((prev) => {
                    if (prev.vs?.includes('aspect')) return prev;
                    return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'aspect'] };
                  });
                  if (writeDelta) writeDelta({ gc: 1, vs: ['aspect'] });
                }
                goBack();
              }}
            >
              Finish
            </button>
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
      {H('🔄 Verb Aspect Drill', 'Perfective vs imperfective', goBack)}

      {/* ── Top controls ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setSessionMode('reference')}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: 8,
            border: '1.5px solid var(--card-b)',
            background: 'var(--card)',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            color: 'var(--info,#0284c7)',
          }}
        >
          📖 6 Rules
        </button>
        <button
          onClick={() => setMistakesOnly((m) => !m)}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            border: mistakesOnly ? '1.5px solid #dc2626' : '1.5px solid var(--card-b)',
            background: mistakesOnly ? '#fff1f2' : 'var(--card)',
            color: mistakesOnly ? '#dc2626' : 'var(--subtext)',
          }}
        >
          🎯 {mistakeIds.size > 0 ? `Mistakes (${mistakeIds.size})` : 'Mistakes only'}
        </button>
      </div>

      {/* ── Progress ── */}
      <Bar v={idx + 1} mx={totalItems} color="#d97706" h={5} />
      <div
        style={{
          fontSize: 11,
          color: 'var(--subtext)',
          fontWeight: 700,
          textAlign: 'right',
          marginBottom: 8,
        }}
      >
        Pair {idx + 1}/{totalItems}
      </div>

      {/* ── Phase indicator ── */}
      <AspectPhaseBar phase={phase} total={4} />

      <AspectQuestionPanel
        item={item}
        question={question}
        answered={answered}
        selected={selected}
        correct={correct}
        revealRule={revealRule}
        phase={phase}
        idx={idx}
        items={items}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onToggleRevealRule={() => setRevealRule((r) => !r)}
      />
    </div>
  );
}
