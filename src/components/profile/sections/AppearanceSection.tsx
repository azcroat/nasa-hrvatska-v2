import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';

/**
 * Appearance section — dark mode, font size, reduce motion. Extracted from
 * SettingsTab as part of the 1a decomposition. darkMode comes from useApp()
 * (context); font size + reduce-motion are section-local UI state. Props-less.
 * Behavior-identical to the prior inline block.
 */
export default function AppearanceSection() {
  const { darkMode, setDarkMode } = useApp();
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('nh_font_size') || 'medium');
  const [reduceMotion, setReduceMotion] = useState(
    () => localStorage.getItem('nh_reduce_motion') === 'true',
  );

  return (
    <React.Fragment>
      {/* ── APPEARANCE ── */}
      <div className="section-hdr" style={{ marginTop: 24 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(124,58,237,.12)' }}>
          🎨
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Appearance</div>
          <div className="section-hdr-sub">Theme, font size, and motion</div>
        </div>
      </div>

      <button
        className="tc"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px',
          marginBottom: 10,
        }}
        onClick={() => {
          const nv = !darkMode;
          setDarkMode(nv);
          localStorage.setItem('darkMode', nv.toString());
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: darkMode
              ? 'rgba(253,224,71,.2)'
              : 'linear-gradient(135deg,var(--heading),#334155)',
            border: darkMode ? '1px solid rgba(253,224,71,.5)' : '1px solid #475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-xl)',
            flexShrink: 0,
          }}
        >
          {darkMode ? '☀️' : '🌙'}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 1 }}>
            Switch appearance
          </div>
        </div>
        <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.8 }}>›</div>
      </button>

      {/* Font size control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>🔠 Font Size</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Adjust text size across the app
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1.5px solid var(--card-b)',
            flexShrink: 0,
          }}
        >
          {['small', 'medium', 'large'].map((size, i) => (
            <button
              key={size}
              onClick={() => {
                setFontSize(size);
                localStorage.setItem('nh_font_size', size);
                if (size === 'medium') {
                  document.documentElement.removeAttribute('data-font');
                } else {
                  document.documentElement.setAttribute('data-font', size);
                }
              }}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderLeft: i > 0 ? '1px solid var(--card-b)' : 'none',
                cursor: 'pointer',
                background: fontSize === size ? 'var(--info)' : 'var(--card)',
                color: fontSize === size ? '#fff' : 'var(--subtext)',
                fontWeight: 700,
                fontSize: size === 'small' ? 11 : size === 'large' ? 15 : 13,
                fontFamily: "'Outfit',sans-serif",
                transition: 'background .15s',
                minHeight: 36,
              }}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reduce motion toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>✋ Reduce Animations</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Minimize motion and transitions
          </div>
        </div>
        <button
          role="switch"
          aria-checked={reduceMotion ? 'true' : 'false'}
          onClick={() => {
            const v = !reduceMotion;
            setReduceMotion(v);
            localStorage.setItem('nh_reduce_motion', v.toString());
            document.documentElement.classList.toggle('reduce-motion', v);
          }}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            cursor: 'pointer',
            transition: 'background .2s',
            background: reduceMotion ? 'var(--success)' : 'var(--bar-bg)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: reduceMotion ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'white',
              transition: 'left .2s',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          />
        </button>
      </div>
    </React.Fragment>
  );
}
