import React, { useState, useEffect, useRef, useCallback } from 'react';
import { H } from '../../data.jsx';
import { speak } from '../../lib/audio.js';

// ─── Scene Data ──────────────────────────────────────────────────────────────

const SCENES = [
  {
    id: "kitchen",
    title: "Kuhinja",
    titleEn: "The Kitchen",
    icon: "🍳",
    emoji: "🏠",
    color: "#d97706",
    bg: "#fffbeb",
    sceneStyle: { background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)" },
    items: [
      { id:"fridge",   hr:"hladnjak",   en:"fridge",      icon:"🧊", note:"m.", x:12, y:20 },
      { id:"stove",    hr:"štednjak",   en:"stove",       icon:"🔥", note:"m.", x:30, y:55 },
      { id:"sink",     hr:"sudoper",    en:"sink",        icon:"🚿", note:"m.", x:55, y:50 },
      { id:"table",    hr:"stol",       en:"table",       icon:"🪑", note:"m.", x:50, y:78 },
      { id:"window",   hr:"prozor",     en:"window",      icon:"🪟", note:"m.", x:75, y:20 },
      { id:"cup",      hr:"šalica",     en:"cup",         icon:"☕", note:"f.", x:40, y:45 },
      { id:"plate",    hr:"tanjur",     en:"plate",       icon:"🍽️", note:"m.", x:52, y:75 },
      { id:"fork",     hr:"vilica",     en:"fork",        icon:"🍴", note:"f.", x:60, y:75 },
      { id:"knife",    hr:"nož",        en:"knife",       icon:"🔪", note:"m.", x:65, y:75 },
      { id:"bottle",   hr:"boca",       en:"bottle",      icon:"🍶", note:"f.", x:20, y:45 },
      { id:"bread",    hr:"kruh",       en:"bread",       icon:"🍞", note:"m.", x:35, y:70 },
      { id:"chair",    hr:"stolica",    en:"chair",       icon:"🪑", note:"f.", x:55, y:88 },
    ]
  },
  {
    id: "market",
    title: "Tržnica",
    titleEn: "The Market",
    icon: "🛒",
    emoji: "🏪",
    color: "#16a34a",
    bg: "#f0fdf4",
    sceneStyle: { background: "linear-gradient(180deg, #dcfce7 0%, #bbf7d0 100%)" },
    items: [
      { id:"apple",    hr:"jabuka",     en:"apple",       icon:"🍎", note:"f.", x:15, y:40 },
      { id:"orange",   hr:"naranča",    en:"orange",      icon:"🍊", note:"f.", x:28, y:40 },
      { id:"tomato",   hr:"rajčica",    en:"tomato",      icon:"🍅", note:"f.", x:40, y:40 },
      { id:"cucumber", hr:"krastavac",  en:"cucumber",    icon:"🥒", note:"m.", x:55, y:40 },
      { id:"cheese",   hr:"sir",        en:"cheese",      icon:"🧀", note:"m.", x:70, y:45 },
      { id:"fish",     hr:"riba",       en:"fish",        icon:"🐟", note:"f.", x:20, y:65 },
      { id:"bread2",   hr:"kruh",       en:"bread",       icon:"🍞", note:"m.", x:35, y:65 },
      { id:"honey",    hr:"med",        en:"honey",       icon:"🍯", note:"m.", x:50, y:65 },
      { id:"egg",      hr:"jaje",       en:"egg",         icon:"🥚", note:"n.", x:65, y:65 },
      { id:"grapes",   hr:"grožđe",     en:"grapes",      icon:"🍇", note:"n.", x:80, y:40 },
      { id:"onion",    hr:"luk",        en:"onion",       icon:"🧅", note:"m.", x:10, y:65 },
      { id:"bag",      hr:"torba",      en:"bag",         icon:"👜", note:"f.", x:80, y:70 },
      { id:"basket",   hr:"košara",     en:"basket",      icon:"🧺", note:"f.", x:45, y:80 },
    ]
  },
  {
    id: "cafe",
    title: "Kafić",
    titleEn: "The Café",
    icon: "☕",
    emoji: "🏙️",
    color: "#92400e",
    bg: "#fffbeb",
    sceneStyle: { background: "linear-gradient(180deg, #fef3c7 0%, #fde68a 100%)" },
    items: [
      { id:"coffee",   hr:"kava",       en:"coffee",      icon:"☕", note:"f.", x:30, y:55 },
      { id:"tea",      hr:"čaj",        en:"tea",         icon:"🍵", note:"m.", x:45, y:55 },
      { id:"juice",    hr:"sok",        en:"juice",       icon:"🥤", note:"m.", x:60, y:55 },
      { id:"water",    hr:"voda",       en:"water",       icon:"💧", note:"f.", x:20, y:55 },
      { id:"cake",     hr:"torta",      en:"cake",        icon:"🎂", note:"f.", x:35, y:75 },
      { id:"menu",     hr:"jelovnik",   en:"menu",        icon:"📋", note:"m.", x:15, y:35 },
      { id:"waiter",   hr:"konobar",    en:"waiter",      icon:"🧑‍🍳", note:"m.", x:70, y:40 },
      { id:"chair2",   hr:"stolica",    en:"chair",       icon:"🪑", note:"f.", x:50, y:85 },
      { id:"table2",   hr:"stol",       en:"table",       icon:"🪑", note:"m.", x:40, y:80 },
      { id:"spoon",    hr:"žlica",      en:"spoon",       icon:"🥄", note:"f.", x:55, y:70 },
      { id:"sugar",    hr:"šećer",      en:"sugar",       icon:"🍬", note:"m.", x:25, y:70 },
      { id:"newspaper",hr:"novine",     en:"newspaper",   icon:"📰", note:"f.pl.", x:80, y:35 },
    ]
  },
  {
    id: "beach",
    title: "Plaža",
    titleEn: "The Beach",
    icon: "🏖️",
    emoji: "🌊",
    color: "#0891b2",
    bg: "#ecfeff",
    sceneStyle: { background: "linear-gradient(180deg, #7dd3fc 0%, #38bdf8 50%, #fde68a 50%, #fbbf24 100%)" },
    items: [
      { id:"sea",      hr:"more",       en:"sea",         icon:"🌊", note:"n.", x:50, y:25 },
      { id:"sand",     hr:"pijesak",    en:"sand",        icon:"⏳", note:"m.", x:50, y:70 },
      { id:"sun",      hr:"sunce",      en:"sun",         icon:"☀️", note:"n.", x:80, y:10 },
      { id:"umbrella", hr:"suncobran",  en:"parasol",     icon:"⛱️", note:"m.", x:25, y:55 },
      { id:"towel",    hr:"ručnik",     en:"towel",       icon:"🏊", note:"m.", x:40, y:75 },
      { id:"boat",     hr:"brod",       en:"boat",        icon:"⛵", note:"m.", x:70, y:30 },
      { id:"shell",    hr:"školjka",    en:"shell",       icon:"🐚", note:"f.", x:60, y:80 },
      { id:"icecream", hr:"sladoled",   en:"ice cream",   icon:"🍦", note:"m.", x:15, y:45 },
      { id:"glasses",  hr:"naočale",    en:"sunglasses",  icon:"😎", note:"f.pl.", x:35, y:65 },
      { id:"hat",      hr:"šešir",      en:"hat",         icon:"👒", note:"m.", x:55, y:60 },
      { id:"ball",     hr:"lopta",      en:"ball",        icon:"⚽", note:"f.", x:70, y:70 },
      { id:"fish2",    hr:"riba",       en:"fish",        icon:"🐟", note:"f.", x:45, y:30 },
    ]
  },
  {
    id: "livingroom",
    title: "Dnevna soba",
    titleEn: "The Living Room",
    icon: "🛋️",
    emoji: "🏠",
    color: "#7c3aed",
    bg: "#faf5ff",
    sceneStyle: { background: "linear-gradient(180deg, #ede9fe 0%, #ddd6fe 100%)" },
    items: [
      { id:"sofa",     hr:"kauč",       en:"sofa",        icon:"🛋️", note:"m.", x:40, y:60 },
      { id:"tv",       hr:"televizor",  en:"TV",          icon:"📺", note:"m.", x:50, y:30 },
      { id:"lamp",     hr:"lampa",      en:"lamp",        icon:"💡", note:"f.", x:20, y:35 },
      { id:"book2",    hr:"knjiga",     en:"book",        icon:"📚", note:"f.", x:75, y:55 },
      { id:"phone2",   hr:"telefon",    en:"phone",       icon:"📱", note:"m.", x:30, y:70 },
      { id:"clock",    hr:"sat",        en:"clock",       icon:"🕰️", note:"m.", x:80, y:20 },
      { id:"painting", hr:"slika",      en:"painting",    icon:"🖼️", note:"f.", x:50, y:15 },
      { id:"carpet",   hr:"tepih",      en:"carpet",      icon:"🏠", note:"m.", x:45, y:80 },
      { id:"door",     hr:"vrata",      en:"door",        icon:"🚪", note:"n.pl.", x:15, y:50 },
      { id:"curtain",  hr:"zavjesa",    en:"curtain",     icon:"🪟", note:"f.", x:75, y:25 },
      { id:"remote",   hr:"daljinski",  en:"remote",      icon:"📡", note:"m.", x:60, y:68 },
    ]
  },
  {
    id: "classroom",
    title: "Razred",
    titleEn: "The Classroom",
    icon: "📚",
    emoji: "🏫",
    color: "#0369a1",
    bg: "#f0f9ff",
    sceneStyle: { background: "linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)" },
    items: [
      { id:"board",    hr:"ploča",      en:"blackboard",  icon:"🟩", note:"f.", x:45, y:20 },
      { id:"chalk",    hr:"kreda",      en:"chalk",       icon:"✏️", note:"f.", x:30, y:35 },
      { id:"desk",     hr:"klupa",      en:"desk",        icon:"🪑", note:"f.", x:35, y:65 },
      { id:"pencil",   hr:"olovka",     en:"pencil",      icon:"✏️", note:"f.", x:55, y:55 },
      { id:"ruler",    hr:"ravnalo",    en:"ruler",       icon:"📏", note:"n.", x:65, y:55 },
      { id:"backpack", hr:"ruksak",     en:"backpack",    icon:"🎒", note:"m.", x:20, y:70 },
      { id:"notebook", hr:"bilježnica", en:"notebook",    icon:"📓", note:"f.", x:45, y:72 },
      { id:"map",      hr:"karta",      en:"map",         icon:"🗺️", note:"f.", x:75, y:20 },
      { id:"teacher",  hr:"učitelj",    en:"teacher",     icon:"👨‍🏫", note:"m.", x:20, y:35 },
      { id:"globe",    hr:"globus",     en:"globe",       icon:"🌍", note:"m.", x:80, y:40 },
      { id:"scissors", hr:"škare",      en:"scissors",    icon:"✂️", note:"f.pl.", x:70, y:70 },
    ]
  },
  {
    id: "city",
    title: "Grad",
    titleEn: "The City",
    icon: "🏙️",
    emoji: "🌆",
    color: "#374151",
    bg: "#f9fafb",
    sceneStyle: { background: "linear-gradient(180deg, #93c5fd 0%, #e5e7eb 60%, #9ca3af 60%, #6b7280 100%)" },
    items: [
      { id:"building",  hr:"zgrada",    en:"building",    icon:"🏢", note:"f.", x:20, y:40 },
      { id:"church",    hr:"crkva",     en:"church",      icon:"⛪", note:"f.", x:70, y:35 },
      { id:"tram",      hr:"tramvaj",   en:"tram",        icon:"🚋", note:"m.", x:45, y:65 },
      { id:"car",       hr:"auto",      en:"car",         icon:"🚗", note:"m.", x:25, y:70 },
      { id:"bike",      hr:"bicikl",    en:"bicycle",     icon:"🚲", note:"m.", x:60, y:72 },
      { id:"tree",      hr:"drvo",      en:"tree",        icon:"🌳", note:"n.", x:80, y:50 },
      { id:"bench",     hr:"klupa",     en:"bench",       icon:"🪑", note:"f.", x:40, y:75 },
      { id:"fountain",  hr:"fontana",   en:"fountain",    icon:"⛲", note:"f.", x:50, y:55 },
      { id:"shop",      hr:"dućan",     en:"shop",        icon:"🏪", note:"m.", x:35, y:45 },
      { id:"pharmacy",  hr:"ljekarna",  en:"pharmacy",    icon:"💊", note:"f.", x:15, y:50 },
      { id:"sky",       hr:"nebo",      en:"sky",         icon:"☁️", note:"n.", x:50, y:10 },
    ]
  },
  {
    id: "home",
    title: "Kuća",
    titleEn: "The Croatian Home",
    icon: "🏡",
    emoji: "🇭🇷",
    color: "#dc2626",
    bg: "#fef2f2",
    sceneStyle: { background: "linear-gradient(180deg, #fee2e2 0%, #fecaca 100%)" },
    items: [
      { id:"roof",     hr:"krov",       en:"roof",        icon:"🏠", note:"m.", x:50, y:10 },
      { id:"door2",    hr:"vrata",      en:"door",        icon:"🚪", note:"n.pl.", x:50, y:65 },
      { id:"garden",   hr:"vrt",        en:"garden",      icon:"🌿", note:"m.", x:20, y:75 },
      { id:"car2",     hr:"auto",       en:"car",         icon:"🚗", note:"m.", x:80, y:75 },
      { id:"chimney",  hr:"dimnjak",    en:"chimney",     icon:"🏭", note:"m.", x:65, y:15 },
      { id:"balcony",  hr:"balkon",     en:"balcony",     icon:"🏢", note:"m.", x:30, y:40 },
      { id:"stairs",   hr:"stepenice",  en:"stairs",      icon:"🪜", note:"f.pl.", x:55, y:75 },
      { id:"fence",    hr:"ograda",     en:"fence",       icon:"🔩", note:"f.", x:15, y:60 },
      { id:"mailbox",  hr:"poštanski sandučić", en:"mailbox", icon:"📬", note:"m.", x:75, y:60 },
      { id:"dog2",     hr:"pas",        en:"dog",         icon:"🐕", note:"m.", x:30, y:80 },
      { id:"flag",     hr:"zastava",    en:"flag",        icon:"🇭🇷", note:"f.", x:80, y:35 },
    ]
  },
];

