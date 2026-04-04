import React from 'react';
import SpeakingAvatar, { portraitSrc } from './SpeakingAvatar.jsx';
import TappableMessage from './TappableMessage.jsx';
import WaveformVisualizer from '../shared/WaveformVisualizer.jsx';
import { STARTERS, sceneForCat } from './ConversationScenarios.js';

export default function AIConversationChat({
  scenario,
  level,
  messages,
  corrections,
  loading,
  chatError,
  sendError,
  input,
  setInput,
  listening,
  isSpeaking,
  npcVideoUrl,
  npcVideoLoading,
  muted,
  setMuted,
  showStarters,
  setShowStarters,
  userCount,
  isOnline,
  hasSpeechAPI,
  messagesEndRef,
  inputRef,
  onSend,
  onSendError,
  onToggleVoice,
  onHint,
  onRetryOpener,
  onReset,
  onEndEvaluate,
  onWordClick,
  onSpeakMessage,
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "var(--app-bg)",
      display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif" }}>

      {/* Header — immersive scene background */}
      <div style={{
        background: `linear-gradient(135deg,rgba(6,14,30,0.91) 0%,rgba(10,40,84,0.84) 60%,rgba(14,74,110,0.80) 100%), url('${sceneForCat(scenario.cat)}') center / cover no-repeat`,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        boxShadow: "0 2px 16px rgba(0,0,0,.30)",
      }}>
        <button
          onClick={() => {
            if (messages.length > 0 && !window.confirm("Leave this conversation? Your progress will be lost.")) return;
            onReset();
          }}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "4px 6px",
            color: "rgba(255,255,255,0.80)", lineHeight: 1, borderRadius: 8 }}>←</button>
        <div style={{ position:"relative", flexShrink:0 }}>
          <SpeakingAvatar
            src={portraitSrc(scenario.id)}
            name={scenario.aiName}
            size={40}
            isSpeaking={isSpeaking}
            videoUrl={npcVideoUrl}
          />
          <div style={{ position:"absolute", bottom:0, right:0, width:12, height:12, borderRadius:"50%",
            background:"#22c55e", border:"2px solid rgba(255,255,255,0.2)" }} />
          {npcVideoLoading && !npcVideoUrl && (
            <div style={{
              position:'absolute', bottom:-2, right:-2, width:14, height:14,
              borderRadius:'50%', border:'2px solid rgba(14,116,144,.5)',
              borderTopColor:'#67e8f9', animation:'spin 1s linear infinite',
            }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{scenario.aiName}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.72)" }}>
            {isSpeaking ? <span style={{color:"#67e8f9",fontWeight:700}}>● Speaking Croatian…</span> : `${scenario.title} · Level ${level}`}
          </div>
        </div>
        <button
          onClick={() => setMuted(m => !m)}
          style={{
            background:'rgba(255,255,255,0.10)', border:'1.5px solid rgba(255,255,255,0.22)', borderRadius:8,
            padding:'6px 10px', cursor:'pointer', fontSize:14,
            color: muted ? 'rgba(255,255,255,0.50)' : '#67e8f9',
            fontFamily:"'Outfit',sans-serif",
          }}
          aria-label={muted ? 'Unmute NPC audio' : 'Mute NPC audio'}
          aria-pressed={muted}
        >
          <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
        </button>
        <button onClick={onEndEvaluate} disabled={loading || userCount < 2 || !!chatError}
          style={{ padding: "7px 13px", borderRadius: 10, border: "1.5px solid", fontWeight: 700, fontSize: "var(--text-sm)",
            cursor: (userCount >= 2 && !chatError && !loading) ? "pointer" : "not-allowed",
            fontFamily: "'Outfit',sans-serif", transition: "all .15s", whiteSpace: "nowrap",
            borderColor: (userCount >= 2 && !chatError) ? "#67e8f9" : "rgba(255,255,255,0.18)",
            background: (userCount >= 2 && !chatError) ? "rgba(14,116,144,0.45)" : "rgba(255,255,255,0.08)",
            color: (userCount >= 2 && !chatError) ? "#e0f9ff" : "rgba(255,255,255,0.40)",
            opacity: loading ? 0.5 : 1 }}>
          End & Evaluate
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Context pill */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--subtext)", background: "var(--bar-bg)", padding: "4px 12px", borderRadius: 20 }}>
            {scenario.hr} · {level}
          </span>
        </div>
        {/* Tap-to-translate hint */}
        {messages.length > 0 && (
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--info)", background: "var(--info-bg)",
              padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
              Tap any Croatian word to translate
            </span>
          </div>
        )}

        {/* Error state */}
        {chatError && messages.length === 0 && !loading && (
          <div style={{ background: "var(--error-bg)", border: "1.5px solid var(--error-b)", borderRadius: 16, padding: 20, margin: "8px 0", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--error)", marginBottom: 8 }}>Could not connect to AI</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.65, marginBottom: 16, textAlign: "left",
              background: "var(--card)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--error-b)" }}>
              {chatError}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={onRetryOpener}
                style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: "var(--info)",
                  color: "var(--card)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Try Again
              </button>
              <button onClick={onReset}
                style={{ padding: "10px 20px", borderRadius: 12, border: "1.5px solid var(--card-b)", background: "var(--card)",
                  color: "var(--subtext)", fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                Back to Scenarios
              </button>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((m, i) => {
          if (m.role === "hint") return (
            <div key={i} style={{ background: "var(--warning-bg)", border: "1.5px solid var(--warning-b)", borderRadius: 14,
              padding: "12px 14px", fontSize: "var(--text-sm)", color: "var(--body)", lineHeight: 1.6 }}>
              💡 <strong>Hint:</strong> {m.content}
            </div>
          );

          const isUser = m.role === "user";
          const correction = corrections[i];

          return (
            <React.Fragment key={i}>
              <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                {!isUser && (
                  <SpeakingAvatar src={portraitSrc(scenario.id)} name={scenario.aiName} size={30} isSpeaking={false} />
                )}
                <div
                  onClick={() => { if (!isUser) onSpeakMessage(m.content); }}
                  style={{ maxWidth: "78%", padding: "11px 14px", lineHeight: 1.55, fontSize: 15, fontWeight: 500,
                    background: isUser ? "linear-gradient(135deg,#0e7490,#0c4a6e)" : "var(--card)",
                    color: isUser ? "white" : "var(--heading)",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    border: isUser ? "none" : "1px solid var(--card-b)",
                    boxShadow: "0 1px 4px rgba(0,0,0,.07)",
                    cursor: !isUser ? "pointer" : "default" }}
                >
                  {!isUser ? <TappableMessage text={m.content} onWordClick={onWordClick} /> : m.content}
                  {!isUser && <span style={{ fontSize: "var(--text-xs)", opacity: .4, marginLeft: 5 }} aria-hidden="true">🔊</span>}
                  {!isUser && m.gloss && m.scaffolding >= 1 && (
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid var(--card-b)",
                      fontSize: "var(--text-xs)", color: "var(--subtext)", lineHeight: 1.5, fontStyle: "italic" }}>
                      {m.gloss}
                    </div>
                  )}
                </div>
              </div>

              {isUser && correction && (
                <div style={{ alignSelf: "flex-end", maxWidth: "78%", marginTop: -6,
                  background: "var(--success-bg)", border: "1px solid var(--success-b)", borderRadius: "0 0 14px 14px",
                  padding: "8px 14px", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--success)", fontWeight: 800 }}>✏️ Better: </span>
                  <span style={{ color: "var(--success)", fontWeight: 900 }}>{correction.corrected}</span>
                  {(correction.explanation || correction.note) && (
                    <div style={{ color: "var(--success)", opacity: .75, marginTop: 2 }}>{correction.explanation || correction.note}</div>
                  )}
                  {correction.echo && (
                    <div style={{ color: "var(--success)", opacity: .85, marginTop: 6, paddingTop: 6,
                      borderTop: "1px solid var(--success-b)", fontSize: "var(--text-xs)" }}>
                      <span style={{ fontWeight: 700 }}>🔁 Now try: </span>
                      <em>{correction.echo}</em>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Inline send error */}
        {sendError && !loading && (
          <div style={{ background: "var(--error-bg)", border: "1.5px solid var(--error-b)", borderRadius: 12,
            padding: "12px 14px", fontSize: "var(--text-sm)", color: "var(--error)", lineHeight: 1.6, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <div>
              <strong>Send failed:</strong> {sendError}
              <button onClick={onSendError}
                style={{ display: "block", marginTop: 6, padding: "4px 12px", borderRadius: 8, border: "none",
                  background: "var(--error)", color: "white", fontSize: "var(--text-xs)", fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif" }}>
                Dismiss (your message is restored in the input)
              </button>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%",
              background: `linear-gradient(135deg,${scenario.color},${scenario.color}99)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-base)" }}>
              {scenario.icon}
            </div>
            <div style={{ padding: "12px 16px", background: "var(--card)", borderRadius: "18px 18px 18px 4px",
              border: "1px solid var(--card-b)", display: "flex", gap: 4, alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              {[0, 1, 2].map(j => (
                <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--subtext)",
                  animation: `pulse 1.2s ease-in-out ${j * 0.22}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ background: "var(--card)", borderTop: "1px solid var(--card-b)", padding: "10px 14px 14px", flexShrink: 0,
        paddingBottom: "max(14px,env(safe-area-inset-bottom))" }}>
        {chatError && messages.length === 0 ? (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={onRetryOpener}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
                background: "var(--info)", color: "var(--card)", fontWeight: 700,
                fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Try Again
            </button>
            <button onClick={onReset}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12,
                border: "1.5px solid var(--card-b)", background: "var(--card)",
                color: "var(--subtext)", fontWeight: 700, fontSize: "var(--text-sm)",
                cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
              Change Scenario
            </button>
          </div>
        ) : (
          <>
            {listening && (
              <div style={{ marginBottom: 8 }}>
                <WaveformVisualizer active={listening} color="#0e7490" height={44} />
              </div>
            )}

            {showStarters && (
              <div style={{ overflowX: "auto", display: "flex", gap: 7, paddingBottom: 8, paddingTop: 2,
                scrollbarWidth: "none" }}>
                {(STARTERS[level] || STARTERS.B1).map((s, i) => (
                  <button key={i}
                    onClick={() => { setInput(s); setShowStarters(false); inputRef.current?.focus(); }}
                    style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 20,
                      border: "1.5px solid var(--info)", background: "var(--info-bg)", color: "var(--info)",
                      fontSize: "var(--text-sm)", fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                      whiteSpace: "nowrap" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => { setInput(e.target.value); if (sendError) onSendError(); }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                placeholder={isOnline ? "Piši na hrvatskom…" : "Offline — reconnect to continue…"}
                disabled={loading || !isOnline || (chatError && messages.length === 0)}
                style={{ flex: 1, padding: "11px 14px", fontSize: 15, borderRadius: 12,
                  border: `1.5px solid ${sendError ? "var(--error-b)" : "var(--card-b)"}`,
                  background: "var(--bar-bg)", outline: "none", fontFamily: "'Outfit',sans-serif",
                  transition: "border-color .2s", color: "var(--heading)" }}
              />
              {hasSpeechAPI && (
                <button
                  onClick={onToggleVoice}
                  disabled={loading || !isOnline}
                  title={listening ? "Stop listening" : "Speak in Croatian (hr-HR)"}
                  style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, fontSize: 18, cursor: "pointer",
                    border: `2px solid ${listening ? "var(--error)" : "var(--card-b)"}`,
                    background: listening ? "var(--error-bg)" : "var(--card)",
                    color: listening ? "var(--error)" : "var(--subtext)",
                    animation: listening ? "pulse 1s ease-in-out infinite" : "none",
                    transition: "all .15s" }}>
                  🎤
                </button>
              )}
              <button
                onClick={onSend}
                disabled={loading || !input.trim() || !isOnline}
                style={{ width: 44, height: 44, borderRadius: 12, border: "none", flexShrink: 0, fontSize: 18,
                  cursor: input.trim() && !loading ? "pointer" : "not-allowed", transition: "all .15s",
                  background: input.trim() && !loading ? "linear-gradient(135deg,var(--info),#0c4a6e)" : "var(--bar-bg)",
                  color: input.trim() && !loading ? "var(--card)" : "var(--subtext)" }}>
                ➤
              </button>
            </div>

            {/* Bottom toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={onHint} disabled={loading || messages.length === 0}
                  style={{ background: "none", border: "none", fontSize: "var(--text-sm)", color: "var(--subtext)", cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif", fontWeight: 600, padding: "2px 0", opacity: loading ? 0.4 : 1 }}>
                  💡 Hint
                </button>
                <span style={{ color: "var(--card-b)", fontSize: "var(--text-base)" }}>|</span>
                <button
                  onClick={() => setShowStarters(p => !p)}
                  style={{ background: showStarters ? "var(--info)" : "none",
                    border: `1.5px solid ${showStarters ? "var(--info)" : "var(--card-b)"}`,
                    borderRadius: 10, fontSize: "var(--text-sm)", padding: "2px 10px",
                    color: showStarters ? "var(--card)" : "var(--subtext)",
                    cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600,
                    transition: "all .15s" }}>
                  💬 Phrases
                </button>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", fontWeight: 500 }}>
                {userCount} {userCount === 1 ? "exchange" : "exchanges"}
                {userCount < 2 && " · needs 2 to evaluate"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
