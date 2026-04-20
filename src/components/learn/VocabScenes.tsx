// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { SCENES, loadDiscovered } from './VocabSceneData.js';
import { ScenePicker, ensureCSS } from './VocabSceneComponents';
import SceneExplorer from './SceneExplorer';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VocabScenes({ goBack, award }) {
  ensureCSS();

  const [currentScene, setCurrentScene] = useState(null);
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
    const next = SCENES[(idx + 1) % SCENES.length];
    setCurrentScene(next);
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
