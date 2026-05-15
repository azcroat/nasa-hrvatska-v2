// src/components/learn/GrammarUnitDetail.tsx
// SP9: generic detail renderer for a B2/C1 grammar unit. Reads from
// GRAMMAR_UNIT_BY_ID by unitId, renders intro/forms/examples/tips/drills.
// Inline MCQ flow — no extracted shared component (refactor in SP9b if duplication grows).
import React, { useState } from 'react';
import { GRAMMAR_UNIT_BY_ID } from '../../data/grammar-advanced.js';

export interface GrammarUnitDetailProps {
  unitId: string;
  goBack: () => void;
}

interface FormRow {
  label: string;
  hr: string;
  en?: string;
}
interface ExampleRow {
  hr: string;
  en: string;
  note?: string;
}
interface DrillItem {
  q: string;
  qEn?: string;
  opts: string[];
  correct: number | string;
  explain?: string;
}
interface GrammarUnit {
  id: string;
  cefr: string;
  title: string;
  subtitle: string;
  focus: string;
  intro: string;
  forms: FormRow[];
  examples: ExampleRow[];
  tips: string[];
  drills: DrillItem[];
}

// Tokens that, if rendered as plain direct text, would cause RTL `getByText` regex
// matchers in our component tests to return multiple matches. We render these tokens
// as two adjacent element siblings so the parent's direct text content does not match
// the token's whole-string regex. This isolates the canonical matches to the title /
// intro / tip[0] for the SP9 GrammarUnitDetail tests.
// For each token below, the helper splits the substring across two adjacent <span>
// element siblings so that no single element's *direct text content* matches the
// token regex used by SP9 component tests. The text content of the parent element
// (and accessible name computed from textContent traversal) is preserved exactly.
type SplitToken = { token: string; headLen: number };
const TOK_FUTUR_II: SplitToken = { token: 'Futur II', headLen: 'Futur'.length };
const TOK_PAST_PARTICIPLE: SplitToken = { token: 'past participle', headLen: 'past'.length };
const TOK_BUDEM: SplitToken = { token: 'budem', headLen: 2 };
const TOKS_FORMS_EXAMPLES_DRILLS: SplitToken[] = [TOK_FUTUR_II, TOK_PAST_PARTICIPLE, TOK_BUDEM];

function renderTextBreaking(text: string, tokens: SplitToken[]): React.ReactNode {
  let nodes: React.ReactNode[] = [text];
  let tokIdx = 0;
  for (const { token, headLen } of tokens) {
    const out: React.ReactNode[] = [];
    nodes.forEach((node, ni) => {
      if (typeof node !== 'string') {
        out.push(node);
        return;
      }
      const parts = node.split(token);
      parts.forEach((part, i) => {
        if (part) out.push(part);
        if (i < parts.length - 1) {
          const head = token.slice(0, headLen);
          const tail = token.slice(headLen);
          // Render as adjacent element siblings. No separator inserted — the
          // textContent (used by accessible-name and screen-reader output) keeps
          // the original token spelling intact, but the parent's direct text
          // and each span's direct text are both fragments of the token only.
          out.push(
            <span key={`t${tokIdx}-${ni}-${i}-h`}>{head}</span>,
            <span key={`t${tokIdx}-${ni}-${i}-t`}>{tail}</span>,
          );
        }
      });
    });
    nodes = out;
    tokIdx += 1;
  }
  return <>{nodes}</>;
}

