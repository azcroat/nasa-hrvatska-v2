import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function CampaignBanner({ activeCampaign, campaignDismissed, setCampaignDismissed, campaignQuestsDone, setTab, onQuestTap }) {
  const { setScr } = useApp();

  if (!activeCampaign || campaignDismissed || localStorage.getItem('nh_campaign_dismissed_' + activeCampaign.id) === '1') {
    return null;
  }

  const allCampaignDone = activeCampaign.quests?.every(q => campaignQuestsDone[q.id]);
  const earnedXP = activeCampaign.quests?.filter(q => campaignQuestsDone[q.id]).reduce((s, q) => s + q.xp, 0) ?? 0;
  const totalXP = activeCampaign.quests?.reduce((s, q) => s + q.xp, 0) ?? 0;
  const questCount = activeCampaign.quests?.length ?? 0;
  const doneCount = activeCampaign.quests?.filter(q => campaignQuestsDone[q.id]).length ?? 0;
  const progress = questCount > 0 ? doneCount / questCount : 0;

  // Derive gradient from campaign color (supports hex colors)
  const baseColor = activeCampaign.color || '#16a34a';

  return (
    <div style={{
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 16,
      boxShadow: '0 4px 24px rgba(0,0,0,.12)',
      border: '1px solid rgba(255,255,255,.08)',
      animation: 'rise .4s',
    }}>
      {/* ── Gradient Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${baseColor}dd 0%, ${baseColor} 60%, ${baseColor}bb 100%)`,
        padding: '14px 16px 12px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        {/* Icon blob */}
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: 'rgba(255,255,255,.22)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        }}>
          {activeCampaign.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 9, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.75)',
            }}>
              SEASONAL CAMPAIGN
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '1px 7px',
              background: 'rgba(255,255,255,.25)', borderRadius: 20,
              color: '#fff',
            }}>
              🚀 {activeCampaign.multiplier}x XP
            </span>
          </div>

          {/* Campaign name */}
          <div style={{
            fontSize: 15, fontWeight: 900, color: '#fff',
            lineHeight: 1.2, letterSpacing: '-.01em',
          }}>
            {activeCampaign.name}
          </div>

          {/* Progress bar */}
          {questCount > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{
                height: 5, borderRadius: 4,
                background: 'rgba(255,255,255,.25)',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${progress * 100}%`,
                  background: '#fff',
                  transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.75)', marginTop: 3, fontWeight: 700 }}>
                {doneCount}/{questCount} quests · {earnedXP}/{totalXP} XP
              </div>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => { setCampaignDismissed(true); localStorage.setItem('nh_campaign_dismissed_' + activeCampaign.id, '1'); }}
          style={{
            background: 'rgba(255,255,255,.2)', border: 'none', cursor: 'pointer',
            fontSize: 16, color: '#fff', padding: '4px 8px', borderRadius: 8,
            flexShrink: 0, lineHeight: 1,
          }}
          aria-label="Dismiss campaign"
        >×</button>
      </div>

      {/* ── Card Body ── */}
      <div style={{ background: 'var(--card)', padding: '14px 16px 16px' }}>
        <div style={{
          fontSize: 13, color: 'var(--subtext)', lineHeight: 1.55, marginBottom: 12,
        }}>
          {activeCampaign.blurb}
        </div>

        {/* Quests list */}
        {activeCampaign.quests && activeCampaign.quests.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {allCampaignDone ? (
              <div style={{ fontSize: 13, fontWeight: 800, color: baseColor, textAlign: 'center', padding: '8px 0' }}>
                🏆 Campaign complete! All quests done.
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                  Quests
                </div>
                {activeCampaign.quests.map(q => {
                  const done = campaignQuestsDone[q.id];
                  return (
                    <div
                      key={q.id}
                      onClick={() => !done && (onQuestTap ? onQuestTap(q) : setScr && setScr(q.screen))}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: done ? 'default' : 'pointer' }}
                    >
                      <span style={{ fontSize: 14, color: done ? baseColor : 'var(--subtext)', flexShrink: 0 }}>
                        {done ? '✓' : '○'}
                      </span>
                      <span style={{
                        fontSize: 12, fontWeight: 500, flex: 1,
                        color: done ? baseColor : 'var(--rt-c)',
                        opacity: done ? 1 : 0.85,
                        textDecoration: done ? 'line-through' : 'none',
                      }}>
                        {q.label}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 800,
                        background: done ? baseColor : 'var(--bar-bg)',
                        color: done ? '#fff' : 'var(--subtext)',
                        borderRadius: 6, padding: '2px 7px', flexShrink: 0,
                      }}>
                        +{q.xp} XP
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={() => setScr && setScr(activeCampaign.id)}
          style={{
            width: '100%', padding: '11px 16px',
            background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}cc 100%)`,
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 13, fontWeight: 800, cursor: 'pointer',
            letterSpacing: '.02em',
          }}
        >
          Start Campaign →
        </button>
      </div>
    </div>
  );
}
