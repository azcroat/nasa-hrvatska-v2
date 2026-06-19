import React from 'react';
import { PLACES, type PlaceId } from './places';
import type { Recommendation } from './gradModel';

// NOTE: minimal placeholder — Task 4 replaces this with the crafted SVG town
// (port of grad-map-v2.html). Kept functional so GradTab compiles and its
// toggle test passes.
export default function GradMap({
  rec,
  onOpenPlace,
}: {
  rec: Recommendation;
  onOpenPlace: (id: PlaceId) => void;
  statsByPlace: Record<string, { due: number; total: number }>;
}) {
  return (
    <div data-testid="grad-map">
      {PLACES.map((p) => (
        <button key={p.id} onClick={() => onOpenPlace(p.id)}>
          {p.icon} {p.name}
        </button>
      ))}
      <div data-testid="grad-map-today">{rec.hr}</div>
    </div>
  );
}
