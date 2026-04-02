/**
 * knightSpeak — fire-and-forget event to show a speech bubble
 * from Vitez Hrvoje on any screen.
 *
 * KnightCompanion (global, in App.jsx) listens for this event and
 * pops up a floating speech bubble above the mini knight button.
 *
 * Usage:
 *   import { knightSpeak } from '../../lib/knightSpeak.js';
 *   knightSpeak('victory', 'Savršeno! Perfect score! 🌟');
 */
export function knightSpeak(mood, text, delay = 0) {
  const fire = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('knight:speak', { detail: { mood, text } }));
  };
  if (delay > 0) setTimeout(fire, delay);
  else fire();
}
