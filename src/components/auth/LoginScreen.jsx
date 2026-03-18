import React from 'react';
import { BG_LIGHT } from '../../data.jsx';

const BG = BG_LIGHT;

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}
const PW_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const PW_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#16a34a"];

export default function LoginScreen({
  authScreen, authError, authLoading, authEmail, pw, pc, displayName, sp,
  setAuthScreen, setAuthError, setAuthEmail, setPw, setPc, setDisplayName, setSp2,
  setRpEm,
  doLog, doReg,
}) {
  const isR = authScreen === "register";
  const strength = isR ? pwStrength(pw) : 0;
  return (
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{width:"100%",maxWidth:420,animation:"rise .5s",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:56,marginBottom:12,animation:"boat 4s ease-in-out infinite"}}>⛵</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:36,color:"#164e63",fontWeight:800}}>Naša Hrvatska</h1>
          <p style={{color:"#78716c",fontSize:16}}>
            {isR ? "Create your account" : "Sign in to continue"}
          </p>
        </div>
        <div className="c" style={{padding:28}}>
          {authError && <div style={{background:authError.startsWith("✅")?"rgba(22,163,74,.08)":"rgba(194,65,12,.08)",border:authError.startsWith("✅")?"1px solid rgba(22,163,74,.2)":"1px solid rgba(194,65,12,.2)",borderRadius:10,padding:"12px 16px",color:authError.startsWith("✅")?"#16a34a":"#c2410c",fontSize:14,fontWeight:600,marginBottom:16}}>{authError}</div>}
          {isR && <React.Fragment>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>DISPLAY NAME</label>
            <input type="text" placeholder="Your name" value={displayName} onChange={e=>{setDisplayName(e.target.value);setAuthError("")}} style={{marginBottom:14}} />
          </React.Fragment>}
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>EMAIL ADDRESS</label>
          <input type="email" placeholder={isR?"Enter your email address":"Email address"} value={authEmail} onChange={e=>{setAuthEmail(e.target.value);setAuthError("")}} autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" style={{marginBottom:14}} />
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>PASSWORD</label>
          <input type={sp?"text":"password"} placeholder={isR?"Create password (6+ characters)":"Enter your password"} value={pw} onChange={e=>{setPw(e.target.value);setAuthError("")}} onKeyDown={e=>{if(e.key==="Enter"&&!isR)doLog()}} autoComplete={isR?"new-password":"current-password"} autoCapitalize="none" autoCorrect="off" spellCheck="false" style={{marginBottom:isR?8:8}} />
          {isR && pw && (
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",gap:4,marginBottom:4}}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{flex:1,height:4,borderRadius:4,background:i<=strength?PW_COLORS[strength]:"#e2e8f0",transition:"background .2s"}} />
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:700,color:PW_COLORS[strength]}}>{PW_LABELS[strength]}</div>
            </div>
          )}
          {isR && !pw && <div style={{marginBottom:14}} />}
          {isR && <React.Fragment>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>CONFIRM PASSWORD</label>
            <input type="password" placeholder="Confirm your password" value={pc} onChange={e=>{setPc(e.target.value);setAuthError("")}} autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck="false" onKeyDown={e=>{if(e.key==="Enter")doReg()}} style={{marginBottom:16}} />
          </React.Fragment>}
          {!isR && <div style={{textAlign:"right",marginBottom:12}}>
            <span style={{fontSize:13,color:"#0e7490",cursor:"pointer",fontWeight:600}} onClick={()=>{setAuthScreen("reset");setAuthError("");setRpEm(authEmail||"")}}>Forgot password?</span>
          </div>}
          <button className="b bp" style={{width:"100%",fontSize:16,padding:"14px 24px",marginTop:4}} onClick={isR?doReg:doLog} disabled={authLoading}>
            {authLoading?"Loading...":isR?"Create Account":"Sign In"}
          </button>
          <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"#94a3b8"}}>
            By continuing you agree to our{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{color:"#0e7490",textDecoration:"underline"}}>Privacy Policy</a>
            {" & "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{color:"#0e7490",textDecoration:"underline"}}>Terms of Use</a>
          </div>
          <div style={{textAlign:"center",marginTop:12,fontSize:14,color:"#78716c"}}>
            {isR?"Have an account? ":"No account? "}
            <span style={{color:"#0e7490",cursor:"pointer",fontWeight:700}} onClick={()=>{setAuthScreen(isR?"login":"register");setAuthError("");setAuthEmail("");setPw("");setPc("");setDisplayName("")}}>
              {isR?"Sign in":"Create one"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
