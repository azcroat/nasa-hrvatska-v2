// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { H, Bar, speak } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { rnd } from '../../lib/random.js';
import { apiFetch } from '../../lib/apiFetch.js';
import { recordTopicResult } from '../../lib/adaptive.js';
function shLocal(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b;}

const DATA = [
  { text:"Dobar dan, kako ste?", en:"Good day, how are you?", level:"A1" },
  { text:"Gdje je najbliža ljekarna?", en:"Where is the nearest pharmacy?", level:"A1" },
  { text:"Jednu kavu i dva soka, molim.", en:"One coffee and two juices, please.", level:"A1" },
  { text:"Koliko košta ta majica?", en:"How much does that t-shirt cost?", level:"A1" },
  { text:"Trebam pomoć, izgubio sam se.", en:"I need help, I got lost.", level:"A2" },
  { text:"Vlak polazi u devet i pol.", en:"The train departs at half past nine.", level:"A2" },
  { text:"Možete li govoriti sporije, molim vas?", en:"Could you speak more slowly, please?", level:"A2" },
  { text:"Rezervirala sam stol za dvoje.", en:"I reserved a table for two.", level:"A2" },
  { text:"Zašto nisi došao na sastanak?", en:"Why didn't you come to the meeting?", level:"B1" },
  { text:"Sutra ću ići na tržnicu kupiti povrće.", en:"Tomorrow I'll go to the market to buy vegetables.", level:"B1" },
  { text:"Mislim da je to jako važno pitanje.", en:"I think that is a very important question.", level:"B1" },
  { text:"Sviđa mi se ovaj grad, posebno stari dio.", en:"I like this city, especially the old part.", level:"B1" },
  { text:"Kad bih imao više vremena, naučio bih gitaru.", en:"If I had more time, I would learn guitar.", level:"B2" },
  { text:"Preporučujem ti da pročitaš tu knjigu.", en:"I recommend you read that book.", level:"B2" },
  { text:"Nije mi jasno zašto se tako ponaša.", en:"I don't understand why he behaves that way.", level:"B2" },
  { text:"Trebalo bi se više paziti na okoliš.", en:"We should pay more attention to the environment.", level:"B2" },
  { text:"Koliko dugo živiš u ovom gradu?", en:"How long have you been living in this city?", level:"A2" },
  { text:"Ne znam gdje sam stavio ključeve.", en:"I don't know where I put the keys.", level:"B1" },
  { text:"Možeš li mi preporučiti dobar restoran?", en:"Can you recommend me a good restaurant?", level:"A2" },
  { text:"Hvala lijepa, jako ste ljubazni.", en:"Thank you very much, you are very kind.", level:"A1" },
];

const levelColor = { A1:'#dcfce7', A2:'#dbeafe', B1:'#fef3c7', B2:'#f3e8ff' };
const levelText  = { A1:'#166534', A2:'#1d4ed8', B1:'#92400e', B2:'#6b21a8' };

function normalise(s) {
  return s.trim().toLowerCase().replace(/[.,!?;:]+$/, '');
}

const DIACRITICS = ['Č','Ć','Š','Ž','Đ','č','ć','š','ž','đ'];

