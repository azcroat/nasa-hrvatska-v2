import React from 'react';
import { H, Bar, LEARN_PATH } from '../../data.jsx';

export default function LearnPath({ st, setScr, goBack }) {
  var td=0, tt=0;
  LEARN_PATH.forEach(lv=>lv.items.forEach(it=>{tt++;if(it.ck(st))td++;}));
  return (
    <div style={{maxWidth:620,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      
      {H("📈 My Learning Path","Structured progression from Day 1 to fluency")}
      <div className="c" style={{marginBottom:20,textAlign:"center"}}>
        <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>{Math.round(td/tt*100)}%</div>
        <Bar v={td} mx={tt} h={10} />
        <div style={{fontSize:13,color:"#78716c",marginTop:6}}>{td} of {tt} milestones</div>
      </div>
      {LEARN_PATH.map((lv,li)=>{
        const done=lv.items.filter(it=>it.ck(st)).length;
        const all=lv.items.length;
        const pct=Math.round(done/all*100);
        const unlocked=li===0||LEARN_PATH[li-1].items.filter(it=>it.ck(st)).length>=Math.ceil(LEARN_PATH[li-1].items.length*0.6);
        return (
          <div key={li} className="c" style={{marginBottom:16,opacity:unlocked?1:0.5,padding:0,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",background:pct===100?"linear-gradient(135deg,#16a34a,#15803d)":unlocked?"linear-gradient(135deg,#0e7490,#164e63)":"#9ca3af",color:"white"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:12,opacity:.7}}>Level {lv.level}</div>
                  <div style={{fontSize:18,fontWeight:800}}>{lv.title}</div>
                </div>
                <div style={{fontSize:24,fontWeight:800}}>{pct===100?"✅":done+"/"+all}</div>
              </div>
              <div style={{fontSize:12,opacity:.7}}>{lv.desc}</div>
              <div style={{background:"rgba(255,255,255,.2)",borderRadius:10,height:4,marginTop:8}}>
                <div style={{width:pct+"%",height:"100%",background:"white",borderRadius:10}} />
              </div>
            </div>
            {unlocked&&<div style={{padding:"8px 16px"}}>
              {lv.items.map((it,ii)=>{
                const isDone=it.ck(st);
                return (
                  <div key={ii} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:ii<all-1?"1px solid #f3f4f6":"none",cursor:isDone?"default":"pointer"}}
                    onClick={()=>{if(!isDone)setScr(it.go);}}>
                    <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(isDone?"#16a34a":"#d6d3d1"),background:isDone?"#16a34a":"white",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:800,flexShrink:0}}>
                      {isDone?"✓":""}
                    </div>
                    <div style={{fontSize:14,fontWeight:isDone?400:600,color:isDone?"#78716c":"#164e63",textDecoration:isDone?"line-through":"none"}}>{it.name}</div>
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })}
    </div>
  );
}
