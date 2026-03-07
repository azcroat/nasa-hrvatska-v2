import React, { useState } from 'react';
import { MEDIA } from '../../data.jsx';

const LEVELS = ['A1','A2','B1','B2','C1','C2'];
const LEVEL_COLORS = {A1:'#16a34a',A2:'#65a30d',B1:'#ca8a04',B2:'#b45309',C1:'#0e7490',C2:'#7c3aed'};
const LEVEL_LABELS = {A1:'Beginner',A2:'Elementary',B1:'Intermediate',B2:'Upper-Int.',C1:'Advanced',C2:'Mastery'};

const JOURNEY = [
  {level:'A1',icon:'🌱',title:'Plant the Seed',weeks:'Weeks 1–4',desc:'Focus on hearing Croatian every day, even if you understand nothing. Your brain is mapping sounds.',
    goals:['Learn greetings, numbers, colors, family (all in this app)','Listen to CMC Radio or HRT Radio for 5 min/day — no comprehension required','Watch one Croatian music video with lyrics','Read: Glas Hrvatske English+Croatian side-by-side'],
    habit:'5 min Croatian music every morning while you get ready.',
  },
  {level:'A2',icon:'🌿',title:'First Sprouts',weeks:'Weeks 5–12',desc:'You recognize words and short phrases. Now start connecting exposure to your in-app lessons.',
    goals:['Complete all vocabulary categories in Learn tab','Read 5 headlines on 24sata.hr each morning','Watch Easy Croatian street interview (YouTube) twice a week','Start noticing case endings on signs and menus'],
    habit:'Read one 24sata headline with your morning coffee.',
  },
  {level:'B1',icon:'🌳',title:'Growing Strong',weeks:'Months 3–6',desc:'You understand the main idea of most things. Immersion becomes genuinely enjoyable.',
    goals:['Watch HRT 1 Dnevnik (nightly news) 3x/week','Listen to one HRT Radio podcast episode/week on a topic you love','Read one full Dnevnik.hr article per day','Watch Easy Croatian interviews without subtitles first'],
    habit:'20 min of HRT TV or radio, 4 evenings per week.',
  },
  {level:'B2',icon:'🏔️',title:'Upper Slopes',weeks:'Months 6–12',desc:'Croatian media is mostly comprehensible. Focus on nuance, regional variation, and formal registers.',
    goals:['Read Večernji list or Jutarnji list editorial section weekly','Watch a full Croatian film without English subtitles','Follow HNK Hajduk or Dinamo on social media','Listen to HRT Radio history or culture podcast'],
    habit:'One Croatian film every two weeks, no subtitles after the first 10 min.',
  },
  {level:'C1',icon:'⛰️',title:'The Summit',weeks:'Year 2+',desc:'You think in Croatian for familiar topics. Focus on vocabulary gaps and formal language.',
    goals:['Read Jutarnji list opinion columns','Watch Croatian political debates on HRT','Write a diary entry in Croatian each week','Find a Croatian language exchange partner'],
    habit:'One opinion article + one diary entry per week.',
  },
  {level:'C2',icon:'🦅',title:'Native Fluency',weeks:'Ongoing',desc:'Croatian is part of who you are. Maintain and deepen through ongoing immersion.',
    goals:['Follow Croatian Twitter/Instagram accounts in Croatian','Read Croatian novels or short stories','Watch Croatian standup comedy (Škibby, Relja, Bare)','Listen to Croatian talk radio without notes'],
    habit:'Croatian media replaces English media for your favorite topics.',
  },
];

const SCHEDULES = [
  {time:'☀️ Morning (5 min)',items:['HRT Radio or CMC Radio while getting ready','Read 1 headline on 24sata.hr or Dnevnik.hr']},
  {time:'🌤️ Afternoon (10 min)',items:['Vocabulary lesson or flashcards in the app','Read 1 full news article — look up 3 unknown words']},
  {time:'🌙 Evening (20 min)',items:['HRT 1 Dnevnik news (7:30pm Croatian time)','OR a Croatian film / YouTube series episode']},
  {time:'🗓️ Weekly (1 hr)',items:['One Croatian podcast on a topic you love','Review all new words from the week in your Vocabulary Journal']},
];

