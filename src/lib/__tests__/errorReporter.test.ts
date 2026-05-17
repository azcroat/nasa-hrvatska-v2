/**
 * Tests for src/lib/errorReporter.ts
 *
 * `reportError(error, context?)` — existing entrypoint (window.onerror,
 *   onunhandledrejection, ScreenErrorBoundary). Backward-compat preserved.
 * `reportBoundaryError(error, info, scope, retries?)` — SP3b: shared
 *   entrypoint for both ErrorBoundary and ScreenErrorBoundary, enriches
 *   the prod sendBeacon payload with boundary-specific context.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ErrorInfo } from 'react';
import { reportError, reportBoundaryError } from '../errorReporter';

const info: ErrorInfo = { componentStack: '\n    at TestComponent\n    at App\n' };

describe('reportError (existing entrypoint)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('still callable with (error, context) signature', () => {
    expect(() => reportError(new Error('boom'), 'window.onerror')).not.toThrow();
  });

  it('callable with (error) only — context omitted', () => {
    expect(() => reportError(new Error('boom'))).not.toThrow();
  });

  it('does not throw on non-Error inputs', () => {
    expect(() => reportError('a plain string')).not.toThrow();
    expect(() => reportError({ weird: 'shape' })).not.toThrow();
    expect(() => reportError(null)).not.toThrow();
  });
});

describe('reportBoundaryError (SP3b)', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs to console with [boundary] tag and scope', () => {
    reportBoundaryError(new Error('boom'), info, 'root');
    expect(consoleSpy).toHaveBeenCalled();
    const firstCall = consoleSpy.mock.calls[0];
    expect(firstCall?.[0]).toBe('[boundary]');
    expect(firstCall?.[1]).toBe('root');
  });

  it('includes scope tag for per-screen boundaries', () => {
    reportBoundaryError(new Error('boom'), info, 'HomeTab', 1);
    const firstCall = consoleSpy.mock.calls[0];
    expect(firstCall?.[1]).toBe('HomeTab');
  });

  it('passes componentStack to console.error', () => {
    reportBoundaryError(new Error('boom'), info, 'root');
    const firstCall = consoleSpy.mock.calls[0];
    expect(firstCall?.[3]).toBe(info.componentStack);
  });

  it('does not throw if componentStack is null (synthetic ErrorInfo)', () => {
    const emptyInfo = { componentStack: null } as unknown as ErrorInfo;
    expect(() => reportBoundaryError(new Error('boom'), emptyInfo, 'root')).not.toThrow();
  });

  it('does not throw if window is undefined (SSR safety)', () => {
    const origWindow = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = undefined;
    try {
      expect(() => reportBoundaryError(new Error('boom'), info, 'root')).not.toThrow();
    } finally {
      (globalThis as { window?: unknown }).window = origWindow;
    }
  });

  it('accepts retries arg without throwing', () => {
    expect(() => reportBoundaryError(new Error('boom'), info, 'HomeTab', 3)).not.toThrow();
  });
});
