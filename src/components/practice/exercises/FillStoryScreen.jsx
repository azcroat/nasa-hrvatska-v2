import React from 'react';
import { H } from '../../../data.jsx';
import { FILL_STORIES } from '../../../data.jsx';

function FillStoryScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">

      {H("📝 Story Builder","Read and fill the blanks")}
      {FILL_STORIES.map(function(story,si){return (
        <div key={si} className="c" style={{marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"📖 "}{story.title}</div>
          {story.story.map(function(s,qi){return (
            <div key={qi} style={{marginBottom:10}}>
              <div style={{fontSize:13,color:"#44403c",marginBottom:4}}>{s.text.replace("_____","______")}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {s.opts.map(function(o,oi){return (
                  <button key={oi} style={{padding:"6px 12px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                    onClick={function(/** @type {any} */ e){const btns=e.target.parentNode.children;for(let i=0;i<btns.length;i++){btns[i].style.background="white";btns[i].style.borderColor="#d6d3d1"}e.target.style.background=o===s.blank?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===s.blank?"#16a34a":"#dc2626";if(o===s.blank)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                    {o}
                  </button>
                );})}
              </div>
              <div style={{fontSize:11,color:"#a8a29e",marginTop:2}}>{s.en}</div>
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export default FillStoryScreen;
