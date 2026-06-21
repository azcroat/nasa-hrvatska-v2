import { describe, it, expect } from 'vitest';
import { AZURE_MIME_PRIORITY } from '../components/shared/PronunciationScorer';

// useRecorder negotiates with `order.find((m) => MediaRecorder.isTypeSupported(m))`.
// These tests replicate that against the exported priority list.
describe('PronunciationScorer mime priority — iOS Safari fallback', () => {
  it('includes audio/mp4 — the only format iOS Safari MediaRecorder supports', () => {
    expect(AZURE_MIME_PRIORITY).toContain('audio/mp4');
  });

  it('REGRESSION: negotiates audio/mp4 on iOS (only mp4 supported) instead of null', () => {
    const iosSupports = (m: string) => m === 'audio/mp4';
    const chosen = AZURE_MIME_PRIORITY.find(iosSupports) ?? null;
    // Before the fix the list had no mp4 → chosen was null → useRecorder reported
    // 'unsupported' → the mic hard-failed for pronunciation drills on iPhone.
    expect(chosen).toBe('audio/mp4');
  });

  it('still prefers ogg/opus on desktop (order preserved, no regression)', () => {
    const allSupported = () => true;
    expect(AZURE_MIME_PRIORITY.find(allSupported)).toBe('audio/ogg;codecs=opus');
  });
});
