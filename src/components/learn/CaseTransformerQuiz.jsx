import React from 'react';
import { CT_STYLES } from './CaseTransformerData.js';

export default function CaseTransformerQuiz({
  selectedNoun,
  quizQuestions,
  quizIndex,
  quizScore,
  quizChosen,
  quizDone,
  xpAwarded,
  onBackToDeclension,
  onChooseAnswer,
  onNextQuestion,
  onStartQuiz,
}) {
  if (quizDone) {
    return (
      <div className="scr-wrap">
        <div className="c" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{
            fontSize: "var(--text-xl)",
            fontWeight: 800,
            color: "var(--heading)",
            fontFamily: "'Playfair Display', serif",
            marginBottom: 8,
          }}>
            Quiz Complete!
          </div>
          <div style={{ fontSize: "var(--text-base)", color: "var(--subtext)", marginBottom: 20 }}>
            You got {quizScore} / {quizQuestions.length} correct
          </div>
          {xpAwarded && (
            <div style={{
              display: "inline-block",
              background: "#fef9c3",
              color: "#854d0e",
              padding: "6px 16px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: "var(--text-base)",
              marginBottom: 24,
            }}>
              +10 XP earned!
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="b bp" onClick={onBackToDeclension}>
              ← Back to {selectedNoun.hr}
            </button>
            <button className="b bg" onClick={onStartQuiz}>
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = quizQuestions[quizIndex];
  const ci = q.caseInfo;

  return (
    <div className="scr-wrap">
      <style>{CT_STYLES}</style>

      {/* Quiz header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBackToDeclension}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 700, color: "var(--subtext)",
            fontFamily: "'Outfit', sans-serif", padding: "4px 0",
          }}
        >
          ← Back
        </button>
        <div style={{ flex: 1, fontSize: "var(--text-base)", fontWeight: 700, color: "var(--heading)", fontFamily: "'Outfit', sans-serif" }}>
          🎯 Quiz — {selectedNoun.hr}
        </div>
        <span className="ct-badge" style={{ background: "#f3e8ff", color: "#6b21a8" }}>
          {quizIndex + 1} / {quizQuestions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "var(--bar-bg)", borderRadius: 99, marginBottom: 24 }}>
        <div style={{
          height: 6,
          borderRadius: 99,
          background: ci.color,
          width: `${((quizIndex) / quizQuestions.length) * 100}%`,
          transition: "width .3s ease",
        }} />
      </div>

      {/* Case label */}
      <div className="c" style={{ borderLeft: `4px solid ${ci.color}`, marginBottom: 16, background: ci.bg }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
          <span className="ct-badge" style={{ background: ci.color, color: "#fff" }}>{ci.abbr}</span>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: ci.color, fontFamily: "'Outfit', sans-serif" }}>{ci.name}</span>
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontFamily: "'Outfit', sans-serif" }}>{ci.question}</div>
      </div>

      {/* Question */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>
          {ci.use}
        </div>
        <div style={{
          fontSize: 18,
          fontStyle: "italic",
          color: "var(--heading)",
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600,
          marginBottom: 4,
        }}>
          "{q.example}"
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontFamily: "'Outfit', sans-serif" }}>
          Pick the correct <strong>{ci.name}</strong> form of <em>{selectedNoun.hr}</em>:
        </div>
      </div>

      {/* Answer options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {q.opts.map(opt => {
          let bg = "var(--card)";
          let border = "var(--card-b)";
          let color = "var(--heading)";
          if (quizChosen !== null) {
            if (opt === q.correct) { bg = "#dcfce7"; border = "#16a34a"; color = "#166534"; }
            else if (opt === quizChosen && opt !== q.correct) { bg = "#fee2e2"; border = "#ef4444"; color = "#991b1b"; }
          }
          return (
            <button
              key={opt}
              onClick={() => onChooseAnswer(opt)}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: `2px solid ${border}`,
                background: bg,
                color,
                fontSize: "var(--text-base)",
                fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
                cursor: quizChosen !== null ? "default" : "pointer",
                transition: "background .2s, border-color .2s",
                textAlign: "left",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {quizChosen !== null && (
        <div style={{ textAlign: "center" }}>
          <div style={{
            marginBottom: 14,
            fontSize: "var(--text-base)",
            fontWeight: 700,
            color: quizChosen === q.correct ? "#166534" : "#991b1b",
            fontFamily: "'Outfit', sans-serif",
          }}>
            {quizChosen === q.correct ? "✓ Correct!" : `✗ Correct answer: ${q.correct}`}
          </div>
          <button className="b bp" onClick={onNextQuestion}>
            {quizIndex < quizQuestions.length - 1 ? "Next →" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}