// Total items across all scenes
const TOTAL_WORDS = SCENES.reduce((s, sc) => s + sc.items.length, 0);

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadDiscovered(sceneId) {
  try {
    const raw = localStorage.getItem(`nh_scene_${sceneId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveDiscovered(sceneId, set) {
  try { localStorage.setItem(`nh_scene_${sceneId}`, JSON.stringify([...set])); } catch {}
}

function loadSRS() {
  try {
    const raw = localStorage.getItem('nh_scene_srs');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSRS(set) {
  try { localStorage.setItem('nh_scene_srs', JSON.stringify([...set])); } catch {}
}

function loadSRSQueue() {
  try {
    const raw = localStorage.getItem('nh_scene_srs_queue');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSRSQueue(arr) {
  try { localStorage.setItem('nh_scene_srs_queue', JSON.stringify(arr)); } catch {}
}

// ─── Inline styles & CSS injection ───────────────────────────────────────────

const CSS = `
@keyframes vs-pulse {
  0%,100% { transform: translate(-50%,-50%) scale(1); }
  50%      { transform: translate(-50%,-50%) scale(1.12); }
}
@keyframes vs-discovered {
  0%   { transform: translate(-50%,-50%) scale(1); }
  40%  { transform: translate(-50%,-50%) scale(1.3); }
  70%  { transform: translate(-50%,-50%) scale(0.92); }
  100% { transform: translate(-50%,-50%) scale(1); }
}
@keyframes vs-popup-in {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes vs-confetti {
  0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(340px) rotate(720deg); opacity: 0; }
}
@keyframes vs-complete-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes vs-toast-in {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
.vs-pulse-anim     { animation: vs-pulse 2s infinite; }
.vs-discovered-anim{ animation: vs-discovered 0.45s ease; }
`;

let cssInjected = false;
function ensureCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ─── Confetti component ───────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4'];

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${(i / 28) * 100}%`,
    delay: `${(i * 0.07).toFixed(2)}s`,
    duration: `${1.2 + (i % 5) * 0.18}s`,
    size: 6 + (i % 4) * 2,
  }));
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:10 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:p.left, top:0,
          width:p.size, height:p.size,
          borderRadius: p.id % 3 === 0 ? '50%' : 2,
          background:p.color,
          animation:`vs-confetti ${p.duration} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ text, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position:'fixed', bottom:90, right:16, zIndex:9999,
      background:'#1c1917', color:'white', borderRadius:12,
      padding:'10px 16px', fontSize:13, fontWeight:600,
      boxShadow:'0 4px 20px rgba(0,0,0,.25)',
      animation:'vs-toast-in 0.3s ease',
      maxWidth:240,
    }}>
      {text}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color, height = 6 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height, background:'rgba(0,0,0,.08)', borderRadius:99, overflow:'hidden' }}>
      <div style={{
        height:'100%', width:`${pct}%`, borderRadius:99,
        background: color || '#10b981',
        transition:'width 0.4s ease',
      }} />
    </div>
  );
}

// ─── Scene Picker ─────────────────────────────────────────────────────────────

function ScenePicker({ onSelect, allDiscovered }) {
  const totalDiscovered = SCENES.reduce((s, sc) => s + (allDiscovered[sc.id]?.size ?? 0), 0);

  return (
    <div className="scr-wrap">
      {H("🎭 Vocabulary Scenes", "Tap objects in a scene to discover their Croatian names")}

      {/* Progress summary */}
      <div style={{
        background:'linear-gradient(135deg,#0f172a,#1e293b)',
        borderRadius:16, padding:'14px 18px', marginBottom:20,
        color:'white', display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontSize:11, opacity:.65, fontWeight:600, marginBottom:2, textTransform:'uppercase', letterSpacing:'.06em' }}>Total Progress</div>
          <div style={{ fontSize:22, fontWeight:800 }}>{totalDiscovered} <span style={{ fontSize:14, opacity:.7 }}>/ {TOTAL_WORDS} words discovered</span></div>
        </div>
        <div style={{ fontSize:36 }}>🌟</div>
      </div>

      {/* Scene grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {SCENES.map(scene => {
          const disc = allDiscovered[scene.id]?.size ?? 0;
          const total = scene.items.length;
          const complete = disc >= total;
          return (
            <button key={scene.id} onClick={() => onSelect(scene)}
              style={{
                background: complete ? scene.bg : 'white',
                border: complete ? `2px solid ${scene.color}` : '1.5px solid rgba(0,0,0,.08)',
                borderRadius:16, padding:'16px 14px', cursor:'pointer', textAlign:'left',
                boxShadow: complete ? `0 2px 12px ${scene.color}33` : '0 1px 4px rgba(0,0,0,.06)',
                transition:'transform 0.15s ease, box-shadow 0.15s ease',
                position:'relative', overflow:'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.boxShadow=`0 6px 20px ${scene.color}44`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow=complete?`0 2px 12px ${scene.color}33`:'0 1px 4px rgba(0,0,0,.06)'; }}
            >
              {complete && (
                <div style={{
                  position:'absolute', top:8, right:8,
                  background:scene.color, color:'white',
                  borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:800,
                }}>Complete!</div>
              )}
              <div style={{ fontSize:42, marginBottom:8, lineHeight:1 }}>{scene.icon}</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#1c1917', marginBottom:2 }}>{scene.title}</div>
              <div style={{ fontSize:11, color:'#78716c', marginBottom:10 }}>{scene.titleEn}</div>
              <div style={{ fontSize:11, color:scene.color, fontWeight:700, marginBottom:6 }}>
                {disc} / {total} discovered
              </div>
              <ProgressBar value={disc} max={total} color={scene.color} height={5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Item Button ──────────────────────────────────────────────────────────────

function ItemButton({ item, discovered, isActive, isQuiz, onTap }) {
  const [justFound, setJustFound] = useState(false);
  const prevDisc = useRef(discovered);

  useEffect(() => {
    if (!prevDisc.current && discovered) {
      setJustFound(true);
      const t = setTimeout(() => setJustFound(false), 450);
      return () => clearTimeout(t);
    }
    prevDisc.current = discovered;
  }, [discovered]);

  const baseStyle = {
    position:'absolute',
    left:`${item.x}%`,
    top:`${item.y}%`,
    transform:'translate(-50%,-50%)',
    width:44, height:44, borderRadius:'50%',
    border:'none', cursor:'pointer',
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    padding:0, zIndex: isActive ? 5 : 2,
    transition:'box-shadow 0.2s ease',
  };

  if (justFound) {
    return (
      <div style={{ ...baseStyle, background:'#fef9c3', boxShadow:'0 0 0 3px #f59e0b' }}
        className="vs-discovered-anim">
        <span style={{ fontSize:22, lineHeight:1 }}>{item.icon}</span>
      </div>
    );
  }

  if (discovered) {
    return (
      <button onClick={onTap} style={{
        ...baseStyle,
        background: isActive ? '#fff' : 'rgba(255,255,255,0.92)',
        boxShadow: isActive
          ? '0 0 0 3px #f59e0b, 0 4px 16px rgba(0,0,0,.18)'
          : '0 2px 8px rgba(0,0,0,.14)',
        flexDirection:'column',
      }}>
        <span style={{ fontSize:20, lineHeight:1 }}>{item.icon}</span>
        <span style={{
          fontSize:8, fontWeight:700, color:'#1c1917', lineHeight:1,
          marginTop:1, maxWidth:42, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          textAlign:'center',
        }}>{item.hr}</span>
      </button>
    );
  }

  // Undiscovered
  const showQuizMark = isQuiz;
  return (
    <button onClick={onTap}
      className="vs-pulse-anim"
      style={{
        ...baseStyle,
        background: showQuizMark ? 'rgba(99,102,241,0.75)' : 'rgba(0,0,0,0.4)',
        boxShadow: isActive ? '0 0 0 3px #f59e0b' : 'none',
        color:'white', fontSize: showQuizMark ? 18 : 22,
        filter: showQuizMark ? 'none' : 'blur(0.3px)',
      }}>
      {showQuizMark ? '?' : <span style={{ filter:'blur(1.5px)', opacity:.55 }}>{item.icon}</span>}
    </button>
  );
}

// ─── Item Popup ───────────────────────────────────────────────────────────────

function ItemPopup({ item, scene, isAdded, isQuiz, quizRevealed, onClose, onSpeak, onAddSRS, onQuizAnswer }) {
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'absolute', inset:0, zIndex:6,
        background:'rgba(0,0,0,0.18)',
      }} />
      {/* Sheet */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:7,
        background:'white', borderRadius:'16px 16px 0 0',
        padding:'16px 20px 20px',
        boxShadow:'0 -4px 24px rgba(0,0,0,.16)',
        animation:'vs-popup-in 0.28s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position:'absolute', top:12, right:14,
          background:'none', border:'none', cursor:'pointer',
          fontSize:20, color:'#78716c', lineHeight:1, padding:4,
        }}>✕</button>

        {isQuiz && !quizRevealed && (
          <div style={{ fontSize:12, color:'#6366f1', fontWeight:700, marginBottom:10, textAlign:'center' }}>
            Do you know this word?
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
          <div style={{ fontSize:48, lineHeight:1 }}>{item.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:26, fontWeight:900, color:'#1c1917', lineHeight:1.1 }}>{item.hr}</div>
            <div style={{ fontSize:14, color:'#78716c', marginTop:3 }}>{item.en}</div>
          </div>
          {/* Gender badge */}
          <div style={{
            background:scene.bg, color:scene.color, border:`1.5px solid ${scene.color}44`,
            borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:800,
          }}>{item.note}</div>
        </div>

        {/* Action row */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={onSpeak} style={{
            flex:1, background:`${scene.bg}`, border:`1.5px solid ${scene.color}44`,
            borderRadius:12, padding:'10px 0', cursor:'pointer',
            fontSize:14, fontWeight:700, color:scene.color,
          }}>
            🔊 Listen
          </button>
          <button onClick={onAddSRS} style={{
            flex:1,
            background: isAdded ? '#dcfce7' : scene.color,
            border:'none', borderRadius:12, padding:'10px 0', cursor:'pointer',
            fontSize:14, fontWeight:700,
            color: isAdded ? '#15803d' : 'white',
          }}>
            {isAdded ? '✓ In flashcards' : '+ Add to flashcards'}
          </button>
        </div>

        {/* Quiz answer buttons */}
        {isQuiz && quizRevealed && (
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <button onClick={() => onQuizAnswer(true)} style={{
              flex:1, background:'#dcfce7', border:'1.5px solid #86efac',
              borderRadius:12, padding:'10px 0', cursor:'pointer',
              fontSize:13, fontWeight:700, color:'#15803d',
            }}>✓ I knew it</button>
            <button onClick={() => onQuizAnswer(false)} style={{
              flex:1, background:'#fee2e2', border:'1.5px solid #fca5a5',
              borderRadius:12, padding:'10px 0', cursor:'pointer',
              fontSize:13, fontWeight:700, color:'#b91c1c',
            }}>✗ I didn't</button>
          </div>
        )}
        {isQuiz && !quizRevealed && (
          <button onClick={() => onQuizAnswer(null)} style={{
            width:'100%', marginTop:10,
            background:'#f1f5f9', border:'1.5px solid #e2e8f0',
            borderRadius:12, padding:'10px 0', cursor:'pointer',
            fontSize:13, fontWeight:700, color:'#475569',
          }}>Reveal word</button>
        )}
      </div>
    </>
  );
}

// ─── Scene Complete Overlay ───────────────────────────────────────────────────

function SceneComplete({ scene, onNext, onBack }) {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:20,
      background:'rgba(0,0,0,.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{
        background:'white', borderRadius:20,
        padding:'32px 28px', textAlign:'center',
        boxShadow:'0 8px 40px rgba(0,0,0,.28)',
        animation:'vs-complete-in 0.4s cubic-bezier(.4,0,.2,1)',
        maxWidth:300, width:'90%',
      }}>
        <div style={{ fontSize:52, marginBottom:10 }}>🎉</div>
        <div style={{ fontSize:20, fontWeight:900, color:'#1c1917', marginBottom:6 }}>Scene Complete!</div>
        <div style={{ fontSize:13, color:'#78716c', marginBottom:6 }}>
          You discovered all {scene.items.length} words in
        </div>
        <div style={{ fontSize:16, fontWeight:800, color:scene.color, marginBottom:18 }}>
          {scene.icon} {scene.title}
        </div>
        <div style={{
          background:'#fef3c7', borderRadius:12, padding:'10px 16px', marginBottom:18,
          fontSize:13, fontWeight:700, color:'#92400e',
        }}>+15 XP earned!</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onBack} style={{
            flex:1, background:'#f5f5f4', border:'none', borderRadius:12,
            padding:'12px 0', cursor:'pointer', fontSize:13, fontWeight:700, color:'#44403c',
          }}>← Scenes</button>
          <button onClick={onNext} style={{
            flex:2, background:scene.color, border:'none', borderRadius:12,
            padding:'12px 0', cursor:'pointer', fontSize:13, fontWeight:700, color:'white',
          }}>Next Scene →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Scene Explorer ───────────────────────────────────────────────────────────

function SceneExplorer({ scene, onBack, onNextScene, award }) {
  const [discovered, setDiscovered] = useState(() => loadDiscovered(scene.id));
  const [activeItem, setActiveItem] = useState(null);
  const [addedToSRS, setAddedToSRS] = useState(() => loadSRS());
  const [viewMode, setViewMode] = useState('explore');
  const [quizScore, setQuizScore] = useState({ known: 0, unknown: 0 });
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [toast, setToast] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completeFired, setCompleteFired] = useState(false);
  const awardFired = useRef(false);

  const total = scene.items.length;
  const discCount = discovered.size;

  // Check completion
  useEffect(() => {
    if (discCount >= total && !completeFired) {
      setCompleteFired(true);
      setShowComplete(true);
      if (!awardFired.current) {
        awardFired.current = true;
        if (typeof award === 'function') award(15);
      }
    }
  }, [discCount, total, completeFired, award]);

  const handleItemTap = useCallback((item) => {
    // Mark discovered
    setDiscovered(prev => {
      if (!prev.has(item.id)) {
        const next = new Set(prev);
        next.add(item.id);
        saveDiscovered(scene.id, next);
        return next;
      }
      return prev;
    });
    setActiveItem(item);
    setQuizRevealed(false);
    speak(item.hr);
  }, [scene.id]);

  const handleClose = useCallback(() => {
    setActiveItem(null);
    setQuizRevealed(false);
  }, []);

  const handleAddSRS = useCallback(() => {
    if (!activeItem) return;
    const key = `${scene.id}_${activeItem.id}`;
    if (addedToSRS.has(key)) return;

    const next = new Set(addedToSRS);
    next.add(key);
    setAddedToSRS(next);
    saveSRS(next);

    // Persist to SRS queue
    const queue = loadSRSQueue();
    const exists = queue.some(q => q.hr === activeItem.hr && q.en === activeItem.en);
    if (!exists) {
      queue.push({ hr: activeItem.hr, en: activeItem.en, note: activeItem.note });
      saveSRSQueue(queue);
    }

    setToast(`Added "${activeItem.hr}" to your word list!`);
  }, [activeItem, addedToSRS, scene.id]);

  const handleQuizAnswer = useCallback((result) => {
    if (result === null) {
      // "Reveal" pressed
      setQuizRevealed(true);
      return;
    }
    if (result === true) setQuizScore(s => ({ ...s, known: s.known + 1 }));
    else if (result === false) setQuizScore(s => ({ ...s, unknown: s.unknown + 1 }));
    handleClose();
  }, [handleClose]);

  const isAdded = activeItem
    ? addedToSRS.has(`${scene.id}_${activeItem.id}`)
    : false;

  return (
    <div className="scr-wrap">
      {/* Header */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <button onClick={onBack} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:13, fontWeight:700, color:'var(--subtext)', padding:'4px 0',
          }}>← Back</button>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:17, fontWeight:900, color:'#1c1917' }}>{scene.icon} {scene.title}</span>
            <span style={{ fontSize:12, color:'#78716c', marginLeft:6 }}>{scene.titleEn}</span>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:scene.color }}>
            {discCount}/{total}
          </div>
        </div>

        {/* Mini progress */}
        <ProgressBar value={discCount} max={total} color={scene.color} height={5} />

        {/* Mode toggle */}
        <div style={{ display:'flex', gap:6, marginTop:10 }}>
          {['explore','quiz'].map(mode => (
            <button key={mode} onClick={() => { setViewMode(mode); setActiveItem(null); }}
              style={{
                flex:1, padding:'8px 0', borderRadius:10, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:700,
                background: viewMode === mode ? scene.color : '#f5f5f4',
                color: viewMode === mode ? 'white' : '#44403c',
                transition:'background 0.2s',
              }}>
              {mode === 'explore' ? '🔍 Explore' : '🧠 Quiz'}
            </button>
          ))}
        </div>

        {/* Quiz score bar */}
        {viewMode === 'quiz' && (quizScore.known + quizScore.unknown) > 0 && (
          <div style={{
            marginTop:8, background:'#f1f5f9', borderRadius:10, padding:'8px 12px',
            fontSize:12, fontWeight:600, color:'#475569', display:'flex', gap:16,
          }}>
            <span style={{ color:'#15803d' }}>✓ Known: {quizScore.known}</span>
            <span style={{ color:'#b91c1c' }}>✗ Missed: {quizScore.unknown}</span>
          </div>
        )}
      </div>

      {/* Scene area */}
      <div style={{
        height:320, position:'relative', borderRadius:16, overflow:'hidden',
        ...scene.sceneStyle,
        boxShadow:'0 2px 16px rgba(0,0,0,.12)',
        marginBottom:16,
      }}>
        {/* Background emoji */}
        <div style={{
          position:'absolute', inset:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:160, opacity:.10, userSelect:'none', pointerEvents:'none', lineHeight:1,
        }}>{scene.emoji}</div>

        {/* Item buttons */}
        {scene.items.map(item => (
          <ItemButton
            key={item.id}
            item={item}
            discovered={discovered.has(item.id)}
            isActive={activeItem?.id === item.id}
            isQuiz={viewMode === 'quiz' && !discovered.has(item.id)}
            onTap={() => handleItemTap(item)}
          />
        ))}

        {/* Popup */}
        {activeItem && (
          <ItemPopup
            item={activeItem}
            scene={scene}
            isAdded={isAdded}
            isQuiz={viewMode === 'quiz'}
            quizRevealed={quizRevealed}
            onClose={handleClose}
            onSpeak={() => speak(activeItem.hr)}
            onAddSRS={handleAddSRS}
            onQuizAnswer={handleQuizAnswer}
          />
        )}

        {/* Confetti + complete overlay */}
        {showComplete && <Confetti />}
        {showComplete && (
          <SceneComplete
            scene={scene}
            onBack={onBack}
            onNext={() => { setShowComplete(false); onNextScene(); }}
          />
        )}
      </div>

      {/* Word list below scene */}
      <div style={{ marginBottom:8, fontSize:12, fontWeight:700, color:'#78716c', textTransform:'uppercase', letterSpacing:'.06em' }}>
        {discCount < total ? `${total - discCount} words left to discover` : 'All words discovered!'}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {scene.items.map(item => (
          <button key={item.id} onClick={() => {
            setActiveItem(item); setQuizRevealed(false); speak(item.hr);
          }}
            style={{
              background: discovered.has(item.id) ? scene.bg : '#f5f5f4',
              border: discovered.has(item.id) ? `1.5px solid ${scene.color}55` : '1.5px solid #e7e5e4',
              borderRadius:20, padding:'5px 12px', cursor:'pointer',
              fontSize:12, fontWeight:700,
              color: discovered.has(item.id) ? scene.color : '#a8a29e',
            }}>
            {discovered.has(item.id) ? item.hr : '• • •'}
          </button>
        ))}
      </div>

      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VocabScenes({ goBack, award }) {
  ensureCSS();

  const [currentScene, setCurrentScene] = useState(null);
  const [allDiscovered, setAllDiscovered] = useState(() =>
    Object.fromEntries(SCENES.map(sc => [sc.id, loadDiscovered(sc.id)]))
  );

  // Refresh allDiscovered when returning to picker
  const handleBackToPicker = useCallback(() => {
    setCurrentScene(null);
    setAllDiscovered(
      Object.fromEntries(SCENES.map(sc => [sc.id, loadDiscovered(sc.id)]))
    );
  }, []);

  const handleNextScene = useCallback(() => {
    if (!currentScene) return;
    const idx = SCENES.findIndex(s => s.id === currentScene.id);
    const next = SCENES[(idx + 1) % SCENES.length];
    setCurrentScene(next);
    setAllDiscovered(
      Object.fromEntries(SCENES.map(sc => [sc.id, loadDiscovered(sc.id)]))
    );
  }, [currentScene]);

  if (currentScene) {
    return (
      <SceneExplorer
        key={currentScene.id}
        scene={currentScene}
        onBack={handleBackToPicker}
        onNextScene={handleNextScene}
        award={award}
      />
    );
  }

  return (
    <ScenePicker
      onSelect={setCurrentScene}
      allDiscovered={allDiscovered}
    />
  );
}
