import React from 'react';

interface Props {
  countdown: number;
}

export default function SprintCountdownScreen({ countdown }: Props) {
  return (
    <div
      className="scr-wrap"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <div
        style={{
          fontSize: 100,
          fontWeight: 900,
          color: '#d4002d',
          animation: 'sprint-countdown 0.5s ease-out',
        }}
      >
        {countdown}
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--subtext)', marginTop: 16 }}>
        Pripremi se!
      </p>
    </div>
  );
}
