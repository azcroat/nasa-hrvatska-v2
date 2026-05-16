// src/tests/storyOfTheDayCard.test.tsx
// SP11: card now fetches catalog via contentClient instead of importing
// GRADED_STORIES directly. Tests updated to mock the async data source.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { StoryOfTheDayCard } from '../components/home/StoryOfTheDayCard';

// Mock the deps so the card has deterministic inputs in tests
vi.mock('../lib/userContext', () => ({
  buildUserContext: vi.fn(() => ({
    version: 1,
    generatedAt: Date.now(),
    level: { cefr: 'B1', xp: 1500, streak: 6 },
    weakTopics: [{ topic: 'accusative', accuracy: 0.42, attempts: 19 }],
    recentErrors: [],
    vocab: { learned: 540, dueToday: 28, hardest: [] },
  })),
}));

vi.mock('../lib/recentReads', () => ({
  getRecentReads: vi.fn(() => []),
}));

vi.mock('../lib/contentClient', () => ({
  getStoryCatalog: vi.fn(async () => [
    {
      id: 'b1_acc',
      level: 'B1',
      title: 'Sveti Marko',
      titleEn: 'Saint Mark',
      focus: 'Past tense • Accusative + Genitive',
      icon: '⛪',
      duration: 6,
      levelBg: '#dbeafe',
      levelColor: '#1e40af',
      etag: 'e1',
    },
    {
      id: 'b1_present',
      level: 'B1',
      title: 'Moj radni dan',
      titleEn: 'My Workday',
      focus: 'Present tense',
      icon: '🏢',
      duration: 5,
      levelBg: '#dbeafe',
      levelColor: '#1e40af',
      etag: 'e2',
    },
  ]),
}));

describe('StoryOfTheDayCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the recommended story title, level badge, and rationale', async () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Sveti Marko/)).toBeInTheDocument();
    });
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText(/Practice accusative/i)).toBeInTheDocument();
  });

  it('CTA button click calls launchStory with the recommended story ID', async () => {
    const onLaunch = vi.fn();
    render(<StoryOfTheDayCard launchStory={onLaunch} />);
    await waitFor(() => {
      expect(screen.getByTestId('story-of-the-day-cta')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('story-of-the-day-cta'));
    expect(onLaunch).toHaveBeenCalledWith('b1_acc');
  });

  it('renders the card root with data-testid="story-of-the-day-card"', async () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId('story-of-the-day-card')).toBeInTheDocument();
    });
  });

  it('level badge uses the story levelBg and levelColor values', async () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('B1')).toBeInTheDocument();
    });
    const badge = screen.getByText('B1');
    const style = badge.getAttribute('style') || '';
    expect(style).toMatch(/rgb\(219,\s*234,\s*254\)|#dbeafe/i);
    expect(style).toMatch(/rgb\(30,\s*64,\s*175\)|#1e40af/i);
  });

  it('recently-read story is not recommended (recency filter wired correctly)', async () => {
    const recentReadsModule = (await import('../lib/recentReads')) as unknown as {
      getRecentReads: () => string[];
    };
    vi.mocked(recentReadsModule.getRecentReads).mockReturnValue(['b1_acc']);
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Moj radni dan/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Sveti Marko/)).not.toBeInTheDocument();
  });

  it('renders null when catalog fetch fails (e.g. offline / auth error)', async () => {
    const cc = (await import('../lib/contentClient')) as unknown as {
      getStoryCatalog: ReturnType<typeof vi.fn>;
    };
    cc.getStoryCatalog.mockRejectedValueOnce(new Error('offline'));
    const { container } = render(<StoryOfTheDayCard launchStory={() => {}} />);
    // After the rejection settles, ready=true but recommendation=null → null render
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
