// @ts-nocheck
import React, { useState } from 'react';
import { speak, H } from '../../data';

const CIVIC_SECTIONS = [
  {
    id: 'government',
    icon: '🏛️',
    title: 'Government & Power',
    color: '#f0f9ff',
    border: '#7dd3fc',
    vocab: [
      { hr: 'vlada', en: 'government', ph: 'vla-da', note: 'The executive — "Vlada Republike Hrvatske"' },
      { hr: 'premijer', en: 'prime minister', ph: 'pre-mi-yer', note: 'Head of government' },
      { hr: 'predsjednik', en: 'president', ph: 'pred-syed-nik', note: 'Head of state — separate from premijer' },
      { hr: 'Sabor', en: 'Croatian parliament', ph: 'sa-bor', note: '151 seats. The legislative body.' },
      { hr: 'ministar', en: 'minister', ph: 'mi-ni-star', note: 'ministar financija = minister of finance' },
      { hr: 'ministarstvo', en: 'ministry', ph: 'mi-ni-star-stvo', note: null },
      { hr: 'gradonačelnik', en: 'mayor', ph: 'gra-do-na-chel-nik', note: null },
      { hr: 'župan', en: 'county governor', ph: 'zhu-pan', note: 'Croatia has 20 counties (županije)' },
    ],
  },
  {
    id: 'elections',
    icon: '🗳️',
    title: 'Elections & Democracy',
    color: '#f0fdf4',
    border: '#86efac',
    vocab: [
      { hr: 'glasati', en: 'to vote', ph: 'gla-sa-ti', note: null },
      { hr: 'glasanje', en: 'voting / election day', ph: 'gla-sa-nye', note: null },
      { hr: 'izbori', en: 'elections', ph: 'iz-bo-ri', note: 'parlamentarni izbori = parliamentary elections' },
      { hr: 'stranka', en: 'political party', ph: 'stran-ka', note: 'HDZ and SDP are the two main parties' },
      { hr: 'koalicija', en: 'coalition', ph: 'ko-a-li-tsi-ya', note: 'Croatian governments are almost always coalitions' },
      { hr: 'oporba', en: 'opposition', ph: 'o-por-ba', note: null },
      { hr: 'referendum', en: 'referendum', ph: 're-fe-ren-dum', note: null },
      { hr: 'mandat', en: 'term of office / mandate', ph: 'man-dat', note: '4-year terms in Croatia' },
    ],
  },
  {
    id: 'eu',
    icon: '🇪🇺',
    title: 'Croatia & the EU',
    color: '#faf5ff',
    border: '#c4b5fd',
    vocab: [
      { hr: 'Europska unija', en: 'European Union', ph: 'eu-rop-ska u-ni-ya', note: 'Croatia joined in 2013' },
      { hr: 'euro', en: 'euro (currency since Jan 2023)', ph: 'eu-ro', note: 'Replaced the kuna (kn)' },
      { hr: 'kuna', en: 'the old Croatian currency', ph: 'ku-na', note: 'Older Croatians still mentally calculate in kune' },
      { hr: 'Schengen', en: 'Schengen area (Croatia joined Jan 2023)', ph: 'shen-gen', note: 'No passport checks for EU citizens entering Croatia' },
      { hr: 'Europski parlament', en: 'European Parliament', ph: 'eu-rop-ski par-la-ment', note: 'Croatia elects 12 MEPs' },
      { hr: 'fondovi EU', en: 'EU funds', ph: 'fon-do-vi e-u', note: 'A major topic in Croatian politics' },
      { hr: 'Europska komisija', en: 'European Commission', ph: 'eu-rop-ska ko-mi-si-ya', note: null },
    ],
  },
  {
    id: 'economy',
    icon: '📊',
    title: 'Economy & Budget',
    color: '#fff7ed',
    border: '#fed7aa',
    vocab: [
      { hr: 'proračun', en: 'budget', ph: 'pro-ra-chun', note: 'državni proračun = state budget' },
      { hr: 'porez', en: 'tax', ph: 'po-rez', note: 'PDV = VAT (25% in Croatia)' },
      { hr: 'plaća', en: 'salary / wage', ph: 'pla-cha', note: 'prosječna plaća = average salary' },
      { hr: 'nezaposlenost', en: 'unemployment', ph: 'ne-za-pos-le-nost', note: null },
      { hr: 'inflacija', en: 'inflation', ph: 'in-fla-tsi-ya', note: null },
      { hr: 'gospodarski rast', en: 'economic growth', ph: 'gos-po-dar-ski rast', note: null },
      { hr: 'turizam', en: 'tourism', ph: 'tu-ri-zam', note: 'Croatia\'s biggest industry — 25% of GDP' },
    ],
  },
];

