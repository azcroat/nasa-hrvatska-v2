import React, { useState, useRef, useEffect } from 'react';
import { Bar, speak, speakSlow, sh } from '../../data.jsx';
import ScreenHeader from '../shared/ScreenHeader.jsx';
import { markQuest } from '../../lib/quests.js';
import { knightSpeak } from '../../lib/knightSpeak.js';

const LISTENING_TIPS = [
  { mood: 'thinking',    text: 'Close your eyes and let the Croatian sounds wash over you. Meaning before words. 🎧' },
  { mood: 'encouraging', text: 'Real listening means catching the meaning, not every syllable. Don\'t panic — focus on what you know. 🌊' },
  { mood: 'happy',       text: 'Croatian is perfectly phonetic — once you know the sounds, every sentence you\'ve ever heard clicks. 🔑' },
  { mood: 'ready',       text: 'Listen twice if you need to. The slow button is your friend, not a cheat. ⚔️' },
];

export default function ListeningScreen({ questions, goBack, award }) {
  const finishFired = useRef(false);
  const questFired = useRef(false);
  const [idx, setIdx] = useState(0);

  // Knight coaching — entry tip on mount
  useEffect(() => {
    const tip = LISTENING_TIPS[Math.floor(Math.random() * LISTENING_TIPS.length)];
    knightSpeak(tip.mood, tip.text, 900);
  }, []);  
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [options, setOptions] = useState(() => questions.length > 0 ? sh(questions[0].opts) : []);
  const [replayed, setReplayed] = useState(false);

  const total = questions.length;

  if (idx >= total) return (
    <div className="scr-wrap">
      <div style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:64,marginBottom:8}}>{score>=total*0.8?"🏆":score>=total*0.6?"⭐":"💪"}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63",marginBottom:4}}>Listening Complete!</h2>
        <div style={{fontSize:32,fontWeight:800,color:"#0e7490",marginBottom:4}}>{score} / {total}</div>
        <div style={{fontSize:13,color:"#78716c",marginBottom:16}}>
          {score===total?"Perfect ear! You caught every sentence.":score>=Math.ceil(total*0.7)?"Great listening! Keep it up.":"Try again — focus on the first word of each sentence."}
        </div>
        <div style={{fontSize:24,fontWeight:900,color:"#d97706",marginBottom:20}}>+{score*4+10} XP</div>
        <button className="b bp" style={{width:"100%"}} onClick={()=>{
          if(finishFired.current)return;
          finishFired.current=true;
          if (typeof award === 'function') award(score*4+10);
          goBack();
        }}>Finish!</button>
      </div>
    </div>
  );

  const q = questions[idx];
  if (!q) return null;
  const correct = q.en;
  const isCorrect = options[selected] === correct;

  function handleAnswer(oi) {
    if (answered) return;
    setSelected(oi);
    setAnswered(true);
    if (options[oi] === correct) setScore(s => s + 1);
    // NOTE: auto-play removed — iOS Safari blocks speechSynthesis outside direct user gesture.
    // The "🔊 Listen again" button below lets users replay with a direct tap.
  }

  function next() {
    if (idx < total - 1) {
      const n = questions[idx + 1];
      setOptions(n && Array.isArray(n.opts) ? sh(n.opts) : []);
      setIdx(i => i + 1);
      setAnswered(false);
      setSelected(-1);
      setReplayed(false);
    } else {
      if (!questFired.current) { questFired.current = true; markQuest('speak'); }
      setIdx(total);
    }
  }

  return (
    <div className={answered ? 'scr-wrap has-cta' : 'scr-wrap'}>
      <ScreenHeader title="🎧 Listening" goBack={goBack} pill={`${idx + 1}/${total}`} />
      <Bar v={idx+1} mx={total} h={6} />

      {/* Audio controls */}
      <div className="c" style={{marginTop:16,textAlign:"center",padding:"20px 16px"}}>
        <div style={{fontSize:13,color:"#78716c",marginBottom:12}}>Listen carefully, then choose what the sentence means:</div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <button aria-label="Play sentence audio" className="b bp" style={{fontSize:16,padding:"14px 24px"}} onClick={()=>speak(q.hr)}><span aria-hidden="true">🔊</span> Play</button>
          <button aria-label="Play sentence slowly" className="b bg" style={{fontSize:13,padding:"14px 16px"}} onClick={()=>speakSlow(q.hr)}><span aria-hidden="true">🐢</span> Slow</button>
        </div>
      </div>

      {/* Options */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
        {options.map((o,oi)=>(
          <button key={oi} className={"ob "+(answered?(o===correct?"ok":selected===oi?"no":""):"")}
            onClick={()=>handleAnswer(oi)}>
            {o}
          </button>
        ))}
      </div>

      {/* Post-answer: show the Croatian + explanation */}
      {answered && (
        <div style={{marginTop:12,padding:"12px 16px",borderRadius:12,
          background: isCorrect ? "rgba(22,163,74,.07)" : "rgba(220,38,38,.06)",
          border: `1px solid ${isCorrect?"rgba(22,163,74,.2)":"rgba(220,38,38,.15)"}`,
        }}>
          <div style={{fontSize:13,fontWeight:700,color:isCorrect?"#15803d":"#b91c1c",marginBottom:6}}>
            {isCorrect ? "✓ Correct!" : "✗ The answer was: "+correct}
          </div>
          {/* Show the Croatian sentence so brain connects sound → meaning */}
          <div style={{fontSize:13,color:"#44403c",marginBottom:4}}>
            <span style={{fontWeight:700,color:"#0e7490"}}>🇭🇷 </span>{q.hr}
          </div>
          <div style={{fontSize:12,color:"#78716c"}}>
            <span style={{fontWeight:700}}>🇬🇧 </span>{correct}
          </div>
          {q.tip && (
            <div style={{fontSize:11,color:"#b45309",marginTop:6,padding:"6px 10px",background:"rgba(245,158,11,.08)",borderRadius:8}}>
              💡 {q.tip}
            </div>
          )}
          <button
            aria-label="Listen to sentence again"
            onClick={() => { speak(q.hr); setReplayed(true); }}
            style={{marginTop:8,padding:"8px 14px",fontSize:12,fontWeight:700,background:"rgba(14,116,144,.1)",border:"1px solid rgba(14,116,144,.25)",borderRadius:8,color:"#0e7490",cursor:"pointer",width:"100%"}}
          >
            🔊 Listen again
          </button>
          {replayed && !isCorrect && (
            <div style={{fontSize:11,color:"#0e7490",marginTop:4}}>Focus on the sound — then tap Next when ready</div>
          )}
        </div>
      )}

      {answered && (
        <div className="cta-bar">
          <button className="b bp" onClick={next}>
            {idx < total - 1 ? 'Next →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
