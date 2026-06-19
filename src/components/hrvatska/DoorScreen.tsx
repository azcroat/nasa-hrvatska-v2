import React from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import StoriesTab from '../croatia/StoriesTab';
import MediaTab from '../croatia/MediaTab';
import { DOORS, itemsForDoor, launchDoorItem, type DoorId, type DoorItem } from './doors';

function isEasterSeason(): boolean {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return (m === 3 && d >= 20) || (m === 4 && d <= 30);
}

function ItemCard({
  item,
  nav,
}: {
  item: DoorItem;
  nav: { setScr: (s: string) => void; sCurEx?: (e: string) => void };
}) {
  return (
    <button
      onClick={() => launchDoorItem(item, nav)}
      className="exercise-card"
      style={{
        borderLeftColor: item.color,
        border: `1.5px solid ${item.color}25`,
        borderLeftWidth: 3,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${item.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {item.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--heading)',
            lineHeight: 1.2,
            marginBottom: 2,
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', lineHeight: 1.3 }}>
          {item.sub}
        </div>
      </div>
    </button>
  );
}

export default function DoorScreen({
  doorId,
  setScr,
  sCurEx,
  onBack,
}: {
  doorId: DoorId;
  setScr: (s: string) => void;
  sCurEx?: (e: string) => void;
  onBack: () => void;
}) {
  const door = DOORS.find((d) => d.id === doorId)!;
  const nav = { setScr, sCurEx };
  const easter = isEasterSeason();
  const items = itemsForDoor(doorId).filter((i) => (i.seasonal === 'easter' ? easter : true));
  const recommended = items[0];
  const rest = items.slice(1);

  return (
    <div data-testid="door-screen">
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
          ← Hrvatska
        </button>
        <span
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--heading)',
          }}
        >
          {door.title}
        </span>
      </div>

      {/* host hero */}
      <div
        style={{
          position: 'relative',
          minHeight: 132,
          borderRadius: 18,
          overflow: 'hidden',
          marginBottom: 16,
          background: `linear-gradient(135deg,${door.tint},rgba(14,116,144,.28))`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          padding: 14,
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
          <CharacterPortrait name={door.host} size={64} />
        </span>
        <span style={{ flex: 1, color: 'var(--heading)' }}>
          <span
            style={{
              display: 'block',
              fontFamily: "'Playfair Display',serif",
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {door.voiceLine.hr}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--subtext)', marginTop: 3 }}>
            {door.voiceLine.en}
          </span>
        </span>
      </div>

      {/* recommended */}
      {recommended && (
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
            Za početak
          </div>
          <div style={{ marginBottom: 16 }}>
            <ItemCard item={recommended} nav={nav} />
          </div>
        </>
      )}

      {/* the rest of the door's cards */}
      {rest.length > 0 && (
        <div className="g2" style={{ gap: 8 }}>
          {rest.map((item) => (
            <ItemCard key={item.id} item={item} nav={nav} />
          ))}
        </div>
      )}

      {/* embedded sub-tab (Stories for Priče, Media for Mediji) */}
      {door.embeds === 'stories' && (
        <div style={{ marginTop: 18 }}>
          <StoriesTab />
        </div>
      )}
      {door.embeds === 'media' && (
        <div style={{ marginTop: 18 }}>
          <MediaTab />
        </div>
      )}
    </div>
  );
}
