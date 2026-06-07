// src/tests/CheckpointResultScreen.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckpointResultScreen from '../components/exam/CheckpointResultScreen.js';
import type { CheckpointOutcome } from '../lib/checkpointPolicy.js';

const cont = () => vi.fn();

function out(
  kind: CheckpointOutcome['kind'],
  extra: Partial<CheckpointOutcome> = {},
): CheckpointOutcome {
  return { kind, overall: 80, failedSkills: [], focusSkills: [], demotion: null, ...extra };
}

describe('CheckpointResultScreen', () => {
  it('clean pass shows confirmation', () => {
    render(<CheckpointResultScreen level="B1" outcome={out('pass')} onContinue={cont()} />);
    expect(screen.getByTestId('result-pass')).toBeTruthy();
  });

  it('demote shows the level drop and reassurance', () => {
    render(
      <CheckpointResultScreen
        level="B1"
        outcome={out('demote', {
          failedSkills: ['vocab'],
          focusSkills: ['vocab'],
          demotion: { from: 'B1', to: 'A2' },
        })}
        onContinue={cont()}
      />,
    );
    const node = screen.getByTestId('result-demote');
    expect(node.textContent).toContain('A2');
    expect(node.textContent!.toLowerCase()).toContain('streak');
  });

  it('grace offers an immediate retry', () => {
    const onRetry = vi.fn();
    render(
      <CheckpointResultScreen
        level="B1"
        outcome={out('grace', { failedSkills: ['speaking'] })}
        onContinue={cont()}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByTestId('result-retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
