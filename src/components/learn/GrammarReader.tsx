import React, { useState, useCallback, useRef } from 'react';
import { H, READ } from '../../data';
import { apiFetch } from '../../lib/apiFetch.js';

interface TextItem {
  id: string;
  title: string;
  english: string;
  level: string;
  levelColor: string;
  levelBg: string;
  text: string;
}
interface WordAnalysis {
  pos?: string;
  base_form?: string;
  case?: string;
  gender?: string;
  number?: string;
  tense?: string;
  person?: string;
  aspect?: string;
  explanation?: string;
  examples?: string[];
}
interface ActiveWord {
  word: string;
  data: WordAnalysis;
}

// ─── Level style map ──────────────────────────────────────────────────────────
const LEVEL_STYLE = {
  A1: { levelColor: '#166534', levelBg: '#dcfce7' },
  A2: { levelColor: '#1e40af', levelBg: '#dbeafe' },
  B1: { levelColor: '#92400e', levelBg: '#fef3c7' },
  B2: { levelColor: '#6b21a8', levelBg: '#f3e8ff' },
  C1: { levelColor: '#b91c1c', levelBg: '#fee2e2' },
  C2: { levelColor: '#0f172a', levelBg: '#f1f5f9' },
};

// ─── Map READ library to GrammarReader format ─────────────────────────────────
function buildLibraryTexts(): TextItem[] | null {
  try {
    const buckets = [
      { key: 'beginner', level: 'A1' },
      { key: 'intermediate', level: 'B1' },
      { key: 'advanced', level: 'B2' },
      { key: 'b2', level: 'B2' },
      { key: 'c1', level: 'C1' },
    ];
    const out: TextItem[] = [];
    buckets.forEach(({ key, level }) => {
      const passages = (READ as Record<string, { title: string; tEn?: string; text: string }[]>)[
        key
      ];
      if (!Array.isArray(passages)) return;
      passages.forEach((p, i) => {
        if (!p.text || !p.title) return;
        const style =
          (LEVEL_STYLE as Record<string, typeof LEVEL_STYLE.A1>)[level] || LEVEL_STYLE['B1'];
        out.push({
          id: `${key}_${i}`,
          title: p.title,
          english: p.tEn || '',
          level,
          ...style,
          text: p.text,
        });
      });
    });
    return out.length > 0 ? out : null;
  } catch (_) {
    return null;
  }
}

// ─── Fallback hardcoded texts (used if library import fails) ──────────────────
const FALLBACK_TEXTS = [
  {
    id: 'market_a1',
    title: 'Na tržnici',
    english: 'At the Market',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    text: 'Marija ide na tržnicu svaki dan. Ona kupuje voće i povrće. Danas ima jabuke, kruške i rajčice. Prodavač je ljubazan. Marija plaća i odlazi kući.',
  },
  {
    id: 'cafe_a1',
    title: 'U kafiću',
    english: 'In the Café',
    level: 'A1',
    levelColor: '#166534',
    levelBg: '#dcfce7',
    text: 'Ivan sjedi u kafiću. On pije kavu i čita novine. Konobar donosi vodu. Ivan je sretan. Kafić je mali ali lijep.',
  },
  {
    id: 'family_a2',
    title: 'Moja obitelj',
    english: 'My Family',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    text: 'Imam veliku obitelj. Moja mama se zove Ana i radi kao učiteljica. Tata je inženjer i voli čitati knjige. Imam jednu sestru i dva brata. Svake nedjelje idemo zajedno na ručak.',
  },
  {
    id: 'city_a2',
    title: 'Zagreb',
    english: 'Zagreb',
    level: 'A2',
    levelColor: '#1e40af',
    levelBg: '#dbeafe',
    text: 'Zagreb je glavni grad Hrvatske. U njemu živi oko milijun ljudi. Gornji grad je stari dio grada s lijepim crkvama i muzejima. Donji grad ima moderne zgrade i parkove. Tramvaj je glavno prijevozno sredstvo.',
  },
  {
    id: 'holiday_b1',
    title: 'Ljetni odmor',
    english: 'Summer Holiday',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    text: 'Prošlog ljeta otišli smo na Jadransko more. Odsjeli smo u malom apartmanu blizu plaže. Svako jutro kupali smo se u moru i sunčali na pijesku. Navečer smo jeli ribu u lokalnim restoranima i šetali po obali. Bila je to nezaboravna pustolovina.',
  },
  {
    id: 'work_b1',
    title: 'Na poslu',
    english: 'At Work',
    level: 'B1',
    levelColor: '#92400e',
    levelBg: '#fef3c7',
    text: 'Radim u informatičkoj tvrtki već tri godine. Moj posao uključuje pisanje programa i rješavanje tehničkih problema. Volim svoj posao jer svaki dan naučim nešto novo. Kolege su mi prijatelji s kojima često ručam. Jedini nedostatak je dug put do ureda.',
  },
  {
    id: 'culture_b2',
    title: 'Hrvatska kultura',
    english: 'Croatian Culture',
    level: 'B2',
    levelColor: '#6b21a8',
    levelBg: '#f3e8ff',
    text: 'Hrvatska kultura duboko je ukorijenjena u mediteranskom i srednjoeuropskom nasljeđu. Tradicija klape, višeglasnog pjevanja bez pratnje, upisana je na UNESCO-ov popis nematerijalne kulturne baštine. Vezovi i čipkarstvo iz Paga i Lepoglave pokazuju iznimnu vještinu domaćih majstorica. Karnevalske tradicije poput riječkog karnevala privlače posjetitelje iz cijelog svijeta.',
  },
  {
    id: 'philosophy_b2',
    title: 'O jeziku',
    english: 'About Language',
    level: 'B2',
    levelColor: '#6b21a8',
    levelBg: '#f3e8ff',
    text: 'Jezik nije samo sredstvo komunikacije — on oblikuje naš način razmišljanja. Svaki jezik ima pojmove koji se ne mogu lako prevesti na drugi. Hrvatska ima bogat sustav glagolskih vidova koji razlikuje trajanje radnje od njezine dovršenosti. Učenjem stranog jezika ne usvajamo samo gramatiku, nego i novi pogled na svijet.',
  },
];

