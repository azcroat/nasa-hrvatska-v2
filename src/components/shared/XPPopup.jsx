export default function XPPopup({ showXP, xpA }) {
  const alreadyEarned = xpA === 0;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={showXP ? (alreadyEarned ? "Already earned XP today" : `Earned ${xpA} XP`) : undefined}
      style={{
        position: "fixed", top: "50%", left: "50%",
        transform: showXP ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0)",
        background: alreadyEarned
          ? "linear-gradient(135deg,#78716c,#44403c)"
          : "linear-gradient(135deg,#fbbf24,#b45309)",
        color: "#fff",
        padding: "20px 40px", borderRadius: 14,
        fontSize: alreadyEarned ? 16 : 28,
        fontWeight: 800, zIndex: 1000,
        animation: showXP ? "pop .5s" : "none",
        textAlign: "center", maxWidth: 240,
        pointerEvents: "none",
        transition: "transform .2s",
      }}>
      {showXP
        ? (alreadyEarned
          ? "Already earned XP today!\nCome back tomorrow for more."
          : `+${xpA} XP`)
        : null}
    </div>
  );
}
