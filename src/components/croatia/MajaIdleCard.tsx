// @ts-nocheck
import React from 'react';
import MemoryChips from './MemoryChips';

const PERSONA_FACTS = {
  teacher: [
    '🇭🇷 Predaje Hrvatski u Zagrebu',
    '📍 Rodom iz Zadra',
    '❤️ Prstaci, brudet i Hajduk Split',
  ],
  fisherman: [
    '⛵ Ribar u Starom Gradu, Hvar',
    '🐟 Jedini prave ribe: zubatac i špar',
    '⚽ Navijač Hajduka Split',
  ],
  secretary: [
    '🏛️ Tajnica u Gradu Zagrebu',
    '📋 Stručnjakinja za obrasce i postupke',
    '☕ Kava u 10:00 je sveta',
  ],
  baka: [
    '🏠 Baka iz Vinkovaca, Slavonija',
    '🍲 Kulen, sarma i pogača iz pećnice',
    '❤️ Sedam unuka i beskonačna ljubav',
  ],
};

const PERSONA_TAGLINES = {
  teacher: 'Maja će se sjetiti svakog vašeg razgovora i prilagoditi lekcije vama.',
  fisherman: 'Marko ne uči gramatiku — ali čut ćeš pravi dalmatinski Hrvatski.',
  secretary: 'Ana te uči formalnom Hrvatskom kroz stvarnu birokratsku interakciju.',
  baka: 'Baka Mara te dočekuje s toplinom i hranom. Savršeno za početnike.',
};

function relationshipLabel(level) {
  const labels = ['stranac', 'poznanik', 'redoviti polaznik', 'prijatelj', 'bliski prijatelj'];
  return labels[Math.min(level, 4)] || 'stranac';
}

export default function MajaIdleCard({
  personaKey,
  personaCfg,
  memory,
  name,
  isFirstTime,
  showWelcome,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        marginBottom: 12,
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative' }}>
        <img
          src={personaCfg.avatar}
          alt={personaCfg.name}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            objectFit: 'cover',
            border: `3px solid ${personaCfg.accentColor}`,
            display: 'block',
          }}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const sib = /** @type {HTMLElement} */ e.currentTarget.nextSibling;
            if (sib) sib.style.display = 'flex';
          }}
        />
        <div
          style={{
            display: 'none',
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: `3px solid ${personaCfg.accentColor}`,
            background: personaCfg.accentColor + '22',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
          }}
        >
          {personaCfg.fallbackEmoji}
        </div>
        {memory.sessionCount > 0 && (
          <span
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              background: personaCfg.accentColor,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 10,
              border: '2px solid #fff',
              whiteSpace: 'nowrap',
            }}
          >
            #{memory.sessionCount + 1}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--heading)',
          marginTop: 4,
        }}
      >
        {personaCfg.name}
      </span>
      <span style={{ fontSize: 12, color: 'var(--subtext)' }}>{personaCfg.title}</span>
      {memory.sessionCount > 0 && (
        <span
          style={{
            fontSize: 11,
            color: personaCfg.accentColor,
            background: personaCfg.accentColor + '14',
            border: `1px solid ${personaCfg.accentColor}33`,
            borderRadius: 10,
            padding: '2px 8px',
          }}
        >
          {relationshipLabel(memory.relationshipLevel)}
        </span>
      )}

      {/* Memory chips */}
      <MemoryChips knownFacts={memory.knownFacts} />

      {/* Welcome / returning card — only shown when session is not active */}
      {showWelcome &&
        (isFirstTime ? (
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '20px 18px',
              marginBottom: 20,
              width: '100%',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--heading)',
                margin: '0 0 14px',
                textAlign: 'center',
              }}
            >
              Upoznaj {personaCfg.name.split(' ')[0]}
            </h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <img
                src={personaCfg.avatar}
                alt={personaCfg.name}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${personaCfg.accentColor}`,
                }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const sib = /** @type {HTMLElement} */ e.currentTarget.nextSibling;
                  if (sib) sib.style.display = 'flex';
                }}
              />
              <div
                style={{
                  display: 'none',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: `3px solid ${personaCfg.accentColor}`,
                  background: personaCfg.accentColor + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                }}
              >
                {personaCfg.fallbackEmoji}
              </div>
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 12px',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {(PERSONA_FACTS[personaKey] || []).map((item) => (
                <li
                  key={item}
                  style={{
                    fontSize: 14,
                    color: 'var(--heading)',
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
            <p
              style={{
                fontSize: 12,
                fontStyle: 'italic',
                color: 'var(--subtext)',
                margin: 0,
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              {PERSONA_TAGLINES[personaKey] || ''}
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '16px 18px',
              marginBottom: 20,
              width: '100%',
            }}
          >
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--heading)',
                margin: '0 0 4px',
              }}
            >
              Dobrodošli natrag, {name || 'Student'}! 👋
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--subtext)',
                margin: '0 0 8px',
              }}
            >
              Dosad {memory.sessionCount} {memory.sessionCount === 1 ? 'razgovor' : 'razgovora'} ·{' '}
              {memory.totalMinutes} minuta
            </p>
            {memory.recentVocab?.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--subtext)', margin: '0 0 6px' }}>
                Nedavno ste naučili:{' '}
                <strong>
                  {memory.recentVocab
                    .slice(0, 3)
                    .map((v) => v.hr)
                    .join(', ')}
                </strong>
              </p>
            )}
            {memory.nextTopicSuggestion && (
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--info)',
                  background: 'var(--info-bg)',
                  border: '1px solid var(--info-b)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                💬 {memory.nextTopicSuggestion}
              </p>
            )}
          </div>
        ))}
    </div>
  );
}
