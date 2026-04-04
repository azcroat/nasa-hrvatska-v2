import React from 'react';
import { getSR, getDueReviews, getMistakes } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';

function getNextReviewDue() {
  try {
    const sr = getSR();
    const now = Date.now();
    let soonest = Infinity;
    for (const word in sr) {
      const due = sr[word]?.due;
      if (due && due > now && due < soonest) soonest = due;
    }
    if (!isFinite(soonest)) return null;
    const diffMs = soonest - now;
    const diffH = diffMs / 3600000;
    if (diffH < 1) return `${Math.max(1, Math.round(diffMs / 60000))} min`;
    if (diffH < 24) return `${Math.round(diffH)} hr`;
    return `${Math.round(diffH / 24)} day${Math.round(diffH / 24) !== 1 ? 's' : ''}`;
  } catch { return null; }
}

export default function ReviewTabContent() {
  const { setScr } = useApp();

  const due = getDueReviews();
  const mistakes = getMistakes();

  return (
    <React.Fragment>

      {/* ── REVIEW & REINFORCE HEADER ── */}
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:8}}>
        <div style={{width:3, height:20, background:'var(--lavender, #7c3aed)', borderRadius:2}}/>
        <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Review & Reinforce</span>
      </div>

      {/* ── SRS REVIEW NUDGE ── */}
      {due.length === 0 ? (() => {
        const nextDue = getNextReviewDue();
        return (
          <div style={{fontSize:12, color:'var(--subtext)', textAlign:'center', padding:'4px 0'}}>
            {nextDue
              ? `No reviews due right now — next batch ready in ${nextDue}`
              : 'No reviews due — keep completing lessons to build your deck'}
          </div>
        );
      })() : (() => {
        const sr = getSR(); const allR = Object.values(sr);
        const masteryPct = allR.length > 0
          ? Math.round(allR.reduce((s,v) => s + (v.r||0)/Math.max((v.r||0)+v.w,1), 0) / allR.length * 100)
          : 0;
        return (
          <div
            onClick={() => setScr("review")}
            style={{
              background: "linear-gradient(135deg,var(--info-bg),rgba(14,116,144,.1))",
              border: "1.5px solid var(--info-b)",
              borderRadius: 18, padding: "14px 18px", marginBottom: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 4px 16px rgba(14,116,144,.15)",
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,#0e7490,#0284c7)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              boxShadow: "0 4px 12px rgba(14,116,144,.35)",
            }}>🧠</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--info)" }}>
                {due.length} Word{due.length !== 1 ? "s" : ""} Ready to Review
              </div>
              <div style={{ fontSize: 11, color: "var(--info)", fontWeight: 600, marginTop: 2, opacity: .75 }}>
                Spaced Repetition · Tap to review now →
              </div>
              {(() => {
                const nextDue = getNextReviewDue();
                return nextDue ? (
                  <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 2, fontStyle: 'italic' }}>
                    Next batch due in {nextDue}
                  </div>
                ) : null;
              })()}
            </div>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--info)", lineHeight: 1 }}>{due.length}</div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 20, padding: '2px 7px', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                ✦ {masteryPct}% mastered
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MISTAKES REVIEW NUDGE ── */}
      {mistakes.length > 0 && (() => {
        const topMistake = mistakes.sort((a, b) => b.count - a.count)[0];
        const worst = mistakes[0];
        const conf = Math.max(10, 100 - worst.count * 12);
        const chipBg = conf > 60 ? 'linear-gradient(135deg,#d97706,#b45309)' : 'linear-gradient(135deg,#dc2626,#b91c1c)';
        return (
          <div
            onClick={() => setScr("mistakes")}
            style={{
              background: "linear-gradient(135deg,var(--warning-bg),rgba(217,119,6,.1))",
              border: "1.5px solid var(--warning-b)",
              borderRadius: 18, padding: "14px 18px", marginBottom: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 4px 16px rgba(217,119,6,.15)",
            }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: "linear-gradient(135deg,#d97706,#b45309)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              boxShadow: "0 4px 12px rgba(217,119,6,.35)",
            }}>📚</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--warning)" }}>
                {mistakes.length} Mistake{mistakes.length !== 1 ? "s" : ""} to Master
              </div>
              <div style={{ fontSize: 11, color: "var(--warning)", fontWeight: 600, marginTop: 2, opacity: .8 }}>
                Most missed: <strong>{topMistake?.hr}</strong> · Tap to review →
              </div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: chipBg, borderRadius: 20, padding: '3px 8px', flexShrink: 0, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
              ✦ {conf}% ready
            </div>
          </div>
        );
      })()}

      {/* Empty state when nothing to review */}
      {due.length === 0 && mistakes.length === 0 && (
        <div className="c" style={{padding:'24px 16px', textAlign:'center', marginBottom:16}}>
          <div style={{fontSize:40, marginBottom:12}}>✨</div>
          <div style={{fontSize:14, fontWeight:800, color:'var(--heading)', marginBottom:6}}>All caught up!</div>
          <div style={{fontSize:12, color:'var(--subtext)', lineHeight:1.5}}>
            No words due for review right now. Keep learning to build your review queue.
          </div>
        </div>
      )}

    </React.Fragment>
  );
}