const TEXTS = buildLibraryTexts() || FALLBACK_TEXTS;

// ─── POS color map ────────────────────────────────────────────────────────────
const POS_COLOR = {
  noun: '#0891b2',
  verb: '#16a34a',
  adjective: '#d97706',
  adverb: '#7c3aed',
  preposition: '#dc2626',
  conjunction: '#db2777',
  pronoun: '#0369a1',
  numeral: '#b45309',
  particle: '#6b7280',
};

const POS_LABEL = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adj',
  adverb: 'Adv',
  preposition: 'Prep',
  conjunction: 'Conj',
  pronoun: 'Pron',
  numeral: 'Num',
  particle: 'Part',
};

const CASE_ABBR = {
  Nominative: 'NOM',
  Genitive: 'GEN',
  Dative: 'DAT',
  Accusative: 'ACC',
  Vocative: 'VOC',
  Locative: 'LOC',
  Instrumental: 'INS',
};

// Strip punctuation for lookup key but keep original for display
function stripPunct(w: string): string {
  return w.replace(/[.,!?;:"""'()–-]/g, '').toLowerCase();
}
function _hasPunct(w: string): boolean {
  return /[.,!?;:"""'()]$/.test(w);
}

// ─── Inline style tag ─────────────────────────────────────────────────────────
const STYLE = `
.gr-word { border-radius: 3px; transition: background .12s; display: inline; background: none; padding: 0; font: inherit; color: inherit; }
.gr-word:hover { background: rgba(99,102,241,.12); }
.gr-word.gr-analyzed { border-bottom: 2px solid var(--accent); }
.gr-word.gr-loading { opacity: .55; }
@keyframes grSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
`;

// ─── Word token ───────────────────────────────────────────────────────────────
function WordToken({
  word,
  cache,
  loading,
  onTap,
}: {
  word: string;
  cache: Record<string, WordAnalysis>;
  loading: string | null;
  onTap: (w: string) => void;
}) {
  const key = stripPunct(word);
  const analyzed = !!cache[key];
  const isLoading = loading === key;
  return (
    <button
      className={`gr-word${analyzed ? ' gr-analyzed' : ''}${isLoading ? ' gr-loading' : ''}`}
      onClick={() => onTap(word)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap(word);
        }
      }}
      aria-label={`Analyze word: ${key}`}
    >
      {word}
    </button>
  );
}

