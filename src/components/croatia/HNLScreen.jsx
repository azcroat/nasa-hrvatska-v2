import React, { useState } from 'react';
import { FOOTBALL, speak } from '../../data.jsx';

// ─── Static data (2024/25 HNL season – link to hnl.hr for live updates) ───────

const HNL_TABLE = [
  { pos:1,  team:"Dinamo Zagreb",   badge:"💙", p:36, w:26, d:5,  l:5,  gf:75, ga:28, pts:83, color:"#003da5", cl:true },
  { pos:2,  team:"Hajduk Split",    badge:"🤍", p:36, w:23, d:6,  l:7,  gf:60, ga:30, pts:75, color:"#1d1d1b", cl:false },
  { pos:3,  team:"Osijek",          badge:"🟠", p:36, w:18, d:7,  l:11, gf:52, ga:38, pts:61, color:"#e85d04", cl:false },
  { pos:4,  team:"Rijeka",          badge:"⚓", p:36, w:16, d:8,  l:12, gf:48, ga:40, pts:56, color:"#1e3a5f", cl:false },
  { pos:5,  team:"Lokomotiva",      badge:"🔵", p:36, w:13, d:9,  l:14, gf:42, ga:46, pts:48, color:"#164e63", cl:false },
  { pos:6,  team:"Varaždin",        badge:"🔴", p:36, w:11, d:10, l:15, gf:36, ga:48, pts:43, color:"#dc2626", cl:false },
  { pos:7,  team:"Gorica",          badge:"🟢", p:36, w:10, d:7,  l:19, gf:32, ga:52, pts:37, color:"#16a34a", cl:false },
  { pos:8,  team:"Istra 1961",      badge:"🟣", p:36, w:8,  d:8,  l:20, gf:28, ga:55, pts:32, color:"#7c3aed", rel:true },
  { pos:9,  team:"Slaven Belupo",   badge:"🩵", p:36, w:6,  d:8,  l:22, gf:24, ga:60, pts:26, color:"#0e7490", rel:true },
  { pos:10, team:"Šibenik",         badge:"⚪", p:36, w:4,  d:6,  l:26, gf:18, ga:68, pts:18, color:"#78716c", rel:true },
];

const TOP_SCORERS = [
  { name:"Bruno Petković",   team:"Dinamo Zagreb", goals:18, flag:"🇭🇷" },
  { name:"Marko Livaja",     team:"Hajduk Split",  goals:15, flag:"🇭🇷" },
  { name:"Muzafer Ejupi",    team:"Osijek",        goals:12, flag:"🇦🇱" },
  { name:"Ivan Perišić",     team:"Hajduk Split",  goals:10, flag:"🇭🇷" },
  { name:"Stipe Radić",      team:"Rijeka",        goals:9,  flag:"🇭🇷" },
  { name:"Dario Špikić",     team:"Lokomotiva",    goals:8,  flag:"🇭🇷" },
];

