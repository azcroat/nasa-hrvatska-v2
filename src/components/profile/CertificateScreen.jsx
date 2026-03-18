import React, { useRef } from 'react';
import { lXP, nXP, getStreak } from '../../data.jsx';

const LEVEL_LABELS = ['', 'Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Proficient'];
const CEFR_BY_LEVEL = ['', 'A1', 'A1-A2', 'A2-B1', 'B1', 'B1-B2', 'B2-C1', 'C1+'];

export default function CertificateScreen({ name, level, st, goBack }) {
  const certRef = useRef(null);
  const streak = getStreak();
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const cefrLabel = CEFR_BY_LEVEL[Math.min(level, CEFR_BY_LEVEL.length - 1)] || 'A1';
  const levelLabel = LEVEL_LABELS[Math.min(level, LEVEL_LABELS.length - 1)] || 'Beginner';
  const xpCur = st.xp - lXP(level);
  const xpNeeded = nXP(level) - lXP(level);
  const xpPct = Math.min(Math.round((xpCur / xpNeeded) * 100), 100);

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    const text = `I've reached Level ${level} (${cefrLabel} — ${levelLabel}) in Croatian with ${st.xp.toLocaleString()} XP on Naša Hrvatska! 🇭🇷`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Croatian Progress — Naša Hrvatska', text, url: 'https://nasahrvatska.com' });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  }

  return (
    <div className="scr-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={goBack} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
          padding: '6px 10px', borderRadius: 10,
          color: 'var(--heading)', fontFamily: "'Outfit',sans-serif",
        }}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)', flex: 1 }}>Progress Certificate</h2>
        <button onClick={handleShare} style={{
          background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
          color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", marginRight: 8,
        }}>🔗 Share</button>
        <button onClick={handlePrint} style={{
          background: 'linear-gradient(135deg,#0e7490,#164e63)',
          color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
        }}>🖨️ Print</button>
      </div>

      {/* Certificate */}
      <div ref={certRef} style={{
        background: '#fff', borderRadius: 24, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,.12)',
        border: '8px solid #0e7490',
        maxWidth: 680, margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(150deg,#0a1628,#0c3d6b,#0a5a8a)',
          padding: '32px 40px 28px', color: '#fff', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 12, height: 6 }}>
            <div style={{ width: 60, background: '#D4002D' }} />
            <div style={{ width: 60, background: '#F5F5F5' }} />
            <div style={{ width: 60, background: '#003DA5' }} />
          </div>
          <div style={{ fontSize: 13, letterSpacing: '.15em', textTransform: 'uppercase', opacity: .8, fontWeight: 600, marginBottom: 6 }}>
            Naša Hrvatska
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>
            Certificate of Progress
          </div>
          <div style={{ fontSize: 13, opacity: .75 }}>Croatian Language Achievement</div>
        </div>

        {/* Body */}
        <div style={{ padding: '36px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 6, letterSpacing: '.08em', textTransform: 'uppercase' }}>
            This certifies that
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', fontFamily: "'Playfair Display',serif", marginBottom: 6 }}>
            {name || 'Learner'}
          </div>
          <div style={{ fontSize: 14, color: '#475569', marginBottom: 24, fontWeight: 500 }}>
            has demonstrated dedicated study of the Croatian language
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
            {[
              { icon: '🏆', label: 'Level', val: `Level ${level}` },
              { icon: '🌍', label: 'CEFR', val: cefrLabel },
              { icon: '⭐', label: 'Total XP', val: st.xp.toLocaleString() },
              { icon: '📚', label: 'Lessons', val: st.lc },
              { icon: '🔥', label: 'Best Streak', val: `${streak.count} days` },
              { icon: '📝', label: 'Proficiency', val: levelLabel },
            ].map((s, i) => (
              <div key={i} style={{
                background: '#f8fafc', borderRadius: 14, padding: '14px 10px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{s.val}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Level progress */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Progress to Level {level + 1}</span>
              <span style={{ fontSize: 12, color: '#0e7490', fontWeight: 700 }}>{xpPct}%</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: xpPct + '%', background: 'linear-gradient(90deg,#0e7490,#38bdf8)', borderRadius: 4 }} />
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
            Issued on {today} · nasahrvatska.com
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--subtext)', marginTop: 16 }}>
        Use your browser's print function to save as PDF or print.
      </p>
    </div>
  );
}
