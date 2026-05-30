import React, { useState, useEffect } from 'react';

export default function TypewriterText({ text, speed = 13 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  const done = shown.length >= (text?.length || 0);
  return (
    <>
      {shown}
      {!done && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '0.85em',
            background: 'rgba(255,255,255,0.85)',
            verticalAlign: 'text-bottom',
            marginLeft: 1,
            animation: 'lk-blink .65s step-end infinite',
          }}
        />
      )}
    </>
  );
}
