import React from 'react';
import { H, speak } from '../../data.jsx';

export default function FavoritesScreen({ favs, toggleFav, setScr, goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("⭐ My Favorites","Saved words, phrases & screens", goBack)}
      {favs.length===0
        ? <div className="c" style={{textAlign:"center",padding:"32px"}}>
            <div style={{fontSize:48}}>⭐</div>
            <div style={{fontSize:14,color:"#78716c",marginTop:8}}>No favorites yet! Search for a word and tap it to navigate.</div>
          </div>
        : favs.map((f,i)=>(
          <div key={f.hr || `fav-${i}`} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px"}}>
            <button style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,flex:1,fontFamily:"'Outfit',sans-serif"}} onClick={()=>{if(f.go)setScr(f.go);}}>
              <div style={{fontSize:15,fontWeight:700,color:"var(--heading)"}}>{f.hr}</div>
              <div style={{fontSize:13,color:"var(--subtext)"}}>{f.en}</div>
            </button>
            <div style={{display:"flex",gap:8}}>
              {f.hr&&<button aria-label={`Play audio for ${f.hr}`} style={{background:"none",border:"none",fontSize:16,cursor:"pointer"}} onClick={()=>speak(f.hr)}><span aria-hidden="true">🔊</span></button>}
              <button aria-label={`Remove ${f.hr||f.en} from favorites`} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:"#dc2626"}} onClick={()=>toggleFav(f)}>✖</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}
