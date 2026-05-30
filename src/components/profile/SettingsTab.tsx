import React, { useState } from 'react';
import { useContent } from '../../hooks/useContent';
import { useApp } from '../../context/AppContext';
import HeritageEntrySection from './sections/HeritageEntrySection';
import GoalFocusSection from './sections/GoalFocusSection';
import LearningPreferencesSection from './sections/LearningPreferencesSection';
import DifficultySection from './sections/DifficultySection';
import GoalSelectorSection from './sections/GoalSelectorSection';
import StreakProtectionSection from './sections/StreakProtectionSection';
import NotificationsSection from './sections/NotificationsSection';
import CloudSyncSection from './sections/CloudSyncSection';
import AppearanceSection from './sections/AppearanceSection';
import DataAccountSection from './sections/DataAccountSection';

export default function SettingsTab({
  syncReady,
  onSyncNow,
}: {
  syncReady: boolean;
  onSyncNow?: () => void | Promise<boolean | void>;
}) {
  const { setScr, launchFlashcards, launchSpeaking } = useApp();
  const { content } = useContent();
  const V = (content?.V ?? {}) as Record<string, any[]>;
  // currentGoal stays lifted here: it's shared by GoalFocusSection (renders the
  // active goal's shortcuts) and GoalSelectorSection (changes it).
  const [currentGoal, setCurrentGoal] = useState(() => localStorage.getItem('nh_goal') || '');

  return (
    <React.Fragment>
      {/* ── GOAL FOCUS + PARTNER ── */}
      <GoalFocusSection
        currentGoal={currentGoal}
        V={V}
        setScr={setScr}
        launchFlashcards={launchFlashcards}
        launchSpeaking={launchSpeaking}
      />

      <LearningPreferencesSection />

      <DifficultySection />

      <GoalSelectorSection currentGoal={currentGoal} setCurrentGoal={setCurrentGoal} />

      {/* ── HERITAGE MODE ENTRY POINT ── */}
      <HeritageEntrySection setScr={setScr} />
      <StreakProtectionSection onSyncNow={onSyncNow} />

      <NotificationsSection />

      <CloudSyncSection syncReady={syncReady} onSyncNow={onSyncNow} />

      <AppearanceSection />

      <DataAccountSection />
    </React.Fragment>
  );
}
