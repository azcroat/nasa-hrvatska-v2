// @ts-nocheck
import React, { useState } from 'react';
import { H } from '../../data';
import { MAPPLACES } from '../../data';

export default function CrMap({ goBack }) {
  const [mapCat, setMapCat] = useState("all");
  const [mapSel, setMapSel] = useState(null);
  return (
    <div className="scr-wrap">
      
      {H("🗺️ Interactive Map","Explore Croatia & get directions", goBack)}
      <div style={{borderRadius:14,overflow:"hidden",marginBottom:16,border:"2px solid rgba(14,116,144,.12)"}}>
        <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2800000!2d16.0!3d44.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2shr"
          width="100%" height="300" style={{border:"none",display:"block"}} loading="lazy" allowFullScreen={true} referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        <button style={{padding:"6px 14px",borderRadius:10,border:"2px solid "+(mapCat==="all"?"#164e63":"#e7e5e4"),background:mapCat==="all"?"#164e63":"white",color:mapCat==="all"?"white":"#44403c",fontWeight:600,fontSize:12,cursor:"pointer"}} onClick={function(){setMapCat("all")}}>All</button>
        {MAPPLACES.categories.map(function(cat){return (
          <button key={cat.id} style={{padding:"6px 14px",borderRadius:10,border:"2px solid "+(mapCat===cat.id?cat.color:"#e7e5e4"),background:mapCat===cat.id?cat.color:"white",color:mapCat===cat.id?"white":"#44403c",fontWeight:600,fontSize:12,cursor:"pointer"}} onClick={function(){setMapCat(cat.id)}}>{cat.label}</button>
        );})}
      </div>
      {MAPPLACES.places.filter(function(p){return mapCat==="all"||p.cat===mapCat}).map(function(p,i){
        const catInfo=MAPPLACES.categories.find(function(c){return c.id===p.cat});
        return (
          <button key={i} className="c" style={{marginBottom:8,padding:"12px 14px",borderLeft:"4px solid "+(catInfo?catInfo.color:"#e7e5e4")}} onClick={function(){setMapSel(mapSel===i?null:i)}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"#164e63"}}>{p.name}</div>
                <div style={{fontSize:12,color:"#78716c",marginTop:2}}>{p.desc}</div>
              </div>
              <div style={{fontSize:11,padding:"3px 8px",background:catInfo?catInfo.color+"18":"#f3f4f6",borderRadius:10,color:catInfo?catInfo.color:"#78716c",fontWeight:600}}>{catInfo?catInfo.label.split(" ")[1]:""}</div>
            </div>
            {mapSel===i&&<div style={{display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:"1px solid #f3f4f6"}}>
              <button style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",border:"none",fontFamily:"'Outfit',sans-serif"}}
                onClick={function(){window.open("https://www.google.com/maps/dir/?api=1&destination="+p.lat+","+p.lng+"&travelmode=driving","_blank","noopener,noreferrer")}}>🚧 Driving</button>
              <button style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"10px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"white",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",border:"none",fontFamily:"'Outfit',sans-serif"}}
                onClick={function(){window.open("https://www.google.com/maps/search/?api=1&query="+p.lat+","+p.lng,"_blank","noopener,noreferrer")}}>🗺️ Map</button>
              <button style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 14px",background:"#16a34a",color:"white",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",border:"none",fontFamily:"'Outfit',sans-serif"}}
                onClick={function(){window.open("https://www.google.com/maps/dir/?api=1&destination="+p.lat+","+p.lng+"&travelmode=walking","_blank","noopener,noreferrer")}}>🚶</button>
            </div>}
          </button>
        );})}
    </div>
  );
}
