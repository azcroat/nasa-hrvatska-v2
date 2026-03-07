export default function BadgeToast({ show, badge }) {
  if (!show || !badge) return null;
  return (
    <div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",background:"rgba(255,255,255,.9)",border:"2px solid #fbbf24",padding:"16px 32px",borderRadius:14,zIndex:1001,textAlign:"center"}}>
      <div style={{fontSize:36}}>{badge.i}</div>
      <div style={{fontSize:13,color:"#b45309",fontWeight:700}}>Achievement!</div>
      <div style={{fontSize:18,fontWeight:700}}>{badge.n}</div>
    </div>
  );
}
