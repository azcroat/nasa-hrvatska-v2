import React from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import type { CharacterName } from '../family/portraits';
import { PARTNERS } from '../razgovor/partners';

/**
 * Compact Home card beneath the Session card: the host-of-day invites the user
 * to converse. Tapping it opens Razgovor with that partner (via the parent's
 * onOpen → nh_open_partner handoff). A conversation entry, not a greeting hero.
 */
export default function RazgovorHomeCard({
  host,
  onOpen,
}: {
  host: CharacterName;
  onOpen: () => void;
}) {
  const partner = PARTNERS.find((p) => p.id === host) ?? PARTNERS[0]!;

  return (
    <>
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
          margin: '2px 2px 8px',
        }}
      >
        Razgovor
      </div>
      <button
        data-testid="home-razgovor-card"
        onClick={onOpen}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 18,
          padding: 13,
          marginBottom: 16,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          boxShadow: '0 2px 10px rgba(0,0,0,.05)',
        }}
      >
        <span
          style={{
            flex: 'none',
            borderRadius: '50%',
            padding: 3,
            background: 'linear-gradient(135deg,#0e7490,#164e63)',
          }}
        >
          <span
            style={{
              display: 'block',
              width: 50,
              height: 50,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #fff',
              background: '#fbf6ec',
            }}
          >
            <CharacterPortrait name={host} title={partner.name} size={50} />
          </span>
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'Playfair Display',serif",
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--heading)',
              lineHeight: 1.15,
            }}
          >
            {partner.name} te čeka
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--subtext)', marginTop: 2 }}>
            „{partner.greeting.hr}”
          </span>
        </span>
        <span
          style={{
            marginLeft: 'auto',
            flex: 'none',
            background: 'linear-gradient(140deg,#0e7490,#155e75)',
            color: '#fff',
            borderRadius: 11,
            padding: '9px 13px',
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          💬 Razgovor →
        </span>
      </button>
    </>
  );
}
