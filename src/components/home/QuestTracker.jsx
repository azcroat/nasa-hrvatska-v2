import React from 'react';
import { DAILY_QUESTS } from '../../data.jsx';

// Maps tier-1 quest IDs to their tier-2 upgrade
const TIER2_MAP_LOCAL = {
  speak: 'speak2', grammar: 'grammar2', master: 'master2',
  reading: 'reading2', culture: 'culture2', vocab: 'vocab2',
};

// All bg values are hardcoded hex — no CSS variable references — so dark-mode
// overrides (e.g. --lavender → #a78bfa, --warning-dark → #fbbf24) cannot flip
// these to low-contrast colours and cause WCAG AA failures in CI or dark mode.
const QUEST_COLORS = {
  speak:        { bg:'#7c3aed', text:'#fff',     shadow:'rgba(124,58,237,.35)',  border:'rgba(124,58,237,.22)' },
  speak2:       { bg:'#7c3aed', text:'#fff',     shadow:'rgba(124,58,237,.35)',  border:'rgba(124,58,237,.22)' },
  grammar:      { bg:'#92400e', text:'#fff',     shadow:'rgba(146,64,14,.35)',   border:'rgba(146,64,14,.22)'  },
  grammar2:     { bg:'#92400e', text:'#fff',     shadow:'rgba(146,64,14,.35)',   border:'rgba(146,64,14,.22)'  },
  master:       { bg:'#0e7490', text:'#fff',     shadow:'rgba(14,116,144,.35)',  border:'rgba(14,116,144,.22)' },
  master2:      { bg:'#0e7490', text:'#fff',     shadow:'rgba(14,116,144,.35)',  border:'rgba(14,116,144,.22)' },
  reading:      { bg:'#14532d', text:'#fff',     shadow:'rgba(20,83,45,.35)',    border:'rgba(20,83,45,.22)'   },
  reading2:     { bg:'#14532d', text:'#fff',     shadow:'rgba(20,83,45,.35)',    border:'rgba(20,83,45,.22)'   },
  culture:      { bg:'#c2410c', text:'#fff',     shadow:'rgba(194,65,12,.35)',   border:'rgba(194,65,12,.22)'  },
  culture2:     { bg:'#c2410c', text:'#fff',     shadow:'rgba(194,65,12,.35)',   border:'rgba(194,65,12,.22)'  },
  vocab:        { bg:'#075985', text:'#fff',     shadow:'rgba(7,89,133,.35)',    border:'rgba(7,89,133,.22)'   },
  vocab2:       { bg:'#075985', text:'#fff',     shadow:'rgba(7,89,133,.35)',    border:'rgba(7,89,133,.22)'   },
  write:        { bg:'#7c3aed', text:'#fff',     shadow:'rgba(124,58,237,.35)',  border:'rgba(124,58,237,.22)' },
  streak:       { bg:'#c2410c', text:'#fff',     shadow:'rgba(194,65,12,.35)',   border:'rgba(194,65,12,.22)'  },
  streak_alive: { bg:'#c2410c', text:'#fff',     shadow:'rgba(194,65,12,.35)',   border:'rgba(194,65,12,.22)'  },
  perfect:      { bg:'#78350f', text:'#fff',     shadow:'rgba(120,53,15,.35)',   border:'rgba(120,53,15,.22)'  },
};

const QUEST_SCREEN_MAP = {
  speak:'speaking',    speak2:'speaking',
  grammar:'grammar',   grammar2:'grammar',
  master:'review',     master2:'review',
  reading:'readlist',  reading2:'readlist',
  culture:'texting',   culture2:'texting',
  vocab:'learnpath',   vocab2:'learnpath',
  write:'writing',
  streak:'learnpath',  streak_alive:'learnpath',
  perfect:'flashcards',
};

/**
 * Build the visible quest list using tier-progression logic:
 * - For each paired quest (tier-1 + tier-2), show:
 *     - tier-2 card (as an "upgrade" challenge) when tier-1 is complete
 *     - tier-1 card when tier-1 is not yet complete
 * - Unpaired quests (write, streak, streak_alive, perfect) always show
 * This keeps the grid compact (max 10 cards) and reveals rewards naturally.
 */
function buildVisibleQuests(questsDone) {
  const shown = [];
  const handled = new Set();

  for (const q of DAILY_QUESTS) {
    if (handled.has(q.id)) continue;

    const tier2Id = TIER2_MAP_LOCAL[q.id];

    if (q.tier === 1 && tier2Id) {
      // Paired quest: show tier-2 when tier-1 done, else show tier-1
      const tier1Done = questsDone[q.id];
      const tier2Quest = DAILY_QUESTS.find(x => x.id === tier2Id);

      if (tier1Done && tier2Quest) {
        shown.push({ ...tier2Quest, _unlocked: true });
      } else {
        shown.push({ ...q, _hasUpgrade: !!tier2Quest, _upgradeName: tier2Quest?.name });
      }
      handled.add(q.id);
      if (tier2Id) handled.add(tier2Id);
    } else if (q.tier === 2 && Object.values(TIER2_MAP_LOCAL).includes(q.id)) {
      // Already handled above as part of a pair — skip
    } else {
      // Standalone quest — always show
      shown.push(q);
      handled.add(q.id);
    }
  }

  return shown;
}

