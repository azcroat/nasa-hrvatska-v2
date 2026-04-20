// @ts-nocheck
import React, { useState } from 'react';
import { H, speak } from '../../data';
import { EVENTS } from '../../data';

function EventsCalendar({ goBack }) {
  const [evM, sEvM] = useState(new Date().getMonth() + 1 || 1);
  return (
    <div className="scr-wrap">
      {H('📅 Croatian Events & Holidays', 'Traditional celebrations throughout the year')}
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

export default EventsCalendar;
