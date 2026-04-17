// @ts-nocheck
import React, { useState } from 'react';
import { speak, H } from '../../data';

const SITUATIONS = [
  {
    situation: 'Asking for help',
    context: 'Friend vs. stranger on the street',
    informal: { hr: 'Možeš li mi pomoći?', en: 'Can you help me?' },
    formal: { hr: 'Možete li mi pomoći?', en: 'Could you help me?' },
    tip: 'The only difference: ti → vi, možeš → možete. The verb ending tells the register.',
  },
  {
    situation: 'Asking the price',
    context: 'Same shop, different tone',
    informal: { hr: 'Koliko košta?', en: 'How much does it cost?' },
    formal: { hr: 'Koliko košta, molim?', en: 'How much does it cost, please?' },
    tip: 'Adding "molim" instantly makes anything more formal. Works in every situation.',
  },
  {
    situation: 'Introducing yourself',
    context: 'New friend vs. job interview',
    informal: { hr: 'Ja sam [ime]. Ti?', en: 'I\'m [name]. You?' },
    formal: { hr: 'Dopustite da se predstavim — zovem se [ime].', en: 'Allow me to introduce myself — my name is [name].' },
    tip: '"Dopustite" (formal imperative of dopustiti) is a classic formal opener — very polished.',
  },
  {
    situation: 'Asking someone to repeat',
    context: 'Friend vs. official / older person',
    informal: { hr: 'Što si rekao/rekla?', en: 'What did you say?' },
    formal: { hr: 'Molim, možete li ponoviti?', en: 'Please, could you repeat?' },
    tip: '"Što si rekao" is perfectly natural with friends. With elders, always use "Možete li".',
  },
  {
    situation: 'Saying sorry',
    context: 'Bumping into a friend vs. a stranger',
    informal: { hr: 'Oprosti!', en: 'Sorry!' },
    formal: { hr: 'Oprostite, molim!', en: 'Please forgive me!' },
    tip: '"Oprosti" (ti) and "Oprostite" (vi) — memorize both. The -te ending is the formal marker.',
  },
  {
    situation: 'Asking where something is',
    context: 'Friend vs. someone on the street',
    informal: { hr: 'Gdje je toalet?', en: 'Where is the toilet?' },
    formal: { hr: 'Oprostite, možete li mi reći gdje je WC?', en: 'Excuse me, could you tell me where the WC is?' },
    tip: 'In Croatia "WC" (ve-tse) is more common than "toalet" in formal contexts.',
  },
  {
    situation: 'Offering food/drink',
    context: 'Family friend vs. a guest you just met',
    informal: { hr: 'Hoćeš li nešto pojesti?', en: 'Do you want something to eat?' },
    formal: { hr: 'Hoćete li nešto pojesti?', en: 'Would you like something to eat?' },
    tip: 'At Croatian family gatherings, this question is asked at least 5 times regardless of register.',
  },
  {
    situation: 'Saying goodbye',
    context: 'To a friend vs. an elder',
    informal: { hr: 'Bog! / Ćao!', en: 'Bye! / Ciao!' },
    formal: { hr: 'Doviđenja! / Do skorog viđenja!', en: 'Goodbye! / Until we meet again!' },
    tip: '"Bog" and "Ćao" are casual. "Doviđenja" is always safe — neutral to respectful.',
  },
  {
    situation: 'Saying you don\'t understand',
    context: 'Friend vs. teacher / official',
    informal: { hr: 'Ne razumijem. Možeš to ponoviti?', en: 'I don\'t understand. Can you repeat that?' },
    formal: { hr: 'Žao mi je, ne razumijem. Možete li govoriti sporije?', en: 'I\'m sorry, I don\'t understand. Could you speak more slowly?' },
    tip: 'Adding "Žao mi je" (I\'m sorry) before admitting confusion shows politeness.',
  },
  {
    situation: 'Asking someone\'s name',
    context: 'Meeting a new person',
    informal: { hr: 'Kako se zoveš?', en: 'What\'s your name?' },
    formal: { hr: 'Kako se zovete?', en: 'What is your name?' },
    tip: 'Simple: zoveš (ti form) → zovete (vi form). Same verb, different ending.',
  },
  {
    situation: 'Entering a shop or office',
    context: 'Default greeting on entering',
    informal: { hr: 'Bok!', en: 'Hi!' },
    formal: { hr: 'Dobar dan!', en: 'Good day!' },
    tip: '"Dobar dan" is always appropriate when entering any business. Never wrong.',
  },
  {
    situation: 'Thanking someone',
    context: 'Quick thanks vs. heartfelt gratitude',
    informal: { hr: 'Hvala!', en: 'Thanks!' },
    formal: { hr: 'Hvala lijepa, jako ste ljubazni.', en: 'Thank you kindly, you are very kind.' },
    tip: '"Hvala lijepa" (literally "beautiful thanks") is a warm, more formal expression of gratitude.',
  },
];

