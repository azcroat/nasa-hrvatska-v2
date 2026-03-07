import React from 'react';
import { H, speak } from '../../data.jsx';

export default function FavoritesScreen({ favs, toggleFav, setScr, goBack }) {
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      
      {H("⭐ My Favorites","Saved words, phrases & screens")}
      {favs.length===0
        ? <div className="c" style={{textAlign:"center",padding:"32px"}}>
            <div style={{fontSize:48}}>⭐</div>
            <div style={{fontSize:14,color:"#78716c",marginTop:8}}>No favorites yet! Search for a word and tap it to navigate.</div>
          </div>
        : favs.map((f,i)=>(
          <div key={i} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px"}}>
            <div style={{cursor:"pointer",flex:1}} onClick={()=>{if(f.go)setScr(f.go);}}>
              <div style={{fontSize:15,fontWeight:700,color:"#164e63"}}>{f.hr}</div>
              <div style={{fontSize:13,color:"#78716c"}}>{f.en}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              {f.hr&&<button style={{background:"none",border:"none",fontSize:16,cursor:"pointer"}} onClick={()=>speak(f.hr)}>🔊</button>}
              <button style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:"#dc2626"}} onClick={()=>toggleFav(f)}>✖</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}
