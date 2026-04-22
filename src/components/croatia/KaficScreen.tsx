import React, { useState } from 'react';
import { speak, H } from '../../data';

const COFFEE_TYPES = [
  {
    name: 'Espresso',
    desc: 'Small, strong, black. The default when you just say "kava".',
    hr: 'Jedno espresso, molim.',
    ph: 'yed-no es-pres-so mo-lim',
  },
  {
    name: 'Bijela kava',
    desc: 'Filtered coffee with warm milk. The most popular morning choice.',
    hr: 'Bijelu kavu, molim.',
    ph: 'bi-ye-lu ka-vu mo-lim',
  },
  {
    name: 'Macchiato',
    desc: 'Espresso with a drop of milk foam. Split loves this.',
    hr: 'Macchiato, molim.',
    ph: 'ma-kia-to mo-lim',
  },
  {
    name: 'Kava s mlijekom',
    desc: 'Coffee with milk, Dalmatian style — often just espresso topped up.',
    hr: 'Kavu s mlijekom, molim.',
    ph: 'ka-vu s mli-ye-kom mo-lim',
  },
  {
    name: 'Turska kava',
    desc: 'Turkish coffee — still made in Herzegovina and older households. Thick, unfiltered, with grounds.',
    hr: 'Tursku kavu, molim.',
    ph: 'tur-sku ka-vu mo-lim',
  },
  {
    name: 'Čaj',
    desc: 'Tea. Ordering tea in a kafić is slightly eccentric but perfectly acceptable.',
    hr: 'Jedan čaj, molim.',
    ph: 'ye-dan chay mo-lim',
  },
];

const CULTURAL_RULES = [
  {
    icon: '⏱️',
    title: 'Time moves differently',
    body: '"Idemo na kavu" rarely means 20 minutes. It means 1–2 hours minimum. A Croat who says "brza kava" is lying to themselves.',
  },
  {
    icon: '💰',
    title: 'Who pays?',
    body: '"Plaćam ja" (I\'ll pay) is a social statement. Among friends, it often rotates. At a first meeting with someone older, let them pay — or fight gently for the honor.',
  },
  {
    icon: '🧾',
    title: "The bill doesn't come to you",
    body: 'You have to ask: "Račun, molim!" The waiter will not bring it until you do. This is not forgetfulness — you are welcome to stay all day.',
  },
  {
    icon: '☀️',
    title: 'Špica — the Zagreb ritual',
    body: 'Every Saturday morning in Zagreb, the entire city goes to the kafić. This is called the "špica" — you see and be seen. It\'s not about the coffee. It\'s about life.',
  },
  {
    icon: '🌊',
    title: 'The terrace is everything',
    body: 'Croatians sit outside by default, even in October. The terasa (terrace) is reserved for serious conversation, people-watching, and long afternoons doing nothing in particular.',
  },
  {
    icon: '🗣️',
    title: '"Idemo na kavu" = an invitation into the circle',
    body: 'When a Croatian invites you for coffee, they are inviting you into their social world. Say yes. Always say yes the first time.',
  },
];

const PHRASES = [
  { hr: 'Idemo na kavu?', en: 'Shall we go for coffee?', ph: 'i-de-mo na ka-vu' },
  { hr: 'Gdje da sjednemo?', en: 'Where shall we sit?', ph: 'gd-ye da syed-ne-mo' },
  { hr: 'Što ćete popiti?', en: 'What will you have?', ph: 'shto che-te po-pi-ti' },
  {
    hr: 'Molim jednu kavu i sok.',
    en: 'One coffee and a juice please.',
    ph: 'mo-lim yed-nu ka-vu i sok',
  },
  { hr: 'Plaćam ja!', en: "I'll pay!", ph: 'pla-cham ya' },
  {
    hr: 'Nema veze, drugi put ti.',
    en: "No worries, next time it's on you.",
    ph: 'ne-ma ve-ze dru-gi put ti',
  },
  { hr: 'Račun, molim!', en: 'The bill, please!', ph: 'ra-chun mo-lim' },
  {
    hr: 'Možemo li ostati malo dulje?',
    en: 'Can we stay a bit longer?',
    ph: 'mo-zhe-mo li os-ta-ti ma-lo dul-ye',
  },
  { hr: 'Ovdje je super.', en: 'This place is great.', ph: 'ov-dye ye su-per' },
  { hr: 'Kako ti je?', en: 'How are you? (in the kafić context)', ph: 'ka-ko ti ye' },
];