const TEAMS_DETAIL = [
  {
    name: "GNK Dinamo Zagreb",
    short: "Dinamo",
    badge: "💙",
    color: "#003da5",
    city: "Zagreb",
    founded: 1945,
    stadium: "Stadion Maksimir",
    capacity: "35,123",
    titles: "38",
    ultras: "Bad Blue Boys",
    desc: "Croatia's most successful club and the country's dominant force. Regular UEFA Champions League participant who developed world-class talent including Luka Modrić, Mateo Kovačić, Marcelo Brozović and Dejan Lovren. Known for the fierce 'Plavi' (Blues) identity.",
    achievements: ["38× HNL Champions", "UCL Group Stage regulars", "Produced Modrić & Kovačić"],
    chant: "Dinamo do neba, Dinamo je klub broj jedan!",
    chantEn: "Dinamo to the sky, Dinamo is club number one!",
  },
  {
    name: "HNK Hajduk Split",
    short: "Hajduk",
    badge: "🤍",
    color: "#1d1d1b",
    city: "Split",
    founded: 1911,
    stadium: "Stadion Poljud",
    capacity: "34,198",
    titles: "19",
    ultras: "Torcida (est. 1950)",
    desc: "The People's Club — one of a handful of supporter-owned clubs in Europe. Home of the Torcida, founded in 1950 and recognised as Europe's oldest ultras group. The eternal rival of Dinamo. Every Dinamo–Hajduk match (the 'Vječni derbi') is the biggest game in Croatian football.",
    achievements: ["19× HNL Champions", "Torcida — Europe's oldest ultras", "Supporter-owned since 1911"],
    chant: "Hajduk do neba, Torcida je naša snaga!",
    chantEn: "Hajduk to the sky, Torcida is our strength!",
  },
  {
    name: "NK Osijek",
    short: "Osijek",
    badge: "🟠",
    color: "#e85d04",
    city: "Osijek",
    founded: 1947,
    stadium: "Opus Arena",
    capacity: "11,500",
    titles: "3",
    ultras: "Kohorta",
    desc: "Slavonian powerhouse from eastern Croatia. Backed by significant investment, Osijek renovated their Opus Arena and have made regular European appearances. A genuine challenger to the big two in recent seasons.",
    achievements: ["3× HNL Champions", "UEFA Europa Conference League", "Renovated Opus Arena (2019)"],
    chant: "Bijelo-plavi, uz nas stojte vi!",
    chantEn: "White-blues, stand with us!",
  },
  {
    name: "HNK Rijeka",
    short: "Rijeka",
    badge: "⚓",
    color: "#1e3a5f",
    city: "Rijeka",
    founded: 1946,
    stadium: "HNK Rijeka Rujevica",
    capacity: "8,279",
    titles: "3",
    ultras: "Armada",
    desc: "The pride of Kvarner Bay. Rijeka broke Dinamo's title dominance in 2017 under coach Matjaž Kek, winning the club's first ever HNL championship. The passionate Armada ultras create one of Croatia's best atmospheres.",
    achievements: ["3× HNL Champions", "First title in 2017 — historic!", "UEFA Europa League qualifier"],
    chant: "Armada, Armada, nek se ori Rujevica!",
    chantEn: "Armada, Armada, let Rujevica echo!",
  },
  {
    name: "NK Lokomotiva Zagreb",
    short: "Lokomotiva",
    badge: "🔵",
    color: "#164e63",
    city: "Zagreb",
    founded: 1914,
    stadium: "Stadion Kranjčevićeva",
    capacity: "5,000",
    titles: "0",
    ultras: "Lokosi",
    desc: "Dinamo's historical sister club and Zagreb's third football identity. Despite no league titles, Lokomotiva consistently finish top-5 and have a proud tradition of developing players for the Croatian national team and bigger clubs.",
    achievements: ["Consistent top-5 finishers", "Developed many national team players", "Zagreb's oldest club (1914)"],
    chant: "Lokosi, Lokosi, jedini pravi Zagrepčani!",
    chantEn: "Lokosi, Lokosi, the only real Zagrebians!",
  },
];

const VOCAB_EXTRA = [
  ["Vječni derbi", "the Eternal Derby (Dinamo vs Hajduk)"],
  ["navijati", "to support / to cheer"],
  ["tribina", "stand / terrace"],
  ["igrač", "player"],
  ["trener", "coach / manager"],
  ["kapetan", "captain"],
  ["slobodan udarac", "free kick"],
  ["ofsajd", "offside"],
  ["žuti karton", "yellow card"],
  ["crveni karton", "red card"],
  ["izmjena", "substitution"],
  ["produžetci", "extra time"],
  ["kazneni udarac", "penalty shootout"],
  ["prvaci", "champions"],
];

