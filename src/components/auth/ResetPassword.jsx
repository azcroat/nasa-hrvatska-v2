import React from 'react';
import { W, CSS, BG_LIGHT } from '../../data.jsx';

const BG = BG_LIGHT;

export default function ResetPassword({
  ae, rpEm, rpSa, rpPw, rpPc, rpStep, rpQ,
  setAs, setAe, setRpEm, setRpSa, setRpPw, setRpPc, setRpStep, setRpQ,
  doReset,
}) {
  return (
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{CSS}</style>
      <W />
      <div style={{width:"100%",maxWidth:420,animation:"rise .5s",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:8}}>🔐</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",fontWeight:800}}>Reset Password</h1>
          <p style={{color:"#78716c",fontSize:14}}>
            {rpStep===1?"Enter your email":rpStep===2?"Answer your security question":"Set new password"}
          </p>
        </div>
        <div className="c" style={{padding:28}}>
          <div style={{display:"flex",gap:6,marginBottom:20}}>
            {[1,2,3].map(s => (
              <div key={s} style={{flex:1,height:6,borderRadius:12,background:rpStep>=s?"#0e7490":"#e7e5e4",transition:"background .3s"}} />
            ))}
          </div>
          {ae && <div style={{background:ae.startsWith("✅")?"rgba(22,163,74,.08)":"rgba(194,65,12,.08)",border:ae.startsWith("✅")?"1px solid rgba(22,163,74,.2)":"1px solid rgba(194,65,12,.2)",borderRadius:10,padding:"12px 16px",color:ae.startsWith("✅")?"#16a34a":"#c2410c",fontSize:14,fontWeight:600,marginBottom:16}}>{ae}</div>}
          {rpStep===1 && <React.Fragment>
            <div style={{fontSize:14,color:"#44403c",marginBottom:16}}>Enter the email address you used to create your account.</div>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>EMAIL ADDRESS</label>
            <input type="email" placeholder="Enter your email" value={rpEm} onChange={e=>{setRpEm(e.target.value);setAe("")}} autoComplete="email" onKeyDown={e=>{if(e.key==="Enter")doReset()}} style={{marginBottom:16}} />
            <button className="b bp" style={{width:"100%",padding:"14px 24px"}} onClick={doReset}>Continue →</button>
          </React.Fragment>}
          {rpStep===2 && <React.Fragment>
            <div style={{fontSize:14,color:"#44403c",marginBottom:8}}>Answer your security question to verify your identity.</div>
            <div style={{fontSize:15,fontWeight:700,color:"#164e63",padding:"12px 16px",background:"rgba(14,116,144,.06)",borderRadius:10,marginBottom:16}}>{rpQ}</div>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>YOUR ANSWER</label>
            <input type="text" placeholder="Enter your answer" value={rpSa} onChange={e=>{setRpSa(e.target.value);setAe("")}} autoComplete="off" onKeyDown={e=>{if(e.key==="Enter")doReset()}} style={{marginBottom:16}} />
            <button className="b bp" style={{width:"100%",padding:"14px 24px"}} onClick={doReset}>Verify →</button>
          </React.Fragment>}
          {rpStep===3 && <React.Fragment>
            <div style={{fontSize:14,color:"#16a34a",fontWeight:600,marginBottom:16}}>✅ Identity verified! Set your new password.</div>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>NEW PASSWORD</label>
            <input type="password" placeholder="New password (6+ characters)" value={rpPw} onChange={e=>{setRpPw(e.target.value);setAe("")}} autoComplete="new-password" style={{marginBottom:14}} />
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>CONFIRM NEW PASSWORD</label>
            <input type="password" placeholder="Confirm new password" value={rpPc} onChange={e=>{setRpPc(e.target.value);setAe("")}} autoComplete="new-password" onKeyDown={e=>{if(e.key==="Enter")doReset()}} style={{marginBottom:16}} />
            <button className="b bp" style={{width:"100%",padding:"14px 24px"}} onClick={doReset}>Reset Password</button>
          </React.Fragment>}
          <div style={{textAlign:"center",marginTop:20,fontSize:14,color:"#78716c"}}>
            <span style={{color:"#0e7490",cursor:"pointer",fontWeight:700}} onClick={()=>{setAs("login");setAe("");setRpStep(1);setRpEm("");setRpSa("");setRpPw("");setRpPc("");setRpQ("")}}>← Back to Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );
}
