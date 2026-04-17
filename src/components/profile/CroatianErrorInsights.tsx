// @ts-nocheck
import React, { useState } from 'react';
import { getTopErrors, getErrorsByCategory } from '../../lib/learnerErrors.js';
import { getWeakTopics } from '../../lib/adaptive.js';
import { useApp } from '../../context/AppContext';

// ── Error code → friendly explanation mapping ─────────────────────────────────
const ERROR_META = {
  reflexive_missing: {
    label: 'Missing reflexive "se/si"',
    desc: 'Reflexive verbs in Croatian require the particle se or si. It cannot be dropped.',
    example: { wrong: 'Zovem Marko.', right: 'Zovem se Marko.' },
    tip: 'Memorise reflexive verbs as a unit: "zvati se", "sjetiti se", "sjećati se".',
    screen: 'typing',
    icon: '↩️',
  },
  clitic_placement: {
    label: 'Clitic word order',
    desc: 'Croatian clitics (se, ga, mu, je, sam...) must occupy the 2nd slot in the clause — never first, never last.',
    example: { wrong: 'Dao mu sam knjigu.', right: 'Dao sam mu knjigu.' },
    tip: 'Rule: Subject → [verb clitic] → [pronoun clitic] → [se] → rest.',
    screen: 'conjdrill',
    icon: '🔀',
  },
  diacritics_dropped: {
    label: 'Dropped diacritics (š, ž, č, ć, đ)',
    desc: 'Croatian diacritics are not optional — they change spelling, meaning, and pronunciation.',
    example: { wrong: 'kuca (knocks)', right: 'kuća (house)' },
    tip: 'Install a Croatian keyboard layout or use long-press on mobile to access diacritics.',
    screen: 'pronunciation_course',
    icon: '🔤',
  },
  c_vs_c_confusion: {
    label: 'Č vs Ć confusion',
    desc: 'These are two distinct Croatian phonemes. Č (hard) is like English "ch" in "church". Ć (soft) is more palatal — like "ty" blended.',
    example: { wrong: 'kuca / kuča (knocks)', right: 'kuća (house)' },
    tip: 'Minimal pair practice: "peći" (to bake) vs "peči" (wrong). Listen and repeat.',
    screen: 'pronunciation_course',
    icon: '🎵',
  },
  dj_diacritics: {
    label: 'Writing Đ as "dj"',
    desc: 'Đ is a single Croatian letter, not "dj". Using "dj" is a common diaspora habit that marks non-native spelling.',
    example: { wrong: 'djak', right: 'đak (pupil)' },
    tip: 'Think of Đ like the "j" in French "jour" but voiced. Practice on keyboard.',
    screen: 'pronunciation_course',
    icon: '🗣️',
  },
  animate_accusative: {
    label: 'Animate accusative case',
    desc: 'Masculine animate nouns (people, animals) take genitive-like endings in the accusative case.',
    example: { wrong: 'Vidim brat.', right: 'Vidim brata.' },
    tip: 'Ask: is the noun a living being? If yes → add -a for accusative masculine.',
    screen: 'padezi',
    icon: '👤',
  },
  numeral_gender_dva_dvije: {
    label: 'Dva vs Dvije',
    desc: '"Dva" is used with masculine and neuter nouns. "Dvije" is used with feminine nouns.',
    example: { wrong: 'dva sestre', right: 'dvije sestre (two sisters)' },
    tip: 'Check the gender of the noun first, then pick the numeral form.',
    screen: 'quiz',
    icon: '2️⃣',
  },
  numeral_gender_agreement: {
    label: 'Jedan / Jedna / Jedno agreement',
    desc: 'The numeral "one" must agree with the noun in gender: jedan (m), jedna (f), jedno (n).',
    example: { wrong: 'jedan noć', right: 'jedna noć (one night)' },
    tip: 'Learn gender with every new noun. No shortcuts — gender is fundamental.',
    screen: 'quiz',
    icon: '1️⃣',
  },
  genitive_of_negation: {
    label: 'Genitive of negation',
    desc: 'In negated sentences, the direct object shifts from accusative to genitive. This is unique to Croatian (and other Slavic languages).',
    example: { wrong: 'Nemam auto.', right: 'Nemam auta. (I don\'t have a car.)' },
    tip: 'Any time you negate "imam, vidim, čujem" — switch to genitive.',
    screen: 'padezi',
    icon: '🚫',
  },
};

