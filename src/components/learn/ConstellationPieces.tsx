// ── GrammarConstellation — shared UI sub-components ───────────
import React from 'react';

export function ConstellationBackground() {
  const points = [
    [60, 40],
    [180, 80],
    [300, 30],
    [420, 70],
    [520, 45],
    [640, 85],
    [740, 50],
    [100, 150],
    [250, 130],
    [380, 160],
    [500, 120],
    [620, 155],
    [720, 130],
    [40, 220],
    [160, 200],
    [320, 240],
    [460, 210],
    [580, 230],
    [700, 200],
  ];
  const connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [0, 7],
    [2, 8],
    [4, 10],
    [6, 12],
    [7, 13],
    [8, 14],
    [9, 15],
    [10, 16],
    [11, 17],
    [12, 18],
  ];

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.12,
        pointerEvents: 'none',
      }}
      viewBox="0 0 780 280"
      preserveAspectRatio="xMidYMid slice"
    >
      {connections.map(([a, b], i) => {
        const pa = points[a ?? 0] ?? [0, 0];
        const pb = points[b ?? 0] ?? [0, 0];
        return (
          <line
            key={i}
            x1={pa[0]}
            y1={pa[1]}
            x2={pb[0]}
            y2={pb[1]}
            stroke="#60a5fa"
            strokeWidth="0.8"
          />
        );
      })}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.5 : 1.5} fill="#93c5fd" />
      ))}
    </svg>
  );
}

interface EndingsTableProps {
  endings: { m: string; f: string; n: string };
}
export function EndingsTable({ endings }: EndingsTableProps) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {[
        ['M', endings.m] as [string, string],
        ['F', endings.f] as [string, string],
        ['N', endings.n] as [string, string],
      ].map(([label, val]) => (
        <div
          key={label}
          style={{
            flex: 1,
            background: '#f1f5f9',
            borderRadius: 6,
            padding: '4px 0',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
            {val}
          </div>
        </div>
      ))}
    </div>
  );
}

interface CaseExample {
  hr: string;
  en: string;
}
interface CaseDataType {
  id: string;
  name: string;
  abbr: string;
  color: string;
  question: string;
  shortDesc: string;
  pattern: string;
  examples: CaseExample[];
  tip: string;
  endings: { m: string; f: string; n: string };
}
interface CaseCardProps {
  caseData: CaseDataType;
  expanded: boolean;
  onToggle: () => void;
}
export function CaseCard({ caseData, expanded, onToggle }: CaseCardProps) {
  const { name, abbr, color, question, shortDesc, pattern, examples, tip, endings } = caseData;

  return (
    <div
      onClick={onToggle}
      style={{
        background: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: expanded
          ? `0 4px 20px ${color}33, 0 1px 4px rgba(0,0,0,0.08)`
          : '0 1px 4px rgba(0,0,0,0.08)',
        border: `2px solid ${expanded ? color : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        gridColumn: caseData.id === 'instrumental' ? '1 / -1' : undefined,
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: color,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            background: 'rgba(255,255,255,0.25)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 20,
            letterSpacing: '0.05em',
          }}
        >
          {abbr}
        </span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, flex: 1 }}>{name}</span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Question */}
      <div style={{ padding: '8px 12px 6px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: color, lineHeight: 1.3 }}>
          {question}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid #f1f5f9` }}>
          <p style={{ margin: '8px 0 6px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
            {shortDesc}
          </p>

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontStyle: 'italic' }}>
            {pattern}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {examples.map((ex: CaseExample, i: number) => (
              <div
                key={i}
                style={{
                  background: '#f8fafc',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: '0 6px 6px 0',
                  padding: '5px 8px',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{ex.hr}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{ex.en}</div>
              </div>
            ))}
          </div>

          <EndingsTable endings={endings} />

          <div
            style={{
              marginTop: 8,
              background: `${color}12`,
              border: `1px solid ${color}30`,
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              color: '#374151',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 700, color: color }}>Tip: </span>
            {tip}
          </div>
        </div>
      )}
    </div>
  );
}
