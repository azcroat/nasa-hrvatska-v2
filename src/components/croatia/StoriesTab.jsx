import React, { useState } from 'react';
import { incrementCulture } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import CroatianKnight from '../shared/CroatianKnight';
import { knightSpeak } from '../../lib/knightSpeak.js';

const BAKA_LETTERS = [
  {
    id: 'letter1',
    from: 'Baka Marija',
    date: 'Nedjelja, 14. travnja',
    subject: 'Drago moje unuče...',
    preview: 'Kako si ti? Ovdje je lijepo proljetno vrijeme...',
    full: `Drago moje unuče,

Kako si ti? Ovdje je lijepo proljetno vrijeme. Cvjetovi su procvjetali u vrtu i miris jorgovana dolazi kroz prozor.

Jučer sam napravila sarmu — baš onako kako si ti volio kad si bio mali. Stavila sam puno riže i malo više paprike, jer znam da ti se sviđa ljuto.

Djed i ja često pričamo o tebi. Nedostaje nam tvoj smijeh. Jesi li naučio još koji novi glagol? Pišemo ti svaki tjedan, ali odgovori nam kad možeš.

Puno ljubavi i zagrljaj,
Tvoja Baka 💙`,
    words: [
      { hr: 'proljetno', en: 'spring (adj.)' },
      { hr: 'cvjetovi', en: 'flowers' },
      { hr: 'miris', en: 'scent/fragrance' },
      { hr: 'sarma', en: 'stuffed cabbage (traditional dish)' },
      { hr: 'nedostaje nam', en: 'we miss (you)' },
      { hr: 'zagrljaj', en: 'hug/embrace' },
    ],
  },
  {
    id: 'letter2',
    from: 'Baka Marija',
    date: 'Ponedjeljak, 22. travnja',
    subject: 'Vijesti iz sela...',
    preview: 'Jučer je bila svadba kod susjeda Ivića...',
    full: `Drago unuče,

Jučer je bila svadba kod susjeda Ivića. Cijelo selo je plesalo kolo do ponoći! Glazba je bila tako lijepa — tamburice i harmonika.

Tvoja teta Ana je donijela fritule — onaj recept koji smo ti uvijek davali za Božić. Svi su pitali za tebe. Rekla sam im da učiš hrvatski i da ćeš doći ljeti. Je li to istina?

Djed je nešto bolje. Hoda po vrtu svako jutro i kopa. Kaže da se bez rada ne može živjeti.

Čekamo te s nestrpljenjem.
Tvoja Baka 💙`,
    words: [
      { hr: 'svadba', en: 'wedding' },
      { hr: 'kolo', en: 'traditional circle dance' },
      { hr: 'tamburice', en: 'traditional string instruments' },
      { hr: 'fritule', en: 'Croatian doughnuts (holiday treat)' },
      { hr: 'nestrpljenje', en: 'impatience / anticipation' },
      { hr: 'kopati', en: 'to dig / to garden' },
    ],
  },
  {
    id: 'letter3',
    from: 'Baka Marija',
    date: 'Srijeda, 1. svibnja',
    subject: 'Praznik rada i naš vrt...',
    preview: 'Danas je Praznik rada, ali djed i ja smo radili cijeli dan...',
    full: `Drago unuče,

Danas je Praznik rada, ali djed i ja smo radili cijeli dan u vrtu. Tako je to na selu — odmor čeka dok posao čeka.

Posadili smo paradajz, paprike i tikvice. Zemlja je bila vlažna od jutarnje rose i mirisala je jako lijepo. Djed kaže da ove godine bit će dobar urod — nebo je jasno i vjetar je s mora.

Ispekla sam pohanicu od pilećih prsa s krumpirom iz vrta. Susjedica Mara je donijela domaću rakiju od šljive. Sjedili smo vani do zalaska sunca i pričali o starim vremenima.

Jesi li počeo učiti padeže? Moja sestra Kata kaže da je instrumental najteži. Ali nauči prvo nominativ i akuzativ — to je dovoljno za razgovor.

Volim te puno,
Baka 💙`,
    words: [
      { hr: 'praznik', en: 'holiday / feast day' },
      { hr: 'paradajz', en: 'tomato' },
      { hr: 'urod', en: 'harvest / crop yield' },
      { hr: 'pohanjica', en: 'breaded/fried meat' },
      { hr: 'rakija', en: 'fruit brandy (Croatian spirit)' },
      { hr: 'zalazak sunca', en: 'sunset' },
    ],
  },
  {
    id: 'letter4',
    from: 'Baka Marija',
    date: 'Subota, 10. svibnja',
    subject: 'Imendan i naša obitelj...',
    preview: 'Bio je Stjepanov imendan i svi su došli...',
    full: `Drago unuče,

Bio je Stjepanov imendan i svi su došli na ručak. Znate li da u Hrvatskoj slavimo imendan jednako kao i rođendan? Svaki dan u godini ima svoje svece, a ti koji nose to ime slave.

Djed je Stjepan, pa je danas njegov dan. Napravio sam burek sa sirom i mesom — dvadeset kilograma tijesta! Djed je bio presretan.

Teta Vesna je dovela svoju djecu — Luku i Maju. Luka je sad visok kao djed. Maja uči engleski u školi i htjela je pričati s tobom. Rekla sam joj da ćeš doći ljeti i da možete pričati.

Kada dođeš, naučit ćemo te napraviti burek. Tijesto traži strpljenje, ali nagrada je ogromna.

Puno pozdrava od cijele obitelji,
Baka 💙`,
    words: [
      { hr: 'imendan', en: 'name day (saint\'s day celebration)' },
      { hr: 'svetac', en: 'saint' },
      { hr: 'burek', en: 'flaky pastry with meat or cheese' },
      { hr: 'tijesto', en: 'dough / pastry' },
      { hr: 'strpljenje', en: 'patience' },
      { hr: 'presretan', en: 'overjoyed / extremely happy' },
    ],
  },
  {
    id: 'letter5',
    from: 'Baka Marija',
    date: 'Četvrtak, 19. lipnja',
    subject: 'Ljeto je stiglo...',
    preview: 'Temperatura je prošla trideset stupnjeva i more poziva...',
    full: `Drago unuče,

Ljeto je konačno stiglo u punoj snazi. Temperatura je prošla trideset stupnjeva i more poziva. Djed i ja smo jutros otišli na plažu u pet ujutro — jedino mirno doba.

More je bilo toplo i prozirno. Vidjeli smo ribe kako plivaju ispod nas. Djed je ulovio jednu strigu za večeru. Nije velika, ali svježa riba iz mora nema premca.

Turisti su počeli dolaziti. Ulice su pune stranih jezika — talijanski, njemački, engleski. Ponekad čujem i engleski sa hrvatskim naglaskom — to su naša djeca iz dijaspore koja su došla kući.

Kada dođeš, idi rano ujutro na plažu. To je Hrvatska kakvu turisti ne vide.

S puno ljubavi,
Baka 💙`,
    words: [
      { hr: 'stupanj', en: 'degree (temperature)' },
      { hr: 'prozirno', en: 'transparent / clear' },
      { hr: 'uloviti', en: 'to catch (fish/animal)' },
      { hr: 'nema premca', en: 'has no equal / unbeatable' },
      { hr: 'dijaspora', en: 'diaspora (Croatians abroad)' },
      { hr: 'naglas', en: 'accent / intonation' },
    ],
  },
  {
    id: 'letter6',
    from: 'Baka Marija',
    date: 'Ponedjeljak, 4. kolovoza',
    subject: 'Dan pobjede i naša priča...',
    preview: 'Obilježavamo Dan pobjede i domovinske zahvalnosti...',
    full: `Drago unuče,

Danas je 5. kolovoza — Dan pobjede i domovinske zahvalnosti. Ovo je poseban dan za sve Hrvate. Sjećam se kada smo 1995. slušali radio i plakali od sreće.

Djed i ja smo mladi proveli dio rata u podrumu. Nije bilo struje ni vode. Ali imali smo obitelj i jedni druge. To je bilo dovoljno.

Sada gledamo kako Hrvatska raste — EU, NATO, mladi koji putuju, govore jezike, grade karijere. Djed kaže: "Borili smo se da djeca žive slobodno. Uspjeli smo."

Učiš hrvatski — to nam znači puno. Jezik je domovina koja putuje s tobom. Nikad te ne napušta.

S ponosom i ljubavlju,
Baka 💙`,
    words: [
      { hr: 'pobjeda', en: 'victory' },
      { hr: 'domovina', en: 'homeland / fatherland' },
      { hr: 'zahvalnost', en: 'gratitude' },
      { hr: 'sloboda', en: 'freedom / liberty' },
      { hr: 'ponos', en: 'pride' },
      { hr: 'pamtiti', en: 'to remember / to keep in memory' },
    ],
  },
  {
    id: 'letter7',
    from: 'Baka Marija',
    date: 'Srijeda, 17. rujna',
    subject: 'Berba grožđa...',
    preview: 'Ove godine je odlično grožđe — puno i slatko...',
    full: `Drago unuče,

Berba grožđa je počela! Ove godine je odlično grožđe — puno i slatko. Susjed Mirko ima vinograd od tri hektara i pozvao nas da pomognemo.

Cijeli dan smo brali grožđe u košare. Djed i ja, teta Vesna, njezin muž i dvoje djece. Ruke su me boljele navečer, ali srce je pjevalo.

Naveče smo jeli peka — janjetina i krumpir ispod peke sat i pol. Mirko je donio mlado vino iz prošle godine. Pili smo, pjevali i pričali do ponoći.

Hrvatska jesen je posebna — nema turista, zrak je svjež, zemlja miriše. Dođi jednom u rujnu ili listopadu. Vidjet ćeš pravu Hrvatsku.

S toplinom,
Baka 💙`,
    words: [
      { hr: 'berba', en: 'harvest (grapes/fruit)' },
      { hr: 'grožđe', en: 'grapes' },
      { hr: 'vinograd', en: 'vineyard' },
      { hr: 'peka', en: 'traditional slow-cooking under an iron bell' },
      { hr: 'janjetina', en: 'lamb (meat)' },
      { hr: 'svjež', en: 'fresh / cool (of air)' },
    ],
  },
  {
    id: 'letter8',
    from: 'Baka Marija',
    date: 'Petak, 14. studenog',
    subject: 'Martinje i mlado vino...',
    preview: 'Danas je sveti Martin — blagoslov mladog vina...',
    full: `Drago unuče,

Danas je sveti Martin — 11. studeni, dan kada se mlado vino blagoslivlja i postaje "pravo" vino. U Slavoniji je to veliki praznik, ali i mi u Dalmaciji to slavimo.

Otišli smo k Mirku koji je imao blagoslov vina u podrumo. Župnik je došao i pročitao molitvu. Onda smo svi probali vino zajedno. Mirisalo je na trešnje i šljive. Jako dobro.

Poslije smo jeli gulaš od gusaka — to je tradicionalno za Martinje. Guska je simbol ovog praznika. Djed kaže da je to zato što je Martin pobjegao od biskupa i sakrio se u jato gusaka, koje su ga odalo.

Vidjet ćemo se za Božić, nadam se. Pripremi se na puno hrane!

Tvoja Baka 💙`,
    words: [
      { hr: 'blagoslov', en: 'blessing / benediction' },
      { hr: 'podrum', en: 'cellar / basement' },
      { hr: 'župnik', en: 'parish priest' },
      { hr: 'guska', en: 'goose' },
      { hr: 'odati', en: 'to reveal / to give away (betray)' },
      { hr: 'gulaš', en: 'goulash (stew)' },
    ],
  },
  {
    id: 'letter9',
    from: 'Baka Marija',
    date: 'Utorak, 23. prosinca',
    subject: 'Božić se bliži...',
    preview: 'Kuća miriše na kolače i cimet...',
    full: `Drago unuče,

Kuća miriše na kolače i cimet. Napravila sam orahnjaču, makovnjaču i medenjake. Djed je rekao da su medenjaci premekani, ali pojeo je pet komada — kaži mu to.

Postavljamo jaslice — figurice koje smo imali otkako sam bila mala. Djed ih je svake godine pažljivo umotavao u novine i čuvao u kutiji. Sada su stare 60 godina ali savršene.

Za Badnjak ćemo ići na misu u ponoć. Crkva je uvijek puna. Pjevamo "Tiha noć" na hrvatskom: "Tiha noć, sveta noć, sve miruje, sve spava..." Naučiš li i ti?

Stavili smo tvoje ime na stol za Božić. Uvijek si s nama, makar i daleko.

Sretno i radosno Božić,
Baka i Djed 💙🎄`,
    words: [
      { hr: 'orahnjača', en: 'walnut roll (Christmas pastry)' },
      { hr: 'medenjaci', en: 'gingerbread cookies' },
      { hr: 'jaslice', en: 'nativity scene' },
      { hr: 'Badnjak', en: 'Christmas Eve' },
      { hr: 'misa', en: 'Mass (church service)' },
      { hr: 'makar', en: 'even if / at least' },
    ],
  },
  {
    id: 'letter10',
    from: 'Baka Marija',
    date: 'Ponedjeljak, 6. siječnja',
    subject: 'Nova godina i planovi...',
    preview: 'Sretna Nova godina! Što je tvoja odluka za ovu godinu?...',
    full: `Drago unuče,

Sretna Nova godina! Što je tvoja odluka za ovu godinu? Djed kaže da svake godine odlučuje jesti manje slatkog — i svake godine to traje do Poklada.

Ja imam jednu odluku: naučit ću koristiti mobitel bolje. Vesna mi je kupila novi i sada mogu čitati tvoje poruke bez naočala. To je napredak!

Razmišljam o tebi kako učiš hrvatski. Jezik je živa stvar — mijenja se, raste, pamti. Kada govoriš naš jezik, nosit ćeš u sebi sve naše priče, sve naše generacije.

Djed i ja smo zajedno 52 godine. Sve smo to rekli na hrvatskom — ljubav, svađe, sreće i tuge. Taj jezik nosi sve to.

S bezgraničnom ljubavlju,
Tvoja Baka 💙`,
    words: [
      { hr: 'odluka', en: 'decision / resolution' },
      { hr: 'Pokladi', en: 'Carnival / Shrovetide (before Lent)' },
      { hr: 'napredak', en: 'progress / advancement' },
      { hr: 'generacija', en: 'generation' },
      { hr: 'svađa', en: 'argument / quarrel' },
      { hr: 'bezgraničan', en: 'boundless / limitless' },
    ],
  },
];

