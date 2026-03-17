const TABS = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "learn",    icon: "🗺️", label: "Path" },
  { id: "practice", icon: "🎮", label: "Practice" },
  { id: "croatia",  icon: "🇭🇷", label: "Croatia" },
  { id: "profile",  icon: "👤", label: "Profile" },
];

export default function TabBar({ tab, setTab, setScr, badges }) {
  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      {TABS.map(t => (
        <button
          key={t.id}
          className={"nav-btn" + (tab===t.id?" active":"")}
          onClick={() => { setTab(t.id); setScr("dashboard"); }}
          aria-current={tab===t.id ? "page" : undefined}
          aria-label={t.label}
          style={{ position: "relative" }}
        >
          <span className="nav-icon" aria-hidden="true">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
          {badges && badges[t.id] > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4,
              background: "#e11d48", color: "#fff",
              fontSize: 9, fontWeight: 800,
              minWidth: 15, height: 15, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px", lineHeight: 1,
            }}>{badges[t.id]}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
