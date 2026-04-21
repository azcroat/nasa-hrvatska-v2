import React from 'react';
import CroatianKnight from './CroatianKnight';

interface EmptyStateProps {
  type?: string;
  title?: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export default function EmptyState({
  type = 'default', // 'no-lessons' | 'streak-broken' | 'level-up' | 'all-caught-up' | 'default'
  title,
  subtitle,
  action,
  onAction,
}: EmptyStateProps) {
  const configs = {
    'no-lessons': {
      mood: 'thinking',
      defaultTitle: 'Ready to begin?',
      defaultSubtitle: 'Your Croatian journey starts with a single word.',
      emoji: '📚',
    },
    'streak-broken': {
      mood: 'sad',
      defaultTitle: 'Streak lost — but not forgotten',
      defaultSubtitle: 'Today is a new day. Your Knight is ready to fight back.',
      emoji: '💔',
    },
    'level-up': {
      mood: 'celebrating',
      defaultTitle: 'Level Complete!',
      defaultSubtitle: 'Your Knight grows stronger. Croatia awaits.',
      emoji: '⭐',
    },
    'all-caught-up': {
      mood: 'happy',
      defaultTitle: 'All caught up!',
      defaultSubtitle: 'Come back tomorrow for new reviews.',
      emoji: '✅',
    },
    default: {
      mood: 'neutral',
      defaultTitle: 'Nothing here yet',
      defaultSubtitle: 'Start learning to see your progress here.',
      emoji: '🎯',
    },
  };

  const cfg =
    (configs as Record<string, (typeof configs)[keyof typeof configs] | undefined>)[type] ||
    configs.default;

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <CroatianKnight size={100} mood={cfg.mood} />
      <div
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 800,
          color: 'var(--heading)',
          fontFamily: "'Playfair Display', serif",
          marginTop: 8,
        }}
      >
        {title || cfg.defaultTitle}
      </div>
      <div
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--subtext)',
          lineHeight: 1.6,
          maxWidth: 260,
        }}
      >
        {subtitle || cfg.defaultSubtitle}
      </div>
      {onAction && (
        <button className="b bp" style={{ marginTop: 16, padding: '12px 28px' }} onClick={onAction}>
          {action || 'Get Started →'}
        </button>
      )}
    </div>
  );
}
