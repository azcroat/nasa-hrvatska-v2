import React, { useState, useRef } from 'react';
import { H, Bar, sh, NUMTIME } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext';

export default function NumTime({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  type NTQuestion = { q: string; a: string; al: string[] };
  const finishFired = useRef(false);
  const initialData = useState<[NTQuestion[], string[]]>(() => {
    const q = sh([...NUMTIME.numbers, ...NUMTIME.time]).slice(0, 10) as NTQuestion[];
    return [q, sh([q[0]!.a].concat(q[0]!.al))];
  })[0];
  const ntQ = initialData[0];
  const [ntI, sNtI] = useState(0);
  const [ntS, sNtS] = useState(0);
  const [ntA, sNtA] = useState(false);
  const [ntSl, sNtSl] = useState(-1);
  const [ntO, sNtO] = useState(initialData[1]);

  const total = ntQ.length;

  if (!ntQ[ntI]) {
    return (
      <div className="scr-wrap">
        {H('🔢 Numbers & Time', 'Practice numbers, time, and currency in Croatian', goBack)}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>{ntS >= total * 0.7 ? '🏆' : '👍'}</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#164e63' }}>
            Numbers Complete!
          </h2>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0e7490' }}>
            {ntS} / {total}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '8px 0 16px' }}>
            +{ntS * 3 + 10} XP
          </div>
          <button
            className="b bp"
            style={{ marginTop: 0 }}
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              if (typeof award === 'function') award(ntS * 3 + 10, false, 'grammar');
              markQuest('grammar');
              if (!stats.vs?.includes('numtime')) {
                setStats((prev) => {
                  if (prev.vs?.includes('numtime')) return prev;
                  return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'numtime'] };
                });
                if (writeDelta) writeDelta({ gc: 1, vs: ['numtime'] });
              }
              goBack();
            }}
          >
            Finish!
          </button>
        </div>
      </div>
    );
  }

  const q = ntQ[ntI]!;
  const ci = ntO.indexOf(q.a);

  return (
    <div className="scr-wrap">
      {H('🔢 Numbers & Time', 'Practice numbers, time, and currency in Croatian', goBack)}
      <React.Fragment>
        <Bar v={ntI + 1} mx={total} h={6} />
        <div className="c" style={{ marginTop: 16 }}>
          <p style={{ fontSize: 18, fontWeight: 700 }}>{q.q}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {ntO.map((o, oi) => (
            <button
              key={oi}
              className={'ob ' + (ntA ? (oi === ci ? 'ok' : ntSl === oi ? 'no' : '') : '')}
              onClick={() => {
                if (!ntA) {
                  sNtSl(oi);
                  sNtA(true);
                  if (oi === ci) sNtS((s) => s + 1);
                }
              }}
            >
              {o}
            </button>
          ))}
        </div>
        {ntA && (
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => {
              if (ntI < total - 1) {
                const n = ntQ[ntI + 1]!;
                sNtO(sh([n.a].concat(n.al)));
                sNtI((i) => i + 1);
                sNtA(false);
                sNtSl(-1);
              } else {
                sNtI(total);
              }
            }}
          >
            {ntI < total - 1 ? 'Next →' : 'See Results'}
          </button>
        )}
      </React.Fragment>
    </div>
  );
}
