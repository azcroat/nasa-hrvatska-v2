import React, { useState, useRef } from 'react';
import { useStats } from '../../context/StatsContext.tsx';
import { markQuest } from '../../lib/quests.js';
import { H, speak } from '../../data';
import { KINGS } from '../../data';

interface KingsSt {
  hi?: number;
  [key: string]: unknown;
}

interface Props {
  goBack: () => void;
  award?: (xp: number) => void;
  setSt: React.Dispatch<React.SetStateAction<KingsSt>>;
}

export default function KingsScreen({ goBack, award, setSt }: Props) {
  const { writeDelta } = useStats();
  const finishFired = useRef(false);
  const [kgTab, sKgTab] = useState('timeline');
  return (
    <div className="scr-wrap">
      {H('👑 ' + KINGS.title, KINGS.subtitle, goBack)}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {['timeline', 'dukes', 'kings', 'cities', 'vocab'].map(function (t) {
          return (
            <button
              key={t}
              className={'b ' + (kgTab === t ? 'bw' : 'bg')}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={function () {
                sKgTab(t);
              }}
            >
              {t === 'timeline'
                ? '📜 Timeline'
                : t === 'dukes'
                  ? '🏰 Dukes'
                  : t === 'kings'
                    ? '👑 Kings'
                    : t === 'cities'
                      ? '🏙️ Royal Cities'
                      : '📚 Vocabulary'}
            </button>
          );
        })}
      </div>
      {kgTab === 'timeline' && (
        <React.Fragment>
          <div
            className="c"
            style={{
              marginBottom: 20,
              borderLeft: '4px solid #b45309',
              background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#1c1917' }}>{KINGS.intro}</div>
          </div>
          {KINGS.eras.map(function (e, i) {
            return (
              <div
                key={i}
                className="c"
                style={{
                  marginBottom: 12,
                  borderLeft:
                    '4px solid ' +
                    (i < 2 ? '#f59e0b' : i === 2 ? '#b45309' : i === 3 ? '#7c3aed' : '#dc2626'),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>{e.emoji}</span>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: '#164e63',
                      fontFamily: "'Playfair Display',serif",
                    }}
                  >
                    {e.title}
                  </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#44403c' }}>{e.text}</p>
              </div>
            );
          })}
          <h3 className="sh" style={{ marginTop: 24 }}>
            📌 Key Dates
          </h3>
          {KINGS.keyFacts.map(function (f, i) {
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(0,0,0,.05)',
                }}
              >
                <div style={{ minWidth: 60, fontSize: 14, fontWeight: 800, color: '#b45309' }}>
                  {f[0]!}
                </div>
                <div style={{ fontSize: 14, color: '#44403c' }}>{f[1]!}</div>
              </div>
            );
          })}
          <div
            className="c"
            style={{
              marginTop: 24,
              textAlign: 'center',
              borderLeft: '4px solid #b45309',
              background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#92400e',
                fontFamily: "'Playfair Display',serif",
                fontStyle: 'italic',
                marginBottom: 6,
              }}
            >
              {KINGS.quote}
            </div>
            <div style={{ fontSize: 14, color: '#78716c', fontStyle: 'italic' }}>
              {KINGS.quoteEn}
            </div>
          </div>
        </React.Fragment>
      )}
      {kgTab === 'dukes' && (
        <React.Fragment>
          <div
            className="c"
            style={{ marginBottom: 16, background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              Before Croatia became a kingdom in 925, it was ruled by dukes (knezovi) who built the
              foundations of the Croatian state. These leaders established the dynasty, gained papal
              recognition, and created the institutions that made the kingdom possible.
            </div>
          </div>
          {KINGS.dukes.map(function (d, i) {
            return (
              <button
                key={i}
                aria-label={`Play audio for ${d.name}`}
                className="c"
                style={{ marginBottom: 10 }}
                onClick={function () {
                  speak(d.name);
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#164e63' }}>
                    {'🏰 '}
                    {d.name} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>{d.years}</div>
                </div>
                <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 600, marginBottom: 4 }}>
                  {d.title}
                </div>
                <div style={{ fontSize: 13, color: '#44403c', lineHeight: 1.6 }}>{d.desc}</div>
              </button>
            );
          })}
        </React.Fragment>
      )}
      {kgTab === 'kings' && (
        <React.Fragment>
          <div
            className="c"
            style={{
              marginBottom: 16,
              background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
              borderLeft: '4px solid #b45309',
            }}
          >
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              From Tomislav in 925 to Petar Svačić in 1097, these kings ruled a sovereign Croatia.
              They defended the nation against empires, expanded its borders, and built a
              civilization that forms the bedrock of Croatian identity.
            </div>
          </div>
          {KINGS.kings.map(function (k, i) {
            return (
              <button
                key={i}
                aria-label={`Play audio for ${k.name}`}
                className="c"
                style={{ marginBottom: 12, borderLeft: '4px solid ' + (k.color || '#0e7490') }}
                onClick={function () {
                  speak(k.name);
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: k.color || '#164e63',
                      fontFamily: "'Playfair Display',serif",
                    }}
                  >
                    {k.emoji} {k.name} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>{k.years}</div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: k.color || '#0e7490',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {k.title}
                </div>
                <div style={{ fontSize: 13, color: '#44403c', lineHeight: 1.7 }}>{k.desc}</div>
              </button>
            );
          })}
        </React.Fragment>
      )}
      {kgTab === 'cities' && (
        <React.Fragment>
          <div className="c" style={{ marginBottom: 16, borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
              The Croatian kingdom had no single permanent capital. Instead, the royal court moved
              between five principal cities, each serving as a seat of power at different times.
            </div>
          </div>
          {KINGS.royalCities.map(function (c, i) {
            return (
              <button
                key={i}
                aria-label={`Play audio for ${c.name}`}
                className="c"
                style={{ marginBottom: 10 }}
                onClick={function () {
                  speak(c.name);
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>
                  {'🏙️ '}
                  {c.name} <span aria-hidden="true">🔊</span>
                </div>
                <div style={{ fontSize: 13, color: '#44403c', lineHeight: 1.6 }}>{c.desc}</div>
              </button>
            );
          })}
        </React.Fragment>
      )}
      {kgTab === 'vocab' && (
        <React.Fragment>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490', marginBottom: 12 }}>
            📚 Medieval Croatian Vocabulary — Tap to hear:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {KINGS.vocabulary.map(function (v, i) {
              return (
                <button
                  key={i}
                  aria-label={`Play audio for ${v[0]!}`}
                  className="c"
                  style={{ padding: '10px 14px' }}
                  onClick={function () {
                    speak(v[0]!);
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#b45309' }}>
                    {v[0]!} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{v[1]!}</div>
                </button>
              );
            })}
          </div>
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 20 }}
            onClick={function () {
              if (finishFired.current) return;
              finishFired.current = true;
              setSt(function (s: KingsSt) {
                return Object.assign({}, s, { hi: (s.hi || 0) + 1 });
              });
              writeDelta({ hi: 1 });
              if (typeof award === 'function') award(25);
              markQuest('culture');
              goBack();
            }}
          >
            ✅ Mark as Read (+25 XP)
          </button>
        </React.Fragment>
      )}
    </div>
  );
}