const TIPS = [
  {icon:'🔁',title:'Shadowing',tip:'Play a Croatian sentence, pause, repeat it back immediately — out loud, same speed, same melody. Do this with HRT Radio. It trains accent and rhythm faster than anything.'},
  {icon:'📱',title:'Change Your Phone to Croatian',tip:"Go to Settings → Language → Hrvatski. You already know what every icon does. Now you'll absorb 50+ words per day with zero effort."},
  {icon:'🏷️',title:'Label Your Home',tip:"Put sticky labels on everything in your house: 'hladnjak', 'vrata', 'prozor', 'stol'. Every time you touch something, you see the word."},
  {icon:'🧠',title:'Comprehensible Input (i+1)',tip:"Find content where you understand about 70-80% — not too easy, not too hard. That 20% you don't understand is where growth happens. Easy Croatian videos are ideal."},
  {icon:'📝',title:'One Sentence Diary',tip:"Every night, write one sentence in Croatian about your day. Even 'Danas sam radio u uredu.' This forces you to actively produce what you've been passively absorbing."},
  {icon:'🎵',title:'Find Your Song',tip:"Pick one Croatian song you love. Look up every word. Listen to it 50 times. You'll own those words forever. Try Oliver Dragojević's 'Cesarica' or Thompson's 'Lijepa li si'."},
  {icon:'👥',title:'Find a Native Speaker',tip:"HelloTalk or Tandem apps let you chat with Croatians who want to learn your language. Even 15 min/week of real conversation accelerates everything else."},
  {icon:'🔤',title:'Read Aloud',tip:"When you read Croatian text — news, labels, anything — say it out loud. Reading activates the eye. Speaking activates the mouth, ear, and brain simultaneously."},
];

