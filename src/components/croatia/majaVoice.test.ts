import { describe, it, expect } from 'vitest';
import { isVoiceAvailable } from './majaVoice';

describe('isVoiceAvailable — Maja voice on iOS vs desktop', () => {
  it('iPhone (no Web Speech, but getUserMedia + MediaRecorder) → voice IS available via Whisper', () => {
    // The regression: iOS used to be treated as "no voice" because SR is absent,
    // leaving the user with only a text box. The Whisper fallback makes voice work.
    expect(isVoiceAvailable(false, true, true)).toBe(true);
  });

  it('desktop Chrome/Edge (Web Speech) → voice available', () => {
    expect(isVoiceAvailable(true, true, true)).toBe(true);
    expect(isVoiceAvailable(true, false, false)).toBe(true);
  });

  it('genuinely no voice (no SR, and no recorder/getUserMedia) → not available', () => {
    expect(isVoiceAvailable(false, false, false)).toBe(false);
    expect(isVoiceAvailable(false, true, false)).toBe(false); // getUserMedia but no MediaRecorder
    expect(isVoiceAvailable(false, false, true)).toBe(false); // MediaRecorder but no getUserMedia
  });
});
