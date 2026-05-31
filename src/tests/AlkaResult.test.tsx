import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AlkaResult from '../components/practice/alka/AlkaResult';

describe('AlkaResult', () => {
  it('shows U SRIDU! and the new-best line on a perfect 9', () => {
    render(
      <AlkaResult total={9} isNewBest previousBest={3} onPlayAgain={() => {}} onExit={() => {}} />,
    );
    expect(screen.getByText('U SRIDU!')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
    expect(screen.getByText('/ 9')).toBeTruthy();
    expect(screen.getByText(/New personal best/)).toBeTruthy();
  });

  it('hides U SRIDU! and shows the previous best when not a new best', () => {
    render(
      <AlkaResult
        total={5}
        isNewBest={false}
        previousBest={7}
        onPlayAgain={() => {}}
        onExit={() => {}}
      />,
    );
    expect(screen.queryByText('U SRIDU!')).toBeNull();
    expect(screen.getByText(/Your best: 7/)).toBeTruthy();
  });

  it('fires onPlayAgain and onExit from the action buttons', () => {
    const onPlayAgain = vi.fn();
    const onExit = vi.fn();
    render(
      <AlkaResult
        total={4}
        isNewBest={false}
        previousBest={4}
        onPlayAgain={onPlayAgain}
        onExit={onExit}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ride again' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
