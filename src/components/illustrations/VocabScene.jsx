import React from 'react';
import FoodScene from './FoodScene.jsx';
import FamilyScene from './FamilyScene.jsx';
import TravelScene from './TravelScene.jsx';
import GreetingScene from './GreetingScene.jsx';

// Named re-exports kept for any consumers that import them directly.
export { default as FoodScene } from './FoodScene.jsx';
export { default as FamilyScene } from './FamilyScene.jsx';
export { default as TravelScene } from './TravelScene.jsx';
export { default as GreetingScene } from './GreetingScene.jsx';

// ─── Scene map & default export ──────────────────────────────────────────────
const SCENES = {
  food:      FoodScene,
  family:    FamilyScene,
  travel:    TravelScene,
  greetings: GreetingScene,
};

export default function VocabScene({ scene = 'food' }) {
  const S = SCENES[scene] || FoodScene;
  return <S />;
}
