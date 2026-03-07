# Naša Hrvatska — Claude Code Refactoring Guide

## What This Project Is
A Croatian language and culture learning app (nasahrvatska.com). Currently deployed on Netlify with Firebase Auth and Firestore. ~90 screens, 797 vocabulary words, 41 practice exercises, Azure TTS via Netlify Function.

## Current State
The app is a working monolith split into two files:
- `src/data.js` (303KB) — All data constants + utility functions
- `src/App.jsx` (283KB) — Single React component with 209 useState hooks, 90 screens, 1,949 React.createElement calls

It works but uses raw `React.createElement()` (no JSX), has cryptic variable names, and everything is in one god component.

## What Needs To Happen (in priority order)

### Phase 1: Get It Building (DO THIS FIRST)
1. `npm install`
2. `npm run dev` — verify it loads in browser
3. Fix any import/export issues between data.js and App.jsx
4. Verify Firebase login, TTS, and navigation work
5. `npm run build` — verify production build works

**The app must work identically to the current live site before any refactoring begins.**

### Phase 2: Convert to JSX
Convert all `React.createElement()` calls in App.jsx to JSX syntax. This is mechanical:
```
// Before:
React.createElement("div", {style: {color: "red"}}, "Hello")
// After:
<div style={{color: "red"}}>Hello</div>
```

### Phase 3: Extract Components
Split the god component into separate files. Each screen should be its own component:

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginScreen.jsx
│   │   ├── RegisterScreen.jsx
│   │   └── ResetPassword.jsx
│   ├── home/
│   │   ├── Dashboard.jsx
│   │   ├── DailyChallenge.jsx
│   │   ├── WeeklyProgress.jsx
│   │   ├── QuickTranslate.jsx
│   │   └── SearchBar.jsx
│   ├── learn/
│   │   ├── LearnTab.jsx
│   │   ├── VocabGrid.jsx
│   │   ├── LessonScreen.jsx
│   │   ├── GrammarScreen.jsx
│   │   ├── AlphabetScreen.jsx
│   │   └── ReadingScreen.jsx
│   ├── practice/
│   │   ├── PracticeTab.jsx
│   │   ├── QuizGame.jsx
│   │   ├── Flashcards.jsx
│   │   ├── MatchPairs.jsx
│   │   ├── Typing.jsx
│   │   ├── Listening.jsx
│   │   ├── Speaking.jsx
│   │   └── exercises/
│   │       ├── Pronouns.jsx
│   │       ├── GenderDrill.jsx
│   │       ├── SentenceBuilder.jsx
│   │       ├── VerbDrill.jsx
│   │       ├── TenseFlip.jsx
│   │       ├── Riddles.jsx
│   │       ├── LogicQuiz.jsx
│   │       ├── Ordinals.jsx
│   │       ├── RelativePronouns.jsx
│   │       ├── EmotionGender.jsx
│   │       ├── Opposites.jsx
│   │       ├── CityLocative.jsx
│   │       ├── AccusativeDrill.jsx
│   │       ├── ColorAgreement.jsx
│   │       ├── Possessives.jsx
│   │       ├── QuestionWords.jsx
│   │       ├── Negation.jsx
│   │       ├── Sibilarization.jsx
│   │       ├── Restaurant.jsx
│   │       ├── ProfessionGender.jsx
│   │       ├── Comparatives.jsx
│   │       └── FutureTense.jsx
│   ├── croatia/
│   │   ├── CroatiaTab.jsx
│   │   ├── MediaSection.jsx
│   │   ├── InteractiveMap.jsx
│   │   ├── HistoryScreen.jsx
│   │   └── DailyLifeScreens.jsx
│   ├── profile/
│   │   ├── ProfileTab.jsx
│   │   ├── Badges.jsx
│   │   ├── Favorites.jsx
│   │   └── VocabJournal.jsx
│   └── shared/
│       ├── TabBar.jsx
│       ├── Header.jsx
│       ├── BackButton.jsx
│       ├── XPPopup.jsx
│       └── BadgeToast.jsx
├── data/
│   ├── vocabulary.js          (V constant)
│   ├── grammar.js             (PADEZI, PADEZI_FULL, DECL, etc.)
│   ├── exercises.js           (PRONOUNCASE, GENDERDRILL, etc.)
│   ├── proverbs.js            (PROVERBS)
│   ├── historicalFacts.js     (HIST_FACTS)
│   ├── media.js               (MEDIA)
│   ├── mapPlaces.js           (MAPPLACES)
│   ├── badges.js              (BADGES)
│   ├── learningPath.js        (LEARN_PATH)
│   ├── culturalContent.js     (SCHOOL, TEXTING, FRIENDS, etc.)
│   └── readingPassages.js     (READ, STORIES)
├── hooks/
│   ├── useAuth.js             (Firebase auth state)
│   ├── useProgress.js         (XP, stats, localStorage + Firestore)
│   ├── useNavigation.js       (screen/tab history stack)
│   ├── useSpeech.js           (Azure TTS + Web Speech fallback)
│   ├── useXPCooldown.js       (anti-gaming system)
│   └── useDarkMode.js
├── utils/
│   ├── firebase.js            (init, auth, firestore functions)
│   ├── shuffle.js             (sh, shMemo, shuffleArr)
│   ├── friendlyErrors.js
│   └── constants.js           (BG_LIGHT, BG_DARK, CSS)
├── styles/
│   ├── global.css             (extracted from CSS constant)
│   ├── cards.css
│   └── buttons.css
├── App.jsx                    (Router + layout shell)
└── main.jsx                   (entry point + ErrorBoundary)
```

### Phase 4: Proper State Management
Replace the 209 useState hooks with:
1. **React Context** for global state (auth, user stats, dark mode)
2. **useReducer** for complex screen state (quiz state machines)
3. **Custom hooks** for reusable logic (useAuth, useProgress, useSpeech)

### Phase 5: CSS Extraction
Move all 1,691 inline styles to CSS modules or a utility framework:
- Extract the CSS constant into `global.css`
- Create component-specific CSS files
- Use CSS custom properties for the design tokens (colors, radii, shadows)

### Phase 6: React Router
Replace the manual `scr`/`tab` state routing with React Router:
```jsx
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/learn" element={<LearnTab />} />
  <Route path="/learn/:category" element={<LessonScreen />} />
  <Route path="/practice" element={<PracticeTab />} />
  <Route path="/practice/quiz" element={<QuizGame />} />
  <Route path="/croatia" element={<CroatiaTab />} />
  <Route path="/profile" element={<ProfileTab />} />
