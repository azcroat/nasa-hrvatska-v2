import React from 'react';
import AspectTimeline from './AspectTimeline';
import AspectRuleCard from './AspectRuleCard';

export default function AspectQuestionPanel({
  item,
  question,
  answered,
  selected,
  correct,
  revealRule,
  phase,
  idx,
  items,
  onAnswer,
  onNext,
  onToggleRevealRule,
}) {
  return (
    <div className="c" style={{ padding: '18px 16px' }}>
      {/* ── Pair header (always visible) ── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          justifyContent: 'center',
          padding: '10px 14px',
          background: 'var(--bar-bg)',
          borderRadius: 10,
        }}
      >
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--info,#0284c7)' }}>
            {item.impf}
          </div>
          <div style={{ fontSize: 10, color: 'var(--info,#0284c7)', fontWeight: 700 }}>
            IMPERFECTIVE
          </div>
        </div>
        <div style={{ color: 'var(--subtext)', alignSelf: 'center', fontWeight: 700 }}>⟷</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--success,#16a34a)' }}>
            {item.pf}
          </div>
          <div style={{ fontSize: 10, color: 'var(--success,#16a34a)', fontWeight: 700 }}>
            PERFECTIVE
          </div>
        </div>
      </div>

      {/* ── Phase 0: Recognition ── */}
      {question.type === 'recognition' && (
        <div style={{ animation: 'slideIn .3s ease' }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--heading)',
              marginBottom: 6,
              lineHeight: 1.4,
            }}
          >
            {question.prompt}
          </p>
          {!answered && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtext)',
                marginBottom: 12,
                fontStyle: 'italic',
              }}
            >
              💡 {question.hint}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {question.opts.map((opt, i) => {
              let bg = 'var(--card)';
              let border = '2px solid var(--card-b)';
              let color = 'var(--heading)';
              if (answered) {
                if (opt === question.correct) {
                  bg = '#f0fdf4';
                  border = '2px solid #86efac';
                  color = '#166534';
                } else if (opt === selected) {
                  bg = '#fff1f2';
                  border = '2px solid #fca5a5';
                  color = '#dc2626';
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(opt)}
                  style={{
                    flex: 1,
                    padding: '14px 8px',
                    borderRadius: 12,
                    border,
                    background: bg,
                    color,
                    fontSize: 16,
                    fontWeight: 900,
                    cursor: answered ? 'default' : 'pointer',
                    transition: 'all .18s',
                    fontFamily: 'inherit',
                    animation:
                      answered && opt === question.correct ? 'correctPop .3s ease' : 'none',
                  }}
                >
                  {opt}
                </button>
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
          <div
            style={{
              background: 'var(--bar-bg)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 12,
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--heading)',
            }}
          >
            {question.sentence}
          </div>
          {!answered && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtext)',
                marginBottom: 10,
                fontStyle: 'italic',
              }}
            >
              💡 {question.hint}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {question.opts.map((opt, i) => {
              let bg = 'var(--card)';
              let border = '2px solid var(--card-b)';
              let color = 'var(--heading)';
              if (answered) {
                if (opt === question.correct) {
                  bg = '#f0fdf4';
                  border = '2px solid #86efac';
                  color = '#166534';
                } else if (opt === selected) {
                  bg = '#fff1f2';
                  border = '2px solid #fca5a5';
                  color = '#dc2626';
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(opt)}
                  style={{
                    flex: 1,
                    padding: '14px 8px',
                    borderRadius: 12,
                    border,
                    background: bg,
                    color,
                    fontSize: 15,
                    fontWeight: 900,
                    cursor: answered ? 'default' : 'pointer',
                    transition: 'all .18s',
                    fontFamily: 'inherit',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {answered && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--subtext)',
                fontStyle: 'italic',
                marginBottom: 8,
              }}
            >
              Full sentence: <strong>{question.fullSentence}</strong>
            </div>
          )}
        </div>
      )}

      {/* ── Phase 2: WHY? ── */}
      {question.type === 'why' && (
        <div style={{ animation: 'slideIn .3s ease' }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--heading)',
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            {question.prompt}
          </p>
          {!answered && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtext)',
                marginBottom: 10,
                fontStyle: 'italic',
              }}
            >
              💡 {question.hint}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {question.opts.map((opt, i) => {
              let bg = 'var(--card)';
              let border = '2px solid var(--card-b)';
              let color = 'var(--heading)';
              if (answered) {
                if (opt.id === question.correct) {
                  bg = '#f0fdf4';
                  border = '2px solid #86efac';
                  color = '#166534';
                } else if (opt.id === selected) {
                  bg = '#fff1f2';
                  border = '2px solid #fca5a5';
                  color = '#dc2626';
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(opt.id)}
                  style={{
                    padding: '11px 14px',
                    borderRadius: 12,
                    border,
                    background: bg,
                    color,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left',
                    transition: 'all .18s',
                    fontFamily: 'inherit',
                    lineHeight: 1.4,
                  }}
                >
                  {opt.label}
                </button>
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
            <div
              style={{
                fontSize: 11,
                color: 'var(--subtext)',
                marginBottom: 10,
                fontStyle: 'italic',
              }}
            >
              💡 {question.hint}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {question.opts.map((opt, i) => {
              let bg = 'var(--card)';
              let border = '2px solid var(--card-b)';
              let color = 'var(--heading)';
              if (answered) {
                if (opt.aspect === 'pf') {
                  bg = '#f0fdf4';
                  border = '2px solid #86efac';
                  color = '#166534';
                } else if (opt.aspect === selected) {
                  bg = '#fff1f2';
                  border = '2px solid #fca5a5';
                  color = '#dc2626';
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => onAnswer(opt.aspect)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    border,
                    background: bg,
                    color,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left',
                    transition: 'all .18s',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  {opt.label}
                  {answered && opt.aspect === 'pf' && (
                    <span style={{ fontStyle: 'normal', fontWeight: 800, marginLeft: 6 }}>
                      ← perfective ✓
                    </span>
                  )}
                  {answered && opt.aspect === 'impf' && (
                    <span
                      style={{ fontStyle: 'normal', fontWeight: 700, marginLeft: 6, fontSize: 11 }}
                    >
                      ← imperfective
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Answer feedback ── */}
      {answered && (
        <div
          style={{
            marginTop: 4,
            background: correct ? '#f0fdf4' : '#fff1f2',
            border: `1.5px solid ${correct ? '#86efac' : '#fca5a5'}`,
            borderRadius: 10,
            padding: '12px 14px',
            animation: 'slideIn .2s ease',
          }}
        >
          <p
            style={{
              fontWeight: 800,
              fontSize: 13,
              color: correct ? '#166534' : '#dc2626',
              margin: '0 0 6px',
            }}
          >
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
            onClick={onToggleRevealRule}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              color: 'var(--info,#0284c7)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {revealRule ? '▾ Hide rule' : '▸ Show full rule explanation'}
          </button>
          {revealRule && <AspectRuleCard rule={question.rule} highlight={true} />}
        </div>
      )}

      {/* ── Aspect timeline (shown after answer) ── */}
      {answered && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              marginBottom: 6,
            }}
          >
            Visualized
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <AspectTimeline aspect={question.correctAspect} dimmed={false} />
            <AspectTimeline
              aspect={question.correctAspect === 'pf' ? 'impf' : 'pf'}
              dimmed={true}
            />
          </div>
        </div>
      )}

      {/* ── Next button ── */}
      {answered && (
        <button className="b bp" style={{ width: '100%', marginTop: 16 }} onClick={onNext}>
          {phase < 3
            ? `Next phase (${['Pair', 'Fill-In', 'Why?', 'Compare'][phase + 1]}) →`
            : idx < items.length - 1
              ? 'Next pair →'
              : 'See results'}
        </button>
      )}
    </div>
  );
}
