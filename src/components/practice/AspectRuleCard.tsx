// @ts-nocheck
import React from 'react';

export default function AspectRuleCard({ rule, highlight }) {
  return (
    <div
      style={{
        background: highlight ? 'rgba(14,116,144,.08)' : 'var(--bar-bg)',
        border: highlight ? '1.5px solid var(--info,#0284c7)' : '1.5px solid var(--card-b)',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
        animation: highlight ? 'slideIn .3s ease' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{rule.icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: highlight ? 'var(--info,#0284c7)' : 'var(--heading)',
          }}
        >
          Rule: {rule.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.55, marginBottom: 8 }}>
        {rule.explanation}
      </div>
      <div
        style={{ background: 'var(--card)', borderRadius: 8, padding: '8px 10px', marginBottom: 4 }}
      >
        <div
          style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--heading)', fontWeight: 600 }}
        >
          ✓ {rule.example.hr}
        </div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>{rule.example.en}</div>
      </div>
      <div style={{ background: 'var(--card)', borderRadius: 8, padding: '8px 10px' }}>
        <div
          style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--heading)', fontWeight: 600 }}
        >
          ↔ {rule.counterex.hr}
        </div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
          {rule.counterex.en}
        </div>
      </div>
    </div>
  );
}
