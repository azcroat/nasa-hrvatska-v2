// @ts-nocheck
import React from 'react';
import CroatianKnight from '../shared/CroatianKnight';

export default function WelcomeBackBanners({ comebackBonus, longAbsence }) {
  return (
    <>
      {comebackBonus && (
        <div style={{
          background:'var(--warning-bg)',
          border:'1.5px solid var(--warning-b)',
          borderRadius:16, padding:'16px 18px', marginBottom:16,
          display:'flex', alignItems:'center', gap:14,
          boxShadow:'0 4px 16px rgba(245,158,11,.2)',
          animation:'rise .5s',
        }}>
          <span style={{fontSize:32}}>🎉</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:900,color:'var(--warning)'}}>Dobrodošli natrag! Welcome back!</div>
            <div style={{fontSize:12,color:'var(--warning)',marginTop:2,fontWeight:600,opacity:.85}}>
              You've been away — pick up where you left off. +50 bonus XP on your first lesson today!
            </div>
          </div>
        </div>
      )}

      {longAbsence && !comebackBonus && (
        <div style={{
          background: 'linear-gradient(135deg, var(--lavender, #7c3aed), #4f46e5)',
          borderRadius: 16, padding: '14px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{fontSize: 26}}>🌟</span>
          <div style={{flex: 1}}>
            <CroatianKnight size={60} mood="thinking" style={{float:'right', marginLeft:12}} />
            <div style={{fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 2}}>
              Great to have you back!
            </div>
            <div style={{fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.5}}>
              Let's pick up right where you left off. Your Croatian is still here waiting for you.
            </div>
            <div style={{marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic'}}>
              Your streak is waiting to be rebuilt. One lesson is all it takes. 💪
            </div>
          </div>
        </div>
      )}

    </>
  );
}
