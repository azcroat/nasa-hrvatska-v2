import React, { useState } from 'react';

export default function ProfileTab({ name, au, level, st, favs, darkMode, setDarkMode, setScr, doOut }) {
  const [confirmOut, setConfirmOut] = useState(false);
  return (
    <React.Fragment>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#0e7490,#164e63)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:"#fff",fontSize:32,fontWeight:800}}>
          {name ? name.charAt(0).toUpperCase() : "👤"}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"var(--heading)"}}>{name || au?.d}</h2>
        <p style={{color:"var(--subtext)",fontSize:14}}>Level {level} • {st.xp} XP</p>
        {au?.e && <p style={{color:"var(--subtext)",fontSize:12}}>{au.e}</p>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:24}}>
        {[["⭐",st.xp,"XP"],["📚",st.lc,"Lessons"],["📝",st.gc,"Grammar"]].map((s,idx) => (
          <div key={idx} className="c" style={{textAlign:"center"}}>
            <div style={{fontSize:24}}>{s[0]}</div>
            <div style={{fontSize:20,fontWeight:800,marginTop:4}}>{s[1]}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{s[2]}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <div className="tc" style={{textAlign:"center",padding:"16px"}} onClick={() => setScr("badges")}>
          <div style={{fontSize:32}}>🏆</div>
          <div style={{fontSize:14,fontWeight:700,marginTop:4}}>Badges & Awards</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"16px"}} onClick={() => setScr("leaderboard")}>
          <div style={{fontSize:32}}>👨‍👩‍👧‍👦</div>
          <div style={{fontSize:14,fontWeight:700,marginTop:4}}>Family Leaderboard</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <div className="tc" style={{textAlign:"center",padding:"16px"}} onClick={() => setScr("favorites")}>
          <div style={{fontSize:32}}>⭐</div>
          <div style={{fontSize:14,fontWeight:700,marginTop:4}}>Favorites ({favs.length})</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"16px"}} onClick={() => setScr("journal")}>
          <div style={{fontSize:32}}>📓</div>
          <div style={{fontSize:14,fontWeight:700,marginTop:4}}>My Vocabulary</div>
        </div>
        <div className="tc" style={{textAlign:"center",padding:"16px"}} onClick={() => { const nv = !darkMode; setDarkMode(nv); localStorage.setItem("darkMode", nv.toString()); }}>
          <div style={{fontSize:32}}>{darkMode ? "☀️" : "🌙"}</div>
          <div style={{fontSize:14,fontWeight:700,marginTop:4}}>{darkMode ? "Light Mode" : "Dark Mode"}</div>
        </div>
      </div>
      {confirmOut ? (
        <div style={{border:"2px solid rgba(194,65,12,.2)",borderRadius:14,padding:"16px",marginTop:16,background:"rgba(194,65,12,.04)"}}>
          <p style={{fontSize:14,fontWeight:700,color:"#c2410c",textAlign:"center",marginBottom:12}}>Sign out of Naša Hrvatska?</p>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setConfirmOut(false)} style={{flex:1,padding:"12px",border:"1.5px solid var(--card-b)",borderRadius:12,background:"var(--card)",color:"var(--subtext)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Cancel
            </button>
            <button onClick={doOut} style={{flex:1,padding:"12px",border:"none",borderRadius:12,background:"#c2410c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setConfirmOut(true)} style={{width:"100%",padding:"14px",border:"2px solid rgba(194,65,12,.15)",borderRadius:14,background:"rgba(194,65,12,.05)",color:"#c2410c",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16,fontFamily:"'Outfit',sans-serif"}}>
          🚪 Sign Out
        </button>
      )}
    </React.Fragment>
  );
}
