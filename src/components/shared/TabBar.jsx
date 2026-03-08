const TABS = [
  { id: "home",     icon: "🏠", label: "Home" },
  { id: "learn",    icon: "📚", label: "Learn" },
  { id: "practice", icon: "🎮", label: "Practice" },
  { id: "croatia",  icon: "🇭🇷", label: "Croatia" },
  { id: "profile",  icon: "👤", label: "Profile" },
];

export default function TabBar({ tab, setTab, setScr }) {
  return (
    <nav className="nav-bar" role="navigation" aria-label="Main navigation">
      {TABS.map(t => (
        <button
          key={t.id}
          className={"nav-btn" + (tab===t.id?" active":"")}
          onClick={() => { setTab(t.id); setScr("dashboard"); }}
          aria-current={tab===t.id ? "page" : undefined}
          aria-label={t.label}
        >
          <span className="nav-icon" aria-hidden="true">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
