import React, { useState } from "react";
import { H } from "../../data.jsx";

// ─── CONFIRMED CHANNELS ───────────────────────────────────────────────────────
// Only verified resources — no guessed video IDs
const CHANNELS = [
  {
    name: "Croatian 101 Lessons",
    desc: "101 structured grammar lessons in order — the most complete free series for Croatian beginners",
    icon: "🇭🇷",
    level: "A1–B2",
    levelColor: "#1e40af", levelBg: "#dbeafe",
    url: "https://www.youtube.com/playlist?list=PLC53653A691B89FCB",
    label: "101 lesson playlist",
  },
  {
    name: "Easy Croatian",
    desc: "Authentic street interviews with native speakers — build listening comprehension fast",
    icon: "🎙️",
    level: "A2–B2",
    levelColor: "#166534", levelBg: "#dcfce7",
    url: "https://www.youtube.com/playlist?list=PLA5UIoabheFPxKldzI7t3T3yQWjQhoDou",
    label: "Easy Croatian playlist",
  },
  {
    name: "Let's Learn Croatian",
    desc: "Vocabulary, grammar and culture videos from a dedicated Croatian teacher",
    icon: "📚",
    level: "A1–B1",
    levelColor: "#92400e", levelBg: "#fef3c7",
    url: "https://www.youtube.com/channel/UC_T6a1XdNe00BTDfd7754tw",
    label: "YouTube channel",
  },
  {
    name: "CroatianPod101",
    desc: "Bite-sized lessons, vocabulary reviews and dialogue practice from Innovative Language",
    icon: "🎧",
    level: "A1–B1",
    levelColor: "#6b21a8", levelBg: "#f3e8ff",
    url: "https://www.youtube.com/results?search_query=croatianpod101",
    label: "YouTube channel",
  },
];

