// @ts-nocheck
import React, { useState } from 'react';
import { speak, H } from '../../data';

const SCENARIOS = [
  {
    id: 'comprehension',
    icon: '🤔',
    title: 'I Didn\'t Understand',
    color: '#fff7ed',
    border: '#fed7aa',
    phrases: [
      { hr: 'Molim?', en: 'Sorry? / Excuse me?', ph: 'mo-lim', tip: 'Friendly way to ask someone to repeat' },
      { hr: 'Možete li ponoviti?', en: 'Can you repeat that?', ph: 'moh-zhe-te li po-no-vi-ti', tip: 'Polite, use with elders' },
      { hr: 'Govorite li sporije?', en: 'Can you speak more slowly?', ph: 'go-vo-ri-te li spo-ri-ye', tip: 'They will slow down and enunciate' },
      { hr: 'Nisam razumio/razumjela.', en: 'I didn\'t understand.', ph: 'ni-sam ra-zu-mi-yo/ra-zum-ye-la', tip: 'razumio (male speaker) / razumjela (female speaker)' },
      { hr: 'Što to znači?', en: 'What does that mean?', ph: 'shto to zna-chi', tip: 'Point at food or object if needed' },
    ],
  },
  {
    id: 'food',
    icon: '🍽️',
    title: 'At the Table',
    color: '#f0fdf4',
    border: '#86efac',
    phrases: [
      { hr: 'Hvala, vrlo je ukusno!', en: 'Thank you, it\'s delicious!', ph: 'hva-la, vr-lo ye u-kus-no', tip: 'Say this about everything — mandatory!' },
      { hr: 'Mogu li uzeti još malo?', en: 'Can I have a little more?', ph: 'mo-gu li u-ze-ti yosh ma-lo', tip: 'They will love you for this' },
      { hr: 'Sit sam / Sita sam.', en: 'I\'m full.', ph: 'sit sam / si-ta sam', tip: 'sit (male) / sita (female). They won\'t believe you.' },
      { hr: 'Nije mi potrebna rakija, hvala.', en: 'I don\'t need rakija, thank you.', ph: 'ni-ye mi po-treb-na ra-ki-ya, hva-la', tip: 'They will insist. Smile and accept anyway.' },
      { hr: 'Prenesite mi, molim.', en: 'Please pass it to me.', ph: 'pre-ne-si-te mi, mo-lim', tip: 'Point at the dish as you say it' },
      { hr: 'Što je ovo?', en: 'What is this?', ph: 'shto ye o-vo', tip: 'Ask before eating anything brown' },
    ],
  },
  {
    id: 'social',
    icon: '😊',
    title: 'Being Polite',
    color: '#f5f3ff',
    border: '#c4b5fd',
    phrases: [
      { hr: 'Bog!', en: 'Hi! / Hello!', ph: 'boh', tip: 'The most natural Croatian greeting' },
      { hr: 'Dobar dan!', en: 'Good day! (formal)', ph: 'do-bar dan', tip: 'Use with grandparents and older relatives' },
      { hr: 'Drago mi je.', en: 'Nice to meet you.', ph: 'dra-go mi ye', tip: 'Say this to everyone when you arrive' },
      { hr: 'Hvala na pozivu.', en: 'Thank you for the invitation.', ph: 'hva-la na po-zi-vu', tip: 'Say to the host when you arrive' },
      { hr: 'Lijepo ste uredili.', en: 'You\'ve decorated beautifully.', ph: 'li-ye-po ste u-re-di-li', tip: 'Compliment the house — always a winner' },
      { hr: 'Čestitam!', en: 'Congratulations!', ph: 'che-sti-tam', tip: 'For birthdays, name days, achievements' },
    ],
  },
  {
    id: 'topics',
    icon: '💬',
    title: 'Safe Conversation Topics',
    color: '#f0f9ff',
    border: '#7dd3fc',
    phrases: [
      { hr: 'Kakvo je lijepo vrijeme!', en: 'What lovely weather!', ph: 'ka-kvo ye li-ye-po vri-ye-me', tip: 'Safe topic anywhere, anytime' },
      { hr: 'Jeste li gledali utakmicu?', en: 'Did you watch the match?', ph: 'yes-te li gle-da-li u-tak-mi-tsu', tip: 'Football — always welcome' },
      { hr: 'Gdje ste bili na odmoru?', en: 'Where did you go on holiday?', ph: 'gd-ye ste bi-li na od-mo-ru', tip: 'Every Croatian has a holiday story' },
      { hr: 'Koje ste otoke posjetili?', en: 'Which islands did you visit?', ph: 'ko-ye ste o-to-ke pos-ye-ti-li', tip: 'Dalmatia conversations open doors' },
      { hr: 'Volim hrvatsku kuhinju.', en: 'I love Croatian cuisine.', ph: 'vo-lim hr-vat-sku ku-hi-nyu', tip: 'Say this and watch faces light up' },
    ],
  },
  {
    id: 'emergency',
    icon: '🆘',
    title: 'Emergency Phrases',
    color: '#fff1f2',
    border: '#fca5a5',
    phrases: [
      { hr: 'Nisam alergičan/alergična.', en: 'I\'m not allergic.', ph: 'ni-sam a-ler-gi-chan/a-ler-gich-na', tip: 'Learn this before dinner starts' },
      { hr: 'Alergičan/Alergična sam na...', en: 'I\'m allergic to...', ph: 'a-ler-gi-chan/a-ler-gich-na sam na', tip: 'Then point at the food' },
      { hr: 'Trebam malo zraka.', en: 'I need some air.', ph: 'tre-bam ma-lo zra-ka', tip: 'Polite way to step outside' },
      { hr: 'Moram malo sjesti.', en: 'I need to sit down.', ph: 'mo-ram ma-lo syes-ti', tip: 'If things get overwhelming' },
      { hr: 'Gdje je WC?', en: 'Where is the bathroom?', ph: 'gd-ye ye ve-tse', tip: 'Essential. Always.' },
    ],
  },
  {
    id: 'hospitality',
    icon: '🫶',
    title: 'Croatian Hospitality',
    color: '#f5f3ff',
    border: '#c4b5fd',
    phrases: [
      { hr: 'Dođi na ručak!', en: 'Come for lunch!', ph: 'do-ji na ru-chak', tip: 'This is not a casual invitation. It means: you are being welcomed into the family circle.' },
      { hr: 'Nema rasprave!', en: 'There\'s no discussion! (you\'re coming)', ph: 'ne-ma ras-pra-ve', tip: 'Croatian hospitality is not optional. This is said with love.' },
      { hr: 'Ostani na večeri.', en: 'Stay for dinner.', ph: 'os-ta-ni na ve-che-ri', tip: 'The extended version of the invitation — you have made a good impression.' },
      { hr: 'Hvala, jako si/ste ljubazan/ljubazna.', en: 'Thank you, you are very kind.', ph: 'hva-la ya-ko si/ste lyu-ba-zan/lyu-baz-na', tip: 'Your required response when accepting. If you\'re declining: "Hvala, drugi put rado."' },
      { hr: 'Jesi li sit? / Jesi li sita?', en: 'Are you full? (asked at least 3 times)', ph: 'ye-si li sit / ye-si li si-ta', tip: 'sit (male) / sita (female). Say yes — then accept more food anyway.' },
      { hr: 'Uzmi još malo.', en: 'Take a little more.', ph: 'uz-mi yosh ma-lo', tip: 'Said with the authority of a direct order. Resistance is futile and rude.' },
      { hr: 'Donesi nešto slatko.', en: 'Bring something sweet (when visiting).', ph: 'do-ne-si ne-shto slat-ko', tip: 'You never arrive at a Croatian home empty-handed. Cake, chocolates, or wine.' },
      { hr: 'Dobar tek!', en: 'Enjoy your meal! (said before eating)', ph: 'do-bar tek', tip: 'Said by the host before the meal begins. Respond with "Hvala, i tebi!" (Thank you, and to you!)' },
    ],
  },
];

