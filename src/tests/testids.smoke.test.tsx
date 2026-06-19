// src/tests/testids.smoke.test.tsx
// SP10: one render per retrofitted screen, asserting each new testid is present.
// Guards against accidental testid removal during future refactors.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Firebase mocks (some screens pull these transitively) ────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
  initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
}));

// ── Common mocks ─────────────────────────────────────────────────────────────
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({
    stats: { xp: 1500, lc: 10, gc: 5, sp: 3, vs: [] as string[] },
    setStats: vi.fn(),
    writeDelta: vi.fn(),
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 'B1',
  }),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
vi.mock('../context/StatsContext.tsx', () => ({
  useStats: () => ({
    stats: { xp: 1500, lc: 10, gc: 5, sp: 3, vs: [] as string[] },
    setStats: vi.fn(),
    writeDelta: vi.fn(),
    dispatch: vi.fn(),
    award: vi.fn(),
    level: 'B1',
  }),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../lib/srs.js', () => ({
  addWordToSRS: vi.fn(),
  getSR: () => ({}),
  getPrioritizedReviewQueue: () => [['hvala', 'thank you', '']],
}));
vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));
vi.mock('../lib/adaptive.ts', () => ({
  recordTopicResult: vi.fn(),
  rateCategorySession: vi.fn(),
}));
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })),
}));
vi.mock('../lib/audio.js', () => ({
  unlockAudio: vi.fn(),
  speakSynth: vi.fn().mockResolvedValue(undefined),
  speakEN: vi.fn(),
  getFirebaseBearer: vi.fn(async () => null),
}));
vi.mock('../lib/audio.ts', () => ({
  unlockAudio: vi.fn(),
  speakSynth: vi.fn().mockResolvedValue(undefined),
  speakEN: vi.fn(),
  getFirebaseBearer: vi.fn(async () => null),
}));
vi.mock('../lib/soundSettings.js', () => ({
  getVoicePreference: vi.fn(() => 'hr-HR-GabrijelaNeural'),
  playCorrect: vi.fn(),
  playWrong: vi.fn(),
  playFanfare: vi.fn(),
}));
vi.mock('../lib/lives.js', () => ({
  getHearts: () => 5,
  loseHeart: () => 4,
  refillHearts: vi.fn(),
}));
vi.mock('../hooks/useHaptic', () => ({
  useHaptic: () => ({ correct: vi.fn(), wrong: vi.fn(), award: vi.fn(), tap: vi.fn() }),
}));
vi.mock('../hooks/useNotifications', () => ({ markPracticed: vi.fn() }));
vi.mock('../lib/learnerErrors.js', () => ({ logError: vi.fn() }));
vi.mock('../lib/aiPost', () => ({
  _aiPost: vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) })),
}));
vi.mock('../lib/random.js', () => ({ rnd: () => 0.5 }));
vi.mock('../lib/knightSpeak.js', () => ({ knightSpeak: vi.fn() }));
vi.mock('../lib/platform.js', () => ({ isNative: () => false }));
vi.mock('../lib/recentReads', () => ({
  recordStoryRead: vi.fn(),
  getRecentReads: vi.fn(() => []),
  getRecentReadsExtended: vi.fn(() => []),
}));
vi.mock('../lib/recentErrors', () => ({ appendRecentError: vi.fn() }));
vi.mock('../hooks/useRecorder', () => ({
  useRecorder: () => ({
    state: 'idle',
    countdown: 0,
    audioBlob: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    playback: vi.fn(),
    reset: vi.fn(),
    permissionDenied: false,
  }),
}));
vi.mock('../hooks/useAndroidMicPermission', () => ({
  useAndroidMicPermission: () => ({ needsRationale: false, dismissRationale: vi.fn() }),
}));
vi.mock('../hooks/useAdaptiveSession', () => ({
  useAdaptiveSession: () => ({
    onCorrect: vi.fn(),
    onWrong: vi.fn(),
    sessionSummary: () => ({}),
    reset: vi.fn(),
  }),
}));
vi.mock('../components/shared/PronunciationScorer', () => ({ default: () => null }));

// SP11d: ShadowingScreen + AspectDrillScreen + others now consume useContent().
// Mock the hook to return loaded state synchronously (no useSyncExternalStore
// loading flicker) so the testid assertions don't race.
vi.mock('../hooks/useContent', () => ({
  useContent: () => ({
    content: {
      V: {},
      COUNTRIES: [],
      PROFESSIONS: [],
      WEATHER: {},
      CLOTHES: {},
      BODYDESC: [],
      TECH_VOC: {},
      BUREAUCRATIC: {},
      PROVERBS: [],
      IDIOMS: [],
      BRZALICE: [],
      HISTORY: {},
      EVENTS: [],
      KINGS: {},
      REGIONS: {},
      DIALECTS: {},
      CROATIAN_CITIES: [],
      FOODORDER: {},
      TRANSPORT: [],
      GROCERY: {},
      RECIPES: [],
      PRACTICAL: {},
      SCENES: [],
      LEVEL_NARRATIVE: {},
      SHADOWING: [{ hr: 'Dobar dan', en: 'Good day', slow: 'Do-bar dan' }],
    },
    loading: false,
    error: null,
    reload: () => {},
  }),
}));

