import React from 'react';
import { PLACES, type PlaceId } from './places';
import { itemsForPlace, type ModelCtx } from './gradModel';

// NOTE: minimal placeholder — Task 5 replaces this with the host-hero interior
// (port of place-interior-v2.html) + subgroups + locked teasers. Kept
// functional so GradTab compiles and can open a place.
export default function PlaceScreen({
  placeId,
  ctx,
  onBack,
}: {
  placeId: PlaceId;
  ctx: ModelCtx;
  onBack: () => void;
}) {
  const place = PLACES.find((p) => p.id === placeId)!;
  const items = itemsForPlace(placeId, ctx);
  return (
    <div data-testid="place-screen">
      <button onClick={onBack}>← Grad</button>
      <h2>{place.name}</h2>
      {items.map((i) => (
        <button key={i.id} disabled={i.locked} onClick={i.launch}>
          {i.icon} {i.label}
        </button>
      ))}
    </div>
  );
}
