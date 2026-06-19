import React from 'react';
import { useGrammar } from '../../hooks/useGrammar';
import { useContent } from '../../hooks/useContent';

interface GramShape {
  beginner?: unknown[];
  intermediate?: unknown[];
  advanced?: unknown[];
}

function LoadingState() {
  return <div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>;
}
function ErrorState({ message }: { message: string }) {
  return <div style={{ padding: 24, textAlign: 'center', color: 'var(--info)' }}>{message}</div>;
}

// CEFR mapping for vocabulary categories — mirrors DuoLingo's level-aware content labels
const VOCAB_CEFR = {
  greetings: 'A1',
  numbers: 'A1',
  family: 'A1',
  colours: 'A1',
  colors: 'A1',
  body: 'A1',
  animals: 'A1',
  house: 'A1',
  food: 'A2',
  drink: 'A2',
  travel: 'A2',
  transport: 'A2',
  time: 'A2',
  nature: 'A2',
  weather: 'A2',
  shopping: 'A2',
  clothing: 'A2',
  clothes: 'A2',
  emotions: 'A2',
  feelings: 'A2',
  hobbies: 'A2',
  sports: 'A2',
  verbs: 'B1',
  phrases: 'B1',
  health: 'B1',
  work: 'B1',
  professions: 'B1',
  technology: 'B1',
  tech: 'B1',
  school: 'B1',
  education: 'B1',
  grammar: 'B1',
  politics: 'B2',
  business: 'B2',
  law: 'B2',
  science: 'B2',
};
const CEFR_STYLE = {
  A1: { color: 'var(--success)', bg: 'var(--success-bg)' },
  A2: { color: 'var(--info)', bg: 'var(--info-bg)' },
  B1: { color: 'var(--warning,#d97706)', bg: 'var(--warning-bg,rgba(217,119,6,.1))' },
  B2: { color: 'var(--lavender,#7c3aed)', bg: 'var(--bar-bg)' },
};
function getVocabCEFR(cat: string, wordCount: number) {
  const key = (cat || '').toLowerCase();
  if (VOCAB_CEFR[key as keyof typeof VOCAB_CEFR]) return VOCAB_CEFR[key as keyof typeof VOCAB_CEFR];
  if (wordCount < 15) return 'A1';
  if (wordCount < 25) return 'A2';
  return 'B1';
}