// SP11b: AspectDrillScreen consumes useGrammar() for ASPECT_PAIRS.
vi.mock('../hooks/useGrammar', () => ({
  useGrammar: () => ({
    grammar: {
      PADEZI: {},
      GRAM: {},
      CONJ: {},
      MODAL: {},
      TENSES: {},
      ASPECT: {},
      ASPECT_PAIRS: [{ imperfective: 'pisati', perfective: 'napisati', rule: 'test' }],
      CONDITIONAL: {},
      FORMAL_REGISTER: {},
      IMPERSONAL: {},
      PHONOLOGY: {},
      PITCH_ACCENT: [],
      PADEZI_FULL: {},
    },
    loading: false,
    error: null,
    reload: () => {},
  }),
}));

// contentClient mock — GradedInputScreen fetches catalog + body via this module
vi.mock('../lib/contentClient', () => ({
  getStoryCatalog: vi.fn(async () => [
    {
      id: 'gs_a1_1',
      level: 'A1',
      title: 'A1 Story 1',
      titleEn: 'A1 Story 1',
      focus: 'Present tense',
      icon: '📖',
      duration: 3,
      levelColor: '#166534',
      levelBg: '#dcfce7',
      etag: 'e1',
    },
  ]),
  getStory: vi.fn(async (id: string) => ({
    id,
    level: 'A1',
    icon: '📖',
    title: 'A1 Story 1',
    titleEn: 'A1 Story 1',
    duration: 3,
    focus: 'Present tense',
    intro: 'Intro text',
    vocabulary: [],
    paragraphs: [],
    quiz: [],
  })),
  // SP11b/c/d additions — keep mock surface in sync with the live contentClient.
  getGrammar: vi.fn(async () => ({
    PADEZI: {},
    GRAM: {},
    CONJ: {},
    MODAL: {},
    TENSES: {},
    ASPECT: {},
    ASPECT_PAIRS: [],
    CONDITIONAL: {},
    FORMAL_REGISTER: {},
    IMPERSONAL: {},
    PHONOLOGY: {},
    PITCH_ACCENT: [],
    PADEZI_FULL: {},
  })),
  getGrammarUnit: vi.fn(async (id: string) => ({ id, title: id, drills: [] })),
  getGrammarUnitCatalog: vi.fn(async () => []),
  getLessons: vi.fn(async () => []),
  getContent: vi.fn(async () => ({
    V: {},
    COUNTRIES: [],
    PROFESSIONS: [],
    WEATHER: {},
    CLOTHES: {},
    BODYDESC: [],
    TECH_VOC: {},
    BUREAUCRATIC: {},
    PROVERBS: [],
    IDIOMS: [],
    BRZALICE: [],
    HISTORY: {},
    EVENTS: [],
    KINGS: {},
    REGIONS: {},
    DIALECTS: {},
    CROATIAN_CITIES: [],
    FOODORDER: {},
    TRANSPORT: [],
    GROCERY: {},
    RECIPES: [],
    PRACTICAL: {},
    SCENES: [],
    LEVEL_NARRATIVE: {},
    SHADOWING: [],
  })),
}));

// SHADOWING data mock — keep H/Bar/Spk real but inject deterministic SHADOWING list
const MOCK_SHADOWING = vi.hoisted(() => [
  { hr: 'Dobar dan.', en: 'Good day.', tip: 'Focus on the melody of the greeting' },
  { hr: 'Hvala lijepa.', en: 'Thank you very much.', tip: 'Short phrase' },
]);
vi.mock('../data', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    speak: vi.fn(),
    speakSlow: vi.fn(),
    sh: (arr: unknown[]) => arr, // identity for deterministic Build tile order
    SHADOWING: MOCK_SHADOWING,
  };
});

