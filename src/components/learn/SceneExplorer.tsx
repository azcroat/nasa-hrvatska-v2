import React, { useState, useEffect, useRef, useCallback } from 'react';
import { speak } from '../../lib/audio.js';
import {
  loadDiscovered,
  saveDiscovered,
  loadSRS,
  saveSRS,
  loadSRSQueue,
  saveSRSQueue,
} from './VocabSceneData.js';
import { SCENE_SVGS } from './VocabSceneSVGs';
import {
  ProgressBar,
  ItemButton,
  ItemPopup,
  SceneComplete,
  Confetti,
  Toast,
} from './VocabSceneComponents';

interface SceneItem {
  id: string;
  hr: string;
  en: string;
  icon: string;
  note: string;
  x: number;
  y: number;
}

interface Scene {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  emoji: string;
  color: string;
  bg: string;
  sceneStyle: Record<string, string | number>;
  items: SceneItem[];
  [key: string]: unknown;
}

export default function SceneExplorer({
  scene,
  onBack,
  onNextScene,
  award,
}: {
  scene: Scene;
  onBack: () => void;
  onNextScene: () => void;
  award?: (pts: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const [discovered, setDiscovered] = useState(() => loadDiscovered(scene.id));
  const [activeItem, setActiveItem] = useState<SceneItem | null>(null);
  const [addedToSRS, setAddedToSRS] = useState(() => loadSRS());
  const [viewMode, setViewMode] = useState('explore');
  const [quizScore, setQuizScore] = useState({ known: 0, unknown: 0 });
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completeFired, setCompleteFired] = useState(false);
  const awardFired = useRef(false);

  const total = scene.items.length;
  const discCount = discovered.size;

  // Check completion
  useEffect(() => {
    if (discCount >= total && !completeFired) {
      setCompleteFired(true);
      setShowComplete(true);
      if (!awardFired.current) {
        awardFired.current = true;
        if (typeof award === 'function') award(15, false, 'vocabulary');
      }
    }
  }, [discCount, total, completeFired, award]);

  const handleItemTap = useCallback(
    (item: SceneItem) => {
      // Mark discovered
      setDiscovered((prev) => {
        if (!prev.has(item.id)) {
          const next = new Set(prev);
          next.add(item.id);
          saveDiscovered(scene.id, next);
          return next;
        }
        return prev;
      });
      setActiveItem(item);
      setQuizRevealed(false);
      speak(item.hr);
    },
    [scene.id],
  );

  const handleClose = useCallback(() => {
    setActiveItem(null);
    setQuizRevealed(false);
  }, []);

  const handleAddSRS = useCallback(() => {
    if (!activeItem) return;
    const key = `${scene.id}_${activeItem.id}`;
    if (addedToSRS.has(key)) return;

    const next = new Set(addedToSRS);
    next.add(key);
    setAddedToSRS(next);
    saveSRS(next);

    // Persist to SRS queue
    const queue = loadSRSQueue();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exists = (queue as any[]).some((q) => q.hr === activeItem.hr && q.en === activeItem.en);
    if (!exists) {
      queue.push({ hr: activeItem.hr, en: activeItem.en, note: activeItem.note });
      saveSRSQueue(queue);
    }

    setToast(`Added "${activeItem.hr}" to your word list!`);
  }, [activeItem, addedToSRS, scene.id]);

  const handleQuizAnswer = useCallback(
    (result: boolean | null) => {
      if (result === null) {
        // "Reveal" pressed
        setQuizRevealed(true);
        return;
      }
      if (result === true) setQuizScore((s) => ({ ...s, known: s.known + 1 }));
      else if (result === false) setQuizScore((s) => ({ ...s, unknown: s.unknown + 1 }));
      handleClose();
    },
    [handleClose],
  );

  const isAdded = activeItem ? addedToSRS.has(`${scene.id}_${activeItem.id}`) : false;

  return (
    <div className="scr-wrap">
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--subtext)',
              padding: '4px 0',
            }}
          >
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#1c1917' }}>
              {scene.icon} {scene.title}
            </span>
            <span style={{ fontSize: 12, color: '#78716c', marginLeft: 6 }}>{scene.titleEn}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: scene.color }}>
            {discCount}/{total}
          </div>
        </div>

        {/* Mini progress */}
        <ProgressBar value={discCount} max={total} color={scene.color} height={5} />

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {['explore', 'quiz'].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                setActiveItem(null);
              }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                background: viewMode === mode ? scene.color : '#f5f5f4',
                color: viewMode === mode ? 'white' : '#44403c',
                transition: 'background 0.2s',
              }}
            >
              {mode === 'explore' ? '🔍 Explore' : '🧠 Quiz'}
            </button>
          ))}
        </div>

        {/* Quiz score bar */}
        {viewMode === 'quiz' && quizScore.known + quizScore.unknown > 0 && (
          <div
            style={{
              marginTop: 8,
              background: '#f1f5f9',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: '#475569',
              display: 'flex',
              gap: 16,
            }}
          >
            <span style={{ color: '#15803d' }}>✓ Known: {quizScore.known}</span>
            <span style={{ color: '#b91c1c' }}>✗ Missed: {quizScore.unknown}</span>
          </div>
        )}
      </div>

      {/* Scene area */}
      <div
        style={{
          height: 320,
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          ...scene.sceneStyle,
          boxShadow: '0 2px 16px rgba(0,0,0,.12)',
          marginBottom: 16,
        }}
      >
        {/* SVG illustration background */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(SCENE_SVGS as Record<string, any>)[scene.id] || (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 160,
              opacity: 0.1,
              userSelect: 'none',
              pointerEvents: 'none',
              lineHeight: 1,
            }}
          >
            {scene.emoji}
          </div>
        )}

        {/* Item buttons */}
        {scene.items.map((item) => (
          <ItemButton
            key={item.id}
            item={item}
            discovered={discovered.has(item.id)}
            isActive={activeItem?.id === item.id}
            isQuiz={viewMode === 'quiz' && !discovered.has(item.id)}
            onTap={() => handleItemTap(item)}
          />
        ))}

        {/* Popup */}
        {activeItem && (
          <ItemPopup
            item={activeItem}
            scene={scene}
            isAdded={isAdded}
            isQuiz={viewMode === 'quiz'}
            quizRevealed={quizRevealed}
            onClose={handleClose}
            onSpeak={() => speak(activeItem.hr)}
            onAddSRS={handleAddSRS}
            onQuizAnswer={handleQuizAnswer}
          />
        )}

        {/* Confetti + complete overlay */}
        {showComplete && <Confetti />}
        {showComplete && (
          <SceneComplete
            scene={scene}
            onBack={onBack}
            onNext={() => {
              setShowComplete(false);
              onNextScene();
            }}
          />
        )}
      </div>

      {/* Word list below scene */}
      <div
        style={{
          marginBottom: 8,
          fontSize: 12,
          fontWeight: 700,
          color: '#78716c',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}
      >
        {discCount < total
          ? `${total - discCount} words left to discover`
          : 'All words discovered!'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {scene.items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveItem(item);
              setQuizRevealed(false);
              speak(item.hr);
            }}
            style={{
              background: discovered.has(item.id) ? scene.bg : '#f5f5f4',
              border: discovered.has(item.id)
                ? `1.5px solid ${scene.color}55`
                : '1.5px solid #e7e5e4',
              borderRadius: 20,
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
              color: discovered.has(item.id) ? scene.color : '#a8a29e',
            }}
          >
            {discovered.has(item.id) ? item.hr : '• • •'}
          </button>
        ))}
      </div>

      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
