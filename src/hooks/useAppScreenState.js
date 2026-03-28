import { useState } from "react";

// Screen-level state extracted from App.jsx to reduce god-component size.
// All original single-letter names are kept as aliases so existing call-sites
// in AppRouter.jsx continue to work without changes.
export function useAppScreenState() {
  // ── Lesson screen state ──
  const [lessonTopic, setLessonTopic] = useState(null);         // lt / sLt
  const [lessonItems, setLessonItems] = useState([]);           // li / sLi
  const [lessonIndex, setLessonIndex] = useState(0);            // lx / sLx
  const [lessonScore, setLessonScore] = useState(0);            // ls / sLs
  const [lessonPhase, setLessonPhase] = useState("learn");      // lp / sLp
  const [lessonAnswers, setLessonAnswers] = useState(false);    // la / sLa
  const [lessonSlide, setLessonSlide] = useState(-1);           // lsl / sLsl
  const [quizItems, setQuizItems] = useState([]);               // qi / sQi

  // ── Grammar screen state ──
  const [grammarLesson, setGrammarLesson] = useState(null);     // gl / sGl
  const [grammarIndex, setGrammarIndex] = useState(0);          // gx / sGx
  const [grammarPhase, setGrammarPhase] = useState("learn");    // gp / sGp
  const [grammarScore, setGrammarScore] = useState(0);          // gs / sGs
  const [grammarAnswers, setGrammarAnswers] = useState(false);  // ga / sGa
  const [grammarSlide, setGrammarSlide] = useState(-1);         // gsl / sGsl

  // ── Match game ──
  const [matchInitPool, setMatchInitPool] = useState([]);

  // ── Multiple choice game ──
  const [mcInitQ, setMcInitQ] = useState([]);
  const [mcResultQ, setMcResultQ] = useState([]);
  const [mcResultScore, setMcResultScore] = useState(0);
  const [mcMistakes, setMcMistakes] = useState([]);

  // ── Reading screen state ──
  const [readingPassage, setReadingPassage] = useState(null);   // rp / sRp
  const [readingPhase, setReadingPhase] = useState("read");     // rph / sRph
  const [readingQIndex, setReadingQIndex] = useState(0);        // rqi / sRqi
  const [readingScore, setReadingScore] = useState(0);          // rsc / sRsc
  const [readingAnswers, setReadingAnswers] = useState(false);  // ra / sRa
  const [readingSlide, setReadingSlide] = useState(-1);         // rsl / sRsl
  const [hwPassage, setHwPassage] = useState(null);             // hw / sHw

  // ── Speaking screen state ──
  const [speakWord, setSpeakWord] = useState(null);             // sw / sSw
  const [speakResult, setSpeakResult] = useState(null);         // sr / sSr
  const [speakIndex, setSpeakIndex] = useState(0);              // sx / sSx
  const [speakItems, setSpeakItems] = useState([]);             // si / sSi
  const [speakScore, setSpeakScore] = useState(0);              // ssc / sSsc

  // ── Animated lesson ──
  const [animLesson, setAnimLesson] = useState(null);

  // ── Flashcards / Listening init pools ──
  const [fcInitPool, setFcInitPool] = useState([]);
  const [lsInitQ, setLsInitQ] = useState([]);

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
