const TABS = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "learn",    icon: "📚", label: "Learn" },
  { id: "practice", icon: "🎮", label: "Practice" },
  { id: "croatia",  icon: "🇭🇷", label: "Croatia" },
  { id: "profile",  icon: "👤", label: "Profile" },
];

export default function TabBar({ tab, setTab, setScr }) {
  return (
    <div className="nav-bar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={"nav-btn" + (tab===t.id?" active":"")}
          onClick={() => { setTab(t.id); setScr("dashboard"); }}
          >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
