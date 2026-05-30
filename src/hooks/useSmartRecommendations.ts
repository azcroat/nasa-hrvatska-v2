import { useApp } from '../context/AppContext';
import { getSR, getDueReviews } from '../data';

/**
 * Smart practice recommendations for PracticeTab — due-review count, weak-word
 * count, new-user flag, and goal-based recommendation tiles. Extracted from
 * PracticeTab as part of the 1d decomposition. The goal tiles carry handlers, so
 * the launch callbacks + content come in as params; setScr comes from useApp().
 * Behavior-identical to the prior inline block.
 */
export function useSmartRecommendations({
  lc,
  V,
  sh,
  sCurEx,
  onLaunchFlash,
  startSpeaking,
}: {
  lc: number;
  V: Record<string, unknown[]>;
  sh: <T>(arr: T[]) => T[];
  sCurEx: (id: string) => void;
  onLaunchFlash: (items: unknown[]) => void;
  startSpeaking: () => void;
}) {
  const { setScr } = useApp();
  const dueReviews = getDueReviews(); // intentionally not memoised — reads localStorage on every render so count stays current after completing reviews
  const sr = getSR();
  const weakWords = Object.values(sr).filter((v) => v.w > 0);
  const weakCount = weakWords.length;
  const _avgAcc =
    weakCount > 0
      ? Math.round(
          (weakWords.reduce((s, v) => s + (v.r || 0) / ((v.r || 0) + v.w), 0) / weakCount) * 100,
        )
      : 0;
  const _h = new Date().getHours();
  const placementDone = !!localStorage.getItem('nh_placement_done');
  const isNewUser = lc === 0 && !placementDone;
  const userGoal = localStorage.getItem('nh_goal');
  // Goal-based recommendations — shown when nh_goal is set, giving the
  // personalisation we promised during onboarding
  const goalRecMap = {
    heritage: [
      {
        icon: '🏛️',
        title: 'Croatian History',
        desc: 'Explore your roots',
        color: 'rgba(234,88,12,.08)',
        border: 'rgba(234,88,12,.25)',
        fn: () => {
          setScr('history');
          sCurEx('history');
        },
      },
      {
        icon: '🗣️',
        title: 'Idioms',
        desc: 'Phrases locals actually use',
        color: 'rgba(234,88,12,.08)',
        border: 'rgba(234,88,12,.25)',
        fn: () => {
          setScr('idioms');
          sCurEx('idioms');
        },
      },
      {
        icon: '📖',
        title: 'Reading',
        desc: 'Stories from Croatia',
        color: 'rgba(22,163,74,.08)',
        border: 'rgba(22,163,74,.25)',
        fn: () => {
          setScr('readlist');
          sCurEx('readlist');
        },
      },
    ],
    family: [
      {
        icon: '🃏',
        title: 'Family Words',
        desc: 'People & relationships',
        color: 'rgba(234,88,12,.08)',
        border: 'rgba(234,88,12,.25)',
        fn: () => {
          const p = V['family'] || [];
          onLaunchFlash(sh(p).slice(0, 20));
        },
      },
      {
        icon: '🎤',
        title: 'Speaking',
        desc: 'Say it out loud',
        color: 'rgba(14,116,144,.08)',
        border: 'rgba(14,116,144,.25)',
        fn: startSpeaking,
      },
      {
        icon: '💬',
        title: 'Dialogue Sim',
        desc: 'Real-life conversations',
        color: 'rgba(124,58,237,.08)',
        border: 'rgba(124,58,237,.25)',
        fn: () => {
          setScr('dialogue');
          sCurEx('dialogue');
        },
      },
    ],
    travel: [
      {
        icon: '🍽️',
        title: 'Restaurant',
        desc: 'Order like a local',
        color: 'rgba(234,88,12,.08)',
        border: 'rgba(234,88,12,.25)',
        fn: () => {
          setScr('restaurant');
          sCurEx('restaurant');
        },
      },
      {
        icon: '🚗',
        title: 'Transport',
        desc: 'Get around Croatia',
        color: 'rgba(22,163,74,.08)',
        border: 'rgba(22,163,74,.25)',
        fn: () => {
          setScr('transport');
          sCurEx('transport');
        },
      },
      {
        icon: '🚨',
        title: 'Emergency',
        desc: 'Phrases that matter most',
        color: 'rgba(220,38,38,.08)',
        border: 'rgba(220,38,38,.25)',
        fn: () => {
          setScr('emergency');
          sCurEx('emergency');
        },
      },
    ],
    culture: [
      {
        icon: '🌊',
        title: 'Immersion Hub',
        desc: 'Full Croatian immersion',
        color: 'rgba(14,116,144,.08)',
        border: 'rgba(14,116,144,.25)',
        fn: () => {
          setScr('immersion');
          sCurEx('immersion');
        },
      },
      // AI Conversation and Conversation Partners tiles moved out of the
      // Practice tab — all AI surfaces now live exclusively under the
      // AI Tutor tab. Single entry point for the entire AI feature family
      // simplifies discovery, removes the prior 3-place duplication, and
      // sets up clean paywall gating in the future (gate one tab, not
      // three scattered entry points).
    ],
    fluent: [
      {
        icon: '🎓',
        title: 'CEFR Test',
        desc: 'Check your level A1→B2',
        color: 'rgba(14,116,144,.08)',
        border: 'rgba(14,116,144,.25)',
        fn: () => {
          setScr('cefrtest');
          sCurEx('cefrtest');
        },
      },
      {
        icon: '💬',
        title: 'Dialogue Sim',
        desc: 'Real turn-based conversations',
        color: 'rgba(124,58,237,.08)',
        border: 'rgba(124,58,237,.25)',
        fn: () => {
          setScr('dialogue');
          sCurEx('dialogue');
        },
      },
      {
        icon: '🗣️',
        title: 'Shadowing',
        desc: 'Native-speed listen & repeat',
        color: 'rgba(22,163,74,.08)',
        border: 'rgba(22,163,74,.25)',
        fn: () => {
          setScr('shadowing');
          sCurEx('shadowing');
        },
      },
    ],
    partner: [
      {
        icon: '💑',
        title: 'In-Law Words',
        desc: 'Svekrva, punac, šogor...',
        color: 'rgba(234,88,12,.08)',
        border: 'rgba(234,88,12,.25)',
        fn: () => {
          const p = V['inlaws'] || [];
          onLaunchFlash(sh(p || []).slice(0, 20));
        },
      },
      {
        icon: '🍽️',
        title: 'Survival Dinner',
        desc: 'Navigate family gatherings',
        color: 'rgba(22,163,74,.08)',
        border: 'rgba(22,163,74,.25)',
        fn: () => {
          setScr('survival_dinner');
          sCurEx('survival_dinner');
        },
      },
      {
        icon: '🎤',
        title: 'Speaking',
        desc: 'Impress them out loud',
        color: 'rgba(14,116,144,.08)',
        border: 'rgba(14,116,144,.25)',
        fn: startSpeaking,
      },
    ],
  };
  const goalItems = userGoal
    ? (goalRecMap as Record<string, (typeof goalRecMap)['heritage']>)[userGoal]
    : null;
  const goalLabels = {
    heritage: 'Your Heritage',
    family: 'Speaking with Family',
    travel: 'Traveling to Croatia',
    culture: 'Croatian Culture',
    fluent: 'Becoming Fluent',
    partner: "Your Partner's Language",
  };
  return { dueReviews, weakCount, goalItems, isNewUser, userGoal, goalLabels };
}