const LIVE_LINKS = [
  { label:"Official HNL", sub:"Live standings & results", url:"https://hnl.hr", icon:"🏆", color:"#003da5" },
  { label:"Sofascore", sub:"Live scores & stats", url:"https://www.sofascore.com/football/croatia/hnl", icon:"📊", color:"#0e7490" },
  { label:"Flashscore", sub:"Fixtures & results", url:"https://www.flashscore.com/football/croatia/hnl/", icon:"⚡", color:"#e85d04" },
  { label:"National Team", sub:"Vatreni — UEFA & FIFA", url:"https://hns-cff.hr", icon:"🇭🇷", color:"#dc2626" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HNLScreen({ goBack }) {
  const [tab, setTab] = useState("standings");

  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"16px 16px 80px",position:"relative",zIndex:1}}>
      

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#003da5 0%,#dc2626 100%)",borderRadius:18,padding:"20px 20px 16px",marginBottom:16,color:"white",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:16,top:12,fontSize:48,opacity:.15}}>⚽</div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,opacity:.8,textTransform:"uppercase",marginBottom:4}}>Hrvatska nogometna liga</div>
        <div style={{fontSize:22,fontWeight:900,lineHeight:1.1}}>Croatian Football</div>
        <div style={{fontSize:13,opacity:.85,marginTop:4}}>Prva HNL · Vatreni · Liga prvaka</div>
        <div style={{display:"flex",gap:16,marginTop:14}}>
          {[["🥈","2018 WC","Finalists"],["🥉","2022 WC","3rd Place"],["⭐","HNL","10 Clubs"]].map(([icon,yr,label])=>(
            <div key={yr} style={{textAlign:"center"}}>
              <div style={{fontSize:18}}>{icon}</div>
              <div style={{fontSize:11,fontWeight:800}}>{yr}</div>
              <div style={{fontSize:10,opacity:.8}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Data Links */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {LIVE_LINKS.map(l=>(
          <div key={l.label} className="tc"
            style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",borderLeft:"3px solid "+l.color}}
            onClick={()=>window.open(l.url,"_blank","noopener,noreferrer")}>
            <div style={{fontSize:22,flexShrink:0}}>{l.icon}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:l.color}}>{l.label} ↗</div>
              <div style={{fontSize:11,color:"#78716c"}}>{l.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div style={{display:"flex",gap:6,marginBottom:16,background:"rgba(0,0,0,.04)",borderRadius:12,padding:4}}>
        {[["standings","🏆 Standings"],["teams","🏟️ Teams"],["vocab","📖 Vocab"]].map(([key,label])=>(
          <button key={key}
            onClick={()=>setTab(key)}
            style={{flex:1,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
              background:tab===key?"white":"transparent",
              color:tab===key?"#003da5":"#78716c",
              boxShadow:tab===key?"0 1px 4px rgba(0,0,0,.12)":"none",
              transition:"all .15s"}}>
            {label}
          </button>
        ))}
      </div>

      {/* ── STANDINGS TAB ── */}
      {tab==="standings"&&<>
        <div style={{background:"rgba(14,116,144,.06)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#164e63",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:16}}>ℹ️</span>
          <span>Indicative 2024/25 season table. Tap <strong>Official HNL ↗</strong> above for live standings.</span>
        </div>

        {/* Table */}
        <div className="c" style={{padding:0,overflow:"hidden",marginBottom:20}}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:"28px 1fr 28px 28px 28px 28px 28px 36px",gap:0,padding:"8px 12px",background:"#003da5",color:"white",fontSize:11,fontWeight:700}}>
            <div>#</div>
            <div>Club</div>
            <div style={{textAlign:"center"}}>P</div>
            <div style={{textAlign:"center"}}>W</div>
            <div style={{textAlign:"center"}}>D</div>
            <div style={{textAlign:"center"}}>L</div>
            <div style={{textAlign:"center"}}>GD</div>
            <div style={{textAlign:"center",color:"#fcd34d"}}>Pts</div>
          </div>
          {HNL_TABLE.map((row,i)=>{
            const gd = row.gf - row.ga;
            const bg = i%2===0 ? "white" : "rgba(0,0,0,.02)";
            const borderLeft = row.cl ? "3px solid #003da5" : row.rel ? "3px solid #dc2626" : "3px solid transparent";
            return (
              <div key={row.pos} style={{display:"grid",gridTemplateColumns:"28px 1fr 28px 28px 28px 28px 28px 36px",gap:0,padding:"9px 12px",background:bg,borderLeft,alignItems:"center",fontSize:13}}>
                <div style={{fontWeight:700,color:row.pos<=4?"#003da5":row.pos>=8?"#dc2626":"#44403c"}}>{row.pos}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                  <span style={{fontSize:14}}>{row.badge}</span>
                  <span style={{fontWeight:600,fontSize:12,color:"#1c1917",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.team}</span>
                </div>
                <div style={{textAlign:"center",color:"#78716c",fontSize:12}}>{row.p}</div>
                <div style={{textAlign:"center",fontWeight:600,color:"#16a34a",fontSize:12}}>{row.w}</div>
                <div style={{textAlign:"center",color:"#78716c",fontSize:12}}>{row.d}</div>
                <div style={{textAlign:"center",color:"#dc2626",fontSize:12}}>{row.l}</div>
                <div style={{textAlign:"center",color:gd>=0?"#16a34a":"#dc2626",fontSize:12,fontWeight:600}}>{gd>0?"+":""}{gd}</div>
                <div style={{textAlign:"center",fontWeight:800,color:"#1c1917",fontSize:13}}>{row.pts}</div>
              </div>
            );
          })}
          {/* Legend */}
          <div style={{padding:"8px 12px",display:"flex",gap:16,fontSize:10,color:"#78716c",borderTop:"1px solid rgba(0,0,0,.06)"}}>
            <span><span style={{color:"#003da5",fontWeight:700}}>■</span> UCL qualifier</span>
            <span><span style={{color:"#dc2626",fontWeight:700}}>■</span> Relegation</span>
          </div>
        </div>

        {/* Top Scorers */}
        <h3 className="sh" style={{marginBottom:10}}>⚽ Top Scorers</h3>
        <div style={{display:"flex",gap:4,marginBottom:4,padding:"6px 12px",fontSize:11,fontWeight:700,color:"#78716c"}}>
          <div style={{flex:1}}>Player</div>
          <div style={{width:80}}>Club</div>
          <div style={{width:40,textAlign:"center"}}>Goals</div>
        </div>
        {TOP_SCORERS.map((s,i)=>(
          <div key={i} className="c" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",marginBottom:6}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"#9ca3af":i===2?"#b87333":"rgba(0,0,0,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:i<=2?"white":"#78716c",flexShrink:0}}>
              {i+1}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,color:"#1c1917"}}>{s.flag} {s.name}</div>
            </div>
            <div style={{width:80,fontSize:11,color:"#78716c",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.team}</div>
            <div style={{width:40,textAlign:"center",fontWeight:900,fontSize:16,color:"#003da5"}}>{s.goals}</div>
          </div>
        ))}
        <div style={{background:"rgba(14,116,144,.06)",borderRadius:12,padding:"10px 14px",marginTop:4,fontSize:12,color:"#164e63",display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:16}}>📊</span>
          <span>Live top scorer stats on <span style={{fontWeight:700,cursor:"pointer",textDecoration:"underline"}} onClick={()=>window.open("https://www.sofascore.com/football/croatia/hnl","_blank","noopener,noreferrer")}>Sofascore ↗</span></span>
        </div>

        {/* Fixtures */}
        <h3 className="sh" style={{margin:"20px 0 10px"}}>📅 Fixtures & Results</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {label:"This Week's Fixtures",icon:"📅",url:"https://www.flashscore.com/football/croatia/hnl/",color:"#e85d04"},
            {label:"Live Scores Now",icon:"🔴",url:"https://www.sofascore.com/football/croatia/hnl",color:"#dc2626"},
            {label:"HNL Match Videos",icon:"▶️",url:"https://hnl.hr",color:"#003da5"},
            {label:"Full Season Results",icon:"📋",url:"https://www.flashscore.com/football/croatia/hnl/results/",color:"#0e7490"},
          ].map(l=>(
            <div key={l.label} className="tc"
              style={{padding:"14px",textAlign:"center",cursor:"pointer",borderTop:"3px solid "+l.color}}
              onClick={()=>window.open(l.url,"_blank","noopener,noreferrer")}>
              <div style={{fontSize:26,marginBottom:6}}>{l.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:l.color}}>{l.label} ↗</div>
            </div>
          ))}
        </div>
      </>}

      {/* ── TEAMS TAB ── */}
      {tab==="teams"&&<>
        {/* Vatreni hero */}
        <div style={{background:"linear-gradient(135deg,#dc2626 0%,#b91c1c 100%)",borderRadius:16,padding:"16px 18px",marginBottom:16,color:"white"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:42}}>🇭🇷</div>
            <div>
              <div style={{fontSize:11,fontWeight:700,opacity:.8,textTransform:"uppercase",letterSpacing:.5}}>National Team</div>
              <div style={{fontSize:20,fontWeight:900}}>Vatreni — The Blazing Ones</div>
              <div style={{fontSize:12,opacity:.85,marginTop:2}}>FIFA Top 10 · 40M fans worldwide</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>
            {[["🥈","2018","World Cup Final"],["🥉","2022","WC 3rd Place"],["⭐","2023","Nations League"]].map(([icon,yr,desc])=>(
              <div key={yr} style={{background:"rgba(255,255,255,.15)",borderRadius:10,padding:"8px",textAlign:"center"}}>
                <div style={{fontSize:18}}>{icon}</div>
                <div style={{fontSize:12,fontWeight:800}}>{yr}</div>
                <div style={{fontSize:10,opacity:.85}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,fontSize:12,opacity:.9,lineHeight:1.6}}>
            Known for tiki-taka midfield mastery. Modrić, Kovačić, Brozović — all from Croatia's production line. The chequered red-and-white jersey (<em>kockice</em>) is one of football's most iconic kits.
          </div>
        </div>

        {/* Club cards */}
        {TEAMS_DETAIL.map((t,i)=>(
          <div key={i} className="c" style={{marginBottom:14,borderLeft:"4px solid "+t.color,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:44,height:44,borderRadius:12,background:t.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {t.badge}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:t.color}}>{t.name}</div>
                <div style={{fontSize:11,color:"#78716c"}}>
                  {t.city} · Est. {t.founded} · {t.stadium} ({t.capacity})
                </div>
              </div>
              <div style={{textAlign:"center",flexShrink:0}}>
                <div style={{fontSize:18,fontWeight:900,color:t.color}}>{t.titles}</div>
                <div style={{fontSize:9,color:"#78716c",fontWeight:600}}>TITLES</div>
              </div>
            </div>

            <div style={{fontSize:13,color:"#44403c",lineHeight:1.65,marginBottom:10}}>
              {t.desc}
            </div>

            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {t.achievements.map((a,j)=>(
                <span key={j} style={{background:t.color+"12",color:t.color,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:20}}>
                  {a}
                </span>
              ))}
            </div>

            <div style={{background:"rgba(0,0,0,.03)",borderRadius:10,padding:"8px 12px"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#78716c",marginBottom:2}}>
                🎵 Chant · Ultras: <span style={{color:t.color}}>{t.ultras}</span>
              </div>
              <div style={{fontSize:12,fontStyle:"italic",color:"#1c1917",marginBottom:2}}>"{t.chant}"</div>
              <div style={{fontSize:11,color:"#78716c"}}>"{t.chantEn}"</div>
            </div>
          </div>
        ))}
      </>}

      {/* ── VOCAB TAB ── */}
      {tab==="vocab"&&<>
        <h3 className="sh" style={{marginBottom:10}}>⚽ Football Vocabulary</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:20}}>
          {[...FOOTBALL.vocab,...VOCAB_EXTRA].map((w,i)=>(
            <div key={i} className="c" style={{padding:"10px 12px",cursor:"pointer"}} onClick={()=>speak(w[0])}>
              <div style={{fontSize:13,fontWeight:700,color:"#003da5"}}>{w[0]} 🔊</div>
              <div style={{fontSize:11,color:"#78716c",marginTop:2}}>{w[1]}</div>
            </div>
          ))}
        </div>

        <h3 className="sh" style={{marginBottom:10}}>🗣️ Match Day Phrases</h3>
        {[
          ["Idemo, Hrvatska!", "Come on, Croatia!", "battle cry"],
          ["Daj gol!", "Score a goal!", "cheer"],
          ["Kakva utakmica!", "What a match!", "reaction"],
          ["Sudac je lopov!", "The referee is a thief!", "classic complaint"],
          ["Koji penal!", "What a penalty!", "reaction"],
          ["Odlično!", "Excellent!", "praise"],
          ["Promašaj!", "A miss!", "reaction"],
          ["Živi bili pa vidjeli!", "May we live to see it! (ironic)", "when things go wrong"],
        ].map((p,i)=>(
          <div key={i} className="c" style={{marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:"10px 14px"}}
            onClick={()=>speak(p[0])}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#164e63"}}>{p[0]} 🔊</div>
              <div style={{fontSize:13,color:"#0e7490"}}>{p[1]}</div>
            </div>
            <div style={{fontSize:10,background:"rgba(14,116,144,.1)",color:"#0e7490",padding:"3px 8px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap"}}>
              {p[2]}
            </div>
          </div>
        ))}

        <h3 className="sh" style={{margin:"20px 0 10px"}}>🤽 Water Polo</h3>
        <div style={{background:"rgba(14,116,144,.06)",borderRadius:12,padding:"10px 14px",marginBottom:10,fontSize:12,color:"#164e63"}}>
          Croatia is a global water polo powerhouse — Jug Dubrovnik and Mladost Zagreb compete at the highest European level.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {FOOTBALL.waterPolo.map((w,i)=>(
            <div key={i} className="c" style={{padding:"10px 12px",cursor:"pointer"}} onClick={()=>speak(w[0])}>
              <div style={{fontSize:13,fontWeight:700,color:"#0e7490"}}>{w[0]} 🔊</div>
              <div style={{fontSize:11,color:"#78716c",marginTop:2}}>{w[1]}</div>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}
