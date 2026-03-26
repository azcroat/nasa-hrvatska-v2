import React, { useState } from 'react';
import { H, Bar } from '../../data.jsx';

// Render a progress bar row for a skill in the results screen
function SkillBar({ icon, label, score, rating }) {
  const pct = Math.round(score * 100);
  const filled = Math.round(score * 10);
  const empty = 10 - filled;
  const barColor = score >= 0.8 ? '#22c55e' : score >= 0.5 ? '#f59e0b' : '#ef4444';
  const ratingColor = score >= 0.8 ? '#16a34a' : score >= 0.5 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', width: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', gap: 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 8, borderRadius: 4,
            background: i < filled ? barColor : '#e5e7eb',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', width: 34, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: ratingColor, width: 72, flexShrink: 0 }}>{rating}</span>
    </div>
  );
}

function getRating(score) {
  if (score >= 0.85) return 'Excellent';
  if (score >= 0.6)  return 'Strong';
  if (score >= 0.4)  return 'Needs work';
  return 'Just starting';
}

export default function PlacementTest({ pq, pi, ps, pa, px, sPi, sPs, sPa, sPx, setScr, setSt }) {
  const [showResult, setShowResult] = useState(false);
  // Per-skill correct counts — tracked as we go
  // We use a ref-style approach: store in state updated on answer
  const [skillCorrect, setSkillCorrect] = useState({ vocab: 0, grammar: 0, culture: 0 });
  const [skillTotal, setSkillTotal]     = useState({ vocab: 0, grammar: 0, culture: 0 });

  if (!pq.length) return null;

  // Overall level based on total score
  const diff = ps >= Math.round(pq.length * 0.6) ? 'advanced'
             : ps >= Math.round(pq.length * 0.35) ? 'intermediate'
             : 'beginner';

  if (showResult) {
    const levelLabel = { beginner: 'A1–A2 Beginner', intermediate: 'B1 Intermediate', advanced: 'B2+ Advanced' };
    const levelIcon  = { beginner: '🌱', intermediate: '🌿', advanced: '🏆' };

    // Compute per-skill scores (guard against division by zero)
    const safeDiv = (a, b) => b === 0 ? 0 : a / b;
    const vocabScore   = safeDiv(skillCorrect.vocab,   skillTotal.vocab);
    const grammarScore = safeDiv(skillCorrect.grammar, skillTotal.grammar);
    const cultureScore = safeDiv(skillCorrect.culture, skillTotal.culture);

    // Determine weakest skill (only consider skills that were tested)
    const scores = [];
    if (skillTotal.vocab   > 0) scores.push({ skill: 'vocab',   score: vocabScore });
    if (skillTotal.grammar > 0) scores.push({ skill: 'grammar', score: grammarScore });
    if (skillTotal.culture > 0) scores.push({ skill: 'culture', score: cultureScore });
    scores.sort((a, b) => a.score - b.score);
    const weakest = scores.length > 0 ? scores[0].skill : 'vocab';

    const recommendations = {
      vocab:   'Start with vocabulary flashcards to build your word bank',
      grammar: 'Start with Grammar Intro to understand Croatian structure',
      culture: 'Explore the Croatia tab to build cultural knowledge',
    };

    // Determine start lesson based on level
    const lessonRec = diff === 'advanced'     ? 'Lesson 7 — Advanced Grammar'
                    : diff === 'intermediate'  ? 'Lesson 3 — Basic Conversations'
                    : 'Lesson 1 — Greetings & Basics';

    // Persist per-skill scores to localStorage
    localStorage.setItem('nh_placement_vocab',   String(Math.round(vocabScore * 100)));
    localStorage.setItem('nh_placement_grammar',  String(Math.round(grammarScore * 100)));
    localStorage.setItem('nh_placement_culture',  String(Math.round(cultureScore * 100)));

    return (
      <div className="scr-wrap">
        {H('📊 Your Results')}
        <div style={{ paddingTop: 16 }}>
          {/* Level badge */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 52 }}>{levelIcon[diff]}</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: '#164e63', margin: '8px 0 4px' }}>
              Your Croatian Level: {levelLabel[diff]}
            </h2>
            <p style={{ color: '#78716c', fontSize: 13 }}>{ps} / {pq.length} correct overall</p>
          </div>

          {/* Skill breakdown card */}
          <div style={{
            background: '#f0f9ff', border: '1.5px solid #bae6fd',
            borderRadius: 14, padding: '18px 16px', marginBottom: 16,
          }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: '#0369a1', marginBottom: 14 }}>
              Skill Breakdown
            </p>
            {skillTotal.vocab > 0 && (
              <SkillBar icon="📚" label="Vocabulary" score={vocabScore}   rating={getRating(vocabScore)} />
            )}
            {skillTotal.grammar > 0 && (
              <SkillBar icon="📝" label="Grammar"    score={grammarScore} rating={getRating(grammarScore)} />
            )}
            {skillTotal.culture > 0 && (
              <SkillBar icon="🌍" label="Culture"    score={cultureScore} rating={getRating(cultureScore)} />
            )}
            <p style={{ fontSize: 12, color: '#0e7490', fontWeight: 700, marginTop: 10, marginBottom: 0 }}>
              Recommended start: {lessonRec}
            </p>
          </div>

          {/* Personalized recommendation */}
          <div style={{
            background: '#fefce8', border: '1.5px solid #fde68a',
            borderRadius: 14, padding: '14px 16px', marginBottom: 20,
          }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 4 }}>
              💡 Personalized tip
            </p>
            <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5, margin: 0 }}>
              {recommendations[weakest]}
            </p>
          </div>

          <button
            className="b bp"
            style={{ width: '100%', marginTop: 4 }}
            onClick={() => {
              localStorage.setItem('nh_placement_done', 'true');
              setSt(s => ({ ...s, diff }));
              setScr('dashboard');
            }}>
            Start Learning →
          </button>
        </div>
      </div>
    );
  }

  // Question screen
  function handleAnswer(i) {
    if (pa) return;
    sPx(i);
    sPa(true);
    const correct = i === pq[pi].c;
    if (correct) sPs(s => s + 1);

    // Track per-skill score
    const skill = pq[pi].skill || 'vocab';
    setSkillTotal(t => ({ ...t, [skill]: (t[skill] || 0) + 1 }));
    if (correct) setSkillCorrect(t => ({ ...t, [skill]: (t[skill] || 0) + 1 }));
  }

  return (
    <div className="scr-wrap">
      {H('Question ' + (pi + 1) + ' of ' + pq.length)}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -8 }}>
        <button
          onClick={() => { localStorage.setItem('nh_placement_done', 'true'); setSt(s => ({ ...s, diff: 'beginner' })); setScr('dashboard'); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#94a3b8', padding: '4px 8px', fontFamily: "'Outfit',sans-serif" }}>
          Skip test
        </button>
      </div>
      <Bar v={pi + 1} mx={pq.length} h={6} />
      {pq[pi].skill && (
        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
          {{ vocab: '📚 Vocabulary', grammar: '📝 Grammar', culture: '🌍 Culture' }[pq[pi].skill] || ''}
        </div>
      )}
      <div className="c" style={{ marginTop: 12 }}>
        <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>{pq[pi].q}</p>
        {pq[pi].o.map((o, i) => (
          <button
            key={i}
            className={'ob ' + (pa ? (i === pq[pi].c ? 'ok' : px === i ? 'no' : '') : '')}
            onClick={() => handleAnswer(i)}>
            {o}
          </button>
        ))}
        {pa && (
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 20 }}
            onClick={() => {
              if (pi < pq.length - 1) { sPi(i => i + 1); sPa(false); sPx(-1); }
              else { setShowResult(true); }
            }}>
            {pi < pq.length - 1 ? 'Next →' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}
