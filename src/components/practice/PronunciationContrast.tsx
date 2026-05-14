import React, { useState, useRef } from 'react';
import { H, Bar } from '../../data';
import { speak } from '../../lib/audio.js';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';
import { rnd } from '../../lib/random.js';
function shLocal<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}

const DATA = [
  {
    q: "'To read' in Croatian:",
    opts: ['čitati', 'ćitati', 'šitati', 'žitati'],
    answer: 'čitati',
    en: 'čitati = to read',
    tip: "Č is harder (like 'ch' in 'church'). 'Čitati' — the č makes a hard ch sound",
  },
  {
    q: "'Human' in Croatian:",
    opts: ['čovjek', 'ćovjek', 'čovjek', 'đovjek'],
    answer: 'čovjek',
    en: 'čovjek = human/person',
    tip: "Č in čovjek: hard 'ch'. Never ć (soft) at the start here",
  },
  {
    q: "'Uncle' in Croatian:",
    opts: ['stric', 'striċ', 'strić', 'stries'],
    answer: 'stric',
    en: 'stric = (paternal) uncle',
    tip: "'Stric' ends in c (like 'ts'). Compare: striček (affectionate form)",
  },
  {
    q: "'Begin' in Croatian:",
    opts: ['početi', 'početi', 'početi', 'poćeti'],
    answer: 'početi',
    en: 'početi = to begin',
    tip: "'Početi' has č (hard). The ć (soft) would make a different, incorrect word",
  },
  {
    q: "'Girl' in Croatian:",
    opts: ['djevojčica', 'djevojćica', 'đevojčica', 'djevojčića'],
    answer: 'djevojčica',
    en: 'djevojčica = little girl',
    tip: 'The diminutive suffix -čica uses hard č',
  },
  {
    q: "'Uncle/Sir' (informal) in Croatian:",
    opts: ['ujak', 'ćutak', 'ujak', 'ûjak'],
    answer: 'ujak',
    en: 'ujak = maternal uncle',
    tip: "'Ujak' — maternal uncle (different from 'stric' = paternal uncle)",
  },
  {
    q: "Which spells 'to want'?",
    opts: ['htjeti', 'ćtjeti', 'htjeti', 'htjéti'],
    answer: 'htjeti',
    en: 'htjeti = to want/will',
    tip: "'Htjeti' — the h is silent in many forms. 'Hoću' = I want/will",
  },
  {
    q: "'Bridge' in Croatian:",
    opts: ['most', 'mošt', 'mozt', 'most'],
    answer: 'most',
    en: 'most = bridge',
    tip: "'Most' — simple word. Compare: 'moštanica' (a type of grape brandy area)",
  },
  {
    q: "'Key' in Croatian:",
    opts: ['ključ', 'ćluč', 'ključ', 'ključ'],
    answer: 'ključ',
    en: 'ključ = key',
    tip: "'Ključ' ends in č (hard). The lj is a single soft sound like 'lj' fused",
  },
  {
    q: "'Čokolada' or 'Ćokolada' — which is 'chocolate'?",
    opts: ['Čokolada', 'Ćokolada', 'Šokolada', 'Džokolada'],
    answer: 'Čokolada',
    en: 'Čokolada = chocolate',
    tip: "Hard č at start of čokolada — borrowed from Italian 'cioccolata'",
  },
  {
    q: "'Grandfather' in Croatian:",
    opts: ['djed', 'djet', 'đed', 'djed'],
    answer: 'djed',
    en: 'djed = grandfather',
    tip: "'Djed' — dj is two separate letters here (d+j), not a single phoneme like đ",
  },
  {
    q: "'Gentleman/Sir' in Croatian:",
    opts: ['gospodin', 'gozpodin', 'gospođin', 'gospodin'],
    answer: 'gospodin',
    en: 'gospodin = Mr/gentleman',
    tip: "'Gospodin' — note 'gospođa' (Mrs) uses đ (soft)",
  },
  {
    q: "'Mrs/Madam' in Croatian:",
    opts: ['gospođa', 'gospoda', 'gospoda', 'gospóđa'],
    answer: 'gospođa',
    en: 'gospođa = Mrs/Madam',
    tip: "'Gospođa' uses đ (soft d). 'Gospodin' (Mr) uses d",
  },
  {
    q: "'Yellow' in Croatian:",
    opts: ['žut', 'šut', 'zut', 'žût'],
    answer: 'žut',
    en: 'žut = yellow',
    tip: "'Žut' — ž is like the French 'j' in 'bonjour' or 's' in 'measure'",
  },
  {
    q: "'Forest' in Croatian:",
    opts: ['šuma', 'žuma', 'suma', 'šûma'],
    answer: 'šuma',
    en: 'šuma = forest',
    tip: "'Šuma' — š is like English 'sh'. Very common word!",
  },
  {
    q: "'Bread' in Croatian:",
    opts: ['kruh', 'krûh', 'kruš', 'kruž'],
    answer: 'kruh',
    en: 'kruh = bread',
    tip: "'Kruh' ends in h (a breathy sound). Essential survival vocabulary!",
  },
  {
    q: "'Night' in Croatian:",
    opts: ['noć', 'noc', 'noč', 'noc'],
    answer: 'noć',
    en: 'noć = night',
    tip: "'Noć' ends in ć (soft ch). 'Laku noć' = Good night",
  },
  {
    q: "'Star' in Croatian:",
    opts: ['zvijezda', 'zvjezda', 'zviezda', 'zvijezda'],
    answer: 'zvijezda',
    en: 'zvijezda = star',
    tip: "Standard Croatian: 'zvijezda' (Ijekavian — ije). Ekavian dialects say 'zvezda'",
  },
  {
    q: "'Snow' in Croatian:",
    opts: ['snijeg', 'sneg', 'snjeg', 'sniég'],
    answer: 'snijeg',
    en: 'snijeg = snow',
    tip: "Standard Croatian: 'snijeg' (Ijekavian — ije). One of the most important ije/e distinctions",
  },
  {
    q: "'Love' (noun) in Croatian:",
    opts: ['ljubav', 'ljubav', 'ljübav', 'ljūbav'],
    answer: 'ljubav',
    en: 'ljubav = love',
    tip: "'Ljubav' — lj is a soft fused sound. The -av ending makes it feminine noun",
  },
  {
    q: "'Canyon/gorge' in Croatian:",
    opts: ['klisura', 'kljisura', 'ćlisura', 'čisura'],
    answer: 'klisura',
    en: 'klisura = gorge/canyon',
    tip: "'Klisura' — kl cluster, no special letters here",
  },
  {
    q: "'Soft' in Croatian:",
    opts: ['mek', 'meć', 'meč', 'meš'],
    answer: 'mek',
    en: 'mek = soft (masc adj)',
    tip: "'Mek' — basic adjective. Feminine: 'meka', neuter: 'meko'",
  },
  {
    q: "'Knife' in Croatian:",
    opts: ['nož', 'noč', 'noc', 'noć'],
    answer: 'nož',
    en: 'nož = knife',
    tip: "'Nož' ends in ž. Not to be confused with 'noć' (night) which ends in ć",
  },
  {
    q: "'Warm' in Croatian:",
    opts: ['topao', 'tôpao', 'topau', 'topla'],
    answer: 'topao',
    en: 'topao = warm (masc adj)',
    tip: "'Topao' — masc. Feminine is 'topla' (not topla-a)",
  },
  {
    q: "'Enough' in Croatian:",
    opts: ['dosta', 'dôsta', 'dosta', 'doška'],
    answer: 'dosta',
    en: 'dosta = enough',
    tip: "'Dosta' — essential word. 'To je dosta' = That's enough",
  },
];

