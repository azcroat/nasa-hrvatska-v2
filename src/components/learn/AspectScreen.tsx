import React from 'react';
import { H, speak } from '../../data';
import { useGrammar } from '../../hooks/useGrammar';

interface AspectPair {
  impf: string;
  perf: string;
  en: string;
}

function LoadingState() {
  return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
}
function ErrorState({ message }: { message: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--info)' }}>{message}</div>;
}

interface Props {
  goBack: () => void;
}
function AspectScreen({ goBack }: Props) {
  const { grammar, loading, error } = useGrammar();
  const userLevel =
    typeof localStorage !== 'undefined' ? localStorage.getItem('nh_level') || 'A1' : 'A1';
  const isA1 = userLevel === 'A1';
  const isPreB1 = ['A1', 'A2'].includes(userLevel);

  if (error) return <ErrorState message="Couldn't load grammar - please retry." />;
  if (loading || !grammar) return <LoadingState />;
  const ASPECT = grammar.ASPECT as { pairs: AspectPair[] };

  return (
    <div className="scr-wrap">
      {H('🔄 Verb Aspect', 'Perfective vs Imperfective', goBack)}

      {/* Level-appropriate note */}
      {isPreB1 && (
        <div
          style={{
            background: '#fef9c3',
            border: '1px solid #fde047',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 13,
            color: '#713f12',
            lineHeight: 1.55,
          }}
        >
          {isA1
            ? "📖 At A1, just notice that verb pairs exist — you'll use them naturally later. No need to memorize yet."
            : "📖 At A2, learn to recognize these pairs. You'll start choosing between them actively at B1."}
        </div>
      )}

      {ASPECT.pairs.map(function (p, i) {
        return (
          <div key={i} className="c" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                aria-label={`Play imperfective: ${p.impf}`}
                style={{
                  fontWeight: 700,
                  color: '#dc2626',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  padding: 0,
                }}
                onClick={function () {
                  speak(p.impf);
                }}
              >
                {p.impf}
                <span aria-hidden="true">{' 🔊'}</span>
              </button>
              <button
                aria-label={`Play perfective: ${p.perf}`}
                style={{
                  fontWeight: 700,
                  color: '#16a34a',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  padding: 0,
                }}
                onClick={function () {
                  speak(p.perf);
                }}
              >
                {p.perf}
                <span aria-hidden="true">{' 🔊'}</span>
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#78716c' }}>{p.en}</div>
          </div>
        );
      })}
    </div>
  );
}

export default AspectScreen;
