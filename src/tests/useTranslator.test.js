import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranslator } from '../hooks/useTranslator.js';

const originalFetch = globalThis.fetch;

function mockFetch(responseData) {
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(responseData),
    })
  );
}

// Helper: set tIn then flush state before calling doTr
async function setInputAndTranslate(result, input) {
  await act(async () => { result.current.setTIn(input); });
  await act(async () => { await result.current.doTr(); });
}

describe('useTranslator — state and fetch logic', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  // ── initial state ─────────────────────────────────────────────────────────

  it('initialises with en-hr direction', () => {
    const { result } = renderHook(() => useTranslator());
    expect(result.current.tDir).toBe('en-hr');
  });

  it('initialises with empty input and output', () => {
    const { result } = renderHook(() => useTranslator());
    expect(result.current.tIn).toBe('');
    expect(result.current.tOut).toBe('');
  });

  it('initialises with loading=false', () => {
    const { result } = renderHook(() => useTranslator());
    expect(result.current.tL).toBe(false);
  });

  // ── doTr — no-op on empty input ───────────────────────────────────────────

  it('does not call fetch when input is empty', async () => {
    globalThis.fetch = vi.fn();
    const { result } = renderHook(() => useTranslator());
    await act(async () => { await result.current.doTr(); });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does not call fetch when input is only whitespace', async () => {
    globalThis.fetch = vi.fn();
    const { result } = renderHook(() => useTranslator());
    await act(async () => { result.current.setTIn('   '); });
    await act(async () => { await result.current.doTr(); });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  // ── doTr — successful translation ─────────────────────────────────────────

  it('sets translated output on successful response', async () => {
    mockFetch({ responseStatus: 200, responseData: { translatedText: 'kruh' } });
    const { result } = renderHook(() => useTranslator());
    await setInputAndTranslate(result, 'bread');
    expect(result.current.tOut).toBe('kruh');
    expect(result.current.tL).toBe(false);
  });

  it('calls fetch with encoded input text', async () => {
    mockFetch({ responseStatus: 200, responseData: { translatedText: 'lijepa' } });
    const { result } = renderHook(() => useTranslator());
    await setInputAndTranslate(result, 'beautiful');
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toContain('beautiful');
    expect(url).toContain('en|hr');
  });

  it('uses hr→en pair when direction is hr-en', async () => {
    mockFetch({ responseStatus: 200, responseData: { translatedText: 'bread' } });
    const { result } = renderHook(() => useTranslator());
    await act(async () => { result.current.setTDir('hr-en'); });
    await setInputAndTranslate(result, 'kruh');
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toContain('hr|en');
  });

  // ── doTr — rate limit ─────────────────────────────────────────────────────

  it('shows rate-limit message on 429 status', async () => {
    mockFetch({ responseStatus: 429, responseDetails: 'Daily limit reached' });
    const { result } = renderHook(() => useTranslator());
    await setInputAndTranslate(result, 'word');
    expect(result.current.tOut).toMatch(/limit/i);
    expect(result.current.tL).toBe(false);
  });

  it('shows rate-limit message when responseDetails contains "limit"', async () => {
    mockFetch({ responseStatus: 200, responseData: { translatedText: '' }, responseDetails: 'Limit exceeded for today' });
    const { result } = renderHook(() => useTranslator());
    await setInputAndTranslate(result, 'word');
    expect(result.current.tOut).toMatch(/limit/i);
  });

  // ── doTr — generic API error ──────────────────────────────────────────────

  it('shows unavailable message when API returns non-200 without limit error', async () => {
    mockFetch({ responseStatus: 500, responseDetails: 'Server error' });
    const { result } = renderHook(() => useTranslator());
    await setInputAndTranslate(result, 'word');
    expect(result.current.tOut).toMatch(/unavailable/i);
    expect(result.current.tL).toBe(false);
  });

  // ── doTr — network error ──────────────────────────────────────────────────

  it('shows network error message when fetch throws', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('network down')));
    const { result } = renderHook(() => useTranslator());
    await setInputAndTranslate(result, 'hello');
    expect(result.current.tOut).toMatch(/network/i);
    expect(result.current.tL).toBe(false);
  });

  // ── setter functions ──────────────────────────────────────────────────────

  it('setTDir updates direction', async () => {
    const { result } = renderHook(() => useTranslator());
    await act(() => { result.current.setTDir('hr-en'); });
    expect(result.current.tDir).toBe('hr-en');
  });

  it('setTIn updates input text', async () => {
    const { result } = renderHook(() => useTranslator());
    await act(() => { result.current.setTIn('hvala'); });
    expect(result.current.tIn).toBe('hvala');
  });

  it('setTOut updates output text', async () => {
    const { result } = renderHook(() => useTranslator());
    await act(() => { result.current.setTOut('thank you'); });
    expect(result.current.tOut).toBe('thank you');
  });
});
