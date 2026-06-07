// src/tests/CheckpointInviteModal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CheckpointInviteModal from '../components/exam/CheckpointInviteModal.js';

describe('CheckpointInviteModal', () => {
  it('shows the level and fires onStart / onSnooze', () => {
    const onStart = vi.fn();
    const onSnooze = vi.fn();
    render(<CheckpointInviteModal level="B1" onStart={onStart} onSnooze={onSnooze} />);
    expect(screen.getByTestId('checkpoint-invite').textContent).toContain('B1');
    fireEvent.click(screen.getByTestId('checkpoint-start'));
    fireEvent.click(screen.getByTestId('checkpoint-snooze'));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onSnooze).toHaveBeenCalledTimes(1);
  });
});