// ─── Analysis bottom sheet ────────────────────────────────────────────────────
function AnalysisSheet({
  word,
  data,
  onClose,
}: {
  word: string;
  data: WordAnalysis | null;
  onClose: () => void;
}) {
  if (!data) return null;
  const posColor = data.pos
    ? (POS_COLOR as Record<string, string>)[data.pos] || '#6b7280'
    : '#6b7280';
  const posLabel = data.pos ? (POS_LABEL as Record<string, string>)[data.pos] || data.pos : '';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,.35)',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Word analysis"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxHeight: '70vh',
          overflowY: 'auto',
          background: 'var(--card)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 18px 32px',
          animation: 'grSheet .22s ease',
          boxShadow: '0 -4px 24px rgba(0,0,0,.15)',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--card-b)',
            borderRadius: 2,
            margin: '0 auto 16px',
          }}
        />

        {/* Word + POS badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--heading)' }}>
            {word.replace(/[.,!?;:]/g, '')}
          </span>
          {data.base_form && data.base_form.toLowerCase() !== stripPunct(word) && (
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)' }}>
              ← {data.base_form}
            </span>
          )}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: '#fff',
              background: posColor,
              borderRadius: 6,
              padding: '3px 9px',
              letterSpacing: '.04em',
            }}
          >
            {posLabel}
          </span>
        </div>

        {/* Grammar tags row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {data.case && (
            <Tag
              label={(CASE_ABBR as Record<string, string>)[data.case] || data.case}
              sub={data.case}
              color="#0891b2"
            />
          )}
          {data.gender && (
            <Tag
              label={data.gender === 'm' ? 'Masc' : data.gender === 'f' ? 'Fem' : 'Neut'}
              sub="gender"
              color={data.gender === 'm' ? '#1e40af' : data.gender === 'f' ? '#be185d' : '#166534'}
            />
          )}
          {data.number && (
            <Tag
              label={data.number === 'singular' ? 'Sg' : 'Pl'}
              sub={data.number}
              color="#6b7280"
            />
          )}
          {data.tense && (
            <Tag
              label={data.tense.charAt(0).toUpperCase() + data.tense.slice(1)}
              sub="tense"
              color="#7c3aed"
            />
          )}
          {data.person && <Tag label={data.person} sub="person" color="#d97706" />}
          {data.aspect && (
            <Tag
              label={data.aspect === 'imperfective' ? 'Impf' : 'Pf'}
              sub={data.aspect}
              color={data.aspect === 'imperfective' ? '#0369a1' : '#166534'}
            />
          )}
        </div>

        {/* Explanation */}
        {data.explanation && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              background: 'var(--bar-bg)',
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
              lineHeight: 1.55,
              marginBottom: 12,
            }}
          >
            {data.explanation}
          </div>
        )}

        {/* Examples */}
        {data.examples && data.examples.length > 0 && (
          <div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 800,
                color: 'var(--subtext)',
                letterSpacing: '.06em',
                marginBottom: 6,
              }}
            >
              EXAMPLES
            </div>
            {(data.examples ?? []).map((ex, i) => (
              <div
                key={i}
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--heading)',
                  fontStyle: 'italic',
                  padding: '6px 0',
                  borderBottom:
                    i < (data.examples?.length ?? 0) - 1 ? '1px solid var(--card-b)' : 'none',
                }}
              >
                {ex}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            width: '100%',
            padding: '12px',
            borderRadius: 12,
            border: '1px solid var(--card-b)',
            background: 'var(--card)',
            color: 'var(--subtext)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function Tag({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 8,
        background: color + '18',
        border: `1px solid ${color}44`,
      }}
    >
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 900, color }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 1 }}>{sub}</span>
    </div>
  );
}

// ─── Reading pane ─────────────────────────────────────────────────────────────
function ReadingPane({
  text,
  title,
  english,
  level,
  levelColor,
  levelBg,
  cache,
  loading,
  onWordTap,
  goBack,
}: TextItem & {
  cache: Record<string, WordAnalysis>;
  loading: string | null;
  onWordTap: (w: string) => void;
  goBack: () => void;
}) {
  const words = text.split(/(\s+)/);
  return (
    <div className="scr-wrap">
      <style>{STYLE}</style>
      {H('🔍 Grammar X-Ray', '', goBack)}

      <p
        style={{
          margin: '0 0 16px',
          fontSize: 'var(--text-sm)',
          color: 'var(--subtext)',
          lineHeight: 1.6,
        }}
      >
        Tap any word to see its full grammatical analysis — case, gender, tense, aspect, and more.
      </p>

      {/* Text card */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 16,
          border: '1px solid var(--card-b)',
          padding: '18px 16px',
          boxShadow: '0 2px 10px rgba(0,0,0,.05)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 800,
              color: 'var(--heading)',
              flex: 1,
            }}
          >
            {title}
          </span>
          <span
            style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', fontStyle: 'italic' }}
          >
            {english}
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: levelColor,
              background: levelBg,
              borderRadius: 6,
              padding: '2px 7px',
            }}
          >
            {level}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-base)',
            lineHeight: 2,
            color: 'var(--heading)',
          }}
        >
          {words.map((token, i) => {
            if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
            if (!token.trim()) return null;
            return (
              <WordToken key={i} word={token} cache={cache} loading={loading} onTap={onWordTap} />
            );
          })}
        </p>
      </div>

      <div
        style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: 'var(--info-bg, #e0f2fe)',
          border: '1px solid var(--info-b, #bae6fd)',
          fontSize: 'var(--text-xs)',
          color: 'var(--info, #0369a1)',
          lineHeight: 1.55,
          marginBottom: 20,
        }}
      >
        <strong>Tip:</strong> Underlined words have already been analyzed — tap again to review.
        Each tap makes one AI call.
      </div>

      <button
        onClick={goBack}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          border: '1px solid var(--card-b)',
          background: 'var(--card)',
          color: 'var(--subtext)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        ← Back to texts
      </button>
    </div>
  );
}

