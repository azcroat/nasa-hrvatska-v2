import React from 'react';
import { H } from '../../data';
import { GENDER_COLOR, GENDER_BG, GENDER_LABEL, CT_STYLES } from './CaseTransformerData.js';

interface Noun {
  hr: string;
  en: string;
  gender: string;
  type?: string;
  irregular?: boolean;
}
interface Props {
  goBack: () => void;
  filteredNouns: Noun[];
  search: string;
  setSearch: (s: string) => void;
  genderFilter: string;
  setGenderFilter: (g: string) => void;
  onPickNoun: (n: Noun) => void;
}

export default function CaseTransformerPicker({
  goBack,
  filteredNouns,
  search,
  setSearch,
  genderFilter,
  setGenderFilter,
  onPickNoun,
}: Props) {
  return (
    <div className="scr-wrap">
      <style>{CT_STYLES}</style>

      {H(
        '📐 Case Transformer',
        'See any Croatian noun in all 7 cases — singular and plural',
        goBack,
      )}

      {/* Search bar */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search nouns in Croatian or English…"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid var(--card-b)',
            background: 'var(--card)',
            color: 'var(--heading)',
            fontSize: 'var(--text-base)',
            fontFamily: "'Outfit', sans-serif",
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Gender filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'm', 'f', 'n'].map((g) => (
          <button
            key={g}
            className={'ct-pill' + (genderFilter === g ? ' active' : '')}
            onClick={() => setGenderFilter(g)}
          >
            {g === 'all' ? 'All' : g === 'm' ? 'Masculine' : g === 'f' ? 'Feminine' : 'Neuter'}
          </button>
        ))}
      </div>

      {/* Noun grid */}
      {filteredNouns.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--subtext)',
            padding: '40px 0',
            fontSize: 'var(--text-base)',
          }}
        >
          No nouns match your search.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
          }}
        >
          {filteredNouns.map((noun) => (
            <button key={noun.hr} className="ct-noun-card" onClick={() => onPickNoun(noun)}>
              <div
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 800,
                  color: 'var(--heading)',
                  fontFamily: "'Outfit', sans-serif",
                  marginBottom: 3,
                }}
              >
                {noun.hr}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--subtext)',
                  marginBottom: 6,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {noun.en}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <span
                  className="ct-badge"
                  style={{
                    background: (GENDER_BG as Record<string, string>)[noun.gender],
                    color: (GENDER_COLOR as Record<string, string>)[noun.gender],
                  }}
                >
                  {(GENDER_LABEL as Record<string, string>)[noun.gender]}
                </span>
                {noun.irregular && (
                  <span className="ct-badge" style={{ background: '#fef9c3', color: '#854d0e' }}>
                    irreg
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
