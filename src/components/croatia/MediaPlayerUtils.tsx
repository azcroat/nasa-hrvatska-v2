// @ts-nocheck
// ── Shared constants and helpers for the Media section ────────────────────────

export const LEVEL_COLORS = {A1:'#16a34a',A2:'#65a30d',B1:'#ca8a04',B2:'#b45309',C1:'#0e7490',C2:'#7c3aed'};
export const CAT_LABELS = {tv:"📺 TV & News",music:"🎵 Music & Radio",sport:"⚽ Sports",film:"🎬 Film & Series",podcast:"🎙️ Podcasts",culture:"🌍 Culture & Press"};

// ── Vocabulary previews by content domain ─────────────────────────────────────
export const DOMAIN_VOCAB = {
  tv:      [{hr:'vijesti',en:'news'},{hr:'izvješće',en:'report'},{hr:'ministar',en:'minister'}],
  music:   [{hr:'pjesma',en:'song'},{hr:'ritam',en:'rhythm'},{hr:'osjećaj',en:'feeling'}],
  film:    [{hr:'priča',en:'story'},{hr:'lik',en:'character'},{hr:'kraj',en:'ending'}],
  sport:   [{hr:'utakmica',en:'match'},{hr:'gol',en:'goal'},{hr:'pobjednik',en:'winner'}],
  podcast: [{hr:'razgovor',en:'conversation'},{hr:'tema',en:'topic'},{hr:'mišljenje',en:'opinion'}],
  culture: [{hr:'tradicija',en:'tradition'},{hr:'nasljeđe',en:'heritage'},{hr:'kultura',en:'culture'}],
};

// ── Immersion streak helpers ──────────────────────────────────────────────────
export function getImmersionDays() {
  try { return JSON.parse(localStorage.getItem('nh_immersion_days') || '[]'); } catch { return []; }
}
export function markImmersionToday() {
  const today = new Date().toISOString().slice(0,10);
  const days = getImmersionDays();
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem('nh_immersion_days', JSON.stringify(days));
    // Notify App to award immersion XP and trigger knight speech
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nh:immersion-new-day', { detail: { count: days.length } }));
    }
  }
}
export function getWeekDots() {
  const days = getImmersionDays();
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dots.push(days.includes(d.toISOString().slice(0,10)));
  }
  return dots;
}

// ── Goal-based media sort/tag ─────────────────────────────────────────────────
export function getGoalPersonalization() {
  try { return localStorage.getItem('nh_goal') || ''; } catch { return ''; }
}
export function tagMediaForGoal(m, goal) {
  if (!goal) return null;
  if ((goal === 'heritage' || goal === 'family') && (m.cat === 'music' || m.cat === 'culture')) return 'For the diaspora';
  if (goal === 'travel' && (m.cat === 'tv' || m.cat === 'podcast')) return 'Great for travellers';
  return null;
}
export function sortMediaForGoal(items, goal) {
  if (goal === 'fluent') return [...items].sort((a,b) => {
    const order = {A1:0,A2:1,B1:2,B2:3,C1:4,C2:5};
    return (order[a.level]??9) - (order[b.level]??9);
  });
  if (goal === 'heritage' || goal === 'family') return [...items].sort((a,b) => {
    const priority = (m) => (m.cat === 'music' || m.cat === 'culture') ? 0 : 1;
    return priority(a) - priority(b);
  });
  if (goal === 'travel') return [...items].sort((a,b) => {
    const priority = (m) => (m.cat === 'tv' || m.cat === 'podcast') ? 0 : 1;
    return priority(a) - priority(b);
  });
  return items;
}

// ── CSS keyframe injection (once) ─────────────────────────────────────────────
const MEDIA_CSS = `
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
`;
if (typeof document !== 'undefined' && !document.getElementById('nh-media-css')) {
  const s = document.createElement('style'); s.id = 'nh-media-css'; s.textContent = MEDIA_CSS;
  document.head.appendChild(s);
}

export function getDomain(url) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch(e) { return null; }
}

export function getActionLabel(m, cat) {
  if (m.scr && !m.web) return ['Open →', false];
  if (m.live) {
    if (cat === 'tv') return ['Watch Live ↗', true];
    if (cat === 'music') return ['Listen Live ↗', true];
  }
  if (m.video) return ['Watch ↗', false];
  const labels = {tv:'Read ↗', music:'Listen ↗', film:'Watch ↗', sport:'Visit ↗', podcast:'Listen ↗', culture:'Read ↗'};
  return [labels[cat] || 'Open ↗', false];
}
