const h={A1:"#16a34a",A2:"#65a30d",B1:"#ca8a04",B2:"#b45309",C1:"#0e7490",C2:"#7c3aed"};function s(){try{return JSON.parse(localStorage.getItem("nh_immersion_days")||"[]")}catch{return[]}}function c(){const t=new Date().toISOString().slice(0,10),e=s();e.includes(t)||(e.push(t),localStorage.setItem("nh_immersion_days",JSON.stringify(e)),typeof window<"u"&&window.dispatchEvent(new CustomEvent("nh:immersion-new-day",{detail:{count:e.length}})))}function d(){const t=s(),e=[];for(let n=6;n>=0;n--){const a=new Date;a.setDate(a.getDate()-n),e.push(t.includes(a.toISOString().slice(0,10)))}return e}function l(){try{return localStorage.getItem("nh_goal")||""}catch{return""}}function g(t,e){return e?(e==="heritage"||e==="family")&&(t.cat==="music"||t.cat==="culture")?"For the diaspora":e==="travel"&&(t.cat==="tv"||t.cat==="podcast")?"Great for travellers":null:null}function u(t,e){return e==="fluent"?[...t].sort((n,a)=>{const i={A1:0,A2:1,B1:2,B2:3,C1:4,C2:5};return(i[n.level]??9)-(i[a.level]??9)}):e==="heritage"||e==="family"?[...t].sort((n,a)=>{const i=r=>r.cat==="music"||r.cat==="culture"?0:1;return i(n)-i(a)}):e==="travel"?[...t].sort((n,a)=>{const i=r=>r.cat==="tv"||r.cat==="podcast"?0:1;return i(n)-i(a)}):t}const o=`
@keyframes nh-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes nh-bar1 { 0%,100%{height:6px} 50%{height:22px} }
@keyframes nh-bar2 { 0%,100%{height:14px} 33%{height:4px} 66%{height:20px} }
@keyframes nh-bar3 { 0%,100%{height:20px} 40%{height:6px} }
@keyframes nh-bar4 { 0%,100%{height:10px} 60%{height:24px} }
@keyframes nh-skeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.nh-stagger > * { animation: nh-fade-in 0.3s ease both; }
.nh-stagger > *:nth-child(1){animation-delay:.04s}
.nh-stagger > *:nth-child(2){animation-delay:.08s}
.nh-stagger > *:nth-child(3){animation-delay:.12s}
.nh-stagger > *:nth-child(4){animation-delay:.16s}
.nh-stagger > *:nth-child(5){animation-delay:.20s}
.nh-stagger > *:nth-child(6){animation-delay:.24s}
.nh-stagger > *:nth-child(7){animation-delay:.28s}
.nh-stagger > *:nth-child(8){animation-delay:.32s}
.nh-stagger > *:nth-child(9){animation-delay:.36s}
.nh-stagger > *:nth-child(10){animation-delay:.40s}
.nh-stagger > *:nth-child(n+11){animation-delay:.44s}
`;if(typeof document<"u"&&!document.getElementById("nh-media-css")){const t=document.createElement("style");t.id="nh-media-css",t.textContent=o,document.head.appendChild(t)}export{h as L,l as a,d as g,c as m,u as s,g as t};
