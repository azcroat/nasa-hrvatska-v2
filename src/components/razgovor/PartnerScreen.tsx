import React from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import { PARTNERS, launchMode, type ConvoMode, type PartnerId } from './partners';

function ModeRow({
  mode,
  nav,
}: {
  mode: ConvoMode;
  nav: { setScr: (s: string) => void; sCurEx?: (e: string) => void };
}) {
  return (
    <button
      onClick={() => launchMode(mode, nav)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderRadius: 14,
        padding: '12px 13px',
        marginBottom: 9,
        cursor: 'pointer',
        fontFamily: "'Outfit',sans-serif",
        boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 11,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 21,
          background: 'rgba(14,116,144,.10)',
        }}
      >
        {mode.icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
          {mode.label}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
          {mode.desc}
        </span>
      </span>
    </button>
  );
}

export default function PartnerScreen({
  partnerId,
  setScr,
  sCurEx,
  onBack,
}: {
  partnerId: PartnerId;
  setScr: (s: string) => void;
  sCurEx?: (e: string) => void;
  onBack: () => void;
}) {
  const partner = PARTNERS.find((p) => p.id === partnerId)!;
  const nav = { setScr, sCurEx };
  const primary = partner.modes[0]!;
  const rest = partner.modes.slice(1);

  return (
    <div data-testid="partner-screen">
      {/* back bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--bar-bg)',
            border: '1px solid var(--card-b)',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 800,
            color: '#0e7490',
            padding: '6px 11px',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          ← Razgovor
        </button>
        <span
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--heading)',
          }}
        >
          {partner.name}
        </span>
      </div>

      {/* host hero */}
      <div
        style={{
          position: 'relative',
          height: 150,
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 14,
          background: `linear-gradient(135deg,${partner.tint},rgba(14,116,144,.28))`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            padding: 14,
            background: 'linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(20,30,40,.45))',
          }}
        >
          <span
            style={{
              flex: 'none',
              borderRadius: '50%',
              padding: 3,
              background: 'linear-gradient(135deg,#C8980A,#e0b84a)',
              display: 'flex',
            }}
          >
            <CharacterPortrait name={partner.host} size={64} />
          </span>
          <span style={{ flex: 1, color: '#fff' }}>
            <span
              style={{
                display: 'block',
                fontFamily: "'Playfair Display',serif",
                fontSize: 17,
                fontWeight: 800,
                textShadow: '0 1px 4px rgba(0,0,0,.4)',
              }}
            >
              {partner.greeting.hr}
            </span>
            <span style={{ display: 'block', fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              {partner.greeting.en}
            </span>
          </span>
        </div>
      </div>

      {/* primary CTA */}
      <button
        onClick={() => launchMode(primary, nav)}
        style={{
          width: '100%',
          textAlign: 'left',
          border: 'none',
          cursor: 'pointer',
          background: 'linear-gradient(140deg,#0e7490,#155e75)',
          borderRadius: 18,
          padding: 14,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          boxShadow: '0 8px 22px rgba(14,116,144,.3)',
          marginBottom: 18,
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            background: 'rgba(255,255,255,.18)',
            border: '1.5px solid rgba(255,255,255,.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 23,
            flex: 'none',
          }}
        >
          {primary.icon}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15.5, fontWeight: 900 }}>{primary.label}</span>
          <span style={{ display: 'block', fontSize: 11, opacity: 0.78, marginTop: 2 }}>
            {primary.desc}
          </span>
        </span>
        <span
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,.22)',
            border: '1px solid rgba(255,255,255,.3)',
            borderRadius: 10,
            padding: '6px 11px',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Idemo →
        </span>
      </button>

      {/* other modes */}
      {rest.length > 0 && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'var(--subtext)',
              margin: '2px 2px 10px',
            }}
          >
            Načini
          </div>
          {rest.map((m) => (
            <ModeRow key={m.id} mode={m} nav={nav} />
          ))}
        </>
      )}
    </div>
  );
}
