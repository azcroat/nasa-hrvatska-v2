// @ts-nocheck
import React from 'react';
import { speak } from '../../lib/audio.js';
import { getMemoryHook } from '../../lib/memoryHooks.js';

// Converts Croatian text to a simple English phonetic approximation.
function getPronunciation(word) {
  if (!word) return '';
  let s = word;
  s = s.replace(/[Dd][žŽ]/g, 'j');
  s = s.replace(/[Ll][jJ]/g, 'ly');
  s = s.replace(/[Nn][jJ]/g, 'ny');
  s = s.replace(/[čČ]/g, 'ch');
  s = s.replace(/[ćĆ]/g, 'ty');
  s = s.replace(/[šŠ]/g, 'sh');
  s = s.replace(/[žŽ]/g, 'zh');
  s = s.replace(/[đĐ]/g, 'dj');
  s = s.replace(/[jJ]/g, 'y');
  s = s.replace(/[cC]/g, 'ts');
  s = s.replace(/[rR]/g, 'r');
  return s;
}

// Derive a simple tip from the Croatian word when no example sentence exists.
function getWordTip(croatianWord, englishMeaning) {
  if (!croatianWord || !englishMeaning) return null;
  const w = croatianWord.trim();
  const en = englishMeaning.toLowerCase();

  const isVerb = en.startsWith('to ') || /[tć]i$/i.test(w);
  if (isVerb) {
    const stem = w.replace(/[tć]i$/i, '');
    return { type: 'verb', hr: `${w} → ${stem}im / ${stem}iš`, en: 'infinitive → I / you (present)' };
  }

  const adjEndings = /[iao]$/i;
  const adjKeywords = ['good','bad','big','small','happy','sad','beautiful','old','new','fast','slow','hard','easy','hot','cold','long','short','young','old','free','full','empty','dark','light','heavy','clean','dirty'];
  const looksAdj = adjEndings.test(w) && adjKeywords.some(k => en.includes(k));
  if (looksAdj) {
    return { type: 'adj', hr: null, en: 'Agrees with noun gender (m./f./n.)' };
  }

  const lastChar = w.replace(/[!?,.'"-]/g, '').slice(-1).toLowerCase();
  let gender = null;
  if (/[aá]/.test(lastChar)) gender = 'f.';
  else if (/[oe]/.test(lastChar)) gender = 'n.';
  else if (/[bcčćdfghjklmnprsštvzž]/.test(lastChar)) gender = 'm.';

  if (gender) {
    const labels = { 'm.': 'masculine', 'f.': 'feminine', 'n.': 'neuter' };
    return { type: 'noun', gender, en: `${labels[gender]} noun` };
  }

  return null;
}

export default function FlashcardCardBack({ card, aiLoading, aiSentence, aiError }) {
  const croatianWord = card[0];
  const englishMeaning = card[1];
  const exampleSentence = card[3];
  const phonetic = getPronunciation(croatianWord);
  const hasSpecial = croatianWord !== phonetic;
  const hook = getMemoryHook(croatianWord);
  const tip = !exampleSentence ? getWordTip(croatianWord, englishMeaning) : null;

  return (
    <>
      <div style={{fontSize:14,color:"var(--subtext)",marginTop:4,textAlign:"center",fontWeight:700}}>{englishMeaning}</div>

      {/* Pronunciation pill + speak button */}
      {hasSpecial ? (
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop:8, flexWrap:'wrap'}}>
          <span style={{
            background:'var(--bar-bg)',
            borderRadius:20,
            padding:'4px 12px',
            fontSize:12,
            color:'var(--subtext)',
            fontStyle:'italic',
            letterSpacing:'0.02em',
          }}>
            <span aria-hidden="true">🔊</span> {phonetic}
          </span>
          <button
            onClick={e => { e.stopPropagation(); speak(croatianWord); }}
            aria-label={`Hear pronunciation of ${croatianWord}`}
            style={{
              background:'var(--bar-bg)',
              border:'none',
              borderRadius:20,
              padding:'4px 10px',
              fontSize:13,
              cursor:'pointer',
              color:'var(--info)',
              fontWeight:700,
              lineHeight:1,
            }}
            title="Hear it"
          >▶</button>
        </div>
      ) : (
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', marginTop:8}}>
          <button
            onClick={e => { e.stopPropagation(); speak(croatianWord); }}
            aria-label={`Hear pronunciation of ${croatianWord}`}
            style={{
              background:'var(--bar-bg)',
              border:'none',
              borderRadius:20,
              padding:'4px 14px',
              fontSize:13,
              cursor:'pointer',
              color:'var(--info)',
              fontWeight:700,
            }}
            title="Hear it"
          ><span aria-hidden="true">🔊</span> Hear it</button>
        </div>
      )}

      {/* Example sentence or contextual tip */}
      {exampleSentence ? (
        <div style={{
          background:'var(--bar-bg)',
          borderRadius:10,
          padding:'10px 12px',
          marginTop:8,
          textAlign:'left',
        }}>
          <p style={{
            fontSize:12,
            fontStyle:'italic',
            color:'var(--body)',
            margin:0,
            lineHeight:1.5,
          }}>
            "{exampleSentence}"
          </p>
        </div>
      ) : tip && tip.type === 'verb' ? (
        <div style={{
          background:'var(--bar-bg)',
          borderRadius:10,
          padding:'10px 12px',
          marginTop:8,
          textAlign:'left',
        }}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--subtext)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.05em'}}>Verb forms</div>
          <div style={{fontSize:12,fontStyle:'italic',color:'var(--body)',lineHeight:1.5}}>{tip.hr}</div>
          <div style={{fontSize:11,color:'var(--subtext)',marginTop:2}}>{tip.en}</div>
        </div>
      ) : tip && tip.type === 'adj' ? (
        <div style={{
          background:'var(--bar-bg)',
          borderRadius:10,
          padding:'10px 12px',
          marginTop:8,
          textAlign:'center',
        }}>
          <div style={{fontSize:11,color:'var(--subtext)',lineHeight:1.5}}>{tip.en}</div>
        </div>
      ) : tip && tip.type === 'noun' && tip.gender ? (() => {
        const genderColor = tip.gender === 'm.' ? '#3b82f6' : tip.gender === 'f.' ? '#ec4899' : '#a855f7';
        return (
          <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}>
            <span style={{
              background: genderColor + '20',
              border: `1px solid ${genderColor}50`,
              borderRadius:8,
              padding:'4px 12px',
              fontSize:12,
              fontWeight:700,
              color: genderColor,
            }}>
              {tip.gender} {tip.en}
            </span>
          </div>
        );
      })() : null}

      {/* AI-generated example sentence */}
      {!exampleSentence && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'rgba(14,116,144,0.07)',
          borderRadius: 12,
          border: '1px solid rgba(14,116,144,0.18)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            ✨ AI Example
          </div>
          {aiLoading && (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '4px 0' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#0e7490', opacity: 0.5, animation: `dot-bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
              ))}
            </div>
          )}
          {!aiLoading && aiSentence && (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', lineHeight: 1.5 }}>{aiSentence.hr}</div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 3, fontStyle: 'italic' }}>{aiSentence.en}</div>
              {aiSentence.note && (
                <div style={{ fontSize: 11, color: '#0e7490', marginTop: 4, fontWeight: 600 }}>📌 {aiSentence.note}</div>
              )}
            </>
          )}
          {!aiLoading && aiError && (
            <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic' }}>Example unavailable</div>
          )}
        </div>
      )}

      {/* Memory hook */}
      {hook && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10,
          fontSize: 12,
          color: 'var(--subtext)',
          lineHeight: 1.5,
          fontStyle: 'italic',
        }}>
          {hook}
        </div>
      )}

      <div style={{fontSize:12,color:"var(--subtext)",marginTop:10}}>tap to flip back</div>
    </>
  );
}