function WordTile({ w, award }) {
  const [saved, setSaved] = useState(() => {
    try { const j = JSON.parse(localStorage.getItem('uJournal') || '[]'); return j.some(x => x.hr === w.hr); } catch { return false; }
  });
  return (
    <div style={{ background: 'var(--bar-bg)', borderRadius: 8, padding: '8px 10px', position: 'relative' }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: '#0e7490' }}>{w.hr}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2, marginBottom: 4 }}>{w.en}</div>
      <button
        onClick={() => {
          if (saved) return;
          try {
            const j = JSON.parse(localStorage.getItem('uJournal') || '[]');
            if (!j.some(x => x.hr === w.hr)) {
              j.push({ hr: w.hr, en: w.en });
              localStorage.setItem('uJournal', JSON.stringify(j));
            }
          } catch { /* ignore */ }
          setSaved(true);
          if (award) award(1);
          knightSpeak('happy', `"${w.hr}" saved to My Words! 📚`);
        }}
        style={{ fontSize: 9, fontWeight: 700, color: saved ? 'var(--success,#16a34a)' : 'var(--info)', background: 'none', border: 'none', cursor: saved ? 'default' : 'pointer', padding: 0 }}
      >
        {saved ? '✓ Saved' : '+ Save word'}
      </button>
    </div>
  );
}

