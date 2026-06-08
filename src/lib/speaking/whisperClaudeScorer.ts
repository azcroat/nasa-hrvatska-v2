// src/lib/speaking/whisperClaudeScorer.ts
import { _nativePost } from '../nativePost.js';
import {
  computeSpeakingOverall,
  type SpeakingScorer,
  type SpeakingAssessment,
} from './SpeakingScorer.js';

/** Below this STT confidence we cannot fairly score; treat as "retry". */
const MIN_CONFIDENCE = 0.4;

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]!);
  return btoa(binary);
}

export const whisperClaudeScorer: SpeakingScorer = {
  async assess(audio, ctx): Promise<SpeakingAssessment | null> {
    try {
      const audioBase64 = await blobToBase64(audio);

      // Route through the shared native-safe POST helper: it resolves the absolute
      // base URL on Capacitor native (relative URLs break there) and attaches the
      // Firebase bearer. Returns null on total transport failure.
      const r = await _nativePost('/api/assess-speaking', {
        level: ctx.level,
        prompt: ctx.prompt,
        audioBase64,
        mime: audio.type || 'audio/webm',
      });
      if (!r) return null; // total transport failure → not scored (caller retries)
      if (!r.ok) return null; // any error → not scored (caller retries)

      const data = (await r.json()) as {
        transcript?: string;
        scores?: Record<string, number>;
        confidence?: number;
      };
      const s = data.scores;
      if (
        !s ||
        typeof s.range !== 'number' ||
        typeof s.accuracy !== 'number' ||
        typeof s.fluency !== 'number' ||
        typeof s.task !== 'number'
      ) {
        return null;
      }
      const confidence = typeof data.confidence === 'number' ? data.confidence : 0;
      if (confidence < MIN_CONFIDENCE) return null;

      const scores = { range: s.range, accuracy: s.accuracy, fluency: s.fluency, task: s.task };
      return {
        transcript: data.transcript ?? '',
        scores,
        overall: computeSpeakingOverall(scores),
        confidence,
      };
    } catch {
      return null; // network/parse failure → not scored
    }
  },
};
