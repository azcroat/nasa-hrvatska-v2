// src/components/ai/AITab.tsx
//
// Dedicated AI-learning tab — consolidates every AI-powered learning surface
// in one place so users don't have to hunt across Practice / Croatia. Each
// card launches an existing screen via setScr; the cards are not new
// features, they're navigation entry-points.
//
// Layout: hero intro → primary cards (large, full-width) → secondary cards
// (2-column grid). Order is "highest-impact AI feature first."

import React from 'react';

interface AITabProps {
  setScr: (screen: string) => void;
  sCurEx?: (ex: string) => void;
}

interface AICard {
  id: string;
  emoji: string;
  label: string;
  description: string;
  /** Production screen id; passed to setScr. */
  screen: string;
  /** Optional secondary screen id when the primary doesn't expose Croatian-language UI directly. */
  curEx?: string;
  /** Primary cards render full-width with gradient; secondary cards render in a 2-col grid. */
  variant: 'primary' | 'secondary';
  /** CSS gradient string for the card accent border / background tint. */
  accent: string;
}

const CARDS: AICard[] = [
  {
    id: 'aiconversation',
    emoji: '💬',
    label: 'AI Voice Conversation',
    description: 'Practice real conversations with Maja — your AI Croatian tutor. Speak or type.',
    screen: 'aiconvo',
    curEx: 'aiconvo',
    variant: 'primary',
    accent: 'linear-gradient(135deg, #b61800, #e53e3e)',
  },
  {
    id: 'live_tutor',
    emoji: '🎓',
    label: 'Live AI Tutor',
    description: '1:1 personalized AI tutoring session — Marija explains, drills, and corrects.',
    screen: 'live_tutor',
    curEx: 'live_tutor',
    variant: 'primary',
    accent: 'linear-gradient(135deg, #0e7490, #06b6d4)',
  },
  {
    id: 'ailistening',
    emoji: '🎧',
    label: 'AI Listening',
    description: 'Generated Croatian audio dialogues. Pick a topic, hear native-style speech.',
    screen: 'ai_listening',
    curEx: 'ai_listening',
    variant: 'secondary',
    accent: '#7c3aed',
  },
  {
    id: 'aivideo',
    emoji: '🎬',
    label: 'AI Video Lesson',
    description: 'Watch a generated lesson on any topic, then test comprehension.',
    screen: 'video_lesson',
    curEx: 'video_lesson',
    variant: 'secondary',
    accent: '#d97706',
  },
  {
    id: 'writing',
    emoji: '✍️',
    label: 'AI Writing Feedback',
    description: 'Write in Croatian — AI flags errors and explains the corrections.',
    screen: 'writing',
    curEx: 'writing',
    variant: 'secondary',
    accent: '#16a34a',
  },
  {
    id: 'speaking_sprint',
    emoji: '🎤',
    label: 'AI Pronunciation Sprint',
    description: '60-second pronunciation drill scored by AI against native pacing.',
    screen: 'speaking_sprint',
    curEx: 'speaking_sprint',
    variant: 'secondary',
    accent: '#dc2626',
  },
  {
    id: 'ai_story',
    emoji: '📖',
    label: 'AI Story',
    description: 'Personalized Croatian story built from your weakest words.',
    screen: 'ai_story',
    curEx: 'ai_story',
    variant: 'secondary',
    accent: '#059669',
  },
  {
    id: 'grammar_diagnosis',
    emoji: '🔬',
    label: 'Grammar Blind Spots',
    description: 'Weekly AI analysis of your weakest grammar points.',
    screen: 'grammar_diagnosis',
    curEx: 'grammar_diagnosis',
    variant: 'secondary',
    accent: '#0e7490',
  },
  {
    id: 'photo_vocab',
    emoji: '📷',
    label: 'Photo Vocab Scanner',
    description: 'Point your camera at anything — AI returns the Croatian words.',
    screen: 'photo_vocab',
    curEx: 'photo_vocab',
    variant: 'secondary',
    accent: '#b45309',
  },
  {
    id: 'personas',
    emoji: '🗣️',
    label: 'Razgovaraj s Hrvatima',
    description: 'Voice-to-voice AI with 4 Croatian personas — Maja, Marko, Ana, Baka Mara.',
    screen: 'personas',
    curEx: 'personas',
    variant: 'primary',
    accent: 'linear-gradient(135deg, #D4002D, #ff3d5a)',
  },
];

export default function AITab({ setScr, sCurEx }: AITabProps) {
  const launch = (c: AICard) => {
    if (sCurEx && c.curEx) sCurEx(c.curEx);
    setScr(c.screen);
  };

  const primary = CARDS.filter((c) => c.variant === 'primary');
  const secondary = CARDS.filter((c) => c.variant === 'secondary');

  return (
    <div className="scr-wrap" data-testid="ai-tab">
      {/* ── Hero ── */}
      <div
        style={{
          padding: '20px 18px',
          marginBottom: 16,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(204,0,0,0.08), rgba(14,116,144,0.08))',
          border: '1.5px solid rgba(204,0,0,0.18)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            color: '#cc0000',
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            fontFamily: "'Outfit', sans-serif",
            marginBottom: 6,
          }}
        >
          AI Tutor
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24,
            fontWeight: 900,
            color: 'var(--heading)',
            lineHeight: 1.15,
            marginBottom: 6,
          }}
        >
          Personalized Croatian, powered by AI
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--subtext)',
            lineHeight: 1.5,
            fontStyle: 'italic',
            fontFamily: "'Playfair Display', serif",
          }}
        >
          Every AI-powered learning surface in one place. Conversation, listening, video, writing,
          pronunciation, story generation, grammar diagnostics, photo vocabulary, and a live tutor —
          all using your level and recent errors as context.
        </div>
      </div>

      {/* ── Primary cards (full-width, gradient) ── */}
      {primary.map((c) => (
        <button
          key={c.id}
          data-testid={'ai-card-' + c.id}
          onClick={() => launch(c)}
          style={{
            all: 'unset',
            display: 'block',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            marginBottom: 12,
            borderRadius: 14,
            background: c.accent,
            color: '#fff',
            padding: '18px 16px',
            boxShadow: '0 4px 14px rgba(0,0,0,.12)',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 34, flexShrink: 0, lineHeight: 1 }}>{c.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 13, opacity: 0.95, lineHeight: 1.4 }}>{c.description}</div>
            </div>
            <div style={{ fontSize: 20, opacity: 0.85, flexShrink: 0 }}>→</div>
          </div>
        </button>
      ))}

      {/* ── Secondary cards (2-col grid) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
          marginTop: 4,
        }}
      >
        {secondary.map((c) => (
          <button
            key={c.id}
            data-testid={'ai-card-' + c.id}
            onClick={() => launch(c)}
            style={{
              all: 'unset',
              display: 'block',
              cursor: 'pointer',
              boxSizing: 'border-box',
              padding: '14px 12px',
              borderRadius: 12,
              background: 'var(--card)',
              border: `1.5px solid ${c.accent}30`,
              borderLeft: `3px solid ${c.accent}`,
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--heading)',
                marginBottom: 3,
                lineHeight: 1.2,
              }}
            >
              {c.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', lineHeight: 1.35 }}>
              {c.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
