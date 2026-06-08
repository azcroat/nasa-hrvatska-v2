/**
 * AppModals — all modal overlays driven by gamification / auth events.
 *
 * Extracted from App.jsx render to keep the main JSX tree readable.
 * Every modal here is conditionally rendered; none affect the page layout.
 */
import React, { lazy, Suspense, useState } from 'react';
import type { Stats } from '../../types';
import CelebrationModal from './CelebrationModal';
import StreakMilestoneModal from './StreakMilestoneModal';
import CeremonyModal from './CeremonyModal';
import LevelUpModal from './LevelUpModal';
import OnboardingTour from './OnboardingTour';
import PremiumWelcomeBanner from './PremiumWelcomeBanner';
// speak is lazy-loaded on first use — audio.js lives in chunk-data (loaded with first screen)
const _speakLazy = (text: string) => import('../../lib/audio.js').then((m) => m.speak(text));
import { trackOnboardingComplete } from '../../lib/analytics.js';
import { useCheckpoint } from '../../hooks/useCheckpoint.js';
import { isCheckpointDue, shouldShowCheckpoint } from '../../lib/checkpointSchedule.js';
import { CHECKPOINTS_ENABLED } from '../../lib/checkpointConfig.js';
import { getCertificationState } from '../../lib/cefrCertification.js';
import CheckpointInviteModal from '../exam/CheckpointInviteModal.js';
import ExamRunner from '../exam/ExamRunner.js';
import CheckpointResultScreen from '../exam/CheckpointResultScreen.js';
import type { CefrLevel } from '../../lib/cefr.js';
import type { SkillKey } from '../../lib/cefrCertification.js';

const PaywallScreen = lazy(() => import('./PaywallScreen'));

/** Module-level constant so useCheckpoint's useCallback identity stays stable. */
const NO_WEAK_SKILLS: SkillKey[] = [];

interface AppModalsProps {
  // Celebration / gamification
  showCelebration: boolean;
  setShowCelebration: (v: boolean) => void;
  celebXP: number;
  streakMilestone: number | null;
  setStreakMilestone: (v: number | null) => void;
  ceremonyType: string | null;
  setCeremonyType: (v: string | null) => void;
  levelUpData: { level: number } | null;
  setLevelUpData: (v: { level: number } | null) => void;
  // First words
  showFirstWords: boolean;
  setShowFirstWords: (v: boolean) => void;
  // Onboarding
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  _syncReady: boolean;
  authScreen: string;
  currentScreen: string;
  // Paywall
  showPaywall: boolean;
  setShowPaywall: (v: boolean) => void;
  paywallFeature: string;
  refreshSub: () => void;
  // Premium welcome
  showPremiumWelcome: boolean;
  setShowPremiumWelcome: (v: boolean) => void;
  // Shared data for modal content
  stats: Stats;
  lt: unknown;
  setScr: (v: string) => void;
  setTab: (v: string) => void;
  name: string;
  // Checkpoint flow
  checkpointCertifiedLevel: CefrLevel;
  checkpointActiveDayCount: number;
}

