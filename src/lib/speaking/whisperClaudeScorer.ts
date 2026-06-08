// src/lib/speaking/whisperClaudeScorer.ts
import { _nativePost } from '../nativePost.js';
import {
  computeSpeakingOverall,
  type SpeakingScorer,
  type SpeakingAssessment,
} from './SpeakingScorer.js';

/**
 * Below this transcript-sufficiency value we cannot fairly score; treat as "retry".
 * `transcriptSufficiency` is a transcript-LENGTH heuristic (word-count bucket) from the
 * server, NOT an acoustic/STT confidence.
 */
const MIN_TRANSCRIPT_SUFFICIENCY = 0.4;

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
        // transcript-LENGTH heuristic (word-count bucket), NOT acoustic/STT confidence.
        transcriptSufficiency?: number;
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
      const transcriptSufficiency =
        typeof data.transcriptSufficiency === 'number' ? data.transcriptSufficiency : 0;
      if (transcriptSufficiency < MIN_TRANSCRIPT_SUFFICIENCY) return null;

      const scores = { range: s.range, accuracy: s.accuracy, fluency: s.fluency, task: s.task };
      return {
        transcript: data.transcript ?? '',
        scores,
        overall: computeSpeakingOverall(scores),
        // SpeakingAssessment.confidence is the scorer's output contract; we populate it from
        // the transcript-sufficiency heuristic (the only signal available in v1).
        confidence: transcriptSufficiency,
      };
    } catch {
      return null; // network/parse failure → not scored
    }
  },
};
