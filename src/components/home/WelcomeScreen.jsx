import { sh, PLACE } from '../../data.jsx';

export default function WelcomeScreen({ name, au, st, setScr, setName, sPq, sPi, sPs, sPa, sPx }) {
  function startPlacement() {
    if (!name && au) setName(au.d);
    const b = sh(PLACE.filter(x => x.d === 1)).slice(0, 3);
    const m = sh(PLACE.filter(x => x.d === 2)).slice(0, 3);
    const a = sh(PLACE.filter(x => x.d === 3)).slice(0, 2);
    const q = [...b, ...m, ...a].map(q => {
      const c = q.o[q.c];
      const o = sh([...q.o]);
      return { ...q, o, c: o.indexOf(c) };
    });
    sPq(q); sPi(0); sPs(0); sPa(false); sPx(-1);
    setScr("placement");
  }

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24,position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",maxWidth:480,animation:"rise .6s"}}>
        <div style={{fontSize:72,marginBottom:16,animation:"boat 4s ease-in-out infinite"}}>⛵</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:42,color:"#164e63",fontWeight:900,marginBottom:8}}>Naša Hrvatska</h1>
        <p style={{color:"#78716c",fontSize:18,marginBottom:36}}>Let's Learn Croatian Together</p>
        <p style={{color:"#44403c",fontSize:16,marginBottom:24}}>
          {"Welcome, "}
          <span style={{color:"#0e7490",fontWeight:700}}>{name || au?.d}</span>
          !
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
          <button className="b bp" style={{fontSize:18,padding:"16px 48px"}} onClick={startPlacement}>
            Počnimo! (Let's Start!)
          </button>
          {st.xp > 0 && (
            <button className="b bg" style={{fontSize:14,padding:"12px 32px"}} onClick={() => setScr("dashboard")}>
              Already registered? Skip to Dashboard →
            </button>
          )}
        </div>
        <p style={{color:"#a8a29e",fontSize:13,marginTop:20}}>Quick placement test to find your level</p>
      </div>
    </div>
  );
}
