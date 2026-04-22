import React from 'react';
import { speak } from '../../lib/audio.js';
import {
  CASE_INFO,
  GENDER_COLOR,
  GENDER_BG,
  GENDER_LABEL,
  CT_STYLES,
} from './CaseTransformerData.js';

interface Noun {
  hr: string;
  en: string;
  gender: string;
  type?: string;
  irregular?: boolean;
}
interface DeclinedForms {
  sg: string[];
  pl: string[];
  [key: string]: string[];
}
interface Props {
  selectedNoun: Noun;
  declined: DeclinedForms;
  number: string;
  setNumber: (n: string) => void;
  onBackToPicker: () => void;
  onStartQuiz: () => void;
}

export default function CaseTransformerDeclension({
  selectedNoun,
  declined,
  number,
  setNumber,
  onBackToPicker,
  onStartQuiz,
}: Props) {
  const forms = declined[number] ?? []; // array of 7 forms

  return (
    <div className="scr-wrap">
      <style>{CT_STYLES}</style>

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={onBackToPicker}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--subtext)',
            fontFamily: "'Outfit', sans-serif",
            padding: '4px 0',
            whiteSpace: 'nowrap',
          }}
        >
          ← All nouns
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 800,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {selectedNoun.hr}
          </span>
          <span
            className="ct-badge"
            style={{
              background: (GENDER_BG as Record<string, string>)[selectedNoun.gender],
              color: (GENDER_COLOR as Record<string, string>)[selectedNoun.gender],
            }}
          >
            {(GENDER_LABEL as Record<string, string>)[selectedNoun.gender]}
          </span>
          {selectedNoun.irregular && (
            <span className="ct-badge" style={{ background: '#fef9c3', color: '#854d0e' }}>
              irreg
            </span>
          )}
          <span className="ct-badge" style={{ background: '#f3e8ff', color: '#6b21a8' }}>
            B1
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--subtext)',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            "{selectedNoun.en}"
          </span>
        </div>

        <button
          className="ct-speak-btn"
          onClick={() => speak((declined.sg[0] ?? '').replace('!', ''))}
          aria-label="Listen to pronunciation"
        >
          <span aria-hidden="true">🔊</span>
        </button>
      </div>

      {/* Singular / Plural toggle */}
      <div
        style={{
          display: 'flex',
          background: 'var(--bar-bg)',
          borderRadius: 999,
          padding: 3,
          marginBottom: 20,
          gap: 0,
        }}
      >
        {[['sg', 'Singular'] as [string, string], ['pl', 'Plural'] as [string, string]].map(
          ([val, label]) => (
            <button
              key={val}
              className="ct-toggle-pill"
              style={{
                background: number === val ? '#0e7490' : 'transparent',
                color: number === val ? '#fff' : 'var(--subtext)',
              }}
              onClick={() => setNumber(val)}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {/* 7 case cards */}
      {CASE_INFO.map((ci, i) => {
        const rawForm = forms[i] ?? '';
        const form = rawForm.replace('!', '');
        const exampleText = ci.example.replace('[WORD]', form);
        const parts = exampleText.split(form);

        return (
          <div
            key={ci.abbr}
            className="ct-case-card"
            style={{
              borderLeft: `4px solid ${ci.color}`,
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Row 1: abbr + case name + question */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                flexWrap: 'wrap',
              }}
            >
              <span className="ct-badge" style={{ background: ci.color, color: '#fff' }}>
                {ci.abbr}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 800,
                  color: 'var(--heading)',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {ci.name}
              </span>
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--subtext)',
                  fontFamily: "'Outfit', sans-serif",
                  marginLeft: 'auto',
                }}
              >
                {ci.question}
              </span>
            </div>

            {/* Row 2: declined form + speak */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                paddingBottom: 10,
                borderBottom: `1px solid ${ci.bg}`,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xl)',
                  fontWeight: 800,
                  color: ci.color,
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '-.01em',
                }}
              >
                {form}
              </span>
              <button
                className="ct-speak-btn"
                onClick={() => speak(form)}
                aria-label={`Listen to ${form}`}
              >
                <span aria-hidden="true">🔊</span>
              </button>
            </div>

            {/* Row 3: use + example */}
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--subtext)',
                fontFamily: "'Outfit', sans-serif",
                marginBottom: 5,
              }}
            >
              {ci.use}
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                fontStyle: 'italic',
                color: 'var(--subtext)',
                fontFamily: "'Outfit', sans-serif",
                lineHeight: 1.5,
              }}
            >
              {parts.length > 1 ? (
                <>
                  {parts[0]}
                  <strong style={{ color: ci.color, fontStyle: 'normal' }}>{form}</strong>
                  {parts.slice(1).join(form)}
                </>
              ) : (
                exampleText
              )}
            </div>
          </div>
        );
      })}

      {/* Quiz Me button */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          className="b bp"
          style={{ fontSize: 15, padding: '12px 28px' }}
          onClick={onStartQuiz}
        >
          🎯 Quiz Me On This
        </button>
        <div
          style={{
            marginTop: 8,
            fontSize: 'var(--text-xs)',
            color: 'var(--subtext)',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          7 questions • Earn +10 XP on completion
        </div>
      </div>
    </div>
  );
}
