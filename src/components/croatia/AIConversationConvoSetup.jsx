import React from 'react';
import { portraitSrc } from './SpeakingAvatar.jsx';
import { deriveWeakAreas } from './ConversationScenarios.js';

const LEVELS = ["A1","A2","B1","B2","C1","C2"];
const CATS   = ["All","Errands","Out & About","Social","Practical","Culture","Professional"];
const CAT_ICONS = { All:"🌐", Errands:"🛍️", "Out & About":"🌊", Social:"👨‍👩‍👧", Practical:"🏥", Culture:"🏛️", Professional:"💼" };

const FREE_TALK_SCENARIO = {
  id: '__freetalk__',
  cat: 'Social',
  icon: '💬',
  title: 'Free Conversation',
  hr: 'Slobodan razgovor',
  desc: 'Open-ended — any topic, any direction',
  levels: ['A1','A2','B1','B2','C1','C2'],
  color: '#7c3aed',
  bg: '#faf5ff',
  aiName: 'Mate',
  aiRole: 'friendly Croatian companion',
  context: 'You are Mate, a warm and patient Croatian local. Have a natural open-ended conversation in Croatian with the learner. Start with a genuine greeting and let the topic flow wherever feels natural — daily life, Croatian culture, food, travel, hobbies. Adapt vocabulary and complexity to the learner\'s CEFR level.',
};

function sceneForCat(cat) {
  const SCENE_FOR_CAT = {
    'Errands':     '/images/scenes/zagreb.webp',
    'Out & About': '/images/scenes/dubrovnik-hero.webp',
    'Social':      '/images/scenes/croatian-food.webp',
    'Practical':   '/images/scenes/zagreb.webp',
    'Heritage':    '/images/scenes/dalmatian-coast.webp',
    'Work & Travel':'/images/scenes/plitvice.webp',
  };
  return SCENE_FOR_CAT[cat] || '/images/scenes/dubrovnik-hero.webp';
}

