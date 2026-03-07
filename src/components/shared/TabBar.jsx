const TABS = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "learn",    icon: "📚", label: "Learn" },
  { id: "practice", icon: "🎮", label: "Practice" },
  { id: "croatia",  icon: "🇭🇷", label: "Croatia" },
  { id: "profile",  icon: "👤", label: "Profile" },
];

export default function TabBar({ tab, setTab, setScr }) {
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(255,255,255,.97)",borderTop:"1px solid rgba(0,0,0,.08)",display:"flex",justifyContent:"space-around",padding:"6px 0",paddingBottom:"max(6px, env(safe-area-inset-bottom))",zIndex:9000,backdropFilter:"blur(10px)"}}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => { setTab(t.id); setScr("dashboard"); }}
          style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",padding:"4px 8px",minWidth:60,opacity:tab===t.id?1:0.5,transition:"opacity .2s"}}>
          <span style={{fontSize:22}}>{t.icon}</span>
          <span style={{fontSize:10,fontWeight:tab===t.id?800:600,color:tab===t.id?"#0e7490":"#78716c"}}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
