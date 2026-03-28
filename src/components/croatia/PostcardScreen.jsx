import React, { useState, useRef, useEffect } from 'react';
import { H } from '../../data.jsx';
import { useStats } from '../../context/StatsContext.jsx';

const CITIES = [
  { name: "Dubrovnik",      region: "Dalmatia",         photo: "/images/scenes/dubrovnik-ai.webp", color: "#7c3aed" },
  { name: "Zagreb",         region: "Central Croatia",  photo: "/images/scenes/zagreb.webp",       color: "#0e7490" },
  { name: "Dalmatian Coast",region: "Dalmatia",         photo: "/images/scenes/dalmatian-ai.webp", color: "#0369a1" },
  { name: "Plitvice",       region: "Lika",             photo: "/images/scenes/plitvice.webp",     color: "#16a34a" },
  { name: "Mostar",         region: "Herzegovina",      photo: "/images/scenes/mostar.webp",       color: "#b45309" },
  { name: "Labin",          region: "Istria",           photo: "/images/scenes/labin.webp",        color: "#0e7490" },
];

function sanitizeForCanvas(str, maxLen = 400) {
  if (!str) return '';
  // Remove control characters and limit length
  // eslint-disable-next-line no-control-regex
  return String(str).replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, maxLen);
}

export default function PostcardScreen({ goBack, award }) {
  const { level: userLevel } = useStats();

  const [step, setStep]               = useState(1);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [userText, setUserText]       = useState("");
  const [toName, setToName]           = useState("");
  const [fromName, setFromName]       = useState("");
  const [correction, setCorrection]   = useState(null);
  const [correctedText, setCorrectedText] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [canvasReady, setCanvasReady] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [awardFired, setAwardFired]   = useState(false);
  const canvasRef = useRef(null);

  // ─── Canvas drawing ───────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 3 || !canvasRef.current) return;
    if (typeof HTMLCanvasElement === 'undefined') return;

    setCanvasReady(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 560;

    // Clear first
    ctx.clearRect(0, 0, 800, 560);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = () => {
      // Fallback: draw a solid colour swatch instead of photo
      ctx.fillStyle = selectedCity.color;
      ctx.fillRect(0, 0, 440, 560);
      drawWritingSide(ctx, canvas);
    };

    img.onload = () => {
      // ── 1. City photo (left 55%)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 440, 560);
      ctx.clip();
      ctx.drawImage(img, 0, 0, 440, 560);
      ctx.restore();

      // ── 2. Vertical gradient divider
      const grad = ctx.createLinearGradient(415, 0, 460, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.4, 'rgba(0,0,0,0.35)');
      grad.addColorStop(1, 'rgba(250,250,249,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(415, 0, 45, 560);

      drawWritingSide(ctx, canvas);
    };

    img.src = selectedCity.photo;

    function drawWritingSide(ctx) {
      // ── 3. White writing area (right 45%)
      ctx.fillStyle = '#fafaf9';
      ctx.fillRect(440, 0, 360, 560);

      // ── 4. Croatian flag strip at top of writing area
      ctx.fillStyle = '#CC0000'; ctx.fillRect(440, 0, 360, 8);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(440, 8, 360, 8);
      ctx.fillStyle = '#003087'; ctx.fillRect(440, 16, 360, 8);

      // ── 5. Stamp box (top right corner)
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(698, 32, 82, 62);
      ctx.setLineDash([]);
      // Stamp inner decoration
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(702, 36, 74, 54);
      ctx.fillStyle = '#e7e5e4';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('HRVATSKA', 739, 58);
      ctx.fillText('POŠTANSKA', 739, 70);
      ctx.fillText('MARKA', 739, 82);
      ctx.textAlign = 'left';

      // ── 6. Address section divider
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(460, 355);
      ctx.lineTo(775, 355);
      ctx.stroke();

      // Vertical divider between message and address halves
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(617, 360);
      ctx.lineTo(617, 540);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── 7. "To:" label + address lines
      ctx.fillStyle = '#a8a29e';
      ctx.font = 'italic 11px Georgia, serif';
      ctx.fillText('Za / To:', 628, 378);

      // Address ruled lines
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 1;
      for (let y = 395; y <= 510; y += 28) {
        ctx.beginPath();
        ctx.moveTo(628, y);
        ctx.lineTo(775, y);
        ctx.stroke();
      }

      // Fill recipient name on first address line
      if (toName) {
        ctx.fillStyle = '#292524';
        ctx.font = '13px Georgia, serif';
        ctx.fillText(sanitizeForCanvas(toName, 20), 628, 392);
      }

      // ── 8. Message text area (word-wrapped)
      ctx.fillStyle = '#292524';
      ctx.font = '14px Georgia, serif';

      const textToRender = sanitizeForCanvas(correctedText || userText);
      const words = textToRender.split(' ');
      let line = '';
      let y = 55;
      const msgLeft = 460;
      const maxWidth = 148; // px — enough for ~22 chars at 14px Georgia

      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), msgLeft, y);
          line = word + ' ';
          y += 22;
          if (y > 330) { ctx.fillText('…', msgLeft, y); break; }
        } else {
          line = testLine;
        }
      }
      if (y <= 330) ctx.fillText(line.trim(), msgLeft, y);

      // ── 9. Signature
      if (fromName) {
        const sigY = Math.min(y + 40, 342);
        ctx.font = 'italic 13px Georgia, serif';
        ctx.fillStyle = '#78716c';
        ctx.fillText(`— ${sanitizeForCanvas(fromName, 30)}`, msgLeft, sigY);
      }

      // ── 10. City name banner over photo (bottom left)
      const bannerGrad = ctx.createLinearGradient(0, 490, 0, 560);
      bannerGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bannerGrad.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = bannerGrad;
      ctx.fillRect(0, 490, 440, 70);

      ctx.fillStyle = 'white';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText(selectedCity.name, 20, 535);

      ctx.font = '13px Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Hrvatska  \u{1F1ED}\u{1F1F7}', 20, 553);

      // ── 11. Subtle watermark
      ctx.font = '10px Arial, sans-serif';
      ctx.fillStyle = 'rgba(168,162,158,0.6)';
      ctx.textAlign = 'right';
      ctx.fillText('Naša Hrvatska', 775, 550);
      ctx.textAlign = 'left';

      setCanvasReady(true);
    }
  }, [step, correctedText, userText, selectedCity, toName, fromName]);

  // ─── API call ─────────────────────────────────────────────────────────────
  async function checkWithAI() {
    if (!userText.trim() || userText.trim().length < 5) {
      setError("Please write at least a few words in Croatian first.");
      return;
    }
    setLoading(true);
    setError("");
    setCorrection(null);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "postcard",
          messages: [{ role: "user", content: userText.trim() }],
          params: {
            city: selectedCity.name,
            level: userLevel,
            user_name: fromName,
          },
        }),
      });
      if (!res.ok) throw new Error("API error " + res.status);
      const data = await res.json();
      setCorrection(data);
      setCorrectedText(data.corrected_text || userText.trim());
      setStep(2);
    } catch (e) {
      setError("Could not reach the AI correction service. Please check your connection and try again.");
    }
    setLoading(false);
  }

  // ─── Download ─────────────────────────────────────────────────────────────
  function downloadPostcard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `postcard-${selectedCity.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (!awardFired) { setAwardFired(true); award(15); }
  }

  // ─── Share / Copy ─────────────────────────────────────────────────────────
  function sharePostcard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'postcard.png', { type: 'image/png' });
      try {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Pozdrav iz ${selectedCity.name}!`,
            text: correctedText,
            files: [file],
          });
          if (!awardFired) { setAwardFired(true); award(15); }
          return;
        }
      } catch (_) { /* fall through to clipboard */ }
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(`${correctedText}\n— Naša Hrvatska 🇭🇷`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        if (!awardFired) { setAwardFired(true); award(15); }
      } catch (_) {
        setError("Could not copy to clipboard. Try downloading instead.");
      }
    });
  }

  const hasChanges = correction && correction.changes && correction.changes.length > 0;
  const score = correction?.score ?? 0;
  const scoreEmoji = score >= 80 ? '🌟' : score >= 60 ? '🎉' : '💪';
  const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#0e7490' : '#b45309';
  const scoreBg   = score >= 80 ? 'rgba(22,163,74,.1)' : score >= 60 ? 'rgba(14,116,144,.1)' : 'rgba(180,83,9,.1)';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap">
      {H('📮 Croatian Postcard', 'Write in Croatian, get it corrected, and create a beautiful shareable postcard')}

      {/* ── STEP INDICATOR ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, position: 'relative' }}>
        {['Write', 'Review', 'Postcard'].map((label, i) => {
          const idx = i + 1;
          const active = step === idx;
          const done   = step > idx;
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* connector line */}
              {i < 2 && (
                <div style={{
                  position: 'absolute', top: 14, left: '50%', width: '100%', height: 2,
                  background: done || (active && idx < step) ? '#0e7490' : 'var(--card-b)',
                  zIndex: 0,
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', zIndex: 1,
                background: done ? '#0e7490' : active ? 'var(--card)' : 'var(--card)',
                border: `2px solid ${done || active ? '#0e7490' : 'var(--card-b)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                color: done ? 'white' : active ? '#0e7490' : 'var(--subtext)',
                transition: 'all .3s',
              }}>
                {done ? '✓' : idx}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, marginTop: 4,
                color: active ? '#0e7490' : done ? '#0e7490' : 'var(--subtext)',
                letterSpacing: '.04em', textTransform: 'uppercase',
              }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STEP 1 — WRITE
      ══════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* City picker */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 10 }}>
              Choose your city
            </div>
            <div style={{
              display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8,
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}>
              {CITIES.map(city => {
                const sel = selectedCity.name === city.name;
                return (
                  <button
                    key={city.name}
                    onClick={() => setSelectedCity(city)}
                    style={{
                      flexShrink: 0, width: 130, height: 90, padding: 0, border: 'none',
                      borderRadius: 12, overflow: 'hidden', cursor: 'pointer', position: 'relative',
                      outline: sel ? `3px solid ${city.color}` : '3px solid transparent',
                      outlineOffset: 2, transition: 'outline .2s, transform .15s',
                      transform: sel ? 'scale(1.04)' : 'scale(1)',
                      boxShadow: sel ? `0 4px 18px ${city.color}44` : '0 2px 8px rgba(0,0,0,.18)',
                    }}
                    aria-pressed={sel}
                  >
                    <img
                      src={city.photo}
                      alt={city.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.15) 55%, transparent 100%)',
                    }} />
                    {/* City name */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '6px 8px',
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{city.name}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>{city.region}</div>
                    </div>
                    {/* Checkmark */}
                    {sel && (
                      <div style={{
                        position: 'absolute', top: 7, right: 7,
                        background: city.color, borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: 'white', fontWeight: 900,
                        boxShadow: '0 1px 4px rgba(0,0,0,.3)',
                      }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional fields */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)', display: 'block', marginBottom: 5 }}>
                To: <span style={{ fontWeight: 400, fontStyle: 'italic' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={toName}
                onChange={e => setToName(e.target.value)}
                placeholder="Baka i Dida"
                maxLength={40}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 14,
                  border: '1.5px solid var(--card-b)', borderRadius: 10,
                  fontFamily: "'Outfit',sans-serif",
                  background: 'var(--card)', color: 'var(--heading)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)', display: 'block', marginBottom: 5 }}>
                Your name: <span style={{ fontWeight: 400, fontStyle: 'italic' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="Ana"
                maxLength={40}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 14,
                  border: '1.5px solid var(--card-b)', borderRadius: 10,
                  fontFamily: "'Outfit',sans-serif",
                  background: 'var(--card)', color: 'var(--heading)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Message textarea */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)', display: 'block', marginBottom: 5 }}>
              Write your message in Croatian:
            </label>
            <div className="c" style={{ padding: 0, overflow: 'hidden' }}>
              <textarea
                value={userText}
                onChange={e => setUserText(e.target.value)}
                placeholder="Dragi prijatelju, ovdje je predivno..."
                rows={5}
                style={{
                  width: '100%', padding: '14px 16px', fontSize: 15, lineHeight: 1.7,
                  border: 'none', borderRadius: 0, outline: 'none',
                  fontFamily: "'Georgia', serif", resize: 'vertical',
                  background: 'var(--card)', color: 'var(--heading)',
                  boxSizing: 'border-box', minHeight: 120,
                }}
              />
              <div style={{
                padding: '6px 14px 10px', display: 'flex', justifyContent: 'flex-end',
                borderTop: '1px solid var(--card-b)',
              }}>
                <span style={{ fontSize: 11, color: 'var(--subtext)' }}>{userText.length} characters</span>
              </div>
            </div>
          </div>

          {/* Tip box */}
          <div style={{
            background: 'rgba(14,116,144,.07)', border: '1.5px solid rgba(14,116,144,.2)',
            borderRadius: 12, padding: '12px 14px',
            fontSize: 12, color: 'var(--subtext)', lineHeight: 1.6,
          }}>
            💡 <strong style={{ color: 'var(--heading)' }}>Stuck?</strong> Try:{' '}
            <em>Vrijeme je predivno.</em> · <em>Jelo je odlično.</em> · <em>Nedostajete mi.</em>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(220,38,38,.07)', border: '1.5px solid rgba(220,38,38,.25)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
              color: 'var(--error)', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 4 }}
            onClick={checkWithAI}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ animation: 'spin .8s linear infinite', display: 'inline-block', lineHeight: 1 }}>⟳</span>
                Checking your Croatian…
              </span>
            ) : '🤖 Check & Create Postcard'}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2 — AI CORRECTION REVIEW
      ══════════════════════════════════════════════════════════════════ */}
      {step === 2 && correction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn .35s ease' }}>

          {/* Score badge */}
          <div className="c" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 6 }}>{scoreEmoji}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: scoreBg, border: `1.5px solid ${scoreColor}44`,
              borderRadius: 40, padding: '6px 20px',
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: scoreColor }}>{score}</span>
              <span style={{ fontSize: 14, color: 'var(--subtext)', fontWeight: 600 }}>/100</span>
            </div>
            {correction.encouragement && (
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--heading)', fontWeight: 600, lineHeight: 1.5 }}>
                {correction.encouragement}
              </div>
            )}
          </div>

          {/* Before / After */}
          {hasChanges ? (
            <div className="c" style={{ padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                Your version vs. corrected
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                {/* Original */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Your version</div>
                  <div style={{
                    background: 'rgba(220,38,38,.06)', border: '1.5px solid rgba(220,38,38,.2)',
                    borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.7,
                    color: 'var(--heading)', fontFamily: "'Georgia',serif",
                  }}>
                    {userText}
                  </div>
                </div>
                {/* Corrected */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Corrected</div>
                  <div style={{
                    background: 'rgba(22,163,74,.06)', border: '1.5px solid rgba(22,163,74,.2)',
                    borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.7,
                    color: 'var(--heading)', fontFamily: "'Georgia',serif",
                  }}>
                    {correctedText}
                  </div>
                </div>
              </div>

              {/* Change list */}
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                Changes explained
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {correction.changes.map((ch, i) => (
                  <div key={i} style={{
                    background: 'var(--card)', border: '1px solid var(--card-b)',
                    borderRadius: 8, padding: '8px 12px',
                    display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, textDecoration: 'line-through', flexShrink: 0 }}>{ch.original}</span>
                    <span style={{ fontSize: 12, color: 'var(--subtext)', flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>{ch.corrected}</span>
                    {ch.note && <span style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic' }}>· {ch.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(22,163,74,.07)', border: '1.5px solid rgba(22,163,74,.25)',
              borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#16a34a',
              fontWeight: 600, textAlign: 'center',
            }}>
              ✅ Your Croatian looks great — no corrections needed!
            </div>
          )}

          {/* Local touch suggestion */}
          {correction.local_touch && (
            <div style={{
              background: 'rgba(14,116,144,.07)', border: '1.5px solid rgba(14,116,144,.2)',
              borderRadius: 12, padding: '12px 14px',
              fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6,
            }}>
              🏝️ <strong style={{ color: 'var(--heading)' }}>Local touch for {selectedCity.name}:</strong>{' '}
              {correction.local_touch}
            </div>
          )}

          {/* Alternative closing */}
          {correction.alternative_closing && (
            <div style={{
              background: 'rgba(124,58,237,.06)', border: '1.5px solid rgba(124,58,237,.2)',
              borderRadius: 12, padding: '12px 14px',
              fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6,
            }}>
              ✍️ <strong style={{ color: 'var(--heading)' }}>Alternative closing:</strong>{' '}
              <em style={{ color: 'var(--heading)' }}>{correction.alternative_closing}</em>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(220,38,38,.07)', border: '1.5px solid rgba(220,38,38,.25)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
              color: 'var(--error)', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="b"
              style={{
                flex: 1, padding: '12px', borderRadius: 12,
                background: 'var(--card)', border: '1.5px solid var(--card-b)',
                color: 'var(--heading)', fontFamily: "'Outfit',sans-serif",
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
              onClick={() => { setStep(1); setError(""); }}
            >
              📝 Edit More
            </button>
            <button
              className="b bp"
              style={{ flex: 2 }}
              onClick={() => setStep(3)}
            >
              ✨ Create Postcard
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 3 — POSTCARD CANVAS
      ══════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn .4s ease' }}>

          {/* Canvas wrapper */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--card-b)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,.18)',
          }}>
            {/* Canvas — scales to container width */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '70%' /* 560/800 */ }}>
              {!canvasReady && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--card)', borderRadius: 14,
                  flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ fontSize: 32, animation: 'spin 1.2s linear infinite' }}>⟳</div>
                  <div style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600 }}>Rendering your postcard…</div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%',
                  display: 'block', borderRadius: 14,
                  opacity: canvasReady ? 1 : 0,
                  transition: 'opacity .4s ease',
                }}
              />
            </div>
          </div>

          {/* Canvas not supported fallback */}
          {typeof HTMLCanvasElement === 'undefined' && (
            <div style={{
              background: 'rgba(220,38,38,.07)', border: '1.5px solid rgba(220,38,38,.2)',
              borderRadius: 12, padding: '12px 14px', fontSize: 13,
              color: 'var(--error)', fontWeight: 600,
            }}>
              Your browser doesn't support canvas. Please try a different browser to generate the postcard image.
            </div>
          )}

          {/* Corrected text readable copy */}
          {canvasReady && (
            <div style={{
              background: 'rgba(14,116,144,.05)', border: '1px solid rgba(14,116,144,.15)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                Your message
              </div>
              <div style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.7, fontFamily: "'Georgia',serif" }}>
                {correctedText}
              </div>
              {fromName && (
                <div style={{ fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 6 }}>
                  — {fromName}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(220,38,38,.07)', border: '1.5px solid rgba(220,38,38,.25)',
              borderRadius: 10, padding: '10px 14px', fontSize: 13,
              color: 'var(--error)', fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="b bp"
              style={{ flex: 1 }}
              onClick={downloadPostcard}
              disabled={!canvasReady}
            >
              💾 Download
            </button>
            <button
              className="b bp"
              style={{
                flex: 1,
                background: copied ? 'rgba(22,163,74,.9)' : undefined,
                transition: 'background .3s',
              }}
              onClick={sharePostcard}
              disabled={!canvasReady}
            >
              {copied ? '✅ Copied!' : '📤 Share'}
            </button>
          </div>

          {/* Back buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                background: 'none', border: '1.5px solid var(--card-b)',
                color: 'var(--subtext)', fontFamily: "'Outfit',sans-serif",
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
              onClick={() => { setStep(2); setError(""); }}
            >
              ← Back to Review
            </button>
            <button
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                background: 'none', border: '1.5px solid var(--card-b)',
                color: 'var(--subtext)', fontFamily: "'Outfit',sans-serif",
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
              onClick={() => {
                setStep(1);
                setUserText("");
                setToName("");
                setFromName("");
                setCorrection(null);
                setCorrectedText("");
                setCanvasReady(false);
                setAwardFired(false);
                setError("");
              }}
            >
              📮 New Postcard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
