import React from 'react';

interface Props {
  card: (string | undefined)[];
  cardImg: string | null;
  cardImgLoading: boolean;
}
export default function FlashcardCardFront({ card, cardImg, cardImgLoading }: Props) {
  const word = card[0];
  const example = card[3];
  const escapedWord = word ? word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const blankedExample =
    example && word ? example.replace(new RegExp(escapedWord, 'gi'), '___') : null; // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp

  return (
    <div
      className="fc-face fc-front"
      style={{ padding: 0, overflow: 'hidden', borderRadius: 'inherit' }}
    >
      {/* AI contextual scene image */}
      <div
        style={{
          width: '100%',
          height: 130,
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
          background: cardImgLoading
            ? 'linear-gradient(135deg,rgba(14,116,144,.08),rgba(14,116,144,.04))'
            : cardImg
              ? undefined
              : 'linear-gradient(135deg,rgba(14,116,144,.06),rgba(12,74,110,.10))',
        }}
      >
        {cardImg && (
          <img
            src={cardImg}
            alt=""
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {cardImgLoading && !cardImg && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--info)',
                  opacity: 0.4,
                  animation: `dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        )}
        {!cardImg && !cardImgLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              opacity: 0.18,
            }}
          >
            🇭🇷
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 50,
            background: 'linear-gradient(to bottom, transparent, var(--card))',
            pointerEvents: 'none',
          }}
        />
        {cardImg && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              borderRadius: 20,
              padding: '2px 8px',
              fontSize: 9,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '.04em',
            }}
          >
            ✦ AI
          </div>
        )}
      </div>

      {/* Word / fill-in-the-blank content */}
      <div style={{ padding: '8px 20px 16px', textAlign: 'center' }}>
        {blankedExample ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 8, fontWeight: 600 }}
            >
              Fill in the blank:
            </div>
            <div
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--heading)', lineHeight: 1.5 }}
            >
              {blankedExample}
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: 'var(--info)',
                fontFamily: "'Playfair Display',serif",
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              {word}
            </div>
            {card[2] && (
              <div style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 6 }}>/{card[2]}/</div>
            )}
          </>
        )}
        <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 10 }}>
          tap to see English
        </div>
      </div>
    </div>
  );
}
