import React from 'react';
import FoodScene from './FoodScene';
import FamilyScene from './FamilyScene';
import TravelScene from './TravelScene';
import GreetingScene from './GreetingScene';

// Named re-exports kept for any consumers that import them directly.
export { default as FoodScene } from './FoodScene';
export { default as FamilyScene } from './FamilyScene';
export { default as TravelScene } from './TravelScene';
export { default as GreetingScene } from './GreetingScene';

// ─── Scene map & default export ──────────────────────────────────────────────
const SCENES = {
  food: FoodScene,
  family: FamilyScene,
  travel: TravelScene,
  greetings: GreetingScene,
};

export default function VocabScene({ scene = 'food' }: { scene?: string }) {
  const S = SCENES[scene as keyof typeof SCENES] || FoodScene;
  return <S />;
}
