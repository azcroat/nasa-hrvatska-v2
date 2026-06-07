// src/data/speakingTasks.ts
import type { CefrLevel } from '../lib/cefr.js';

export interface SpeakingTask {
  id: string;
  /** Spoken prompt shown in Croatian. */
  prompt: string;
  /** English gloss under the prompt. */
  promptEn: string;
  /** Suggested speaking duration (seconds). */
  seconds: number;
}

/**
 * Productive speaking prompts per CEFR level. The learner records an open
 * spoken answer; Plan 2 transcribes (Whisper) and scores it (Claude rubric:
 * range / accuracy / fluency / task). Prompts escalate in cognitive demand
 * per the CEFR speaking descriptors (A1 concrete/personal -> C1 abstract/argued).
 */
export const SPEAKING_TASKS: Partial<Record<CefrLevel, SpeakingTask[]>> = {
  A1: [
    {
      id: 'a1-intro',
      prompt: 'Predstavite se: kako se zovete, odakle ste i koliko imate godina.',
      promptEn: 'Introduce yourself: your name, where you are from, and your age.',
      seconds: 30,
    },
    {
      id: 'a1-family',
      prompt: 'Opišite svoju obitelj. Tko su članovi vaše obitelji?',
      promptEn: 'Describe your family. Who are its members?',
      seconds: 30,
    },
  ],
  A2: [
    {
      id: 'a2-day',
      prompt: 'Opišite svoj uobičajeni dan, od jutra do večeri.',
      promptEn: 'Describe your typical day, from morning to evening.',
      seconds: 40,
    },
    {
      id: 'a2-weekend',
      prompt: 'Što ste radili prošli vikend? Ispričajte ukratko.',
      promptEn: 'What did you do last weekend? Tell it briefly.',
      seconds: 40,
    },
  ],
  B1: [
    {
      id: 'b1-trip',
      prompt: 'Opišite putovanje koje ste nedavno doživjeli — kamo, s kim i što se dogodilo.',
      promptEn: 'Describe a recent trip — where, with whom, and what happened.',
      seconds: 45,
    },
    {
      id: 'b1-opinion',
      prompt: 'Mislite li da je bolje živjeti u gradu ili na selu? Obrazložite.',
      promptEn: 'Do you think it is better to live in the city or the countryside? Give reasons.',
      seconds: 45,
    },
  ],
  B2: [
    {
      id: 'b2-tech',
      prompt:
        'Kako je tehnologija promijenila način na koji ljudi komuniciraju? Iznesite argumente.',
      promptEn: 'How has technology changed the way people communicate? Make your case.',
      seconds: 60,
    },
    {
      id: 'b2-problem',
      prompt: 'Opišite jedan problem u svojoj zajednici i predložite rješenje.',
      promptEn: 'Describe a problem in your community and propose a solution.',
      seconds: 60,
    },
  ],
  C1: [
    {
      id: 'c1-abstract',
      prompt:
        'Treba li umjetnost imati društvenu svrhu ili postojati radi sebe same? Razložite svoje stajalište.',
      promptEn: 'Should art serve a social purpose or exist for its own sake? Argue your position.',
      seconds: 60,
    },
    {
      id: 'c1-media',
      prompt: 'Kakvu ulogu mediji imaju u oblikovanju javnog mnijenja? Kritički procijenite.',
      promptEn: 'What role do the media play in shaping public opinion? Evaluate critically.',
      seconds: 60,
    },
  ],
};

export function getSpeakingTasks(level: CefrLevel): SpeakingTask[] {
  return SPEAKING_TASKS[level] ?? [];
}
