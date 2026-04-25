import React, { useState } from 'react';
import { getStreak } from '../../data';
import { getWeakTopics } from '../../lib/adaptive.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import ProgressCharts from './ProgressCharts';
import JourneyTimeline from './JourneyTimeline';
import LearningInsights from './LearningInsights';
import CroatianErrorInsights from './CroatianErrorInsights';

const B1_RESOURCES = [
  {
    icon: '📺',
    name: 'HRT (Croatian Radio-Television)',
    url: 'hr.hrt.hr',
    what: 'Watch news, documentaries, and dramas in standard Croatian. HRT vijesti (news) is excellent for listening to polished, standard ijekavian Croatian.',
    tip: 'Start with vijesti — newsreaders speak clearly. Then try Provjereno (investigative journalism) for natural conversational Croatian.',
    level: 'B1+',
  },
  {
    icon: '📻',
    name: 'HRT Radio — HR3 & HR1',
    url: 'radio.hrt.hr',
    what: 'Audio-only forces your brain to process Croatian without visual cues — the highest-value listening practice available. HR3 has cultural programming, HR1 is news-focused.',
    tip: 'Listen while commuting. Even 20 minutes/day of authentic radio accelerates comprehension faster than structured lessons.',
    level: 'B1+',
  },
  {
    icon: '🎬',
    name: 'Croatian Films (streaming)',
    url: 'mubi.com / YouTube',
    what: '"Svjedoci" (2003), "Što je Iva snimila 21. listopada 2003." (2005), "Koko i duhovi" for lighter viewing. Many Croatian films are on MUBI or free on YouTube with subtitles.',
    tip: 'Watch with Croatian subtitles (not English) — your brain learns to read and listen simultaneously, which is exactly how native speakers process language.',
    level: 'B1–B2',
  },
  {
    icon: '🎤',
    name: 'Speaking Sprint — Hear · Speak · Compare',
    url: 'Practice → Speaking Sprint',
    what: 'At B1 you have enough language to produce real speech. The Speaking Sprint plays native audio, records your response, then shows you the phonetic gap — exactly where your pronunciation diverges from standard Croatian.',
    tip: 'Do 1 sprint per day (15 min). Errors you notice in speaking — especially cases and verb aspect — are your highest-priority study targets. Follow with the Shadowing exercise to internalise the rhythm.',
    level: 'B1+',
  },
  {
    icon: '📰',
    name: '24sata.hr / Jutarnji list',
    url: '24sata.hr',
    what: 'Croatian news websites in standard Croatian. 24sata is tabloid-accessible (simpler language). Jutarnji list is more formal. Reading 1 article per day dramatically builds reading fluency and vocabulary.',
    tip: "Don't look up every word. Read for gist first. Circle only words that appear 3+ times — those are worth learning.",
    level: 'B1',
  },
  {
    icon: '📚',
    name: 'Razgovarajte s nama! (textbook)',
    url: 'bookshops / library',
    what: '"Razgovarajte s nama!" by Cvikić & Jelaska is the gold standard B1–B2 Croatian as a second/heritage language textbook. Structured grammar explanations in Croatian, with authentic audio exercises.',
    tip: 'Pair with this app\'s grammar drills. The textbook provides the "why" behind grammatical structures — your learning will accelerate significantly.',
    level: 'B1–B2',
  },
];

