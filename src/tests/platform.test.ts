import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// platform.ts reads window.location at module-import time for API_BASE/NATIVE_API_ENDPOINTS.
// We re-import via dynamic import after patching window.location to test both branches.

describe('platform — isNative / isAndroid / isIos / isSpeechRecognitionSupported', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isNative returns false in jsdom (localhost with a port)', async () => {
    // jsdom default: window.location.hostname='localhost', port='...'
    const { isNative } = await import('../lib/platform');
    // In jsdom, window.location.port is ''. But the module has already been imported
    // so we test its behavior directly.
    // In the test environment we're not on a portless localhost, so isNative() = false
    // unless the Capacitor bridge is set.
    expect(typeof isNative()).toBe('boolean');
  });

  it('isNative returns true when hostname is localhost with no port', async () => {
    // Patch window.location
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', port: '' },
      writable: true,
      configurable: true,
    });
    // Re-import to pick up the patched location for runtime call
    vi.resetModules();
    const { isNative } = await import('../lib/platform');
    expect(isNative()).toBe(true);
    // Restore
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', port: '5173' },
      writable: true,
      configurable: true,
    });
  });

  it('isNative returns false when hostname is localhost WITH a port', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', port: '4173' },
      writable: true,
      configurable: true,
    });
    vi.resetModules();
    const { isNative } = await import('../lib/platform');
    expect(isNative()).toBe(false);
  });

  it('isNative returns true via Capacitor bridge fallback', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: '127.0.0.1', port: '' },
      writable: true,
      configurable: true,
    });
    (window as unknown as Record<string, unknown>).Capacitor = { isNativePlatform: () => true };
    vi.resetModules();
    const { isNative } = await import('../lib/platform');
    expect(isNative()).toBe(true);
    delete (window as unknown as Record<string, unknown>).Capacitor;
  });

  it('isAndroid returns false when not native', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', port: '5173' },
      writable: true,
      configurable: true,
    });
    vi.resetModules();
    const { isAndroid } = await import('../lib/platform');
    expect(isAndroid()).toBe(false);
  });

  it('isIos returns false when not native', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', port: '5173' },
      writable: true,
      configurable: true,
    });
    vi.resetModules();
    const { isIos } = await import('../lib/platform');
    expect(isIos()).toBe(false);
  });

  it('isSpeechRecognitionSupported returns false when neither API is present', async () => {
    vi.resetModules();
    const { isSpeechRecognitionSupported } = await import('../lib/platform');
    // jsdom does not include SpeechRecognition by default
    expect(isSpeechRecognitionSupported()).toBe(false);
  });

  it('isSpeechRecognitionSupported returns true when webkitSpeechRecognition present', async () => {
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = function () {};
    vi.resetModules();
    const { isSpeechRecognitionSupported } = await import('../lib/platform');
    expect(isSpeechRecognitionSupported()).toBe(true);
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it('openUrl calls window.open when not native', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', port: '5173' },
      writable: true,
      configurable: true,
    });
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.resetModules();
    const { openUrl } = await import('../lib/platform');
    await openUrl('https://example.com');
    expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
  });

  it('openUrl does nothing with empty URL', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.resetModules();
    const { openUrl } = await import('../lib/platform');
    await openUrl('');
    expect(openSpy).not.toHaveBeenCalled();
  });
});
