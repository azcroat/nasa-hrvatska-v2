/**
 * hooksExtra.test.ts — coverage for hooks with 0% or very low coverage:
 *   useConversationSession, useWriteMode, usePwaInstall, usePlacement,
 *   useSwipeBack, useLocalStorage, useAndroidBackButton, useAndroidMicPermission
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock platform so isAndroid() returns false (avoids @capacitor/app import)
vi.mock('../lib/platform.js', () => ({
  isNative: () => false,
  isAndroid: () => false,
  isIos: () => false,
  isSpeechRecognitionSupported: () => false,
  openUrl: vi.fn(),
  API_BASE: '',
  NATIVE_API_ENDPOINTS: [''],
}));

// Mock data module for usePlacement's lazy import
vi.mock('../data', () => ({
  LEARN_PATH: [
    {
      items: [
        { topic: 'greetings' },
        { topic: 'numbers' },
        { topic: 'colors' },
        { topic: 'family' },
        { topic: 'food' },
        { topic: 'time' },
        { topic: 'travel' },
        { topic: 'weather' },
        { topic: 'house' },
        { topic: 'body' },
        { topic: 'work' },
        { topic: 'nature' },
        { topic: 'sports' },
        { topic: 'shopping' },
        { topic: 'city' },
        { topic: 'health' },
        { topic: 'culture' },
        { topic: 'emotions' },
        { topic: 'animals' },
        { topic: 'transport' },
      ],
    },
  ],
  buildSearchIndex: () => [],
}));

import { useConversationSession } from '../hooks/useConversationSession';
import { useWriteMode } from '../hooks/useWriteMode';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { usePlacement } from '../hooks/usePlacement';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useLocalStorage, safeGetItem, safeSetItem } from '../hooks/useLocalStorage';
import { useAndroidBackButton } from '../hooks/useAndroidBackButton';
import { useAndroidMicPermission } from '../hooks/useAndroidMicPermission';

function clearLS() {
  localStorage.clear();
}

// ── useConversationSession ────────────────────────────────────────────────────

describe('useConversationSession', () => {
  it('initialises phase as setup', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.phase).toBe('setup');
  });

  it('setPhase changes phase', () => {
    const { result } = renderHook(() => useConversationSession('A2'));
    act(() => {
      result.current.setPhase('chat');
    });
    expect(result.current.phase).toBe('chat');
  });

  it('initialises level from argument', () => {
    const { result } = renderHook(() => useConversationSession('C1'));
    expect(result.current.level).toBe('C1');
  });

  it('messages initialises as empty array', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.messages).toEqual([]);
  });

  it('setMessages adds a message', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    act(() => {
      result.current.setMessages([{ role: 'user', content: 'Zdravo!' }]);
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Zdravo!');
  });

  it('loading initialises as false', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.loading).toBe(false);
  });

  it('setLoading changes loading state', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    act(() => {
      result.current.setLoading(true);
    });
    expect(result.current.loading).toBe(true);
  });

  it('scenario initialises as null', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.scenario).toBeNull();
  });

  it('setScenario updates scenario', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    act(() => {
      result.current.setScenario({ id: 'cafe' });
    });
    expect(result.current.scenario).toEqual({ id: 'cafe' });
  });

  it('evaluation initialises as null', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.evaluation).toBeNull();
  });

  it('muted initialises as false', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.muted).toBe(false);
  });

  it('savedWords initialises as empty Set', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.savedWords.size).toBe(0);
  });

  it('turnCount initialises as 0', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.turnCount).toBe(0);
  });

  it('isSpeaking initialises as false', () => {
    const { result } = renderHook(() => useConversationSession('B1'));
    expect(result.current.isSpeaking).toBe(false);
  });
});

// ── useWriteMode ──────────────────────────────────────────────────────────────

describe('useWriteMode', () => {
  it('writePhase initialises as setup', () => {
    const { result } = renderHook(() => useWriteMode());
    expect(result.current.writePhase).toBe('setup');
  });

  it('uses default level B1', () => {
    const { result } = renderHook(() => useWriteMode());
    expect(result.current.writeLevel).toBe('B1');
  });

  it('accepts custom initial level', () => {
    const { result } = renderHook(() => useWriteMode('A2'));
    expect(result.current.writeLevel).toBe('A2');
  });

  it('writeText initialises as empty string', () => {
    const { result } = renderHook(() => useWriteMode());
    expect(result.current.writeText).toBe('');
  });

  it('setWriteText updates text', () => {
    const { result } = renderHook(() => useWriteMode());
    act(() => {
      result.current.setWriteText('Hello world');
    });
    expect(result.current.writeText).toBe('Hello world');
  });

  it('writeEval initialises as null', () => {
    const { result } = renderHook(() => useWriteMode());
    expect(result.current.writeEval).toBeNull();
  });

  it('setWritePhase changes phase to writing', () => {
    const { result } = renderHook(() => useWriteMode());
    act(() => {
      result.current.setWritePhase('writing');
    });
    expect(result.current.writePhase).toBe('writing');
  });

  it('writePrompt initialises as null', () => {
    const { result } = renderHook(() => useWriteMode());
    expect(result.current.writePrompt).toBeNull();
  });

  it('writeEvalError initialises as empty string', () => {
    const { result } = renderHook(() => useWriteMode());
    expect(result.current.writeEvalError).toBe('');
  });
});

// ── usePwaInstall ─────────────────────────────────────────────────────────────

describe('usePwaInstall', () => {
  it('showPwaInstall initialises as false', () => {
    const { result } = renderHook(() => usePwaInstall({ authScreen: 'login' }));
    expect(result.current.showPwaInstall).toBe(false);
  });

  it('showAndroidInstall initialises as false', () => {
    const { result } = renderHook(() => usePwaInstall({ authScreen: 'login' }));
    expect(result.current.showAndroidInstall).toBe(false);
  });

  it('deferredInstallPrompt initialises as null', () => {
    const { result } = renderHook(() => usePwaInstall({ authScreen: 'login' }));
    expect(result.current.deferredInstallPrompt).toBeNull();
  });

  it('setShowPwaInstall changes state', () => {
    const { result } = renderHook(() => usePwaInstall({ authScreen: 'login' }));
    act(() => {
      result.current.setShowPwaInstall(true);
    });
    expect(result.current.showPwaInstall).toBe(true);
  });
});

// ── usePlacement ──────────────────────────────────────────────────────────────

describe('usePlacement', () => {
  it('placementIdx initialises as 0', () => {
    const { result } = renderHook(() => usePlacement());
    expect(result.current.placementIdx).toBe(0);
  });

  it('placementScore initialises as 0', () => {
    const { result } = renderHook(() => usePlacement());
    expect(result.current.placementScore).toBe(0);
  });

  it('placementXp initialises as -1', () => {
    const { result } = renderHook(() => usePlacement());
    expect(result.current.placementXp).toBe(-1);
  });

  it('placementQ initialises as empty array', () => {
    const { result } = renderHook(() => usePlacement());
    expect(result.current.placementQ).toEqual([]);
  });

  it('setPlacementIdx updates index', () => {
    const { result } = renderHook(() => usePlacement());
    act(() => {
      result.current.setPlacementIdx(3);
    });
    expect(result.current.placementIdx).toBe(3);
  });

  it('getPlacementCt returns empty array for level 0', async () => {
    const { result } = renderHook(() => usePlacement());
    const ct = await result.current.getPlacementCt(0);
    expect(ct).toEqual([]);
  });

  it('getPlacementCt returns up to 5 topics for level 2', async () => {
    const { result } = renderHook(() => usePlacement());
    const ct = await result.current.getPlacementCt(2);
    expect(ct.length).toBeLessThanOrEqual(5);
  });

  it('getPlacementCt returns up to 10 topics for level 3', async () => {
    const { result } = renderHook(() => usePlacement());
    const ct = await result.current.getPlacementCt(3);
    expect(ct.length).toBeLessThanOrEqual(10);
  });
});

// ── useSwipeBack ──────────────────────────────────────────────────────────────

describe('useSwipeBack', () => {
  it('registers and deregisters touch listeners without error', () => {
    const goBack = vi.fn();
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useSwipeBack(goBack, true));
    expect(addSpy).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object));
    expect(addSpy).toHaveBeenCalledWith('touchend', expect.any(Function), expect.any(Object));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('does not register listeners when disabled', () => {
    const goBack = vi.fn();
    const addSpy = vi.spyOn(document, 'addEventListener');
    renderHook(() => useSwipeBack(goBack, false));
    // Should not register touchstart/touchend when disabled=false
    const touchCalls = addSpy.mock.calls.filter(
      ([event]) => event === 'touchstart' || event === 'touchend',
    );
    expect(touchCalls.length).toBe(0);
    addSpy.mockRestore();
  });

  it('calls goBack when swipe from left edge detected', () => {
    const goBack = vi.fn();
    renderHook(() => useSwipeBack(goBack, true));

    // Simulate touchstart near left edge
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 10, clientY: 200 } as Touch],
    });
    document.dispatchEvent(touchStart);

    // Simulate touchend with sufficient rightward movement
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 90, clientY: 205 } as Touch],
    });
    document.dispatchEvent(touchEnd);

    expect(goBack).toHaveBeenCalledOnce();
  });

  it('does not call goBack when swipe does not start from left edge', () => {
    const goBack = vi.fn();
    renderHook(() => useSwipeBack(goBack, true));

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 200 } as Touch],
    });
    document.dispatchEvent(touchStart);

    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 200, clientY: 205 } as Touch],
    });
    document.dispatchEvent(touchEnd);

    expect(goBack).not.toHaveBeenCalled();
  });

  it('does not call goBack when touchend fires without prior touchstart (startX null)', () => {
    const goBack = vi.fn();
    renderHook(() => useSwipeBack(goBack, true));
    // Dispatch touchend with no prior touchstart → startX.current is null → early return
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 90, clientY: 205 } as Touch],
    });
    document.dispatchEvent(touchEnd);
    expect(goBack).not.toHaveBeenCalled();
  });

  it('does not throw when changedTouches is empty on touchend', () => {
    const goBack = vi.fn();
    renderHook(() => useSwipeBack(goBack, true));
    // First set startX via touchstart
    document.dispatchEvent(
      new TouchEvent('touchstart', {
        touches: [{ clientX: 5, clientY: 200 } as Touch],
      }),
    );
    // Then touchend with empty changedTouches → !t branch
    expect(() => {
      document.dispatchEvent(new TouchEvent('touchend', { changedTouches: [] }));
    }).not.toThrow();
    expect(goBack).not.toHaveBeenCalled();
  });
});

// ── useLocalStorage ───────────────────────────────────────────────────────────

describe('useLocalStorage', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('returns defaultValue when key not set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('setValue updates state', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    act(() => {
      result.current[1](42);
    });
    expect(result.current[0]).toBe(42);
  });

  it('setValue persists to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    act(() => {
      result.current[1](99);
    });
    expect(JSON.parse(localStorage.getItem('test-key') || '0')).toBe(99);
  });

  it('setValue with function form uses previous value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 10));
    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    expect(result.current[0]).toBe(15);
  });

  it('setValue with null removes key from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('value'));
    const { result } = renderHook(() => useLocalStorage<string | null>('test-key', null));
    act(() => {
      result.current[1](null);
    });
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('handles corrupted localStorage value gracefully', () => {
    localStorage.setItem('test-key', 'NOT_JSON{{{{');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});

describe('safeGetItem', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('returns null when key not found and no defaultValue', () => {
    expect(safeGetItem('missing')).toBeNull();
  });

  it('returns defaultValue when key not found', () => {
    expect(safeGetItem('missing', 'default')).toBe('default');
  });

  it('returns parsed value when key exists', () => {
    localStorage.setItem('mykey', JSON.stringify({ a: 1 }));
    expect(safeGetItem('mykey')).toEqual({ a: 1 });
  });

  it('returns defaultValue when value is invalid JSON', () => {
    localStorage.setItem('mykey', 'INVALID{{{');
    expect(safeGetItem('mykey', 'fallback')).toBe('fallback');
  });
});

describe('safeSetItem', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('stores value and returns true', () => {
    const ok = safeSetItem('k', { x: 1 });
    expect(ok).toBe(true);
    expect(JSON.parse(localStorage.getItem('k') || '{}')).toEqual({ x: 1 });
  });

  it('removes key when value is null', () => {
    localStorage.setItem('k', JSON.stringify('old'));
    safeSetItem('k', null);
    expect(localStorage.getItem('k')).toBeNull();
  });

  it('removes key when value is undefined', () => {
    localStorage.setItem('k', JSON.stringify('old'));
    safeSetItem('k', undefined);
    expect(localStorage.getItem('k')).toBeNull();
  });
});

// ── useAndroidBackButton ──────────────────────────────────────────────────────

describe('useAndroidBackButton', () => {
  it('does not throw when isAndroid returns false', () => {
    const canGoBack = vi.fn(() => false);
    const goBack = vi.fn();
    expect(() => {
      const { unmount } = renderHook(() => useAndroidBackButton(canGoBack, goBack));
      unmount();
    }).not.toThrow();
  });

  it('updates refs on each render without re-registering listener', () => {
    const canGoBack = vi.fn(() => false);
    const goBack = vi.fn();
    const { rerender } = renderHook(({ cb, gb }) => useAndroidBackButton(cb, gb), {
      initialProps: { cb: canGoBack, gb: goBack },
    });
    const canGoBack2 = vi.fn(() => true);
    const goBack2 = vi.fn();
    // Should not throw on rerender
    expect(() => {
      rerender({ cb: canGoBack2, gb: goBack2 });
    }).not.toThrow();
  });
});

// ── useAndroidMicPermission ───────────────────────────────────────────────────

describe('useAndroidMicPermission', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('needsRationale is false when not Android', () => {
    // isAndroid() returns false (mocked above)
    const { result } = renderHook(() => useAndroidMicPermission());
    expect(result.current.needsRationale).toBe(false);
  });

  it('micGranted is null initially', () => {
    const { result } = renderHook(() => useAndroidMicPermission());
    expect(result.current.micGranted).toBeNull();
  });

  it('dismissRationale sets needsRationale to false and persists key', () => {
    const { result } = renderHook(() => useAndroidMicPermission());
    act(() => {
      result.current.dismissRationale();
    });
    expect(result.current.needsRationale).toBe(false);
    expect(localStorage.getItem('nh_mic_rationale_shown')).toBe('1');
  });
});
