import { useState } from 'react';
import { markQuest } from '../../lib/quests.js';
import { QUIZ } from './ConstellationData.js';
import { ConstellationBackground } from './ConstellationPieces.jsx';
import ConstellationExploreMode from './ConstellationExploreMode.jsx';
import ConstellationQuizMode from './ConstellationQuizMode.jsx';
import ConstellationDoneMode from './ConstellationDoneMode.jsx';

export default function GrammarConstellation({ goBack, award }) {
  const [mode, setMode] = useState('explore');
  const [expandedCase, setExpandedCase] = useState(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [awardCalled, setAwardCalled] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  function toggleCase(id) {
    setExpandedCase(prev => (prev === id ? null : id));
  }

  function startQuiz() {
    setMode('quiz');
    setQuizIdx(0);
    setQuizScore(0);
    setSelected(null);
    setAnswered(false);
  }

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === QUIZ[quizIdx].answer) {
      setQuizScore(s => s + 1);
    }
  }

  function handleNext() {
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const fs = quizScore + (selected === QUIZ[quizIdx].answer ? 1 : 0);
      setFinalScore(fs);
      setMode('done');
      if (!awardCalled) {
        setAwardCalled(true);
        if (typeof award === 'function') award(fs * 10);
        markQuest('grammar');
      }
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0c1a2e 100%)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ConstellationBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 600,
          margin: '0 auto',
          padding: '16px 16px 80px',
        }}
      >
        {mode === 'explore' && (
          <ConstellationExploreMode
            goBack={goBack}
            expandedCase={expandedCase}
            onToggleCase={toggleCase}
            onStartQuiz={startQuiz}
          />
        )}

        {mode === 'quiz' && (
          <ConstellationQuizMode
            quizIdx={quizIdx}
            quizScore={quizScore}
            selected={selected}
            answered={answered}
            onBackToExplore={() => setMode('explore')}
            onAnswer={handleAnswer}
            onNext={handleNext}
          />
        )}

        {mode === 'done' && (
          <ConstellationDoneMode
            finalScore={finalScore}
            onReviewCases={() => setMode('explore')}
            goBack={goBack}
          />
        )}
      </div>
    </div>
  );
}