export default function QuestTracker({ questsDone, allQuestsDone, onQuestStart }) {
  const visibleQuests = buildVisibleQuests(questsDone);
  const questsDoneCount = visibleQuests.filter(q => questsDone[q.id]).length;
  const total = visibleQuests.length;
  const pct = total > 0 ? Math.round((questsDoneCount / total) * 100) : 0;

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Gradient header ── */}
      <div style={{
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(124,58,237,.2), var(--card-shadow)',
        border: '1.5px solid rgba(124,58,237,.22)',
        marginBottom: 12,
      }}>
        <div style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 55%, var(--lavender,#7c3aed) 100%)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              {allQuestsDone ? '🏆' : '🎯'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2, fontFamily: 'var(--font-sans)' }}>
                EARN BONUS XP
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-sans)' }}>Daily Quests</div>
            </div>
            <div style={{
              flexShrink: 0, background: 'rgba(255,255,255,.15)',
              border: '1.5px solid rgba(255,255,255,.25)',
              borderRadius: 10, padding: '4px 10px',
              fontSize: 12, fontWeight: 800, color: '#fff',
            }}>
              {questsDoneCount}/{total}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', fontFamily: 'var(--font-sans)' }}>
                {allQuestsDone ? 'All quests complete!' : `${total - questsDoneCount} quest${total - questsDoneCount !== 1 ? 's' : ''} remaining`}
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, color: allQuestsDone ? '#e9d5ff' : 'rgba(255,255,255,.85)', fontFamily: 'var(--font-sans)' }}>
                {pct}%
              </span>
            </div>
            <div className="prog-track" style={{ background: 'rgba(255,255,255,.18)' }}>
              <div className="prog-fill" style={{
                width: pct + '%',
                background: allQuestsDone
                  ? 'linear-gradient(90deg,#c4b5fd,#e9d5ff)'
                  : 'linear-gradient(90deg,rgba(255,255,255,.7),rgba(255,255,255,.9))',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quest cards grid ── */}
      <div className="anim-children-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {visibleQuests.map(q => {
          const done = questsDone[q.id];
          const qc = QUEST_COLORS[q.id] || QUEST_COLORS.master;
          const isUpgraded = q._unlocked; // tier-2 shown because tier-1 was completed

          return (
            <div key={q.id} style={{
              background: done
                ? 'linear-gradient(135deg, var(--success-bg) 0%, #dcfce7 100%)'
                : isUpgraded
                  ? `linear-gradient(135deg, ${qc.border.replace('rgba(', 'rgba(').replace(', .22)', ', .08)')}, var(--card))`
                  : 'var(--card)',
              border: `1.5px solid ${done ? 'var(--success-b)' : isUpgraded ? qc.border.replace('.22', '.4') : qc.border}`,
              borderRadius: 'var(--radius-lg)', padding: '14px 12px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: done ? 'none' : `0 2px 12px ${qc.shadow.replace('.35', '.10')}, var(--card-shadow)`,
              transition: 'transform .15s ease, box-shadow .15s ease',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!done) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${qc.shadow.replace('.35','.2')}, var(--card-shadow-hover)`; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = done ? 'none' : `0 2px 12px ${qc.shadow.replace('.35','.10')}, var(--card-shadow)`; }}
            >
              {/* Upgrade badge — visible when tier-2 is shown */}
              {isUpgraded && !done && (
                <div style={{
                  position: 'absolute', top: -6, right: 8,
                  background: qc.bg, color: qc.text,
                  fontSize: 9, fontWeight: 900, padding: '2px 6px',
                  borderRadius: 8, letterSpacing: '.04em',
                  boxShadow: `0 2px 8px ${qc.shadow}`,
                  lineHeight: 1.4,
                }}>⬆ BONUS</div>
              )}

              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)', marginBottom: 8,
                background: done ? 'var(--success)' : qc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                boxShadow: done ? '0 2px 8px rgba(22,163,74,.3)' : `0 4px 16px ${qc.shadow}`,
                transition: 'transform .15s ease',
              }}>
                {done ? '✓' : q.icon}
              </div>

              <div style={{ fontSize: 12, fontWeight: 900, color: done ? 'var(--success)' : 'var(--heading)', lineHeight: 1.2, marginBottom: 3, fontFamily: 'var(--font-sans)' }}>
                {q.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500, marginBottom: 8, lineHeight: 1.35, fontFamily: 'var(--font-sans)' }}>
                {q.desc}
              </div>

              {done ? (
                <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 800, fontFamily: 'var(--font-sans)' }}>
                  +{q.xp} XP earned ✓
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onQuestStart(q.id, QUEST_SCREEN_MAP[q.id] || 'learnpath')}
                    style={{
                      marginTop: 'auto', fontSize: 11, fontWeight: 800,
                      color: qc.text, background: qc.bg, border: 'none',
                      borderRadius: 'var(--radius-sm)', padding: '7px 16px', cursor: 'pointer',
                      lineHeight: 1.4, boxShadow: `0 3px 12px ${qc.shadow}`,
                      fontFamily: 'var(--font-sans)',
                      transition: 'transform .12s ease, box-shadow .12s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 5px 16px ${qc.shadow}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 3px 12px ${qc.shadow}`; }}
                    onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
                    onPointerUp={e => { e.currentTarget.style.transform = ''; }}
                  >Start →</button>
                  <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 5, fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
                    +{q.xp} XP
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Daily Mastery banner ── */}
      {allQuestsDone && (
        <div style={{
          marginTop: 12, borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(124,58,237,.28), 0 2px 8px rgba(0,0,0,.08)',
          border: '1.5px solid rgba(196,181,253,.4)',
          animation: 'rise .4s ease',
        }}>
          <div style={{ background: 'linear-gradient(135deg, #3b0764 0%, #6d28d9 55%, var(--lavender,#7c3aed) 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: 'rgba(255,255,255,.18)', border: '1.5px solid rgba(255,255,255,.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              boxShadow: '0 4px 12px rgba(0,0,0,.18)',
            }}>🏆</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 3, fontFamily: 'var(--font-sans)' }}>Daily Mastery!</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.82)', fontWeight: 600, fontFamily: 'var(--font-sans)' }}>+50 XP bonus · All {total} quests complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
