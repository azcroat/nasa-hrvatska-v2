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
  ['kavana', 'trznica', 'soba', 'kuhinja', 'ulica', 'trg'].map((id) => [id, { due: 0, total: 5 }]),
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
