import React, { useState } from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import { PARTNERS, ALATI, recommendedChat, launchMode, type PartnerId } from './partners';
import PartnerScreen from './PartnerScreen';

interface RazgovorTabProps {
  setScr: (screen: string) => void;
  sCurEx?: (ex: string) => void;
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export default function RazgovorTab({ setScr, sCurEx }: RazgovorTabProps) {
  const [openPartner, setOpenPartner] = useState<PartnerId | null>(null);
  const [alatiOpen, setAlatiOpen] = useState(false);
  const nav = { setScr, sCurEx };

  if (openPartner) {
    return (
      <PartnerScreen
        partnerId={openPartner}
        setScr={setScr}
        sCurEx={sCurEx}
        onBack={() => setOpenPartner(null)}
      />
    );
  }

  const rec = recommendedChat(dayOfYear());

  return (
    <div>
      {/* HERO */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: '#c2410c',
            }}
          >
            razgovor
          </span>
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
              fontWeight: 900,
              color: 'var(--heading)',
            }}
          >
            Razgovor
          </span>
        </div>
        <div
          style={{
            height: 3,
            borderRadius: 2,
            marginTop: 10,
            background: 'linear-gradient(90deg,#D40030 0 33%,#fff 33% 66%,#0e7490 66%)',
          }}
        />
      </div>

      {/* DANAS */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
          margin: '4px 2px 10px',
        }}
      >
        Danas
      </div>
      <button
        onClick={() => launchMode(rec.mode, nav)}
        style={{
          width: '100%',
          textAlign: 'left',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          background: 'linear-gradient(145deg,#0e7490 0%,#155e75 55%,#164e63 100%)',
          borderRadius: 20,
          padding: 16,
          color: '#fff',
          boxShadow: '0 10px 28px rgba(14,116,144,.32)',
          display: 'flex',
          alignItems: 'center',
          gap: 13,
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
          <CharacterPortrait name={rec.partner.host} size={52} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: '.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.7)',
            }}
          >
            {rec.partner.name} · {rec.partner.role}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
              marginTop: 2,
            }}
          >
            {rec.partner.greeting.hr}
          </span>
          <span
            style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.72)', marginTop: 3 }}
          >
            {rec.partner.greeting.en}
          </span>
        </span>
        <span
          style={{
            flex: 'none',
            background: 'rgba(255,255,255,.2)',
            border: '1px solid rgba(255,255,255,.3)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          Idemo →
        </span>
      </button>

      {/* PARTNERS */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
          margin: '18px 2px 10px',
        }}
      >
        S kim ćeš pričati?
      </div>
      {PARTNERS.map((p) => {
        const recommended = p.id === rec.partner.id;
        return (
          <button
            key={p.id}
            onClick={() => setOpenPartner(p.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              background: 'var(--card)',
              border: recommended ? '1.5px solid #C8980A' : '1px solid var(--card-b)',
              borderRadius: 16,
              padding: '11px 13px',
              marginBottom: 10,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              boxShadow: recommended
                ? '0 2px 10px rgba(200,152,10,.18)'
                : '0 1px 3px rgba(0,0,0,.05)',
            }}
          >
            <span style={{ flex: 'none', display: 'flex' }}>
              <CharacterPortrait name={p.host} size={46} />
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
                {p.name}
              </span>
              <span
                style={{ display: 'block', fontSize: 11.5, color: 'var(--subtext)', marginTop: 2 }}
              >
                {p.role}
              </span>
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--subtext)', fontSize: 18 }}>›</span>
          </button>
        );
      })}

      {/* ALATI shelf */}
      <button
        onClick={() => setAlatiOpen((o) => !o)}
        aria-expanded={alatiOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 14,
          padding: '13px 14px',
          marginTop: 4,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          color: 'var(--heading)',
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        🛠️ <span>AI alati</span>
        <span style={{ marginLeft: 'auto', color: 'var(--subtext)' }}>{alatiOpen ? '▲' : '▾'}</span>
      </button>
      {alatiOpen && (
        <div style={{ marginTop: 10 }}>
          {ALATI.map((a) => (
            <button
              key={a.id}
              onClick={() => launchMode(a, nav)}
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
              }}
            >
              <span style={{ fontSize: 21 }}>{a.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