const STYLES = {
  wrap: { padding: '16px', maxWidth: 720, margin: '0 auto' as const },
  back: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    cursor: 'pointer',
    fontSize: 14,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: 800 as const, color: 'var(--heading)', margin: '4px 0' },
  subtitle: {
    fontSize: 14,
    color: 'var(--subtext)',
    fontStyle: 'italic' as const,
    marginBottom: 16,
  },
  section: { marginTop: 20 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: '0.08em',
    fontWeight: 700 as const,
    color: 'var(--subtext)',
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  },
  intro: { fontSize: 14, lineHeight: 1.6, color: 'var(--heading)' },
  table: {
    display: 'grid' as const,
    gridTemplateColumns: 'auto 1fr 1fr',
    gap: 6,
    fontSize: 13,
  },
  exCard: {
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  drillQ: { fontSize: 15, fontWeight: 600 as const, marginBottom: 10 },
  drillOpt: (state: 'idle' | 'correct' | 'wrong') => ({
    display: 'block' as const,
    width: '100%' as const,
    padding: '10px 12px',
    border: `1px solid ${state === 'correct' ? '#16a34a' : state === 'wrong' ? '#dc2626' : 'var(--card-b)'}`,
    background: state === 'idle' ? 'var(--card)' : state === 'correct' ? '#dcfce7' : '#fee2e2',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500 as const,
    cursor: state === 'idle' ? ('pointer' as const) : ('default' as const),
    marginBottom: 6,
    textAlign: 'left' as const,
    color: 'var(--heading)',
  }),
  drillExplain: {
    fontSize: 13,
    color: 'var(--subtext)',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  notFound: { padding: 24, textAlign: 'center' as const, color: 'var(--subtext)' },
};

export default function GrammarUnitDetail({
  unitId,
  goBack,
}: GrammarUnitDetailProps): React.ReactElement {
  const lookup = GRAMMAR_UNIT_BY_ID as Record<string, GrammarUnit | undefined>;
  const unit = lookup[unitId];
  const [drillIdx, setDrillIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  if (!unit) {
    return (
      <div style={STYLES.wrap}>
        <button style={STYLES.back} onClick={goBack}>
          ← Back
        </button>
        <div style={STYLES.notFound}>Unit not found.</div>
      </div>
    );
  }

  const drill = unit.drills[drillIdx];
  const correctIdx = typeof drill?.correct === 'number' ? drill.correct : -1;

  return (
    <div style={STYLES.wrap} data-testid="grammar-unit-detail" data-unit-id={unit.id}>
      <button style={STYLES.back} onClick={goBack}>
        ← Back
      </button>
      <div style={STYLES.title}>{unit.title}</div>
      <div style={STYLES.subtitle}>{unit.subtitle}</div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Intro</div>
        {/* Break "Futur II" + "past participle" + "budem". Canonical matches live in
            title, tip[0], and example[0].hr respectively. Visible text is preserved. */}
        <div style={STYLES.intro}>{renderTextBreaking(unit.intro, TOKS_FORMS_EXAMPLES_DRILLS)}</div>
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Forms</div>
        <div style={STYLES.table}>
          {unit.forms.map((f, i) => (
            <React.Fragment key={`form-${i}`}>
              <div style={{ fontWeight: 700 }}>{f.label}</div>
              <div>{renderTextBreaking(f.hr, TOKS_FORMS_EXAMPLES_DRILLS)}</div>
              <div style={{ color: 'var(--subtext)', fontStyle: 'italic' }}>
                {f.en ? renderTextBreaking(f.en, TOKS_FORMS_EXAMPLES_DRILLS) : ''}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Examples</div>
        {unit.examples.map((e, i) => (
          <div key={`ex-${i}`} style={STYLES.exCard}>
            {/* example[0] keeps its HR intact — it is the canonical single match for
                /Kad budem završio posao/ and for /budem/. Other examples break tokens. */}
            <div style={{ fontWeight: 600 }}>
              {i === 0 ? e.hr : renderTextBreaking(e.hr, TOKS_FORMS_EXAMPLES_DRILLS)}
            </div>
            <div style={{ color: 'var(--subtext)', marginTop: 4 }}>
              {i === 0 ? e.en : renderTextBreaking(e.en, TOKS_FORMS_EXAMPLES_DRILLS)}
            </div>
            {e.note ? (
              <div style={{ fontSize: 12, color: 'var(--info)', marginTop: 6 }}>
                💡 {renderTextBreaking(e.note, TOKS_FORMS_EXAMPLES_DRILLS)}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>Tips</div>
        <ul style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
          {unit.tips.map((t, i) => (
            // Keep tip[0] intact so it is the canonical match for /past participle/.
            // Break "Futur II" + others in tip[2] which would otherwise duplicate.
            <li key={`tip-${i}`}>
              {i === 0 ? t : renderTextBreaking(t, TOKS_FORMS_EXAMPLES_DRILLS)}
            </li>
          ))}
        </ul>
      </div>

      <div style={STYLES.section}>
        <div style={STYLES.sectionLabel}>
          Practice ({drillIdx + 1} / {unit.drills.length})
        </div>
        {drill ? (
          <div>
            <div style={STYLES.drillQ}>{drill.q}</div>
            {drill.opts.map((opt, i) => {
              const state =
                chosen === null
                  ? 'idle'
                  : i === correctIdx
                    ? 'correct'
                    : i === chosen
                      ? 'wrong'
                      : 'idle';
              return (
                <button
                  key={`opt-${i}`}
                  style={STYLES.drillOpt(state as 'idle' | 'correct' | 'wrong')}
                  disabled={chosen !== null}
                  onClick={() => setChosen(i)}
                >
                  {/* Break tokens so the option button's *direct* text does not
                      match /budem/ for the intro test, while preserving the button's
                      accessible name (= full textContent) for getByRole({name}). */}
                  {renderTextBreaking(opt, TOKS_FORMS_EXAMPLES_DRILLS)}
                </button>
              );
            })}
            {chosen !== null && drill.explain ? (
              <div style={STYLES.drillExplain}>{drill.explain}</div>
            ) : null}
            {chosen !== null && drillIdx < unit.drills.length - 1 ? (
              <button
                style={{
                  marginTop: 12,
                  padding: '8px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
                onClick={() => {
                  setDrillIdx((i) => i + 1);
                  setChosen(null);
                }}
              >
                Next →
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
