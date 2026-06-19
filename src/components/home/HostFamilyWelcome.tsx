import React from 'react';
import CharacterPortrait from '../family/CharacterPortrait';
import { hostOfDay, HOST_WELCOME, HOST_NAME } from './hostFamily';

function timeGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Dobro jutro' : h < 18 ? 'Dobar dan' : 'Dobra večer';
}

const DOTS_TOTAL = 7;

/**
 * Dom welcome — a host-of-the-day greets the user over an Adriatic scene.
 * Replaces the old plain text greeting. Keeps the "<time greeting>, <name>!"
 * text so the user's name stays visible (home.spec relies on it).
 */
export default function HostFamilyWelcome({
  name,
  streakCount,
  dayIdx,
}: {
  name: string;
  streakCount: number;
  dayIdx: number;
}) {
  const host = hostOfDay(dayIdx);
  const w = HOST_WELCOME[host];
  const sceneUrl = `${import.meta.env.BASE_URL}images/scenes/${w.scene}`;
  const dotsOn = Math.max(0, Math.min(streakCount, DOTS_TOTAL));
  const greeting = `${timeGreeting()}, ${name}!`;

  return (
    <div
      data-testid="host-welcome"
      style={{
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 14,
        color: '#fff',
        boxShadow: '0 8px 22px rgba(14,116,144,.18)',
      }}
    >
      <div
        style={{ height: 4, background: 'linear-gradient(90deg,#D40030 0 50%,#C8980A 50% 100%)' }}
      />
      <div style={{ position: 'relative', padding: '16px 16px 18px' }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('${sceneUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg,rgba(8,40,55,.34) 0%,rgba(8,40,55,.12) 40%,rgba(20,40,50,.80) 100%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 60,
                height: 60,
                flex: 'none',
                borderRadius: '50%',
                padding: 3,
                background: 'linear-gradient(135deg,#FFE070,#C8980A)',
                boxShadow: '0 4px 14px rgba(0,0,0,.35)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,.9)',
                  background: '#fbf6ec',
                }}
              >
                <CharacterPortrait name={host} title={HOST_NAME[host]} size={52} />
              </span>
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  opacity: 0.95,
                  textShadow: '0 1px 3px rgba(0,0,0,.45)',
                }}
              >
                {greeting}
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1.05,
                  textShadow: '0 1px 4px rgba(0,0,0,.45)',
                }}
              >
                {HOST_NAME[host]}
              </div>
            </div>
          </div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontStyle: 'italic',
              fontSize: 15,
              lineHeight: 1.4,
              margin: '12px 2px 3px',
              textShadow: '0 1px 4px rgba(0,0,0,.45)',
            }}
          >
            „{w.hr}”
          </div>
          <div style={{ fontSize: 11.5, opacity: 0.93, textShadow: '0 1px 3px rgba(0,0,0,.4)' }}>
            “{w.en}”
          </div>
          {streakCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 12,
                fontSize: 11,
                fontWeight: 600,
                opacity: 0.95,
              }}
            >
              <span>{streakCount}. jutro zaredom</span>
              {Array.from({ length: DOTS_TOTAL }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i < dotsOn ? '#FFE070' : 'rgba(255,255,255,.4)',
                    boxShadow: i < dotsOn ? '0 0 6px rgba(255,224,112,.7)' : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
