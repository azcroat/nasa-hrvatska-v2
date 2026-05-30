// Adaptive-practice category map for PracticeTab — maps each SkillCategory to a
// tile (label/icon/desc + launch action) for the "Practice Now" smart queue.
// Extracted from PracticeTab as part of the 1d decomposition; built by a factory
// that takes the launch handlers/content as deps (actions reference component scope).

import type { SkillCategory } from '../../lib/adaptive';

type AdaptiveDeps = {
  setScr: (id: string) => void;
  sCurEx: (id: string) => void;
  onLaunchFlash: (items: unknown[]) => void;
  startSpeaking: () => void;
  sh: <T>(arr: T[]) => T[];
  allCats: string[];
  V: Record<string, unknown[]>;
};

export function buildAdaptiveCategoryMap({
  setScr,
  sCurEx,
  onLaunchFlash,
  startSpeaking,
  sh,
  allCats,
  V,
}: AdaptiveDeps): Partial<
  Record<SkillCategory, { label: string; icon: string; desc: string; action: () => void }>
> {
  return {
    genitive: {
      label: 'Genitive Case',
      icon: '🔤',
      desc: 'od/bez/iz drills',
      action: () => {
        setScr('grammar');
        sCurEx('grammar');
      },
    },
    accusative: {
      label: 'Accusative Case',
      icon: '🔤',
      desc: 'Direct object drills',
      action: () => {
        setScr('grammar');
        sCurEx('grammar');
      },
    },
    'dative-locative': {
      label: 'Dative / Locative',
      icon: '🔤',
      desc: 'Location & recipient drills',
      action: () => {
        setScr('grammar');
        sCurEx('grammar');
      },
    },
    instrumental: {
      label: 'Instrumental Case',
      icon: '🔤',
      desc: 'With/by means of drills',
      action: () => {
        setScr('grammar');
        sCurEx('grammar');
      },
    },
    vocative: {
      label: 'Vocative Case',
      icon: '🔤',
      desc: 'Direct address drills',
      action: () => {
        setScr('grammar');
        sCurEx('grammar');
      },
    },
    'past-tense': {
      label: 'Past Tense',
      icon: '⏮️',
      desc: 'Perfect tense practice',
      action: () => {
        setScr('aspectdrill');
        sCurEx('aspectdrill');
      },
    },
    'future-tense': {
      label: 'Future Tense',
      icon: '⏭️',
      desc: 'Future I practice',
      action: () => {
        setScr('aspectdrill');
        sCurEx('aspectdrill');
      },
    },
    'aspect-imperfective': {
      label: 'Imperfective Aspect',
      icon: '🔄',
      desc: 'Ongoing action drills',
      action: () => {
        setScr('aspectdrill');
        sCurEx('aspectdrill');
      },
    },
    'aspect-perfective': {
      label: 'Perfective Aspect',
      icon: '✅',
      desc: 'Completed action drills',
      action: () => {
        setScr('aspectdrill');
        sCurEx('aspectdrill');
      },
    },
    'aspect-negation': {
      label: 'Aspect + Negation',
      icon: '❌',
      desc: 'Negate & flip aspect',
      action: () => {
        setScr('aspectdrill');
        sCurEx('aspectdrill');
      },
    },
    conditional: {
      label: 'Conditional',
      icon: '🤔',
      desc: 'Bi + conditional drills',
      action: () => {
        setScr('grammar');
        sCurEx('grammar');
      },
    },
    clitics: {
      label: 'Clitics',
      icon: '🔗',
      desc: 'Clitic placement drills',
      action: () => {
        setScr('aspectdrill');
        sCurEx('aspectdrill');
      },
    },
    'vocab-a2': {
      label: 'A2 Vocabulary',
      icon: '📚',
      desc: 'Core A2 words review',
      action: () =>
        onLaunchFlash(
          sh(allCats.flatMap((c) => (V as Record<string, string[][]>)[c] || [])).slice(0, 20),
        ),
    },
    'vocab-b1': {
      label: 'B1 Vocabulary',
      icon: '📚',
      desc: 'B1 words in context',
      action: () =>
        onLaunchFlash(
          sh(allCats.flatMap((c) => (V as Record<string, string[][]>)[c] || [])).slice(0, 20),
        ),
    },
    'vocab-b2': {
      label: 'B2 Vocabulary',
      icon: '📖',
      desc: 'Advanced B2 terms',
      action: () =>
        onLaunchFlash(
          sh(allCats.flatMap((c) => (V as Record<string, string[][]>)[c] || [])).slice(0, 20),
        ),
    },
    speaking: {
      label: 'Speaking',
      icon: '🎤',
      desc: 'Say it out loud',
      action: startSpeaking,
    },
  };
}
