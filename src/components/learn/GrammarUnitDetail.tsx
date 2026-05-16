// src/components/learn/GrammarUnitDetail.tsx
// SP9: generic detail renderer for a B2/C1 grammar unit. SP11: data now
// loaded asynchronously via contentClient.getGrammarUnit(unitId).
// Renders intro/forms/examples/tips/drills. Inline MCQ flow — no extracted
// shared component (refactor in SP9b if duplication grows).
import React, { useEffect, useState } from 'react';
import { getGrammarUnit } from '../../lib/contentClient';

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
  const [unit, setUnit] = useState<GrammarUnit | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  const [drillIdx, setDrillIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setUnit(null);
    setDrillIdx(0);
    setChosen(null);
    (async () => {
      try {
        const u = (await getGrammarUnit(unitId)) as unknown as GrammarUnit;
        if (cancelled) return;
        setUnit(u);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        const name = (e as Error)?.name ?? '';
        if (name === 'ContentNotFoundError') {
          setStatus('not-found');
        } else {
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [unitId]);

  if (status === 'loading') {
    return (
      <div style={STYLES.wrap} data-testid="grammar-unit-detail-loading">
        <button style={STYLES.back} onClick={goBack}>
          ← Back
        </button>
        <div style={STYLES.notFound}>Loading unit…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={STYLES.wrap} data-testid="grammar-unit-detail-error">
        <button style={STYLES.back} onClick={goBack}>
          ← Back
        </button>
        <div style={STYLES.notFound}>Couldn't load unit. Check connection and retry.</div>
      </div>
    );
  }

  if (status === 'not-found' || !unit) {
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
      <h1 data-testid="unit-title" style={STYLES.title}>
        {unit.title}
      </h1>
      <div data-testid="unit-subtitle" style={STYLES.subtitle}>
        {unit.subtitle}
      </div>

      <div style={STYLES.section} data-testid="unit-intro-section">
        <div style={STYLES.sectionLabel}>Intro</div>
        <div style={STYLES.intro}>{unit.intro}</div>
      </div>

      <div style={STYLES.section} data-testid="unit-forms-section">
        <div style={STYLES.sectionLabel}>Forms</div>
        <div style={STYLES.table}>
          {unit.forms.map((f, i) => (
            <React.Fragment key={`form-${i}`}>
              <div style={{ fontWeight: 700 }}>{f.label}</div>
              <div>{f.hr}</div>
              <div style={{ color: 'var(--subtext)', fontStyle: 'italic' }}>{f.en ?? ''}</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={STYLES.section} data-testid="unit-examples-section">
        <div style={STYLES.sectionLabel}>Examples</div>
        {unit.examples.map((e, i) => (
          <div key={`ex-${i}`} style={STYLES.exCard}>
            <div style={{ fontWeight: 600 }}>{e.hr}</div>
            <div style={{ color: 'var(--subtext)', marginTop: 4 }}>{e.en}</div>
            {e.note ? (
              <div style={{ fontSize: 12, color: 'var(--info)', marginTop: 6 }}>💡 {e.note}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={STYLES.section} data-testid="unit-tips-section">
        <div style={STYLES.sectionLabel}>Tips</div>
        <ul style={{ paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
          {unit.tips.map((t, i) => (
            <li key={`tip-${i}`}>{t}</li>
          ))}
        </ul>
      </div>

      <div style={STYLES.section} data-testid="unit-drills-section">
        <div style={STYLES.sectionLabel}>
          Practice ({drillIdx + 1} / {unit.drills.length})
        </div>
        {drill ? (
          <div>
            <div data-testid="drill-question" style={STYLES.drillQ}>
              {drill.q}
            </div>
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
                  {opt}
                </button>
              );
            })}
            {chosen !== null && drill.explain ? (
              <div data-testid="drill-explain" style={STYLES.drillExplain}>
                {drill.explain}
              </div>
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
