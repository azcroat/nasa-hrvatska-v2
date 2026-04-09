import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// On Android WebView (Capacitor), Framer Motion entry animations can stall
// leaving elements permanently at opacity:0. Skip entry animation on native.
const _isNative = typeof window !== 'undefined' &&
  !!(window.Capacitor?.isNativePlatform?.());
import { LEARN_PATH, getStreak, getDailyChallenge, speak, preloadAudio, DAILY_QUESTS, getActiveCampaign, V } from '../../data.jsx';
import { getWordOfDay } from '../../lib/wordOfDay.js';
import { addWordToSRS } from '../../lib/srs.js';
import { PHRASE_OF_DAY_POOL as PHRASES_365 } from '../../data/daily-content.js';
import { weekKey, localDateStr } from '../../lib/dateUtils.js';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.jsx';
import { safeGetItem } from '../../hooks/useLocalStorage';

// Screens that require launch-time initialization — direct navigation to them
// without proper state setup produces a blank ScreenGuard or empty screen.
// Vocab lessons use curEx 'vocab_topicname' (not a real screen ID) and are
// covered by the dedicated "Resume lesson" button in PathProgressCard.
const _NO_DIRECT_RESUME = new Set(['vocab_', 'mcgame', 'flashcards', 'listening', 'match', 'speaking', 'lesson']);

// Read last activity saved by App.jsx when exercises are launched
function getLastActivity() {
  const ex = safeGetItem('nh_last_ex');
  const label = safeGetItem('nh_last_ex_label');
  if (!ex || !label) return null;
  // Skip exercises that can't be navigated to directly without init data
  if (ex.startsWith('vocab_') || _NO_DIRECT_RESUME.has(ex)) return null;
  return { ex, label };
}
import HeroSection from './HeroSection.jsx';
import PathProgressCard from './PathProgressCard.jsx';
import ReviewTabContent from './ReviewTabContent.jsx';
import CampaignBanner from './CampaignBanner.jsx';
import DailyCroatianSection from './DailyCroatianSection.jsx';
import ProgressTabContent from './ProgressTabContent.jsx';
import WelcomeBackBanners from './WelcomeBackBanners.jsx';
import GoalSetterModal from '../shared/GoalSetterModal.jsx';
import WeeklyRecapModal, { markRecapShown } from './WeeklyRecapModal.jsx';
import UnitCompleteBanner from './UnitCompleteBanner.jsx';
import StreakMilestoneToast, { checkAndMarkMilestone } from '../shared/StreakMilestoneToast.jsx';
// DalmatianCoast SVG replaced with real AI/CC photography
// import { DalmatianCoast } from '../illustrations';

const PHRASE_OF_DAY_POOL = [
  { hr: 'Kako si?',              en: 'How are you?',             note: 'Informal — use with friends and family' },
  { hr: 'Hvala lijepa!',         en: 'Thank you very much!',     note: 'Warmer than plain "hvala"' },
  { hr: 'Gdje je more?',         en: 'Where is the sea?',        note: 'Essential for any trip to Dalmatia' },
  { hr: 'Koliko košta?',         en: 'How much does it cost?',   note: 'Markets, restaurants, everywhere' },
  { hr: 'Jedna kava, molim.',    en: 'One coffee, please.',      note: 'The most Croatian sentence there is' },
  { hr: 'Lijepo je ovdje.',      en: "It's beautiful here.",     note: "You'll say this constantly in Croatia" },
  { hr: 'Idemo na plažu!',       en: "Let's go to the beach!",   note: 'Summer vocabulary — critical' },
  { hr: 'Dobar tek!',            en: 'Enjoy your meal!',         note: 'Said before eating — like "bon appétit"' },
  { hr: 'Živjeli!',              en: 'Cheers!',                  note: 'For rakija, wine, or pivo (beer)' },
  { hr: 'Nema problema.',        en: 'No problem.',              note: 'The Croatian spirit in two words' },
  { hr: 'Polako, ali sigurno.',  en: 'Slowly but surely.',       note: 'A saying — and a way of life' },
  { hr: 'Učim hrvatski.',        en: 'I am learning Croatian.',  note: 'Guaranteed to make any Croatian smile' },
  { hr: 'Gdje stanujete?',       en: 'Where do you live?',       note: 'Formal — for new acquaintances' },
  { hr: 'Stvarno lijepo.',       en: 'Truly beautiful.',         note: 'Genuine appreciation, not just polite' },
];

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
  { grad: "linear-gradient(135deg,#134e4a,#0d9488)", light: "#ccfbf1", text: "#134e4a", border: "#5eead4" },  // Virtuoz — deep teal
  { grad: "linear-gradient(135deg,#1e1b4b,#3730a3)", light: "#e0e7ff", text: "#1e1b4b", border: "#a5b4fc" },  // Majstor — indigo
];

