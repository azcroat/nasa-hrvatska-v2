import React from 'react';
import { BG_LIGHT } from '../../data.jsx';

const BG = BG_LIGHT;

export default function ResetPassword({
  authError, authLoading, rpEm,
  setAuthScreen, setAuthError, setRpEm,
  doReset,
}) {
  return (
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:420,animation:"rise .5s",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:8}}>🔐</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",fontWeight:800}}>Reset Password</h1>
          <p style={{color:"#78716c",fontSize:14}}>Enter your email and we'll send you a reset link</p>
        </div>
        <div className="c" style={{padding:28}}>
          {authError && <div style={{background:authError.startsWith("✅")?"rgba(22,163,74,.08)":"rgba(194,65,12,.08)",border:authError.startsWith("✅")?"1px solid rgba(22,163,74,.2)":"1px solid rgba(194,65,12,.2)",borderRadius:10,padding:"12px 16px",color:authError.startsWith("✅")?"#16a34a":"#c2410c",fontSize:14,fontWeight:600,marginBottom:16}}>{authError}</div>}
          <div style={{fontSize:14,color:"#44403c",marginBottom:16}}>Enter the email address you used to create your account.</div>
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>EMAIL ADDRESS</label>
          <input type="email" placeholder="Enter your email" value={rpEm} onChange={e=>{setRpEm(e.target.value);setAuthError("")}} autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" onKeyDown={e=>{if(e.key==="Enter")doReset()}} style={{marginBottom:16}} />
          <button className="b bp" style={{width:"100%",padding:"14px 24px"}} onClick={doReset} disabled={authLoading}>
            {authLoading?"Sending...":"Send Reset Link"}
          </button>
          <div style={{textAlign:"center",marginTop:20,fontSize:14,color:"#78716c"}}>
            <span style={{color:"#0e7490",cursor:"pointer",fontWeight:700}} onClick={()=>{setAuthScreen("login");setAuthError("");setRpEm("")}}>← Back to Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );
}
