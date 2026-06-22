import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import GradMap from './GradMap';
import type { Recommendation } from './gradModel';

vi.mock('../family/CharacterPortrait', () => ({
  default: ({ name }: { name: string }) =>
    React.createElement('span', { 'data-portrait': name, 'data-testid': `portrait-${name}` }),
}));

const rec: Recommendation = {
  exerciseId: 'srsreview',
  placeId: 'kavana',
  host: 'ana',
  hr: 'Ana ti je spremila 6 fraza',
  en: '6 reviews waiting',
  count: 6,
  durationMin: 6,
  launch: vi.fn(),
};

const stats = {
  kavana: { total: 5, done: 5, due: 0, lockedCount: 0 }, // mastered
  kuhinja: { total: 5, done: 2, due: 2, lockedCount: 0 }, // in progress
  trznica: { total: 5, done: 1, due: 3, lockedCount: 0 }, // in progress
  trg: { total: 5, done: 1, due: 0, lockedCount: 0 }, // in progress
  ulica: { total: 5, done: 0, due: 0, lockedCount: 0 }, // quiet
  soba: { total: 4, done: 0, due: 0, lockedCount: 4 }, // locked
};

function setup(extra = {}) {
  const onOpenPlace = vi.fn();
  const utils = render(
    <GradMap rec={rec} statsByPlace={stats as never} onOpenPlace={onOpenPlace} {...extra} />,
  );
  return { ...utils, onOpenPlace };
}

describe('GradMap — hero + list', () => {
  it('renders the hero town art', () => {
    expect(setup().getByTestId('grad-town-art')).toBeTruthy();
  });
  it('progress line shows alive count out of 6', () => {
    expect(setup().getByTestId('karta-progress').textContent).toMatch(/1 \/ 6/);
  });
  it('Danas card launches the recommendation', () => {
    const { getByTestId } = setup();
    fireEvent.click(getByTestId('grad-map-today'));
    expect(rec.launch).toHaveBeenCalledTimes(1);
  });
  it('mastered place shows full ring', () => {
    expect(setup().getByTestId('ring-kavana').getAttribute('data-completion')).toBe('1');
  });
  it('in-progress place shows a due badge', () => {
    expect(setup().getByTestId('due-badge-trznica').textContent).toBe('3');
  });
  it('locked place is marked locked', () => {
    expect(setup().getByTestId('marker-locked-soba')).toBeTruthy();
  });
  it('tapping a place row opens it', () => {
    const { getByTestId, onOpenPlace } = setup();
    fireEvent.click(getByTestId('place-row-kuhinja'));
    expect(onOpenPlace).toHaveBeenCalledWith('kuhinja');
  });
  it('disables animation under reduced motion (style guard present)', () => {
    expect(setup().container.innerHTML).toContain('prefers-reduced-motion');
  });
});
