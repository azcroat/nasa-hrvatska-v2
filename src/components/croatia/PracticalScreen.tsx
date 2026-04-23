import React from 'react';
import { H, speak } from '../../data';
import { PRACTICAL } from '../../data';

interface Props {
  goBack: () => void;
}

function PracticalScreen({ goBack }: Props) {
  return (
    <div className="scr-wrap">
      {H('💼 Practical Life in Croatia', 'Documents, customs, culture', goBack)}
      <div className="c" style={{ marginBottom: 12, borderLeft: '4px solid #dc2626' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>{PRACTICAL.oib.title}</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{PRACTICAL.oib.desc}</div>
      </div>
      <div className="c" style={{ marginBottom: 12, borderLeft: '4px solid #0e7490' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0e7490' }}>{PRACTICAL.mbo.title}</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{PRACTICAL.mbo.desc}</div>
      </div>
      <h3 className="sh">📄 Documents</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {PRACTICAL.documents.map(function (d, i) {
          return (
            <button
              key={i}
              aria-label={`Play audio for ${d[0]}`}
              className="c"
              style={{ padding: '8px 12px' }}
              onClick={function () {
                speak(d[0] ?? '');
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {d[0]} <span aria-hidden="true">🔊</span>
              </div>
              <div style={{ fontSize: 11, color: '#78716c' }}>{d[1]}</div>
            </button>
          );
        })}
      </div>
      <div className="c" style={{ marginTop: 16, borderLeft: '4px solid #f59e0b' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#b45309' }}>📅 School Calendar</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{PRACTICAL.schoolCalendar}</div>
      </div>
      <h3 className="sh" style={{ marginTop: 16 }}>
        🇭🇷 Croatian Customs
      </h3>
      {PRACTICAL.customs.map(function (c, i) {
        return (
          <div key={i} className="c" style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#164e63' }}>{c.rule}</div>
            <div style={{ fontSize: 13, color: '#44403c', marginTop: 4 }}>{c.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

export default PracticalScreen;