export function AppModals({
  // Celebration / gamification
  showCelebration,
  setShowCelebration,
  celebXP,
  streakMilestone,
  setStreakMilestone,
  ceremonyType,
  setCeremonyType,
  levelUpData,
  setLevelUpData,
  // First words
  showFirstWords,
  setShowFirstWords,
  // Onboarding
  onboarded,
  setOnboarded,
  _syncReady,
  authScreen,
  currentScreen,
  // Paywall
  showPaywall,
  setShowPaywall,
  paywallFeature,
  refreshSub,
  // Premium welcome
  showPremiumWelcome,
  setShowPremiumWelcome,
  // Shared data for modal content
  stats,
  lt,
  setScr,
  setTab,
  name,
  // Checkpoint flow
  checkpointCertifiedLevel,
  checkpointActiveDayCount,
}: AppModalsProps) {
  const cp = useCheckpoint({
    certifiedLevel: checkpointCertifiedLevel,
    weakSkills: NO_WEAK_SKILLS,
    activeDayCount: checkpointActiveDayCount,
  });

  // Local dismissed flag: set true on snooze so the invite hides immediately (React
  // won't re-render just from setPhase('idle') when phase is already 'idle').
  const [cpDismissed, setCpDismissed] = useState(false);

  // Force flag for E2E (Task 10): enables checkpoints in tests without flipping the prod flag.
  // Also overrides the syncReady gate so tests can reach the invite without live Firebase.
  const forced =
    typeof window !== 'undefined' &&
    (window as unknown as { __NH_CHECKPOINTS_FORCE__?: boolean }).__NH_CHECKPOINTS_FORCE__ === true;
  const enabled = CHECKPOINTS_ENABLED || forced;

  // Gate the localStorage parse behind `enabled` so getCertificationState() is
  // never called when the flag is off (hot-path perf). Do NOT useMemo — a stale
  // memo would wrongly re-show the invite right after a snooze/completion.
  const due =
    enabled &&
    isCheckpointDue({
      enabled,
      certified: checkpointCertifiedLevel,
      activeDayCount: checkpointActiveDayCount,
      checkpoints: getCertificationState().checkpoints,
      now: Date.now(),
    }).due;

  const showCheckpointInvite =
    !cpDismissed &&
    cp.phase === 'idle' &&
    shouldShowCheckpoint({ syncReady: forced || !!_syncReady, authScreen, currentScreen, due });

  return (
    <Suspense fallback={null}>
      {showCelebration && (
        <CelebrationModal
          xp={celebXP}
          onClose={() => setShowCelebration(false)}
          streak={stats.str || 0}
          lessonTopic={typeof lt === 'string' ? lt : ''}
          onNext={() => {
            setShowCelebration(false);
            setScr('dashboard');
            setTimeout(() => setTab('learn'), 300);
          }}
        />
      )}
      {streakMilestone && (
        <StreakMilestoneModal days={streakMilestone} onClose={() => setStreakMilestone(null)} />
      )}
      {ceremonyType && (
        <CeremonyModal
          type={ceremonyType}
          stats={stats}
          name={name}
          onClose={() => setCeremonyType(null)}
        />
      )}
      {levelUpData && (
        <LevelUpModal level={levelUpData.level} onClose={() => setLevelUpData(null)} />
      )}
      {showFirstWords && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.6)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 24,
              padding: '32px 24px',
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              animation: 'rise .4s',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🇭🇷</div>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 22,
                color: 'var(--heading)',
                marginBottom: 8,
              }}
            >
              Your First Croatian Words
            </h2>
            <p style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
              Tap any word to hear it
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                ['Bog', 'Hello / Hi'],
                ['Hvala', 'Thank you'],
                ['Molim', 'Please'],
                ['Da', 'Yes'],
                ['Dobar dan', 'Good day'],
              ].map(([hr = '', en]) => (
                <button
                  key={hr}
                  onClick={() => _speakLazy(hr)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1.5px solid var(--card-b)',
                    background: 'var(--bar-bg)',
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0e7490' }}>{hr}</span>
                  <span style={{ fontSize: 14, color: 'var(--subtext)' }}>{en}</span>
                  <span style={{ fontSize: 18 }}>🔊</span>
                </button>
              ))}
            </div>
            <button
              className="b bp"
              style={{ width: '100%', fontSize: 15, padding: '14px' }}
              onClick={() => {
                setShowFirstWords(false);
                setScr('dashboard');
                setTimeout(() => setTab('learn'), 300);
              }}
            >
              Start Learning →
            </button>
          </div>
        </div>
      )}
      {!onboarded &&
        _syncReady &&
        authScreen === 'app' &&
        currentScreen !== 'welcome' &&
        currentScreen !== 'placement' && (
          <OnboardingTour
            onDone={() => {
              setOnboarded(true);
              trackOnboardingComplete();
            }}
            onLaunchLesson={() => {
              setScr('dashboard');
              setTimeout(() => setTab('learn'), 400);
            }}
          />
        )}
      {showPaywall && (
        <PaywallScreen
          featureName={paywallFeature}
          onClose={() => setShowPaywall(false)}
          onSubscribed={() => {
            setShowPaywall(false);
            refreshSub();
          }}
        />
      )}
      {showPremiumWelcome && <PremiumWelcomeBanner onClose={() => setShowPremiumWelcome(false)} />}
      {showCheckpointInvite && (
        <CheckpointInviteModal
          level={checkpointCertifiedLevel}
          onStart={() => {
            setCpDismissed(false);
            cp.start();
          }}
          onSnooze={() => {
            setCpDismissed(true);
            cp.snooze(endOfLocalDayMs());
          }}
        />
      )}
      {cp.phase === 'running' && cp.exam && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <ExamRunner
              questions={cp.exam.questions}
              speaking={{
                level: cp.exam.speaking.level,
                tasks: cp.exam.speaking.tasks,
                scorer: cp.scorer,
              }}
              onComplete={cp.complete}
            />
          </div>
        </div>
      )}
      {cp.phase === 'result' && cp.outcome && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <CheckpointResultScreen
              level={checkpointCertifiedLevel}
              outcome={cp.outcome}
              onContinue={() => {
                cp.reset();
                setTab('learn');
              }}
              onRetry={cp.start}
            />
          </div>
        </div>
      )}
    </Suspense>
  );
}

export default AppModals;

/** Epoch ms at the end of the user's local day — used for "remind me tonight". */
function endOfLocalDayMs(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