// Detect which sound contrast is at play in a question's options
function detectContrast(opts: string[]): string {
  const joined = opts.join(' ');
  const hasC = (c: string) => joined.includes(c);
  if (hasC('č') && hasC('ć')) return 'c_soft';
  if (hasC('š') && hasC('ž')) return 's_voiced';
  if (hasC('đ') || hasC('dž')) return 'dj';
  return 'generic';
}

const CONTRAST_BARS = {
  c_soft: [
    { label: 'č — harder', sublabel: '"ch" in church', pct: 85, color: 'var(--info, #0284c7)' },
    {
      label: 'ć — softer',
      sublabel: '"ch" in cheap (palatalized)',
      pct: 45,
      color: 'var(--accent, #e0805a)',
    },
  ],
  s_voiced: [
    { label: 'š — unvoiced', sublabel: '"sh" in shop', pct: 70, color: '#7c3aed' },
    { label: 'ž — voiced', sublabel: '"s" in measure', pct: 90, color: '#db2777' },
  ],
  dj: [
    { label: 'đ — soft fused', sublabel: 'like "dj" merged', pct: 55, color: '#059669' },
    { label: 'dj — separate', sublabel: 'd + j distinct', pct: 75, color: '#0284c7' },
  ],
  generic: [
    { label: 'Option A', sublabel: 'first sound', pct: 60, color: 'var(--info, #0284c7)' },
    { label: 'Option B', sublabel: 'second sound', pct: 80, color: 'var(--accent, #e0805a)' },
  ],
};

const VIZ_KEYFRAMES = `
@keyframes barGrow {
  from { width: 0; }
  to   { width: var(--target-w); }
}
`;

