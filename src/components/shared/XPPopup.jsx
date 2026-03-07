export default function XPPopup({ showXP, xpA }) {
  if (!showXP) return null;
  return (
    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#fbbf24,#b45309)",color:"#fff",padding:"20px 40px",borderRadius:14,fontSize:28,fontWeight:800,zIndex:1000,animation:"pop .5s"}}>
      +{xpA}{" XP ✨"}
    </div>
  );
}