export default function ImmersionHub({ goBack }) {
  const [activeTab, setActiveTab] = useState('journey'); // journey | media | schedule | tips
  const [levelFilter, setLevelFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');

  const allCats = ['tv','music','film','sport','podcast','culture'];
  const catLabels = {tv:'📺 TV & News',music:'🎵 Music',film:'🎬 Film',sport:'⚽ Sport',podcast:'🎙️ Podcasts',culture:'🌍 Culture'};

  const filtered = MEDIA.filter(m => {
    if (levelFilter !== 'all' && m.level !== levelFilter) return false;
    if (catFilter !== 'all' && m.cat !== catFilter) return false;
    return true;
  });

  const LevelBadge = ({level, small}) => (
    <span style={{background:LEVEL_COLORS[level]+'22',color:LEVEL_COLORS[level],fontWeight:800,fontSize:small?9:11,padding:small?'2px 6px':'3px 8px',borderRadius:20,border:`1px solid ${LEVEL_COLORS[level]}44`,whiteSpace:'nowrap'}}>
      {level}
    </span>
  );

  const tabs = [{id:'journey',label:'🗺️ Path'},{id:'media',label:'📺 Media'},{id:'schedule',label:'📅 Schedule'},{id:'tips',label:'💡 Tips'}];

  return (
    <div className="scr-wrap">
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      <div style={{textAlign:'center',marginBottom:20}}>
        <div style={{fontSize:48,marginBottom:8}}>🌊</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:'#164e63',fontWeight:800}}>Immersion Hub</h2>
        <p style={{color:'#78716c',fontSize:14,marginTop:4}}>Your structured path from first words to native fluency</p>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:6,marginBottom:20,background:'rgba(14,116,144,.06)',borderRadius:14,padding:4}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{flex:1,padding:'8px 4px',border:'none',borderRadius:10,background:activeTab===t.id?'white':'transparent',fontWeight:700,fontSize:12,color:activeTab===t.id?'#0e7490':'#78716c',cursor:'pointer',boxShadow:activeTab===t.id?'0 1px 4px rgba(0,0,0,.1)':'none',transition:'all .2s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* JOURNEY TAB */}
      {activeTab === 'journey' && (
        <div>
          <div className="c" style={{marginBottom:16,padding:'14px 16px',background:'linear-gradient(135deg,rgba(14,116,144,.06),rgba(14,116,144,.12))',borderLeft:'4px solid #0e7490'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#164e63'}}>The Science of Language Acquisition</div>
            <div style={{fontSize:12,color:'#78716c',marginTop:4,lineHeight:1.6}}>
              Research shows fluency comes from <strong>massive comprehensible input</strong> — not memorizing grammar rules. The app teaches structure; immersion builds instinct. Use both together.
            </div>
          </div>
          {/* Level selector */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
            {LEVELS.map(l => (
              <div key={l} style={{flex:'0 0 calc(33% - 4px)',background:`${LEVEL_COLORS[l]}11`,border:`2px solid ${LEVEL_COLORS[l]}44`,borderRadius:12,padding:'10px 8px',textAlign:'center',cursor:'default'}}>
                <div style={{fontSize:18}}>{JOURNEY.find(j=>j.level===l)?.icon}</div>
                <div style={{fontSize:11,fontWeight:800,color:LEVEL_COLORS[l]}}>{l}</div>
                <div style={{fontSize:9,color:'#78716c'}}>{LEVEL_LABELS[l]}</div>
              </div>
            ))}
          </div>
          {JOURNEY.map(j => (
            <JourneyCard key={j.level} j={j} color={LEVEL_COLORS[j.level]} />
          ))}
        </div>
      )}

      {/* MEDIA TAB */}
      {activeTab === 'media' && (
        <div>
          {/* Level filter */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:'#78716c',marginBottom:8}}>FILTER BY LEVEL</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <FilterBtn label="All" active={levelFilter==='all'} onClick={() => setLevelFilter('all')} color="#78716c" />
              {LEVELS.map(l => <FilterBtn key={l} label={l} active={levelFilter===l} onClick={() => setLevelFilter(l)} color={LEVEL_COLORS[l]} />)}
            </div>
          </div>
          {/* Category filter */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#78716c',marginBottom:8}}>FILTER BY TYPE</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <FilterBtn label="All" active={catFilter==='all'} onClick={() => setCatFilter('all')} color="#78716c" />
              {allCats.map(c => <FilterBtn key={c} label={catLabels[c]} active={catFilter===c} onClick={() => setCatFilter(c)} color="#0e7490" />)}
            </div>
          </div>
          <div style={{fontSize:12,color:'#78716c',marginBottom:12}}>{filtered.length} resources</div>
          {filtered.length === 0 && <div style={{textAlign:'center',padding:32,color:'#a8a29e'}}>No resources match this filter.</div>}
          {filtered.map((m, i) => (
            <MediaCard key={i} m={m} />
          ))}
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div>
          <div className="c" style={{marginBottom:16,padding:'14px 16px',borderLeft:'4px solid #16a34a',background:'rgba(22,163,74,.04)'}}>
            <div style={{fontSize:13,fontWeight:800,color:'#166534'}}>The 35-Minute Daily Habit</div>
            <div style={{fontSize:12,color:'#4b7c59',marginTop:4,lineHeight:1.6}}>
              Consistency beats intensity. 35 minutes every day produces far better results than 4 hours on weekends. Build these micro-habits into your existing routine.
            </div>
          </div>
          {SCHEDULES.map((s, i) => (
            <div key={i} className="c" style={{marginBottom:12,padding:16}}>
              <div style={{fontSize:14,fontWeight:800,color:'#164e63',marginBottom:10}}>{s.time}</div>
              {s.items.map((item, j) => (
                <div key={j} style={{display:'flex',gap:10,marginBottom:8,padding:'8px 12px',background:'rgba(14,116,144,.04)',borderRadius:10}}>
                  <span style={{color:'#0e7490',fontWeight:800,flexShrink:0}}>→</span>
                  <span style={{fontSize:13,color:'#44403c',lineHeight:1.5}}>{item}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="c" style={{padding:16,background:'linear-gradient(135deg,rgba(14,116,144,.06),rgba(14,116,144,.12))',borderLeft:'4px solid #0e7490'}}>
            <div style={{fontSize:13,fontWeight:800,color:'#164e63',marginBottom:8}}>Weekly Immersion Rhythm</div>
            {[['Mon','Grammar review in the app — one new concept'],['Tue','CMC TV or music — passive listening'],['Wed','HRT Radio or podcast — 20 min'],['Thu','Read a news article — look up 5 unknown words'],['Fri','Croatian film or series episode'],['Sat','Practice speaking — role-play or language exchange'],['Sun','Review your Vocabulary Journal — week reflection']].map(([d,t]) => (
              <div key={d} style={{display:'flex',gap:12,marginBottom:8,alignItems:'flex-start'}}>
                <span style={{fontWeight:800,color:'#0e7490',width:32,flexShrink:0,fontSize:12}}>{d}</span>
                <span style={{fontSize:12,color:'#44403c'}}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIPS TAB */}
      {activeTab === 'tips' && (
        <div>
          <div className="c" style={{marginBottom:16,padding:'14px 16px',borderLeft:'4px solid #b45309',background:'rgba(180,83,9,.04)'}}>
            <div style={{fontSize:13,fontWeight:800,color:'#92400e'}}>The #1 Rule of Language Learning</div>
            <div style={{fontSize:13,color:'#78450e',marginTop:4,lineHeight:1.6,fontStyle:'italic'}}>
              "The language you study and the language you acquire are not the same thing. Acquisition happens through exposure to meaningful, interesting content — not through study alone."
            </div>
            <div style={{fontSize:11,color:'#a16207',marginTop:4}}>— Based on Stephen Krashen's Input Hypothesis</div>
          </div>
          {TIPS.map((t, i) => (
            <div key={i} className="c" style={{marginBottom:12,padding:16}}>
              <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                <div style={{fontSize:28,flexShrink:0}}>{t.icon}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:'#164e63',marginBottom:6}}>{t.title}</div>
                  <div style={{fontSize:13,color:'#44403c',lineHeight:1.6}}>{t.tip}</div>
                </div>
              </div>
            </div>
          ))}
          <div className="c" style={{padding:16,borderLeft:'4px solid #7c3aed',background:'rgba(124,58,237,.04)',marginTop:4}}>
            <div style={{fontSize:14,fontWeight:800,color:'#5b21b6',marginBottom:8}}>Advanced Grammar Gaps to Target</div>
            {[['Number Agreement','2, 3, 4 = Genitive singular (dva psa). 5+ = Genitive plural (pet pasa). Master this one rule.'],['Clitic Order','Short pronouns cluster after the first word: "Dao sam mu ga." — always in this order: sam/si/je/smo/ste/su → me/ti/mu/nam/vam/im → ga/je/ih.'],['Conditional Mood','bi + past verbal adjective: "Htio bih..." (I would like). Negative: "Ne bih htio."'],['Passive Voice','biti + past passive participle: "Grad je osnovan 925. godine." (The city was founded in 925.)'],['Reported Speech','Direct: Ana kaže: "Idem." → Indirect: Ana kaže da ide. The verb shifts but the tense is simpler than in English.']].map(([g,d]) => (
              <div key={g} style={{marginBottom:12,padding:'10px 12px',background:'rgba(124,58,237,.04)',borderRadius:10}}>
                <div style={{fontSize:13,fontWeight:800,color:'#5b21b6',marginBottom:4}}>{g}</div>
                <div style={{fontSize:12,color:'#44403c',lineHeight:1.5}}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JourneyCard({ j, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="c" style={{marginBottom:12,padding:0,overflow:'hidden'}}>
      <div style={{padding:'14px 16px',cursor:'pointer',display:'flex',gap:12,alignItems:'center'}} onClick={() => setOpen(o => !o)}>
        <div style={{width:44,height:44,borderRadius:12,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{j.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
            <span style={{fontSize:14,fontWeight:800,color:'#164e63'}}>{j.title}</span>
            <span style={{background:`${color}20`,color,fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:20,border:`1px solid ${color}40`}}>{j.level}</span>
          </div>
          <div style={{fontSize:11,color:'#78716c'}}>{j.weeks} · {j.desc.slice(0,60)}...</div>
        </div>
        <span style={{color:'#a8a29e',fontSize:18,flexShrink:0}}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(0,0,0,.06)'}}>
          <div style={{fontSize:13,color:'#44403c',lineHeight:1.6,margin:'12px 0 10px'}}>{j.desc}</div>
          <div style={{fontSize:12,fontWeight:800,color,marginBottom:8}}>GOALS AT THIS LEVEL</div>
          {j.goals.map((g, i) => (
            <div key={i} style={{display:'flex',gap:8,marginBottom:6,padding:'7px 10px',background:`${color}08`,borderRadius:8}}>
              <span style={{color,fontWeight:800,flexShrink:0}}>✓</span>
              <span style={{fontSize:12,color:'#44403c'}}>{g}</span>
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 12px',background:`${color}10`,borderRadius:10,borderLeft:`3px solid ${color}`}}>
            <div style={{fontSize:11,fontWeight:800,color,marginBottom:2}}>DAILY HABIT</div>
            <div style={{fontSize:12,color:'#44403c'}}>{j.habit}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaCard({ m }) {
  const color = LEVEL_COLORS[m.level] || '#78716c';
  return (
    <div className="c" style={{marginBottom:12,padding:16,cursor:'pointer'}}
      onClick={() => { if (m.scr) return; window.open(m.web, '_blank', 'noopener,noreferrer'); }}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${m.color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{m.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
            <span style={{fontSize:14,fontWeight:800,color:m.color}}>{m.name}</span>
            <span style={{background:`${color}20`,color,fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:20,border:`1px solid ${color}40`}}>{m.level}</span>
          </div>
          <div style={{fontSize:12,color:'#78716c'}}>{m.desc}</div>
        </div>
      </div>
      <div style={{padding:'10px 12px',background:'rgba(14,116,144,.04)',borderRadius:10,borderLeft:'3px solid rgba(14,116,144,.2)'}}>
        <div style={{fontSize:11,fontWeight:800,color:'#0e7490',marginBottom:3}}>WHY THIS HELPS</div>
        <div style={{fontSize:12,color:'#44403c',lineHeight:1.5}}>{m.tip}</div>
      </div>
      {!m.scr && m.web && <div style={{marginTop:10,textAlign:'right',fontSize:11,color:'#0e7490',fontWeight:700}}>Open → </div>}
    </div>
  );
}

function FilterBtn({ label, active, onClick, color }) {
  return (
    <button onClick={onClick}
      style={{padding:'5px 12px',borderRadius:20,border:`2px solid ${active?color:'#e7e5e4'}`,background:active?`${color}15`:'white',fontSize:11,fontWeight:700,cursor:'pointer',color:active?color:'#78716c',transition:'all .15s',whiteSpace:'nowrap'}}>
      {label}
    </button>
  );
}
