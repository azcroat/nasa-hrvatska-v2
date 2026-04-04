import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, speak } from '../../data.jsx';
import { useStats } from '../../context/StatsContext.jsx';
import { rnd } from '../../lib/random.js';
import { markQuest } from '../../lib/quests.js';

import DialogueScenarioMenu from './DialogueScenarioMenu.jsx';
import DialogueResultsScreen from './DialogueResultsScreen.jsx';
import DialogueGuidedMode from './DialogueGuidedMode.jsx';
import DialogueAiMode from './DialogueAiMode.jsx';
import { SCENARIOS } from './dialogueScenarios.js';
import { apiFetch } from '../../lib/apiFetch.js';

// Normalize Croatian diacritics for lenient free-text comparison
function normCro(s){return s.toLowerCase().replace(/[čć]/g,'c').replace(/š/g,'s').replace(/ž/g,'z').replace(/đ/g,'d').replace(/[^\w\s]/g,'').replace(/\s+/g,' ').trim();}

// Build a shuffled options array for a single turn; returns { opts, correctIdx }
function shuffleTurnOpts(turn) {
  const indices = turn.opts.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const shuffledOpts = indices.map(i => turn.opts[i]);
  const correctIdx = indices.indexOf(turn.answer);
  return { opts: shuffledOpts, correctIdx };
}

