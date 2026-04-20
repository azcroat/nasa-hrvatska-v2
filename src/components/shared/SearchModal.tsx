// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';

const SEARCH_INDEX = [
  // Home tab items
  { tab: 'home', label: 'Continue Learning', icon: '▶️', desc: 'Pick up your next lesson' },
  { tab: 'home', label: 'Daily Quests', icon: '⚡', desc: '5 daily challenges for XP' },
  { tab: 'home', label: 'Streak & XP', icon: '🔥', desc: 'Your streak counter and level progress' },
  { tab: 'home', label: 'Achievements', icon: '🏆', desc: 'Next badge and milestone progress' },
  { tab: 'home', label: 'SRS Review', icon: '📅', desc: 'Spaced repetition words due for review' },
  { tab: 'home', label: 'Mistake Review', icon: '🎯', desc: 'Practice your most-missed words' },
  { tab: 'home', label: 'Weekly Goal', icon: '📊', desc: 'Weekly XP target and progress' },
  // Learn tab items
  { tab: 'learn', label: 'Greetings & Introductions', icon: '👋', desc: 'Core vocabulary lesson' },
  { tab: 'learn', label: 'Family & Relationships', icon: '👨‍👩‍👧', desc: 'Core vocabulary lesson' },
  { tab: 'learn', label: 'Numbers & Counting', icon: '🔢', desc: 'Core vocabulary lesson' },
  { tab: 'learn', label: 'Food & Eating', icon: '🍽️', desc: 'Core vocabulary lesson' },
  { tab: 'learn', label: 'Grammar Lessons', icon: '📝', desc: 'Foundation to Advanced' },
  { tab: 'learn', label: 'Reading Passages', icon: '📖', desc: '11 stories A1 to B2' },
  { tab: 'learn', label: 'Quick Reference Guides', icon: '📋', desc: '13 reference guides' },
  { tab: 'learn', label: 'Vocabulary Categories', icon: '📚', desc: '41+ topic categories' },
  // Practice tab items
  { tab: 'practice', label: 'Flashcards', icon: '🃏', desc: 'Spaced repetition review' },
  { tab: 'practice', label: 'Quiz (Znam)', icon: '🎯', desc: 'Multiple choice vocabulary' },
  { tab: 'practice', label: 'Grammar Drills', icon: '🧠', desc: '20 grammar exercises' },
  { tab: 'practice', label: 'Listening Practice', icon: '🎧', desc: 'Hear and identify Croatian' },
  { tab: 'practice', label: 'Case Constellation', icon: '⭐', desc: 'Visual case explorer' },
  { tab: 'practice', label: 'Tongue Twisters', icon: '🌀', desc: 'Pronunciation practice' },
  { tab: 'practice', label: 'Weak Words Review', icon: '💪', desc: 'Focus on problem words' },
  { tab: 'practice', label: 'Sentence Building', icon: '🏗️', desc: 'Arrange word blocks' },
  { tab: 'practice', label: 'Dialogue Simulation', icon: '💬', desc: 'Branching conversations' },
  { tab: 'practice', label: 'Shadowing', icon: '🗣️', desc: 'Listen and repeat' },
  // Croatia tab items
  { tab: 'croatia', label: 'City of the Day', icon: '🏙️', desc: 'Daily Croatian city spotlight' },
  { tab: 'croatia', label: 'History & Regions', icon: '🏰', desc: 'Croatian history and regions' },
  {
    tab: 'croatia',
    label: 'Cuisine & Traditions',
    icon: '🍷',
    desc: 'Food and cultural traditions',
  },
  { tab: 'croatia', label: 'Croatian Music', icon: '🎵', desc: 'Spotify playlists by genre' },
  { tab: 'croatia', label: "Baka's Letters", icon: '💌', desc: 'Authentic family letters' },
  { tab: 'croatia', label: 'Media Library', icon: '📺', desc: 'TV, Radio, Film, Podcast' },
  { tab: 'croatia', label: 'Nature & Heritage', icon: '🌲', desc: 'National parks and coast' },
  { tab: 'croatia', label: 'Sports', icon: '⚽', desc: 'Croatian sports culture' },
  // Profile tab items
  { tab: 'profile', label: 'My Stats', icon: '📊', desc: 'XP, streak, lessons, mastery' },
  { tab: 'profile', label: 'CEFR Progress', icon: '🎓', desc: 'Language level tracker' },
  { tab: 'profile', label: 'Learning Insights', icon: '💡', desc: 'Vocab analytics dashboard' },
  { tab: 'profile', label: 'My Journey', icon: '🗺️', desc: 'Learning milestones timeline' },
  { tab: 'profile', label: 'Settings', icon: '⚙️', desc: 'Goals, theme, account' },
  { tab: 'profile', label: 'Badges & Achievements', icon: '🏆', desc: 'Your earned badges' },
];

function normDiacritics(s) {
  return s
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'd');
}

export default function SearchModal({ setTab, onClose }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  const results =
    q.length < 1
      ? []
      : SEARCH_INDEX.filter((item) => {
          const nq = normDiacritics(q);
          return (
            normDiacritics(item.label).includes(nq) ||
            normDiacritics(item.desc).includes(nq) ||
            item.label.toLowerCase().includes(q.toLowerCase()) ||
            item.desc.toLowerCase().includes(q.toLowerCase())
          );
        });

  // Group results by tab
  const grouped = results.reduce((acc, item) => {
    if (!acc[item.tab]) acc[item.tab] = [];
    acc[item.tab].push(item);
    return acc;
  }, {});

  const TAB_LABELS = {
    home: 'Home',
    learn: 'Learn',
    practice: 'Practice',
    croatia: 'Croatia',
    profile: 'Profile',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--bar-bg)',
        }}
      >
        <span style={{ fontSize: 20 }}>🔍</span>
        <input
          ref={inputRef}
          aria-label="Search lessons, practice, and Croatia content"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons, practice, Croatia..."
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 16,
            color: 'var(--heading)',
          }}
        />
        <button
          onClick={onClose}
          aria-label="Close search"
          style={{
            background: 'none',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            color: 'var(--subtext)',
          }}
        >
          ✕
        </button>
      </div>
      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {q.length === 0 && (
          <p style={{ color: 'var(--subtext)', fontSize: 14, marginTop: 24, textAlign: 'center' }}>
            Search across all lessons, practice modes, and Croatia content
          </p>
        )}
        {q.length > 0 && results.length === 0 && (
          <p style={{ color: 'var(--subtext)', fontSize: 14, marginTop: 24, textAlign: 'center' }}>
            No results for "{q}"
          </p>
        )}
        {Object.entries(grouped).map(([tab, items]) => (
          <div key={tab} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              {TAB_LABELS[tab]}
            </div>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setTab(tab);
                  onClose();
                }}
                aria-label={`${item.label} — ${item.desc}`}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--card)',
                  cursor: 'pointer',
                  marginBottom: 6,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--rt-c)' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
