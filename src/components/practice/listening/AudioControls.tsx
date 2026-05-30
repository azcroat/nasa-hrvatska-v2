import React, { useState, useEffect, useRef, useCallback } from 'react';
import { speak, speakSlow, stopAudio } from '../../../lib/audio.ts';

export default function AudioControls({
  text,
  accentColor,
}: {
  text: string;
  accentColor: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [slowPlaying, setSlowPlaying] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAudio();
    };
  }, []);

  // Auto-play on mount
  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    setPlaying(true);
    speak(text).finally(() => {
      if (!cancelled && mountedRef.current) setPlaying(false);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const handleReplay = useCallback(() => {
    if (playing || slowPlaying) return;
    setPlaying(true);
    speak(text).finally(() => {
      if (mountedRef.current) setPlaying(false);
    });
  }, [text, playing, slowPlaying]);

  const handleSlow = useCallback(() => {
    if (playing || slowPlaying) return;
    setSlowPlaying(true);
    speakSlow(text).finally(() => {
      if (mountedRef.current) setSlowPlaying(false);
    });
  }, [text, playing, slowPlaying]);

  const handleStop = useCallback(() => {
    stopAudio();
    setPlaying(false);
    setSlowPlaying(false);
  }, []);

  const isActive = playing || slowPlaying;

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
      <button
        onClick={isActive ? handleStop : handleReplay}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          border: 'none',
          background: isActive ? '#fee2e2' : accentColor,
          color: isActive ? '#b91c1c' : 'white',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          transition: 'background .2s',
        }}
      >
        {isActive ? '⏹ Stop' : '▶ Replay'}
      </button>
      <button
        onClick={handleSlow}
        disabled={isActive}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          border: `1.5px solid ${accentColor}`,
          background: 'transparent',
          color: accentColor,
          fontSize: 13,
          fontWeight: 700,
          cursor: isActive ? 'default' : 'pointer',
          fontFamily: "'Outfit',sans-serif",
          opacity: isActive ? 0.5 : 1,
          transition: 'opacity .2s',
        }}
      >
        🐢 Play slow
      </button>
    </div>
  );
}
