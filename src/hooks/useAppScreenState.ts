import { useState } from "react";

// Screen-level state extracted from App.jsx to reduce god-component size.
// All original single-letter names are kept as aliases so existing call-sites
// in AppRouter.jsx continue to work without changes.

export interface AppScreenState {
  // Lesson — short aliases
  lt: unknown; sLt: React.Dispatch<React.SetStateAction<unknown>>;
  li: unknown[]; sLi: React.Dispatch<React.SetStateAction<unknown[]>>;
  lx: number; sLx: React.Dispatch<React.SetStateAction<number>>;
  ls: number; sLs: React.Dispatch<React.SetStateAction<number>>;
  lp: string; sLp: React.Dispatch<React.SetStateAction<string>>;
  la: boolean; sLa: React.Dispatch<React.SetStateAction<boolean>>;
  lsl: number; sLsl: React.Dispatch<React.SetStateAction<number>>;
  qi: unknown[]; sQi: React.Dispatch<React.SetStateAction<unknown[]>>;
  // Readable names
  lessonTopic: unknown; setLessonTopic: React.Dispatch<React.SetStateAction<unknown>>;
  lessonItems: unknown[]; setLessonItems: React.Dispatch<React.SetStateAction<unknown[]>>;
  lessonIndex: number; setLessonIndex: React.Dispatch<React.SetStateAction<number>>;
  lessonScore: number; setLessonScore: React.Dispatch<React.SetStateAction<number>>;
  lessonPhase: string; setLessonPhase: React.Dispatch<React.SetStateAction<string>>;
  lessonAnswers: boolean; setLessonAnswers: React.Dispatch<React.SetStateAction<boolean>>;
  lessonSlide: number; setLessonSlide: React.Dispatch<React.SetStateAction<number>>;
  quizItems: unknown[]; setQuizItems: React.Dispatch<React.SetStateAction<unknown[]>>;
  // Grammar — short aliases
  gl: unknown; sGl: React.Dispatch<React.SetStateAction<unknown>>;
  gx: number; sGx: React.Dispatch<React.SetStateAction<number>>;
  gp: string; sGp: React.Dispatch<React.SetStateAction<string>>;
  gs: number; sGs: React.Dispatch<React.SetStateAction<number>>;
  ga: boolean; sGa: React.Dispatch<React.SetStateAction<boolean>>;
  gsl: number; sGsl: React.Dispatch<React.SetStateAction<number>>;
  grammarLesson: unknown; setGrammarLesson: React.Dispatch<React.SetStateAction<unknown>>;
  grammarIndex: number; setGrammarIndex: React.Dispatch<React.SetStateAction<number>>;
  grammarPhase: string; setGrammarPhase: React.Dispatch<React.SetStateAction<string>>;
  grammarScore: number; setGrammarScore: React.Dispatch<React.SetStateAction<number>>;
  grammarAnswers: boolean; setGrammarAnswers: React.Dispatch<React.SetStateAction<boolean>>;
  grammarSlide: number; setGrammarSlide: React.Dispatch<React.SetStateAction<number>>;
  // Match
  matchInitPool: unknown[]; setMatchInitPool: React.Dispatch<React.SetStateAction<unknown[]>>;
  // MC game
  mcInitQ: unknown[]; setMcInitQ: React.Dispatch<React.SetStateAction<unknown[]>>;
  mcResultQ: unknown[]; setMcResultQ: React.Dispatch<React.SetStateAction<unknown[]>>;
  mcResultScore: number; setMcResultScore: React.Dispatch<React.SetStateAction<number>>;
  mcMistakes: unknown[]; setMcMistakes: React.Dispatch<React.SetStateAction<unknown[]>>;
  // Reading — short aliases
  rp: unknown; sRp: React.Dispatch<React.SetStateAction<unknown>>;
  rph: string; sRph: React.Dispatch<React.SetStateAction<string>>;
  rqi: number; sRqi: React.Dispatch<React.SetStateAction<number>>;
  rsc: number; sRsc: React.Dispatch<React.SetStateAction<number>>;
  ra: boolean; sRa: React.Dispatch<React.SetStateAction<boolean>>;
  rsl: number; sRsl: React.Dispatch<React.SetStateAction<number>>;
  hw: unknown; sHw: React.Dispatch<React.SetStateAction<unknown>>;
  readingPassage: unknown; setReadingPassage: React.Dispatch<React.SetStateAction<unknown>>;
  readingPhase: string; setReadingPhase: React.Dispatch<React.SetStateAction<string>>;
  readingQIndex: number; setReadingQIndex: React.Dispatch<React.SetStateAction<number>>;
  readingScore: number; setReadingScore: React.Dispatch<React.SetStateAction<number>>;
  readingAnswers: boolean; setReadingAnswers: React.Dispatch<React.SetStateAction<boolean>>;
  readingSlide: number; setReadingSlide: React.Dispatch<React.SetStateAction<number>>;
  hwPassage: unknown; setHwPassage: React.Dispatch<React.SetStateAction<unknown>>;
  // Speaking — short aliases
  sw: unknown; sSw: React.Dispatch<React.SetStateAction<unknown>>;
  sr: unknown; sSr: React.Dispatch<React.SetStateAction<unknown>>;
  sx: number; sSx: React.Dispatch<React.SetStateAction<number>>;
  si: unknown[]; sSi: React.Dispatch<React.SetStateAction<unknown[]>>;
  ssc: number; sSsc: React.Dispatch<React.SetStateAction<number>>;
  speakWord: unknown; setSpeakWord: React.Dispatch<React.SetStateAction<unknown>>;
  speakResult: unknown; setSpeakResult: React.Dispatch<React.SetStateAction<unknown>>;
  speakIndex: number; setSpeakIndex: React.Dispatch<React.SetStateAction<number>>;
  speakItems: unknown[]; setSpeakItems: React.Dispatch<React.SetStateAction<unknown[]>>;
  speakScore: number; setSpeakScore: React.Dispatch<React.SetStateAction<number>>;
  // Animated lesson
  animLesson: unknown; setAnimLesson: React.Dispatch<React.SetStateAction<unknown>>;
  // Flashcards + listening
  fcInitPool: unknown[]; setFcInitPool: React.Dispatch<React.SetStateAction<unknown[]>>;
  lsInitQ: unknown[]; setLsInitQ: React.Dispatch<React.SetStateAction<unknown[]>>;
  // Exercise tracking
  curEx: string; sCurEx: React.Dispatch<React.SetStateAction<string>>;
}