export default function TiViScreen({ goBack }) {
  const [selected, setSelected] = useState(null);
  const [_showFormal, _setShowFormal] = useState(null); // null = show both, 'formal'/'informal' = filter

  const displayed = SITUATIONS;

  return (
    <div>
      {H('🎭 Ti vs Vi', 'Formal & informal Croatian side by side', goBack)}

      {/* Explanation */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--card-b)',
        borderRadius: 16, padding: '16px 18px', marginBottom: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#f0f9ff', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>😊</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0369a1' }}>Ti (informal)</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>Friends, family, peers, children, younger people</div>
          </div>
          <div style={{ background: '#faf5ff', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🤝</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#7c3aed' }}>Vi (formal)</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>Strangers, elders, officials, doctors, teachers</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5, textAlign: 'center' }}>
          When in doubt, use <strong>Vi</strong>. Croatians will invite you to switch to <em>ti</em> if they want to — it's a warm social gesture.
        </div>
      </div>

      {/* Situations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {displayed.map((s, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: `1.5px solid ${selected === i ? '#0e7490' : 'var(--card-b)'}`,
            borderRadius: 14, overflow: 'hidden', transition: 'border-color .2s',
          }}>
            <button onClick={() => setSelected(selected === i ? null : i)} style={{
              width: '100%', padding: '13px 16px', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', marginBottom: 1 }}>{s.situation}</div>
                <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic' }}>{s.context}</div>
              </div>
              <span style={{ fontSize: 14, color: 'var(--subtext)', opacity: .5, flexShrink: 0, marginLeft: 8 }}>{selected === i ? '▲' : '▼'}</span>
            </button>
            {selected === i && (
              <div style={{ borderTop: '1px solid var(--card-b)' }}>
                {/* Informal */}
                <div style={{ padding: '12px 16px', background: 'rgba(3,105,161,.04)', borderBottom: '1px solid var(--card-b)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    😊 Ti — Informal
                  </div>
                  <button aria-label={`Play audio for ${s.informal.hr}`} onClick={() => speak(s.informal.hr)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: "'Outfit',sans-serif",
                  }}>
                    <span aria-hidden="true" style={{ fontSize: 16 }}>🔊</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0369a1', fontFamily: "'Playfair Display',serif" }}>{s.informal.hr}</div>
                      <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 1 }}>{s.informal.en}</div>
                    </div>
                  </button>
                </div>
                {/* Formal */}
                <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,.04)', borderBottom: '1px solid var(--card-b)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                    🤝 Vi — Formal
                  </div>
                  <button aria-label={`Play audio for ${s.formal.hr}`} onClick={() => speak(s.formal.hr)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: "'Outfit',sans-serif",
                  }}>
                    <span aria-hidden="true" style={{ fontSize: 16 }}>🔊</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#7c3aed', fontFamily: "'Playfair Display',serif" }}>{s.formal.hr}</div>
                      <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 1 }}>{s.formal.en}</div>
                    </div>
                  </button>
                </div>
                {/* Tip */}
                <div style={{ padding: '10px 16px', fontSize: 11, color: 'var(--subtext)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  💡 {s.tip}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: '14px 16px', borderRadius: 14,
        background: 'rgba(14,116,144,.07)', border: '1.5px solid rgba(14,116,144,.2)',
        fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6, textAlign: 'center',
      }}>
        🇭🇷 Most Croatians will switch to informal <em>ti</em> quickly once rapport is established. Follow their lead.
      </div>
    </div>
  );
}