</Routes>
```
This gives us:
- Browser back button works natively (no pushState hacks)
- Deep linking (share link to a specific lesson)
- URL reflects current screen

## Critical Rules During Refactoring
1. **Do NOT change any data constants** — all word lists, proverbs, facts, media links are correct
2. **Do NOT change Firebase config** — project ID is ucimohrvatski-488f9
3. **Do NOT put Azure key in client code** — it's in the Netlify Function (netlify/functions/tts.js) and reads from environment variable AZURE_TTS_KEY
4. **Preserve the XP cooldown system** — canEarnXP() and markExerciseDone() prevent daily farming
5. **Preserve the daily challenge system** — uses localStorage key "dcDay" to limit to once per day
6. **Password hash salt is "ucimo2024"** — do not change or existing users can't log in
7. **Test login/registration after every major change** — this broke before and lost users

## Deployment
- Site: nasahrvatska.com (Netlify)
- Netlify site name: nasahrvatska
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Environment variables already set:
  - AZURE_TTS_KEY (Azure Speech key)
  - AZURE_TTS_REGION (westeurope)

## Firebase
- Project: ucimohrvatski-488f9
- Auth: Email/password
- Firestore collections: users, families
- Authorized domains: nasahrvatska.com, www.nasahrvatska.com, nasahrvatska.netlify.app

## Variable Name Decoder (for the cryptic state names)
```
as = auth screen state ("loading"/"login"/"register"/"reset"/"app")
au = auth user object
scr = current screen name
tab = current tab ("home"/"learn"/"practice"/"croatia"/"profile")
st = user stats {xp, lc, gc, mv, badges, ...}
li = lesson items array
lt = lesson topic (category name)
lx = lesson index
lp = lesson phase ("learn"/"quiz")
la = lesson answered
mcQ = multiple choice questions
mcI = mc index
mcS = mc score
mcA = mc answered
qi = quiz items
gl = grammar lesson
gx = grammar index
m7 = modal screen mode
```
