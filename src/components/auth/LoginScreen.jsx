import React from 'react';
import { W, CSS, BG_LIGHT, gA } from '../../data.jsx';

const BG = BG_LIGHT;

export default function LoginScreen({
  as, ae, al, em, pw, pc, dn, sp, sq, sa,
  setAs, setAe, setEm, setPw, setPc, setDn, setSp2, setSq, setSa,
  setRpEm, setRpSa, setRpPw, setRpPc, setRpStep, setRpQ,
  doLog, doReg,
}) {
  const isR = as === "register";
  return (
    <div style={{...BG,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{CSS}</style>
      <W />
      <div style={{width:"100%",maxWidth:420,animation:"rise .5s",position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:56,marginBottom:12,animation:"boat 4s ease-in-out infinite"}}>⛵</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:36,color:"#164e63",fontWeight:800}}>Naša Hrvatska</h1>
          <p style={{color:"#78716c",fontSize:16}}>
            {isR ? "Create your account" : Object.keys(gA()).length > 0 ? "Welcome back! Sign in to continue" : "Sign in to continue"}
          </p>
        </div>
        <div className="c" style={{padding:28}}>
          {ae && <div style={{background:ae.startsWith("✅")?"rgba(22,163,74,.08)":"rgba(194,65,12,.08)",border:ae.startsWith("✅")?"1px solid rgba(22,163,74,.2)":"1px solid rgba(194,65,12,.2)",borderRadius:10,padding:"12px 16px",color:ae.startsWith("✅")?"#16a34a":"#c2410c",fontSize:14,fontWeight:600,marginBottom:16}}>{ae}</div>}
          {isR && <React.Fragment>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>DISPLAY NAME</label>
            <input type="text" placeholder="Your name" value={dn} onChange={e=>{setDn(e.target.value);setAe("")}} style={{marginBottom:14}} />
          </React.Fragment>}
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>EMAIL ADDRESS</label>
          <input type="email" placeholder={isR?"Enter your email address":"Email address"} value={em} onChange={e=>{setEm(e.target.value);setAe("")}} autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" style={{marginBottom:14}} />
          <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>PASSWORD</label>
          <input type={sp?"text":"password"} placeholder={isR?"Create password (6+ characters)":"Enter your password"} value={pw} onChange={e=>{setPw(e.target.value);setAe("")}} onKeyDown={e=>{if(e.key==="Enter"&&!isR)doLog()}} autoComplete={isR?"new-password":"current-password"} autoCapitalize="none" autoCorrect="off" spellCheck="false" style={{marginBottom:isR?14:8}} />
          {isR && <React.Fragment>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>CONFIRM PASSWORD</label>
            <input type="password" placeholder="Confirm your password" value={pc} onChange={e=>{setPc(e.target.value);setAe("")}} autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck="false" style={{marginBottom:14}} />
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>SECURITY QUESTION</label>
            <select value={sq} onChange={e=>{setSq(e.target.value);setAe("")}} style={{width:"100%",padding:"14px 18px",border:"2px solid rgba(14,116,144,.12)",borderRadius:14,background:"rgba(255,255,255,.65)",color:sq?"#1c1917":"#a8a29e",fontSize:16,fontWeight:600,outline:"none",fontFamily:"'Outfit',sans-serif",marginBottom:14,cursor:"pointer",WebkitAppearance:"none"}}>
              <option value="" disabled>Select a security question...</option>
              <option value="What city were you born in?">What city were you born in?</option>
              <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              <option value="What was the name of your first pet?">What was the name of your first pet?</option>
              <option value="What is your favorite Croatian city?">What is your favorite Croatian city?</option>
              <option value="What street did you grow up on?">What street did you grow up on?</option>
            </select>
            <label style={{fontSize:12,fontWeight:700,color:"#78716c",display:"block",marginBottom:6}}>SECURITY ANSWER</label>
            <input type="text" placeholder="Your answer (used if you forget your password)" value={sa} onChange={e=>{setSa(e.target.value);setAe("")}} autoComplete="off" style={{marginBottom:16}} />
          </React.Fragment>}
          {!isR && <div style={{textAlign:"right",marginBottom:12}}>
            <span style={{fontSize:13,color:"#0e7490",cursor:"pointer",fontWeight:600}} onClick={()=>{setAs("reset");setAe("");setRpEm(em||"");setRpSa("");setRpPw("");setRpPc("");setRpStep(1);setRpQ("")}}>Forgot password?</span>
          </div>}
          <button className="b bp" style={{width:"100%",fontSize:16,padding:"14px 24px",marginTop:4}} onClick={isR?doReg:doLog} disabled={al}>
            {al?"Loading...":isR?"Create Account":"Sign In"}
          </button>
          <div style={{textAlign:"center",marginTop:20,fontSize:14,color:"#78716c"}}>
            {isR?"Have an account? ":"No account? "}
            <span style={{color:"#0e7490",cursor:"pointer",fontWeight:700}} onClick={()=>{setAs(isR?"login":"register");setAe("");setEm("");setPw("");setPc("");setDn("");setSq("");setSa("")}}>
              {isR?"Sign in":"Create one"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
