import React, { useState, useEffect, useCallback } from 'react';
import { H } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

// ── Fallback articles shown when the live API is unavailable ─────────────────
const FALLBACK_ARTICLES = [
  {
    source: 'Dnevnik.hr',
    simplified_title: 'Zagreb dobiva novu tramvajsku liniju',
    simplified_title_en: 'Zagreb is getting a new tram line',
    simplified_text:
      'Grad Zagreb planira izgraditi novu tramvajsku liniju. Linija će povezati centar grada s novim kvartovima na istoku. Radovi počinju sljedeće godine. Mnogi građani su sretni zbog ove vijesti.',
    simplified_text_en:
      'The city of Zagreb plans to build a new tram line. The line will connect the city center with new neighborhoods in the east. Work begins next year. Many citizens are happy about this news.',
    key_vocabulary: [
      { word: 'tramvaj', meaning: 'tram' },
      { word: 'linija', meaning: 'line / route' },
      { word: 'kvart', meaning: 'neighborhood / district' },
      { word: 'radovi', meaning: 'construction work' },
      { word: 'građani', meaning: 'citizens' },
    ],
    summary_one_sentence: 'Zagreb gradi novu tramvajsku liniju. / Zagreb is building a new tram line.',
    link: null,
  },
  {
    source: 'Index.hr',
    simplified_title: 'Hrvatska priprema novi turistički rekord',
    simplified_title_en: 'Croatia is preparing a new tourism record',
    simplified_text:
      'Ove godine Hrvatska očekuje više turista nego ikad. Jadransko more privlači milijune posjetitelja. Hoteli su već popunjeni za ljeto. Turizam donosi puno novca u hrvatsko gospodarstvo.',
    simplified_text_en:
      'This year Croatia expects more tourists than ever. The Adriatic Sea attracts millions of visitors. Hotels are already booked for summer. Tourism brings a lot of money into the Croatian economy.',
    key_vocabulary: [
      { word: 'turist', meaning: 'tourist' },
      { word: 'rekord', meaning: 'record' },
      { word: 'posjetitelj', meaning: 'visitor' },
      { word: 'popunjen', meaning: 'fully booked / filled' },
      { word: 'gospodarstvo', meaning: 'economy' },
    ],
    summary_one_sentence: 'Hrvatska očekuje rekordnu turističku sezonu. / Croatia expects a record tourist season.',
    link: null,
  },
  {
    source: 'Večernji list',
    simplified_title: 'Dinamo Zagreb pobijedio u Europskoj ligi',
    simplified_title_en: 'Dinamo Zagreb won in the Europa League',
    simplified_text:
      'Hrvatski klub Dinamo Zagreb je pobijedio u jučerašnjoj utakmici. Igrači su pokazali sjajnu igru pred punim stadionom. Navijači su slavili cijelu noć. Klub sada ide dalje u natjecanju.',
    simplified_text_en:
      'Croatian club Dinamo Zagreb won yesterday\'s match. The players showed brilliant play in front of a full stadium. Fans celebrated all night. The club now advances further in the competition.',
    key_vocabulary: [
      { word: 'pobijedio', meaning: 'won (past tense, m)' },
      { word: 'igrač', meaning: 'player' },
      { word: 'stadion', meaning: 'stadium' },
      { word: 'navijač', meaning: 'fan / supporter' },
      { word: 'natjecanje', meaning: 'competition' },
    ],
    summary_one_sentence: 'Dinamo Zagreb je pobijedio u Europi. / Dinamo Zagreb won in Europe.',
    link: null,
  },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

const LEVEL_COLORS = {
  A1: '#16a34a', A2: '#65a30d', B1: '#ca8a04', B2: '#b45309', C1: '#0e7490',
};

// ── Skeleton card for loading state ──────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--card-b)',
      borderRadius: 16, padding: '16px 18px', marginBottom: 14,
    }}>
      <style>{`
        @keyframes nh-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .nh-skel { background: var(--card-b); borderRadius: 8; animation: nh-pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div className="nh-skel" style={{ height: 14, width: '35%', marginBottom: 12 }} />
      <div className="nh-skel" style={{ height: 18, width: '90%', marginBottom: 8 }} />
      <div className="nh-skel" style={{ height: 13, width: '70%', marginBottom: 16 }} />
      <div className="nh-skel" style={{ height: 12, width: '100%', marginBottom: 6 }} />
      <div className="nh-skel" style={{ height: 12, width: '95%', marginBottom: 6 }} />
      <div className="nh-skel" style={{ height: 12, width: '80%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="nh-skel" style={{ height: 36, width: 110, borderRadius: 10 }} />
        <div className="nh-skel" style={{ height: 36, width: 130, borderRadius: 10 }} />
      </div>
    </div>
  );
}

// ── Word-tappable text renderer ───────────────────────────────────────────────
function TappableText({ text, articleId, translating, tooltip, onWordTap, style }) {
  const words = text.split(/(\s+)/);
  let wordIdx = 0;
  return (
    <span style={style}>
      {words.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) return chunk;
        const idx = wordIdx++;
        const clean = chunk.replace(/[.,!?;:"'()[\]]/g, '');
        const isTranslating = translating && translating.articleId === articleId && translating.wordIndex === idx;
        const hasTooltip = tooltip && tooltip.articleId === articleId && tooltip.wordIndex === idx;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline' }}>
            <span
              onClick={() => clean && onWordTap(clean, articleId, idx)}
              style={{
                cursor: clean ? 'pointer' : 'default',
                borderBottom: clean ? '1px dotted var(--subtext)' : 'none',
                color: isTranslating ? 'var(--info)' : hasTooltip ? 'var(--success)' : 'inherit',
                transition: 'color .15s',
              }}
            >
              {chunk}
            </span>
            {isTranslating && (
              <span style={{
                position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--card)', border: '1px solid var(--info-b)', borderRadius: 8,
                padding: '4px 8px', fontSize: 11, color: 'var(--info)', whiteSpace: 'nowrap',
                zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,.15)',
              }}>⏳</span>
            )}
            {hasTooltip && (
              <span style={{
                position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--card)', border: '1px solid var(--success-b)', borderRadius: 8,
                padding: '5px 9px', fontSize: 11, color: 'var(--heading)', whiteSpace: 'nowrap',
                zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,.18)', minWidth: 80, textAlign: 'center',
              }}>
                <strong style={{ color: 'var(--success)' }}>{tooltip.word}</strong>
                {' = '}
                {tooltip.translation}
                {tooltip.note && <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 2 }}>{tooltip.note}</div>}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

// ── Individual article card ───────────────────────────────────────────────────
function ArticleCard({ article, index, translating, tooltip, onWordTap, onAward, awarded }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [playing, setPlaying] = useState(false);

  async function playArticle() {
    if (playing) return;
    setPlaying(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: article.simplified_text, slow: false }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }

  function handleExpandTranslation() {
    setShowTranslation(v => !v);
    if (!awarded) onAward();
  }

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--card-b)',
      borderRadius: 16, marginBottom: 14, overflow: 'hidden',
    }}>
      {/* Card header: source + date */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--card-b)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg,rgba(14,116,144,.05),rgba(14,116,144,.02))',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase',
          background: '#0e7490', color: '#fff', borderRadius: 6, padding: '2px 8px',
        }}>{article.source || 'Hrvatska vijesti'}</span>
        {article.date && (
          <span style={{ fontSize: 11, color: 'var(--subtext)' }}>{article.date}</span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px' }}>
        {/* Simplified title */}
        <div style={{
          fontSize: 16, fontWeight: 800, color: 'var(--heading)',
          fontFamily: "'Playfair Display',serif", lineHeight: 1.35, marginBottom: 4,
        }}>
          {article.simplified_title}
        </div>
        {/* English title */}
        <div style={{
          fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic',
          marginBottom: 14, lineHeight: 1.4,
        }}>
          {article.simplified_title_en}
        </div>

        {/* Article body — tappable words */}
        <div style={{
          fontSize: 14, color: 'var(--heading)', lineHeight: 1.8,
          marginBottom: 14, position: 'relative',
        }}>
          <TappableText
            text={article.simplified_text}
            articleId={index}
            translating={translating}
            tooltip={tooltip}
            onWordTap={onWordTap}
          />
        </div>

        {/* Tap-hint */}
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 14, fontStyle: 'italic' }}>
          Tap any word for an instant translation
        </div>

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            onClick={playArticle}
            disabled={playing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, border: 'none', cursor: playing ? 'default' : 'pointer',
              background: playing ? 'var(--info-bg)' : 'rgba(14,116,144,.1)',
              color: 'var(--info)', fontSize: 12, fontWeight: 700,
              fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
            }}
          >
            {playing ? '⏸ Playing...' : '🔊 Read Article'}
          </button>

          <button
            onClick={handleExpandTranslation}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, border: '1px solid var(--card-b)',
              cursor: 'pointer', background: showTranslation ? 'var(--info-bg)' : 'var(--card)',
              color: showTranslation ? 'var(--info)' : 'var(--subtext)', fontSize: 12, fontWeight: 700,
              fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
            }}
          >
            📖 English Translation {showTranslation ? '▲' : '▼'}
          </button>
        </div>

        {/* English translation expandable */}
        {showTranslation && (
          <div style={{
            background: 'var(--info-bg)', border: '1px solid var(--info-b)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 12,
            fontSize: 13, color: 'var(--heading)', lineHeight: 1.7,
          }}>
            {article.simplified_text_en}
          </div>
        )}

        {/* Key Vocabulary */}
        {article.key_vocabulary && article.key_vocabulary.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setShowVocab(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, marginBottom: showVocab ? 10 : 0,
                fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
                color: 'var(--subtext)',
              }}
            >
              📚 Key Vocabulary {showVocab ? '▲' : '▼'}
            </button>
            {showVocab && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {article.key_vocabulary.map((v, i) => (
                  <div key={i} style={{
                    background: 'var(--card)', border: '1px solid var(--card-b)',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12,
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <strong style={{ color: 'var(--heading)' }}>{v.word}</strong>
                    <span style={{ color: 'var(--subtext)' }}>→</span>
                    <span style={{ color: '#0e7490' }}>{v.meaning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* One sentence summary */}
        {article.summary_one_sentence && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid var(--card-b)', margin: '10px 0' }} />
            <div style={{
              fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6,
              display: 'flex', gap: 6, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span><em>{article.summary_one_sentence}</em></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CroatianNewsScreen({ goBack, award }) {
  const { level: userLevel } = useApp();
  const isOnline = useOnlineStatus();

  const defaultLevel = LEVELS.includes(userLevel) ? userLevel : 'B1';
  const [selectedLevel, setSelectedLevel] = useState(defaultLevel);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const [translating, setTranslating] = useState(null);  // { articleId, wordIndex }
  const [tooltip, setTooltip] = useState(null);           // { articleId, wordIndex, word, translation, note }

  // Track how many articles the user has engaged with for award
  const [engagedArticles, setEngagedArticles] = useState(new Set());
  const [awardGiven, setAwardGiven] = useState(false);

  function markEngaged(articleIdx) {
    setEngagedArticles(prev => {
      const next = new Set(prev);
      next.add(articleIdx);
      if (next.size >= 2 && !awardGiven) {
        award && award(10);
        setAwardGiven(true);
      }
      return next;
    });
  }

  const fetchNews = useCallback(async (level) => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);
    try {
      const res = await fetch(`/api/news?level=${level}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        setArticles(data.articles);
      } else {
        throw new Error('No articles returned');
      }
    } catch {
      setError('Could not fetch live news. Showing sample articles.');
      setArticles(FALLBACK_ARTICLES);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      fetchNews(selectedLevel);
    } else {
      setError('You are offline. Showing sample articles.');
      setArticles(FALLBACK_ARTICLES);
      setUsingFallback(true);
    }
  }, [selectedLevel, isOnline, fetchNews]);

  async function translateWord(word, articleId, wordIndex) {
    if (translating) return;
    setTranslating({ articleId, wordIndex });
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'translate',
          messages: [{ role: 'user', content: word }],
          params: {},
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.text);
      setTooltip({ articleId, wordIndex, word, translation: parsed.translation, note: parsed.note });
      markEngaged(articleId);
      setTimeout(() => setTooltip(null), 3000);
    } catch {
      // silently fail — just clear spinner
    } finally {
      setTranslating(null);
    }
  }

  return (
    <div className="scr-wrap">
      {H('📰 Croatian News', 'Real Croatian news, simplified to your level by AI')}

      {/* Level selector */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {LEVELS.map(lvl => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              background: selectedLevel === lvl ? (LEVEL_COLORS[lvl] || '#0e7490') : 'var(--card)',
              color: selectedLevel === lvl ? '#fff' : 'var(--subtext)',
              fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
              border: `1.5px solid ${selectedLevel === lvl ? (LEVEL_COLORS[lvl] || '#0e7490') : 'var(--card-b)'}`,
              transition: 'all .2s',
            }}
          >
            {lvl}
          </button>
        ))}
        <button
          onClick={() => fetchNews(selectedLevel)}
          disabled={loading || !isOnline}
          style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: 20, border: '1.5px solid var(--card-b)',
            background: 'var(--card)', color: 'var(--subtext)', fontSize: 13, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif", cursor: loading || !isOnline ? 'default' : 'pointer',
            opacity: loading || !isOnline ? 0.5 : 1, transition: 'opacity .2s',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          background: 'var(--error-bg)', border: '1px solid var(--error-b)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: 'var(--error)', fontWeight: 600,
        }}>
          📴 You're offline — showing sample articles
        </div>
      )}

      {/* Fallback/error notice */}
      {error && isOnline && (
        <div style={{
          background: 'rgba(202,138,4,.08)', border: '1px solid rgba(202,138,4,.25)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: '#92400e', fontWeight: 600,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading: skeleton cards */}
      {loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Article cards */}
      {!loading && articles.map((article, i) => (
        <ArticleCard
          key={i}
          article={article}
          index={i}
          translating={translating}
          tooltip={tooltip}
          onWordTap={translateWord}
          onAward={() => markEngaged(i)}
          awarded={engagedArticles.has(i)}
        />
      ))}

      {/* Footer hint */}
      {!loading && articles.length > 0 && (
        <div style={{
          textAlign: 'center', fontSize: 12, color: 'var(--subtext)',
          marginTop: 4, marginBottom: 20, fontStyle: 'italic',
        }}>
          {usingFallback ? '📋 Sample articles — go online to load live news' : `${articles.length} articles at ${selectedLevel} level`}
        </div>
      )}
    </div>
  );
}