export default function InsightsTab({ onOpenFriends }: { onOpenFriends?: () => void }) {
  const { setScr } = useApp();
  const { stats: st, level } = useStats();
  const [imdOpen, setImdOpen] = useState(false);
  const [letterText, setLetterText] = useState(
    () => localStorage.getItem('nh_letter_to_self') || '',
  );

  const streak = getStreak();

  return (
    <React.Fragment>
      {/* ── CROATIAN ERROR ANALYSIS (competitive moat — no other app does this) ── */}
      <h3 className="sh">Croatian Error Analysis</h3>
      <CroatianErrorInsights />

      {/* ── LEARNING INSIGHTS ── */}
      <h3 className="sh" style={{ marginTop: 24 }}>
        Learning Insights
      </h3>
      <LearningInsights st={st} />

      {/* ── MY PROGRESS ── */}
      <h3 className="sh" style={{ marginTop: 24 }}>
        My Progress
      </h3>
      <ProgressCharts stats={st} />

      {/* ── MY CROATIAN JOURNEY ── */}
      <h3 className="sh" style={{ marginTop: 24 }}>
        My Croatian Journey
      </h3>
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 16,
          border: '1px solid var(--card-b)',
        }}
      >
        <JourneyTimeline />
      </div>

      {/* ── B1+ FLUENCY ROADMAP ── */}
      {level >= 5 && (
        <React.Fragment>
          <h3 className="sh" style={{ marginTop: 24 }}>
            🗺️ Your Fluency Roadmap
          </h3>
          <div
            style={{
              background: 'rgba(14,116,144,.07)',
              border: '1.5px solid rgba(14,116,144,.2)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 14,
              fontSize: 12,
              lineHeight: 1.6,
              color: 'var(--subtext)',
              fontWeight: 500,
            }}
          >
            <span style={{ fontWeight: 800, color: 'var(--info,#0284c7)' }}>
              You have reached B1 — the conversational threshold.
            </span>{' '}
            This is when authentic input becomes your primary driver. No app can take you to fluency
            alone — but these resources, combined with consistent practice, will.{' '}
            <span style={{ fontStyle: 'italic' }}>
              FSI estimates 1,100 classroom hours to professional Croatian proficiency for English
              speakers. You are making real progress.
            </span>
          </div>
          {B1_RESOURCES.map((r, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--info,#0284c7)', fontWeight: 700 }}>
                    {r.level} · {r.url}
                  </div>
                </div>
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.55, marginBottom: 6 }}
              >
                {r.what}
              </div>
              <div
                style={{
                  fontSize: 11,
                  background: 'rgba(14,116,144,.07)',
                  borderRadius: 8,
                  padding: '7px 10px',
                  color: 'var(--info,#0284c7)',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                💡 {r.tip}
              </div>
            </div>
          ))}
        </React.Fragment>
      )}

      {/* ── WEAK AREAS ── */}
      {(() => {
        const weak = getWeakTopics(60);
        if (!weak.length) return null;
        return (
          <React.Fragment>
            <h3 className="sh">📈 Growth Opportunities</h3>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--subtext)',
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              These topics are building the fastest — keep practicing!
            </div>
            <div style={{ marginBottom: 20 }}>
              {weak.slice(0, 5).map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'var(--card)',
                    border: '1.5px solid var(--card-b)',
                    borderRadius: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 800,
                        color: 'var(--heading)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {w.id.replace(/_/g, ' ')}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        marginTop: 2,
                        color:
                          w.accuracy < 30
                            ? 'var(--error)'
                            : w.accuracy > 40
                              ? 'var(--warning)'
                              : 'var(--error)',
                      }}
                    >
                      {w.accuracy}% accuracy · {w.attempts} attempts
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--success)',
                          fontWeight: 700,
                          marginLeft: 4,
                        }}
                      >
                        ↑ improving
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        );
      })()}

      {/* ── IMENDAN EXPLAINER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg,rgba(182,24,0,.07),rgba(0,48,135,.05))',
          border: '1.5px solid rgba(182,24,0,.18)',
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 16,
        }}
      >
        <button
          onClick={() => setImdOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 'var(--text-3xl)' }}>🎉</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 900,
                color: 'var(--heading)',
                marginBottom: 2,
              }}
            >
              What is Imendan?
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontWeight: 600 }}>
              The Croatian name day tradition — essential knowledge
            </div>
          </div>
          <span style={{ fontSize: 'var(--text-base)', color: 'var(--subtext)', opacity: 0.85 }}>
            {imdOpen ? '▲' : '▼'}
          </span>
        </button>
        {imdOpen && (
          <div style={{ marginTop: 14, borderTop: '1px solid rgba(182,24,0,.12)', paddingTop: 14 }}>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--subtext)',
                lineHeight: 1.7,
                marginBottom: 12,
              }}
            >
              In Croatia, every day of the year is associated with one or more saints. If you share
              your name with a saint, that day is your{' '}
              <strong style={{ color: 'var(--heading)' }}>imendan</strong> (name day) — and it's
              often celebrated just as much as your birthday, if not more.
            </p>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}
            >
              {[
                { day: 'Jan 13', name: 'Stjepan (Stephen)', emoji: '🎊' },
                { day: 'Mar 19', name: 'Josip (Joseph)', emoji: '🎊' },
                { day: 'Jun 29', name: 'Petar (Peter)', emoji: '🎊' },
                { day: 'Aug 15', name: 'Marija (Mary)', emoji: '🎊' },
                { day: 'Nov 1', name: 'Svi Sveti (All Saints)', emoji: '⛪' },
                { day: 'Dec 13', name: 'Lucija (Lucy)', emoji: '🎊' },
              ].map((m) => (
                <div
                  key={m.day}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--card-b)',
                    borderRadius: 10,
                    padding: '8px 10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--subtext)',
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    {m.day}
                  </div>
                  <div
                    style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}
                  >
                    {m.emoji} {m.name}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: 'var(--info-bg)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 'var(--text-sm)',
                color: 'var(--subtext)',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: 'var(--heading)' }}>What to do:</strong> Say{' '}
              <strong style={{ color: 'var(--info)' }}>"Sretan imendan!"</strong> (Happy Name Day!)
              and bring a small gift or flowers. Never forget your partner's or their parents'
              imendan — it matters more than you think.
            </div>
          </div>
        )}
      </div>

      {/* ── ACHIEVEMENTS ── */}
      <h3 className="sh">Achievements</h3>
      <div
        className="c"
        style={{
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          🔓
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Next Achievement
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              color: 'var(--heading)',
              marginTop: 2,
            }}
          >
            {streak?.count < 7
              ? `🔥 Streak Starter — ${7 - (streak?.count || 0)} days away`
              : streak?.count < 30
                ? `🌟 Streak Legend — ${30 - (streak?.count || 0)} days away`
                : st.lc < 25
                  ? `📚 Dedicated — complete ${25 - st.lc} more lessons`
                  : (st.badges || []).length < 10
                    ? `🏆 Badge Collector — earn ${10 - (st.badges || []).length} more badges`
                    : "🏆 You're on an amazing path!"}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <button
          className="tc"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px' }}
          onClick={() => setScr('badges')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xl)',
              flexShrink: 0,
            }}
          >
            🏆
          </div>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}>
              Badges
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
              {(st.badges || []).length} earned
            </div>
          </div>
        </button>
        <button
          className="tc"
          style={{
            gridColumn: '1/-1',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px',
          }}
          onClick={() => setScr('certificate')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: 'var(--info-bg)',
              border: '1px solid var(--info-b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-xl)',
              flexShrink: 0,
            }}
          >
            📜
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
              My Certificate
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
              Download your progress certificate
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.8 }}>›</div>
        </button>
        {onOpenFriends && (
          <button
            className="tc"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px' }}
            onClick={onOpenFriends}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'rgba(74,222,128,.12)',
                border: '1px solid rgba(74,222,128,.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xl)',
                flexShrink: 0,
              }}
            >
              👥
            </div>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}>
                Friends & Family
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
                Learn together
              </div>
            </div>
          </button>
        )}
      </div>

      {/* ── LETTER TO FUTURE ME ── */}
      <h3 className="sh">Letter to Future Me</h3>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--subtext)',
            marginBottom: 10,
            fontStyle: 'italic',
          }}
        >
          Write a note to your future self about why you're learning Croatian. The app will remind
          you of this when you hit milestones.
        </p>
        <textarea
          value={letterText}
          onChange={(e) => {
            setLetterText(e.target.value);
            localStorage.setItem('nh_letter_to_self', e.target.value);
          }}
          placeholder="I want to speak Croatian because..."
          style={{
            width: '100%',
            minHeight: 100,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1.5px solid var(--inp-b)',
            background: 'var(--card)',
            color: 'var(--heading)',
            fontSize: 'var(--text-sm)',
            fontFamily: "'Outfit',sans-serif",
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 6 }}>
          Saved automatically ✓
        </div>
        {letterText && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--subtext)',
              marginTop: 8,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            This letter will reappear when you reach your next milestone to remind you why you
            started 💪
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
