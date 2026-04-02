import React, { useState, useEffect, useCallback } from 'react';
import CroatianKnight from '../shared/CroatianKnight.jsx';
import { speak } from '../../lib/audio.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';

function getWeakWords() {
  try {
    const raw = localStorage.getItem('nh_sr');
    if (!raw) return [];
    const sr = JSON.parse(raw);
    return Object.entries(sr)
      .filter(([, v]) => v.w > v.r && (v.r + v.w) >= 2)
      .sort((a, b) => (b[1].w - b[1].r) - (a[1].w - a[1].r))
      .slice(0, 8)
      .map(([word]) => word);
  } catch {
    return [];
  }
}

export default function AIStoryScreen({ goBack, award }) {
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [wordsUsed, setWordsUsed] = useState([]);
  const [rawReply, setRawReply] = useState(null);
  const [error, setError] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [done, setDone] = useState(false);
  const weakWords = getWeakWords();

  const generateStory = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setStory(null);
    setTranslation(null);
    setWordsUsed([]);
    setRawReply(null);
    setError(null);
    setShowTranslation(false);

    const wordList = weakWords.length > 0 ? weakWords : ['hvala', 'dobar', 'kuća', 'more', 'jesti'];
    const message = `Write a short Croatian story (4-6 sentences) using these words naturally: ${wordList.join(', ')}. Make it about life in Croatia — could be family, food, travel, daily life. Keep it at A2-B1 level. After the story, provide an English translation. Format your response as JSON: {"story": "Croatian text", "translation": "English text", "words_used": ["word1", "word2"]}`;

    try {
      const res = await fetch('/api/maja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          persona: 'teacher',
          memory: {},
          history: [],
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const replyText = data.reply || data.message || data.text || JSON.stringify(data);

      // Try to extract JSON from the reply
      let parsed = null;
      try {
        // Try direct parse first
        parsed = JSON.parse(replyText);
      } catch {
        // Try to find JSON block inside the text
        const match = replyText.match(/\{[\s\S]*"story"[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { /* fall through */ }
        }
      }

      if (parsed && parsed.story) {
        setStory(parsed.story);
        setTranslation(parsed.translation || '');
        setWordsUsed(parsed.words_used || wordList);
      } else {
        setRawReply(replyText);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate story');
    } finally {
      setLoading(false);
    }
  }, [weakWords, loading]);  

  useEffect(() => { generateStory(); }, []);  

  function handleDone() {
    if (typeof award === 'function') award(15);
    setDone(true);
    setTimeout(goBack, 400);
  }

  // Highlight weak words in the story text
  function renderHighlightedStory(text, words) {
    if (!words || words.length === 0) return <span>{text}</span>;
    const safeWords = words.filter(w => w != null && typeof w === 'string');
    if (safeWords.length === 0) return <span>{text}</span>;
    const pattern = new RegExp(`(${safeWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);
    return parts.map((part, i) => {
      const isWord = safeWords.some(w => w.toLowerCase() === part.toLowerCase());
      if (isWord) {
        return (
          <strong
            key={i}
            onClick={() => speak(part)}
            style={{
              color: 'var(--info)',
              cursor: 'pointer',
              textDecoration: 'underline dotted',
              textUnderlineOffset: 3,
            }}
            title={`Tap to hear "${part}"`}
          >
            {part}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="scr-wrap" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={goBack}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--subtext)', padding: 4 }}
          aria-label="Go back"
        >←</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)' }}>📖 Your Personalized Story</div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>Built from your weak words</div>
        </div>
      </div>

      {!isOnline && (
        <div style={{
          background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:10,
          padding:'12px 16px', marginBottom:16, fontSize:13, fontWeight:600,
          color:'#92400e', display:'flex', alignItems:'center', gap:8
        }}>
          <span>📡</span>
          <span>You're offline. AI features need an internet connection. Your progress is saved locally.</span>
        </div>
      )}

      {/* Knight mascot */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <CroatianKnight size={60} mood={loading ? 'thinking' : done ? 'celebrating' : 'happy'} />
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 14, color: 'var(--subtext)', fontWeight: 600 }}>
            Maja is writing your story...
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--info)', opacity: 0.5,
                animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, color: 'var(--error)', fontWeight: 700, marginBottom: 8 }}>
            {!isOnline ? 'No connection — reconnect to generate a story.' : error}
          </div>
          <button className="b bp" onClick={generateStory} style={{ width: '100%' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Raw reply (non-JSON fallback) */}
      {rawReply && !loading && (
        <div style={{
          background: 'var(--card)', borderRadius: 16, padding: '20px',
          border: '1px solid var(--border)', marginBottom: 16,
        }}>
          <div style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {rawReply}
          </div>
        </div>
      )}

      {/* Story card */}
      {story && !loading && (
        <>
          <div style={{
            background: 'var(--card)', borderRadius: 20, padding: '20px 20px 24px',
            border: '1px solid var(--border)', marginBottom: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,.06)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--info)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              Croatian Story
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--body)', margin: 0 }}>
              {renderHighlightedStory(story, wordsUsed)}
            </p>
            <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 12, fontStyle: 'italic' }}>
              Tap highlighted words to hear pronunciation
            </div>
          </div>

          {/* Translation collapsible */}
          {translation && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowTranslation(v => !v)}
                style={{
                  width: '100%', background: 'var(--bar-bg)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 16px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--subtext)',
                }}
              >
                <span>English Translation</span>
                <span style={{ fontSize: 16, transition: 'transform .2s', transform: showTranslation ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>
              {showTranslation && (
                <div style={{
                  background: 'var(--bar-bg)', borderRadius: '0 0 12px 12px',
                  padding: '14px 16px', border: '1px solid var(--border)', borderTop: 'none',
                }}>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--body)', margin: 0, fontStyle: 'italic' }}>
                    {translation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Words practiced chips */}
          {wordsUsed.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                Words Practiced
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {wordsUsed.map(word => (
                  <button
                    key={word}
                    onClick={() => speak(word)}
                    style={{
                      background: 'rgba(14,116,144,.1)', border: '1px solid rgba(14,116,144,.25)',
                      borderRadius: 20, padding: '4px 12px',
                      fontSize: 13, fontWeight: 700, color: 'var(--info)', cursor: 'pointer',
                    }}
                    title={`Hear "${word}"`}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="b"
              onClick={generateStory}
              style={{
                flex: 1, borderRadius: 14, padding: '14px 0',
                background: 'var(--bar-bg)', border: '1px solid var(--border)',
                fontSize: 14, fontWeight: 800, color: 'var(--subtext)', cursor: 'pointer',
              }}
            >
              🔄 New Story
            </button>
            <button
              className="b bp"
              onClick={handleDone}
              style={{ flex: 2, borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 900 }}
            >
              Done — +15 XP ✓
            </button>
          </div>
        </>
      )}

      {/* Empty weak words notice */}
      {!loading && !error && !story && !rawReply && weakWords.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--subtext)', fontSize: 14 }}>
          Practice more words to get personalized stories!
        </div>
      )}
    </div>
  );
}
