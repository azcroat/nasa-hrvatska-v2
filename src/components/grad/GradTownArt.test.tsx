import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import GradTownArt from './GradTownArt';
import type { PlaceId } from './places';
import type { PlaceLife } from './gradModel';

const life = (o: Partial<Record<PlaceId, PlaceLife>> = {}): Record<PlaceId, PlaceLife> => ({
  kavana: 'dormant',
  trznica: 'dormant',
  soba: 'dormant',
  kuhinja: 'dormant',
  ulica: 'dormant',
  trg: 'dormant',
  ...o,
});

describe('GradTownArt', () => {
  it('renders the town art svg', () => {
    const { getByTestId } = render(<GradTownArt lifeByPlace={life()} />);
    expect(getByTestId('grad-town-art')).toBeTruthy();
  });

  it('sets data-life per district from lifeByPlace', () => {
    const { container } = render(
      <GradTownArt lifeByPlace={life({ kavana: 'full', kuhinja: 'partial' })} />,
    );
    expect(container.querySelector('[data-place="kavana"]')?.getAttribute('data-life')).toBe(
      'full',
    );
    expect(container.querySelector('[data-place="kuhinja"]')?.getAttribute('data-life')).toBe(
      'partial',
    );
    expect(container.querySelector('[data-place="ulica"]')?.getAttribute('data-life')).toBe(
      'dormant',
    );
  });

  it('keeps ambient layers present', () => {
    const { container } = render(<GradTownArt lifeByPlace={life()} />);
    expect(container.querySelector('#km-waves')).toBeTruthy();
    expect(container.querySelector('#km-boat-1')).toBeTruthy();
  });
});
