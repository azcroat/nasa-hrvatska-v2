import React from 'react';
import { H, speak } from '../../data';
import { useContent } from '../../hooks/useContent';

interface IdiomsScreenProps {
  goBack: () => void;
}

interface Idiom {
  hr: string;
  en: string;
  lit: string;
  ctx: string;
}

export default function IdiomsScreen({ goBack }: IdiomsScreenProps) {
  const { content, loading, error } = useContent();
  if (error)
    return (
      <div className="scr-wrap">
        {H('🗣️ Idioms & Slang', "Couldn't load — please retry.", goBack)}
      </div>
    );
  if (loading || !content)
    return <div className="scr-wrap">{H('🗣️ Idioms & Slang', 'Loading…', goBack)}</div>;
  const IDIOMS = content.IDIOMS as unknown as Idiom[];
  return (
    <div className="scr-wrap">
      {H('🗣️ Idioms & Slang', 'Speak like a real Croatian!', goBack)}
      {IDIOMS.map((idm, i) => (
        <div
          key={i}
          className="c"
          role="button"
          tabIndex={0}
          style={{ marginBottom: 10, cursor: 'pointer' }}
          onClick={() => speak(idm.hr)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              speak(idm.hr);
            }
          }}
          aria-label={'Hear idiom: ' + idm.hr}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#164e63' }}>
              {idm.hr} <span aria-hidden="true">🔊</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0e7490' }}>{idm.en}</div>
          </div>
          <div style={{ fontSize: 12, color: '#78716c', marginTop: 4 }}>
            Literally: "{idm.lit}" — {idm.ctx}
          </div>
        </div>
      ))}
    </div>
  );
}