// ─── GRAMMAR TOPICS ───────────────────────────────────────────────────────────
// Each topic links to a YouTube search for up-to-date videos + an in-app practice screen
const TOPICS = [
  {
    key: "pronunciation",
    icon: "🔤",
    title: "Pronunciation & Alphabet",
    desc: "The Croatian alphabet has 30 letters — each with exactly one sound. Master č, ć, š, ž, đ and the rolled 'r' vowel.",
    level: "A1",
    levelColor: "#166534", levelBg: "#dcfce7",
    youtubeQuery: "croatian+alphabet+pronunciation+lesson+beginners",
    inApp: { label: "Alphabet Drill", screen: "alphabet" },
  },
  {
    key: "gender",
    icon: "🏷️",
    title: "Nouns & Grammatical Gender",
    desc: "Croatian nouns are masculine, feminine, or neuter. The gender determines case endings throughout every sentence.",
    level: "A1",
    levelColor: "#166534", levelBg: "#dcfce7",
    youtubeQuery: "croatian+noun+gender+grammar+lesson",
    inApp: { label: "Gender Drill", screen: "genderdrill" },
  },
  {
    key: "present",
    icon: "🔧",
    title: "Present Tense Conjugation",
    desc: "Croatian verbs conjugate by person and number. Three main classes: -am verbs, -im verbs, and -em/-em verbs.",
    level: "A1",
    levelColor: "#166534", levelBg: "#dcfce7",
    youtubeQuery: "croatian+present+tense+verb+conjugation+lesson",
    inApp: { label: "Conjugation Drill", screen: "conjdrill" },
  },
  {
    key: "past",
    icon: "⏪",
    title: "Past Tense (Perfekt)",
    desc: "Croatian past tense uses the auxiliary 'biti' + past participle (l-form). The participle agrees with the subject in gender and number.",
    level: "A2",
    levelColor: "#1e40af", levelBg: "#dbeafe",
    youtubeQuery: "croatian+past+tense+perfekt+grammar+lesson",
    inApp: { label: "Tenses Screen", screen: "tenses" },
  },
  {
    key: "cases",
    icon: "📐",
    title: "The 7 Cases (Padeži)",
    desc: "Croatian has 7 grammatical cases that change noun endings. Each answers a different question: who? of whom? to whom? etc.",
    level: "B1",
    levelColor: "#92400e", levelBg: "#fef3c7",
    youtubeQuery: "croatian+cases+padezi+grammar+lesson+explained",
    inApp: { label: "7 Cases Drill", screen: "padezi" },
  },
  {
    key: "aspect",
    icon: "↔️",
    title: "Verb Aspect (Glagolski vid)",
    desc: "Every Croatian verb is either imperfective (action in progress) or perfective (completed action). This is the hardest concept for English speakers.",
    level: "B1",
    levelColor: "#92400e", levelBg: "#fef3c7",
    youtubeQuery: "croatian+verb+aspect+imperfective+perfective+lesson",
    inApp: { label: "Aspect Drill", screen: "aspectdrill" },
  },
  {
    key: "clitics",
    icon: "📎",
    title: "Clitics & Word Order",
    desc: "Short pronouns and the verb 'biti' must appear in second position in the sentence. The clitic chain order: bi, sam/si/je, ga/mu/joj, se.",
    level: "B1",
    levelColor: "#92400e", levelBg: "#fef3c7",
    youtubeQuery: "croatian+clitics+word+order+second+position",
    inApp: { label: "Clitic Drill", screen: "clitic" },
  },
  {
    key: "conditional",
    icon: "💭",
    title: "Conditional Mood",
    desc: "Croatian conditional is formed with 'bi' + past participle. Used for wishes, hypotheticals, and polite requests.",
    level: "B2",
    levelColor: "#6b21a8", levelBg: "#f3e8ff",
    youtubeQuery: "croatian+conditional+mood+grammar+lesson+bi",
    inApp: { label: "Conditional Drill", screen: "conditional" },
  },
  {
    key: "declension",
    icon: "📊",
    title: "Noun Declension Patterns",
    desc: "Full paradigms for all three noun genders across all 7 cases. Mastering these tables unlocks fluent writing.",
    level: "B2",
    levelColor: "#6b21a8", levelBg: "#f3e8ff",
    youtubeQuery: "croatian+noun+declension+patterns+cases+grammar",
    inApp: { label: "Declension", screen: "declension" },
  },
  {
    key: "pitch",
    icon: "🎵",
    title: "Pitch Accent",
    desc: "Croatian has a four-way pitch accent system. Most learners skip it, but mastering it is what separates a good speaker from a great one.",
    level: "B2",
    levelColor: "#6b21a8", levelBg: "#f3e8ff",
    youtubeQuery: "croatian+pitch+accent+tone+prosody+lesson",
    inApp: { label: "Pitch Accent", screen: "pitchaccent" },
  },
];

// ─── CHANNEL CARD ─────────────────────────────────────────────────────────────
function ChannelCard({ ch }) {
  return (
    <div style={{
      background: "var(--card)", borderRadius: 16,
      border: "1px solid var(--card-b)",
      padding: "16px 18px",
      display: "flex", alignItems: "flex-start", gap: 14,
      boxShadow: "0 2px 10px rgba(0,0,0,.05)",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: "var(--bar-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24,
      }}>{ch.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--heading)" }}>{ch.name}</span>
          <span style={{
            fontSize: "var(--text-xs)", fontWeight: 800,
            color: ch.levelColor, background: ch.levelBg,
            borderRadius: 6, padding: "2px 7px", letterSpacing: ".05em", flexShrink: 0,
          }}>{ch.level}</span>
        </div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--subtext)", lineHeight: 1.5, marginBottom: 10 }}>
          {ch.desc}
        </div>
        <a
          href={ch.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 10,
            background: "#ff0000", color: "#fff",
            fontSize: "var(--text-xs)", fontWeight: 800,
            textDecoration: "none", letterSpacing: ".03em",
          }}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M8 5v14l11-7z"/></svg>
          {ch.label} ↗
        </a>
      </div>
    </div>
  );
}

