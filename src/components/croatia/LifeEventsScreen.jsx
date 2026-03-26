import React, { useState } from 'react';
import { speak, H } from '../../data.jsx';

const EVENTS = [
  {
    id: 'wedding',
    icon: '💒',
    title: 'Vjenčanje',
    subtitle: 'Wedding',
    color: '#fff7ed',
    border: '#fed7aa',
    intro: 'Croatian weddings are multi-day events. The kum (best man) and kuma (maid of honor) have sacred roles — they are the godparents of the marriage. Toasts happen constantly. Know these.',
    sections: [
      {
        title: 'Key People',
        items: [
          { hr: 'mladenci', en: 'bride and groom', ph: 'mla-den-tsi', note: 'Used together as a pair' },
          { hr: 'mladoženja', en: 'groom', ph: 'mla-do-zhe-nya', note: null },
          { hr: 'nevjesta', en: 'bride', ph: 'nev-yes-ta', note: 'Also means "daughter-in-law"' },
          { hr: 'kum', en: 'best man / godfather of the marriage', ph: 'kum', note: 'Sacred role — witness and spiritual guardian' },
          { hr: 'kuma', en: 'maid of honor / godmother of the marriage', ph: 'ku-ma', note: 'Female equivalent of kum' },
          { hr: 'gosti', en: 'guests', ph: 'gos-ti', note: null },
        ],
      },
      {
        title: 'Toasts & Phrases',
        items: [
          { hr: 'Živjeli!', en: 'Cheers! (clink glasses — make eye contact!)', ph: 'zhiv-ye-li', note: 'Looking away while toasting = bad luck. Always make eye contact.' },
          { hr: 'Svim gostima čestitam!', en: 'Congratulations to all the guests!', ph: 'svim gos-ti-ma che-sti-tam', note: 'Said by the kum to open a toast' },
          { hr: 'Neka vam bude sretno!', en: 'May you be happy!', ph: 'ne-ka vam bu-de sret-no', note: 'The classic wedding wish' },
          { hr: 'Neka vas Bog blagoslovi!', en: 'May God bless you!', ph: 'ne-ka vas boh bla-gos-lo-vi', note: 'More traditional/religious contexts' },
          { hr: 'Za mladence!', en: 'To the bride and groom!', ph: 'za mla-den-tse', note: null },
          { hr: 'Ljubite se!', en: 'Kiss! (crowd chant)', ph: 'lyu-bi-te se', note: 'Guests chant this when they want the couple to kiss' },
        ],
      },
    ],
  },
  {
    id: 'funeral',
    icon: '🕯️',
    title: 'Sprovod',
    subtitle: 'Funeral',
    color: '#f8fafc',
    border: '#cbd5e1',
    intro: 'Expressing condolences correctly matters deeply. Getting it right shows cultural understanding and respect. The phrases below are what Croatians actually say.',
    sections: [
      {
        title: 'Condolence Phrases',
        items: [
          { hr: 'Primite moju iskrenu sućut.', en: 'Please accept my sincere condolences.', ph: 'pri-mi-te mo-yu is-kre-nu su-chut', note: 'Formal — use with people you don\'t know well' },
          { hr: 'Iskrena sućut.', en: 'Sincere condolences.', ph: 'is-kre-na su-chut', note: 'Shorter, commonly used' },
          { hr: 'Žao mi je.', en: 'I\'m sorry for your loss.', ph: 'zha-o mi ye', note: 'Literal: it pains me — direct and heartfelt' },
          { hr: 'Neka mu / joj je laka zemlja.', en: 'May the earth be light upon him / her.', ph: 'ne-ka mu yo-y ye la-ka zem-lya', note: 'Traditional phrase — one of the most meaningful you can say' },
          { hr: 'Počivao / počivala u miru.', en: 'May he / she rest in peace.', ph: 'po-chi-va-o / po-chi-va-la u mi-ru', note: 'počivao (male) / počivala (female)' },
          { hr: 'Hvala što si / ste došao/la.', en: 'Thank you for coming.', ph: 'hva-la shto si/ste do-sha-o/la', note: 'Said by the bereaved family to guests' },
        ],
      },
      {
        title: 'All Saints Day — Svi Sveti',
        items: [
          { hr: 'Svi Sveti', en: 'All Saints Day (November 1)', ph: 'svi sve-ti', note: 'One of the most observed days in Croatia — families visit graves' },
          { hr: 'svijeće', en: 'candles', ph: 'sviy-ye-che', note: 'Lit at graves on Svi Sveti' },
          { hr: 'cvijeće', en: 'flowers', ph: 'tsvi-ye-che', note: 'Brought to the cemetery' },
          { hr: 'groblje', en: 'cemetery', ph: 'grob-lye', note: null },
          { hr: 'počivati', en: 'to rest in peace', ph: 'po-chi-va-ti', note: null },
        ],
      },
    ],
  },
  {
    id: 'baptism',
    icon: '🕊️',
    title: 'Krštenje',
    subtitle: 'Baptism & Godparents',
    color: '#f0f9ff',
    border: '#bae6fd',
    intro: 'The kumstvo (godparent relationship) is one of the most important social bonds in Croatian culture. Being asked to be kum or kuma is a profound honor — and a lifelong responsibility.',
    sections: [
      {
        title: 'The Kumstvo Bond',
        items: [
          { hr: 'krštenje', en: 'baptism', ph: 'kr-shte-nye', note: null },
          { hr: 'kum', en: 'godfather', ph: 'kum', note: 'Spiritual guardian of the child — a bond stronger than friendship' },
          { hr: 'kuma', en: 'godmother', ph: 'ku-ma', note: null },
          { hr: 'kumče', en: 'godchild', ph: 'kum-che', note: 'The child of your kum/kuma — you are their kumče' },
          { hr: 'kumstvo', en: 'the godparent relationship / bond', ph: 'kum-stvo', note: 'A lifelong relationship with deep social obligations' },
          { hr: 'birm', en: 'confirmation (Catholic)', ph: 'birm', note: 'A separate kumstvo is chosen for confirmation' },
        ],
      },
      {
        title: 'Phrases',
        items: [
          { hr: 'Hoćeš li mi biti kum/kuma?', en: 'Will you be my godfather/godmother?', ph: 'ho-chesh li mi bi-ti kum/ku-ma', note: 'The invitation — an enormous honor' },
          { hr: 'Čestitam na krštenju!', en: 'Congratulations on the baptism!', ph: 'che-sti-tam na kr-shte-nyu', note: null },
          { hr: 'Neka raste zdravo i sretno!', en: 'May the child grow healthy and happy!', ph: 'ne-ka ras-te zdra-vo i sret-no', note: 'Classic blessing for a newborn or baptized child' },
        ],
      },
    ],
  },
  {
    id: 'birthday',
    icon: '🎂',
    title: 'Rođendan & Obljetnica',
    subtitle: 'Birthday & Anniversary',
    color: '#fdf4ff',
    border: '#e9d5ff',
    intro: 'Croatian birthday culture: the birthday person typically buys treats or hosts — not the other way around! Anniversaries (obljetnica) are taken seriously.',
    sections: [
      {
        title: 'Birthday',
        items: [
          { hr: 'Sretan rođendan!', en: 'Happy Birthday!', ph: 'sre-tan ro-jen-dan', note: null },
          { hr: 'Sretno ti bilo!', en: 'Best wishes! (general)', ph: 'sret-no ti bi-lo', note: 'Versatile — works for birthday, name day, any occasion' },
          { hr: 'Neka ti se svi snovi ostvare!', en: 'May all your dreams come true!', ph: 'ne-ka ti se svi sno-vi os-tva-re', note: 'Romantic or special birthday wish' },
          { hr: 'Živio! / Živjela!', en: 'Long live! (birthday toast)', ph: 'zhi-vi-yo / zhiv-ye-la', note: 'živio (male) / živjela (female) — the birthday toast' },
          { hr: 'Koliko imaš godina?', en: 'How old are you?', ph: 'ko-li-ko i-mash go-di-na', note: null },
        ],
      },
      {
        title: 'Anniversary',
        items: [
          { hr: 'Sretna obljetnica!', en: 'Happy Anniversary!', ph: 'sret-na ob-lyet-ni-tsa', note: null },
          { hr: 'godišnjica braka', en: 'wedding anniversary', ph: 'go-dish-nyi-tsa bra-ka', note: null },
          { hr: 'Čestitam!', en: 'Congratulations!', ph: 'che-sti-tam', note: 'The all-purpose congratulations word' },
        ],
      },
    ],
  },
];

