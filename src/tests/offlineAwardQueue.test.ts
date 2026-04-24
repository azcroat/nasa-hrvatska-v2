import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase modules
vi.mock('../lib/firebase.js', () => ({
  getDb: vi.fn(() => ({ _isMocked: true })),
}));
vi.mock('../lib/userKey.js', () => ({
  toDocId: vi.fn((uid: string) => uid.replace(/[.#$/[\]]/g, '_')),
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ _isMockedDoc: true })),
  setDoc: vi.fn(() => Promise.resolve()),
}));

import { enqueue, flush, clearQueue } from '../lib/offlineAwardQueue.js';
import { setDoc } from 'firebase/firestore';

const QUEUE_KEY = 'nh_offline_award_queue';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('enqueue', () => {
  it('adds an entry to localStorage queue', () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ activityType: 'grammar', claimedXp: 25 });
  });

  it('appends multiple entries', () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    enqueue({ activityType: 'lesson', claimedXp: 50, timestamp: 2000 });
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    expect(stored).toHaveLength(2);
  });
});

describe('flush', () => {
  it('does nothing when queue is empty', async () => {
    await flush('uid123');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('clears the queue after flush', async () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    await flush('uid123');
    const stored = localStorage.getItem(QUEUE_KEY);
    expect(stored).toBeNull();
  });

  it('does NOT write to Firestore when all entries are within cap', async () => {
    // grammar cap = 80; 25 is well under 80 × 1.10 = 88
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('writes suspicious entries to Firestore xpAudit subcollection', async () => {
    // grammar cap = 80; 200 exceeds 80 × 1.10 = 88
    enqueue({ activityType: 'grammar', claimedXp: 200, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).toHaveBeenCalledOnce();
    const callArgs = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1]).toMatchObject({
      uid: 'uid123',
      suspicious: expect.arrayContaining([
        expect.objectContaining({ activityType: 'grammar', claimedXp: 200 }),
      ]),
    });
  });

  it('uses 10% tolerance — claimedXp at exactly cap*1.10 is NOT suspicious', async () => {
    // grammar cap = 80; 80 × 1.10 = 88 — not suspicious (must EXCEED to flag)
    enqueue({ activityType: 'grammar', claimedXp: 88, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('flags only entries that exceed cap × 1.10', async () => {
    // grammar cap = 80; 89 > 88 = suspicious
    enqueue({ activityType: 'grammar', claimedXp: 89, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).toHaveBeenCalledOnce();
  });

  it('uses default cap for unknown activityType', async () => {
    // default cap = 210; 300 > 231 = suspicious
    enqueue({ activityType: 'unknown_type', claimedXp: 300, timestamp: 1000 });
    await flush('uid123');
    expect(setDoc).toHaveBeenCalledOnce();
  });
});

describe('clearQueue', () => {
  it('removes the queue from localStorage', () => {
    enqueue({ activityType: 'grammar', claimedXp: 25, timestamp: 1000 });
    clearQueue();
    expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
  });
});