// ─── TOPIC CARD ───────────────────────────────────────────────────────────────
function TopicCard({ topic, onInApp }) {
  const ytUrl = `https://www.youtube.com/results?search_query=${topic.youtubeQuery}`;
  return (
    <div style={{
      background: "var(--card)", borderRadius: 16,
      border: "1px solid var(--card-b)",
      overflow: "hidden",
      boxShadow: "0 2px 10px rgba(0,0,0,.05)",
    }}>
      {/* Header strip */}
      <div style={{
        padding: "13px 16px",
        borderBottom: "1px solid var(--card-b)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>{topic.icon}</span>
        <span style={{ flex: 1, fontSize: "var(--text-sm)", fontWeight: 800, color: "var(--heading)" }}>{topic.title}</span>
        <span style={{
          fontSize: "var(--text-xs)", fontWeight: 800,
          color: topic.levelColor, background: topic.levelBg,
          borderRadius: 6, padding: "2px 7px", letterSpacing: ".05em", flexShrink: 0,
        }}>{topic.level}</span>
      </div>
      {/* Body */}
      <div style={{ padding: "12px 16px 14px" }}>
        <p style={{
          margin: "0 0 12px",
          fontSize: "var(--text-sm)", color: "var(--subtext)", lineHeight: 1.55,
        }}>{topic.desc}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href={ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              background: "#ff0000", color: "#fff",
              fontSize: "var(--text-xs)", fontWeight: 800,
              textDecoration: "none",
            }}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M8 5v14l11-7z"/></svg>
            Find videos ↗
          </a>
          {topic.inApp && (
            <button
              onClick={() => onInApp(topic.inApp.screen)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                border: "1px solid var(--accent)", background: "none",
                color: "var(--accent)", fontSize: "var(--text-xs)", fontWeight: 800,
                cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              }}
            >
              ✦ {topic.inApp.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function GrammarVideos({ goBack, setScr }) {
  const [levelFilter, setLevelFilter] = useState("All");
  const levels = ["All", "A1", "A2", "B1", "B2"];

  const filtered = levelFilter === "All"
    ? TOPICS
    : TOPICS.filter(t => t.level === levelFilter);

  return (
    <div className="scr-wrap">
      {H("🎥 Grammar Videos", "", goBack)}

      {/* Subtitle */}
      <p style={{
        margin: "0 0 20px",
        fontSize: "var(--text-sm)", color: "var(--subtext)", lineHeight: 1.6,
        padding: "0 2px",
      }}>
        Curated YouTube resources for every grammar topic — from Croatian alphabet to advanced pitch accent.
        Each card links to live YouTube search results so you always find the freshest, highest-rated lessons.
      </p>

      {/* ── Featured channels ── */}
      <h3 style={{
        margin: "0 0 12px",
        fontSize: "var(--text-base)", fontWeight: 800, color: "var(--heading)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        ⭐ Recommended Channels
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {CHANNELS.map(ch => <ChannelCard key={ch.name} ch={ch} />)}
      </div>

      {/* ── Topic divider ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px",
      }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 800, color: "var(--heading)" }}>
          📚 Topics by Level
        </h3>
        <div style={{ flex: 1, height: 1, background: "var(--card-b)" }} />
      </div>

      {/* Level filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {levels.map(lv => (
          <button
            key={lv}
            onClick={() => setLevelFilter(lv)}
            style={{
              padding: "6px 14px", borderRadius: 20,
              border: `1px solid ${levelFilter === lv ? "var(--accent)" : "var(--card-b)"}`,
              background: levelFilter === lv ? "var(--accent)" : "var(--card)",
              color: levelFilter === lv ? "#fff" : "var(--subtext)",
              fontSize: "var(--text-xs)", fontWeight: 800,
              cursor: "pointer", fontFamily: "'Outfit',sans-serif",
              transition: "all .15s",
            }}
          >{lv}</button>
        ))}
      </div>

      {/* Topic grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {filtered.map(topic => (
          <TopicCard
            key={topic.key}
            topic={topic}
            onInApp={screen => setScr && setScr(screen)}
          />
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={goBack}
        style={{
          width: "100%", padding: "14px", borderRadius: 14,
          border: "1px solid var(--card-b)", background: "var(--card)",
          color: "var(--subtext)", fontSize: "var(--text-sm)", fontWeight: 700,
          cursor: "pointer", fontFamily: "'Outfit',sans-serif",
        }}
      >
        ← Back
      </button>
    </div>
  );
}
