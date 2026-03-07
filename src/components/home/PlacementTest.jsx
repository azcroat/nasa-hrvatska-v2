import { H, Bar } from '../../data.jsx';

export default function PlacementTest({ pq, pi, ps, pa, px, sPi, sPs, sPa, sPx, setScr, setSt }) {
  if (!pq.length) return null;
  return (
    <div className="scr-wrap">
      {H("Question " + (pi + 1) + " of " + pq.length)}
      <Bar v={pi + 1} mx={pq.length} h={6} />
      <div className="c" style={{marginTop:20}}>
        <p style={{fontSize:20,fontWeight:700,marginBottom:24}}>{pq[pi].q}</p>
        {pq[pi].o.map((o, i) => (
          <button
            key={i}
            className={"ob " + (pa ? (i === pq[pi].c ? "ok" : px === i ? "no" : "") : "")}
            onClick={() => { if (!pa) { sPx(i); sPa(true); if (i === pq[pi].c) sPs(s => s + 1); } }}>
            {o}
          </button>
        ))}
        {pa && (
          <button
            className="b bp"
            style={{width:"100%",marginTop:20}}
            onClick={() => {
              if (pi < pq.length - 1) { sPi(i => i + 1); sPa(false); sPx(-1); }
              else { setSt(s => ({ ...s, diff: ps >= 6 ? "advanced" : ps >= 3 ? "intermediate" : "beginner" })); setScr("dashboard"); }
            }}>
            {pi < pq.length - 1 ? "Next →" : "See Results"}
          </button>
        )}
      </div>
    </div>
  );
}
