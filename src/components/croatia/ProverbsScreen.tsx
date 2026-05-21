import React, { useEffect } from 'react';
import { H, speak } from '../../data';
import { useContent } from '../../hooks/useContent';
import { signalSessionCompleteIfActive } from '../../lib/sessionSignal';

interface Props {
  goBack: () => void;
}

interface Proverb {
  hr: string;
  en: string;
  meaning?: string;
}

export default function ProverbsScreen({ goBack }: Props) {
  const { content, loading, error } = useContent();
  // Don't strand a Today's Session activity on content-load failure.
  useEffect(() => {
    if (error) signalSessionCompleteIfActive('proverbs');
  }, [error]);
  if (error)
    return (
      <div className="scr-wrap">
        {H('🌟 Hrvatske Poslovice', "Couldn't load — please retry.", goBack)}
      </div>
    );
  if (loading || !content)
    return <div className="scr-wrap">{H('🌟 Hrvatske Poslovice', 'Loading…', goBack)}</div>;
  const PROVERBS = content.PROVERBS as unknown as Proverb[];
  return (
    <div className="scr-wrap">
      {H('🌟 Hrvatske Poslovice', 'Croatian Proverbs — Tap to hear', goBack)}
      {PROVERBS.map((p, i) => (
        <div
          key={i}
          className="c"
          role="button"
          tabIndex={0}
          style={{ marginBottom: 10, cursor: 'pointer' }}
          onClick={() => speak(p.hr)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              speak(p.hr);
            }
          }}
          aria-label={'Hear proverb: ' + p.hr}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e', fontStyle: 'italic' }}>
            {p.hr} <span aria-hidden="true">🔊</span>
          </div>
          <div style={{ fontSize: 14, color: '#0e7490', fontWeight: 600, marginTop: 4 }}>
            {p.en}
          </div>
        </div>
      ))}
    </div>
  );
}