function getWeekXP() {
  return safeGetItem('nh_week_xp_' + weekKey(), 0);
}

export default function HomeTab({
  dchlA, sDchlA: _sDchlA, dchlSl: _dchlSl, sDchlSl: _sDchlSl,
  getWeekStats,
  setTab, sCurEx,
  allCats: _allCats, sh: _sh,
  launchPathItem,
  syncReady, onSyncNow, authUser,
  comebackBonus,
  goal,
  isNewUserWindow = false,
  daysSinceJoin = null,
  resumeLesson = null,
}) {
  const { setScr, doSignUp, launchSpeaking } = useApp();
  const { stats: st, award } = useStats();
  const dc = useMemo(() => getDailyChallenge(), []);
   
  const ws = useMemo(() => getWeekStats(), [st]);
   
  const weekXP = useMemo(() => getWeekXP(), [st]);
   
  const streak = useMemo(() => getStreak(), [st]);
   
  const lastActivity = useMemo(() => getLastActivity(), [st]);
  // Track the current calendar day — updates when the app regains visibility so
  // word-of-day and phrase-of-day refresh automatically after midnight.
  const [currentDayIdx, setCurrentDayIdx] = useState(() => Math.floor(Date.now() / 86400000));
  useEffect(() => {
    const checkDay = () => {
      const newDay = Math.floor(Date.now() / 86400000);
      setCurrentDayIdx(prev => (prev !== newDay ? newDay : prev));
    };
    document.addEventListener('visibilitychange', checkDay);
    return () => document.removeEventListener('visibilitychange', checkDay);
  }, []);

  const wod = useMemo(() => getWordOfDay(), [currentDayIdx]);

  // Preload word-of-the-day audio on mount so first tap plays instantly
  useEffect(() => { if (wod?.[0]) preloadAudio(wod[0]); }, [wod]);

  const userGoal = goal || (() => { try { return localStorage.getItem('nh_goal'); } catch { return null; } })() || 'fluent';
  const activeCampaign = useMemo(() => getActiveCampaign(), [st.lc]);  

  // Goal-setter modal: show for new users who haven't set a goal yet
  // Show goal modal for ANY user who hasn't set a goal yet — not just lc === 0.
  // The lc check was wrong: post-placement users have lc > 0 but still need goal-setting.
  const [showGoalModal, setShowGoalModal] = useState(
    () => !localStorage.getItem('nh_goal_set')
  );

  // Weekly recap modal — DuoLingo best practice: show weekly report on Monday mornings
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);

  const [htab, setHTab] = useState('today');

  // Streak milestone celebration — fires once per milestone level
  const [streakMilestone, setStreakMilestone] = useState(null);
  useEffect(() => {
    if (streak.count > 0 && checkAndMarkMilestone(streak.count)) {
      setStreakMilestone(streak.count);
    }
  }, [streak.count]);

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
      culture:      q('culture'),
      culture2:     q('culture2'),
      vocab:        q('vocab'),
      vocab2:       q('vocab2'),
      write:        q('write'),
      streak:       hasStreak,
      streak_alive: hasStreak,
      perfect:      q('perfect'),
    };
  }, [streak]);
  const allQuestsDone = Object.values(questsDone).every(Boolean);
  const _questXP = DAILY_QUESTS.filter(q => questsDone[q.id]).reduce((s,q) => s + q.xp, 0); void _questXP;

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

  const _allOpts = useMemo(() => dc.challenges?.map(ch => ch.opts || [ch.a]) || [], [dc.challenges]); void _allOpts;
  const doneCount = dchlA.filter(Boolean).length;
  const _allDone = doneCount === 3; void _allDone;

  const [_dcOpen, _setDcOpen] = useState(doneCount === 0); void _dcOpen; void _setDcOpen;
  const [campaignDismissed, setCampaignDismissed] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [wodSRSAdded, setWodSRSAdded] = useState(false);
  const [anchorDismissed, setAnchorDismissed] = useState(() => {
    try { return localStorage.getItem('nh_anchor_dismissed_' + new Date().toISOString().slice(0,10)) === '1'; } catch { return false; }
  });

  function _readCampaignQuestsDone(campaign) {
    if (!campaign?.quests?.length) return {};
    const result = {};
    for (const q of campaign.quests) {
      result[q.id] = localStorage.getItem(`nh_cq_${campaign.id}_${q.id}`) === '1';
    }
    return result;
  }
  // campaignQuestsDone is derived directly from localStorage on every render.
  // This eliminates every race condition: no stale React state, no dependency on
  // when Firebase restoration finishes or when event listeners are attached.
  // Any render — from any cause — always reads the current localStorage value.
  const campaignQuestsDone = _readCampaignQuestsDone(activeCampaign);

  // _forceQuestRender exists solely to trigger a re-render when quest state changes.
  // The actual data is read above from localStorage — not from this state.
  const [, _forceQuestRender] = useState(0);
  useEffect(() => {
    const resync = () => _forceQuestRender(t => t + 1);
    window.addEventListener('focus', resync);
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('nh-campaign-quest-done', resync);
    return () => {
      window.removeEventListener('focus', resync);
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('nh-campaign-quest-done', resync);
    };
  }, []);

  function markCampaignQuestDone(questId) {
    if (!activeCampaign) return;
    try { localStorage.setItem(`nh_cq_${activeCampaign.id}_${questId}`, '1'); } catch (_) {}
    _forceQuestRender(t => t + 1);
  }

  const longAbsence = useMemo(() => {
    const ls = localStorage.getItem('nh_last_seen');
    if (!ls) return false;
    const parsed = parseInt(ls, 10);
    if (isNaN(parsed)) return false;
    const diff = Date.now() - parsed;
    return diff > 7 * 86400000; // more than 7 days
  }, []);

  const pathData = useMemo(() => {
    let totalDone = 0, totalItems = 0;
    let activeLv = null, activeLvDone = 0, activeLvItemDone = null, nextItem = null;
    for (const lv of LEARN_PATH) {
      let lvd = 0;
      const itemDone = lv.items.map(it => {
        totalItems++;
        const done = it.ck(st);
        if (done) { totalDone++; lvd++; }
        else if (!nextItem) nextItem = { ...it, levelTitle: lv.title };
        return done;
      });
      if (!activeLv && lvd < lv.items.length) {
        activeLv = lv; activeLvDone = lvd; activeLvItemDone = itemDone;
      }
    }
    if (!activeLv) {
      activeLv = LEARN_PATH[LEARN_PATH.length - 1];
      activeLvDone = activeLv.items.length;
      activeLvItemDone = activeLv.items.map(() => true);
    }
    return { totalDone, totalItems, pct: Math.round(totalDone / totalItems * 100), activeLv, activeLvDone, activeLvItemDone, nextItem };
  }, [st]);

  const activePalette = LEVEL_PALETTE[(pathData.activeLv.level - 1) % LEVEL_PALETTE.length];

  // ── Unit completion detection — show banner when user advances to next level ──
  const prevLvRef = React.useRef(pathData.activeLv);
  const [completedLevel, setCompletedLevel] = useState(null);
  useEffect(() => {
    const prev = prevLvRef.current;
    if (pathData.activeLv.level > prev.level) {
      const shownKey = 'nh_unit_banner_L' + prev.level;
      if (!localStorage.getItem(shownKey)) {
        localStorage.setItem(shownKey, '1');
        setCompletedLevel(prev);
      }
    }
    prevLvRef.current = pathData.activeLv;
  }, [pathData.activeLv.level]);

  // Daily rotating phrases — uses 365-entry curated pool so every day of the year is unique
  const phraseOfDay = useMemo(() => {
    const pool = PHRASES_365?.length ? PHRASES_365 : PHRASE_OF_DAY_POOL;
    return pool[currentDayIdx % pool.length];
  }, [currentDayIdx]);

  const todayPhrases = useMemo(() => {
    const start = (currentDayIdx * 4) % DAILY_PHRASES.length;
    return [0, 1, 2, 3].map(i => DAILY_PHRASES[(start + i) % DAILY_PHRASES.length]);
  }, [currentDayIdx]);

  return (
    <React.Fragment>

      {/* ── GOAL SETTER MODAL (new users only) ── */}
      {showGoalModal && (
        <GoalSetterModal onComplete={() => setShowGoalModal(false)} />
      )}

      {/* ── WEEKLY RECAP MODAL (Monday mornings — DuoLingo best practice) ── */}
      {showWeeklyRecap && (
        // markRecapShown() called immediately on display (not just close) so tab-switching
        // doesn't re-show the modal before the user has a chance to close it.
        <WeeklyRecapModal onClose={() => { markRecapShown(); setShowWeeklyRecap(false); }}
          onMount={() => markRecapShown()} />
      )}

      {/* ── STREAK MILESTONE CELEBRATION ── */}
      {streakMilestone && (
        <StreakMilestoneToast
          streakCount={streakMilestone}
          onDismiss={() => setStreakMilestone(null)}
        />
      )}

      {/* ── UNIT COMPLETE BANNER (fires once when user finishes a learning path level) ── */}
      {completedLevel && (
        <UnitCompleteBanner
          completedLevel={completedLevel}
          award={award}
          onClose={() => setCompletedLevel(null)}
        />
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
        launchPathItem={launchPathItem}
      />

      {/* ── DAILY CROATIAN PHRASES — always visible, above sub-tabs ── */}
      {/* Landmark photo + 4 tappable phrases = the #1 daily habit trigger.      */}
      {/* Lives above the sub-tab selector so it's the first interactive element */}
      {/* users see on every app open, regardless of which sub-tab they used last.*/}
      <DailyCroatianSection todayPhrases={todayPhrases} />

      {/* ── SUB-TAB PILL SELECTOR ── */}
      <div className="sub-tab-row">
        {[
          { id:'today',    label:'⚡ Today' },
          { id:'progress', label:'📈 Progress' },
          { id:'review',   label:'🔄 Review' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setHTab(t.id)}
            className={`sub-tab-pill${htab === t.id ? ' sub-tab--active' : ''}`}
          >{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB CONTENT — AnimatePresence fades between panels
      ══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
      {htab === 'today' && (
        <motion.div key="today"
          initial={_isNative ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}
        >
        <React.Fragment>

          {/* ── TODAY'S MISSION — one bold primary CTA when day is fresh ── */}
          {!allQuestsDone && !anchorDismissed && (() => {
            // Find the highest-XP incomplete tier-1 quest
            const incomplete = DAILY_QUESTS.filter(q => q.tier === 1 && !questsDone[q.id]);
            const mission = incomplete.sort((a, b) => b.xp - a.xp)[0];
            if (!mission) return null;
            const missionActions = {
              speak:    { label: 'Start Speaking →', action: () => { const pool = (_allCats||[]).flatMap(t=>V[t]||[]).filter(w=>w&&w[0]&&w[1]); launchSpeaking(_sh(pool).slice(0,6)); } },
              grammar:  { label: 'Open Grammar →', action: () => launchPathItem({ go: 'grammar' }) },
              master:   { label: 'Review Words →', action: () => setScr('review') },
              reading:  { label: 'Read Now →', action: () => setScr('readinglist') },
              culture:  { label: 'Explore Culture →', action: () => setScr('croatia') },
              vocab:    { label: 'Learn Vocab →', action: () => launchPathItem({ go: 'lesson' }) },
              write:    { label: 'Write Something →', action: () => setScr('writing') },
              streak:   { label: 'Start Practicing →', action: () => launchPathItem({ go: 'lesson' }) },
              streak_alive: { label: 'Keep Streak →', action: () => launchPathItem({ go: 'lesson' }) },
            };
            const act = missionActions[mission.id] || { label: 'Start →', action: () => {} };
            return (
              <motion.div
                initial={_isNative ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ marginBottom: 12 }}
              >
                <div style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #3730a3 100%)',
                  borderRadius: 18, padding: '16px 18px',
                  boxShadow: '0 8px 28px rgba(55,48,163,0.35)',
                  border: '1px solid rgba(129,140,248,0.2)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Subtle glow */}
                  <div style={{ position:'absolute', top:-30, right:-20, width:100, height:100, background:'radial-gradient(circle, rgba(165,180,252,0.15) 0%, transparent 70%)', pointerEvents:'none' }} />
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ fontSize:11, fontWeight:900, color:'rgba(199,210,254,0.8)', textTransform:'uppercase', letterSpacing:'.1em' }}>
                      ⚡ Today's Mission
                    </div>
                    <button
                      onClick={() => { localStorage.setItem('nh_anchor_dismissed_' + new Date().toISOString().slice(0,10), '1'); setAnchorDismissed(true); }}
                      aria-label="Dismiss"
                      style={{ background:'none', border:'none', color:'rgba(199,210,254,0.5)', fontSize:16, cursor:'pointer', padding:'0 2px', lineHeight:1 }}
                    >×</button>
                  </div>
                  <div style={{ fontSize:20, fontWeight:900, color:'#e0e7ff', marginBottom:4, lineHeight:1.2 }}>
                    {mission.icon} {mission.name}
                  </div>
                  <div style={{ fontSize:13, color:'rgba(199,210,254,0.7)', marginBottom:14 }}>
                    {mission.desc} · <span style={{ color:'#a5b4fc', fontWeight:700 }}>+{mission.xp} XP</span>
                  </div>
                  <button
                    onClick={act.action}
                    style={{
                      width:'100%', height:44,
                      background:'linear-gradient(135deg, #6366f1, #818cf8)',
                      border:'none', borderRadius:12,
                      fontSize:14, fontWeight:800, color:'#fff',
                      cursor:'pointer', letterSpacing:'.01em',
                      boxShadow:'0 4px 14px rgba(99,102,241,0.5)',
                      fontFamily:"'Outfit',sans-serif",
                    }}
                  >{act.label}</button>
                </div>
              </motion.div>
            );
          })()}

          {/* ── DAILY DISCOVERY — Word of Day + Phrase of Day only ── */}
          {/* Condensed from 5 rows (Word + Phrase + City + Proverb + Fact) to 2.    */}
          {/* City of Day, Proverb, Did You Know removed to reduce scroll depth.       */}
          {(() => {
            return (
              <motion.div initial={_isNative ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.04 }}>
                <div style={{
                  borderRadius: 20, overflow: 'hidden', marginBottom: 12,
                  border: '1px solid var(--card-b)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                }}>
                  {/* Header */}
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
                      <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                        <button
                          onClick={() => speak(wod[0])}
                          aria-label="Hear pronunciation"
                          style={{
                            background: 'linear-gradient(135deg,#0e7490,#0c4a6e)',
                            border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 18,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(14,116,144,0.35)',
                          }}
                        >🔊</button>
                        <button
                          onClick={() => { if (!wodSRSAdded) { try { addWordToSRS(wod[0]); } catch {} setWodSRSAdded(true); } }}
                          aria-label={wodSRSAdded ? 'Added to review queue' : 'Add to spaced repetition review'}
                          title={wodSRSAdded ? 'In your review queue' : 'Add to SRS review queue'}
                          style={{
                            background: wodSRSAdded ? 'rgba(22,163,74,0.12)' : 'rgba(14,116,144,0.1)',
                            border: wodSRSAdded ? '1.5px solid #16a34a' : '1.5px solid rgba(14,116,144,0.3)',
                            borderRadius: 10, width: 44, height: 28, fontSize: 11,
                            cursor: wodSRSAdded ? 'default' : 'pointer',
                            color: wodSRSAdded ? '#16a34a' : '#0e7490',
                            fontWeight: 800, fontFamily:"'Outfit',sans-serif",
                            transition: 'all .2s ease',
                          }}
                        >{wodSRSAdded ? '✓ SRS' : '+ SRS'}</button>
                      </div>
                    </div>
                  )}

                  {/* ── Phrase of the Day section ── */}
                  <div style={{
                    background: 'var(--card)',
                    padding: '12px 16px',
                    borderTop: '1px solid var(--card-b)',
                    borderRadius: '0 0 20px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>
                        🗓️ Phrase of the Day
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)', fontFamily: "'Playfair Display',serif", lineHeight: 1.2 }}>
                        &ldquo;{phraseOfDay.hr}&rdquo;
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 3 }}>{phraseOfDay.en}</div>
                      {phraseOfDay.note && (
                        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2, fontStyle: 'italic' }}>{phraseOfDay.note}</div>
                      )}
                    </div>
                    <button
                      onClick={() => speak(phraseOfDay.hr)}
                      aria-label="Hear pronunciation"
                      style={{
                        background: 'linear-gradient(135deg,#b45309,#92400e)',
                        border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 18,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, boxShadow: '0 2px 10px rgba(180,83,9,0.35)',
                      }}
                    >🔊</button>
                  </div>

                </div>
              </motion.div>
            );
          })()}

          {/* ── AI TOOLS — flagship shortcuts, right after Daily Discovery ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <button
              onClick={() => setScr('aiconvo')}
              style={{
                border: 'none', cursor: 'pointer', padding: 0, borderRadius: 16,
                overflow: 'hidden', background: 'linear-gradient(135deg,#0f0c29,#3730a3)',
                boxShadow: '0 4px 16px rgba(55,48,163,.35)',
              }}
            >
              <div style={{ padding: '16px 12px' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎙️</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 2, textAlign: 'left' }}>AI Conversation</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', textAlign: 'left', lineHeight: 1.4 }}>47 scenarios · live feedback</div>
              </div>
            </button>
            <button
              onClick={() => setScr('live_tutor')}
              style={{
                border: 'none', cursor: 'pointer', padding: 0, borderRadius: 16,
                overflow: 'hidden', background: 'linear-gradient(135deg,#7f1d1d,#D4002D)',
                boxShadow: '0 4px 16px rgba(212,0,45,.3)',
              }}
            >
              <div style={{ padding: '16px 12px' }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎤</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', marginBottom: 2, textAlign: 'left' }}>Live AI Tutor</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', textAlign: 'left', lineHeight: 1.4 }}>Adapts to your level</div>
              </div>
            </button>
          </div>

          {/* ── CAMPAIGN BANNER — lowest priority, at bottom ── */}
          <CampaignBanner
            activeCampaign={activeCampaign}
            campaignDismissed={campaignDismissed}
            setCampaignDismissed={setCampaignDismissed}
            campaignQuestsDone={campaignQuestsDone}
            setTab={setTab}
            onQuestTap={(quest) => {
              if (quest.screen === 'flashcards') {
                markCampaignQuestDone(quest.id);
                launchPathItem({ go: 'lesson', topic: quest.vocab || 'family' });
              } else if (quest.screen === 'lesson') {
                // Lesson screen requires initialized state — launch via launchPathItem
                launchPathItem({ go: 'lesson', topic: quest.vocab || 'family' });
              } else if (quest.screen === 'mcgame') {
                // McGame requires initialized questions — launch via launchPathItem
                launchPathItem({ go: 'mcgame' });
              } else if (quest.screen === 'speaking') {
                // Speaking requires initialized items — build pool and launch
                const pool = (_allCats || []).flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
                const items = _sh(pool).slice(0, 6);
                launchSpeaking(items.length ? items : [['Dobar dan', 'Good day', 'DOH-bar dahn']]);
              } else {
                setScr(quest.screen);
              }
            }}
            onCtaTap={(screen) => {
              // CTA "Start Campaign" uses the same safe-launch logic as quest items
              if (screen === 'lesson') {
                launchPathItem({ go: 'lesson', topic: 'family' });
              } else if (screen === 'mcgame') {
                launchPathItem({ go: 'mcgame' });
              } else if (screen === 'speaking') {
                const pool = (_allCats || []).flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
                const items = _sh(pool).slice(0, 6);
                launchSpeaking(items.length ? items : [['Dobar dan', 'Good day', 'DOH-bar dahn']]);
              } else {
                setScr(screen);
              }
            }}
          />

        </React.Fragment>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          📈 PROGRESS TAB
      ══════════════════════════════════════════ */}
      {htab === 'progress' && (
        <motion.div key="progress"
          initial={_isNative ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <ProgressTabContent
            streak={streak}
            st={st}
            ws={ws}
            weekXP={weekXP}
            nudgeDismissed={nudgeDismissed}
            setNudgeDismissed={setNudgeDismissed}
            setScr={setScr}
          />
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          🔄 REVIEW TAB
      ══════════════════════════════════════════ */}
      {htab === 'review' && (
        <motion.div key="review"
          initial={_isNative ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <ReviewTabContent />
        </motion.div>
      )}
      </AnimatePresence>

    </React.Fragment>
  );
}
