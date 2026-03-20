import React, { useState, useRef } from 'react';
import { H, Bar, Spk, speakSlow } from '../../data.jsx';

const SRSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// Language codes to try in order — hr-HR is most accurate but least supported
const LANG_FALLBACKS = ['hr-HR', 'hr', 'en-US'];

// Map SpeechRecognition error codes to user-friendly messages
function srError(code) {
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone permission denied. Please allow microphone access in your browser settings and try again.';
    case 'no-speech':
      return "No speech detected. Please speak louder and closer to the mic.";
    case 'audio-capture':
      return 'No microphone found. Check that your microphone is connected and not in use by another app.';
    case 'network':
      return 'Network error. Speech recognition requires an internet connection.';
    case 'service-not-allowed':
      return 'Speech recognition is not available here. This feature requires HTTPS.';
    case 'aborted':
      return null; // user-initiated stop, no message needed
    default:
      return `Mic error (${code || 'unknown'}). Try again or use self-assessment below.`;
  }
}

export default function SpeakingScreen({ sw, si, sx, sr, ssc, sSr, sSx, sSw, sSsc, goBack, award, setSt }) {
  const [listening, setListening] = useState(false);
  const [recResult, setRecResult] = useState(null);
  const [recMsg, setRecMsg] = useState('');
  const [langIdx, setLangIdx] = useState(0);
  const recRef = useRef(null);
  const timeoutRef = useRef(null);

  if (!sw) return null;

  async function requestMicPermission() {
    // Explicitly request mic access so the browser shows its permission dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop the tracks — we just needed the permission prompt
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (e) {
      return false;
    }
  }

  function startRecognition(lIdx) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    const lang = LANG_FALLBACKS[lIdx] || 'hr-HR';
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    recRef.current = rec;
    setListening(true);
    setRecResult(null);
    setRecMsg('');

    // Auto-stop after 12 seconds to prevent infinite listening
    timeoutRef.current = setTimeout(() => {
      if (recRef.current) {
        try { recRef.current.stop(); } catch (_) {}
      }
      setListening(false);
      setRecResult('timeout');
      setRecMsg('No speech detected within 12 seconds. Try again or use self-assessment.');
    }, 12000);

    rec.onresult = (e) => {
      clearTimeout(timeoutRef.current);
      const alts = Array.from(e.results[0]).map(r => r.transcript.toLowerCase().trim());
      const target = sw[0].toLowerCase().trim();
      // Generous matching: exact, contains, or at least 60% character overlap
      const levenshteinClose = (a, b) => {
        if (!a || !b) return false;
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0) return true;
        // Simple overlap heuristic
        const shared = shorter.split('').filter(c => longer.includes(c)).length;
        return shared / longer.length >= 0.6;
      };
      const matched = alts.some(a =>
        a === target ||
        a.includes(target) ||
        target.includes(a) ||
        levenshteinClose(a, target)
      );
      setRecResult(matched ? 'match' : 'nomatch');
      setListening(false);
      if (matched) { sSr('ok'); sSsc(s => s + 1); }
    };

    rec.onerror = (e) => {
      clearTimeout(timeoutRef.current);
      const code = e.error || e.type || '';
      // If language not supported, try next fallback
      if ((code === 'language-not-supported' || code === 'service-not-allowed') && lIdx < LANG_FALLBACKS.length - 1) {
        setLangIdx(lIdx + 1);
        startRecognition(lIdx + 1);
        return;
      }
      const msg = srError(code);
      setListening(false);
      if (msg) {
        setRecResult('error');
        setRecMsg(msg);
      } else {
        setRecResult(null);
      }
    };

    rec.onend = () => {
      clearTimeout(timeoutRef.current);
      setListening(false);
    };

    try {
      rec.start();
    } catch (e) {
      clearTimeout(timeoutRef.current);
      setListening(false);
      setRecResult('error');
      setRecMsg('Could not start microphone. Try refreshing the page.');
    }
  }

  async function startMic() {
    if (!SRSupported) return;
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      setRecResult('error');
      setRecMsg('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      return;
    }
    startRecognition(langIdx);
  }

  function stopMic() {
    clearTimeout(timeoutRef.current);
    if (recRef.current) { try { recRef.current.stop(); } catch (_) {} }
    setListening(false);
  }

  const currentLang = LANG_FALLBACKS[langIdx];

  return (
    <div className="scr-wrap">
      {H('🎤 Pronunciation Practice')}
      <Bar v={sx + 1} mx={si.length} color="#4d7c0f" h={6} />
      <div className="c" style={{textAlign:'center', marginTop:16}}>
        <p style={{fontSize:36, fontWeight:800, fontFamily:"'Playfair Display',serif"}}>{sw[0]}</p>
        {sw[2] && <p style={{fontSize:14, color:'#78716c', marginBottom:4}}>/{sw[2]}/</p>}
        <p style={{fontSize:16, color:'#44403c', marginBottom:16}}>{sw[1]}</p>
        <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:16, flexWrap:'wrap'}}>
          <Spk text={sw[0]} label="Normal" />
          <button
            onClick={() => speakSlow(sw[0])}
            style={{background:'rgba(77,124,15,.1)', border:'1px solid rgba(77,124,15,.2)', borderRadius:10, padding:'7px 12px', cursor:'pointer', fontSize:12, color:'#4d7c0f', fontWeight:700}}>
            🐢 Slow
          </button>
        </div>

        {SRSupported ? (
          <div style={{marginBottom:16}}>
            <button
              onClick={listening ? stopMic : startMic}
              style={{
                background: listening ? '#ef4444' : 'rgba(77,124,15,.15)',
                border: `1.5px solid ${listening ? '#ef4444' : 'rgba(77,124,15,.4)'}`,
                borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontSize: 14,
                color: listening ? '#fff' : '#4d7c0f', fontWeight: 800,
                animation: listening ? 'pulse 1s infinite' : undefined,
                boxShadow: listening ? '0 0 0 4px rgba(239,68,68,.2)' : undefined,
              }}>
              {listening ? '🔴 Listening… (tap to stop)' : '🎙️ Tap to Speak'}
            </button>
            {listening && (
              <div style={{fontSize:12, color:'#6b7280', marginTop:6, animation:'pulse 1.5s infinite'}}>
                Speak "{sw[0]}" into your mic…
              </div>
            )}
            {recResult === 'match' && (
              <div style={{color:'#4d7c0f', fontSize:15, fontWeight:800, marginTop:10, padding:'10px', background:'#f0fdf4', borderRadius:12, border:'1.5px solid #86efac'}}>
                🎯 Great pronunciation match!
              </div>
            )}
            {recResult === 'nomatch' && (
              <div style={{color:'#ea580c', fontSize:14, fontWeight:600, marginTop:10, padding:'10px', background:'#fff7ed', borderRadius:12, border:'1.5px solid #fdba74'}}>
                Close! Try again or use self-assessment below.
              </div>
            )}
            {(recResult === 'error' || recResult === 'timeout') && recMsg && (
              <div style={{color:'#64748b', fontSize:13, marginTop:10, padding:'10px 14px', background:'#f8fafc', borderRadius:12, border:'1.5px solid #e2e8f0', textAlign:'left', lineHeight:1.5}}>
                ⚠️ {recMsg}
              </div>
            )}
            {langIdx > 0 && (
              <div style={{fontSize:11, color:'#94a3b8', marginTop:6}}>
                Using {currentLang} recognition
              </div>
            )}
          </div>
        ) : (
          <div style={{fontSize:13, color:'#78716c', marginBottom:16, padding:'10px 14px', background:'#f8fafc', borderRadius:12, border:'1.5px solid #e2e8f0'}}>
            Speech recognition is not supported in this browser. Use the self-assessment button below, or try Chrome on desktop/Android.
          </div>
        )}

        <button className="b bs" onClick={() => { sSr('ok'); sSsc(s => s + 1); }}>
          👍 I Said It Correctly!
        </button>
        {sr === 'ok' && <div style={{color:'#4d7c0f', fontSize:20, fontWeight:800, marginTop:12}}>✓ Great pronunciation!</div>}
        {sr === 'ok' && (
          <button
            className="b bp"
            style={{marginTop:16}}
            onClick={() => {
              setRecResult(null);
              setRecMsg('');
              if (sx < si.length - 1) {
                const n = sx + 1; sSx(n); sSw(si[n]); sSr(null);
              } else {
                award(ssc * 5 + 5); setSt(s => ({...s, sp: s.sp + 1})); goBack();
              }
            }}>
            {sx < si.length - 1 ? 'Next →' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  );
}
