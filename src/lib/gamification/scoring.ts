export type PerformanceTier = 'miss' | 'weak' | 'solid' | 'perfect';

export interface AnswerInput {
  correct: boolean;
  responseMs: number;
  combo: number; // combo BEFORE this answer
}

export interface AnswerResult {
  points: number;
  combo: number; // combo AFTER this answer
  speedBonus: number;
  tier: PerformanceTier;
}

export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 50;
export const FAST_MS = 1500; // at/under → full speed bonus
export const SLOW_MS = 6000; // at/over → no speed bonus

// Linear speed bonus between FAST_MS (full) and SLOW_MS (none).
function speedBonusFor(responseMs: number): number {
  if (responseMs <= FAST_MS) return MAX_SPEED_BONUS;
  if (responseMs >= SLOW_MS) return 0;
  const frac = (SLOW_MS - responseMs) / (SLOW_MS - FAST_MS);
  return Math.round(MAX_SPEED_BONUS * frac);
}

// Tier for a CORRECT answer, by speed.
function correctTier(responseMs: number): Exclude<PerformanceTier, 'miss'> {
  if (responseMs <= FAST_MS) return 'perfect';
  if (responseMs >= SLOW_MS) return 'weak';
  return 'solid';
}

export function scoreAnswer(input: AnswerInput): AnswerResult {
  if (!input.correct) {
    return { points: 0, combo: 0, speedBonus: 0, tier: 'miss' };
  }
  const speedBonus = speedBonusFor(input.responseMs);
  const multiplier = Math.min(2.0, 1 + input.combo * 0.1);
  const points = Math.round((BASE_POINTS + speedBonus) * multiplier);
  return { points, combo: input.combo + 1, speedBonus, tier: correctTier(input.responseMs) };
}
