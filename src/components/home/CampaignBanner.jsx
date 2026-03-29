import React from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function CampaignBanner({ activeCampaign, campaignDismissed, setCampaignDismissed, campaignQuestsDone, setTab }) {
  const { setScr } = useApp();

  if (!activeCampaign || campaignDismissed || localStorage.getItem('nh_campaign_dismissed_' + activeCampaign.id) === '1') {
    return null;
  }

  const allCampaignDone = activeCampaign.quests?.every(q => campaignQuestsDone[q.id]);
  const earnedXP = activeCampaign.quests?.filter(q => campaignQuestsDone[q.id]).reduce((s, q) => s + q.xp, 0) ?? 0;
  const totalXP = activeCampaign.quests?.reduce((s, q) => s + q.xp, 0) ?? 0;

  return (
    <div style={{
      background: activeCampaign.bg, border: `1.5px solid ${activeCampaign.border}`,
      borderRadius:16, padding:'14px 16px', marginBottom:16,
      display:'flex', alignItems:'flex-start', gap:12, animation:'rise .4s',
    }}>
      <span style={{fontSize:26, flexShrink:0}}>{activeCampaign.icon}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:13, fontWeight:900, color: activeCampaign.color, marginBottom:2}}>{activeCampaign.name}</div>
        <div style={{fontSize:11, color:'var(--subtext)', fontWeight:500, lineHeight:1.5, marginBottom:6}}>{activeCampaign.blurb}</div>
        <div style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:4}}>
          <div style={{display:'inline-flex', alignItems:'center', gap:4, background: activeCampaign.color, color:'#fff', borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:800}}>
            🚀 {activeCampaign.multiplier}x XP this season!
          </div>
          <button
            onClick={() => setTab && setTab(activeCampaign.id)}
            style={{
              background: activeCampaign.color, color: '#fff',
              border: 'none', borderRadius: 8, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', marginLeft: 8
            }}
          >
            Start →
          </button>
        </div>
        {activeCampaign.quests && activeCampaign.quests.length > 0 && (
          <div style={{marginTop:10}}>
            {allCampaignDone ? (
              <div style={{fontSize:12, fontWeight:800, color: activeCampaign.color}}>
                🏆 Campaign complete! All quests done.
              </div>
            ) : (
              <>
                <div style={{fontSize:10, fontWeight:800, color: activeCampaign.color, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4}}>
                  Quests
                </div>
                {activeCampaign.quests.map(q => {
                  const done = campaignQuestsDone[q.id];
                  return (
                    <div
                      key={q.id}
                      onClick={() => !done && (setScr ? setScr(q.screen) : setTab && setTab(q.screen))}
                      style={{display:'flex', alignItems:'center', gap:8, padding:'4px 0', cursor: done ? 'default' : 'pointer'}}
                    >
                      <span style={{fontSize:14, color: done ? activeCampaign.color : 'var(--subtext)', flexShrink:0}}>
                        {done ? '✓' : '○'}
                      </span>
                      <span style={{
                        fontSize:11, fontWeight:500, flex:1,
                        color: done ? activeCampaign.color : 'var(--rt-c)',
                        opacity: done ? 1 : 0.85,
                        textDecoration: done ? 'line-through' : 'none',
                      }}>
                        {q.label}
                      </span>
                      <span style={{
                        fontSize:10, fontWeight:800,
                        background: done ? activeCampaign.color : 'var(--bar-bg)',
                        color: done ? '#fff' : 'var(--subtext)',
                        borderRadius:6, padding:'2px 6px', flexShrink:0,
                      }}>
                        +{q.xp} XP
                      </span>
                    </div>
                  );
                })}
                <div style={{fontSize:10, fontWeight:700, color:'var(--subtext)', marginTop:6}}>
                  Campaign XP: {earnedXP} / {totalXP}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => { setCampaignDismissed(true); localStorage.setItem('nh_campaign_dismissed_'+activeCampaign.id,'1'); }}
        style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--subtext)',padding:4,flexShrink:0}}
        aria-label="Dismiss campaign"
      >×</button>
    </div>
  );
}
