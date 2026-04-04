import React, { useEffect } from 'react';
import { H, READ } from '../../data.jsx';

const LEVEL_META = {
  beginner:    { badge: "A1/A2", color: "#16a34a", label: "Beginner" },
  intermediate:{ badge: "B1",    color: "#2563eb", label: "Intermediate" },
  advanced:    { badge: "B1-B2", color: "#7c3aed", label: "Advanced" },
  b2:          { badge: "B2",    color: "#b45309", label: "Upper-Intermediate" },
  c1:          { badge: "C1",    color: "#dc2626", label: "Advanced" },
};

function launchPassage(p, { sRp, sRph, sRqi, sRsc, sRa, sRsl, sHw, setScr, sCurEx }) {
  sRp(p); sRph("read"); sRqi(0); sRsc(0); sRa(false); sRsl(-1); sHw(null);
  setScr("reading");
  sCurEx("reading_" + (p.title || 'passage').replace(/\s+/g, '_'));
}

export default function ReadingList({ setScr, sRp, sRph, sRqi, sRsc, sRa, sRsl, sHw, sCurEx, goBack }) {
  // Level filter set by learn-path items (e.g. "Read a Story" shows beginner only).
  // When launched from the Learn tab directly, no filter is set and all levels show.
  let levelFilter = null;
  try {
    const raw = sessionStorage.getItem('nh_readlist_filter');
    if (raw) levelFilter = JSON.parse(raw);
  } catch {}

  const allEntries = Object.entries(READ);
  const filteredEntries = levelFilter
    ? allEntries.filter(([level]) => levelFilter.includes(level))
    : allEntries;

  // When launched from the learn path (filter is set), auto-select one passage
  // and navigate directly to it — no list browsing required.
  useEffect(() => {
    if (!levelFilter) return;
    const firstPassage = filteredEntries[0]?.[1]?.[0];
    if (!firstPassage) return;
    // Clear filter so returning from reading doesn't re-trigger this
    sessionStorage.removeItem('nh_readlist_filter');
    launchPassage(firstPassage, { sRp, sRph, sRqi, sRsc, sRa, sRsl, sHw, setScr, sCurEx });
  }, []);

  // ── Manual browse mode (launched directly from Practice/Learn tabs) ────────
  const totalPassages = filteredEntries.reduce((sum, [, passages]) => sum + passages.length, 0);
  const levelCount = filteredEntries.length;

  return (
    <div className="scr-wrap">
      {H("📖 Reading Passages", "", goBack)}
      <div style={{textAlign:"center",fontSize:13,color:"#78716c",marginBottom:16}}>
        {totalPassages} passages across {levelCount} levels — choose one to read and quiz
      </div>
      {filteredEntries.map(([level, passages]) => {
        const meta = LEVEL_META[level] || { badge: level.toUpperCase(), color: "#78716c", label: level };
        return (
          <React.Fragment key={level}>
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"18px 0 8px"}}>
              <h3 className="sh" style={{margin:0}}>{meta.label}</h3>
              <span style={{
                background: meta.color, color: "#fff",
                borderRadius: 4, fontSize: 11, fontWeight: 700,
                padding: "2px 7px", letterSpacing: "0.04em",
              }}>{meta.badge}</span>
              <span style={{fontSize:12,color:"#78716c",marginLeft:"auto"}}>
                {passages.length} passages
              </span>
            </div>
            {passages.map((p, i) => (
              <button key={i}
                onClick={() => launchPassage(p, { sRp, sRph, sRqi, sRsc, sRa, sRsl, sHw, setScr, sCurEx })}
                style={{
                  display: "flex", alignItems: "center", gap: 16, marginBottom: 10,
                  width: "100%", textAlign: "left",
                  background: "var(--card)", border: "1px solid var(--card-b)",
                  borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: meta.color + '18', border: `1.5px solid ${meta.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--heading)", lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>{p.tEn}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: meta.color, fontWeight: 700 }}>
                    {meta.badge} · Read &amp; Quiz
                  </div>
                </div>
                <span style={{ fontSize: 18, color: meta.color, flexShrink: 0 }}>›</span>
              </button>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