// Category labels and colours
const CAT_META = {
  grammar: { label: 'Grammar', color: '#7c3aed', bg: 'rgba(124,58,237,.1)', border: 'rgba(124,58,237,.25)', icon: '⚙️' },
  pronunciation: { label: 'Pronunciation', color: '#0e7490', bg: 'rgba(14,116,144,.1)', border: 'rgba(14,116,144,.25)', icon: '🎙️' },
  vocabulary: { label: 'Vocabulary', color: '#d97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)', icon: '📝' },
  speaking: { label: 'Speaking', color: '#16a34a', bg: 'rgba(22,163,74,.1)', border: 'rgba(22,163,74,.25)', icon: '💬' },
};

function CategoryBadge({ category }) {
  const meta = CAT_META[category] || CAT_META.grammar;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase',
      color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
      borderRadius: 20, padding: '2px 8px',
    }}>
      {meta.icon} {meta.label}
    </span>
  );
}

function ErrorCard({ error, expanded, onToggle, onPractice }) {
  const meta = ERROR_META[error.pattern] || {
    label: error.pattern.replace(/_/g, ' '),
    desc: `This pattern appeared ${error.count} time(s).`,
    icon: '⚠️',
    screen: 'quiz',
  };
  const urgency = error.count >= 5 ? 'high' : error.count >= 3 ? 'medium' : 'low';
  const urgencyColor = urgency === 'high' ? '#D4002D' : urgency === 'medium' ? '#d97706' : '#16a34a';

  return (
    <div style={{
      background: 'var(--card)', border: '1.5px solid var(--card-b)',
      borderRadius: 14, overflow: 'hidden', marginBottom: 10,
      transition: 'box-shadow .2s',
    }}>
      {/* Header row — always visible */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
          fontFamily: "'Outfit',sans-serif", textAlign: 'left',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${urgencyColor}18`, border: `1.5px solid ${urgencyColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.2 }}>
            {meta.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <CategoryBadge category={error.category} />
            <span style={{ fontSize: 10, fontWeight: 700, color: urgencyColor }}>
              {error.count}× caught
            </span>
          </div>
        </div>
        <span style={{ fontSize: 14, color: 'var(--subtext)', opacity: .7, flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 14px 14px',
          borderTop: '1px solid var(--card-b)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.65, marginTop: 12, marginBottom: 10 }}>
            {meta.desc}
          </p>

          {meta.example && (
            <div style={{
              background: 'rgba(0,0,0,.04)', borderRadius: 10, padding: '10px 12px',
              marginBottom: 10, fontFamily: "'Playfair Display',serif",
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>
                Example
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 13, color: '#D4002D' }}>
                  ✗ {meta.example.wrong}
                </span>
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>
                  ✓ {meta.example.right}
                </span>
              </div>
            </div>
          )}

          {meta.tip && (
            <div style={{
              background: 'rgba(14,116,144,.08)', border: '1px solid rgba(14,116,144,.2)',
              borderRadius: 10, padding: '8px 12px', marginBottom: 12,
              fontSize: 12, color: 'var(--info)', lineHeight: 1.6, fontWeight: 600,
            }}>
              💡 {meta.tip}
            </div>
          )}

          {meta.screen && (
            <button
              onClick={() => onPractice(meta.screen)}
              style={{
                background: 'linear-gradient(135deg, var(--info), #0369a1)',
                color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              🎯 Practice this now →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Weak topic card ───────────────────────────────────────────────────────────
function WeakTopicCard({ topic, onPractice }) {
  const TOPIC_SCREEN = {
    grammar: 'conjdrill', padezi: 'padezi', cases: 'padezi',
    verbs: 'conjdrill', conjugation: 'conjdrill',
    pronunciation: 'pronunciation_course', aspect: 'grammar_track',
    vocabulary: 'quiz', numbers: 'quiz',
  };
  const screen = Object.entries(TOPIC_SCREEN).find(([k]) => topic.id.toLowerCase().includes(k))?.[1] || 'quiz';
  const pct = topic.accuracy;
  const color = pct < 30 ? '#D4002D' : pct < 50 ? '#d97706' : '#0e7490';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', background: 'var(--card)',
      border: '1.5px solid var(--card-b)', borderRadius: 12, marginBottom: 8,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', textTransform: 'capitalize', marginBottom: 4 }}>
          {topic.id.replace(/_/g, ' ')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: 'var(--card-b)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .6s' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 2 }}>{topic.attempts} attempts</div>
      </div>
      <button
        onClick={() => onPractice(screen)}
        style={{
          background: `${color}18`, border: `1.5px solid ${color}50`,
          color, borderRadius: 10, padding: '7px 12px',
          fontSize: 12, fontWeight: 800, cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif", flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Drill →
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyInsights() {
  return (
    <div style={{
      textAlign: 'center', padding: '24px 20px',
      background: 'var(--card)', border: '1.5px dashed var(--card-b)',
      borderRadius: 16,
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}>
        No patterns detected yet
      </div>
      <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
        Complete a few typing and quiz exercises. The app will automatically track your Croatian-specific error patterns and show them here.
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CroatianErrorInsights() {
  const { setScr } = useApp();
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [activeTab, setActiveTab] = useState('errors'); // 'errors' | 'topics'

  const topErrors = getTopErrors(8);
  const weakTopics = getWeakTopics(65);
  const byCategory = getErrorsByCategory();
  const totalErrors = topErrors.length;
  const errorCats = Object.entries(byCategory).filter(([, v]) => v.length > 0);

  function handlePractice(screen) {
    setScr(screen);
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {/* ── Section header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div>
          <div style={{
            fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--heading)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🧪 Croatian Error Analysis
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 3, fontWeight: 500 }}>
            {totalErrors > 0
              ? `${totalErrors} error pattern${totalErrors !== 1 ? 's' : ''} tracked across ${errorCats.length} categor${errorCats.length !== 1 ? 'ies' : 'y'}`
              : 'Practice to generate personalized insights'}
          </div>
        </div>
        {totalErrors > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--subtext)',
            background: 'var(--card)', border: '1px solid var(--card-b)',
            borderRadius: 20, padding: '4px 10px',
          }}>
            {totalErrors} tracked
          </div>
        )}
      </div>

      {/* ── Tab switcher ── */}
      {(totalErrors > 0 || weakTopics.length > 0) && (
        <div style={{
          display: 'flex', gap: 4, marginBottom: 14,
          background: 'var(--card)', border: '1px solid var(--card-b)',
          borderRadius: 12, padding: 4,
        }}>
          {[
            { key: 'errors', label: '⚠️ Error Patterns', count: totalErrors },
            { key: 'topics', label: '📊 Weak Topics', count: weakTopics.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, border: 'none', cursor: 'pointer',
                padding: '8px 4px', borderRadius: 9,
                background: activeTab === tab.key ? 'var(--info)' : 'transparent',
                color: activeTab === tab.key ? '#fff' : 'var(--subtext)',
                fontSize: 12, fontWeight: 800, fontFamily: "'Outfit',sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background .2s, color .2s',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 900, background: activeTab === tab.key ? 'rgba(255,255,255,.25)' : 'var(--card-b)',
                  borderRadius: 10, padding: '1px 6px',
                  color: activeTab === tab.key ? '#fff' : 'var(--subtext)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Error patterns tab ── */}
      {activeTab === 'errors' && (
        <>
          {totalErrors === 0 ? (
            <EmptyInsights />
          ) : (
            <>
              {/* Category summary pills */}
              {errorCats.length > 1 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {errorCats.map(([cat, errors]) => {
                    const meta = CAT_META[cat] || CAT_META.grammar;
                    return (
                      <div key={cat} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 700,
                        color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
                        borderRadius: 20, padding: '3px 10px',
                      }}>
                        {meta.icon} {meta.label}: {errors.length}
                      </div>
                    );
                  })}
                </div>
              )}

              {topErrors.map((error, i) => (
                <ErrorCard
                  key={error.pattern}
                  error={error}
                  expanded={expandedIdx === i}
                  onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  onPractice={handlePractice}
                />
              ))}

              <div style={{
                fontSize: 11, color: 'var(--subtext)', textAlign: 'center',
                marginTop: 4, lineHeight: 1.6,
              }}>
                Patterns are ranked by frequency × recency. As you improve, they fade automatically.
              </div>
            </>
          )}
        </>
      )}

      {/* ── Weak topics tab ── */}
      {activeTab === 'topics' && (
        <>
          {weakTopics.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px 20px',
              background: 'var(--card)', border: '1.5px dashed var(--card-b)',
              borderRadius: 16,
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}>
                No weak topics — great work!
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>
                Complete more exercises across different topics to see where you need improvement.
              </div>
            </div>
          ) : (
            <>
              <div style={{
                fontSize: 12, color: 'var(--subtext)', marginBottom: 12,
                fontWeight: 500, lineHeight: 1.6,
              }}>
                Topics where your accuracy is below 65% — sorted worst first. Drill these to unlock faster progress.
              </div>
              {weakTopics.slice(0, 8).map(topic => (
                <WeakTopicCard
                  key={topic.id}
                  topic={topic}
                  onPractice={handlePractice}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