export function useAppScreenState(): AppScreenState {
  // ── Lesson screen state ──
  const [lessonTopic, setLessonTopic] = useState<unknown>(null);
  const [lessonItems, setLessonItems] = useState<unknown[]>([]);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonScore, setLessonScore] = useState(0);
  const [lessonPhase, setLessonPhase] = useState("learn");
  const [lessonAnswers, setLessonAnswers] = useState(false);
  const [lessonSlide, setLessonSlide] = useState(-1);
  const [quizItems, setQuizItems] = useState<unknown[]>([]);

  // ── Grammar screen state ──
  const [grammarLesson, setGrammarLesson] = useState<unknown>(null);
  const [grammarIndex, setGrammarIndex] = useState(0);
  const [grammarPhase, setGrammarPhase] = useState("learn");
  const [grammarScore, setGrammarScore] = useState(0);
  const [grammarAnswers, setGrammarAnswers] = useState(false);
  const [grammarSlide, setGrammarSlide] = useState(-1);

  // ── Match game ──
  const [matchInitPool, setMatchInitPool] = useState<unknown[]>([]);

  // ── Multiple choice game ──
  const [mcInitQ, setMcInitQ] = useState<unknown[]>([]);
  const [mcResultQ, setMcResultQ] = useState<unknown[]>([]);
  const [mcResultScore, setMcResultScore] = useState(0);
  const [mcMistakes, setMcMistakes] = useState<unknown[]>([]);

  // ── Reading screen state ──
  const [readingPassage, setReadingPassage] = useState<unknown>(null);
  const [readingPhase, setReadingPhase] = useState("read");
  const [readingQIndex, setReadingQIndex] = useState(0);
  const [readingScore, setReadingScore] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState(false);
  const [readingSlide, setReadingSlide] = useState(-1);
  const [hwPassage, setHwPassage] = useState<unknown>(null);

  // ── Speaking screen state ──
  const [speakWord, setSpeakWord] = useState<unknown>(null);
  const [speakResult, setSpeakResult] = useState<unknown>(null);
  const [speakIndex, setSpeakIndex] = useState(0);
  const [speakItems, setSpeakItems] = useState<unknown[]>([]);
  const [speakScore, setSpeakScore] = useState(0);

  // ── Animated lesson ──
  const [animLesson, setAnimLesson] = useState<unknown>(null);

  // ── Flashcards / Listening init pools ──
  const [fcInitPool, setFcInitPool] = useState<unknown[]>([]);
  const [lsInitQ, setLsInitQ] = useState<unknown[]>([]);

  // ── Current exercise ID (used by XP cooldown) ──
  const [curEx, sCurEx] = useState("");

  return {
    // Lesson — short aliases for existing call-sites
    lt: lessonTopic,   sLt: setLessonTopic,
    li: lessonItems,   sLi: setLessonItems,
    lx: lessonIndex,   sLx: setLessonIndex,
    ls: lessonScore,   sLs: setLessonScore,
    lp: lessonPhase,   sLp: setLessonPhase,
    la: lessonAnswers, sLa: setLessonAnswers,
    lsl: lessonSlide,  sLsl: setLessonSlide,
    qi: quizItems,     sQi: setQuizItems,
    // Readable names also exported for future refactors
    lessonTopic, setLessonTopic,
    lessonItems, setLessonItems,
    lessonIndex, setLessonIndex,
    lessonScore, setLessonScore,
    lessonPhase, setLessonPhase,
    lessonAnswers, setLessonAnswers,
    lessonSlide, setLessonSlide,
    quizItems, setQuizItems,

    // Grammar — short aliases
    gl: grammarLesson,   sGl: setGrammarLesson,
    gx: grammarIndex,    sGx: setGrammarIndex,
    gp: grammarPhase,    sGp: setGrammarPhase,
    gs: grammarScore,    sGs: setGrammarScore,
    ga: grammarAnswers,  sGa: setGrammarAnswers,
    gsl: grammarSlide,   sGsl: setGrammarSlide,
    grammarLesson, setGrammarLesson,
    grammarIndex, setGrammarIndex,
    grammarPhase, setGrammarPhase,
    grammarScore, setGrammarScore,
    grammarAnswers, setGrammarAnswers,
    grammarSlide, setGrammarSlide,

    // Match
    matchInitPool, setMatchInitPool,

    // MC game
    mcInitQ, setMcInitQ,
    mcResultQ, setMcResultQ,
    mcResultScore, setMcResultScore,
    mcMistakes, setMcMistakes,

    // Reading — short aliases
    rp: readingPassage,  sRp: setReadingPassage,
    rph: readingPhase,   sRph: setReadingPhase,
    rqi: readingQIndex,  sRqi: setReadingQIndex,
    rsc: readingScore,   sRsc: setReadingScore,
    ra: readingAnswers,  sRa: setReadingAnswers,
    rsl: readingSlide,   sRsl: setReadingSlide,
    hw: hwPassage,       sHw: setHwPassage,
    readingPassage, setReadingPassage,
    readingPhase, setReadingPhase,
    readingQIndex, setReadingQIndex,
    readingScore, setReadingScore,
    readingAnswers, setReadingAnswers,
    readingSlide, setReadingSlide,
    hwPassage, setHwPassage,

    // Speaking — short aliases
    sw: speakWord,    sSw: setSpeakWord,
    sr: speakResult,  sSr: setSpeakResult,
    sx: speakIndex,   sSx: setSpeakIndex,
    si: speakItems,   sSi: setSpeakItems,
    ssc: speakScore,  sSsc: setSpeakScore,
    speakWord, setSpeakWord,
    speakResult, setSpeakResult,
    speakIndex, setSpeakIndex,
    speakItems, setSpeakItems,
    speakScore, setSpeakScore,

    // Animated lesson
    animLesson, setAnimLesson,

    // Flashcards + listening
    fcInitPool, setFcInitPool,
    lsInitQ, setLsInitQ,

    // Exercise tracking
    curEx, sCurEx,
  };
}
