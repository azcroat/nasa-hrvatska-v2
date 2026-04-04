import React, { useState, useEffect, useRef, useMemo } from 'react';
import { speak } from '../../data.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { useStats } from '../../context/StatsContext.jsx';
import { markPracticed } from '../../hooks/useNotifications.js';
import { markQuest } from '../../lib/quests.js';
import { logError, getErrorsForAPI } from '../../lib/learnerErrors.js';
import { SCENARIOS, deriveWeakAreas, deriveMastered } from './ConversationScenarios.js';
import { apiFetch } from '../../lib/apiFetch.js';
import AIConversationHeader from './AIConversationHeader.jsx';
import AIConversationWriteSetup from './AIConversationWriteSetup.jsx';
import AIConversationWriteResult from './AIConversationWriteResult.jsx';
import AIConversationConvoSetup from './AIConversationConvoSetup.jsx';
import AIConversationResult from './AIConversationResult.jsx';
import AIConversationChat from './AIConversationChat.jsx';
import AIWordTooltip from './AIWordTooltip.jsx';

// ── Writing prompts ──────────────────────────────────────────────────────────
const WRITE_PROMPTS = [
  { id:"w_intro",     level:"A1", icon:"👋", title:"Introduce Yourself",     hr:"Predstavi se",         prompt:"Write 4–5 sentences in Croatian introducing yourself. Include your name, where you're from, and one hobby." },
  { id:"w_family",    level:"A1", icon:"👨‍👩‍👧", title:"My Family",               hr:"Moja obitelj",          prompt:"Describe your family in 4–5 sentences. Who is in your family? Where do they live?" },
  { id:"w_morning",   level:"A2", icon:"🌅", title:"My Morning Routine",      hr:"Moje jutro",            prompt:"Describe what you do every morning, from waking up to leaving the house. Use at least 6 sentences." },
  { id:"w_city",      level:"A2", icon:"🏙️", title:"My City",                 hr:"Moj grad",              prompt:"Write about the city or town where you live. What do you like about it? What do you dislike?" },
  { id:"w_weekend",   level:"B1", icon:"📅", title:"Last Weekend",            hr:"Prošli vikend",         prompt:"Write about what you did last weekend. Use past tense. What did you enjoy? What would you change?" },
  { id:"w_food",      level:"B1", icon:"🍽️", title:"My Favourite Meal",       hr:"Moj omiljeni obrok",    prompt:"Describe your favourite meal in detail. Why do you love it? How is it prepared? Include when you usually eat it." },
  { id:"w_holiday",   level:"B1", icon:"✈️", title:"A Holiday Memory",        hr:"Uspomena s odmora",     prompt:"Write about a memorable holiday or trip. Where did you go? What happened? What did you learn?" },
  { id:"w_opinion",   level:"B2", icon:"💭", title:"An Opinion Piece",        hr:"Moje mišljenje",        prompt:"Write your opinion on this topic: Should Croatian be taught in schools abroad? Give at least 3 arguments." },
  { id:"w_letter",    level:"B2", icon:"✉️", title:"Formal Email",            hr:"Formalni e-mail",       prompt:"Write a formal email to a Croatian landlord asking about renting a flat. Include questions about price, utilities, and move-in date." },
  { id:"w_story",     level:"B2", icon:"📖", title:"A Short Story",           hr:"Kratka priča",          prompt:"Write a short story (8–10 sentences) set in Croatia. Include at least two characters and a brief conflict or surprise." },
  { id:"w_debate",    level:"C1", icon:"⚖️", title:"Essay: Both Sides",       hr:"Esej: dvije strane",    prompt:"Write a balanced essay (10+ sentences) on: 'Is tourism good or bad for Croatia?' Present arguments for and against." },
  { id:"w_review",    level:"C1", icon:"⭐", title:"Restaurant Review",       hr:"Recenzija restorana",   prompt:"Write a detailed Croatian restaurant review (real or imagined) — ambiance, service, food quality, value, recommendation." },
  { id:"w_complaint", level:"C1", icon:"📋", title:"Letter of Complaint",     hr:"Pismo pritužbe",        prompt:"Write a formal letter of complaint to a Croatian hotel manager about a disappointing stay. Be firm but polite." },
  { id:"w_cultural",  level:"C2", icon:"🏛️", title:"Cultural Reflection",     hr:"Kulturni osvrt",        prompt:"Write a thoughtful reflection (12+ sentences) on what Croatian culture means to you personally, and what you have learned from it." },
  { id:"w_news",      level:"C2", icon:"📰", title:"News Article",            hr:"Novinarski članak",     prompt:"Write a short news article in Croatian (10+ sentences) about a fictional event in a Croatian city. Use journalistic style." },
];

