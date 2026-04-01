import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LEARN_PATH, getStreak, getDailyChallenge, speak, preloadAudio, DAILY_QUESTS, getActiveCampaign, getCityOfDay, incrementCulture, getDueReviews, getSR, getProverbOfDay, getHistFact } from '../../data.jsx';
import { getWordOfDay } from '../../lib/wordOfDay.js';
import { weekKey, localDateStr } from '../../lib/dateUtils.js';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.jsx';
import { safeGetItem } from '../../hooks/useLocalStorage.js';

// Read last activity saved by App.jsx when exercises are launched
function getLastActivity() {
  const ex = safeGetItem('nh_last_ex');
  const label = safeGetItem('nh_last_ex_label');
  return ex && label ? { ex, label } : null;
}
import DailyPlanCard from './DailyPlanCard.jsx';
import AdaptiveInsightsCard from '../profile/AdaptiveInsightsCard.jsx';
import HeroSection from './HeroSection.jsx';
import PathProgressCard from './PathProgressCard.jsx';
import QuestTracker from './QuestTracker.jsx';
import ReviewTabContent from './ReviewTabContent.jsx';
import CampaignBanner from './CampaignBanner.jsx';
import DailyCroatianSection from './DailyCroatianSection.jsx';
import AITutorCard from './AITutorCard.jsx';
import ProgressTabContent from './ProgressTabContent.jsx';
import WelcomeBackBanners from './WelcomeBackBanners.jsx';
import GoalSetterModal from '../shared/GoalSetterModal.jsx';
import SpeedChallenge from './SpeedChallenge.jsx';
// DalmatianCoast SVG replaced with real AI/CC photography
// import { DalmatianCoast } from '../illustrations';

const DAILY_PHRASES = [
  { hr: "Dobar dan!", en: "Good day!", cat: "Greetings" },
  { hr: "Kako ste?", en: "How are you?", cat: "Greetings" },
  { hr: "Hvala lijepo.", en: "Thank you very much.", cat: "Courtesy" },
  { hr: "Molim vas.", en: "Please / You're welcome.", cat: "Courtesy" },
  { hr: "Gdje je plaža?", en: "Where is the beach?", cat: "Travel" },
  { hr: "Koliko košta?", en: "How much does it cost?", cat: "Shopping" },
  { hr: "Govorite li engleski?", en: "Do you speak English?", cat: "Communication" },
  { hr: "Jedno kava, molim.", en: "One coffee, please.", cat: "Food & Drink" },
  { hr: "Uživam u Hrvatskoj.", en: "I'm enjoying Croatia.", cat: "Travel" },
  { hr: "Sretan put!", en: "Have a good trip!", cat: "Farewells" },
  { hr: "Vidimo se!", en: "See you!", cat: "Farewells" },
  { hr: "Ne razumijem.", en: "I don't understand.", cat: "Communication" },
  { hr: "Možete li ponoviti?", en: "Can you repeat that?", cat: "Communication" },
  { hr: "Gdje je WC?", en: "Where is the bathroom?", cat: "Travel" },
  { hr: "Volim Hrvatsku!", en: "I love Croatia!", cat: "Feelings" },
  { hr: "Lijepo jutro!", en: "Beautiful morning!", cat: "Greetings" },
  { hr: "Što imate za jesti?", en: "What do you have to eat?", cat: "Food & Drink" },
  { hr: "Račun, molim.", en: "The bill, please.", cat: "Food & Drink" },
  { hr: "Živjeli!", en: "Cheers!", cat: "Social" },
  { hr: "Sretno!", en: "Good luck!", cat: "Social" },
  { hr: "Sve je u redu.", en: "Everything is fine.", cat: "Feelings" },
  { hr: "Volim te.", en: "I love you.", cat: "Feelings" },
  { hr: "Oprostite.", en: "Excuse me / Sorry.", cat: "Courtesy" },
  { hr: "Gdje je hotel?", en: "Where is the hotel?", cat: "Travel" },
  { hr: "Trebam pomoć.", en: "I need help.", cat: "Communication" },
  { hr: "Lijepo je ovdje.", en: "It's beautiful here.", cat: "Appreciation" },
  { hr: "Kakvo je vrijeme?", en: "What's the weather like?", cat: "Small Talk" },
  { hr: "Govorim malo hrvatski.", en: "I speak a little Croatian.", cat: "Communication" },
];