// ─── Text picker ──────────────────────────────────────────────────────────────
function TextPicker({ onSelect, goBack }: { onSelect: (t: TextItem) => void; goBack: () => void }) {
  const [filter, setFilter] = useState('All');
  // Derive available levels from the actual texts so new levels appear automatically
  const levels = ['All', ...Array.from(new Set(TEXTS.map((t) => t.level)))];
  const visible = filter === 'All' ? TEXTS : TEXTS.filter((t) => t.level === filter);
  return (
    <div className="scr-wrap">
      <style>{STYLE}</style>
      {H('🔍 Grammar X-Ray', '', goBack)}
      <p
        style={{
          margin: '0 0 18px',
          fontSize: 'var(--text-sm)',
          color: 'var(--subtext)',
          lineHeight: 1.6,
        }}
      >
        Choose a text to read. Tap any word to instantly see its grammatical breakdown — case,
        gender, tense, aspect, and more — powered by AI.
      </p>

      {/* Level filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {levels.map((lv) => (
          <button
            key={lv}
            onClick={() => setFilter(lv)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1px solid ${filter === lv ? 'var(--accent)' : 'var(--card-b)'}`,
              background: filter === lv ? 'var(--accent)' : 'var(--card)',
              color: filter === lv ? '#fff' : 'var(--subtext)',
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            {lv}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {visible.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            style={{
              background: 'var(--card)',
              borderRadius: 14,
              border: '1px solid var(--card-b)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              textAlign: 'left',
              boxShadow: '0 2px 8px rgba(0,0,0,.04)',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flexShrink: 0,
                background: t.levelBg,
                border: `1px solid ${t.levelColor}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xl)',
              }}
            >
              📖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span
                  style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)' }}
                >
                  {t.title}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: t.levelColor,
                    background: t.levelBg,
                    borderRadius: 5,
                    padding: '2px 6px',
                  }}
                >
                  {t.level}
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>{t.english}</div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--subtext)',
                  marginTop: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  opacity: 0.7,
                }}
              >
                {t.text.slice(0, 60)}…
              </div>
            </div>
            <span style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.3 }}>
              ›
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={goBack}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 14,
          border: '1px solid var(--card-b)',
          background: 'var(--card)',
          color: 'var(--subtext)',
          fontSize: 'var(--text-sm)',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        ← Back
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GrammarReader({ goBack }: { goBack: () => void }) {
  const [selectedText, setSelectedText] = useState<TextItem | null>(null);
  const [cache, setCache] = useState<Record<string, WordAnalysis>>({}); // { word_key: analysisObj }
  const [loading, setLoading] = useState<string | null>(null); // word key currently being fetched
  const [activeWord, setActiveWord] = useState<ActiveWord | null>(null); // { word, data }
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const handleWordTap = useCallback(
    async (word: string) => {
      const key = stripPunct(word);
      if (!key) return;

      // Show cached result immediately
      if (cache[key]) {
        setActiveWord({ word, data: cache[key] });
        return;
      }

      if (inFlightRef.current || loading) return;
      inFlightRef.current = true;
      setLoading(key);
      setError(null);

      try {
        const sentence = selectedText ? selectedText.text : '';
        const res = await apiFetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'wordanalyze',
            messages: [
              {
                role: 'user',
                content: `Word: "${key}"\nSentence context: "${sentence}"`,
              },
            ],
          }),
        });
        if (!res.ok) throw new Error('API error');
        const { text } = await res.json();
        const parsed = JSON.parse(text);
        setCache((prev) => ({ ...prev, [key]: parsed }));
        setActiveWord({ word, data: parsed });
      } catch (e) {
        setError('Could not analyze word. Try again.');
      } finally {
        setLoading(null);
        inFlightRef.current = false;
      }
    },
    [cache, loading, selectedText],
  );

  if (!selectedText) {
    return <TextPicker onSelect={setSelectedText} goBack={goBack} />;
  }

  return (
    <>
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 'var(--text-xs)',
            color: '#b91c1c',
            zIndex: 300,
            boxShadow: '0 2px 8px rgba(0,0,0,.1)',
          }}
        >
          {error}
        </div>
      )}

      <ReadingPane
        {...selectedText}
        cache={cache}
        loading={loading}
        onWordTap={handleWordTap}
        goBack={() => {
          setSelectedText(null);
          setCache({});
          setActiveWord(null);
        }}
      />

      {activeWord && (
        <AnalysisSheet
          word={activeWord.word}
          data={activeWord.data}
          onClose={() => setActiveWord(null)}
        />
      )}
    </>
  );
}