interface KaficScreenProps {
  goBack: () => void;
}

export default function KaficScreen({ goBack }: KaficScreenProps) {
  const [tab, setTab] = useState('culture'); // 'culture' | 'order' | 'phrases'

  const tabs = [
    { id: 'culture', label: '🇭🇷 The Ritual' },
    { id: 'order', label: '☕ Order' },
    { id: 'phrases', label: '💬 Phrases' },
  ];

  return (
    <div>
      {H('☕ U Kafiću', "Croatia's most important social institution", goBack)}

      {/* Intro */}
      <div
        style={{
          background: 'linear-gradient(135deg,rgba(146,64,14,.1),rgba(14,116,144,.07))',
          border: '1.5px solid rgba(146,64,14,.2)',
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.7 }}>
          The <strong style={{ color: 'var(--heading)' }}>kafić</strong> is not just a place to
          drink coffee. It is where Croatia thinks, gossips, argues, falls in love, and does
          business. Learning to navigate it is learning to be Croatian.
        </div>
      </div>

      {/* Tab selector */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          background: 'var(--bar-bg)',
          borderRadius: 12,
          padding: 4,
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '9px 6px',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              background: tab === t.id ? 'var(--card)' : 'transparent',
              fontFamily: "'Outfit',sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: tab === t.id ? 'var(--heading)' : 'var(--subtext)',
              boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              transition: 'all .2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CULTURE TAB */}
      {tab === 'culture' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CULTURAL_RULES.map((r, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 14,
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--heading)',
                      marginBottom: 4,
                    }}
                  >
                    {r.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6 }}>
                    {r.body}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 8,
              padding: '14px 16px',
              borderRadius: 14,
              background: 'rgba(14,116,144,.07)',
              border: '1.5px solid rgba(14,116,144,.2)',
              fontSize: 12,
              color: 'var(--subtext)',
              lineHeight: 1.6,
              textAlign: 'center',
            }}
          >
            🇭🇷 The word <strong style={{ color: 'var(--heading)' }}>kafić</strong> (not "kafana",
            not "bar") is what Croatians say. Using the right word is already half the battle.
          </div>
        </div>
      )}

      {/* ORDER TAB */}
      {tab === 'order' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600, marginBottom: 4 }}>
            Tap any order to hear it spoken
          </p>
          {COFFEE_TYPES.map((c, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-b)' }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: 'var(--heading)',
                    marginBottom: 2,
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext)', lineHeight: 1.5 }}>
                  {c.desc}
                </div>
              </div>
              <button
                aria-label={`Play audio for ${c.hr}`}
                onClick={() => speak(c.hr)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Outfit',sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 16 }}>
                  🔊
                </span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#0e7490',
                      fontFamily: "'Playfair Display',serif",
                    }}
                  >
                    {c.hr}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--subtext)', fontStyle: 'italic' }}>
                    /{c.ph}/
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* PHRASES TAB */}
      {tab === 'phrases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600, marginBottom: 4 }}>
            Tap any phrase to hear it
          </p>
          {PHRASES.map((p, i) => (
            <button
              key={i}
              aria-label={`Play audio for ${p.hr}`}
              onClick={() => speak(p.hr)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: 'var(--card)',
                border: '1px solid var(--card-b)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>
                🔊
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {p.hr}
                </div>
                <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 600, marginTop: 1 }}>
                  {p.en}
                </div>
                <div style={{ fontSize: 10, color: 'var(--subtext)', fontStyle: 'italic' }}>
                  /{p.ph}/
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