const LEVEL_PALETTE = [
  { grad: "linear-gradient(135deg,#92400e,#b45309)", light: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  { grad: "linear-gradient(135deg,#065f46,#059669)", light: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  { grad: "linear-gradient(135deg,#1e3a8a,#1d4ed8)", light: "#dbeafe", text: "#1e3a8a", border: "#93c5fd" },
  { grad: "linear-gradient(135deg,#4c1d95,#6d28d9)", light: "#ede9fe", text: "#4c1d95", border: "#c4b5fd" },
  { grad: "linear-gradient(135deg,#7f1d1d,#dc2626)", light: "#fee2e2", text: "#7f1d1d", border: "#fca5a5" },
];

function getWeekXP() {
  return safeGetItem('nh_week_xp_' + weekKey(), 0);
}

export default function HomeTab({
  dchlA, sDchlA, dchlSl, sDchlSl,
  getWeekStats,
  setTab, sCurEx,
  allCats, sh,
  launchPathItem,
  syncReady, onSyncNow, authUser,
  comebackBonus,
  goal,
  isNewUserWindow = false,
  daysSinceJoin = null,
  resumeLesson = null,
}) {
  const { setScr, doSignUp } = useApp();
  const { level, stats: st, award } = useStats();
  const dc = useMemo(() => getDailyChallenge(), []);
  const ws = useMemo(() => getWeekStats(), [st]);
  const weekXP = useMemo(() => getWeekXP(), [st]);
  const streak = useMemo(() => getStreak(), [st]);
  const lastActivity = useMemo(() => getLastActivity(), [st]);
  const wod = useMemo(() => getWordOfDay(), []);

  // Preload word-of-the-day audio on mount so first tap plays instantly
  useEffect(() => { if (wod?.[0]) preloadAudio(wod[0]); }, [wod]);

  const userGoal = goal || localStorage.getItem('nh_goal') || 'fluent';
  const activeCampaign = useMemo(() => getActiveCampaign(), []);

  // Goal-setter modal: show for new users who haven't set a goal yet
  const [showGoalModal, setShowGoalModal] = useState(
    () => st.lc === 0 && !localStorage.getItem('nh_goal_set')
  );

  const [htab, setHTab] = useState('today');

  const questsDone = useMemo(() => {
    const d = localDateStr();
    const q = (id) => localStorage.getItem('nh_quest_' + id + '_' + d) === '1';
    const hasStreak = streak.count > 0;
    return {
      speak:        q('speak'),
      speak2:       q('speak2'),
      grammar:      q('grammar'),
      grammar2:     q('grammar2'),
      master:       q('master'),
      master2:      q('master2'),
      reading:      q('reading'),
      reading2:     q('reading2'),
      streak:       hasStreak,
      streak_alive: hasStreak,
      perfect:      q('perfect'),
    };
  }, [streak]);
  const allQuestsDone = Object.values(questsDone).every(Boolean);
  const questXP = DAILY_QUESTS.filter(q => questsDone[q.id]).reduce((s,q) => s + q.xp, 0);

  // Award Daily Mastery +50 XP bonus the first time all quests are done today
  // Use local calendar date — UTC ISO string gives wrong date for UTC+ timezones
  const _td = new Date();
  const today = _td.getFullYear() + '-' + String(_td.getMonth() + 1).padStart(2, '0') + '-' + String(_td.getDate()).padStart(2, '0');
  const masteryKey = `nh_daily_mastery_${today}`;
  useEffect(() => {
    if (allQuestsDone && !localStorage.getItem(masteryKey)) {
      localStorage.setItem(masteryKey, '1');
      if (award) award(50);
    }
  }, [allQuestsDone, masteryKey, award]);

  const allOpts = useMemo(() => dc.challenges?.map(ch => ch.opts || [ch.a]) || [], [dc.challenges]);
  const doneCount = dchlA.filter(Boolean).length;
  const allDone = doneCount === 3;

  const [dcOpen, setDcOpen] = useState(doneCount === 0);
  const [campaignDismissed, setCampaignDismissed] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const campaignQuestsDone = useMemo(() => {
    if (!activeCampaign || !activeCampaign.quests || activeCampaign.quests.length === 0) return {};
    const result = {};
    for (const q of activeCampaign.quests) {
      result[q.id] = localStorage.getItem(`nh_cq_${activeCampaign.id}_${q.id}`) === '1';
    }
    return result;
  }, [activeCampaign]);

  const longAbsence = useMemo(() => {
    const ls = localStorage.getItem('nh_last_seen');
    if (!ls) return false;
    const diff = Date.now() - parseInt(ls);
    return diff > 7 * 86400000; // more than 7 days
  }, []);

  const pathData = useMemo(() => {
    let totalDone = 0, totalItems = 0;
    let activeLv = null, activeLvDone = 0, nextItem = null;
    for (const lv of LEARN_PATH) {
      let lvd = 0;
      for (const it of lv.items) {
        totalItems++;
        if (it.ck(st)) { totalDone++; lvd++; }
        else if (!nextItem) nextItem = { ...it, levelTitle: lv.title };
      }
      if (!activeLv && lvd < lv.items.length) { activeLv = lv; activeLvDone = lvd; }
    }
    if (!activeLv) { activeLv = LEARN_PATH[LEARN_PATH.length - 1]; activeLvDone = activeLv.items.length; }
    return { totalDone, totalItems, pct: Math.round(totalDone / totalItems * 100), activeLv, activeLvDone, nextItem };
  }, [st]);

  const activePalette = LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length];

  // Daily rotating phrases — 4 new phrases per day, cycles through the full pool
  const todayPhrases = useMemo(() => {
    const dayIdx = Math.floor(Date.now() / 86400000);
    const start = (dayIdx * 4) % DAILY_PHRASES.length;
    return [0, 1, 2, 3].map(i => DAILY_PHRASES[(start + i) % DAILY_PHRASES.length]);
  }, []);

  return (
    <React.Fragment>

      {/* ── GOAL SETTER MODAL (new users only) ── */}
      {showGoalModal && (
        <GoalSetterModal onComplete={() => setShowGoalModal(false)} />
      )}


      {/* ── GUEST SAVE-PROGRESS BANNER ── */}
      {!authUser && st.xp > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #0e7490, #164e63)',
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>💾</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '.04em' }}>
              Explore mode · {st.xp} XP earned
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
              Create a free account to sync across all your devices
            </div>
          </div>
          <button
            onClick={doSignUp}
            style={{
              flexShrink: 0,
              background: '#fff',
              color: '#0e7490',
              border: 'none',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            Save Free →
          </button>
        </div>
      )}

      <WelcomeBackBanners
        comebackBonus={comebackBonus}
        longAbsence={longAbsence}
        isNewUserWindow={isNewUserWindow}
        daysSinceJoin={daysSinceJoin}
      />

      {/* ── CONTINUE LEARNING — primary CTA first ── */}
      <PathProgressCard
        activePalette={activePalette}
        pathData={pathData}
        syncReady={syncReady}
        launchPathItem={launchPathItem}
        setTab={setTab}
        resumeLesson={resumeLesson}
        lastActivity={lastActivity}
        sCurEx={sCurEx}
      />

      {/* ── HERO ── */}
      <HeroSection
        streak={streak}
        pathData={pathData}
        allQuestsDone={allQuestsDone}
        userGoal={userGoal}
        comebackBonus={comebackBonus}
        lastActivity={lastActivity}
        sCurEx={sCurEx}
        onSyncNow={onSyncNow}
        wsMastered={ws.strong}
      />

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <div style={{ display:'flex', gap:8, padding:'20px 0 4px', borderBottom:'1px solid var(--bar-bg)', marginBottom:16 }}>
        {[
          { id:'today',    label:'⚡ Today' },
          { id:'progress', label:'📈 Progress' },
          { id:'review',   label:'🔄 Review' },
        ].map(t => (
          <button key={t.id} onClick={() => setHTab(t.id)} style={{
            flex:1, padding:'8px 4px', borderRadius:20, border:'none',
            background: htab === t.id ? 'var(--info)' : 'var(--bar-bg)',
            color: htab === t.id ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:13, cursor:'pointer',
            transition:'background 0.2s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          ⚡ TODAY TAB
      ══════════════════════════════════════════ */}
      {htab === 'today' && (
        <React.Fragment>

          {/* ── SRS DUE REVIEWS — session-entry banner ── */}
          {(() => {
            const due = getDueReviews();
            if (!due.length) return null;
            const dismissKey = 'nh_srs_banner_dismissed_' + localDateStr();
            if (sessionStorage.getItem(dismissKey)) return null;
            const sr = getSR();
            const allCards = Object.values(sr);
            const masteryPct = allCards.length > 0
              ? Math.round(allCards.reduce((s, v) => s + (v.r || 0) / Math.max((v.r || 0) + (v.w || 0), 1), 0) / allCards.length * 100)
              : 0;
            return (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{ marginBottom: 14 }}
                data-srs-banner="1"
              >
                <div style={{
                  borderRadius: 18, overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(14,116,144,.18)',
                  border: '1.5px solid rgba(14,116,144,.2)',
                }}>
                  {/* ── Gradient header ── */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0c4a6e 0%, #0e7490 60%, #0891b2 100%)',
                    padding: '14px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                        background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      }}>🧠</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>
                          SPACED REPETITION
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Words Due for Review</div>
                      </div>
                      <div style={{
                        flexShrink: 0, background: 'rgba(255,255,255,.15)',
                        border: '1.5px solid rgba(255,255,255,.25)',
                        borderRadius: 10, padding: '4px 10px',
                        fontSize: 12, fontWeight: 800, color: '#fff',
                      }}>
                        {due.length} word{due.length !== 1 ? 's' : ''}
                      </div>
                      <button
                        aria-label="Dismiss review reminder"
                        style={{
                          flexShrink: 0, background: 'none', border: 'none',
                          color: 'rgba(255,255,255,.5)', fontSize: 18,
                          cursor: 'pointer', lineHeight: 1, padding: '2px 6px',
                        }}
                        onClick={(e) => { e.stopPropagation(); sessionStorage.setItem(dismissKey, '1'); e.currentTarget.closest('[data-srs-banner]').style.display = 'none'; }}
                      >×</button>
                    </div>

                    {/* Mastery progress bar */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>
                          Vocabulary mastery
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>
                          {masteryPct}%
                        </span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: masteryPct + '%',
                          background: 'rgba(255,255,255,.75)',
                          borderRadius: 3, transition: 'width .4s ease',
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div style={{ background: 'var(--card)', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600, lineHeight: 1.4 }}>
                      Review now to lock words into long-term memory.
                    </div>
                    <button
                      onClick={() => setScr('review')}
                      style={{
                        flexShrink: 0, background: '#0e7490', color: '#fff', border: 'none',
                        borderRadius: 10, padding: '8px 18px',
                        fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        fontFamily: "'Outfit', sans-serif",
                        boxShadow: '0 3px 10px rgba(14,116,144,.35)',
                      }}
                    >
                      Review Now →
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {/* Campaign banner */}
          <CampaignBanner
            activeCampaign={activeCampaign}
            campaignDismissed={campaignDismissed}
            setCampaignDismissed={setCampaignDismissed}
            campaignQuestsDone={campaignQuestsDone}
            setTab={setTab}
            onQuestTap={(quest) => {
              if (quest.screen === 'flashcards') {
                launchPathItem({ go: 'lesson', topic: quest.vocab || 'family' });
              } else {
                setScr(quest.screen);
              }
            }}
          />

          {/* ── DAILY DISCOVERY — Word of the Day + City of the Day merged banner ── */}
          {(() => {
            const city = getCityOfDay();
            return (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.04 }}>
                <div style={{
                  borderRadius: 20, overflow: 'hidden', marginBottom: 12,
                  border: '1px solid var(--card-b)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                }}>
                  {/* ── Header label ── */}
                  <div style={{
                    background: 'linear-gradient(90deg, #0e7490, #0c4a6e)',
                    padding: '8px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🇭🇷</span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.95)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Daily Discovery</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* ── Word of the Day section ── */}
                  {wod && (
                    <div style={{
                      background: 'var(--card)',
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--card-b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#0e7490', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
                          Word of the Day
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", lineHeight: 1.1 }}>
                          {wod[0]}
                        </div>
                        {wod[2] && (
                          <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2, fontStyle: 'italic' }}>{wod[2]}</div>
                        )}
                        <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 3 }}>{wod[1]}</div>
                      </div>
                      <button
                        onClick={() => speak(wod[0])}
                        aria-label="Hear pronunciation"
                        style={{
                          background: 'linear-gradient(135deg,#0e7490,#0c4a6e)',
                          border: 'none', borderRadius: '50%', width: 48, height: 48, fontSize: 20,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, boxShadow: '0 2px 10px rgba(14,116,144,0.35)',
                        }}
                      >🔊</button>
                    </div>
                  )}

                  {/* ── City of the Day section ── */}
                  <button
                    onClick={() => { incrementCulture('cityCnt'); if (award) award(3); setScr('cityofday'); }}
                    aria-label={`City of the Day: ${city.name}`}
                    style={{
                      width: '100%', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                      display: 'block',
                    }}
                  >
                    <div style={{
                      background: `linear-gradient(135deg, ${city.color}ee 0%, ${city.color}bb 100%)`,
                      padding: '12px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0, opacity: 0.06,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                        backgroundSize: '16px 16px', pointerEvents: 'none',
                      }} />
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                        background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 26, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        position: 'relative',
                      }}>
                        {city.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>
                          City of the Day
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: "'Playfair Display',serif", lineHeight: 1.2 }}>
                          {city.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                          {city.region} · {city.vocab.length} words to learn
                        </div>
                      </div>
                      <div style={{
                        flexShrink: 0, background: 'rgba(255,255,255,0.2)', borderRadius: 10,
                        padding: '4px 10px', fontSize: 12, fontWeight: 700, color: '#fff',
                        position: 'relative',
                      }}>
                        Explore →
                      </div>
                    </div>
                  </button>

                  {/* ── Proverb of the Day ── */}
                  {(() => {
                    const proverb = getProverbOfDay();
                    return (
                      <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid var(--card-b)',
                        background: 'var(--card)',
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                      }}>
                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>📜</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
                            Proverb of the Day
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.45, marginBottom: 3 }}>
                            {proverb.hr}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            {proverb.en}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Did You Know? ── */}
                  {(() => {
                    const fact = getHistFact();
                    return (
                      <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid var(--card-b)',
                        background: 'var(--card)',
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        borderRadius: '0 0 20px 20px',
                      }}>
                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>💡</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
                            Did You Know?
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.45, marginBottom: 3 }}>
                            {fact.hr}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--subtext)', fontStyle: 'italic', lineHeight: 1.4 }}>
                            {fact.en}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            );
          })()}

          {/* ── TODAY'S FOCUS HEADER ── */}
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, marginTop:24}}>
            <div style={{width:3, height:20, background:'var(--info)', borderRadius:2}}/>
            <span style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', letterSpacing:'0.08em', textTransform:'uppercase'}}>Today's Focus</span>
          </div>

          {/* ── AI DAILY PLAN ── */}
          <DailyPlanCard level={level} goal={goal} streak={streak} setScr={setScr} />

          {/* ── ADAPTIVE AI INSIGHTS ── */}
          {authUser?.u && st.lc >= 2 && (
            <AdaptiveInsightsCard
              uid={authUser.u}
              level={level}
              lessonsCompleted={st.lc}
              goToScreen={setScr}
            />
          )}

          {/* ── AI LIVE TUTOR HERO CARD ── */}
          <AITutorCard />

          {/* ── DAILY QUESTS ── */}
          <QuestTracker
            questsDone={questsDone}
            allQuestsDone={allQuestsDone}
            onQuestStart={(questId, screen) => {
              if (questId === 'grammar' || questId === 'grammar2') {
                launchPathItem({ go: 'grammar' });
              } else {
                setScr(screen);
              }
            }}
          />

          {/* ── SPEED CHALLENGE — daily timed vocabulary quiz ── */}
          <SpeedChallenge />

          {/* ── TODAY'S CROATIAN + QUICK TRANSLATE ── */}
          <DailyCroatianSection
            todayPhrases={todayPhrases}
          />

        </React.Fragment>
      )}

      {/* ══════════════════════════════════════════
          📈 PROGRESS TAB
      ══════════════════════════════════════════ */}
      {htab === 'progress' && (
        <ProgressTabContent
          streak={streak}
          st={st}
          ws={ws}
          weekXP={weekXP}
          nudgeDismissed={nudgeDismissed}
          setNudgeDismissed={setNudgeDismissed}
          setScr={setScr}
        />
      )}

      {/* ══════════════════════════════════════════
          🔄 REVIEW TAB
      ══════════════════════════════════════════ */}
      {htab === 'review' && <ReviewTabContent />}

    </React.Fragment>
  );
}