interface FrequencyVizProps {
  opts: string[];
}
function FrequencyViz({ opts }: FrequencyVizProps) {
  const contrast = detectContrast(opts);
  const bars =
    (CONTRAST_BARS as Record<string, typeof CONTRAST_BARS.generic>)[contrast] ??
    CONTRAST_BARS.generic;
  return (
    <div
      style={{
        marginTop: 12,
        padding: '10px 14px',
        background: 'var(--card, #f8fafc)',
        border: '1.5px solid #e2e8f0',
        borderRadius: 10,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}
      >
        Sound Comparison
      </div>
      {bars.map((bar, i) => (
        <div key={i} style={{ marginBottom: i < bars.length - 1 ? 10 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: bar.color }}>{bar.label}</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{bar.sublabel}</span>
          </div>
          <div style={{ height: 10, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={
                {
                  height: '100%',
                  width: `${bar.pct}%`,
                  background: bar.color,
                  borderRadius: 6,
                  animation: `barGrow 0.6s ease ${i * 0.15}s both`,
                  '--target-w': `${bar.pct}%`,
                } as React.CSSProperties
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface PronunciationContrastProps {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}
export default function PronunciationContrast({ goBack, award }: PronunciationContrastProps) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const [qs] = useState(() => shLocal(DATA));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);

  const total = qs.length;

  if (!qs.length) return null;

  if (idx >= total) {
    return (
      <div className="scr-wrap">
        {H('🔤 Sound Contrast', 'Master č/ć, š/ž, đ/dž and more', goBack)}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>{score >= total * 0.8 ? '🏆' : '📚'}</div>
          <h2>
            {score} / {total}
          </h2>
          <button
            className="b bp"
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              if (typeof award === 'function') award(score * 5, false, 'grammar');
              markQuest('grammar');
              if (!stats.vs?.includes('pronunciation-contrast')) {
                setStats((prev) => {
                  if (prev.vs?.includes('pronunciation-contrast')) return prev;
                  return {
                    ...prev,
                    gc: (prev.gc || 0) + 1,
                    vs: [...(prev.vs || []), 'pronunciation-contrast'],
                  };
                });
                if (writeDelta) writeDelta({ gc: 1, vs: ['pronunciation-contrast'] });
              }
              goBack();
            }}
            style={{ width: '100%', marginTop: 16 }}
          >
            🏠 Done
          </button>
        </div>
      </div>
    );
  }

  const q = qs[idx];
  if (!q) return null;

  return (
    <div className="scr-wrap">
      <style>{VIZ_KEYFRAMES}</style>
      {H('🔤 Sound Contrast', 'Master č/ć, š/ž, đ/dž and more', goBack)}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>
          {idx + 1} / {total}
        </span>
        <span style={{ color: '#0e7490', fontWeight: 700 }}>Score: {score}</span>
      </div>
      <Bar v={idx + 1} mx={total} />
      <div className="c" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{q.q}</div>
        <div style={{ fontSize: 13, color: '#78716c', marginTop: 4 }}>{q.en}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
        {q.opts.map((o: string, oi: number) => (
          <div key={oi} style={{ position: 'relative' }}>
            <button
              className="ob"
              style={{
                textAlign: 'center',
                width: '100%',
                paddingRight: 36,
                background: answered
                  ? o === q.answer
                    ? '#dcfce7'
                    : selected === oi
                      ? '#fee2e2'
                      : 'white'
                  : 'white',
                borderColor: answered
                  ? o === q.answer
                    ? '#16a34a'
                    : selected === oi
                      ? '#dc2626'
                      : 'rgba(14,116,144,.12)'
                  : 'rgba(14,116,144,.12)',
              }}
              onClick={() => {
                if (!answered) {
                  setSelected(oi);
                  setAnswered(true);
                  if (o === q.answer) setScore(score + 1);
                }
              }}
            >
              {o}
            </button>
            {/* 🔊 button — always visible, speaks the option */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(o);
              }}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                padding: '4px',
                lineHeight: 1,
                color: '#0e7490',
                opacity: 0.75,
              }}
              title={`Hear "${o}"`}
              aria-label={`Play pronunciation of ${o}`}
            >
              <span aria-hidden="true">🔊</span>
            </button>
          </div>
        ))}
      </div>
      {answered && (
        <div
          style={{
            background: '#f0f9ff',
            borderRadius: 12,
            padding: '12px 16px',
            marginTop: 12,
            border: '1.5px solid #bae6fd',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', marginBottom: 4 }}>
            📢 Pronunciation Guide
          </div>
          <div style={{ fontSize: 13, color: '#075985' }}>{q.tip}</div>
        </div>
      )}
      {answered && <FrequencyViz opts={q.opts} />}
      {answered && (
        <button
          className="b bp"
          style={{ width: '100%', marginTop: 16 }}
          onClick={() => {
            setIdx(idx + 1);
            setAnswered(false);
            setSelected(-1);
          }}
        >
          Next →
        </button>
      )}
    </div>
  );
}