export default function StoriesTab() {
  const { award } = useApp();
  const [openLetter, setOpenLetter] = useState(null);
  const [expandedCtx, setExpandedCtx] = useState({});
  const toggleCtx = (key) => setExpandedCtx(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <React.Fragment>
      {/* ── LETTERS FROM BAKA ── */}
      <div className="section-block">
        <div className="section-hdr">
          <div className="section-hdr-icon" style={{background:'rgba(200,152,10,.14)'}}>💌</div>
          <div className="section-hdr-text">
            <div className="section-hdr-title">Letters from Baka</div>
            <div className="section-hdr-sub">Read Croatian the way family really writes it</div>
          </div>
          <CroatianKnight size={40} mood="thinking" style={{ flexShrink: 0 }} />
        </div>
        <div style={{fontSize:12, color:'var(--subtext)', marginBottom:12, lineHeight:1.5}}>
          Personal letters written in authentic Croatian — perfect for understanding how family members actually speak, including regional expressions and emotional vocabulary.
        </div>
        <div
          onClick={() => { if (!expandedCtx['baka']) incrementCulture('regionCnt'); toggleCtx('baka'); }}
          style={{
            fontSize:12, color:'var(--info)', cursor:'pointer',
            marginBottom: expandedCtx['baka'] ? 0 : 12,
            display:'flex', alignItems:'center', gap:4, fontWeight:600
          }}
        >
          {expandedCtx['baka'] ? '▲' : '▼'} Why this matters for your Croatian
        </div>
        {expandedCtx['baka'] && (
          <div style={{
            fontSize:12, color:'var(--subtext)', lineHeight:1.6,
            padding:'10px 14px', background:'var(--info-bg)',
            borderRadius:10, marginBottom:12, border:'1px solid var(--info-b)'
          }}>
            💌 <strong>Baka's letters</strong> capture authentic Croatian as it's actually written between family members — warm, informal, full of dialect and emotion. This is the Croatian you won't find in textbooks, but will hear and read with your family.
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {BAKA_LETTERS.map(letter => (
            <div key={letter.id} style={{ background:'var(--card)', border:'1.5px solid var(--card-b)', borderRadius:14, overflow:'hidden' }}>
              <button
                onClick={() => { const opening = openLetter !== letter.id; setOpenLetter(opening ? letter.id : null); if (opening) { incrementCulture('bakaCnt'); if (award) award(5); } }}
                style={{ width:'100%', padding:'14px 16px', background:'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif" }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'1px solid #fde68a',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💌</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)' }}>{letter.from}</div>
                    <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:1 }}>{letter.subject} · {letter.date}</div>
                  </div>
                  <span style={{ fontSize:'var(--text-base)', color:'var(--subtext)', opacity:.5 }}>{openLetter === letter.id ? '▲' : '▼'}</span>
                </div>
              </button>
              {openLetter === letter.id && (
                <div style={{ borderTop:'1px solid var(--card-b)', padding:'16px' }}>
                  <div style={{
                    background:'#fffbeb', border:'1px solid #fde68a',
                    borderRadius:10, padding:'14px 16px', marginBottom:14,
                    fontFamily:"Georgia, serif", fontSize:'var(--text-sm)', lineHeight:1.8, color:'#451a03',
                    whiteSpace:'pre-line',
                  }}>
                    {letter.full}
                  </div>
                  <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>
                    📚 Words from this letter
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {letter.words.map(w => (
                      <WordTile key={w.hr} w={w} award={award} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}
