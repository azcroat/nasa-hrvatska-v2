---
name: playwright-e2e-patterns
description: Playwright E2E testing patterns and gotchas for the NASA Hrvatska codebase. Use this skill when writing new tests, fixing failing tests, debugging flaky tests, updating test fixtures, modifying playwright.config, or running the suite locally vs in CI. Documents the required global config (colorScheme: light, darkMode: false and why), screen navigation via data-testid attributes, TTS/audio stubbing strategy, --headed vs --headless behavior, the exact-text-match rule that has cost a session before, the screenshot baseline approach, and which tests are fragile and require local runs before changes. Trigger this even when you think you're "just running" the existing tests — most of these gotchas show up before a single new line of test code is written.
---

# Playwright E2E Patterns

Every time a test is written or fixed in this codebase, the same gotchas reappear. This skill collects them so they get solved once. Read before writing or modifying a test.

## Global config — the non-obvious required settings

The Playwright config (`playwright.config.ts`) needs these for tests to be reproducible across machines and CI:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  use: {
    colorScheme: 'light',         // see "why" below
    // App-specific: force light theme regardless of OS preference
    // by injecting a localStorage value or a query param
    // before each test (see test setup below).

    // Standard for a local-dev oriented suite:
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Why `colorScheme: 'light'`.** Playwright honors the OS color scheme by default. A developer running tests on a Mac in dark mode will get different rendered output than CI (which runs in light by default), which causes screenshot diffs and any CSS that branches on `prefers-color-scheme: dark` to behave inconsistently. Pinning to `light` makes the suite reproducible.

**Why an explicit `darkMode: false` step in the app.** This codebase has its own dark-mode toggle separate from the OS preference, stored in localStorage. A test that lands on a screen rendered in dark mode will fail text and visual assertions written against light mode. Force the app's own dark mode off in test setup:

```ts
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Force the app's dark mode toggle off before any app code runs.
    localStorage.setItem('nh_darkMode', 'false');
  });
});
```

`addInitScript` runs before any page script, so the value is in place by the time the app reads it on first render. Setting `localStorage` after `goto()` is too late — the app has already rendered.

## Navigating between screens — use data-testid

Don't navigate by clicking visible text labels. Translations change, copy gets tweaked, button text gets shortened, and your test breaks. Navigate by `data-testid` attributes:

```ts
await page.getByTestId('start-flash-button').click();
await expect(page.getByTestId('flash-screen')).toBeVisible();
```

**The convention in this codebase:**
- Screen containers: `data-testid="<exercise>-screen"` (e.g. `flash-screen`, `mcgame-screen`).
- Primary actions on a screen: `data-testid="<verb>-<noun>-button"` (e.g. `start-flash-button`, `submit-answer-button`).
- Inputs: `data-testid="<purpose>-input"`.

**When the testid you need doesn't exist yet,** add it to the component in the same change as the test. Don't paper over a missing testid with text matching "just for now" — that "for now" lasts until the next translation update breaks the test.

The test file must list the testids it expects to exist:

```ts
// At the top of the test file, document the contract.
// Any of these missing means a component change broke the test contract.
const TESTIDS = {
  flashScreen: 'flash-screen',
  startButton: 'start-flash-button',
  // ...
};
```

## TTS and audio stubbing

The app uses TTS for Croatian audio. In tests, real audio playback is slow, flaky (audio device differences across CI), and pointless — the test isn't validating audio output, it's validating the app behaved correctly around the audio call.

**The strategy: stub the audio API surface in `addInitScript` before the app loads.**

```ts
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Stub HTMLAudioElement to never actually play.
    const proto = HTMLAudioElement.prototype;
    proto.play = function () {
      // Synthesize the events the app might be listening for.
      setTimeout(() => this.dispatchEvent(new Event('ended')), 0);
      return Promise.resolve();
    };
    proto.pause = function () {};

    // Stub Web Speech API if used.
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak = (utterance) => {
        // Fire 'end' on the utterance so any awaiting promise resolves.
        setTimeout(() => {
          const evt = new Event('end');
          if (typeof utterance.onend === 'function') utterance.onend(evt);
          utterance.dispatchEvent?.(evt);
        }, 0);
      };
    }
  });
});
```

This makes audio-triggered flows complete instantly with no real sound. If your test is asserting something specific about audio behavior (e.g. "the play button shows a spinner while loading"), you'll need to control the timing more carefully — but for the common case of "click the audio button, then the next button becomes enabled," the instant-resolve stub above is what you want.

**Don't try to test real audio in CI.** It's not worth the flakiness. If audio behavior genuinely needs validation, do it in a separate manual-only test file and exclude it from the CI run.

## `--headed` vs `--headless` for debugging

```bash
# Default — runs headless, fast, what CI uses
npx playwright test

# Run headed — see the browser, useful for debugging timing issues
npx playwright test --headed

# Run a single test, headed, with the inspector
npx playwright test path/to/test.spec.ts --headed --debug

# Slow it down so you can see what's happening
npx playwright test --headed --slow-mo=300
```

**The non-obvious thing:** some tests pass headed and fail headless, or vice versa. The usual cause is a focus or visibility difference — headless browsers don't have window focus the same way, and certain `:focus-within` or `:hover` styles behave differently. When a test fails ONLY in headless mode:

1. Reproduce headless first to confirm.
2. Run headed to see what's happening visually.
3. If the difference is real, the test is depending on something that shouldn't be in the test — usually focus or hover state. Fix the test by explicitly setting focus (`element.focus()`) or removing the hover assumption.

**Don't "fix" a flaky test by adding waits.** `await page.waitForTimeout(1000)` is a code smell. Use `await expect(locator).toBeVisible()` or `await page.waitForLoadState('networkidle')` instead — they wait for an actual condition rather than a guess.

## The exact-text-match rule

This rule cost a full session to rediscover. State it explicitly:

**`getByText` matches against the rendered text node. Whitespace, punctuation, surrounding inline elements, and translated copy all matter.**

The trap:

```tsx
// Component renders:
<span>Score: <strong>5</strong> / 10</span>

// This test FAILS:
await expect(page.getByText('Score: 5 / 10')).toBeVisible();
// Because there's no single text node containing that string —
// the "5" is in its own <strong> child.
```

The rendered DOM has multiple text nodes (`"Score: "`, `"5"`, `" / 10"`), and `getByText` matches a single text node by default. The fix:

```ts
// Use a regex to match across the whole element's text content:
await expect(page.getByText(/Score:\s*5\s*\/\s*10/)).toBeVisible();

// Or, better, use a testid and assert text content:
await expect(page.getByTestId('score-display')).toHaveText(/5\s*\/\s*10/);
```

**The rule:** if the visible text spans inline elements (a `<strong>` inside a `<span>`, a translation that injects `<b>`), match by testid + `toHaveText` with a regex. Reserve `getByText` for prose without inline children.

This also matters for translated text. If the test asserts `getByText('Start')` and someone updates the Croatian translation to `'Pokreni'`, the test fails for a copy reason, not a behavior reason. Prefer testid-based assertions; reserve text matching for cases where the text itself is the thing under test.

## Screenshot baselines

The screenshot strategy:

```ts
await expect(page).toHaveScreenshot('flash-screen-initial.png');
```

Baselines live in `tests/__screenshots__/<test-file>.spec.ts-snapshots/<name>-<project>-<platform>.png`. The platform suffix matters: a baseline taken on macOS is not the same as one taken on Linux (font rendering differs). CI runs on Linux; if you generate baselines on macOS, the CI run will diff every screenshot.

**Workflow for screenshots:**
1. Write the test using `toHaveScreenshot`.
2. Run it once locally to fail and produce an actual rendering.
3. Update baselines: `npx playwright test --update-snapshots`.
4. **Commit baselines that match CI's platform**, not your local platform. If your local is macOS, run the test in Docker against the same image CI uses, or just run the test in CI, download the artifact, and commit those baselines.

**When a screenshot test fails after a UI change:**
- If the change was intentional: regenerate the baseline (`--update-snapshots`) and commit.
- If the change was unintentional: the test caught a real regression. Fix the code.
- If the diff is "just a few pixels": Playwright has a `maxDiffPixels` and `threshold` option. Use them sparingly; a too-loose threshold defeats the purpose of the test.

```ts
await expect(page).toHaveScreenshot('flash-screen.png', {
  maxDiffPixels: 100,
  threshold: 0.2,
});
```

## Fragile tests — the "don't touch without local run" list

Some tests are sensitive to environment, timing, or specific app state. Don't modify these without first running them locally end-to-end. If a "minor" change breaks one of them in CI, the failure mode is hours of bisecting because the test was the canary, not the actual regression.

**The categories of fragile tests in this codebase:**

- **Tests involving the SR (spaced repetition) flow.** SR has time-based scheduling; tests freeze the clock or seed deterministic state. Any change to seeding logic or the clock fixture cascades across every SR test.
- **Tests involving sign-in / sign-out.** These touch auth state, which interacts with the `_syncReady` gate. Order matters; race conditions surface here first.
- **Tests involving offline / online transitions.** These manipulate `navigator.onLine` and the SW. They're the most platform-sensitive in the suite.
- **Tests involving the audio stub.** Changes to the stub above can subtly break tests that assume specific event ordering.

**The rule for these tests:** before opening a PR that touches them, run the full test file locally with `--headed` and watch it pass. CI catching a regression in one of these categories is much more expensive than catching it locally — debugging requires watching the actual browser behavior, which CI logs alone don't show.

Mark these tests with a comment at the top of the file so future-you doesn't forget:

```ts
// FRAGILE: this test depends on the SR clock fixture and the _syncReady gate.
// Run --headed locally before merging changes that touch this file.
```

## Pre-flight checklist before merging a test change

1. Tests use `data-testid` for navigation, not visible text labels.
2. New testids exist in the components being tested.
3. `colorScheme: 'light'` and the dark-mode-off init script are in place for any test that does visual or text assertion.
4. Audio is stubbed if the test path crosses any audio-triggering code.
5. `getByText` is only used for prose without inline children; everything else uses testid + `toHaveText`.
6. Screenshot baselines were generated on the same platform CI runs.
7. No `waitForTimeout(N)` calls — every wait is for a specific condition.
8. If the test touches a fragile area, it was run locally with `--headed` first.

## Keeping this skill current

When a new gotcha bites, add it here in the same PR that fixes it. The cost of a stale Playwright skill is rediscovery — the gotcha that took two hours this time will take two hours next time, for someone else.