// ─── Shared tuple types for grammar/vocab map arrays ──────────────────────────
type GrammarTile = [string, string, string, () => void];
type GrammarTile5 = [string, string, string, string, () => void];
type RefTile = [string, string, string];
function tiles4(arr: GrammarTile[]): GrammarTile[] {
  return arr;
}
function tiles5(arr: GrammarTile5[]): GrammarTile5[] {
  return arr;
}
function tiles3(arr: RefTile[]): RefTile[] {
  return arr;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface LevelBadgeProps {
  label: string;
  color: string;
  bg: string;
}
function LevelBadge({ label, color, bg }: LevelBadgeProps) {
  return (
    <span
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 800,
        color,
        background: bg,
        borderRadius: 6,
        padding: '2px 7px',
        letterSpacing: '.05em',
        textTransform: 'uppercase',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

interface SectionProps {
  title: string;
  icon: string;
  count?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
function Section({ title, icon, count, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const sectionId = `section-content-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={sectionId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '13px 16px',
          borderRadius: 14,
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize: 'var(--text-xl)' }}>{icon}</span>
        <span
          style={{
            flex: 1,
            fontSize: 'var(--text-base)',
            fontWeight: 800,
            color: 'var(--heading)',
            textAlign: 'left',
          }}
        >
          {title}
        </span>
        {count != null && (
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
              fontWeight: 600,
              background: 'var(--bar-bg)',
              borderRadius: 8,
              padding: '2px 8px',
            }}
          >
            {count}
          </span>
        )}
        <span
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--subtext)',
            opacity: 0.5,
            marginLeft: 4,
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div id={sectionId} style={{ marginBottom: 16 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── BrowseContentModal ───────────────────────────────────────────────────────

interface BrowseContentModalProps {
  allCats: string[];
  icons: Record<string, string>;
  st?: { ct?: string[]; gc?: number } | null;
  setScr: (screen: string) => void;
  sCurEx: (ex: string) => void;
  sGl: (lesson: unknown) => void;
  sGp: (phase: string) => void;
  sGx: (idx: number) => void;
  sGs: (score: number) => void;
  sGa: (val: boolean) => void;
  sGsl: (idx: number) => void;
  launchVocab: (cat: string) => void;
  launchAnimLesson?: ((id: string) => void) | null;
  onClose: () => void;
}

export default function BrowseContentModal({
  allCats,
  icons,
  st,
  setScr,
  sCurEx,
  sGl,
  sGp,
  sGx,
  sGs,
  sGa,
  sGsl,
  launchVocab,
  launchAnimLesson,
  onClose,
}: BrowseContentModalProps) {
  const { grammar, loading, error } = useGrammar();
  const { content: coreContent, loading: coreLoading, error: coreError } = useContent();
  if (error || coreError) return <ErrorState message="Couldn't load content - please retry." />;
  if (loading || coreLoading || !grammar || !coreContent) return <LoadingState />;
  const V = coreContent.V as Record<string, string[][]>;
  const GRAM = grammar.GRAM as unknown as GramShape;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--app-bg)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid var(--bar-bg)',
          position: 'sticky',
          top: 0,
          background: 'var(--app-bg)',
          zIndex: 1,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontFamily: "'Playfair Display',serif" }}>
          📚 Browse All Content
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: 'var(--subtext)',
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: '0 16px 40px' }}>
        {/* Vocabulary */}
        <div id="learn-section-vocabulary" style={{ marginTop: 16 }}>
          <Section
            title="Vocabulary"
            icon="📚"
            count={`${allCats.length + 6} topics`}
            defaultOpen={true}
          >
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--subtext)',
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              {allCats.length} core categories · tap any to start
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 10,
                marginBottom: 16,
              }}
            >
              {allCats.map((t) => {
                const isCompleted = st && Array.isArray(st.ct) && st.ct.includes(t);
                return (
                  <button
                    key={t}
                    className="tc"
                    style={{ textAlign: 'center', padding: '14px 8px' }}
                    onClick={() => {
                      onClose();
                      launchVocab(t);
                    }}
                  >
                    <div style={{ fontSize: 'var(--text-2xl)' }}>{icons[t] || '📚'}</div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 700,
                        marginTop: 4,
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                      {isCompleted && (
                        <span style={{ color: 'var(--success)', fontWeight: 800, marginLeft: 6 }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}
                    >
                      {((V as Record<string, string[][]>)[t] ?? []).length} words
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--subtext)',
                        marginTop: 3,
                        opacity: 0.7,
                        lineHeight: 1.3,
                      }}
                    >
                      {((V as Record<string, string[][]>)[t] ?? [])
                        .slice(0, 2)
                        .map((w: string[]) => w[0] ?? '')
                        .join(' · ')}
                    </div>
                    {(() => {
                      const cefr = getVocabCEFR(
                        t,
                        ((V as Record<string, string[][]>)[t] ?? []).length,
                      );
                      const { color, bg } =
                        CEFR_STYLE[cefr as keyof typeof CEFR_STYLE] ?? CEFR_STYLE.A2;
                      return (
                        <span
                          style={{
                            fontSize: 'var(--text-xs)',
                            fontWeight: 800,
                            color,
                            background: bg,
                            borderRadius: 6,
                            padding: '2px 5px',
                            marginTop: 3,
                            letterSpacing: '.04em',
                          }}
                        >
                          {cefr}
                        </span>
                      );
                    })()}
                  </button>
                );
              })}
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--subtext)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 8,
              }}
            >
              Themes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {tiles3([
                ['🌍', 'Countries', 'countries'],
                ['💼', 'Professions', 'professions'],
                ['🌤️', 'Weather', 'weather'],
                ['👗', 'Clothing', 'clothes'],
                ['👤', 'Appearance', 'bodydesc'],
                ['🔤', 'Pronunciation', 'phonology'],
              ]).map(([icon, label, screen]) => (
                <button
                  key={screen}
                  className="tc"
                  style={{ textAlign: 'center', padding: '14px 8px' }}
                  onClick={() => {
                    onClose();
                    setScr(screen);
                  }}
                >
                  <div style={{ fontSize: 'var(--text-2xl)' }}>{icon}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginTop: 4 }}>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Grammar */}
        <div id="learn-section-grammar">
          <Section title="Grammar" icon="📝" count="14 lessons" defaultOpen={true}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <LevelBadge label="Foundation" color="var(--success)" bg="var(--success-bg)" />
              <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}
            >
              {tiles4([
                [
                  '📜',
                  'Grammar Intro',
                  'a1',
                  () => {
                    const _all = [
                      ...(GRAM.beginner || []),
                      ...(GRAM.intermediate || []),
                      ...(GRAM.advanced || []),
                    ];
                    const _gc = (st && st.gc) || 0;
                    sGl(_all.length > 0 ? _all[_gc % _all.length] : (GRAM.beginner || [])[0]);
                    sGp('learn');
                    sGx(0);
                    sGs(0);
                    sGa(false);
                    sGsl(-1);
                    setScr('grammar');
                    sCurEx('grammar');
                  },
                ],
                [
                  '🔄',
                  'Tenses & Gender',
                  'a1',
                  () => {
                    setScr('tenses');
                    sCurEx('tenses');
                  },
                ],
                [
                  '📝',
                  'Cases Intro',
                  'a2',
                  () => {
                    setScr('padezi');
                    sCurEx('padezi');
                  },
                ],
                [
                  '🎨',
                  'Colors & Gender',
                  'a2',
                  () => {
                    setScr('boje');
                    sCurEx('boje');
                  },
                ],
              ]).map(([icon, label, cefr, fn]) => (
                <button
                  key={label}
                  className="tc"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '13px 14px',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onClose();
                    fn();
                  }}
                >
                  <div style={{ fontSize: 'var(--text-xl)', flexShrink: 0 }}>{icon}</div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 800,
                      color: 'var(--heading)',
                      flex: 1,
                    }}
                  >
                    {label}
                  </div>
                  <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <LevelBadge label="Intermediate" color="var(--warning)" bg="var(--warning-bg)" />
              <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}
            >
              {tiles4([
                [
                  '📚',
                  'Padeži Master',
                  'b1',
                  () => {
                    setScr('padezifull');
                    sCurEx('padezifull');
                  },
                ],
                [
                  '↔️',
                  'Verb Aspect',
                  'b1',
                  () => {
                    setScr('aspect');
                  },
                ],
                [
                  '🔀',
                  'Conjugation',
                  'b1',
                  () => {
                    setScr('conjdrill');
                    sCurEx('conjdrill');
                  },
                ],
              ]).map(([icon, label, cefr, fn]) => (
                <button
                  key={label}
                  className="tc"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '13px 14px',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onClose();
                    fn();
                  }}
                >
                  <div style={{ fontSize: 'var(--text-xl)', flexShrink: 0 }}>{icon}</div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 800,
                      color: 'var(--heading)',
                      flex: 1,
                    }}
                  >
                    {label}
                  </div>
                  <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <LevelBadge label="Advanced" color="var(--lavender)" bg="var(--bar-bg)" />
              <div style={{ flex: 1, height: 1, background: 'var(--card-b)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {tiles4([
                [
                  '🔮',
                  'Modal Verbs',
                  'b1',
                  () => {
                    setScr('modal');
                  },
                ],
                [
                  '📝',
                  'Declension',
                  'b2',
                  () => {
                    setScr('declension');
                  },
                ],
                ['🔀', 'Conditional', 'b1', () => setScr('conditional')],
                ['🤝', 'Vi ili ti?', 'b1', () => setScr('formalregister')],
                ['🔁', 'Impersonal', 'b2', () => setScr('impersonal')],
                ['💻', 'Tech & Digital', 'b2', () => setScr('techvoc')],
                ['🏛️', 'Admin Life', 'b2', () => setScr('bureaucratic')],
              ]).map(([icon, label, cefr, fn]) => (
                <button
                  key={label}
                  className="tc"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '13px 14px',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    onClose();
                    fn();
                  }}
                >
                  <div style={{ fontSize: 'var(--text-xl)', flexShrink: 0 }}>{icon}</div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 800,
                      color: 'var(--heading)',
                      flex: 1,
                    }}
                  >
                    {label}
                  </div>
                  <span className={`cefr cefr-${cefr}`}>{cefr.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Reading */}
        <div id="learn-section-reading">
          <Section title="Reading" icon="📖" count="100+ passages" defaultOpen={true}>
            <button
              className="tc"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px',
              }}
              onClick={() => {
                onClose();
                setScr('readlist');
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success-b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-2xl)',
                  flexShrink: 0,
                }}
              >
                📖
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div
                  style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}
                >
                  Reading Passages
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)', marginTop: 1 }}>
                  30 stories · A1 to C1
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xl)', color: 'var(--subtext)', opacity: 0.35 }}>
                ›
              </div>
            </button>
          </Section>
        </div>

        {/* Grammar Videos */}
        <div id="learn-section-videos">
          <Section
            title="Grammar Videos & AI Lessons"
            icon="🎥"
            count="18 videos + AI"
            defaultOpen={true}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="tc"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px',
                }}
                onClick={() => {
                  onClose();
                  setScr('grammarvideos');
                }}
              >
                <span style={{ fontSize: 28 }}>🎬</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Watch Grammar Lessons</div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
                    18 video lessons from beginner to advanced
                  </div>
                </div>
              </button>
              <button
                className="tc"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '16px',
                }}
                onClick={() => {
                  onClose();
                  setScr('grammarexplainer');
                }}
              >
                <span style={{ fontSize: 28 }}>🤖</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>AI Grammar Explainer</div>
                  <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
                    Instant AI lessons on any topic + quiz
                  </div>
                </div>
              </button>
            </div>
          </Section>
        </div>

        {/* Interactive Media */}
        <div id="learn-section-interactive">
          <Section
            title="Interactive Media"
            icon="✨"
            count="15 lessons + tools"
            defaultOpen={true}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tiles5([
                // ── Animated Grammar Lessons (22 total, A1→C1) ──────────────────────
                [
                  '🔤',
                  'Alphabet & Sounds',
                  'Phonetic rules, digraphs, Croatian diacritics — A1',
                  'animlesson_alphabet',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('alphabet');
                  },
                ],
                [
                  '⚧️',
                  'Noun Gender',
                  'Masculine, feminine, neuter — identify by ending — A1',
                  'animlesson_gender',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('gender');
                  },
                ],
                [
                  '⏮️',
                  'Past Tense',
                  'L-participle, gender endings, auxiliary system — A2',
                  'animlesson_past',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('past-tense');
                  },
                ],
                [
                  '🚀',
                  'Future Tense',
                  'ću/ćeš/će pattern, aspect in future, negation — B1',
                  'animlesson_future',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('future-tense');
                  },
                ],
                [
                  '🤝',
                  'Vi vs Ti',
                  'Formal and informal address — when to use which — A2',
                  'animlesson_vi_ti',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('vi-vs-ti');
                  },
                ],
                [
                  '🎨',
                  'Adjective Agreement',
                  'Gender, case, number agreement for adjectives — A2',
                  'animlesson_adjagree',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('adjective-agreement');
                  },
                ],
                [
                  '⚖️',
                  'Accusative in Depth',
                  'Animate/inanimate, direction vs location, time — A2',
                  'animlesson_acc',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('accusative-deep');
                  },
                ],
                [
                  '🔄',
                  'Aspect — Imperfective',
                  'Ongoing, habitual, general truth — when to use it — B1',
                  'animlesson_aspect_impf',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('aspect-imperfective');
                  },
                ],
                [
                  '✅',
                  'Aspect — Perfective',
                  'Completed events, narrative chains, results — B1',
                  'animlesson_aspect_pf',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('aspect-perfective');
                  },
                ],
                [
                  '🚫',
                  'Aspect + Negation',
                  'Why negation and commands flip the aspect rule — B2',
                  'animlesson_aspect_neg',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('aspect-negation');
                  },
                ],
                [
                  '📦',
                  'Genitive in Depth',
                  'Possession, nema, quantities, 8 key prepositions — B1',
                  'animlesson_gen',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('genitive-deep');
                  },
                ],
                [
                  '📍',
                  'Dative & Locative',
                  'Shared endings, recipients, location prepositions — B1',
                  'animlesson_dat_loc',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('dative-locative');
                  },
                ],
                [
                  '🛠️',
                  'Instrumental Case',
                  'Tools, means, accompaniment, s/sa + prepositions — B1',
                  'animlesson_instr',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('instrumental');
                  },
                ],
                [
                  '🧬',
                  'Clitics: Mastery',
                  'Second-position rule, full internal order, double je — C1',
                  'animlesson_clitics_adv',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('clitics-advanced');
                  },
                ],
                [
                  '📝',
                  'Verbal Nouns & Participles',
                  'Gerunds (-nje/-će), active/passive/adverbial forms — C1',
                  'animlesson_verbnoun',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('verbal-nouns');
                  },
                ],
                [
                  '🎭',
                  'Idioms & Register',
                  'Ti/Vi shift, diminutives, discourse markers, proverbs — C1',
                  'animlesson_idioms',
                  () => {
                    onClose();
                    launchAnimLesson && launchAnimLesson('idioms-register');
                  },
                ],
                // ── Interactive Tools ───────────────────────────────────────────────
                [
                  '🔀',
                  'Case Transformer',
                  'Declension explorer — tap any noun across all 7 cases',
                  'casetransformer',
                  () => {
                    onClose();
                    setScr('casetransformer');
                  },
                ],
                [
                  '🗺️',
                  'Vocabulary Scenes',
                  'Tap objects in real-life scenes to learn words',
                  'vocabscenes',
                  () => {
                    onClose();
                    setScr('vocabscenes');
                  },
                ],
                [
                  '🔍',
                  'Grammar X-Ray',
                  'Tap any word in a text to see full grammatical analysis',
                  'grammarreader',
                  () => {
                    onClose();
                    setScr('grammarreader');
                  },
                ],
              ]).map(([icon, label, sub, key, fn]) => (
                <button
                  key={key}
                  className="tc"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    textAlign: 'left',
                  }}
                  onClick={fn}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 800,
                        color: 'var(--heading)',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}
                    >
                      {sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Pronunciation Lab */}
        <div id="learn-section-pronunciation">
          <Section title="Pronunciation Lab" icon="🎙️" count="3 courses" defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tiles5([
                [
                  '🗣️',
                  'Pronunciation Course',
                  'Master Č, Š, Ž, LJ, NJ & the Croatian sounds',
                  'pronunciation_course',
                  () => {
                    onClose();
                    setScr('pronunciation_course');
                  },
                ],
                [
                  '🎵',
                  'Pitch Accent',
                  '4 accents — what no other app teaches',
                  'pitch_accent',
                  () => {
                    onClose();
                    setScr('pitch_accent');
                  },
                ],
                [
                  '🔤',
                  'Phoneme Trainer',
                  'Č vs Ć · Š Ž LJ NJ · train your ear',
                  'phoneme_practice',
                  () => {
                    onClose();
                    setScr('phoneme_practice');
                  },
                ],
              ]).map(([icon, label, sub, key, fn]) => (
                <button
                  key={key}
                  className="tc"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    textAlign: 'left',
                  }}
                  onClick={fn}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 800,
                        color: 'var(--heading)',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}
                    >
                      {sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Learning Paths & Tracks */}
        <div id="learn-section-paths">
          <Section title="Learning Paths & Tracks" icon="🧭" count="8 tracks" defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tiles5([
                [
                  '🎯',
                  'AI Micro-Lesson',
                  'Personalized 5-min lesson from your weak words',
                  'micro_lesson',
                  () => {
                    onClose();
                    setScr('micro_lesson');
                  },
                ],
                [
                  '⚙️',
                  'Grammar Track A1→B2',
                  '40 units · cases, tenses, aspect — alternative to Learn Path',
                  'grammar_track',
                  () => {
                    onClose();
                    setScr('grammar_track');
                  },
                ],
                [
                  '🧬',
                  'Heritage Path',
                  'Grew up hearing Croatian? Start here.',
                  'heritage_path',
                  () => {
                    onClose();
                    setScr('heritage_path');
                  },
                ],
                [
                  '🌍',
                  'Heritage Mode',
                  'Diaspora learner? Identify your gaps',
                  'heritage_mode',
                  () => {
                    onClose();
                    setScr('heritage_mode');
                  },
                ],
                [
                  '🗺️',
                  'Practical Croatian',
                  'Shop · Doctor · Immigration & more',
                  'practical_croatian',
                  () => {
                    onClose();
                    setScr('practical_croatian');
                  },
                ],
                [
                  '📊',
                  'Top 500 Croatian Words',
                  'Master the words that make up 80% of everyday speech',
                  'frequency_track',
                  () => {
                    onClose();
                    setScr('frequency_track');
                  },
                ],
                [
                  '🎓',
                  'B2+ Vocabulary',
                  'Advanced themes: politics, tech, environment, idioms',
                  'advanced_vocab',
                  () => {
                    onClose();
                    setScr('advanced_vocab');
                  },
                ],
                [
                  '🗺️',
                  'Grammar Map',
                  'Navigate how all the grammar connects',
                  'grammarmap',
                  () => {
                    onClose();
                    setScr('grammarmap');
                  },
                ],
                [
                  '✍️',
                  'Production Drill',
                  'Build sentences from scratch — active recall',
                  'production_drill',
                  () => {
                    onClose();
                    setScr('production_drill');
                  },
                ],
              ]).map(([icon, label, sub, key, fn]) => (
                <button
                  key={key}
                  className="tc"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    textAlign: 'left',
                  }}
                  onClick={fn}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 800,
                        color: 'var(--heading)',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}
                    >
                      {sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Reference */}
        <Section title="Quick Reference" icon="📌" count="13 guides" defaultOpen={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {tiles3([
              ['🔤', 'Alphabet', 'alphabet'],
              ['🧩', 'Word Patterns', 'wordform'],
              ['🐣', 'Diminutives', 'diminutives'],
              ['🗺️', 'Dialects', 'dialects'],
              ['⚠️', 'False Friends', 'falsefr'],
              ['🎨', 'Color Quirks', 'colorquirk'],
              ['🪞', 'Svoj vs Moj', 'svojmoj'],
              ['🔀', 'Conditional', 'conditional'],
              ['🤝', 'Vi ili ti?', 'formalregister'],
              ['🔁', 'Impersonal', 'impersonal'],
              ['💻', 'Tech & Digital', 'techvoc'],
              ['🏛️', 'Admin Life', 'bureaucratic'],
              ['🎭', 'Ti vs Vi', 'tivicompare'],
            ]).map(([icon, label, screen]) => (
              <button
                key={screen}
                className="tc"
                style={{ textAlign: 'center', padding: '12px 8px' }}
                onClick={() => {
                  onClose();
                  setScr(screen);
                }}
              >
                <div style={{ fontSize: 'var(--text-2xl)' }}>{icon}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginTop: 4 }}>
                  {label}
                </div>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
