import React from 'react';

/**
 * EmptyState — illustrated empty state component
 * Usage: <EmptyState type="no-lessons" title="All caught up!" sub="Come back tomorrow for new reviews." />
 */
export default function EmptyState({ type = 'no-lessons', title, sub, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 24px', textAlign: 'center',
    }}>
      <IllustrationSVG type={type} />
      {title && (
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--heading)',
          fontFamily: "'Playfair Display',serif", marginBottom: 8, marginTop: 4 }}>
          {title}
        </div>
      )}
      {sub && (
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--subtext)', lineHeight: 1.6,
          maxWidth: 260, marginBottom: action ? 20 : 0 }}>
          {sub}
        </div>
      )}
      {action && onAction && (
        <button onClick={onAction} className="b bp" style={{ marginTop: 8 }}>
          {action}
        </button>
      )}
    </div>
  );
}

function IllustrationSVG({ type }) {
  if (type === 'no-lessons') return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
      {/* Stack of books */}
      <rect x="20" y="70" width="80" height="14" rx="4" fill="var(--info)" opacity="0.7"/>
      <rect x="25" y="55" width="70" height="14" rx="4" fill="var(--info)" opacity="0.85"/>
      <rect x="30" y="40" width="60" height="14" rx="4" fill="var(--info)"/>
      {/* Check circle */}
      <circle cx="85" cy="35" r="18" fill="var(--success)" opacity="0.15"/>
      <circle cx="85" cy="35" r="14" fill="none" stroke="var(--success)" strokeWidth="2.5"/>
      <path d="M78 35l5 5 9-10" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Stars */}
      <circle cx="30" cy="25" r="3" fill="var(--warning)" opacity="0.6"/>
      <circle cx="18" cy="45" r="2" fill="var(--info)" opacity="0.5"/>
      <circle cx="100" cy="60" r="2.5" fill="var(--warning)" opacity="0.5"/>
    </svg>
  );

  if (type === 'streak-broken') return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
      {/* Broken flame */}
      <path d="M60 95 C35 95 20 75 20 58 C20 42 35 30 50 28 C45 38 50 45 55 42 C50 55 60 60 65 52 C72 60 80 55 75 42 C88 50 100 62 100 75 C100 88 85 95 60 95Z" fill="var(--warning)" opacity="0.3"/>
      <path d="M60 95 C40 95 25 80 25 65 C25 52 38 40 52 38 C48 46 52 52 57 50 C53 60 62 65 67 58 C73 65 78 58 74 48 C85 55 95 65 95 75 C95 87 82 95 60 95Z" fill="var(--warning)" opacity="0.6"/>
      {/* X mark */}
      <circle cx="60" cy="62" r="16" fill="var(--error)" opacity="0.12"/>
      <path d="M53 55l14 14M67 55l-14 14" stroke="var(--error)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );

  if (type === 'level-up') return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
      {/* Star burst */}
      <circle cx="60" cy="60" r="40" fill="var(--warning)" opacity="0.08"/>
      <circle cx="60" cy="60" r="28" fill="var(--warning)" opacity="0.12"/>
      {/* Trophy */}
      <path d="M42 30h36v25c0 10-8 18-18 18s-18-8-18-18V30z" fill="var(--warning)" opacity="0.8"/>
      <path d="M42 40H28c0 10 6 16 14 17M78 40h14c0 10-6 16-14 17" stroke="var(--warning)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      <rect x="48" y="73" width="24" height="5" rx="2" fill="var(--warning)" opacity="0.7"/>
      <rect x="43" y="78" width="34" height="6" rx="3" fill="var(--warning)" opacity="0.8"/>
      {/* Stars */}
      <path d="M60 38l3 6h7l-5.5 4 2 6.5L60 51l-6.5 3.5 2-6.5L50 44h7z" fill="white" opacity="0.9"/>
    </svg>
  );

  // Default — generic empty
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 16 }}>
      <circle cx="40" cy="40" r="36" fill="var(--bar-bg)"/>
      <path d="M26 40h28M40 26v28" stroke="var(--subtext)" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}
