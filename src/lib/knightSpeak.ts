/**
 * knightSpeak — fire-and-forget event to show a speech bubble
 * from Vitez Hrvoje on any screen.
 *
 * KnightCompanion (global, in App.jsx) listens for this event and
 * pops up a floating speech bubble above the mini knight button.
 */
export function knightSpeak(mood: string, text: string, delay = 0): void {
  const fire = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('knight:speak', { detail: { mood, text } }));
  };
  if (delay > 0) setTimeout(fire, delay);
  else fire();
}

/**
 * knightFlash — silent face-only mood override. No speech bubble.
 * Knight's face switches to `mood` for `durationMs` ms, then reverts.
 * Fires `knight:flash` CustomEvent. KnightCompanion handles the revert.
 */
export function knightFlash(mood: string, durationMs = 1800): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('knight:flash', { detail: { mood, durationMs } }));
}
