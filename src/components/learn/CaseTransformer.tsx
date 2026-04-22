import React, { useState, useMemo, useRef } from 'react';
import { NOUN_LIBRARY, CASE_INFO, declineNoun } from './CaseTransformerData.js';
import { markQuest } from '../../lib/quests.js';
import CaseTransformerPicker from './CaseTransformerPicker';
import CaseTransformerDeclension from './CaseTransformerDeclension';
import CaseTransformerQuiz from './CaseTransformerQuiz';

interface Noun {
  hr: string;
  en: string;
  gender: string;
  type?: string;
  irregular?: boolean;
}
interface DeclinedForms {
  sg: string[];
  pl: string[];
}
interface QuizQuestion {
  caseInfo: (typeof CASE_INFO)[number];
  correct: string;
  opts: string[];
  example: string;
}
interface Props {
  goBack: () => void;
  award?: (xp: number) => void;
}

export default function CaseTransformer({ goBack, award }: Props) {
  const [phase, setPhase] = useState('picker'); // "picker" | "declension" | "quiz"
  const [selectedNoun, setSelectedNoun] = useState<Noun | null>(null);
  const [number, setNumber] = useState('sg'); // "sg" | "pl"
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizChosen, setQuizChosen] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const xpAwardedRef = useRef(false); // synchronous guard against double-award

  // Filtered noun list
  const filteredNouns = useMemo(() => {
    const q = search.toLowerCase().trim();
    return NOUN_LIBRARY.filter((n) => {
      const matchGender = genderFilter === 'all' || n.gender === genderFilter;
      const matchSearch = !q || n.hr.toLowerCase().includes(q) || n.en.toLowerCase().includes(q);
      return matchGender && matchSearch;
    });
  }, [search, genderFilter]);

  // Declined forms for selected noun
  const declined = useMemo(() => {
    if (!selectedNoun) return null;
    return declineNoun(selectedNoun);
  }, [selectedNoun]);

  // ── Noun picker ──────────────────────────────────────────────────────────────
  function pickNoun(noun: Noun) {
    setSelectedNoun(noun);
    setNumber('sg');
    setPhase('declension');
  }

  function backToPicker() {
    setPhase('picker');
    setSelectedNoun(null);
  }

  // ── Quiz builder ─────────────────────────────────────────────────────────────
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]] as [T, T];
    }
    return a;
  }

  function startQuiz() {
    if (!selectedNoun) return;
    const forms = declineNoun(selectedNoun) as DeclinedForms;
    const questions: QuizQuestion[] = CASE_INFO.map((c, i) => {
      const correct = (forms.sg[i] ?? '').replace('!', '');
      const others = forms.sg
        .filter((_: string, j: number) => j !== i)
        .map((f: string) => f.replace('!', ''))
        .filter((f: string) => f !== correct);
      const uniqueOthers: string[] = [...new Set<string>(others)];
      while (uniqueOthers.length < 3) uniqueOthers.push(selectedNoun.hr);
      const distractors = uniqueOthers.slice(0, 3);
      const opts = shuffle([correct, ...distractors]);
      return { caseInfo: c, correct, opts, example: c.example.replace('[WORD]', '___') };
    });
    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizChosen(null);
    setQuizDone(false);
    setXpAwarded(false);
    xpAwardedRef.current = false;
    setPhase('quiz');
  }

  function chooseAnswer(opt: string) {
    if (quizChosen !== null) return;
    const q = quizQuestions[quizIndex];
    if (!q) return;
    setQuizChosen(opt);
    if (opt === q.correct) setQuizScore((s) => s + 1);
  }

  function nextQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((i) => i + 1);
      setQuizChosen(null);
    } else {
      setQuizDone(true);
      if (!xpAwardedRef.current && typeof award === 'function') {
        xpAwardedRef.current = true;
        setXpAwarded(true);
        markQuest('grammar');
        award(10);
      }
    }
  }

  // ── Phase routing ─────────────────────────────────────────────────────────────
  if (phase === 'picker') {
    return (
      <CaseTransformerPicker
        goBack={goBack}
        filteredNouns={filteredNouns}
        search={search}
        setSearch={setSearch}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
        onPickNoun={pickNoun}
      />
    );
  }

  if (phase === 'quiz') {
    return (
      <CaseTransformerQuiz
        selectedNoun={selectedNoun}
        quizQuestions={quizQuestions}
        quizIndex={quizIndex}
        quizScore={quizScore}
        quizChosen={quizChosen}
        quizDone={quizDone}
        xpAwarded={xpAwarded}
        onBackToDeclension={() => setPhase('declension')}
        onChooseAnswer={chooseAnswer}
        onNextQuestion={nextQuestion}
        onStartQuiz={startQuiz}
      />
    );
  }

  // Declension view — selectedNoun is always set when phase === 'declension'
  if (!selectedNoun || !declined) return null;
  return (
    <CaseTransformerDeclension
      selectedNoun={selectedNoun}
      declined={declined as { sg: string[]; pl: string[]; [key: string]: string[] }}
      number={number}
      setNumber={setNumber}
      onBackToPicker={backToPicker}
      onStartQuiz={startQuiz}
    />
  );
}
