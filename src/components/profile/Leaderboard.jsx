import React from 'react';
import { H, fbGetFamilyMembers, fbCreateFamily, fbJoinFamily, fbLeaveFamily } from '../../data.jsx';

export default function Leaderboard({
  goBack, au, name,
  famData, setFamData,
  famMembers, setFamMembers,
  famLoading, setFamLoading,
  famName, setFamName,
  famCode, setFamCode,
  famErr, setFamErr,
  famTab, setFamTab,
}) {
  return (
    <div className="scr-wrap">
      
      {H("🏆 Family Leaderboard","Compete with your family!")}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["main","create","join"].map(t => (
          <button
            key={t}
            className={"b " + (famTab === t ? "bp" : "bg")}
            style={{fontSize:12,padding:"8px 14px"}}
            onClick={() => { setFamTab(t); setFamErr(""); }}>
            {t === "main" ? "🏆 Leaderboard" : t === "create" ? "➕ Create Family" : "🔗 Join Family"}
          </button>
        ))}
      </div>

      {famTab === "main" && (
        <React.Fragment>
          {famData ? (
            <React.Fragment>
              <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b",background:"linear-gradient(135deg,#fffbeb,#fef3c7)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:"#92400e"}}>👨‍👩‍👧‍👦 {famData.name}</div>
                    <div style={{fontSize:12,color:"#78716c",marginBottom:6}}>
                      Code: <span style={{fontWeight:800,color:"#0e7490",letterSpacing:2,fontSize:14}}>{famData.code}</span>
                    </div>
                    <button onClick={async()=>{
                      const link=`https://nasahrvatska.com/?join=${famData.code}`;
                      if(navigator.share){try{await navigator.share({title:'Join my family on Naša Hrvatska 🇭🇷',text:'Click to join and learn Croatian together!',url:link});}catch(_){}}
                      else{await navigator.clipboard.writeText(link);alert('Invite link copied!');}
                    }} style={{background:'linear-gradient(135deg,#0e7490,#164e63)',color:'#fff',border:'none',borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                      🔗 Share Invite Link
                    </button>
                  </div>
                  <div style={{fontSize:11,padding:"3px 8px",background:famData.role === "admin" ? "#dbeafe" : "#e7e5e4",borderRadius:12,color:famData.role === "admin" ? "#1e40af" : "#78716c",fontWeight:600}}>
                    {famData.role}
                  </div>
                </div>
              </div>
              <button
                className="b bp"
                style={{width:"100%",marginBottom:16,fontSize:14}}
                onClick={() => {
                  setFamLoading(true);
                  fbGetFamilyMembers(famData.code).then(m => { setFamMembers(m); setFamLoading(false); });
                }}
                disabled={famLoading}>
                {famLoading ? "Loading..." : "🔄 Refresh Leaderboard"}
              </button>
              {famErr && <div style={{color:"#dc2626",fontSize:13,marginBottom:12}}>{famErr}</div>}
              {famMembers.length > 0 ? famMembers.map((u, i) => (
                <div
                  key={u.email}
                  className="c"
                  style={{display:"flex",alignItems:"center",gap:14,marginBottom:10,borderLeft:i === 0 ? "4px solid #f59e0b" : i === 1 ? "4px solid #9ca3af" : "4px solid #d97706"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:i === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : i === 1 ? "linear-gradient(135deg,#9ca3af,#6b7280)" : "linear-gradient(135deg,#d97706,#92400e)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:20}}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16,fontWeight:700}}>{u.name}{u.role === "admin" ? " 👑" : ""}</div>
                    <div style={{fontSize:12,color:"#78716c"}}>{u.lc} lessons · Joined {new Date(u.joined).toLocaleDateString()}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:800,color:"#b45309"}}>{u.xp}</div>
                    <div style={{fontSize:11,color:"#78716c"}}>XP</div>
                  </div>
                </div>
              )) : (
                <div className="c" style={{textAlign:"center",color:"#78716c"}}>
                  Tap 'Refresh Leaderboard' to load family scores.
                </div>
              )}
              <button
                style={{marginTop:20,width:"100%",padding:"12px",border:"2px solid rgba(220,38,38,.15)",borderRadius:14,background:"rgba(220,38,38,.03)",color:"#dc2626",fontSize:13,fontWeight:600,cursor:"pointer"}}
                onClick={() => {
                  if (confirm("Leave this family group? You can rejoin with the code later.")) {
                    fbLeaveFamily(famData.code, au.e).then(() => { setFamData(null); setFamMembers([]); localStorage.removeItem("uFamily"); });
                  }
                }}>
                🚪 Leave Family
              </button>
            </React.Fragment>
          ) : (
            <div className="c" style={{textAlign:"center",padding:"32px 20px"}}>
              <div style={{fontSize:48,marginBottom:12}}>👨‍👩‍👧‍👦</div>
              <h3 style={{color:"#164e63",marginBottom:8}}>No Family Group Yet</h3>
              <p style={{color:"#78716c",fontSize:14,marginBottom:16}}>
                Create a family group and share the code with your family members. Everyone who joins can see each other's progress and compete for the top spot!
              </p>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button className="b bp" onClick={() => setFamTab("create")}>➕ Create Family</button>
                <button className="b bg" onClick={() => setFamTab("join")}>🔗 Join Family</button>
              </div>
            </div>
          )}
        </React.Fragment>
      )}

      {famTab === "create" && (
        <div className="c" style={{padding:24}}>
          <div style={{fontSize:14,color:"#44403c",marginBottom:16}}>
            Create a family group. You'll get a 6-character code to share with your family members.
          </div>
          {famErr && (
            <div style={{background:famErr.startsWith("✅") ? "rgba(22,163,74,.08)" : "rgba(220,38,38,.08)",border:"1px solid",borderColor:famErr.startsWith("✅") ? "rgba(22,163,74,.2)" : "rgba(220,38,38,.2)",borderRadius:10,padding:"12px 16px",color:famErr.startsWith("✅") ? "#16a34a" : "#dc2626",fontSize:14,fontWeight:600,marginBottom:16}}>
              {famErr}
            </div>
          )}
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>FAMILY NAME</label>
          <input
            type="text"
            placeholder={'e.g. "The Horvat Family"'}
            value={famName}
            onChange={e => { setFamName(e.target.value); setFamErr(""); }}
            style={{marginBottom:16}} />
          <button
            className="b bp"
            style={{width:"100%",fontSize:16}}
            disabled={famLoading}
            onClick={() => {
              if (!famName.trim()) { setFamErr("Please enter a family name."); return; }
              if (!au || !au.e) { setFamErr("You must be logged in."); return; }
              setFamLoading(true);
              fbCreateFamily(famName.trim(), au.e, name || au.d).then(r => {
                setFamLoading(false);
                if (r.ok) { setFamData(r.family); setFamTab("main"); setFamName(""); setFamErr(""); }
                else setFamErr(r.err);
              });
            }}>
            {famLoading ? "Creating..." : "👨‍👩‍👧‍👦 Create Family Group"}
          </button>
        </div>
      )}

      {famTab === "join" && (
        <div className="c" style={{padding:24}}>
          <div style={{fontSize:14,color:"#44403c",marginBottom:16}}>
            Enter the 6-character family code that was shared with you.
          </div>
          {famErr && (
            <div style={{background:famErr.startsWith("✅") ? "rgba(22,163,74,.08)" : "rgba(220,38,38,.08)",border:"1px solid",borderColor:famErr.startsWith("✅") ? "rgba(22,163,74,.2)" : "rgba(220,38,38,.2)",borderRadius:10,padding:"12px 16px",color:famErr.startsWith("✅") ? "#16a34a" : "#dc2626",fontSize:14,fontWeight:600,marginBottom:16}}>
              {famErr}
            </div>
          )}
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>FAMILY CODE</label>
          <input
            type="text"
            placeholder="e.g. AB3X7K"
            value={famCode}
            onChange={e => { setFamCode(e.target.value.toUpperCase()); setFamErr(""); }}
            maxLength={6}
            style={{marginBottom:16,textAlign:"center",letterSpacing:6,fontSize:24,fontWeight:800,textTransform:"uppercase"}} />
          <button
            className="b bp"
            style={{width:"100%",fontSize:16}}
            disabled={famLoading}
            onClick={() => {
              if (famCode.trim().length !== 6) { setFamErr("Code must be 6 characters."); return; }
              if (!au || !au.e) { setFamErr("You must be logged in."); return; }
              setFamLoading(true);
              fbJoinFamily(famCode.trim(), au.e, name || au.d).then(r => {
                setFamLoading(false);
                if (r.ok) { setFamData(r.family); setFamTab("main"); setFamCode(""); setFamErr(""); }
                else setFamErr(r.err);
              });
            }}>
            {famLoading ? "Joining..." : "🔗 Join Family"}
          </button>
        </div>
      )}
    </div>
  );
}
