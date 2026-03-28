import React from 'react';

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m} min ${s} sec`;
}

export default function DebriefScreen({ debrief, conversation, durationSecs, onContinue, onBack, award }) {
  const cardStyle = (borderColor) => ({
    background: 'var(--card)',
    border: `1px solid var(--card-b)`,
    borderLeft: `3px solid ${borderColor}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  });

  const confettiEmojis = ['🎉', '🌟', '🏆', '✨', '🎊', '💫', '🥳', '🎈'];

  return (
    <div
      style={{
        animation: 'debrief-pop 0.5s ease-out both',
        paddingBottom: 40,
      }}
    >
      {/* Confetti row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          fontSize: 22,
          marginBottom: 8,
          overflow: 'hidden',
          height: 50,
          position: 'relative',
        }}
      >
        {confettiEmojis.map((e, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              animation: `maja-confetti-fall 1.8s ease-in ${(i * 0.18).toFixed(2)}s both`,
            }}
          >
            {e}
          </span>
        ))}
      </div>

      <h2
        style={{
          textAlign: 'center',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--heading)',
          margin: '0 0 4px',
        }}
      >
        Razgovor završen!
      </h2>
      <p
        style={{
          textAlign: 'center',
          color: 'var(--subtext)',
          fontSize: 13,
          margin: '0 0 20px',
        }}
      >
        {fmtDuration(durationSecs)}
      </p>

      {/* Maja's note */}
      <div style={{ ...cardStyle('#D4002D'), display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <img
          src="/images/portraits/tutor-hero.webp"
          alt="Maja"
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
            border: '2px solid #D4002D',
          }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <p
          style={{
            fontSize: 14,
            fontStyle: 'italic',
            lineHeight: 1.6,
            color: 'var(--heading)',
            margin: 0,
          }}
        >
          {debrief.majaNotes}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Poruke', value: conversation.length },
          { label: 'Nove riječi', value: debrief.newVocab?.length ?? 0 },
          { label: 'XP', value: `+${debrief.xpEarned ?? 30}` },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 10,
              padding: '10px 6px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--heading)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Did well */}
      <div style={cardStyle('#16a34a')}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--heading)', lineHeight: 1.5 }}>
          ✅ {debrief.didWell}
        </p>
      </div>

      {/* Focus next */}
      <div style={cardStyle('#b45309')}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--heading)', lineHeight: 1.5 }}>
          🎯 {debrief.focusNext}
        </p>
      </div>

      {/* New vocab */}
      {debrief.newVocab?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--heading)',
              margin: '0 0 10px',
            }}
          >
            Nove Riječi
          </h3>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {debrief.newVocab.map((v, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 14px',
                  borderBottom: i < debrief.newVocab.length - 1 ? '1px solid var(--card-b)' : 'none',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: '#D4002D', fontWeight: 700 }}>{v.hr}</span>
                <span style={{ color: 'var(--subtext)' }}> — </span>
                <span style={{ color: 'var(--heading)' }}>{v.en}</span>
                {v.used_in && (
                  <span style={{ color: 'var(--subtext)', fontStyle: 'italic', fontSize: 12 }}>
                    {' '}· {v.used_in}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level-up suggestion */}
      {debrief.suggestLevelUp && debrief.suggestLevelUpTo && (
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed22, #a855f722)',
            border: '2px solid #7c3aed',
            borderRadius: 14,
            padding: '16px 18px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>🌟</div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#7c3aed', marginBottom: 4 }}>
            Ready to Level Up to {debrief.suggestLevelUpTo}?
          </div>
          {debrief.levelUpMessage && (
            <div style={{ fontSize: 13, color: '#7c3aed', opacity: 0.85, fontStyle: 'italic', marginBottom: 10 }}>
              "{debrief.levelUpMessage}"
            </div>
          )}
          <div style={{ fontSize: 12, color: '#7c3aed', opacity: 0.7 }}>
            You can change your level in the conversation settings.
          </div>
        </div>
      )}

      {/* Next topic teaser */}
      {debrief.nextTopicSuggestion && (
        <div
          style={{
            background: 'var(--info-bg)',
            border: '1px solid var(--info-b)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--info)',
            lineHeight: 1.5,
          }}
        >
          <strong>Sljedeći put:</strong> {debrief.nextTopicSuggestion}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 12,
            background: '#D4002D',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          +{debrief.xpEarned ?? 30} XP · Natrag
        </button>
        <button
          onClick={onContinue}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            background: 'transparent',
            color: 'var(--heading)',
            border: '1px solid var(--card-b)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Nastavi razgovor
        </button>
      </div>
    </div>
  );
}