const SCENE_FOR_CAT = {
  'Errands':     '/images/scenes/zagreb.webp',
  'Out & About': '/images/scenes/dubrovnik-hero.webp',
  'Social':      '/images/scenes/croatian-food.webp',
  'Practical':   '/images/scenes/zagreb.webp',
  'Heritage':    '/images/scenes/dalmatian-coast.webp',
  'Work & Travel':'/images/scenes/plitvice.webp',
};
function sceneForCat(cat) {
  return SCENE_FOR_CAT[cat] || '/images/scenes/dubrovnik-hero.webp';
}

export default function AIConversation({ goBack: _goBack, setScr, sCurEx, setJWords }) {
  const { award, stats: appSt } = useStats();
  const stats = appSt;
  const isOnline = useOnlineStatus();

  // ── Mode ────────────────────────────────────────────────────────────────────
  const [appMode,    setAppMode]    = useState("convo");    // "convo" | "write"

  // ── Conversation state ──────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState("setup");
  const [scenario,   setScenario]   = useState(/** @type {any} */(null));
  const [level,      setLevel]      = useState(() => {
    const diffMap = { beginner: 'A1', intermediate: 'B1', advanced: 'B2' };
    return diffMap[appSt?.diff] || 'B1';
  });
  const [messages,   setMessages]   = useState(/** @type {any[]} */([]));
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [chatError,  setChatError]  = useState("");
  const [sendError,  setSendError]  = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [evalError,  setEvalError]  = useState("");
  const [convoVocab, setConvoVocab] = useState([]);
  const [weakAreasForSession, setWeakAreasForSession] = useState([]);
  const [corrections, setCorrections] = useState({});
  const [tooltip, setTooltip] = useState(null);
  const [showStarters, setShowStarters] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const evalXpFired = useRef(false);
  const writeXpFired = useRef(false);
  const [muted, setMuted] = useState(false);
  const [npcVideoUrl,     setNpcVideoUrl]     = useState(null);
  const [npcVideoLoading, setNpcVideoLoading] = useState(false);
  const npcVideoFiredRef = useRef(null);
  const [customSceneImg,     _setCustomSceneImg]     = useState(null);
  const [customSceneLoading, _setCustomSceneLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */(null));
  const [savedWords, setSavedWords] = useState(new Set());
  const translationCacheRef = useRef({});

  // ── Free Write state ────────────────────────────────────────────────────────
  const [writePrompt,    setWritePrompt]    = useState(null);
  const [writeLevel,     setWriteLevel]     = useState("B1");
  const [writeText,      setWriteText]      = useState("");
  const [writePhase,     setWritePhase]     = useState("setup");
  const [writeEval,      setWriteEval]      = useState(null);
  const [writeEvalError, setWriteEvalError] = useState("");

  // ── Setup filters ───────────────────────────────────────────────────────────
  const [activeCat, setActiveCat] = useState("All");
  const [customText,   setCustomText]   = useState("");
  const [showCustom,   setShowCustom]   = useState(false);

  const messagesEndRef = useRef(/** @type {HTMLDivElement | null} */(null));
  const inputRef       = useRef(null);
  const writeTextRef   = useRef(null);
  const isMountedRef   = useRef(true);
  useEffect(() => { return () => { isMountedRef.current = false; }; }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!tooltip) return undefined;
    function dismiss(e) {
      if (!e.target.closest("[data-tooltip]") && !e.target.closest("[data-word]")) {
        setTooltip(null);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [tooltip]);

  function speakWithAnim(text) {
    if (!text) return;
    setIsSpeaking(true);
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    const dur = Math.min(12000, Math.max(1500, text.length * 80));
    speakTimerRef.current = setTimeout(() => setIsSpeaking(false), dur);
    speak(text);
  }

  // ── Core API caller ──────────────────────────────────────────────────────────
  async function callAI(msgs, params, mode = "convo") {
    let res, data;
    try {
      res = await apiFetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, mode, params, learnerErrors: getErrorsForAPI(6) }),
      });
    } catch (netErr) {
      if (netErr.name === "AbortError") throw new Error("Request timed out — the AI took too long to respond. Please try again.");
      throw new Error("Network error — check your connection. (" + netErr.message + ")");
    }
    try {
      data = await res.json();
    } catch {
      throw new Error("Unexpected server response (status " + res.status + "). Please try again.");
    }
    if (!res.ok || data.error) {
      const msg = data.error || ("Server error " + res.status);
      if (msg.includes("AI_KEY_MISSING") || msg.includes("ANTHROPIC_API_KEY")) {
        throw new Error("setup_error:The AI service is not yet configured. The ANTHROPIC_API_KEY needs to be set in Cloudflare Pages → Settings → Environment Variables.");
      }
      if (msg === "daily_quota_exceeded" || res.status === 429) {
        const resetTime = data.resetAt ? new Date(data.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'midnight UTC';
        throw new Error(`You've reached today's AI conversation limit. Your quota resets at ${resetTime}. Come back tomorrow to continue practising!`);
      }
      throw new Error(msg);
    }
    if (!data.text || !data.text.trim()) {
      throw new Error("The AI returned an empty response. Please try again.");
    }
    return data.text;
  }

  function parseJSON(raw) {
    const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }

  // ── Start conversation ───────────────────────────────────────────────────────
  async function startConversation() {
    if (!scenario) return;
    setPhase("chat");
    setChatError("");
    setMessages([]);
    setCorrections({});
    setNpcVideoUrl(null);
    setLoading(true);

    if (npcVideoFiredRef.current !== scenario.id) {
      npcVideoFiredRef.current = scenario.id;
      setNpcVideoLoading(true);
      const { PORTRAIT_MAP } = await import('./SpeakingAvatar.jsx');
      const portraitKey = PORTRAIT_MAP[scenario.id] || 'young-woman';
      apiFetch(`/api/npc-video?portrait=${encodeURIComponent(portraitKey)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.ok && data.videoUrl) setNpcVideoUrl(data.videoUrl); })
        .catch(() => {})
        .finally(() => setNpcVideoLoading(false));
    }
    const weak_areas = deriveWeakAreas(stats?.ct || []);
    const topics_mastered = deriveMastered(stats?.ct || []);
    setWeakAreasForSession(weak_areas);
    const convoParams = { level, aiName: scenario.aiName, aiRole: scenario.aiRole, context: scenario.context, weak_areas, topics_mastered };
    try {
      const opener = await callAI(
        [{ role: "user", content: "Pozdrav! Možemo li početi?" }],
        convoParams
      );
      setMessages([{ role: "assistant", content: opener }]);
    } catch (e) {
      const msg = e.message || "";
      setChatError(msg.startsWith("setup_error:") ? msg.slice(12) : msg);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  // ── Send a message ───────────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || loading) return;
    setSendError("");
    const userText = input.trim();
    const userMsgIndex = messages.length;
    const userMsg = { role: "user", content: userText };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const weak_areas = deriveWeakAreas(stats?.ct || []);
      const topics_mastered = deriveMastered(stats?.ct || []);
      const reply = await callAI(next, { level, aiName: scenario.aiName, aiRole: scenario.aiRole, context: scenario.context, weak_areas, topics_mastered }, "adaptive_convo");
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (!muted) speakWithAnim(reply);
      const looksEnglish = userText.length < 4 || (
        !/[čćšžđČĆŠŽĐ]/.test(userText) &&
        /\b(the|is|are|was|were|have|has|can|will|my|your|i|we|you)\b/i.test(userText)
      );
      if (!looksEnglish) checkCorrection(userText, userMsgIndex);
    } catch (e) {
      setInput(userText);
      setSendError(e.message || "Send failed — please try again.");
    }
    setLoading(false);
  }

  async function checkCorrection(userText, msgIndex) {
    try {
      const raw = await callAI(
        [{ role: "user", content: userText }],
        {},
        "correct"
      );
      const result = parseJSON(raw);
      if (result && result.corrected && isMountedRef.current) {
        setCorrections(prev => ({ ...prev, [msgIndex]: result }));
        if (result.corrected !== userText) {
          logError(
            result.errorPatterns?.[0] || 'conversation_grammar',
            'grammar',
            { wrong: userText, correct: result.corrected, source: 'conversation' }
          );
        }
      }
    } catch {
      // non-critical
    }
  }

  async function translateWord(word) {
    const clean = word.replace(/[.,!?;:…«»"'""''()\[\]]/g, "").trim();
    if (!clean || clean.length < 2) return;
    const cached = translationCacheRef.current[clean.toLowerCase()];
    if (cached) {
      setTooltip({ word: clean, loading: false, ...cached, saved: savedWords.has(clean) });
      return;
    }
    if (Object.keys(translationCacheRef.current).length >= 150) translationCacheRef.current = {};
    setTooltip({ word: clean, loading: true, translation: null, note: null, saved: savedWords.has(clean) });
    try {
      const raw = await callAI([{ role: "user", content: clean }], {}, "translate");
      const result = parseJSON(raw);
      const translation = result?.translation || "—";
      const note = result?.note || null;
      translationCacheRef.current[clean.toLowerCase()] = { translation, note };
      setTooltip(prev =>
        prev?.word === clean ? { ...prev, loading: false, translation, note } : prev
      );
    } catch {
      setTooltip(prev =>
        prev?.word === clean ? { ...prev, loading: false, translation: "Translation unavailable" } : prev
      );
    }
  }

  function saveWordToJournal() {
    if (!tooltip?.translation) return;
    const entry = { w: tooltip.word, t: tooltip.translation, added: Date.now() };
    try {
      const existing = JSON.parse(localStorage.getItem("uJournal") || "[]");
      if (!existing.find(e => e.w === tooltip.word)) {
        const updated = [...existing, entry];
        localStorage.setItem("uJournal", JSON.stringify(updated));
        if (typeof setJWords === "function") setJWords(updated);
      }
    } catch { /* storage error */ }
    setSavedWords(prev => new Set([...prev, tooltip.word]));
    setTooltip(prev => prev ? { ...prev, saved: true } : null);
  }

  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input is not supported in this browser. Try Chrome on Android or desktop."); return; }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "hr-HR";
    r.continuous = false;
    r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onresult = e => {
      const transcript = e.results?.[0]?.[0]?.transcript;
      if (!transcript) return;
      setInput(prev => (prev ? prev + " " + transcript : transcript));
    };
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    r.start();
    recognitionRef.current = r;
  }

  async function requestHint() {
    if (loading) return;
    setLoading(true);
    try {
      const hint = await callAI(
        [...messages.filter(m => m.role !== "hint"), { role: "user", content: "I need a hint to continue this conversation." }],
        {},
        "hint"
      );
      setMessages(prev => [...prev, { role: "hint", content: hint }]);
    } catch {
      setMessages(prev => [...prev, { role: "hint", content: "💡 Hint unavailable right now — try writing anything, even imperfectly! Making mistakes is how you learn." }]);
    }
    setLoading(false);
  }

  async function retryOpener() {
    setChatError("");
    setMessages([]);
    setLoading(true);
    try {
      const opener = await callAI(
        [{ role: "user", content: "Pozdrav! Možemo li početi?" }],
        { level, aiName: scenario.aiName, aiRole: scenario.aiRole, context: scenario.context }
      );
      setMessages([{ role: "assistant", content: opener }]);
    } catch (e) {
      const msg = e.message || "";
      setChatError(msg.startsWith("setup_error:") ? msg.slice(12) : msg);
    }
    setLoading(false);
  }

  async function endAndEvaluate() {
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length < 2) { alert("Have at least 2 exchanges before evaluating!"); return; }
    setPhase("evaluating");
    const convoText = messages
      .filter(m => m.role !== "hint")
      .map(m => `${m.role === "user" ? "LEARNER" : "AI (" + scenario.aiName + ")"}: ${m.content}`)
      .join("\n\n");
    try {
      const raw = await callAI([{ role: "user", content: convoText }], { level, scenarioTitle: scenario.title }, "evaluate");
      const ev = parseJSON(raw);
      setEvaluation(ev);
      if (ev && ev.mistakes && Array.isArray(ev.mistakes)) {
        ev.mistakes.forEach(m => {
          logError(m.type || 'conversation_grammar', 'grammar', { wrong: m.original, correct: m.correction, source: 'conversation' });
        });
      }
      if (ev && !evalXpFired.current && typeof award === "function") {
        evalXpFired.current = true;
        const xp = ev.score >= 80 ? 20 : ev.score >= 60 ? 15 : 10;
        award(xp + Math.min(userMsgs.length, 5) * 2, false);
        markPracticed();
        markQuest('speak');
      }

      // Extract vocabulary the learner used or encountered — queue for SRS review
      try {
        const syncRes = await apiFetch('/api/srs-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation: convoText, level }),
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (Array.isArray(syncData.vocabulary) && syncData.vocabulary.length > 0) {
            setConvoVocab(syncData.vocabulary.slice(0, 8));
          }
        }
      } catch (_) {}

      setPhase("result");
    } catch (e) {
      setEvalError(e.message || "Evaluation failed");
      setPhase("result");
    }
  }

  async function submitWriting() {
    if (!writeText.trim() || writeText.trim().split(/\s+/).length < 5) return;
    setWritePhase("evaluating");
    try {
      const raw = await callAI(
        [{ role: "user", content: writeText.trim() }],
        { level: writeLevel, writingPrompt: writePrompt.prompt },
        "writeeval"
      );
      const result = parseJSON(raw);
      if (!result) throw new Error("Could not parse evaluation response.");
      setWriteEval(result);
      if (typeof award === "function" && !writeXpFired.current) {
        writeXpFired.current = true;
        const xp = result.score >= 80 ? 18 : result.score >= 60 ? 13 : 8;
        award(xp, false);
        markPracticed();
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('nh_quest_grammar_' + today, '1');
      }
      setWritePhase("result");
    } catch (e) {
      setWriteEvalError(e.message || "Evaluation failed");
      setWritePhase("result");
    }
  }

  function resetConvo() {
    setPhase("setup"); setMessages([]); setEvaluation(null);
    setEvalError(""); setScenario(null); setChatError(""); setSendError("");
    setCorrections({}); setTooltip(null); setConvoVocab([]);
  }

  function resetWrite() {
    setWritePhase("setup"); setWriteText(""); setWriteEval(null);
    setWriteEvalError(""); setWritePrompt(null);
  }

  function handleModeChange(mode) {
    setAppMode(mode);
    resetConvo();
    resetWrite();
  }

  const userCount = useMemo(() => messages.filter(m => m.role === "user").length, [messages]);
  const filteredScenarios = useMemo(() =>
    SCENARIOS.filter(s => (activeCat === "All" || s.cat === activeCat) && s.levels.includes(level)),
    [activeCat, level]
  );
  const filteredPrompts = useMemo(() =>
    WRITE_PROMPTS.filter(p => p.level === writeLevel),
    [writeLevel]
  );
  const hasSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const Header = (
    <AIConversationHeader
      appMode={appMode}
      setAppMode={setAppMode}
      scenario={scenario}
      sceneForCat={sceneForCat}
      onModeChange={handleModeChange}
    />
  );

  // ── FREE WRITE — SETUP ───────────────────────────────────────────────────────
  if (appMode === "write" && writePhase === "setup") return (
    <AIConversationWriteSetup
      Header={Header}
      writeLevel={writeLevel}
      setWriteLevel={setWriteLevel}
      writePrompt={writePrompt}
      setWritePrompt={setWritePrompt}
      filteredPrompts={filteredPrompts}
      isOnline={isOnline}
      onStart={() => { if (writePrompt) { setWritePhase("writing"); setTimeout(() => writeTextRef.current?.focus(), 200); } }}
    />
  );

  // ── FREE WRITE — WRITING ─────────────────────────────────────────────────────
  if (appMode === "write" && writePhase === "writing") return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9100, background: "var(--app-bg)",
      display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif" }}>
      {!isOnline && (
        <div style={{
          background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:0,
          padding:'12px 16px', fontSize:13, fontWeight:600,
          color:'#92400e', display:'flex', alignItems:'center', gap:8,
          flexShrink:0,
        }}>
          <span>📡</span>
          <span>You're offline. AI features need an internet connection. Your progress is saved locally.</span>
        </div>
      )}
      {/* Header */}
      <div style={{ background: "var(--card)", borderBottom: "1px solid var(--card-b)", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
        <button onClick={() => setWritePhase("setup")}
          style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", padding: "4px 6px",
            color: "var(--subtext)", lineHeight: 1, borderRadius: 8 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--heading)" }}>{writePrompt.icon} {writePrompt.title}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--subtext)" }}>Level {writeLevel} · Write in Croatian</div>
        </div>
        <button onClick={submitWriting} disabled={writeText.trim().split(/\s+/).length < 5}
          style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid",
            fontWeight: 700, fontSize: "var(--text-sm)", cursor: writeText.trim().split(/\s+/).length >= 5 ? "pointer" : "not-allowed",
            fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap",
            borderColor: writeText.trim().split(/\s+/).length >= 5 ? "var(--info)" : "var(--card-b)",
            background: writeText.trim().split(/\s+/).length >= 5 ? "var(--info)" : "var(--bar-bg)",
            color: writeText.trim().split(/\s+/).length >= 5 ? "var(--card)" : "var(--subtext)" }}>
          Submit →
        </button>
      </div>
      {/* Prompt card */}
      <div style={{ padding: "12px 14px 0", flexShrink: 0 }}>
        <div style={{ background: "var(--info-bg)", border: "1px solid var(--info-b)", borderRadius: 12,
          padding: "12px 14px", fontSize: "var(--text-sm)", color: "var(--info)", lineHeight: 1.6 }}>
          <strong>Prompt:</strong> {writePrompt.prompt}
        </div>
      </div>
      {/* Writing area */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column" }}>
        <textarea
          ref={writeTextRef}
          value={writeText}
          onChange={e => setWriteText(e.target.value)}
          placeholder="Piši ovdje na hrvatskom…"
          style={{ flex: 1, padding: "14px", fontSize: 16, lineHeight: 1.7, borderRadius: 14,
            border: "1.5px solid var(--card-b)", background: "var(--card)", fontFamily: "'Outfit',sans-serif",
            color: "var(--heading)", resize: "none", outline: "none", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "var(--text-sm)", color: "var(--subtext)" }}>
          <span>{writeText.trim().split(/\s+/).filter(Boolean).length} words</span>
          <span>Tap Submit when ready →</span>
        </div>
      </div>
    </div>
  );

  // ── FREE WRITE — EVALUATING ──────────────────────────────────────────────────
  if (appMode === "write" && writePhase === "evaluating") return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "80vh" }}>
      {!isOnline && (
        <div style={{
          background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:10,
          padding:'12px 16px', margin:'16px 16px 0', fontSize:13, fontWeight:600,
          color:'#92400e', display:'flex', alignItems:'center', gap:8
        }}>
          <span>📡</span>
          <span>You're offline. AI features need an internet connection. Your progress is saved locally.</span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        flex: 1, textAlign: "center", padding: "24px" }}>
        <div style={{ fontSize: 56, marginBottom: 16, animation: "pulse 1.4s ease-in-out infinite" }}>📝</div>
        <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--heading)", marginBottom: 8 }}>Marking your writing…</div>
        <div style={{ fontSize: "var(--text-base)", color: "var(--subtext)", maxWidth: 280, lineHeight: 1.6 }}>
          Checking grammar, vocabulary range, and style
        </div>
      </div>
    </div>
  );

  // ── FREE WRITE — RESULT ──────────────────────────────────────────────────────
  if (appMode === "write" && writePhase === "result") return (
    <AIConversationWriteResult
      writeEvalError={writeEvalError}
      writeEval={writeEval}
      onBackToWriting={() => setWritePhase("writing")}
      onReset={resetWrite}
    />
  );

  // ── CONVERSATION — SETUP ─────────────────────────────────────────────────────
  if (phase === "setup") return (
    <AIConversationConvoSetup
      Header={Header}
      level={level}
      setLevel={setLevel}
      activeCat={activeCat}
      setActiveCat={setActiveCat}
      scenario={scenario}
      setScenario={setScenario}
      filteredScenarios={filteredScenarios}
      stats={stats}
      customText={customText}
      setCustomText={setCustomText}
      showCustom={showCustom}
      setShowCustom={setShowCustom}
      customSceneImg={customSceneImg}
      customSceneLoading={customSceneLoading}
      isOnline={isOnline}
      onStart={startConversation}
    />
  );

  // ── CONVERSATION — EVALUATING ────────────────────────────────────────────────
  if (phase === "evaluating") return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "80vh", padding: "0" }}>
      {!isOnline && (
        <div style={{
          background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:10,
          padding:'12px 16px', margin:'16px 16px 0', fontSize:13, fontWeight:600,
          color:'#92400e', display:'flex', alignItems:'center', gap:8
        }}>
          <span>📡</span>
          <span>You're offline. AI features need an internet connection. Your progress is saved locally.</span>
        </div>
      )}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      flex: 1, textAlign: "center", padding: "24px" }}>
      <div style={{ fontSize: 56, marginBottom: 16, animation: "pulse 1.4s ease-in-out infinite" }}>🧠</div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--heading)", marginBottom: 8 }}>Analysing your conversation…</div>
      <div style={{ fontSize: "var(--text-base)", color: "var(--subtext)", maxWidth: 280, lineHeight: 1.6 }}>
        Reviewing grammar, vocabulary range, and fluency across your {userCount} exchanges
      </div>
    </div>
    </div>
  );

  // ── CONVERSATION — RESULT ────────────────────────────────────────────────────
  if (phase === "result") return (
    <AIConversationResult
      evalError={evalError}
      evaluation={evaluation}
      level={level}
      userCount={userCount}
      weakAreasForSession={weakAreasForSession}
      convoVocab={convoVocab}
      setJWords={setJWords}
      setScr={setScr}
      sCurEx={sCurEx}
      onBackToChat={() => setPhase("chat")}
      onReset={resetConvo}
    />
  );

  // ── CONVERSATION — CHAT ──────────────────────────────────────────────────────
  if (!scenario) { setPhase("setup"); return null; }
  return (
    <>
      <AIConversationChat
        scenario={scenario}
        level={level}
        messages={messages}
        corrections={corrections}
        loading={loading}
        chatError={chatError}
        sendError={sendError}
        input={input}
        setInput={setInput}
        listening={listening}
        isSpeaking={isSpeaking}
        npcVideoUrl={npcVideoUrl}
        npcVideoLoading={npcVideoLoading}
        muted={muted}
        setMuted={setMuted}
        showStarters={showStarters}
        setShowStarters={setShowStarters}
        userCount={userCount}
        isOnline={isOnline}
        hasSpeechAPI={hasSpeechAPI}
        messagesEndRef={messagesEndRef}
        inputRef={inputRef}
        onSend={sendMessage}
        onSendError={() => setSendError("")}
        onToggleVoice={toggleVoice}
        onHint={requestHint}
        onRetryOpener={retryOpener}
        onReset={resetConvo}
        onEndEvaluate={endAndEvaluate}
        onWordClick={translateWord}
        onSpeakMessage={speakWithAnim}
      />
      <AIWordTooltip
        tooltip={tooltip}
        onClose={() => setTooltip(null)}
        onSave={saveWordToJournal}
      />
    </>
  );
}
