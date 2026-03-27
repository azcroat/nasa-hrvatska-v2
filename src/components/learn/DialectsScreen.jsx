import React from 'react';
import { H } from '../../data.jsx';
import { DIALECTS } from '../../data.jsx';

function DialectsScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🗺️ Regional Dialects","Štokavski, Kajkavski, Čakavski",goBack)}
      {DIALECTS.info.map(function(d,i){return (
        <div key={i} className="c" style={{marginBottom:12,borderLeft:"4px solid "+["#0e7490","#7c3aed","#dc2626"][i]}}>
          <div style={{fontSize:16,fontWeight:800}}>{d.name}</div>
          <div style={{fontSize:13,color:"#78716c",marginTop:4}}>{d.region}</div>
          <div style={{fontSize:13,marginTop:4}}>{d.desc}</div>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>Comparison Table</h3>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr>{["English","Što","Kaj","Ča"].map(function(h,i){return (<th key={i} style={{padding:"8px",borderBottom:"2px solid #e7e5e4",textAlign:"left"}}>{h}</th>);})}</tr>
        </thead>
        <tbody>
          {DIALECTS.compare.map(function(r,i){return (
            <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
              <td style={{padding:"8px",color:"#78716c"}}>{r.en}</td>
              <td style={{padding:"8px",fontWeight:600}}>{r.sto}</td>
              <td style={{padding:"8px",fontWeight:600}}>{r.kaj}</td>
              <td style={{padding:"8px",fontWeight:600}}>{r.ca}</td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}

export default DialectsScreen;
