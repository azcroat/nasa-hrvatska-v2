import React from 'react';
import CroatianGrb from './CroatianGrb';

/**
 * Slim app-wide top header: brand (šahovnica + name) on the left, the "Me"
 * avatar on the right. Replaces the bottom-bar "Ja" tab as the route to profile.
 */
export default function AppHeader({ name, onProfile }: { name?: string; onProfile: () => void }) {
  const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';
  return (
    <header className="app-header" role="banner">
      <div className="app-header-brand">
        <span style={{ width: 22, height: 26, flex: 'none', display: 'inline-block' }}>
          <CroatianGrb size={22} />
        </span>
        <span className="app-header-title">Naša Hrvatska</span>
      </div>
      <button
        type="button"
        onClick={onProfile}
        aria-label="Me"
        data-testid="header-profile"
        className="app-header-me"
      >
        {initial}
      </button>
    </header>
  );
}
