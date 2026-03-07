export default function XPPopup({ showXP, xpA }) {
  if (!showXP) return null;
  const alreadyEarned = xpA === 0;
  return (
    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:alreadyEarned?"linear-gradient(135deg,#78716c,#44403c)":"linear-gradient(135deg,#fbbf24,#b45309)",color:"#fff",padding:"20px 40px",borderRadius:14,fontSize:alreadyEarned?16:28,fontWeight:800,zIndex:1000,animation:"pop .5s",textAlign:"center",maxWidth:240}}>
      {alreadyEarned ? "✅ Already earned XP today!\nCome back tomorrow for more." : `+${xpA} XP ✨`}
    </div>
  );
}
