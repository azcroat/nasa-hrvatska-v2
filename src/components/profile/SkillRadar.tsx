import React, { useState, useEffect } from 'react';

export default function SkillRadar({ st }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const skills = [
    { label: 'Vocab',    score: Math.min(100, (st.wl    || 0) / 2) },
    { label: 'Grammar',  score: Math.min(100, (st.gc    || 0) * 10) },
    { label: 'Listening',score: Math.min(100, (st.listen|| 0) * 20) },
    { label: 'Speaking', score: Math.min(100, (st.speak || 0) * 10) },
    { label: 'Reading',  score: Math.min(100, (st.rc    || 0) * 5) },
  ];

  const cx = 100, cy = 100, R = 80;
  const angles = [0, 72, 144, 216, 288]; // degrees, top = Vocab

  function polarToXY(angleDeg, r) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function pentagonPoints(r) {
    return angles.map(a => {
      const p = polarToXY(a, r);
      return `${p.x},${p.y}`;
    }).join(' ');
  }

  const dataPoints = animated
    ? skills.map((s, i) => polarToXY(angles[i], (s.score / 100) * R))
    : skills.map((_, i) => polarToXY(angles[i], 0));

  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  const weakIdx = skills.reduce((minI, s, i, arr) => s.score < arr[minI].score ? i : minI, 0);

  const labelOffsets = [
    { dx: 0,   dy: -12 }, // top (Vocab)
    { dx: 14,  dy: -6  }, // upper-right (Grammar)
    { dx: 10,  dy: 12  }, // lower-right (Listening)
    { dx: -10, dy: 12  }, // lower-left (Speaking)
    { dx: -14, dy: -6  }, // upper-left (Reading)
  ];

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-b)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
        📊 Skill Profile
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
          {/* Guide pentagons at 25%, 50%, 75% */}
          {[0.25, 0.5, 0.75].map(pct => (
            <polygon
              key={pct}
              points={pentagonPoints(R * pct)}
              fill="none"
              stroke="var(--bar-bg)"
              strokeWidth="1"
            />
          ))}
          {/* Outer pentagon */}
          <polygon points={pentagonPoints(R)} fill="none" stroke="var(--bar-bg)" strokeWidth="1.5" />
          {/* Axis lines */}
          {angles.map((a, i) => {
            const p = polarToXY(a, R);
            return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--bar-bg)" strokeWidth="1" />;
          })}
          {/* Data polygon */}
          <polygon
            points={dataPolygon}
            fill="var(--accent, var(--info))"
            fillOpacity="0.25"
            stroke="var(--accent, var(--info))"
            strokeWidth="2"
            style={{ transition: animated ? 'all 0.6s ease' : 'none' }}
          />
          {/* Data point dots */}
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent, var(--info))" />
          ))}
          {/* Labels */}
          {skills.map((s, i) => {
            const vertex = polarToXY(angles[i], R);
            const off = labelOffsets[i];
            const lx = vertex.x + off.dx * 2.2;
            const ly = vertex.y + off.dy * 2.2;
            return (
              <g key={i}>
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="700" fill="var(--subtext)">
                  {s.label}
                </text>
                <text x={lx} y={ly + 10} textAnchor="middle" dominantBaseline="middle"
                  fontSize="8" fontWeight="600" fill="var(--accent, var(--info))">
                  {Math.round(s.score)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Horizontal skill bars */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {skills.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 58, fontSize: 11, fontWeight: 700, color: 'var(--subtext)', textAlign: 'right', flexShrink: 0 }}>
              {s.label}
            </div>
            <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--bar-bg)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: i === weakIdx ? 'var(--error)' : 'var(--accent, var(--info))',
                width: animated ? `${s.score}%` : '0%',
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ width: 30, fontSize: 10, fontWeight: 700, color: 'var(--subtext)' }}>
              {Math.round(s.score)}%
            </div>
            {i === weakIdx && (
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--error)', whiteSpace: 'nowrap' }}>
                Focus here →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
