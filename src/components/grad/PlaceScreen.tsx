import React, { useState } from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import SpeedChallenge from '../home/SpeedChallenge';
import { PLACES, type PlaceId } from './places';
import { itemsForPlace, placeStats, type ModelCtx, type GradItem } from './gradModel';

// CEFR lock-pill colours. Exported so a unit test can assert WCAG AA contrast.
// #5f5747 on #ece6d9 = 5.74:1 (passes AA for the 10px bold pill, which needs
// 4.5:1). The previous #8a7f68 was 3.09:1 and was additionally dimmed by a
// row-wide opacity:0.62 (~2.6:1 effective) — both are fixed here.
export const LOCK_PILL_FG = '#5f5747';
export const LOCK_PILL_BG = '#ece6d9';

// Per-place hero scene assets (only kavana has bespoke art so far; other places
// use a tinted gradient banner — bespoke per-place scenes are a follow-up).
const SCENES: Partial<Record<PlaceId, string>> = {
  kavana: `${import.meta.env.BASE_URL}images/grad-kavana.svg`,
};

const GREETINGS: Record<PlaceId, { hr: string; en: string }> = {
  kavana: {
    hr: 'Dobrodošao natrag! Sjedni, idemo naručiti.',
    en: "Welcome back! Sit down, let's order.",
  },
  trznica: { hr: 'Svježe riječi za danas — dođi!', en: 'Fresh words today — come in!' },
  soba: {
    hr: 'Spreman za vježbu? Otvori bilježnicu.',
    en: 'Ready to practise? Open your notebook.',
  },
  kuhinja: { hr: 'Sjedni, ispričat ću ti priču.', en: "Sit, I'll tell you a story." },
  ulica: { hr: 'Uskači, naučit ću te ulični govor.', en: "Hop in, I'll teach you street talk." },
  trg: { hr: 'Dođi na Trg — vrijeme je za igru!', en: 'Come to the Square — time to play!' },
};

function ExerciseRow({ item }: { item: GradItem }) {
  return (
    <button
      onClick={item.locked ? undefined : () => item.launch()}
      disabled={item.locked}
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
        cursor: item.locked ? 'default' : 'pointer',
        // No row-wide opacity: dimming the whole row pushed the lock pill below
        // WCAG AA. "Locked" is signalled by the disabled state, the dimmed icon,
        // and the lock pill instead.
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
          background: item.locked ? LOCK_PILL_BG : 'rgba(14,116,144,.10)',
          opacity: item.locked ? 0.5 : 1, // decorative emoji — exempt from contrast
        }}
      >
        {item.icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
          {item.label}
        </span>
        {item.desc && (
          <span style={{ display: 'block', fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
            {item.desc} · {item.cefr}
          </span>
        )}
      </span>
      {item.locked && (
        <span
          style={{
            flex: 'none',
            background: LOCK_PILL_BG,
            color: LOCK_PILL_FG,
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          🔒 {item.cefr}
        </span>
      )}
    </button>
  );
}

export default function PlaceScreen({
  placeId,
  ctx,
  onBack,
}: {
  placeId: PlaceId;
  ctx: ModelCtx;
  onBack: () => void;
}) {
  const place = PLACES.find((p) => p.id === placeId)!;
  const items = itemsForPlace(placeId, ctx);
  const stats = placeStats(placeId, ctx);
  const greeting = GREETINGS[placeId];
  const scene = SCENES[placeId];
  const recommended = items.find((i) => !i.locked);
  const [speedOpen, setSpeedOpen] = useState(false);

  return (
    <div data-testid="place-screen">
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
          ← Grad
        </button>
        <span
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--heading)',
          }}
        >
          {place.name}
        </span>
      </div>

      {/* hero */}
      <div
        style={{
          position: 'relative',
          height: 150,
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 14,
          background: scene
            ? undefined
            : `linear-gradient(135deg,${place.tint},rgba(14,116,144,.22))`,
        }}
      >
        {scene && (
          <img
            src={scene}
            alt={place.nameEn}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            padding: '12px 14px',
            background: 'linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(20,30,40,.5))',
          }}
        >
          {place.host && (
            <span
              style={{
                flex: 'none',
                borderRadius: '50%',
                padding: 3,
                background: 'linear-gradient(135deg,#C8980A,#e0b84a)',
                display: 'flex',
              }}
            >
              <CharacterPortrait name={place.host} size={56} />
            </span>
          )}
          <span style={{ flex: 1, color: '#fff' }}>
            <span
              style={{
                display: 'block',
                fontFamily: "'Playfair Display',serif",
                fontSize: 16,
                fontWeight: 800,
                textShadow: '0 1px 4px rgba(0,0,0,.4)',
              }}
            >
              {greeting.hr}
            </span>
            <span style={{ display: 'block', fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              {greeting.en}
            </span>
          </span>
        </div>
      </div>

      {/* progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11.5,
          color: 'var(--subtext)',
          fontWeight: 600,
          margin: '2px 2px 14px',
        }}
      >
        <span>
          {stats.done} od {stats.total}
        </span>
        {stats.due > 0 && <span>· {stats.due} za ponavljanje</span>}
        {stats.lockedCount > 0 && <span>· {stats.lockedCount} zaključano</span>}
      </div>

      {/* Nastavi card */}
      {recommended && (
        <button
          onClick={() => recommended.launch()}
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
            {recommended.icon}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                opacity: 0.7,
              }}
            >
              Nastavi · preporučeno
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 15.5,
                fontWeight: 900,
                lineHeight: 1.2,
                marginTop: 1,
              }}
            >
              {recommended.label}
            </span>
          </span>
          <span
            style={{
              flex: 'none',
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
      )}

      {/* Trg: the 60-second Speed Challenge lives in the games hub */}
      {placeId === 'trg' && (
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setSpeedOpen((o) => !o)}
            aria-expanded={speedOpen}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 14,
              padding: '12px 13px',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              boxShadow: '0 1px 3px rgba(0,0,0,.05)',
            }}
          >
            <span style={{ fontSize: 21 }}>⚡</span>
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span
                style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}
              >
                Speed Challenge
              </span>
              <span
                style={{ display: 'block', fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}
              >
                60 sekundi · koliko ih možeš?
              </span>
            </span>
            <span style={{ color: 'var(--subtext)' }}>{speedOpen ? '▲' : '▾'}</span>
          </button>
          {speedOpen && (
            <div style={{ marginTop: 10 }}>
              <SpeedChallenge />
            </div>
          )}
        </div>
      )}

      {/* exercise list */}
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
        Vježbe ovdje
      </div>

      {place.subgroups ? (
        place.subgroups.map((sg, idx) => {
          const sgItems = items.filter((i) => i.subgroup === sg.key);
          if (!sgItems.length) return null;
          return (
            <details key={sg.key} open={idx === 0} style={{ marginBottom: 10 }}>
              <summary
                style={{
                  cursor: 'pointer',
                  listStyle: 'none',
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--heading)',
                  padding: '8px 2px',
                }}
              >
                {sg.label}{' '}
                <span style={{ color: 'var(--subtext)', fontWeight: 600 }}>· {sgItems.length}</span>
              </summary>
              {sgItems.map((i) => (
                <ExerciseRow key={i.id} item={i} />
              ))}
            </details>
          );
        })
      ) : (
        <>
          {items.map((i) => (
            <ExerciseRow key={i.id} item={i} />
          ))}
        </>
      )}
    </div>
  );
}