export default function SurvivalDinner({ goBack }) {
  const [activeScenario, setActiveScenario] = useState(null);
  const [revealed, setRevealed] = useState({});

  function toggleReveal(key) {
    setRevealed(r => ({ ...r, [key]: !r[key] }));
  }

  if (activeScenario) {
    const sc = SCENARIOS.find(s => s.id === activeScenario);
    return (
      <div>
        {H(`${sc.icon} ${sc.title}`, 'Tap any phrase to hear it', goBack)}
        <button onClick={() => setActiveScenario(null)} style={{
          display:'flex', alignItems:'center', gap:8, background:'none', border:'none',
          cursor:'pointer', fontSize:13, color:'var(--subtext)', fontWeight:700,
          fontFamily:"'Outfit',sans-serif", marginBottom:16, padding:'4px 0',
        }}>← All Scenarios</button>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {sc.phrases.map((p, i) => (
            <div key={i} style={{
              background:'var(--card)', border:`1.5px solid ${sc.border}`,
              borderRadius:14, overflow:'hidden',
            }}>
              <button
                onClick={() => speak(p.hr)}
                aria-label={`Play audio: ${p.hr} — ${p.en}`}
                style={{
                  width:'100%', padding:'14px 16px', background:'none', border:'none',
                  cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
                }}
              >
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{
                    width:36, height:36, borderRadius:10, flexShrink:0,
                    background: sc.color, border:`1px solid ${sc.border}`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
                  }} aria-hidden="true">🔊</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:17, fontWeight:900, color:'var(--heading)', marginBottom:2, fontFamily:"'Playfair Display',serif" }}>{p.hr}</div>
                    <div style={{ fontSize:13, color:'#0e7490', fontWeight:700, marginBottom:2 }}>{p.en}</div>
                    <div style={{ fontSize:11, color:'var(--subtext)', fontStyle:'italic' }}>/{p.ph}/</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => toggleReveal(`${activeScenario}_${i}`)}
                style={{
                  width:'100%', padding:'8px 16px 10px', background:revealed[`${activeScenario}_${i}`] ? sc.color : 'transparent',
                  border:'none', borderTop:`1px solid ${sc.border}`, cursor:'pointer',
                  textAlign:'left', fontFamily:"'Outfit',sans-serif",
                  fontSize:12, color:'var(--subtext)', fontWeight:600,
                  transition:'all .2s',
                }}
              >
                {revealed[`${activeScenario}_${i}`] ? (
                  <span>💡 {p.tip}</span>
                ) : (
                  <span>💡 Cultural tip</span>
                )}
              </button>
            </div>
          ))}
        </div>

        <div style={{
          marginTop:24, padding:'16px', borderRadius:14,
          background:'rgba(14,116,144,.07)', border:'1.5px solid rgba(14,116,144,.2)',
        }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#0e7490', marginBottom:4 }}>🇭🇷 Pro tip</div>
          <div style={{ fontSize:12, color:'var(--subtext)', lineHeight:1.6 }}>
            When in doubt, smile and say <strong>"Hvala!"</strong> (Thank you). Croatians deeply appreciate any effort to speak their language, however imperfect.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {H('🍽️ Survival at the Table', 'Essential phrases for family dinners', goBack)}

      <div style={{
        background:'linear-gradient(135deg,rgba(182,24,0,.08),rgba(0,48,135,.06))',
        border:'1.5px solid rgba(182,24,0,.15)',
        borderRadius:16, padding:'16px 18px', marginBottom:24,
      }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--heading)', marginBottom:6 }}>
          🇭🇷 You've been invited to a Croatian family dinner
        </div>
        <div style={{ fontSize:12, color:'var(--subtext)', lineHeight:1.6 }}>
          You'll hear fast Croatian, be offered food you can't identify, and someone's baka will try to feed you until you can't move. This guide will help you survive — and make them love you. And you'll be invited for lunch — "Dođi na ručak" — which means far more than those three words suggest.
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {SCENARIOS.map(sc => (
          <button
            key={sc.id}
            onClick={() => setActiveScenario(sc.id)}
            style={{
              display:'flex', alignItems:'center', gap:14, padding:'16px 18px',
              background:sc.color, border:`1.5px solid ${sc.border}`,
              borderRadius:14, cursor:'pointer', textAlign:'left',
              fontFamily:"'Outfit',sans-serif",
            }}
          >
            <span style={{ fontSize:28, flexShrink:0 }}>{sc.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'var(--heading)', marginBottom:2 }}>{sc.title}</div>
              <div style={{ fontSize:11, color:'var(--subtext)', fontWeight:600 }}>{sc.phrases.length} phrases · tap any to hear</div>
            </div>
            <span style={{ fontSize:18, color:'var(--subtext)', opacity:.5 }}>›</span>
          </button>
        ))}
      </div>

      <div style={{
        marginTop:20, padding:'14px 16px', borderRadius:14,
        background:'var(--card)', border:'1px solid var(--card-b)',
        fontSize:12, color:'var(--subtext)', textAlign:'center', lineHeight:1.6,
      }}>
        🎵 Also try <strong>Song Lyrics</strong> and <strong>AI Conversation</strong> to practice in context
      </div>
    </div>
  );
}
