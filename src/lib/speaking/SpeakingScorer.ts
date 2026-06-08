// src/lib/speaking/SpeakingScorer.ts
import type { CefrLevel } from '../cefr.js';

export interface SpeakingRubricScores {
  range: number; // vocabulary/structures available (0..1)
  accuracy: number; // grammatical control while speaking (0..1)
  fluency: number; // keeps going without breakdown (0..1)
  task: number; // task achievement / relevance (0..1)
  /** v2 (Azure) — phoneme-level pronunciation. Absent in v1. */
  pronunciation?: number;
}

export interface SpeakingAssessment {
  transcript: string;
  scores: SpeakingRubricScores;
  /** Weighted overall (0..1). */
  overall: number;
  /** STT confidence → intelligibility proxy (0..1). */
  confidence: number;
}

export interface SpeakingContext {
  level: CefrLevel;
  prompt: string;
}

/**
 * The swappable boundary. v1 = Whisper(STT) → Claude(rubric). v2 may swap in
 * Azure Pronunciation Assessment without any change to callers.
 *
 * Returns `null` on technical failure (mic denied, STT/rubric error, or
 * unusably low confidence). Callers MUST treat `null` as "not scored — retry",
 * never as a failing score (fairness invariant).
 */
export interface SpeakingScorer {
  assess(audio: Blob, ctx: SpeakingContext): Promise<SpeakingAssessment | null>;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** v1 overall: equal-weight mean of the four productive criteria. */
export function computeSpeakingOverall(s: SpeakingRubricScores): number {
  const mean = (s.range + s.accuracy + s.fluency + s.task) / 4;
  return clamp01(mean);
}