function stripDiacritics(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function DictationScreen({ goBack, award }) {
  const finishFired = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const [qs] = useState(() => shLocal(DATA));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [closeMatch, setCloseMatch] = useState(false);
  const inputRef = useRef(null);
  const [aiExplain, setAiExplain] = useState(null); // null | 'loading' | {explanation,rule,tip,example}

  const fetchExplanation = useCallback(async (wrong, correctText, level) => {
    setAiExplain('loading');
    try {
      const res = await apiFetch('/api/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wrong, correct: correctText, type: 'dictation', level: level || 'A2' }),
        signal: AbortSignal.timeout(20000),
      });
      if (!mountedRef.current) return;
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (mountedRef.current) setAiExplain(data);
    } catch {
      if (mountedRef.current) setAiExplain({ explanation: 'Could not load explanation.', rule: '', tip: '', example: '' });
    }
  }, []);

  const total = qs.length;

  if (!qs.length) return null;

  if (idx >= total) {
    const pct = score / total;
    const xp = score * 8;
    return (
      <div className="scr-wrap">
        {H("🎧 Dictation", "Listen and type what you hear", goBack)}
        <div style={{textAlign:"center",padding:"32px 16px"}}>
          <div style={{fontSize:52,marginBottom:8}}>{pct>=0.8?"🏆":pct>=0.6?"⭐":"💪"}</div>
          <div style={{fontSize:22,fontWeight:800,color:"#164e63",marginBottom:4}}>{score} / {total} correct</div>
          <div style={{fontSize:13,color:"#78716c",marginBottom:16}}>
            {pct>=0.8?"Excellent ear! Your Croatian listening is sharp.":pct>=0.6?"Good progress! Keep listening to build fluency.":"Try again — listening improves faster than you think!"}
          </div>
          <div style={{fontSize:22,fontWeight:900,color:"#d97706",marginBottom:24}}>+{xp} XP</div>
          <button className="b bp" style={{width:"100%"}} onClick={() => { if(finishFired.current)return; finishFired.current=true; markQuest('speak'); if (typeof award === 'function') award(xp); goBack(); }}>✓ Done</button>
        </div>
      </div>
    );
  }

  const q = qs[idx];

  function handleCheck() {
    if (!input.trim()) return;
    const norm = normalise(input);
    const target = normalise(q.text);
    const isExact = norm === target;
    const isClose = !isExact && stripDiacritics(norm) === stripDiacritics(target);
    setCorrect(isExact || isClose);
    setCloseMatch(isClose);
    setChecked(true);
    recordTopicResult('listening', isExact || isClose);
    if (isExact || isClose) setScore(s => s + 1);
  }

  function handleNext() {
    setIdx(idx + 1);
    setInput('');
    setChecked(false);
    setCorrect(false);
    setCloseMatch(false);
    setAiExplain(null);
  }

  function insertDiacritic(ch) {
    if (!inputRef.current) {
      setInput(prev => prev + ch);
      return;
    }
    const el = inputRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = input.slice(0, start) + ch + input.slice(end);
    setInput(next);
    setTimeout(() => {
      el.selectionStart = start + ch.length;
      el.selectionEnd = start + ch.length;
      el.focus();
    }, 0);
  }

  return (
    <div className="scr-wrap">
      {H("🎧 Dictation", "Listen and type what you hear", goBack)}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{idx + 1} / {total}</span>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{
            background: levelColor[q.level],
            color: levelText[q.level],
            borderRadius:6,
            padding:"2px 8px",
            fontSize:11,
            fontWeight:800
          }}>{q.level}</span>
          <span style={{color:"#0e7490",fontWeight:700}}>Score: {score}</span>
        </div>
      </div>
      <Bar v={idx + 1} mx={total} />

      <div style={{textAlign:"center",marginTop:20,marginBottom:8}}>
        <button
          className="b bp"
          style={{fontSize:28,padding:"12px 24px",borderRadius:50,width:64,height:64,display:"inline-flex",alignItems:"center",justifyContent:"center"}}
          onClick={() => speak(q.text)}
          title="Play audio">
          ▶
        </button>
        <div style={{fontSize:12,color:"#78716c",marginTop:6}}>Tap to listen</div>
      </div>

      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
        {DIACRITICS.map(ch => (
          <button
            key={ch}
            onClick={() => insertDiacritic(ch)}
            style={{
              background:"#f1f5f9",
              border:"1px solid #cbd5e1",
              borderRadius:6,
              padding:"4px 10px",
              fontSize:14,
              fontWeight:700,
              cursor:"pointer",
              color:"#0e7490"
            }}>
            {ch}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => { if (!checked) setInput(e.target.value); }}
        onKeyDown={e => { if (e.key === 'Enter' && !checked) handleCheck(); }}
        placeholder="Type what you heard..."
        style={{
          width:"100%",
          boxSizing:"border-box",
          padding:"10px 14px",
          fontSize:16,
          borderRadius:10,
          border: checked
            ? `2px solid ${correct ? "#16a34a" : "#dc2626"}`
            : "2px solid rgba(14,116,144,.2)",
          background: checked ? (correct ? "#dcfce7" : "#fee2e2") : "white",
          outline:"none",
          marginBottom:8
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {checked && (
        <div style={{marginBottom:8}}>
          {correct ? (
            closeMatch ? (
              <div>
                <div style={{color:"#b45309",fontWeight:700,fontSize:15}}>✓ Close! Watch your diacritics ✍️</div>
                <div style={{color:"#92400e",fontSize:13,marginTop:2}}>Correct: <strong>{q.text}</strong></div>
              </div>
            ) : (
              <div style={{color:"#166534",fontWeight:700,fontSize:15}}>✓ Correct!</div>
            )
          ) : (
            <div>
              <div style={{color:"#dc2626",fontSize:13,marginBottom:2}}><strong>Your answer:</strong> {input}</div>
              <div style={{color:"#166534",fontSize:13}}><strong>Correct answer:</strong> {q.text}</div>
            </div>
          )}
          <div style={{color:"#78716c",fontSize:13,marginTop:4}}>{q.en}</div>
          {!correct && !aiExplain && (
            <button
              onClick={() => fetchExplanation(input, q.text, q.level)}
              style={{
                marginTop:8, display:'block', width:'100%',
                padding:'7px', borderRadius:9, border:'1.5px solid #bae6fd',
                background:'#f0f9ff', color:'#0369a1', fontWeight:700, fontSize:12,
                cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              }}
            >🧠 Explain this sentence</button>
          )}
          {aiExplain === 'loading' && (
            <div style={{marginTop:8, padding:'8px 12px', borderRadius:9, background:'#f0f9ff', border:'1.5px solid #bae6fd', fontSize:12, color:'#0369a1', fontWeight:600}}>Explaining…</div>
          )}
          {aiExplain && aiExplain !== 'loading' && (
            <div style={{marginTop:8, padding:'10px 12px', borderRadius:10, background:'#f0f9ff', border:'1.5px solid #bae6fd'}}>
              {aiExplain.rule && <div style={{fontSize:11, fontWeight:800, color:'#0369a1', marginBottom:3, textTransform:'uppercase', letterSpacing:'0.05em'}}>{aiExplain.rule}</div>}
              <div style={{fontSize:12, color:'var(--heading)', lineHeight:1.6}}>{aiExplain.explanation}</div>
              {aiExplain.tip && <div style={{fontSize:12, color:'#0369a1', marginTop:4, fontStyle:'italic'}}>💡 {aiExplain.tip}</div>}
            </div>
          )}
        </div>
      )}

      {!checked ? (
        <button
          className="b bp"
          style={{width:"100%",marginTop:16}}
          onClick={handleCheck}
          disabled={!input.trim()}>
          Check ✓
        </button>
      ) : (
        <button
          className="b bp"
          style={{width:"100%",marginTop:16}}
          onClick={handleNext}>
          Next →
        </button>
      )}
    </div>
  );
}
