import React, { useState, useEffect } from 'react';

// ─────────────────────────────────────────────
// PERSONA DATA
// ─────────────────────────────────────────────
const PERSONAS = [
  {
    key: 'teacher',
    name: 'Maja Kovačević',
    age: 34,
    location: 'Zadar → Zagreb',
    avatar: '/images/portraits/tutor-hero.webp',
    fallbackEmoji: '👩‍🏫',
    specialty: '👩‍🏫 Učiteljica',
    desc: 'Strpljiva, prilagodljiva, pamti sve što si rekao/la.',
    color: '#D4002D',
    level: 'Svi nivoi',
  },
  {
    key: 'fisherman',
    name: 'Marko',
    age: 52,
    location: 'Stari Grad, Hvar',
    avatar: '/images/portraits/fisherman.webp',
    fallbackEmoji: '⛵',
    specialty: '⛵ Dalmatinski ribar',
    desc: 'Grub ali srdačan. Pravi dalmatinski. Bez udžbenika.',
    color: '#0284c7',
    level: 'B1–C2',
  },
  {
    key: 'secretary',
    name: 'Ana Perković',
    age: 41,
    location: 'Grad Zagreb',
    avatar: '/images/portraits/mature-woman.webp',
    fallbackEmoji: '💼',
    specialty: '🏛️ Tajnica',
    desc: 'Formalni govor, birokratski Hrvatski, uljudna ustrajnost.',
    color: '#7c3aed',
    level: 'B1–C2',
  },
  {
    key: 'baka',
    name: 'Baka Mara',
    age: 73,
    location: 'Vinkovci, Slavonija',
    avatar: '/images/portraits/grandmother.webp',
    fallbackEmoji: '👵',
    specialty: '👵 Slavonska baka',
    desc: 'Toplina, hrana, obiteljske priče. Savršeno za početnike.',
    color: '#b45309',
    level: 'A1–B2',
  },
];

// ─────────────────────────────────────────────
// PERSONA CARD
// ─────────────────────────────────────────────
interface Persona {
  key: string;
  name: string;
  age: number;
  location: string;
  avatar: string;
  fallbackEmoji: string;
  specialty: string;
  desc: string;
  color: string;
  level: string;
}

interface PersonaCardProps {
  persona: Persona;
  selected: boolean;
  onSelect: (key: string) => void;
}

function PersonaCard({ persona, selected, onSelect }: PersonaCardProps) {
  const [imgError, setImgError] = useState(false);

  const borderColor = selected ? persona.color : 'var(--card-b)';
  const bgColor = selected ? persona.color + '10' : 'var(--card)';

  return (
    <button
      onClick={() => onSelect(persona.key)}
      style={{
        position: 'relative',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: 16,
        padding: '16px 12px',
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: 'inherit',
        transition: 'border-color 0.2s, background 0.2s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        width: '100%',
      }}
    >
      {/* Selected checkmark */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: persona.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: '#fff',
            fontWeight: 700,
          }}
        >
          ✓
        </div>
      )}

      {/* Avatar */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: `3px solid ${selected ? persona.color : 'var(--card-b)'}`,
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: persona.color + '15',
          transition: 'border-color 0.2s',
        }}
      >
        {!imgError ? (
          <img
            src={persona.avatar}
            alt={persona.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{ fontSize: 32 }}>{persona.fallbackEmoji}</span>
        )}
      </div>

      {/* Name + meta */}
      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--heading)',
            marginBottom: 1,
          }}
        >
          {persona.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 4 }}>
          {persona.age} god. · {persona.location}
        </div>
        <span
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 20,
            background: selected ? persona.color : persona.color + '18',
            color: selected ? '#fff' : persona.color,
            marginBottom: 6,
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {persona.specialty}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: 12,
          color: 'var(--subtext)',
          margin: 0,
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        {persona.desc}
      </p>

      {/* Level tag */}
      <span
        style={{
          fontSize: 10,
          color: 'var(--subtext)',
          border: '1px solid var(--card-b)',
          borderRadius: 6,
          padding: '2px 6px',
        }}
      >
        {persona.level}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
interface Props {
  goBack: () => void;
  setScr: (scr: string) => void;
}

export default function PersonaScreen({ goBack, setScr }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  // Load existing persona from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('maja_persona');
      if (saved && PERSONAS.find((p) => p.key === saved)) {
        setSelected(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  function handleSelect(key: string) {
    setSelected(key);
  }

  function handleStart() {
    if (!selected) return;
    try {
      localStorage.setItem('maja_persona', selected);
    } catch {
      // quota exceeded — continue anyway
    }
    setScr('maja');
  }

  const selectedPersona = PERSONAS.find((p) => p.key === selected);
  const btnColor = selectedPersona ? selectedPersona.color : '#9ca3af';

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 16px 120px',
      }}
    >
      {/* ── Header bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 0 12px',
          position: 'sticky',
          top: 0,
          background: 'transparent',
          zIndex: 10,
        }}
      >
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--heading)',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ← Natrag
        </button>
      </div>

      {/* ── Title ── */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--heading)',
            margin: '0 0 4px',
          }}
        >
          🎭 Razgovaraj s Hrvatima
        </h1>
        <p style={{ fontSize: 14, color: 'var(--subtext)', margin: 0 }}>
          Odaberi sugovornika i počni pravi razgovor na Hrvatskom.
        </p>
      </div>

      {/* ── 2-column persona grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {PERSONAS.map((persona) => (
          <PersonaCard
            key={persona.key}
            persona={persona}
            selected={selected === persona.key}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* ── Selected persona preview ── */}
      {selectedPersona && (
        <div
          style={{
            background: 'var(--card)',
            border: `1px solid ${selectedPersona.color}33`,
            borderLeft: `3px solid ${selectedPersona.color}`,
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--subtext)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--heading)' }}>Odabrano: {selectedPersona.name}</strong>
          <br />
          {selectedPersona.key === 'teacher' &&
            'Maja će te voditi kroz razgovor, ispravljati greške suptilno i pamtiti svaku sesiju.'}
          {selectedPersona.key === 'fisherman' &&
            'Marko ne uči gramatiku — ali razgovor s njim je pravi dalmatinski doživljaj.'}
          {selectedPersona.key === 'secretary' &&
            'Ana te uči formalnom hrvatskom kroz stvarnu birokratsku situaciju. Savršeno za B1+ razinu.'}
          {selectedPersona.key === 'baka' &&
            'Baka Mara te dočekuje s toplinom i hranom. Idealno za početnike (A1–B2).'}
        </div>
      )}

      {/* ── Start button ── */}
      <button
        onClick={handleStart}
        disabled={!selected}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 12,
          background: selected ? btnColor : '#e5e7eb',
          color: selected ? '#fff' : '#9ca3af',
          border: 'none',
          fontSize: 17,
          fontWeight: 700,
          cursor: selected ? 'pointer' : 'default',
          letterSpacing: 0.3,
          boxShadow: selected ? `0 4px 16px ${btnColor}40` : 'none',
          transition: 'background 0.2s, box-shadow 0.2s',
        }}
      >
        {selected
          ? `Počni razgovor s ${selectedPersona?.name?.split(' ')?.[0] || 'AI tutorima'} →`
          : 'Odaberi sugovornika'}
      </button>

      {/* ── Info note ── */}
      <p
        style={{
          fontSize: 11,
          color: 'var(--subtext)',
          textAlign: 'center',
          marginTop: 12,
          lineHeight: 1.5,
        }}
      >
        Svaki sugovornik pamti tvoje sesije neovisno. Možeš ih mijenjati kad god želiš.
      </p>
    </div>
  );
}
