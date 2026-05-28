import { describe, it, expect } from 'vitest';
import { shouldEnableSentryReplay } from '../sentryHelpers';

describe('shouldEnableSentryReplay', () => {
  // UA samples below are real strings observed in production (DDG) or
  // representative samples (others). Update when DDG ships a new major.
  const DDG_MOBILE_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/18.6 Mobile/15E148 DuckDuckGo/26 Safari/605.1.15';

  const SAFARI_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

  const CHROME_ANDROID =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';

  const FIREFOX_DESKTOP =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:130.0) Gecko/20100101 Firefox/130.0';

  it('disables Replay on DuckDuckGo Mobile (iOS)', () => {
    expect(shouldEnableSentryReplay(DDG_MOBILE_IOS)).toBe(false);
  });

  it('enables Replay on stock iOS Safari', () => {
    expect(shouldEnableSentryReplay(SAFARI_IOS)).toBe(true);
  });

  it('enables Replay on Chrome Android', () => {
    expect(shouldEnableSentryReplay(CHROME_ANDROID)).toBe(true);
  });

  it('enables Replay on desktop Firefox', () => {
    expect(shouldEnableSentryReplay(FIREFOX_DESKTOP)).toBe(true);
  });

  it('enables Replay when UA is empty (SSR safety — should not crash)', () => {
    expect(shouldEnableSentryReplay('')).toBe(true);
  });

  it('reads navigator.userAgent when no argument passed', () => {
    // In vitest jsdom, navigator.userAgent is a non-DDG string by default.
    // The function should fall back to it and return true.
    expect(shouldEnableSentryReplay()).toBe(true);
  });
});
