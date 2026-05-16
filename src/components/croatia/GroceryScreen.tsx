import React from 'react';
import { H, speak } from '../../data';
import { useContent } from '../../hooks/useContent';

interface GroceryShape {
  stores: Array<{ name: string; desc: string; color: string }>;
  brands: Array<[string, string]>;
  vocab: Array<[string, string]>;
  phrases: Array<[string, string]>;
}

interface GroceryScreenProps {
  goBack: () => void;
}

function LoadingState() {
  return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
}
function ErrorState({ message }: { message: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--info)' }}>{message}</div>;
}

function GroceryScreen({ goBack }: GroceryScreenProps) {
  const { content, loading, error } = useContent();
  if (error) return <ErrorState message="Couldn't load content - please retry." />;
  if (loading || !content) return <LoadingState />;
  const GROCERY = content.GROCERY as unknown as GroceryShape;
  return (
    <div className="scr-wrap">
      {H('🛒 Grocery Shopping', 'Stores, brands & essential vocab', goBack)}
      <h3 className="sh">🏪 Supermarket Chains</h3>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}
      >
        {GROCERY.stores.map(function (s, i) {
          return (
            <div
              key={i}
              className="c"
              style={{ textAlign: 'center', padding: '10px', borderTop: '3px solid ' + s.color }}
            >
              <div style={{ fontSize: 14, fontWeight: 800 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: '#78716c' }}>{s.desc}</div>
            </div>
          );
        })}
      </div>
      <h3 className="sh">⭐ Croatian Brands to Know</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        {GROCERY.brands.map(function (b, i) {
          return (
            <div key={i} className="c" style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#164e63' }}>{b[0]}</div>
              <div style={{ fontSize: 11, color: '#78716c' }}>{b[1]}</div>
            </div>
          );
        })}
      </div>
      <h3 className="sh">📚 Shopping Vocabulary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
        {GROCERY.vocab.map(function (w, i) {
          return (
            <button
              key={i}
              aria-label={`Play audio for ${w[0]}`}
              className="c"
              style={{ padding: '8px 12px' }}
              onClick={function () {
                speak(w[0]!);
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0e7490' }}>
                {w[0]} <span aria-hidden="true">🔊</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--subtext)' }}>{w[1]}</div>
            </button>
          );
        })}
      </div>
      <h3 className="sh">🗣️ At the Store</h3>
      {GROCERY.phrases.map(function (p, i) {
        return (
          <button
            key={i}
            aria-label={`Play audio for ${p[0]}`}
            className="c"
            style={{
              marginBottom: 6,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 14px',
            }}
            onClick={function () {
              speak(p[0]!);
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {p[0]} <span aria-hidden="true">🔊</span>
            </span>
            <span style={{ color: 'var(--subtext)', fontSize: 13 }}>{p[1]}</span>
          </button>
        );
      })}
    </div>
  );
}

export default GroceryScreen;
