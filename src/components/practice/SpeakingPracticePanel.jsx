import React from 'react';
import { Spk, speakSlow } from '../../data.jsx';
import PronunciationScorer from '../shared/PronunciationScorer.jsx';
import { AIProgressBar } from '../shared/SkeletonLoader.jsx';

const SRSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// Score badge helpers — spec thresholds: 90+ excellent, 70+ good, 50+ keep practicing, <50 try again
function scoreBadgeColor(s) {
  if (s >= 90) return { bg: 'var(--success-bg)', border: 'var(--success-b)', text: 'var(--success)' };
  if (s >= 70) return { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' };
  if (s >= 50) return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' };
  return { bg: '#fef2f2', border: '#fecaca', text: 'var(--error)' };
}
function scoreBadgeLabel(s) {
  if (s >= 90) return `🟢 Excellent! ${s}%`;
  if (s >= 70) return `🟡 Good! ${s}%`;
  if (s >= 50) return `🟠 Keep practicing ${s}%`;
  return `🔴 Try again ${s}%`;
}

export default function SpeakingPracticePanel({
  sw,
  si,
  sx,
  sr,
  listening,
  recResult,
  recMsg,
  langIdx,
  currentLang,
  waveform,
  pronScore,
  currentWordScore,
  recordingURL,
  onStartMic,
  onStopMic,
  onSelfAssess,
  onAdvanceWord,
  onClearRecording,
  onScore,
}) {
  return (
    <div className="c" style={{textAlign:'center', marginTop:16}}>
      {/* Tutor portrait — Maja guides the session */}
      <div style={{display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginBottom:18}}>
        <div style={{
          width:52, height:52, borderRadius:'50%', overflow:'hidden', flexShrink:0,
          border: listening ? '3px solid var(--success)' : '2.5px solid #e0f2fe',
          boxShadow: listening ? '0 0 0 5px rgba(14,116,144,.18)' : '0 0 0 2px rgba(14,116,144,.1)',
          transition:'border-color .3s ease, box-shadow .3s ease',
          background:'linear-gradient(135deg,#0e7490,#0c4a6e)',
        }}>
          <img src="/images/portraits/tutor-hero.webp" alt="Maja"
            loading="lazy"
            style={{width:'100%', height:'100%', objectFit:'cover'}}
            onError={e => { e.currentTarget.style.display='none'; }} />
        </div>
        <div style={{textAlign:'left'}}>
          <div style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', lineHeight:1.2}}>Maja</div>
          <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)'}}>Croatian tutor</div>
          {listening && <div style={{fontSize:'var(--text-xs)', color:'var(--success)', fontWeight:700, marginTop:2}}>listening…</div>}
        </div>
      </div>

      {/* Waveform visualizer */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 3, height: 52,
        justifyContent: 'center', marginBottom: 12,
        padding: '0 16px',
      }}>
        {waveform.map((h, i) => (
          <div key={i} style={{
            width: 6, borderRadius: 3,
            height: Math.max(4, listening ? h * 0.52 : 4) + 'px',
            background: listening
              ? `hsl(${160 + h * 0.5}, 70%, ${40 + h * 0.2}%)`
              : 'var(--card-b)',
            transition: 'height 0.05s ease',
            flexShrink: 0,
          }} />
        ))}
      </div>

      <p style={{fontSize:'var(--text-4xl)', fontWeight:800, fontFamily:"'Playfair Display',serif"}}>{sw[0]}</p>
      {sw[2] && <p style={{fontSize:'var(--text-base)', color:'var(--subtext)', marginBottom:4}}>/{sw[2]}/</p>}
      <p style={{fontSize:'var(--text-lg)', color:'var(--body)', marginBottom:16}}>{sw[1]}</p>
      <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:16, flexWrap:'wrap'}}>
        <Spk text={sw[0]} label="Normal" />
        <button
          onClick={() => speakSlow(sw[0])}
          style={{background:'var(--success-bg)', border:'1px solid var(--success-b)', borderRadius:10, padding:'7px 12px', cursor:'pointer', fontSize:'var(--text-sm)', color:'var(--success)', fontWeight:700}}>
          🐢 Slow
        </button>
      </div>

      {/* Pronunciation scorer — handles speech recognition and scoring.
          When SRSupported, this is the ONLY speech button shown (no duplicate below). */}
      {SRSupported ? (
        <PronunciationScorer targetText={sw[0]} targetEnglish={sw[1]} onScore={onScore} />
      ) : (
        <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:8, padding:'10px 14px', background:'var(--bar-bg)', borderRadius:12, border:'1.5px solid var(--card-b)'}}>
          💡 Tap ✓ if you said it correctly
        </div>
      )}

      {/* Per-word score badge shown after PronunciationScorer fires */}
      {currentWordScore !== null && (
        <div style={{
          marginTop: 10, padding: '10px 16px', borderRadius: 12,
          background: scoreBadgeColor(currentWordScore.score).bg,
          border: `1.5px solid ${scoreBadgeColor(currentWordScore.score).border}`,
          fontWeight: 800, fontSize: 'var(--text-base)',
          color: scoreBadgeColor(currentWordScore.score).text,
        }}>
          {scoreBadgeLabel(currentWordScore.score)}
        </div>
      )}

      {/* Legacy mic button + AI score panel — only shown when SpeechRecognition is NOT available
          (PronunciationScorer already handles the mic when SRSupported is true) */}
      {!SRSupported ? (
        <div style={{marginBottom:16, marginTop:16}}>
          <button
            onClick={listening ? onStopMic : onStartMic}
            style={{
              background: listening ? 'var(--error)' : 'var(--success-bg)',
              border: `1.5px solid ${listening ? 'var(--error)' : 'var(--success-b)'}`,
              borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontSize: 'var(--text-base)',
              color: listening ? '#fff' : 'var(--success)', fontWeight: 800,
              animation: listening ? 'pulse 1s infinite' : undefined,
              boxShadow: listening ? '0 0 0 4px rgba(239,68,68,.2)' : undefined,
            }}>
            {listening ? '🔴 Listening… (tap to stop)' : '🎙️ Tap to Speak'}
          </button>
          {listening && (
            <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginTop:6, animation:'pulse 1.5s infinite'}}>
              Speak "{sw[0]}" into your mic…
            </div>
          )}
          {recResult === 'match' && (
            <div style={{color:'var(--success)', fontSize:'var(--text-md)', fontWeight:800, marginTop:10, padding:'10px', background:'var(--success-bg)', borderRadius:12, border:'1.5px solid var(--success-b)'}}>
              🎯 Great pronunciation match!
            </div>
          )}
          {recResult === 'nomatch' && (
            <div style={{color:'var(--warning)', fontSize:'var(--text-base)', fontWeight:600, marginTop:10, padding:'10px', background:'var(--warning-bg)', borderRadius:12, border:'1.5px solid var(--warning-b)'}}>
              Close! Try again or use self-assessment below.
            </div>
          )}
          {(recResult === 'error' || recResult === 'timeout') && recMsg && (
            <div style={{color:'var(--subtext)', fontSize:'var(--text-sm)', marginTop:10, padding:'10px 14px', background:'var(--bar-bg)', borderRadius:12, border:'1.5px solid var(--card-b)', textAlign:'left', lineHeight:1.5}}>
              ⚠️ {recMsg}
            </div>
          )}
          {langIdx > 0 && (
            <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:6}}>
              Using {currentLang} recognition
            </div>
          )}

          {/* AI pronunciation score loading indicator */}
          {recResult && recResult !== 'error' && recResult !== 'timeout' && !pronScore && (
            <AIProgressBar phase="processing" messages={['Analyzing your pronunciation…', 'Comparing with native Croatian…', 'Almost done…']} />
          )}

          {/* AI pronunciation score */}
          {pronScore && (
            <div className="c" style={{
              padding: '12px 16px', marginTop: 8,
              borderLeft: `4px solid ${pronScore.score >= 80 ? 'var(--success)' : pronScore.score >= 60 ? 'var(--info)' : 'var(--error)'}`,
              animation: 'fadeIn .3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: pronScore.score >= 80 ? 'var(--success-bg)' : pronScore.score >= 60 ? 'var(--info-bg)' : 'var(--error-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {pronScore.score >= 80 ? '🌟' : pronScore.score >= 60 ? '👍' : '🎯'}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>
                    Pronunciation: {pronScore.score}/100
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
                    {pronScore.match_quality === 'exact' ? 'Perfect match!'
                     : pronScore.match_quality === 'close' ? 'Very close!'
                     : pronScore.match_quality === 'partial' ? 'Getting there'
                     : 'Keep practicing'}
                  </div>
                </div>
              </div>
              {pronScore.phonetic_tips?.length > 0 && (
                <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
                  💡 {pronScore.phonetic_tips[0]}
                </div>
              )}
              {pronScore.encouragement && (
                <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginTop: 6 }}>
                  {pronScore.encouragement}
                </div>
              )}
            </div>
          )}

          {recordingURL && (
            <div style={{
              marginTop:16, padding:'14px 16px',
              background:'var(--card)', borderRadius:14,
              border:'1.5px solid var(--inp-b)',
            }}>
              <div style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', marginBottom:10}}>
                🎧 Compare your pronunciation:
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:700, marginBottom:4}}>You:</div>
                <audio src={recordingURL} controls style={{width:'100%', height:36}} />
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:700, marginBottom:4}}>Native speaker:</div>
                <Spk text={sw[0]} label="▶ Play native" />
              </div>
              <button
                onClick={onClearRecording}
                style={{
                  width:'100%', padding:'8px', borderRadius:10, border:'1.5px solid var(--inp-b)',
                  background:'none', cursor:'pointer', fontSize:'var(--text-sm)', fontWeight:700,
                  color:'var(--subtext)', fontFamily:"'Outfit',sans-serif",
                }}
              >
                🔄 Record again
              </button>
            </div>
          )}
        </div>
      ) : null}

      <button className="b bs" onClick={onSelfAssess}>
        👍 I Said It Correctly!
      </button>
      {sr === 'ok' && <div style={{color:'var(--success)', fontSize:'var(--text-xl)', fontWeight:800, marginTop:12}}>✓ Great pronunciation!</div>}
      {sr === 'ok' && (
        <button
          className="b bp"
          style={{marginTop:16}}
          onClick={onAdvanceWord}>
          {sx < si.length - 1 ? 'Next →' : 'Finish'}
        </button>
      )}
    </div>
  );
}