export default function AIConversationConvoSetup({
  Header,
  level,
  setLevel,
  activeCat,
  setActiveCat,
  scenario,
  setScenario,
  filteredScenarios,
  stats,
  customText,
  setCustomText,
  showCustom,
  setShowCustom,
  customSceneImg,
  customSceneLoading,
  isOnline,
  onStart,
}) {
  return (
    <div className="scr-wrap">
      {Header}

      {/* ── Free Talk quick-start ── */}
      <div
        onClick={() => setScenario(scenario?.id === '__freetalk__' ? null : FREE_TALK_SCENARIO)}
        style={{
          borderRadius: 18, padding: '14px 16px', marginBottom: 22, cursor: 'pointer',
          background: scenario?.id === '__freetalk__'
            ? 'linear-gradient(135deg,rgba(124,58,237,.18),rgba(109,40,217,.08))'
            : 'var(--card)',
          border: `2px solid ${scenario?.id === '__freetalk__' ? '#7c3aed' : 'var(--card-b)'}`,
          boxShadow: scenario?.id === '__freetalk__' ? '0 6px 24px rgba(124,58,237,.2)' : '0 2px 8px rgba(0,0,0,.06)',
          display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          boxShadow: '0 4px 12px rgba(124,58,237,.35)',
        }}>💬</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: scenario?.id === '__freetalk__' ? '#7c3aed' : 'var(--heading)' }}>
            Free Talk — No Script Needed
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2, fontWeight: 600 }}>
            Open-ended conversation · Mate adapts to your level
          </div>
        </div>
        {scenario?.id === '__freetalk__'
          ? <div style={{ fontSize: 18, color: '#7c3aed', fontWeight: 900, flexShrink: 0 }}>✓</div>
          : <div style={{ fontSize: 18, color: 'var(--subtext)', opacity: 0.4, flexShrink: 0 }}>›</div>
        }
      </div>

      <div className="sh">Your Level</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => { setLevel(l); setScenario(null); }}
            style={{ padding: "8px 18px", borderRadius: 20, border: "2px solid", fontWeight: 800, fontSize: "var(--text-sm)",
              cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all .15s",
              borderColor: level === l ? "var(--info)" : "var(--card-b)",
              background: level === l ? "var(--info)" : "var(--card)",
              color: level === l ? "var(--card)" : "var(--subtext)" }}>
            {l}
          </button>
        ))}
      </div>

      {deriveWeakAreas(stats?.ct || []).length > 0 && (
        <div style={{
          fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic',
          padding: '4px 0 16px', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          🎯 AI will practice: {deriveWeakAreas(stats?.ct || []).slice(0, 2).join(', ')}
        </div>
      )}

      <div className="sh">Category</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => { setActiveCat(c); setScenario(null); }}
            style={{ flexShrink: 0, padding: "7px 13px", borderRadius: 20, border: "1.5px solid",
              fontWeight: 700, fontSize: "var(--text-sm)", cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              transition: "all .15s", whiteSpace: "nowrap",
              borderColor: activeCat === c ? "var(--info)" : "var(--card-b)",
              background: activeCat === c ? "var(--info)" : "var(--card)",
              color: activeCat === c ? "white" : "var(--subtext)" }}>
            {CAT_ICONS[c]} {c}
          </button>
        ))}
      </div>

      <div style={{ fontSize: "var(--text-sm)", color: "var(--subtext)", marginBottom: 12, fontWeight: 600 }}>
        {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? "s" : ""} for level {level}
        {activeCat !== "All" ? ` · ${activeCat}` : ""}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {filteredScenarios.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--subtext)", fontSize: "var(--text-base)" }}>
            No scenarios match this filter. Try changing the level or category.
          </div>
        ) : filteredScenarios.map(s => {
          const selected = scenario?.id === s.id;
          return (
            <div key={s.id} onClick={() => setScenario(s)}
              style={{
                borderRadius: 18, overflow: "hidden", cursor: "pointer",
                border: `2px solid ${selected ? s.color : "transparent"}`,
                boxShadow: selected
                  ? `0 8px 32px ${s.color}35, 0 2px 8px rgba(0,0,0,.12)`
                  : "0 2px 10px rgba(0,0,0,.08)",
                transform: selected ? 'scale(1.01)' : 'scale(1)',
                transition: 'all .2s cubic-bezier(.34,1.56,.64,1)',
              }}>
              {/* Cinematic header: scene bg + portrait */}
              <div style={{
                position: "relative", height: 88, overflow: "hidden",
                background: `linear-gradient(135deg,${s.color}cc,${s.color}66), url('${sceneForCat(s.cat)}') center / cover no-repeat`,
              }}>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.1) 55%,rgba(0,0,0,.25) 100%)" }} />
                <div style={{ position:"absolute", left:14, bottom:10, right:90, zIndex:1 }}>
                  <div style={{ fontSize:9, fontWeight:800, color:"rgba(255,255,255,.72)", letterSpacing:".12em", textTransform:"uppercase", marginBottom:2 }}>
                    {s.cat}
                  </div>
                  <div style={{ fontSize:16, fontWeight:900, color:"white", textShadow:"0 1px 6px rgba(0,0,0,.5)", lineHeight:1.1 }}>
                    {s.icon} {s.title}
                  </div>
                  <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,.72)", marginTop:2 }}>
                    {s.hr}
                  </div>
                </div>
                <div style={{
                  position:"absolute", right:10, bottom:0, width:68, height:82,
                  borderRadius:"12px 12px 0 0", overflow:"hidden",
                  boxShadow:"0 -4px 20px rgba(0,0,0,.35), -2px 0 8px rgba(0,0,0,.2)",
                  border:"2px solid rgba(255,255,255,.25)", borderBottom:"none",
                }}>
                  <img src={portraitSrc(s.id)} alt={s.aiName} loading="lazy"
                    onError={e => { const t = /** @type {HTMLImageElement} */ (e.target); t.style.display='none'; const sib = /** @type {HTMLElement} */ (t.nextSibling); if (sib) sib.style.display='flex'; }}
                    style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top center" }} />
                  <div style={{ display:"none", width:"100%", height:"100%", alignItems:"center", justifyContent:"center",
                    background:`linear-gradient(135deg,${s.color}88,${s.color}44)`, fontSize:28 }}>
                    {s.icon}
                  </div>
                </div>
                {selected && (
                  <div style={{ position:"absolute", top:8, left:10, zIndex:2,
                    background:s.color, borderRadius:20, padding:"3px 10px",
                    fontSize:10, fontWeight:900, color:"white", boxShadow:`0 2px 8px ${s.color}50` }}>
                    ✓ Selected
                  </div>
                )}
              </div>
              {/* Content row */}
              <div style={{
                padding: "12px 14px 12px",
                background: selected ? `${s.color}10` : "var(--card)",
                display:"flex", alignItems:"center", gap:10,
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"var(--text-sm)", fontWeight:700, color:"var(--subtext)", marginBottom:4, lineHeight:1.3 }}>
                    {s.aiName} · <span style={{ fontWeight:500 }}>{s.desc}</span>
                  </div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {s.levels.map(l => (
                      <span key={l} style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:10,
                        background: l === level ? s.color : "var(--bar-bg)",
                        color: l === level ? "white" : "var(--subtext)" }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize:20, color: selected ? s.color : "var(--subtext)", opacity: selected ? 1 : 0.3 }}>
                  {selected ? "✓" : "›"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Scenario */}
      <div style={{
        borderRadius: 18, overflow: "hidden", marginBottom: 10,
        border: `2px solid ${scenario?.id === '__custom__' ? '#7c3aed' : 'var(--card-b)'}`,
        boxShadow: scenario?.id === '__custom__' ? '0 8px 32px rgba(124,58,237,.2)' : 'none',
        transition: 'all .2s',
      }}>
        <div
          onClick={() => setShowCustom(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
            background: scenario?.id === '__custom__'
              ? 'linear-gradient(135deg,rgba(124,58,237,.15),rgba(109,40,217,.08))'
              : 'var(--card)',
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
            background: customSceneImg ? undefined : 'linear-gradient(135deg,#7c3aed22,#6d28d910)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            {customSceneImg
              ? <img src={customSceneImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 24 }}>✨</span>
            }
            {customSceneLoading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#a78bfa', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
              ✦ Create Custom Scenario
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 1 }}>
              Describe any situation — AI generates a scene image
            </div>
          </div>
          <div style={{ fontSize: 18, color: '#7c3aed', opacity: 0.6 }}>
            {showCustom ? '▾' : '›'}
          </div>
        </div>

        {showCustom && (
          <div style={{ padding: '12px 16px 16px', background: 'var(--bar-bg)', borderTop: '1px solid var(--card-b)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)', marginBottom: 8 }}>
              Describe your scenario in English (e.g. "Booking a sailing trip in Hvar"):
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder="e.g. At a Split ferry terminal buying tickets..."
                maxLength={200}
                style={{
                  flex: 1, padding: '10px 13px', borderRadius: 10, fontSize: 14,
                  border: '1.5px solid var(--inp-b)', background: 'var(--card)',
                  outline: 'none', fontFamily: "'Outfit',sans-serif", color: 'var(--heading)',
                }}
              />
              <button
                disabled={!customText.trim() || customSceneLoading}
                onClick={async () => {
                  if (!customText.trim()) return;
                  const customScenario = {
                    id: '__custom__',
                    cat: 'Out & About',
                    icon: '✨',
                    title: customText.slice(0, 40),
                    hr: customText.slice(0, 40),
                    desc: customText,
                    levels: ['A1','A2','B1','B2','C1','C2'],
                    color: '#7c3aed',
                    bg: '#faf5ff',
                    aiName: 'Lokalni stanovnik',
                    aiRole: `local Croatian in this situation: ${customText.slice(0, 100)}`,
                    context: `You are a helpful Croatian local. The learner is practicing Croatian in this scenario: ${customText}. Start by greeting them naturally in Croatian and engaging with the situation.`,
                  };
                  setScenario(customScenario);
                }}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: customText.trim() ? '#7c3aed' : 'var(--bar-bg)',
                  color: customText.trim() ? '#fff' : 'var(--subtext)',
                  fontWeight: 800, fontSize: 13, cursor: customText.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap',
                }}
              >
                {customSceneLoading ? '…' : '✦ Set'}
              </button>
            </div>
            {scenario?.id === '__custom__' && (
              <div style={{
                marginTop: 10, padding: '8px 12px',
                background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)',
                borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#7c3aed',
              }}>
                ✓ Custom scenario selected — start when ready
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { label: "Tap words to translate", sub: "Klikni za prijevod" },
          { label: "Inline corrections",     sub: "Ispravak grešaka"  },
          { label: "Voice input" },
          { label: "Sentence starters" },
          { label: "Full evaluation" },
        ].map(({ label, sub }) => (
          <span key={label} style={{ background: "var(--info-bg)", border: "1px solid var(--info-b)", borderRadius: 20,
            padding: "3px 10px", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--info)",
            display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.4 }}>
            {label}
            {sub && <span style={{ fontSize: "var(--text-xs)", opacity: .7 }}>{sub}</span>}
          </span>
        ))}
      </div>

      {!isOnline && (
        <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning-b)", borderRadius: 12,
          padding: "12px 16px", marginBottom: 12, fontSize: "var(--text-sm)", color: "var(--warning)", fontWeight: 600,
          display: "flex", gap: 10, alignItems: "center" }}>
          <span>📶</span><span>You're offline — AI conversation requires an internet connection.</span>
        </div>
      )}
      <button className="b bp" style={{ width: "100%", fontSize: 16, padding: "15px", borderRadius: 14 }}
        onClick={onStart} disabled={!scenario || !isOnline}>
        {!isOnline ? "Connect to the internet to start" : scenario ? `Start — ${scenario.title} (${level})` : "Select a scenario above"}
      </button>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)", textAlign: "center", marginTop: 10 }}>
        Powered by Claude AI · No conversation data stored
      </div>

    </div>
  );
}
