// src/tests/storyOfTheDayCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

vi.mock('../data/gradedStories.js', () => ({
  GRADED_STORIES: [
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
      intro: '',
      paragraphs: [],
      vocabulary: [],
      quiz: [],
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
      intro: '',
      paragraphs: [],
      vocabulary: [],
      quiz: [],
    },
  ],
}));

describe('StoryOfTheDayCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the recommended story title, level badge, and rationale', () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    expect(screen.getByText(/Sveti Marko/)).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    expect(screen.getByText(/Practice accusative/i)).toBeInTheDocument();
  });

  it('CTA button click calls launchStory with the recommended story ID', () => {
    const onLaunch = vi.fn();
    render(<StoryOfTheDayCard launchStory={onLaunch} />);
    fireEvent.click(screen.getByTestId('story-of-the-day-cta'));
    expect(onLaunch).toHaveBeenCalledWith('b1_acc');
  });

  it('renders the card root with data-testid="story-of-the-day-card"', () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
    expect(screen.getByTestId('story-of-the-day-card')).toBeInTheDocument();
  });

  it('level badge uses the story levelBg and levelColor values', () => {
    render(<StoryOfTheDayCard launchStory={() => {}} />);
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
    expect(screen.queryByText(/Sveti Marko/)).not.toBeInTheDocument();
    expect(screen.getByText(/Moj radni dan/)).toBeInTheDocument();
  });
});
