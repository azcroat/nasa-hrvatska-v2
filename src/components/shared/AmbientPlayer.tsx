// @ts-nocheck
import React, { useState, useRef, useCallback } from 'react';

const SCENES = [
  {
    id: 'kafic',
    label: 'Kafić',
    icon: '☕',
    gain: 0.03,
    filterType: 'lowpass',
    filterFreq: 200,
    lfoFreq: null,
  },
  {
    id: 'jadran',
    label: 'Jadran',
    icon: '🌊',
    gain: 0.04,
    filterType: 'lowpass',
    filterFreq: 400,
    lfoFreq: 0.12,
  },
  {
    id: 'trznica',
    label: 'Tržnica',
    icon: '🏪',
    gain: 0.04,
    filterType: 'bandpass',
    filterFreq: 600,
    lfoFreq: 0.3,
  },
];

function createNoise(ctx, gain, filterFreq, filterType = 'lowpass') {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
  return { source, filter, gainNode };
}

export default function AmbientPlayer() {
  const [scene, setScene] = useState('off');
  const ctxRef = useRef(null);
  const nodesRef = useRef(null);
  const lfoRef = useRef(null);

  const stopAll = useCallback(() => {
    if (nodesRef.current) {
      try {
        nodesRef.current.source.stop();
      } catch {}
      try {
        nodesRef.current.gainNode.disconnect();
      } catch {}
      nodesRef.current = null;
    }
    if (lfoRef.current) {
      try {
        lfoRef.current.lfo.stop();
      } catch {}
      lfoRef.current = null;
    }
    if (ctxRef.current) {
      try {
        ctxRef.current.close();
      } catch {}
      ctxRef.current = null;
    }
  }, []);

  const startScene = useCallback(
    (sceneId) => {
      stopAll();
      const cfg = SCENES.find((s) => s.id === sceneId);
      if (!cfg) return;

      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = ctx;

        const nodes = createNoise(ctx, cfg.gain, cfg.filterFreq, cfg.filterType);
        nodesRef.current = nodes;

        if (cfg.lfoFreq) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = cfg.lfoFreq;
          lfoGain.gain.value = cfg.gain * 0.7;
          lfo.connect(lfoGain);
          lfoGain.connect(nodes.gainNode.gain);
          lfo.start();
          lfoRef.current = { lfo, lfoGain };
        }
      } catch {
        /* AudioContext not available */
      }
    },
    [stopAll],
  );

  function handleSceneClick(sceneId) {
    if (scene === sceneId) {
      stopAll();
      setScene('off');
    } else {
      startScene(sceneId);
      setScene(sceneId);
    }
  }

  function handleStop() {
    stopAll();
    setScene('off');
  }

  return (
    <div
      role="region"
      aria-label="Ambient soundscape player"
      style={{
        position: 'fixed',
        bottom: 72,
        right: 12,
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      {/* Ambient sound widget — icon-only buttons with label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'var(--card)',
          borderRadius: 30,
          padding: '5px 10px',
          border: '1px solid var(--border)',
          boxShadow: '0 2px 12px rgba(0,0,0,.12)',
          pointerEvents: 'auto',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--subtext)',
            marginRight: 4,
            letterSpacing: '.02em',
          }}
        >
          🔊
        </span>
        {SCENES.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSceneClick(s.id)}
            title={`Play ${s.label} ambient sounds`}
            aria-pressed={scene === s.id}
            aria-label={`${s.label} ambient sounds`}
            style={{
              background: scene === s.id ? 'var(--info)' : 'transparent',
              border: 'none',
              borderRadius: 20,
              padding: '4px 7px',
              fontSize: 16,
              cursor: 'pointer',
              opacity: scene === s.id ? 1 : 0.6,
              transition: 'background .2s, opacity .2s',
              lineHeight: 1,
            }}
          >
            {s.icon}
          </button>
        ))}
        {scene !== 'off' && (
          <button
            onClick={handleStop}
            title="Stop ambient sound"
            aria-label="Stop ambient sound"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 20,
              padding: '2px 4px',
              fontSize: 11,
              cursor: 'pointer',
              color: 'var(--subtext)',
              fontWeight: 900,
              opacity: 0.7,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
