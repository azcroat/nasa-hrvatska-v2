import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GradMap from './GradMap';
import type { Recommendation } from './gradModel';

const rec: Recommendation = {
  exerciseId: 'arcade',
  placeId: 'kavana',
  host: 'ana',
  hr: 'Ana te čeka u kavani',
  en: '6 phrases waiting',
  count: 6,
  durationMin: 6,
  launch: vi.fn(),
};

const statsByPlace = Object.fromEntries(
  ['kavana', 'trznica', 'soba', 'kuhinja', 'ulica', 'trg'].map((id) => [
    id,
    { done: 0, total: 5, due: 0, lockedCount: 0 },
  ]),
);

describe('GradMap', () => {
  it('renders a marker for each place and the Today bar', () => {
    render(<GradMap rec={rec} onOpenPlace={vi.fn()} statsByPlace={statsByPlace} />);
    expect(screen.getByText('Anina kavana')).toBeInTheDocument();
    expect(screen.getByText('Trg')).toBeInTheDocument();
    expect(screen.getByText('Ana te čeka u kavani')).toBeInTheDocument();
  });

  it('opens a place when its marker is clicked', () => {
    const onOpen = vi.fn();
    render(<GradMap rec={rec} onOpenPlace={onOpen} statsByPlace={statsByPlace} />);
    fireEvent.click(screen.getByRole('button', { name: 'Markova tržnica' }));
    expect(onOpen).toHaveBeenCalledWith('trznica');
  });
});

describe('GradMap — living markers', () => {
  function statsWith(over: Record<string, object>) {
    return { ...statsByPlace, ...over };
  }

  it('shows a due badge only when due > 0', () => {
    render(
      <GradMap
        rec={rec}
        onOpenPlace={vi.fn()}
        statsByPlace={statsWith({ trznica: { done: 1, total: 5, due: 3, lockedCount: 0 } })}
      />,
    );
    expect(screen.getByTestId('due-badge-trznica')).toHaveTextContent('3');
    expect(screen.queryByTestId('due-badge-soba')).toBeNull();
  });

  it('renders a completion ring whose fill reflects done/available', () => {
    render(
      <GradMap
        rec={rec}
        onOpenPlace={vi.fn()}
        statsByPlace={statsWith({ soba: { done: 3, total: 4, due: 0, lockedCount: 0 } })}
      />,
    );
    const ring = screen.getByTestId('ring-soba');
    expect(ring.getAttribute('data-completion')).toBe('0.75');
  });

  it('marks a fully-locked place: dimmed + lock, no due badge, still clickable', () => {
    const onOpen = vi.fn();
    render(
      <GradMap
        rec={rec}
        onOpenPlace={onOpen}
        statsByPlace={statsWith({ ulica: { done: 0, total: 5, due: 2, lockedCount: 5 } })}
      />,
    );
    expect(screen.getByTestId('marker-locked-ulica')).toBeInTheDocument();
    expect(screen.queryByTestId('due-badge-ulica')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ivina ulica' }));
    expect(onOpen).toHaveBeenCalledWith('ulica');
  });
});

describe('GradMap — host at the recommended place', () => {
  it("renders the recommended place's own host portrait", () => {
    // rec.placeId = 'kavana' → its own host is 'ana'
    render(<GradMap rec={rec} onOpenPlace={vi.fn()} statsByPlace={statsByPlace} />);
    expect(screen.getByTestId('portrait-ana')).toBeInTheDocument();
  });

  it('renders no host portrait when the recommended place has no host (trg)', () => {
    const trgRec = { ...rec, placeId: 'trg' as const, host: null };
    render(<GradMap rec={trgRec} onOpenPlace={vi.fn()} statsByPlace={statsByPlace} />);
    expect(document.querySelector('[data-testid^="portrait-"]')).toBeNull();
  });
});
