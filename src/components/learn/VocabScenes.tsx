import React, { useState, useCallback } from 'react';
import { SCENES, loadDiscovered } from './VocabSceneData.js';
import { ScenePicker, ensureCSS } from './VocabSceneComponents';
import SceneExplorer from './SceneExplorer';

interface VocabScene {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  emoji: string;
  color: string;
  bg: string;
  sceneStyle: Record<string, string | number>;
  items: { id: string; hr: string; en: string; icon: string; note: string; x: number; y: number }[];
  [key: string]: unknown;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VocabScenes({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  void goBack; // goBack passed to children via SceneExplorer
  ensureCSS();

  const [currentScene, setCurrentScene] = useState<VocabScene | null>(null);
  const [allDiscovered, setAllDiscovered] = useState(() =>
    Object.fromEntries(SCENES.map((sc) => [sc.id, loadDiscovered(sc.id)])),
  );

  // Refresh allDiscovered when returning to picker
  const handleBackToPicker = useCallback(() => {
    setCurrentScene(null);
    setAllDiscovered(Object.fromEntries(SCENES.map((sc) => [sc.id, loadDiscovered(sc.id)])));
  }, []);

  const handleNextScene = useCallback(() => {
    if (!currentScene) return;
    const idx = SCENES.findIndex((s) => s.id === currentScene.id);
    const next = SCENES[(idx + 1) % SCENES.length] as VocabScene | undefined;
    if (next) setCurrentScene(next);
    setAllDiscovered(Object.fromEntries(SCENES.map((sc) => [sc.id, loadDiscovered(sc.id)])));
  }, [currentScene]);

  if (currentScene) {
    return (
      <SceneExplorer
        key={currentScene.id}
        scene={currentScene}
        onBack={handleBackToPicker}
        onNextScene={handleNextScene}
        award={award}
      />
    );
  }

  return <ScenePicker onSelect={setCurrentScene} allDiscovered={allDiscovered} />;
}
