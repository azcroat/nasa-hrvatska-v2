import React from 'react';
import { useApp } from '../../context/AppContext';
import { useListeningQuiz } from './listening/useListeningQuiz';
import ResultsView from './listening/ResultsView';
import QuestionView from './listening/QuestionView';
import SetSelectionView from './listening/SetSelectionView';
import LevelSelectionView from './listening/LevelSelectionView';

/**
 * Listening Comprehension — hear/read Croatian, choose the English meaning.
 * Decomposed (1b finish): all state lives in useListeningQuiz; this component is
 * a thin router that picks the view for the current quiz phase.
 */
export default function ListeningComprehensionScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  useApp();
  const quiz = useListeningQuiz(award);
  const { finished, shuffledQuestions, selectedSet, selectedLevel, levelData } = quiz;

  if (finished && shuffledQuestions) return <ResultsView quiz={quiz} />;
  if (selectedSet && shuffledQuestions) return <QuestionView quiz={quiz} />;
  if (selectedLevel && levelData) return <SetSelectionView quiz={quiz} />;
  return <LevelSelectionView quiz={quiz} goBack={goBack} />;
}
