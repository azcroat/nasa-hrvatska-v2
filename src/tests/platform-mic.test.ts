/**
 * platform-mic.test.ts — tests for getMicPermissionPlatform().
 *
 * The existing src/lib/platform.ts already has isNative / isAndroid / isIos
 * helpers tested implicitly across the codebase. This file isolates the new
 * mic-platform classifier for the SP4a MicPermissionDeniedExplainer.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { getMicPermissionPlatform } from '../lib/platform';

describe('getMicPermissionPlatform', () => {
  const originalLocation = window.location;
  const originalUA = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUA });
    vi.restoreAllMocks();
  });

  function setLocation(hostname: string, port: string) {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { hostname, port },
    });
  }

  function setUA(ua: string) {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: ua });
  }

  it('returns ios-safari on iPhone Safari with non-localhost host', () => {
    setLocation('nasahrvatska.com', '');
    setUA(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    );
    expect(getMicPermissionPlatform()).toBe('ios-safari');
  });

  it('returns ios-app on iPhone UA with native context (localhost no port)', () => {
    setLocation('localhost', '');
    setUA(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    );
    expect(getMicPermissionPlatform()).toBe('ios-app');
  });

  it('returns android-browser on Android Chrome UA, non-native', () => {
    setLocation('nasahrvatska.com', '');
    setUA(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
    );
    expect(getMicPermissionPlatform()).toBe('android-browser');
  });

  it('returns android-app on Android UA with native context', () => {
    setLocation('localhost', '');
    setUA(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
    );
    expect(getMicPermissionPlatform()).toBe('android-app');
  });

  it('returns desktop on Mac Chrome UA', () => {
    setLocation('nasahrvatska.com', '');
    setUA(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    );
    expect(getMicPermissionPlatform()).toBe('desktop');
  });

  it('returns desktop on Windows Chrome UA', () => {
    setLocation('nasahrvatska.com', '');
    setUA(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    );
    expect(getMicPermissionPlatform()).toBe('desktop');
  });
});