export default function DialogueSim({ award }) {
  const { level: userLevel } = useStats();
  const finishFired = useRef(false);
  const [scenario, setScenario] = useState(null);
  const [turnIdx, setTurnIdx] = useState(0);
  const [shuffledTurns, setShuffledTurns] = useState([]);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [done, setDone] = useState(false);
  const [freeMode, setFreeMode] = useState(false);
  const [freeInput, setFreeInput] = useState('');
  const [freeResult, setFreeResult] = useState(null);

  // AI Conversation Mode state
  const [aiMode, setAiMode] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCoaching, setAiCoaching] = useState(null);
  const [aiTurns, setAiTurns] = useState(0);
  const [aiDone, setAiDone] = useState(false);
  const [aiError, setAiError] = useState('');

  // Speak NPC line whenever a new guided turn loads
  useEffect(() => {
    if (!scenario || !scenario.turns[turnIdx] || aiMode) return;
    const line = scenario.turns[turnIdx].line;
    if (line && !line.startsWith('[')) speak(line);
  }, [scenario, turnIdx, aiMode]);  

  function startScenario(s) {
    finishFired.current = false;
    setScenario(s);
    setShuffledTurns(s.turns.map(shuffleTurnOpts));
    setTurnIdx(0);
    setScore(0);
    setAnswered(false);
    setSelected(-1);
    setDone(false);
    setFreeInput('');
    setFreeResult(null);
    setAiMode(false);
    setAiHistory([]);
    setAiInput('');
    setAiLoading(false);
    setAiCoaching(null);
    setAiTurns(0);
    setAiDone(false);
    setAiError('');
  }

  function handleSelect(i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === shuffledTurns[turnIdx].correctIdx) {
      setScore(sc => sc + 1);
    }
  }

  function handleFreeSubmit() {
    if (answered || !freeInput.trim()) return;
    const turn = scenario.turns[turnIdx];
    const correctAnswer = turn.opts[turn.answer];
    const userTrimmed = freeInput.trim().toLowerCase();
    const correctTrimmed = correctAnswer.toLowerCase();
    const matched = userTrimmed === correctTrimmed || normCro(userTrimmed) === normCro(correctTrimmed);
    setFreeResult({ matched, input: freeInput.trim(), correct: correctAnswer });
    setAnswered(true);
    if (matched) {
      setScore(sc => sc + 1);
    }
  }

  function handleContinue() {
    const nextIdx = turnIdx + 1;
    if (nextIdx >= scenario.turns.length) {
      if (!finishFired.current) {
        finishFired.current = true;
        if (award) {
          const lastCorrect = freeMode
            ? (freeResult && freeResult.matched ? 1 : 0)
            : (selected === shuffledTurns[turnIdx].correctIdx ? 1 : 0);
          award((score + lastCorrect) * 6);
        }
        markQuest('speak');
      }
      setDone(true);
    } else {
      setTurnIdx(nextIdx);
      setAnswered(false);
      setSelected(-1);
      setFreeInput('');
      setFreeResult(null);
    }
  }

  function goBack() {
    setScenario(null);
    setDone(false);
    setAnswered(false);
    setSelected(-1);
    setTurnIdx(0);
    setScore(0);
    setShuffledTurns([]);
    setFreeInput('');
    setFreeResult(null);
    setAiMode(false);
    setAiHistory([]);
    setAiInput('');
    setAiLoading(false);
    setAiCoaching(null);
    setAiTurns(0);
    setAiDone(false);
    setAiError('');
  }

  async function sendAiMessage() {
    if (!aiInput.trim() || aiLoading || aiDone) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiLoading(true);
    setAiError('');
    const newHistory = [...aiHistory, { role: 'user', content: userMsg, id: Date.now() }];
    setAiHistory(newHistory);
    try {
      const res = await apiFetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenario.id,
          userMessage: userMsg,
          history: aiHistory,
          level: userLevel || 'A2',
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setAiHistory([...newHistory, { role: 'assistant', content: data.reply, id: Date.now() + 1 }]);
      setAiCoaching(data.coaching || null);
      setAiTurns(t => t + 1);
    } catch {
      setAiError('Could not connect. Check your internet and try again.');
      setAiHistory(aiHistory);
    } finally {
      setAiLoading(false);
    }
  }

  // --- MENU SCREEN ---
  if (!scenario) {
    return <DialogueScenarioMenu scenarios={SCENARIOS} onSelect={startScenario} />;
  }

  const totalTurns = scenario.turns.length;

  // --- RESULTS SCREEN ---
  if (done) {
    return (
      <DialogueResultsScreen
        scenario={scenario}
        score={score}
        totalTurns={totalTurns}
        onBack={goBack}
      />
    );
  }

  // --- CONVERSATION SCREEN ---
  const turn = scenario.turns[turnIdx];
  const shuffled = shuffledTurns[turnIdx] || { opts: turn.opts, correctIdx: turn.answer };
  const isCorrect = selected === shuffled.correctIdx;

  return (
    <div className="scr-wrap">
      {H("💬 " + scenario.title, scenario.subtitle)}
      <Bar v={turnIdx + 1} mx={totalTurns} h={6} color="#0e7490" />

      <div style={{marginTop:16,marginBottom:8,fontSize:12,fontWeight:700,color:"var(--subtext)"}}>
        Turn {turnIdx + 1} of {totalTurns}
      </div>

      {/* Mode toggle */}
      <div style={{display:'flex', gap:8, marginBottom:16}}>
        <button
          onClick={() => { setAiMode(false); setAiHistory([]); setAiInput(''); setAiTurns(0); setAiDone(false); setAiCoaching(null); }}
          style={{
            flex:1, padding:'9px', borderRadius:10, border:'none', cursor:'pointer',
            background: !aiMode ? '#0e7490' : 'var(--card)',
            color: !aiMode ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:12, fontFamily:"'Outfit',sans-serif",
          }}
        >📋 Guided Practice</button>
        <button
          onClick={() => { setAiMode(true); setAiHistory([]); setAiInput(''); setAiTurns(0); setAiDone(false); setAiCoaching(null); }}
          style={{
            flex:1, padding:'9px', borderRadius:10, border:'none', cursor:'pointer',
            background: aiMode ? '#7c3aed' : 'var(--card)',
            color: aiMode ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:12, fontFamily:"'Outfit',sans-serif",
          }}
        >✨ AI Conversation</button>
      </div>

      {aiMode ? (
        <DialogueAiMode
          scenario={scenario}
          aiHistory={aiHistory}
          aiLoading={aiLoading}
          aiCoaching={aiCoaching}
          aiError={aiError}
          aiInput={aiInput}
          aiDone={aiDone}
          aiTurns={aiTurns}
          onInputChange={setAiInput}
          onSend={sendAiMessage}
          onFinish={() => {
            if (!finishFired.current) {
              finishFired.current = true;
              if (award) award(aiTurns * 5);
            }
            setAiDone(true);
          }}
          onBack={goBack}
          finishFired={finishFired}
          award={award}
        />
      ) : (
        <DialogueGuidedMode
          scenario={scenario}
          turnIdx={turnIdx}
          totalTurns={totalTurns}
          turn={turn}
          shuffled={shuffled}
          answered={answered}
          selected={selected}
          isCorrect={isCorrect}
          freeMode={freeMode}
          freeInput={freeInput}
          freeResult={freeResult}
          onSelect={handleSelect}
          onFreeInput={setFreeInput}
          onFreeSubmit={handleFreeSubmit}
          onContinue={handleContinue}
          onBack={goBack}
          onToggleFreeMode={() => { setFreeMode(m => !m); setFreeInput(''); setFreeResult(null); }}
          onSwitchToAi={() => { setAiMode(true); }}
        />
      )}
    </div>
  );
}
