// src/tests/CheckpointResultScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckpointResultScreen from '../components/exam/CheckpointResultScreen.js';
import type { CheckpointOutcome } from '../lib/checkpointPolicy.js';

function out(
  kind: CheckpointOutcome['kind'],
  extra: Partial<CheckpointOutcome> = {},
): CheckpointOutcome {
  return { kind, overall: 80, failedSkills: [], focusSkills: [], demotion: null, ...extra };
}

describe('CheckpointResultScreen', () => {
  it('clean pass shows confirmation and fires onContinue', () => {
    const onContinue = vi.fn();
    render(<CheckpointResultScreen level="B1" outcome={out('pass')} onContinue={onContinue} />);
    expect(screen.getByTestId('result-pass')).toBeTruthy();
    // result-focus must NOT appear for a clean pass
    expect(screen.queryByTestId('result-focus')).toBeNull();
    // continue button calls the handler
    fireEvent.click(screen.getByText(/Keep going/));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('pass_focus renders result-pass AND result-focus with skill label', () => {
    const onContinue = vi.fn();
    render(
      <CheckpointResultScreen
        level="B1"
        outcome={out('pass_focus', { focusSkills: ['speaking'] })}
        onContinue={onContinue}
      />,
    );
    expect(screen.getByTestId('result-pass')).toBeTruthy();
    const focusNode = screen.getByTestId('result-focus');
    expect(focusNode).toBeTruthy();
    expect(focusNode.textContent).toContain('Speaking');
  });

  it('demote shows the level drop and reassurance', () => {
    const onContinue = vi.fn();
    render(
      <CheckpointResultScreen
        level="B1"
        outcome={out('demote', {
          failedSkills: ['vocab'],
          focusSkills: ['vocab'],
          demotion: { from: 'B1', to: 'A2' },
        })}
        onContinue={onContinue}
      />,
    );
    const node = screen.getByTestId('result-demote');
    expect(node.textContent).toContain('A2');
    expect(node.textContent!.toLowerCase()).toContain('streak');
  });

  it('grace offers an immediate retry', () => {
    const onRetry = vi.fn();
    const onContinue = vi.fn();
    render(
      <CheckpointResultScreen
        level="B1"
        outcome={out('grace', { failedSkills: ['speaking'] })}
        onContinue={onContinue}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByTestId('result-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
