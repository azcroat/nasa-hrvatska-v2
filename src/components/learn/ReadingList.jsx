import React from 'react';
import { H, READ } from '../../data.jsx';

const LEVEL_META = {
  beginner:    { badge: "A1/A2", color: "#16a34a" },
  intermediate:{ badge: "B1",    color: "#2563eb" },
  advanced:    { badge: "B1-B2", color: "#7c3aed" },
  b2:          { badge: "B2",    color: "#b45309" },
  c1:          { badge: "C1",    color: "#dc2626" },
};

export default function ReadingList({ setScr, sRp, sRph, sRqi, sRsc, sRa, sRsl, sHw, sCurEx, goBack }) {
  const entries = Object.entries(READ);
  const totalPassages = entries.reduce((sum, [, passages]) => sum + passages.length, 0);
  const levelCount = entries.length;

  return (
    <div className="scr-wrap">
      {H("📖 Reading Passages")}
      <div style={{textAlign:"center",fontSize:13,color:"#78716c",marginBottom:16}}>
        {totalPassages} passages across {levelCount} levels
      </div>
      {entries.map(([level, passages]) => {
        const meta = LEVEL_META[level] || { badge: level.toUpperCase(), color: "#78716c" };
        const displayName = level.charAt(0).toUpperCase() + level.slice(1);
        return (
          <React.Fragment key={level}>
            <div style={{display:"flex",alignItems:"center",gap:8,margin:"18px 0 8px"}}>
              <h3 className="sh" style={{margin:0}}>{displayName}</h3>
              <span style={{
                background: meta.color,
                color: "#fff",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 7px",
                letterSpacing: "0.04em"
              }}>{meta.badge}</span>
              <span style={{fontSize:12,color:"#78716c",marginLeft:"auto"}}>
                {passages.length} passages
              </span>
            </div>
            {passages.map((p, i) => (
              <div key={i} className="tc"
                onClick={() => { sRp(p); sRph("read"); sRqi(0); sRsc(0); sRa(false); sRsl(-1); sHw(null); setScr("reading"); sCurEx("reading"); }}
                style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                <div style={{ fontSize: 28 }}>📄</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "#78716c" }}>{p.tEn}</div>
                </div>
              </div>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
