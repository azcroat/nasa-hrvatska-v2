import React, { useState, useEffect } from 'react';
import { speak } from '../../data';
import { getCityOfDay } from '../../lib/dailyPickers';
import { signalSessionCompleteIfActive } from '../../lib/sessionSignal';
// Direct import of the full 365-city pool from the client bundle — same data
// the server endpoint serves, but always available regardless of auth/hydration
// state. All 4 tabs (Overview / History / Vocab / Fast Facts) populated.
import { CROATIAN_CITIES } from '../../data/cultural/geography.js';

// Normalize city name to lookup key — strip diacritics, lowercase, collapse spaces
// Handles: Šibenik→sibenik, Varaždin→varazdin, Korčula→korcula, Poreč→porec,
//          Vukovar Grad→vukovar grad, Brač→brac, etc.
function normKey(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const CITY_PHOTOS = {
  // Dalmatia
  dubrovnik: '/images/scenes/dubrovnik-ai.webp',
  split:
    'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=800&q=85&fit=crop&auto=format',
  zadar:
    'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=800&q=85&fit=crop&auto=format',
  sibenik:
    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=85&fit=crop&auto=format',
  hvar: 'https://images.unsplash.com/photo-1527515637462-cff94edd89b6?w=800&q=85&fit=crop&auto=format',
  korcula:
    'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&q=85&fit=crop&auto=format',
  makarska:
    'https://images.unsplash.com/photo-1586161816003-bc944e3c7e27?w=800&q=85&fit=crop&auto=format',
  // Murter — Kornati gateway island, Dalmatia (Šibenik-Knin county)
  murter:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=85&fit=crop&auto=format',
  trogir:
    'https://images.unsplash.com/photo-1588354918778-9e9f05701f90?w=800&q=85&fit=crop&auto=format',
  omis: 'https://images.unsplash.com/photo-1698785820846-35f06c39ced7?w=800&q=85&fit=crop&auto=format',
  brac: 'https://images.unsplash.com/photo-1565116175827-965e73c9be0e?w=800&q=85&fit=crop&auto=format',
  vis: 'https://images.unsplash.com/photo-1601409434818-c2e87a98cac3?w=800&q=85&fit=crop&auto=format',
  // Istria & Kvarner
  rovinj:
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=85&fit=crop&auto=format',
  pula: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=85&fit=crop&auto=format',
  porec:
    'https://images.unsplash.com/photo-1576769562804-455efac32a2e?w=800&q=85&fit=crop&auto=format',
  labin: '/images/scenes/labin.webp',
  rijeka:
    'https://images.unsplash.com/photo-1549421263-6064833b071b?w=800&q=85&fit=crop&auto=format',
  // Continental Croatia
  zagreb: '/images/scenes/zagreb.webp',
  varazdin:
    'https://images.unsplash.com/photo-1548268770-66184a21657e?w=800&q=85&fit=crop&auto=format',
  // Karlovac: four rivers, Central Croatia — use Plitvice greenery (same region/landscape)
  karlovac: '/images/scenes/plitvice.webp',
  // Slavonia
  osijek:
    'https://images.unsplash.com/photo-1564594736694-d73f80c4a7fe?w=800&q=85&fit=crop&auto=format',
  vukovar:
    'https://images.unsplash.com/photo-1585999659523-6e2a2a4c5d59?w=800&q=85&fit=crop&auto=format',
  // National Parks & Herzegovina
  plitvice: '/images/scenes/plitvice.webp',
  mostar: '/images/scenes/mostar.webp',
  // Reliable fallback — Dalmatian coast (proven working URL)
  default:
    'https://images.unsplash.com/photo-1559570704-fea2efaf9e79?w=800&q=85&fit=crop&auto=format',
};

interface CityOfDayScreenProps {
  goBack: () => void;
}

type CityLike = {
  name: string;
  region?: string;
  vocab?: unknown[];
  facts?: unknown[];
  intro?: string;
  history?: string;
  didYouKnow?: string;
  color?: string;
  icon?: string;
  subtitle?: string;
  tagline?: string;
  [key: string]: unknown;
};

function CityOfDayScreen({ goBack }: CityOfDayScreenProps) {
  const [tab, setTab] = useState('overview');
  // Direct client-side pool — 365 cities with full data (intro, history,
  // vocab, facts, didYouKnow). Always populated, no auth dependency, no
  // hydration race. Same daily picker.
  const city = getCityOfDay(CROATIAN_CITIES as CityLike[]);
  const _tomorrow = (function () {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  })();
  // Don't strand a Today's Session activity if the daily picker fails to
  // resolve a city (shouldn't happen with 365 entries, but defensive).
  useEffect(() => {
    if (!city) signalSessionCompleteIfActive('cityofday');
  }, [city]);
  if (!city) return null;

  // Defensive guards — 36 of 365 cities are stubs missing vocab/facts/intro.
  // Render safe fallbacks rather than crashing.
  const safeVocab: unknown[] = Array.isArray(city.vocab) ? city.vocab : [];
  const safeFacts: unknown[] = Array.isArray(city.facts) ? city.facts : [];
  const safeIntro = city.intro || `${city.name} is a city in ${city.region || 'Croatia'}.`;
  const safeHistory = city.history || '';
  const safeDidYouKnow = city.didYouKnow || '';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📖' },
    { id: 'history', label: 'History', icon: '🏛️' },
    { id: 'vocab', label: 'Vocabulary', icon: '💬' },
    { id: 'facts', label: 'Fast Facts', icon: '⚡' },
  ];
  const cityKey = normKey(city.name);
  const photoUrl = (CITY_PHOTOS as Record<string, string>)[cityKey] ?? CITY_PHOTOS.default;

  return (
    <div className="scr-wrap">
      {/* Photo header */}
      <div
        style={{
          position: 'relative',
          height: 280,
          background: `linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.72) 100%), url(${photoUrl}) center/cover no-repeat`,
          borderRadius: '0 0 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 20px 20px',
          marginBottom: 16,
          overflow: 'hidden',
        }}
      >
        {/* Back button */}
        <button
          onClick={goBack}
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 20,
            color: '#fff',
            padding: '6px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>

        {/* City name overlay */}
        <div style={{ color: '#fff' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            🏙️ City of the Day
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              lineHeight: 1.1,
            }}
          >
            {city.icon} {city.name}
          </div>
          <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4, fontWeight: 500 }}>
            {city.region || city.subtitle || ''}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{ display: 'flex', gap: 6, marginBottom: 20, paddingBottom: 4, overflowX: 'auto' }}
      >
        {tabs.map(function (t) {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={function () {
                setTab(t.id);
              }}
              style={
                active
                  ? {
                      background: city.color
                        ? `linear-gradient(135deg, ${city.color}, ${city.color}dd)`
                        : 'linear-gradient(135deg,#0e7490,#164e63)',
                      color: '#fff',
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontWeight: 700,
                      fontSize: 12,
                      border: 'none',
                      cursor: 'pointer',
                    }
                  : {
                      background: 'none',
                      color: 'var(--subtext)',
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontWeight: 600,
                      fontSize: 12,
                      border: 'none',
                      cursor: 'pointer',
                    }
              }
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <div
            style={{
              marginBottom: 16,
              padding: '16px',
              background: (city.color || '#0e7490') + '0e',
              borderRadius: 14,
              borderLeft: '4px solid ' + (city.color || '#0e7490'),
              fontSize: 14,
              lineHeight: 1.8,
              color: 'var(--heading)',
            }}
          >
            {safeIntro}
          </div>
          <div
            style={{
              marginBottom: 16,
              padding: '14px 16px',
              background: 'var(--card)',
              borderRadius: 14,
              border: '1px solid rgba(0,0,0,.07)',
              boxShadow: '0 1px 4px rgba(0,0,0,.05)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--subtext)',
                marginBottom: 8,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              At a glance
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span
                style={{
                  background: city.color + '18',
                  color: city.color,
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '5px 12px',
                  borderRadius: 20,
                }}
              >
                📍 {city.region}
              </span>
              {safeVocab.length > 0 && (
                <span
                  style={{
                    background: 'var(--info-bg)',
                    color: 'var(--info)',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: 20,
                  }}
                >
                  📚 {safeVocab.length} vocabulary words
                </span>
              )}
              {safeFacts.length > 0 && (
                <span
                  style={{
                    background: 'rgba(245,158,11,.1)',
                    color: 'var(--warning-dark, #b45309)',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: 20,
                  }}
                >
                  🏛️ {safeFacts.length} historical facts
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
              borderRadius: 14,
              borderLeft: '4px solid ' + city.color,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: city.color,
                marginBottom: 6,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Local saying
            </div>
            <div
              style={{
                fontSize: 14,
                fontStyle: 'italic',
                color: 'var(--heading)',
                lineHeight: 1.6,
              }}
            >
              "{city.tagline}"
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {tab === 'history' &&
        (function () {
          const half = Math.ceil(safeFacts.length / 2);
          const histFacts = safeFacts.slice(0, half);
          return (
            <div>
              {safeHistory ? (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '16px',
                    background: 'var(--card)',
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,.07)',
                    boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: 'var(--subtext)',
                  }}
                >
                  {safeHistory}
                </div>
              ) : null}
              <div
                style={{ marginBottom: 12, fontSize: 13, fontWeight: 800, color: 'var(--info)' }}
              >
                🏛️ Key Historical Facts
              </div>
              {(histFacts as string[]).map(function (f: string, fi: number) {
                return (
                  <div
                    key={fi}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      marginBottom: 10,
                      padding: '12px 14px',
                      background: 'var(--card)',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,.06)',
                      boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: city.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {fi + 1}
                    </div>
                    <div
                      style={{ fontSize: 13, color: 'var(--heading)', lineHeight: 1.6, flex: 1 }}
                    >
                      {f}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      {/* Vocabulary */}
      {tab === 'vocab' && (
        <div>
          <div
            style={{
              marginBottom: 12,
              padding: '10px 14px',
              background: city.color + '0e',
              borderRadius: 10,
              fontSize: 12,
              color: city.color,
              fontWeight: 700,
            }}
          >
            Words and phrases connected to {city.name} — tap to hear
          </div>
          {safeVocab.length === 0 && (
            <div
              style={{
                color: 'var(--subtext)',
                fontSize: 14,
                padding: '20px 0',
                textAlign: 'center',
              }}
            >
              Vocabulary coming soon for {city.name}.
            </div>
          )}
          {(safeVocab as Array<{ hr: string; en: string; note?: string }>).map(function (v, vi) {
            return (
              <div
                key={vi}
                role="button"
                tabIndex={0}
                aria-label={`Play audio for ${v.hr}`}
                style={{
                  marginBottom: 10,
                  background: 'var(--card)',
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,.06)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                  cursor: 'pointer',
                }}
                onClick={function () {
                  speak(v.hr);
                }}
                onKeyDown={function (e) {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    speak(v.hr);
                  }
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
                >
                  <div
                    style={{
                      width: 4,
                      alignSelf: 'stretch',
                      background: city.color,
                      borderRadius: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 17, fontWeight: 800, color: city.color, marginBottom: 3 }}
                    >
                      {v.hr}{' '}
                      <span aria-hidden="true" style={{ fontSize: 14, opacity: 0.5 }}>
                        🔊
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--subtext)',
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {v.en}
                    </div>
                    {v.note && (
                      <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5 }}>
                        {v.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fast Facts */}
      {tab === 'facts' &&
        (function () {
          const half = Math.ceil(safeFacts.length / 2);
          const fastFacts = safeFacts.slice(half) as string[];
          const allFacts = ([safeDidYouKnow] as string[]).concat(fastFacts).filter(Boolean);
          return (
            <div>
              <div
                style={{ fontSize: 15, fontWeight: 800, color: 'var(--info)', marginBottom: 14 }}
              >
                💡 Did You Know?
              </div>
              {allFacts.map(function (fact, i) {
                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: 10,
                      padding: '14px 16px',
                      background: 'var(--card)',
                      borderRadius: 14,
                      border: '1px solid rgba(0,0,0,.07)',
                      boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--heading)', lineHeight: 1.7 }}>
                      {fact}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
    </div>
  );
}

export default CityOfDayScreen;
