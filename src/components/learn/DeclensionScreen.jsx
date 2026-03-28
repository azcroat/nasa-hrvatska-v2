import React, { useState } from 'react';
import { H, speak } from '../../data.jsx';
import { DECL } from '../../data.jsx';

function DeclensionScreen({ goBack }) {
  const [dcNoun, sDcNoun] = useState(0);
  const n = DECL.nouns[dcNoun];
  return (
    <div className="scr-wrap">

      {H("📝 Noun Declension Trainer","All 7 cases for key nouns",goBack)}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {DECL.nouns.map(function(noun,i){return (
          <button key={i} className={"b "+(dcNoun===i?"bp":"bg")} style={{fontSize:13}} onClick={function(){sDcNoun(i)}}>
            {noun.nom}{" ("}{noun.en})
          </button>
        );})}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <tbody>
          {DECL.caseNames.map(function(cs,ci){return (
            <tr key={ci} style={{borderBottom:"1px solid #f3f4f6"}} onClick={function(){speak(n.cases[ci])}} role="button" tabIndex={0} aria-label={`Play audio for ${n.cases[ci]}`} onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")speak(n.cases[ci])}}>
              <td style={{padding:"10px",fontWeight:700,color:"#0e7490"}}>{(ci+1)+". "}{cs}</td>
              <td style={{padding:"10px",fontWeight:600,fontSize:16}}>{n.cases[ci]}{" "}<span aria-hidden="true">🔊</span></td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}

export default DeclensionScreen;