describe('SP10 testid smoke tests — BLOCKER screens', () => {
  it('SpeakingScreen renders speaking-record testid', async () => {
    const { default: SpeakingScreen } = await import('../components/practice/SpeakingScreen');
    // SpeakingScreen requires sw + si props; otherwise returns null
    const sw = ['hvala', 'thank you', 'hvala'];
    const si = [sw];
    render(
      <SpeakingScreen
        sw={sw}
        si={si}
        sx={0}
        sr={null}
        ssc={0}
        sSr={() => {}}
        sSx={() => {}}
        sSw={() => {}}
        sSsc={() => {}}
        goBack={() => {}}
        award={() => {}}
        setSt={() => {}}
      />,
    );
    expect(screen.getByTestId('speaking-record')).toBeInTheDocument();
  });

  it('ShadowingScreen renders shadowing-record + shadowing-play testids', async () => {
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    render(<ShadowingScreen goBack={() => {}} award={() => {}} />);
    expect(screen.getByTestId('shadowing-record')).toBeInTheDocument();
    expect(screen.getByTestId('shadowing-play')).toBeInTheDocument();
  });

  it('ProductionDrillScreen renders production-drill-input + production-drill-submit testids', async () => {
    const { default: ProductionDrillScreen } =
      await import('../components/practice/ProductionDrillScreen');
    render(<ProductionDrillScreen goBack={() => {}} award={() => {}} />);
    expect(screen.getByTestId('production-drill-input')).toBeInTheDocument();
    expect(screen.getByTestId('production-drill-submit')).toBeInTheDocument();
  });

  it('GradedInputScreen list view renders graded-story-card-gs_a1_1 testid', async () => {
    const { default: GradedInputScreen } = await import('../components/learn/GradedInputScreen');
    render(<GradedInputScreen goBack={() => {}} />);
    expect(await screen.findByTestId('graded-story-card-gs_a1_1')).toBeInTheDocument();
  });

  it('TabBar renders the five place testids (Me moved to the header — no nav-profile)', async () => {
    const { default: TabBar } = await import('../components/shared/TabBar');
    render(<TabBar tab="home" setTab={() => {}} />);
    expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    expect(screen.getByTestId('nav-learn')).toBeInTheDocument();
    expect(screen.getByTestId('nav-practice')).toBeInTheDocument();
    expect(screen.getByTestId('nav-ai')).toBeInTheDocument();
    expect(screen.getByTestId('nav-croatia')).toBeInTheDocument();
    // 'Ja'/profile moved off the bottom bar to the AppHeader avatar (Phase 4).
    expect(screen.queryByTestId('nav-profile')).toBeNull();
  });
});

describe('SP10 testid smoke tests — PRIORITY screens', () => {
  it('ClozeEngine renders cloze-input + cloze-submit testids (in typing mode)', async () => {
    const { default: ClozeEngine } = await import('../components/practice/ClozeEngine');
    render(<ClozeEngine goBack={() => {}} award={() => {}} />);
    // Default is multiple-choice; toggle into typing mode to surface input + submit testids.
    const toggle = screen.getByText(/Multiple Choice/i);
    fireEvent.click(toggle);
    expect(screen.getByTestId('cloze-input')).toBeInTheDocument();
    expect(screen.getByTestId('cloze-submit')).toBeInTheDocument();
  });

  it('McGame renders mc-option-0 through mc-option-3 testids', async () => {
    const { default: McGame } = await import('../components/practice/McGame');
    const questions = [
      {
        hr: 'hvala',
        correct: 'thank you',
        opts: ['thank you', 'goodbye', 'hello', 'please'],
        _qIdx: 0,
        _isRetry: false,
      },
    ];
    render(
      <McGame questions={questions} onComplete={() => {}} goBack={() => {}} award={() => {}} />,
    );
    expect(screen.getByTestId('mc-option-0')).toBeInTheDocument();
    expect(screen.getByTestId('mc-option-1')).toBeInTheDocument();
    expect(screen.getByTestId('mc-option-2')).toBeInTheDocument();
    expect(screen.getByTestId('mc-option-3')).toBeInTheDocument();
  });

  it('DictationScreen renders dictation-input + dictation-submit testids', async () => {
    const { default: DictationScreen } = await import('../components/practice/DictationScreen');
    render(<DictationScreen goBack={() => {}} award={() => {}} />);
    expect(screen.getByTestId('dictation-input')).toBeInTheDocument();
    expect(screen.getByTestId('dictation-submit')).toBeInTheDocument();
  });

  it('ReviewScreen renders review-flip testid', async () => {
    const { default: ReviewScreen } = await import('../components/practice/ReviewScreen');
    render(<ReviewScreen goBack={() => {}} award={() => {}} />);
    expect(screen.getByTestId('review-flip')).toBeInTheDocument();
  });

  it('AspectDrillScreen renders aspect-option-0 testid', async () => {
    const { default: AspectDrillScreen } = await import('../components/practice/AspectDrillScreen');
    render(<AspectDrillScreen goBack={() => {}} award={() => {}} />);
    expect(screen.getByTestId('aspect-option-0')).toBeInTheDocument();
  });
});
