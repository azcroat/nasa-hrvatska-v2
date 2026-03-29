import React, { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
//  CROATIAN-BORN NCAA / NAIA BASKETBALL PLAYERS
//
//  UPDATE INSTRUCTIONS (start of each college basketball season):
//  1. Verify each player is still enrolled and on roster via their bio link
//  2. Update stats in the `note` field
//  3. Add new arrivals · Remove graduated/transferred players
//  4. The Live Database link below always stays current automatically
//
//  Season: 2025–26
// ═══════════════════════════════════════════════════════════════════════════════

const SEASON = "2025–26";

const PLAYERS = [

  // ── NCAA DIVISION I ─────────────────────────────────────────────────────────

  {
    name: "Zvonimir Ivišić",
    pos: "Center", ht: '7\'2"', wt: "245 lbs",
    school: "Illinois Fighting Illini",
    conf: "Big Ten", div: "NCAA D1",
    born: "Vodice", yr: "Graduate",
    jersey: "#24",
    stat: "Career: 7.6 ppg · 4.0 rpg · 1.7 bpg · 49% FG · 38% 3PT",
    badge: "Twin Tower",
    note: "Twin of Tomislav — transferred from Arkansas after stints at Kentucky. Both brothers starting for Illinois in 2025–26.",
    bio: "https://fightingillini.com/sports/mens-basketball/roster/zvonimir-ivisic/15207",
    stats: "https://www.sports-reference.com/cbb/players/zvonimir-ivisic-1.html",
    espn: "https://www.espn.com/mens-college-basketball/player/_/id/5174665/zvonimir-ivisic",
    schoolColor: "#e84a27",
    schoolSecondary: "#13294b",
  },
  {
    name: "Tomislav Ivišić",
    pos: "Center", ht: '7\'1"', wt: "230 lbs",
    school: "Illinois Fighting Illini",
    conf: "Big Ten", div: "NCAA D1",
    born: "Vodice", yr: "Sophomore",
    jersey: "#15",
    stat: "2024-25: 13.0 ppg · 7.7 rpg · 2.3 apg · 1.2 bpg · 35.7% 3PT",
    badge: "Breakout Star",
    note: "Twin of Zvonimir — joined Illinois in 2024 from SC Derby (Montenegro). Led team in rebounds & blocks. Big Ten's most underrated passer.",
    bio: "https://fightingillini.com/sports/mens-basketball/roster/tomislav-ivisic/15201",
    stats: "https://www.sports-reference.com/cbb/players/tomislav-ivisic-1.html",
    espn: "https://www.espn.com/mens-college-basketball/player/_/id/5214642/tomislav-ivisic",
    schoolColor: "#e84a27",
    schoolSecondary: "#13294b",
  },
  {
    name: "Andrija Jelavić",
    pos: "Power Forward", ht: '6\'11"', wt: "215 lbs",
    school: "Kentucky Wildcats",
    conf: "SEC", div: "NCAA D1",
    born: "Zagreb", yr: "Sophomore",
    jersey: "#4",
    stat: "Pre-NCAA (Mega Superbet): 10.7 ppg · 7.4 rpg · 1.6 apg · 7'2\" wingspan",
    badge: "Top Prospect",
    note: "Considered one of Europe's top 2025 international prospects. Was cleared by NCAA after pro seasons in Serbia. Future NBA candidate.",
    bio: "https://ukathletics.com/sports/mbball/roster/player/andrija-jelavic/",
    stats: "https://www.espn.com/mens-college-basketball/player/_/id/5281347/andrija-jelavic",
    espn: "https://www.espn.com/mens-college-basketball/player/_/id/5281347/andrija-jelavic",
    schoolColor: "#0033a0",
    schoolSecondary: "#ffffff",
  },
  {
    name: "Ivan Matleković",
    pos: "Center", ht: '7\'0"', wt: "245 lbs",
    school: "North Carolina Tar Heels",
    conf: "ACC", div: "NCAA D1",
    born: "Sisak", yr: "Sophomore",
    jersey: "#32",
    stat: "2024-25 at High Point: 13 pts · 9 reb · 2 blocks in 5 games · 75% FG",
    badge: "UNC Transfer",
    note: "Transferred to UNC from High Point. Previously played for HAKK Mladost Zagreb and Cedevita Olimpija U18. 3 years eligibility remaining.",
    bio: "https://goheels.com/sports/mens-basketball/roster/ivan-matlekovic/27326",
    stats: "https://www.sports-reference.com/cbb/players/ivan-matlekovic-1.html",
    espn: "https://www.espn.com/mens-college-basketball/player/_/id/5241596/ivan-matlekovic",
    schoolColor: "#4b9cd3",
    schoolSecondary: "#13294b",
  },
  {
    name: "Tomislav Buljan",
    pos: "Power Forward", ht: '6\'9"', wt: "220 lbs",
    school: "New Mexico Lobos",
    conf: "Mountain West", div: "NCAA D1",
    born: "Zadar", yr: "Freshman",
    jersey: "#21",
    stat: "2025-26: ~12 ppg · ~10 rpg · MW offensive rebounding leader",
    badge: "Double-Double",
    note: "22-year-old freshman — former Croatian pro who dominated Mountain West in his first season. Had 19 pts & 21 boards in one game vs. Miss. State.",
    bio: "https://golobos.com/sports/mbball/roster/player/tomislav-buljan",
    stats: "https://www.sports-reference.com/cbb/players/tomislav-buljan-1.html",
    espn: "https://www.espn.com/mens-college-basketball/player/_/id/5240409/",
    schoolColor: "#ba0c2f",
    schoolSecondary: "#63666a",
  },
  {
    name: "Marko Ljubičić",
    pos: "Forward", ht: '6\'10"', wt: "215 lbs",
    school: "Manhattan Jaspers",
    conf: "MAAC", div: "NCAA D1",
    born: "Zagreb", yr: "Sophomore",
    jersey: "#14",
    stat: "2024-25 (freshman): 1.0 ppg · 53% FG · 18 games played",
    badge: "Cedevita Product",
    note: "Former KK Cedevita Junior standout. Won 2× Croatian U19 championships. Played for Croatia U20 national team. Brother Krešimir plays pro in Croatia.",
    bio: "https://gojaspers.com/sports/mens-basketball/roster/marko-ljubicic/11800",
    stats: "https://www.espn.com/mens-college-basketball/player/_/id/5246878/marko-ljubicic",
    espn: "https://www.espn.com/mens-college-basketball/player/_/id/5246878/marko-ljubicic",
    schoolColor: "#005EB8",
    schoolSecondary: "#003087",
  },

  // ── NCAA DIVISION II ─────────────────────────────────────────────────────────

  {
    name: "Filip Brkić",
    pos: "Guard", ht: '6\'4"', wt: "190 lbs",
    school: "UVA Wise Cavaliers",
    conf: "SAC", div: "NCAA D2",
    born: "Zagreb", yr: "Junior",
    jersey: "#3",
    stat: "HS (Foxcroft Academy): 17 ppg · 43% FG · All-Conference 1st Team",
    badge: "SAC Guard",
    note: "Played for Croatia U15 national team. Prepped at Foxcroft Academy (Maine) and Florida Coastal Prep before joining UVA Wise.",
    bio: "https://uvawisecavs.com/sports/mens-basketball/roster/filip-brkic-/9675",
    stats: "https://www.espn.com/mens-college-basketball/player/_/id/5261270/filip-brkic",
    espn: "https://www.espn.com/mens-college-basketball/player/_/id/5261270/filip-brkic",
    schoolColor: "#002868",
    schoolSecondary: "#BF0A30",
  },
];

// Division labels for grouping
const DIV_ORDER = ["NCAA D1", "NCAA D2", "NCAA D3", "NAIA"];
const DIV_COLORS = {
  "NCAA D1": { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", badge: "#1d4ed8" },
  "NCAA D2": { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", badge: "#16a34a" },
  "NCAA D3": { bg: "#fefce8", border: "#fde68a", text: "#92400e", badge: "#ca8a04" },
  "NAIA":    { bg: "#fdf4ff", border: "#e9d5ff", text: "#6b21a8", badge: "#7c3aed" },
};

function PlayerCard({ p }) {
  const dc = DIV_COLORS[p.div] || DIV_COLORS["NCAA D1"];

  return (
    <div style={{
      background: "white",
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 14,
      boxShadow: "0 4px 20px rgba(0,0,0,.08)",
      border: "1px solid rgba(0,0,0,.06)",
    }}>

      {/* ── School banner ── */}
      <div style={{
        background: `linear-gradient(135deg, ${p.schoolColor} 0%, ${p.schoolColor}cc 100%)`,
        padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          fontSize: 32, lineHeight: 1, flexShrink: 0,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,.3))",
        }}>🇭🇷</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* School name — most prominent element */}
          <div style={{
            fontSize: 14, fontWeight: 900, color: "white",
            letterSpacing: "0.01em", lineHeight: 1.2,
          }}>{p.school}</div>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,.8)",
            marginTop: 2, fontWeight: 600,
          }}>{p.conf} · {p.div}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{
            background: "rgba(255,255,255,.2)",
            borderRadius: 20, padding: "4px 10px",
            fontSize: 10, fontWeight: 800, color: "white",
            border: "1px solid rgba(255,255,255,.3)",
          }}>{p.badge}</div>
        </div>
      </div>

      {/* ── Player identity ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 }}>
              {p.name}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: 600 }}>
              {p.jersey && `${p.jersey} · `}{p.pos} · {p.ht} / {p.wt}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{
              background: dc.bg, color: dc.text,
              border: `1.5px solid ${dc.border}`,
              borderRadius: 20, padding: "3px 10px",
              fontSize: 10, fontWeight: 800,
            }}>{p.div}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, fontWeight: 600 }}>
              {p.yr}
            </div>
          </div>
        </div>

        {/* Born in */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "#f0f9ff", color: "#0369a1",
          border: "1px solid #bae6fd",
          borderRadius: 20, padding: "4px 12px",
          fontSize: 11, fontWeight: 700, marginBottom: 10,
        }}>
          📍 Born: {p.born}, Croatia
        </div>

        {/* Stat line */}
        <div style={{
          background: `${p.schoolColor}0d`,
          borderLeft: `3px solid ${p.schoolColor}`,
          borderRadius: "0 8px 8px 0",
          padding: "8px 12px",
          fontSize: 12, fontWeight: 700,
          color: "#1e293b",
          marginBottom: 10,
          fontFamily: "'Outfit',sans-serif",
        }}>
          📊 {p.stat}
        </div>

        {/* Note */}
        <div style={{
          fontSize: 11.5, color: "#44403c", lineHeight: 1.75,
          marginBottom: 14,
        }}>
          {p.note}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, paddingBottom: 14 }}>
          <button
            onClick={() => window.open(p.bio, "_blank", "noopener,noreferrer")}
            style={{
              flex: 1, padding: "10px 12px",
              background: p.schoolColor,
              color: "white", border: "none",
              borderRadius: 10, fontSize: 12, fontWeight: 800,
              cursor: "pointer",
              boxShadow: `0 3px 10px ${p.schoolColor}50`,
            }}>
            👤 Official Bio ↗
          </button>
          <button
            onClick={() => window.open(p.stats, "_blank", "noopener,noreferrer")}
            style={{
              flex: 1, padding: "10px 12px",
              background: "white",
              color: p.schoolColor,
              border: `2px solid ${p.schoolColor}40`,
              borderRadius: 10, fontSize: 12, fontWeight: 800,
              cursor: "pointer",
            }}>
            📊 Stats ↗
          </button>
          <button
            onClick={() => window.open(p.espn, "_blank", "noopener,noreferrer")}
            style={{
              padding: "10px 14px",
              background: "#ff6600",
              color: "white", border: "none",
              borderRadius: 10, fontSize: 12, fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 3px 10px rgba(255,102,0,.4)",
              flexShrink: 0,
            }}>
            ESPN
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CroatiaAthletes({ goBack }) {
  const [divFilter, setDivFilter] = useState("all");

  const divCounts = PLAYERS.reduce((acc, p) => {
    acc[p.div] = (acc[p.div] || 0) + 1;
    return acc;
  }, {});

  const filtered = divFilter === "all"
    ? PLAYERS
    : PLAYERS.filter(p => p.div === divFilter);

  // Group filtered by division
  const grouped = DIV_ORDER.reduce((acc, div) => {
    const group = filtered.filter(p => p.div === div);
    if (group.length) acc.push({ div, players: group });
    return acc;
  }, []);

  const divTabs = [
    { key: "all", label: "All", count: PLAYERS.length },
    ...DIV_ORDER.filter(d => divCounts[d]).map(d => ({
      key: d, label: d, count: divCounts[d],
    })),
  ];

  return (
    <div className="scr-wrap">
      <button className="b bg" style={{ marginBottom: 16, fontSize: 13 }} onClick={goBack}>
        ← Back
      </button>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #003da5 0%, #001f6b 60%, #dc2626 100%)",
        borderRadius: 22, padding: "22px 20px",
        marginBottom: 20, color: "white",
        boxShadow: "0 8px 32px rgba(0,61,165,.35)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,.05)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{ position:"absolute",bottom:-20,left:60,width:100,height:100,background:"rgba(220,38,38,.1)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>🇭🇷🏀</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, lineHeight: 1.2, letterSpacing: "-.01em" }}>
            Croatians in U.S. College Basketball
          </div>
          <div style={{ fontSize: 12, opacity: .85, lineHeight: 1.6, marginBottom: 14 }}>
            Croatian-born players currently on NCAA & NAIA rosters — tracked and updated every season
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              `${PLAYERS.length} players tracked`,
              `${[...new Set(PLAYERS.map(p => p.school))].length} schools`,
              `${SEASON} Season`,
              `${[...new Set(PLAYERS.filter(p=>p.div==="NCAA D1").map(p=>p.conf))].length} conferences`,
            ].map(t => (
              <span key={t} style={{ background:"rgba(255,255,255,.18)", borderRadius:20, padding:"4px 11px", fontSize:11, fontWeight:800 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Live database CTA */}
      <div
        onClick={() => window.open("https://basketball.realgm.com/ncaa/birth-countries/3/Croatia", "_blank", "noopener,noreferrer")}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "13px 16px",
          background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
          borderRadius: 14, marginBottom: 16,
          border: "1.5px solid #86efac",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(22,163,74,.1)",
        }}>
        <div style={{ fontSize: 28 }}>🔄</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>Live Database — RealGM</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#166534", opacity: .75 }}>
            Always up-to-date · All divisions · Updates automatically each season
          </div>
        </div>
        <span style={{ fontSize: 18, color: "#16a34a", fontWeight: 800 }}>↗</span>
      </div>

      {/* Division filter tabs */}
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:16, scrollbarWidth:"none" }}>
        {divTabs.map(t => {
          const active = divFilter === t.key;
          const dc = t.key !== "all" ? DIV_COLORS[t.key] : null;
          return (
            <button key={t.key} onClick={() => setDivFilter(t.key)} style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 20,
              border: active ? "none" : "1.5px solid #e2e8f0",
              background: active ? "#003da5" : "white",
              color: active ? "white" : "#44403c",
              fontSize: 11.5, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              boxShadow: active ? "0 2px 10px rgba(0,61,165,.3)" : "none",
            }}>
              {t.label}
              <span style={{
                background: active ? "rgba(255,255,255,.25)" : "#e2e8f0",
                color: active ? "white" : "#6b7280",
                borderRadius: "50%", width: 18, height: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 900,
              }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Player groups */}
      {grouped.map(({ div, players }) => (
        <div key={div}>
          {/* Division header */}
          {divFilter === "all" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 12,
            }}>
              <div style={{
                height: 2, flex: 1,
                background: `linear-gradient(90deg,${DIV_COLORS[div]?.badge || "#94a3b8"},transparent)`,
              }}/>
              <span style={{
                fontSize: 10, fontWeight: 900,
                color: DIV_COLORS[div]?.badge || "#94a3b8",
                letterSpacing: ".1em",
                background: DIV_COLORS[div]?.bg,
                padding: "3px 10px",
                borderRadius: 20,
                border: `1px solid ${DIV_COLORS[div]?.border}`,
              }}>
                {div} · {players.length} player{players.length > 1 ? "s" : ""}
              </span>
              <div style={{
                height: 2, flex: 1,
                background: `linear-gradient(270deg,${DIV_COLORS[div]?.badge || "#94a3b8"},transparent)`,
              }}/>
            </div>
          )}
          {players.map((p) => <PlayerCard key={p.name} p={p} />)}
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: 8, padding: "14px 16px",
        background: "#f8fafc", borderRadius: 14,
        border: "1px solid #e2e8f0",
        fontSize: 11, color: "#94a3b8", lineHeight: 1.8,
        marginBottom: 16,
      }}>
        <div style={{ fontWeight: 800, color: "#64748b", marginBottom: 4 }}>
          📋 About this list
        </div>
        Includes only Croatian-born players — not Croatian-heritage players born elsewhere. Data for {SEASON} season. Rosters change with the transfer portal every spring/summer.{"\n\n"}
        <strong style={{color:"#64748b"}}>D3 & NAIA note:</strong> Hundreds of Croatian players compete at D3 and NAIA programs — they receive far less media coverage and are nearly impossible to surface through news searches. The <strong style={{color:"#166534"}}>Live Database ↗</strong> above covers every division and updates automatically.
      </div>
    </div>
  );
}
