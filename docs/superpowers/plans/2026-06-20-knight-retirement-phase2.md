# Knight Retirement — Phase 2 (Desktop home greeter → host-of-day) Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Replace the knight in the desktop home greeter (`KnightBubble`, rendered in `HeroSection` inside the desktop-only `DesktopPanel`) with the **host-of-day** `CharacterPortrait`, and reword the one new-user greeting that names "Vitez Hrvoje". Scope is desktop-web only — mobile/native Home already greets via the host-led SessionCard.

**Architecture:** Re-presentation. `KnightBubble` gains a `host` prop and renders `CharacterPortrait` instead of `CroatianKnight`; `HeroSection` computes `hostOfDay()` and passes it. Component/hook names (`KnightBubble`, `useKnightSpeech`, `getKnightGreeting`) stay (no churn). The `knight:celebrate` internal event is untouched.

## Global Constraints
- Locked cast (`CharacterPortrait`); host-of-day = `hostOfDay(Math.floor(Date.now()/86400000))` (same rotation as mobile Home).
- Keep `KnightBubble`/`useKnightSpeech` names + the `knight:celebrate` listener.
- Branch `feat/uxui-knight-retirement-phase2`; ASCII commits + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- `CroatianKnight.tsx` stays (Phase 3/4 deletes it).

## Task 1: KnightBubble renders the host-of-day portrait
**Files:** `src/components/home/KnightBubble.tsx`; Test `src/components/home/KnightBubble.test.tsx` (new).
- [ ] Add `host: CharacterName` to props (import `type { CharacterName }` from `../family/portraits`, `CharacterPortrait` from `../family/CharacterPortrait`; remove the `CroatianKnight` import).
- [ ] Replace the mascot block (`<CroatianKnight size={92} mood={greeting.mood} />`) with a gold-ringed host portrait:
  ```tsx
  <span style={{ flexShrink: 0, borderRadius: '50%', padding: 3, background: 'linear-gradient(135deg,#FFE070,#C8980A)' }}>
    <span style={{ display: 'block', width: 92, height: 92, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,.9)', background: '#fbf6ec' }}>
      <CharacterPortrait name={host} size={92} />
    </span>
  </span>
  ```
  (keep the surrounding `motion.div` scale-in wrapper).
- [ ] New test `KnightBubble.test.tsx`: render with a minimal `knight` stub + `host="baka"`; assert `portrait-baka` present and the greeting "<time>, <name>!" shows. (Stub the `knight` surface object with `greeting:{mood:'happy',text:'Hi'}`, the setters as `vi.fn()`, `cycleBubble`/`pickPool`/`doTr` as `vi.fn()`, booleans false, strings ''.)
- [ ] Run the test → pass; commit.

## Task 2: HeroSection passes host-of-day
**Files:** `src/components/home/HeroSection.tsx`.
- [ ] Import `hostOfDay` from `./hostFamily`; compute `const host = hostOfDay(Math.floor(Date.now() / 86400000));`.
- [ ] Pass `host={host}` to `<KnightBubble knight={knightSpeech} name={name} isNative={_isNative} />`.
- [ ] Typecheck; commit.

## Task 3: Reword the "Vitez Hrvoje" new-user greeting
**Files:** `src/components/home/heroHelpers.ts` (~line 47).
- [ ] Replace the `lc === 0` first greeting text `"Živjeli! I'm Vitez Hrvoje, your Croatian knight. …"` with a host-neutral family welcome, e.g.:
  `"Živjeli! Dobrodošli u našu hrvatsku obitelj. Croatia has 1,200 years of history and one of Europe's most precise languages — let's start writing yours."`
- [ ] Grep `src` for remaining user-facing "Vitez"/"Hrvoje" strings in the hero path; reword any (comments may stay). Commit.

## Final verification (before PR)
- [ ] `npm run test` full suite green (KnightBubble test + hero-section.smoke unaffected — it doesn't assert the knight; its `CroatianKnight` mock becomes an unused no-op, harmless).
- [ ] `npm run typecheck` + `npm run lint` clean; `npm run build` succeeds.
- [ ] `npx playwright test e2e/accessibility.spec.js e2e/home.spec.js --project="Desktop Chrome"` green (Desktop Chrome renders the `.desktop-panel`, so axe covers the new host greeter).
- [ ] Manual (desktop width): the right panel greets with the host-of-day portrait (no knight); quick-replies + translate still work.
- [ ] PR `feat/uxui-knight-retirement-phase2` → master; code-reviewer pass; merge on authorization. (`CroatianKnight` still used by ~18 sites → Phase 3.)