const SAMPLE_HEADLINES = [
  { hr: 'Vlada odobrila novi proračun za iduću godinu.', en: 'Government approves new budget for next year.' },
  { hr: 'Predsjednik se sastao s premijerom u Saboru.', en: 'President met with the prime minister in Parliament.' },
  { hr: 'Izbori u listopadu — stranke počinju kampanju.', en: 'Elections in October — parties begin campaigns.' },
  { hr: 'Hrvatska prima europske fondove za obnovu.', en: 'Croatia receives European funds for reconstruction.' },
  { hr: 'Turizam ostvario rekordne prihode ove godine.', en: 'Tourism achieved record revenues this year.' },
];

export default function CivicScreen({ goBack }) {
  const [activeSection, setActiveSection] = useState(null);
  const [showHeadlines, setShowHeadlines] = useState(false);

  const active = activeSection ? CIVIC_SECTIONS.find(s => s.id === activeSection) : null;

  if (active) {
    return (
      <div>
        {H(`${active.icon} ${active.title}`, 'Civic vocabulary', goBack)}
        <button onClick={() => setActiveSection(null)} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, color: 'var(--subtext)', fontWeight: 700,
          fontFamily: "'Outfit',sans-serif", marginBottom: 16, padding: '4px 0',
        }}>← All Topics</button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.vocab.map((w, i) => (
            <div key={i} style={{
              background: 'var(--card)', border: `1px solid ${active.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              <button onClick={() => speak(w.hr)} aria-label={`Play audio: ${w.hr} — ${w.en}`} style={{
                width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true">🔊</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', fontFamily: "'Playfair Display',serif" }}>{w.hr}</div>
                  <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 600, marginTop: 1 }}>{w.en}</div>
                  <div style={{ fontSize: 10, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 1 }}>/{w.ph}/</div>
                </div>
              </button>
              {w.note && (
                <div style={{ padding: '6px 14px 10px', fontSize: 11, color: 'var(--subtext)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  💡 {w.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {H('🏛️ Civic Croatian', 'Language to follow Croatian news', goBack)}

      <div style={{
        background: 'var(--card)', border: '1px solid var(--card-b)',
        borderRadius: 14, padding: '14px 16px', marginBottom: 20,
        fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6,
      }}>
        Open any Croatian news site and you'll see these words. Learn them and current events become readable.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {CIVIC_SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
            background: s.color, border: `1.5px solid ${s.border}`,
            borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            fontFamily: "'Outfit',sans-serif",
          }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 600 }}>{s.vocab.length} words</div>
            </div>
            <span style={{ fontSize: 18, color: 'var(--subtext)', opacity: .5 }}>›</span>
          </button>
        ))}
      </div>

      {/* Sample Headlines */}
      <button onClick={() => setShowHeadlines(h => !h)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)',
        fontFamily: "'Outfit',sans-serif", marginBottom: 16,
      }}>
        <span style={{ fontSize: 20 }}>📰</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Practice: Read a Headline</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 1 }}>5 real-style Croatian news headlines</div>
        </div>
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,.7)' }}>{showHeadlines ? '▲' : '▼'}</span>
      </button>

      {showHeadlines && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {SAMPLE_HEADLINES.map((h, i) => (
            <button key={i} onClick={() => speak(h.hr)} aria-label={`Play audio: ${h.hr} — ${h.en}`} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              fontFamily: "'Outfit',sans-serif",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }} aria-hidden="true">🔊</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", marginBottom: 3 }}>{h.hr}</div>
                <div style={{ fontSize: 11, color: '#0e7490', fontWeight: 600, fontStyle: 'italic' }}>{h.en}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div style={{
        padding: '12px 16px', borderRadius: 14,
        background: 'rgba(14,116,144,.07)', border: '1.5px solid rgba(14,116,144,.2)',
        fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6, textAlign: 'center',
      }}>
        📱 Try reading <strong>Index.hr</strong> or <strong>Jutarnji.hr</strong> after this — use these words to unlock the headlines.
      </div>
    </div>
  );
}
