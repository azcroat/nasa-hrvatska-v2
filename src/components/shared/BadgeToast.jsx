export default function BadgeToast({ show, badge }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={show && badge ? `Achievement unlocked: ${badge.n}` : undefined}
      style={{
        position: "fixed", top: 80, left: "50%",
        transform: show && badge ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0)",
        background: "rgba(255,255,255,.9)",
        border: "2px solid #fbbf24",
        padding: "16px 32px", borderRadius: 14,
        zIndex: 1001, textAlign: "center",
        transition: "transform .25s",
        pointerEvents: "none",
      }}>
      {show && badge && (
        <>
          <div style={{ fontSize: 36 }} aria-hidden="true">{badge.i}</div>
          <div style={{ fontSize: 13, color: "#b45309", fontWeight: 700 }}>Achievement!</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{badge.n}</div>
        </>
      )}
    </div>
  );
}
