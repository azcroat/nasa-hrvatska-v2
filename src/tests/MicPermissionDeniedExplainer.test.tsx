/**
 * MicPermissionDeniedExplainer.test.tsx — Pattern X behavioral
 *
 * Verifies the per-OS instruction text + Try Again / Use writing instead
 * callbacks. The component depends on getMicPermissionPlatform() — mocked
 * so each test case isolates a single platform.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MicPermissionDeniedExplainer from '../components/shared/MicPermissionDeniedExplainer';

const platformMock = vi.fn();
vi.mock('../lib/platform', () => ({
  getMicPermissionPlatform: () => platformMock(),
}));

describe('MicPermissionDeniedExplainer', () => {
  beforeEach(() => {
    platformMock.mockReset();
  });

  it('renders iOS Safari instructions when platform is ios-safari', () => {
    platformMock.mockReturnValue('ios-safari');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/Settings.*Safari.*Microphone/i)).toBeInTheDocument();
  });

  it('renders iOS app instructions when platform is ios-app', () => {
    platformMock.mockReturnValue('ios-app');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/Settings.*Na.a Hrvatska.*Microphone/i)).toBeInTheDocument();
  });

  it('renders Android Chrome instructions when platform is android-browser', () => {
    platformMock.mockReturnValue('android-browser');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/lock icon.*Permissions.*Microphone/i)).toBeInTheDocument();
  });

  it('renders Android app instructions when platform is android-app', () => {
    platformMock.mockReturnValue('android-app');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/Apps.*Na.a Hrvatska.*Permissions/i)).toBeInTheDocument();
  });

  it('renders desktop fallback when platform is desktop', () => {
    platformMock.mockReturnValue('desktop');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/lock.*re-enable Microphone/i)).toBeInTheDocument();
  });

  it('"Microphone access is blocked" header is always present', () => {
    platformMock.mockReturnValue('desktop');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByText(/Microphone access is blocked/i)).toBeInTheDocument();
  });

  it('"Try Again" button is rendered and calls onRetry', () => {
    platformMock.mockReturnValue('desktop');
    const onRetry = vi.fn();
    render(<MicPermissionDeniedExplainer onRetry={onRetry} />);
    fireEvent.click(screen.getByText(/Try Again/));
    expect(onRetry).toHaveBeenCalled();
  });

  it('"Use writing instead" is hidden when onUseWriting prop is undefined', () => {
    platformMock.mockReturnValue('desktop');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.queryByText(/Use writing instead/)).toBeNull();
  });

  it('"Use writing instead" is rendered and calls onUseWriting when prop provided', () => {
    platformMock.mockReturnValue('desktop');
    const onUseWriting = vi.fn();
    render(<MicPermissionDeniedExplainer onRetry={() => {}} onUseWriting={onUseWriting} />);
    fireEvent.click(screen.getByText(/Use writing instead/));
    expect(onUseWriting).toHaveBeenCalled();
  });

  it('role=alert is present for screen readers', () => {
    platformMock.mockReturnValue('desktop');
    render(<MicPermissionDeniedExplainer onRetry={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