export default function LifeEventsScreen({ goBack }) {
  const [activeEvent, setActiveEvent] = useState(null);

  const ev = activeEvent ? EVENTS.find(e => e.id === activeEvent) : null;

  if (ev) {
    return (
      <div>
        {H(`${ev.icon} ${ev.title}`, ev.subtitle)}
        <button onClick={() => setActiveEvent(null)} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, color: 'var(--subtext)', fontWeight: 700,
          fontFamily: "'Outfit',sans-serif", marginBottom: 16, padding: '4px 0',
        }}>← All Events</button>

        <div style={{
          background: ev.color, border: `1.5px solid ${ev.border}`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 20,
          fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6,
        }}>
          {ev.intro}
        </div>

        {ev.sections.map((sec, si) => (
          <div key={si} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>{sec.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sec.items.map((item, ii) => (
                <div key={ii} style={{
                  background: 'var(--card)', border: `1px solid ${ev.border}`,
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  <button onClick={() => speak(item.hr)} style={{
                    width: '100%', padding: '12px 14px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit',sans-serif",
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>🔊</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', fontFamily: "'Playfair Display',serif" }}>{item.hr}</div>
                      <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 600, marginTop: 1 }}>{item.en}</div>
                      {item.ph && <div style={{ fontSize: 10, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 1 }}>/{item.ph}/</div>}
                    </div>
                  </button>
                  {item.note && (
                    <div style={{ padding: '6px 14px 10px', fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      💡 {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {H('🎊 Životni Trenuci', 'Language for life\'s big moments')}

      <div style={{
        background: 'linear-gradient(135deg,rgba(182,24,0,.07),rgba(0,48,135,.05))',
        border: '1.5px solid rgba(182,24,0,.12)',
        borderRadius: 16, padding: '14px 18px', marginBottom: 24,
        fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6,
      }}>
        Weddings, baptisms, funerals, birthdays — these are exactly the moments when knowing the right Croatian phrase matters most.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EVENTS.map(ev => (
          <button key={ev.id} onClick={() => setActiveEvent(ev.id)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
            background: ev.color, border: `1.5px solid ${ev.border}`,
            borderRadius: 14, cursor: 'pointer', textAlign: 'left',
            fontFamily: "'Outfit',sans-serif",
          }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{ev.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', marginBottom: 2 }}>{ev.title}</div>
              <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>{ev.subtitle}</div>
            </div>
            <span style={{ fontSize: 18, color: 'var(--subtext)', opacity: .5 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
