import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildExercises } from '../practice/exerciseCatalog';
import PlaceScreen from './PlaceScreen';
import { PLACES } from './places';

const noop = () => {};
const goNoop = () => () => {};
const exercises = buildExercises({
  go: goNoop,
  setScr: noop,
  sCurEx: noop,
  startPitchAccent: noop,
  startShadowing: noop,
  startReview: noop,
  startAspectDrill: noop,
});
function ctx(userCefr = 'B2') {
  return {
    exercises,
    extras: { quiz: noop, flash: noop, match: noop, listen: noop, speaking: noop, scr: () => noop },
    userCefr,
    recs: { dueReviews: 0, weakCount: 0, isNewUser: false, userGoal: null },
    queue: [],
  };
}

describe('PlaceScreen', () => {
  it('renders the host greeting, back button, and exercises (café)', () => {
    render(<PlaceScreen placeId="kavana" ctx={ctx('A1')} onBack={vi.fn()} />);
    expect(screen.getByText('← Grad')).toBeInTheDocument();
    expect(screen.getByText(/Dobrodošao natrag/)).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
  });

  it('shows locked exercises as teasers (still in the DOM)', () => {
    render(<PlaceScreen placeId="kavana" ctx={ctx('A1')} onBack={vi.fn()} />);
    // 'Restaurant' is A2 -> locked at A1, rendered with a lock pill.
    expect(screen.getAllByText(/🔒/).length).toBeGreaterThan(0);
  });

  it('renders subgroup headers for a heavy place (soba)', () => {
    render(<PlaceScreen placeId="soba" ctx={ctx('A1')} onBack={vi.fn()} />);
    expect(screen.getByText(/Padeži/)).toBeInTheDocument();
    expect(screen.getByText(/Glagoli/)).toBeInTheDocument();
    expect(screen.getByText(/Rečenice/)).toBeInTheDocument();
    expect(screen.getByText(/Izgovor/)).toBeInTheDocument();
  });

  it('renders no subgroup headers for a flat place (kavana)', () => {
    render(<PlaceScreen placeId="kavana" ctx={ctx('B2')} onBack={vi.fn()} />);
    expect(screen.queryByText(/Padeži/)).toBeNull();
  });
});

describe('PlaceScreen — every place has a bespoke hero scene', () => {
  for (const place of PLACES) {
    it(`renders an <img> hero (not the gradient fallback) for ${place.id}`, () => {
      render(<PlaceScreen placeId={place.id} ctx={ctx('B2')} onBack={vi.fn()} />);
      const hero = screen.getByAltText(place.nameEn) as HTMLImageElement;
      expect(hero.tagName).toBe('IMG');
      expect(hero.getAttribute('src')).toContain(`images/grad-${place.id}.svg`);
    });

    it(`${place.id}: host portrait ${place.host ? 'present' : 'absent'} in hero`, () => {
      render(<PlaceScreen placeId={place.id} ctx={ctx('B2')} onBack={vi.fn()} />);
      if (place.host) {
        expect(screen.getByTestId(`portrait-${place.host}`)).toBeInTheDocument();
      } else {
        // trg has no host → no portrait overlay anywhere in the screen
        expect(document.querySelector('[data-testid^="portrait-"]')).toBeNull();
      }
    });
  }
});
