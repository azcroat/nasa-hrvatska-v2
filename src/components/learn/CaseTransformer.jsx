import React, { useState, useMemo } from 'react';
import { NOUN_LIBRARY, CASE_INFO, declineNoun } from './CaseTransformerData.js';
import CaseTransformerPicker from './CaseTransformerPicker.jsx';
import CaseTransformerDeclension from './CaseTransformerDeclension.jsx';
import CaseTransformerQuiz from './CaseTransformerQuiz.jsx';

export default function CaseTransformer({ goBack, award }) {
  const [phase, setPhase]       = useState("picker");   // "picker" | "declension" | "quiz"
  const [selectedNoun, setSelectedNoun] = useState(null);
  const [number, setNumber]     = useState("sg");       // "sg" | "pl"
  const [search, setSearch]     = useState("");
  const [genderFilter, setGenderFilter] = useState("all");

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex]         = useState(0);
  const [quizScore, setQuizScore]         = useState(0);
  const [quizChosen, setQuizChosen]       = useState(null);
  const [quizDone, setQuizDone]           = useState(false);
  const [xpAwarded, setXpAwarded]         = useState(false);

  // Filtered noun list
  const filteredNouns = useMemo(() => {
    const q = search.toLowerCase().trim();
    return NOUN_LIBRARY.filter(n => {
      const matchGender = genderFilter === "all" || n.gender === genderFilter;
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
  function pickNoun(noun) {
    setSelectedNoun(noun);
    setNumber("sg");
    setPhase("declension");
  }

  function backToPicker() {
    setPhase("picker");
    setSelectedNoun(null);
  }

  // ── Quiz builder ─────────────────────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz() {
    const forms = declineNoun(selectedNoun);
    const questions = CASE_INFO.map((c, i) => {
      const correct = forms.sg[i].replace("!", "");
      const others = forms.sg
        .filter((_, j) => j !== i)
        .map(f => f.replace("!", ""))
        .filter(f => f !== correct);
      const uniqueOthers = [...new Set(others)];
      while (uniqueOthers.length < 3) uniqueOthers.push(selectedNoun.hr);
      const distractors = uniqueOthers.slice(0, 3);
      const opts = shuffle([correct, ...distractors]);
      return { caseInfo: c, correct, opts, example: c.example.replace("[WORD]", "___") };
    });
    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizChosen(null);
    setQuizDone(false);
    setXpAwarded(false);
    setPhase("quiz");
  }

  function chooseAnswer(opt) {
    if (quizChosen !== null) return;
    const q = quizQuestions[quizIndex];
    setQuizChosen(opt);
    if (opt === q.correct) setQuizScore(s => s + 1);
  }

  function nextQuestion() {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(i => i + 1);
      setQuizChosen(null);
    } else {
      setQuizDone(true);
      if (!xpAwarded && award) {
        award(10);
        setXpAwarded(true);
      }
    }
  }

  // ── Phase routing ─────────────────────────────────────────────────────────────
  if (phase === "picker") {
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

  if (phase === "quiz") {
    return (
      <CaseTransformerQuiz
        selectedNoun={selectedNoun}
        quizQuestions={quizQuestions}
        quizIndex={quizIndex}
        quizScore={quizScore}
        quizChosen={quizChosen}
        quizDone={quizDone}
        xpAwarded={xpAwarded}
        onBackToDeclension={() => setPhase("declension")}
        onChooseAnswer={chooseAnswer}
        onNextQuestion={nextQuestion}
        onStartQuiz={startQuiz}
      />
    );
  }

  // Declension view
  return (
    <CaseTransformerDeclension
      selectedNoun={selectedNoun}
      declined={declined}
      number={number}
      setNumber={setNumber}
      onBackToPicker={backToPicker}
      onStartQuiz={startQuiz}
    />
  );
}
