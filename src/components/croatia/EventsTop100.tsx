// @ts-nocheck
import React, { useState } from 'react';
import { H, speak } from '../../data';
import { EVENTS, TOP100 } from '../../data';

export function EventsCalendar({ goBack }) {
  const [evM, sEvM] = useState(new Date().getMonth() + 1 || 1);
  return (
    <div className="scr-wrap">
      {H('📅 Croatian Events & Holidays', 'Traditional celebrations throughout the year', goBack)}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (m) {
          return (
            <button
              key={m}
              className={'b ' + (evM === m ? 'bp' : 'bg')}
              style={{ fontSize: 12, padding: '6px 10px' }}
              onClick={function () {
                sEvM(m);
              }}
            >
              {
                [
                  'Sij',
                  'Velj',
                  'Ožu',
                  'Tra',
                  'Svi',
                  'Lip',
                  'Srp',
                  'Kol',
                  'Ruj',
                  'Lis',
                  'Stu',
                  'Pro',
                ][m - 1]
              }
            </button>
          );
        })}
      </div>
      {EVENTS.filter(function (e) {
        return e.month === evM || e.month === 0;
      }).map(function (e, i) {
        return (
          <div key={i} className="c" style={{ marginBottom: 12, borderLeft: '4px solid #0e7490' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <button
                aria-label={`Play audio for ${e.name}`}
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'var(--heading)',
                  fontFamily: "'Playfair Display',serif",
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                }}
                onClick={function () {
                  speak(e.name);
                }}
              >
                {e.name} <span aria-hidden="true">🔊</span>
              </button>
              {e.day > 0 && (
                <div style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>
                  {e.day}
                  {'. '}
                  {
                    [
                      '',
                      'siječnja',
                      'veljače',
                      'ožujka',
                      'travnja',
                      'svibnja',
                      'lipnja',
                      'srpnja',
                      'kolovoza',
                      'rujna',
                      'listopada',
                      'studenog',
                      'prosinca',
                    ][evM]
                  }
                </div>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#0e7490', fontWeight: 600, marginBottom: 6 }}>
              {e.en}
            </div>
            <div style={{ fontSize: 13, color: '#44403c', lineHeight: 1.6 }}>{e.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Top100Screen({ goBack }) {
  const [t1k, sT1k] = useState(null);
  return (
    <div className="scr-wrap">
      {H('💯 Top 100 Words', 'Essential words for real-world situations', goBack)}
      {!t1k ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.keys(TOP100).map(function (k) {
            return (
              <button
                key={k}
                className="tc"
                style={{ textAlign: 'center' }}
                onClick={function () {
                  sT1k(k);
                }}
              >
                <div style={{ fontSize: 28 }}>
                  {k.includes('Airport')
                    ? '✈️'
                    : k.includes('Restaurant')
                      ? '🍽️'
                      : k.includes('Doctor')
                        ? '🏥'
                        : k.includes('Beach')
                          ? '🏖️'
                          : k.includes('Market')
                            ? '🛒'
                            : k.includes('Meeting')
                              ? '🤝'
                              : k.includes('Emergency')
                                ? '🚨'
                                : '📋'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>{k}</div>
              </button>
            );
          })}
        </div>
      ) : (
        <React.Fragment>
          <button
            className="b bg"
            style={{ marginBottom: 16 }}
            onClick={function () {
              sT1k(null);
            }}
          >
            ← All Categories
          </button>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#164e63', marginBottom: 16 }}>
            {t1k}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TOP100[t1k].map(function (w, i) {
              return (
                <button
                  key={i}
                  aria-label={`Play audio for ${w[0]}`}
                  className="c"
                  style={{ padding: '10px 14px' }}
                  onClick={function () {
                    speak(w[0]);
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490' }}>
                    {w[0]} <span aria-hidden="true">🔊</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{w[1]}</div>
                </button>
              );
            })}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
