import React from 'react';

const TOPICS = [
  "Free conversation",
  "At the café",
  "Greetings & introductions",
  "Family",
  "Directions",
  "Shopping",
  "Food & restaurants",
  "Weather & seasons",
];

const LEVELS = ["A1", "A2", "B1", "B2"];

export default function LiveTutorSetup({
  goBack,
  level,
  setLevel,
  topic,
  setTopic,
  micPermission,
  audioStatus,
  testingAudio,
  audioTestResult,
  avatarError,
  setAvatarError,
  onTestSpeaker,
  onStart,
}) {
  return (
    <div className="c" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 16px 0' }}>
        <button onClick={goBack} className="b bp" style={{ padding:'8px 14px', fontSize:'var(--text-sm)', fontWeight:700 }}>
          ← Back
        </button>
        <div>
          <div style={{ fontSize:'var(--text-lg)', fontWeight:900, color:'var(--heading)' }}>Live Croatian Tutor</div>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)' }}>Speak Croatian with an adaptive AI tutor</div>
        </div>
      </div>

      {/* Avatar */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 16px 20px' }}>
        <div style={{ position:'relative', width:110, height:110, marginBottom:16 }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'rgba(212,0,45,.12)',
            border:'2px solid rgba(212,0,45,.25)',
          }}/>
          {!avatarError
            ? <img
                src="/images/portraits/tutor-hero.webp"
                alt="Marija — your Croatian tutor"
                loading="lazy"
                onError={() => setAvatarError(true)}
                style={{ width:110, height:110, borderRadius:'50%', objectFit:'cover', display:'block' }}
              />
            : <div style={{
                width:110, height:110, borderRadius:'50%',
                background:'rgba(212,0,45,.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:48,
              }}>👩‍🏫</div>
          }
        </div>
        <div style={{ fontSize:'var(--text-lg)', fontWeight:900, color:'var(--heading)' }}>Marija</div>
        <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>Native Croatian speaker · Split</div>
        <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:4, textAlign:'center', maxWidth:260, lineHeight:1.5 }}>
          I'll speak Croatian with you, adapt to your level, and help you break through comprehension gaps.
        </div>
      </div>

      {/* Mic permission banner */}
      {micPermission === 'denied' && (
        <div style={{
          margin:'0 16px 16px',
          padding:'12px 16px',
          borderRadius:12,
          background:'rgba(220,38,38,.07)',
          border:'1px solid rgba(220,38,38,.25)',
          display:'flex', alignItems:'flex-start', gap:10,
        }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🎙️</span>
          <div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'#b91c1c', marginBottom:2 }}>Microphone blocked</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.5 }}>
              To speak with Marija, allow microphone access in your browser's site settings, then reload the page. You can still practice by typing below.
            </div>
          </div>
        </div>
      )}
      {micPermission === 'unavailable' && (
        <div style={{
          margin:'0 16px 16px',
          padding:'12px 16px',
          borderRadius:12,
          background:'rgba(0,0,0,.04)',
          border:'1px solid var(--card-b)',
          display:'flex', alignItems:'flex-start', gap:10,
        }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🎙️</span>
          <div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--heading)', marginBottom:2 }}>No microphone detected</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.5 }}>
              Connect a microphone to speak with Marija. You can still practice by typing.
            </div>
          </div>
        </div>
      )}
      {micPermission === 'prompt' && (
        <div style={{
          margin:'0 16px 16px',
          padding:'12px 16px',
          borderRadius:12,
          background:'rgba(59,130,246,.07)',
          border:'1px solid rgba(59,130,246,.25)',
          display:'flex', alignItems:'flex-start', gap:10,
        }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🎙️</span>
          <div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'#1d4ed8', marginBottom:2 }}>Microphone needed</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.5 }}>
              When you start, your browser will ask to use your microphone. Tap <strong>Allow</strong> to speak with Marija.
            </div>
          </div>
        </div>
      )}

      {/* Audio output banner + speaker test */}
      {audioStatus === 'no-output' && (
        <div style={{
          margin:'0 16px 16px',
          padding:'12px 16px',
          borderRadius:12,
          background:'rgba(220,38,38,.07)',
          border:'1px solid rgba(220,38,38,.25)',
          display:'flex', alignItems:'flex-start', gap:10,
        }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🔇</span>
          <div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'#b91c1c', marginBottom:2 }}>No audio output detected</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.5 }}>
              Check that your speaker or headphones are connected and your device volume is turned up. Marija's voice won't be audible otherwise.
            </div>
          </div>
        </div>
      )}
      {audioStatus === 'suspended' && (
        <div style={{
          margin:'0 16px 16px',
          padding:'12px 16px',
          borderRadius:12,
          background:'rgba(245,158,11,.07)',
          border:'1px solid rgba(245,158,11,.3)',
          display:'flex', alignItems:'flex-start', gap:10,
        }}>
          <span style={{ fontSize:18, flexShrink:0 }}>🔈</span>
          <div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'#92400e', marginBottom:2 }}>Audio not yet unlocked</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.5 }}>
              Tap anywhere on the page before starting — your browser requires a tap to enable audio playback.
            </div>
          </div>
        </div>
      )}

      {/* Speaker test — always shown so users can verify before starting */}
      <div style={{ margin:'0 16px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button
          onClick={onTestSpeaker}
          disabled={testingAudio}
          style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'8px 14px', borderRadius:10,
            border:'1.5px solid var(--card-b)',
            background: audioTestResult === 'ok' ? 'rgba(22,163,74,.08)' : audioTestResult === 'fail' ? 'rgba(220,38,38,.07)' : 'var(--card)',
            borderColor: audioTestResult === 'ok' ? 'rgba(22,163,74,.35)' : audioTestResult === 'fail' ? 'rgba(220,38,38,.3)' : 'var(--card-b)',
            color:'var(--heading)', fontSize:'var(--text-xs)', fontWeight:700,
            cursor: testingAudio ? 'wait' : 'pointer',
            transition:'all .15s',
          }}
        >
          <span aria-hidden="true">{testingAudio ? '⏳' : audioTestResult === 'ok' ? '✅' : audioTestResult === 'fail' ? '❌' : '🔊'}</span>
          {testingAudio ? 'Testing…' : audioTestResult === 'ok' ? 'Speaker working' : audioTestResult === 'fail' ? 'No sound — check volume' : 'Test speaker'}
        </button>
        <span style={{ fontSize:'var(--text-xs)', color:'var(--subtext)' }}>
          {audioTestResult === 'ok'
            ? 'Audio is working — you\'re ready to go'
            : audioTestResult === 'fail'
            ? 'Check your volume and headphone connection'
            : 'Tap to verify your speakers before starting'}
        </span>
      </div>

      {/* Settings card */}
      <div style={{ margin:'0 16px', background:'var(--card)', borderRadius:16, border:'1px solid var(--card-b)', padding:'18px 16px' }}>
        {/* Level */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--heading)', marginBottom:8, letterSpacing:'0.04em', textTransform:'uppercase' }}>Your Level</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                style={{
                  padding:'10px 4px',
                  borderRadius:10,
                  border: level === l ? '2px solid #D4002D' : '2px solid var(--card-b)',
                  background: level === l ? 'rgba(212,0,45,.08)' : 'var(--card)',
                  color: level === l ? '#D4002D' : 'var(--subtext)',
                  fontWeight: level === l ? 900 : 600,
                  fontSize:'var(--text-sm)',
                  cursor:'pointer',
                  transition:'all .15s',
                }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--heading)', marginBottom:8, letterSpacing:'0.04em', textTransform:'uppercase' }}>Conversation Topic</div>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            style={{
              width:'100%', padding:'10px 12px',
              borderRadius:10, border:'1.5px solid var(--card-b)',
              background:'var(--card)', color:'var(--heading)',
              fontSize:'var(--text-sm)', fontWeight:600,
              cursor:'pointer',
            }}
          >
            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Start button */}
      <div style={{ padding:'20px 16px 0' }}>
        <button
          onClick={onStart}
          style={{
            width:'100%', padding:'16px',
            borderRadius:14,
            background:'linear-gradient(135deg,#D4002D,#b91c1c)',
            color:'white', border:'none',
            fontSize:'var(--text-sm)', fontWeight:900,
            cursor:'pointer', letterSpacing:'0.02em',
            boxShadow:'0 4px 16px rgba(212,0,45,.35)',
          }}
        >
          Start Speaking with Marija
        </button>
      </div>
    </div>
  );
}
