import React from 'react';

// Animated shimmer skeleton block
export function SkeletonBlock({ width = '100%', height = 20, borderRadius = 8, style = {} }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, var(--bar-bg) 25%, var(--card-b) 50%, var(--bar-bg) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite',
      ...style,
    }} />
  );
}

// Full AI content skeleton — looks like the content about to appear
export function AIContentSkeleton({ message = 'Generating…', icon = '🤖' }) {
  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
        <div style={{ fontSize: 14, color: 'var(--subtext)', fontWeight: 600 }}>{message}</div>
      </div>
      <SkeletonBlock height={18} width="90%" />
      <SkeletonBlock height={18} width="75%" />
      <SkeletonBlock height={18} width="82%" />
      <SkeletonBlock height={18} width="60%" />
      <div style={{ marginTop: 8 }}>
        <SkeletonBlock height={18} width="88%" />
        <SkeletonBlock height={18} width="71%" style={{ marginTop: 8 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <SkeletonBlock height={44} borderRadius={12} style={{ flex: 1 }} />
        <SkeletonBlock height={44} borderRadius={12} style={{ flex: 1 }} />
        <SkeletonBlock height={44} borderRadius={12} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

// Progress bar with pulsing animation and ETA message
export function AIProgressBar({ phase = 'thinking', messages }) {
  const defaultMessages = {
    thinking: ['Thinking in Croatian…', 'Consulting the baka…', 'Writing your dialogue…', 'Preparing content…'],
    audio: ['Recording voice…', 'Converting to speech…', 'Almost ready…'],
    processing: ['Analyzing…', 'Processing your answer…'],
  };
  const msgs = messages || defaultMessages[phase] || defaultMessages.thinking;
  const [msgIdx, setMsgIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % msgs.length), 1800);
    return () => clearInterval(t);
  }, [msgs.length]);
  return (
    <div style={{ padding: '0 20px', marginTop: 16 }}>
      <div style={{
        height: 4, borderRadius: 2, background: 'var(--bar-bg)', overflow: 'hidden', marginBottom: 10,
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'linear-gradient(90deg, #0e7490, #38bdf8)',
          animation: 'progress-indeterminate 1.8s ease-in-out infinite',
        }} />
      </div>
      <div style={{ fontSize: 13, color: 'var(--subtext)', textAlign: 'center', fontWeight: 600, minHeight: 20, transition: 'opacity 0.3s' }}>
        {msgs[msgIdx]}
      </div>
    </div>
  );
}
