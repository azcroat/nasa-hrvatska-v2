import { useEffect, useRef } from 'react';

/**
 * Detects a left-edge swipe gesture and calls goBack().
 * Disabled when enabled === false (e.g. on screens that use their own swipe handlers).
 *
 * Trigger: touch starts within 40px of the left edge, moves right ≥60px.
 */
export function useSwipeBack(goBack, enabled = true) {
  const startX = useRef(null);
  const startY = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    function onTouchStart(e) {
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
    }

    function onTouchEnd(e) {
      if (startX.current === null) return;
      const t = e.changedTouches?.[0];
      if (!t) { startX.current = null; startY.current = null; return; }
      const dx = t.clientX - startX.current;
      const dy = Math.abs(t.clientY - (startY.current ?? 0));
      // Must start from left edge, move right significantly, and not be primarily vertical
      if (startX.current < 40 && dx > 60 && dy < 80) {
        goBack();
      }
      startX.current = null;
      startY.current = null;
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [goBack, enabled]);
}
