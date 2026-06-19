# Phase 7a — Razgovor (Talk / AI) Redesign — Design Spec

> First of the two Phase 7 sub-designs (Razgovor now; Hrvatska next). Continues the "welcomed into a family / a place, not an app" redesign: the old tool-oriented "AI Tutor" tab dissolves into **the family you talk to**. Person-led model approved in brainstorm (2026-06-19).

**Goal:** Re-present the AI tab as **Razgovor** — five family conversation partners led by a "Danas" recommended chat, with each partner's AI tools folded into them and the few non-conversational utilities in a quiet "Alati" shelf — **without orphaning any of the 10 existing AI entry points and without changing any conversation/tool screen's behaviour.**

**Architecture:** A re-presentation layer. A new `src/components/razgovor/` module (registry + tab + partner screen) replaces `AITab`. A `partners.ts` registry maps every AI entry point to a partner mode or the Alati shelf. The existing conversation/persona/live-tutor/writing/story/listening/etc. screens are reused unchanged. A no-orphan unit test proves coverage.

**Tech stack:** React 18 + Vite + TS; plain CSS + tokens (`src/index.css`, no Tailwind); Outfit + Playfair; Vitest + @testing-library/react; Playwright e2e; Cloudflare Pages.

## Global Constraints
- Plain CSS + tokens. Palette teal `#0e7490`/`#164e63`, red `#D40030`, terracotta `#c2410c`, stone `#f5f0e8`, gold `#C8980A` (use a darker gold like `#6b4e0a` for small bold text on gold-tint to clear WCAG AA — lesson from Phase 6). Fonts Outfit (UI) + Playfair (headings).
- ASCII-only commit messages + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Branch `feat/uxui-razgovor-phase7`; never push to master. Merging deploys.
- **No orphaned entry points:** all 10 inventoried AITab launches stay reachable. Enforced by a unit test, not inspection.
- **Behaviour untouched:** Razgovor only changes navigation/presentation. The conversation/persona/live-tutor/writing/story/listening/video/sprint/photo screens are reused as-is.
- Character art = locked flat cast (`src/components/family/CharacterPortrait`, `CharacterName='baka'|'ana'|'kovac'|'ivo'|'marko'`).
- CI gates desktop e2e only.

## Inventory baseline (the must-not-orphan list)
`AITab.tsx` (tab `ai`) renders a hero + 3 primary + 7 secondary cards = **10 entry points**: `aiconvo`, `live_tutor`, `personas`, `ai_listening`, `video_lesson`, `writing`, `speaking_sprint`, `ai_story`, `grammar_diagnosis`, `photo_vocab`. Props: `setScr`, `sCurEx?`. No hooks, no flags, no CEFR gating.

---

## Section 1 — Partners & mapping

Five family conversation partners + a logical "Alati" shelf (utilities) + a "Danas" recommended chat.

| Partner id | Host | Name | Role | Modes (entry points) |
|---|---|---|---|---|
| `ana` | ana | Ana | svakodnevni razgovor (café small talk) | Počni razgovor (`personas`→Ana / `aiconvo`) · Odigraj scenu (role-play) |
| `marko` | marko | Marko | more i tržnica (coast & market) | Počni razgovor (`personas`→Marko) · Odigraj scenu |
| `baka` | baka | Baka Marija | priče uz kavu (stories) | Počni razgovor (`personas`→Baka) · Priča uz kavu (`ai_story`) |
| `kovac` | kovac | prof. Kovač | ispravi me (correction tutor) | Vođeni sat (`live_tutor`) · Pošalji mi tekst (`writing`) · Slijepe točke (`grammar_diagnosis`) |
| `ivo` | ivo | Ivo | ulični govor (street register) | Počni razgovor (street persona — **new Ivo persona to add**) |
| `ALATI` | — | AI alati | utilities (quiet shelf) | AI Listening (`ai_listening`) · AI Video Lesson (`video_lesson`) · Pronunciation Sprint (`speaking_sprint`) · Photo Vocab Scanner (`photo_vocab`) |

**Coverage:** all 10 entry points mapped (5 conversation/persona via partners' "Počni razgovor" + `aiconvo`; `ai_story`/`live_tutor`/`writing`/`grammar_diagnosis` as partner specialty modes; 4 utilities in ALATI).

**Locked judgment calls (from brainstorm):**
1. The `personas` screen **becomes the partner cards** — a partner's "Počni razgovor" opens the persona conversation preselected to that partner (no separate persona-picker list).
2. Kovač owns the three correction tools (Live Tutor + Writing + Grammar Blind Spots).
3. The four non-conversation utilities live in the **Alati** shelf (kept in Razgovor; no cross-tab relocation).

---

## Section 2 — Default surface
1. **Slim hero** — eyebrow "razgovor" + title "Razgovor" + red/white/teal stripe (no list/map toggle — Razgovor is people).
2. **"Danas" recommended-chat card** — `recommendedChat()` picks one partner (host-of-day rotation, or "continue last chat" if present), spoken relationally ("Ana te zove na kavu"), host `CharacterPortrait`, one CTA that **launches that conversation in one tap**.
3. **Partners list** — one calm row per partner: `CharacterPortrait` + name + one-line role. The recommended partner gets a thin gold edge.
4. **"AI alati" shelf** — collapsed by default; expands to the 4 utility tiles.

Tapping a partner opens the partner interior (Section 3). No CEFR gating.

---

## Section 3 — Inside a partner
1. **`← Razgovor` back bar** + partner name.
2. **Warm hero** — partner `CharacterPortrait` in a gold ring + a contextual persona greeting (hr + en) reflecting state (returning / "what shall we talk about today" / a suggested topic).
3. **Primary CTA** — "Počni razgovor" (the partner's first mode) → launches the persona conversation preselected.
4. **Načini** — the partner's other modes as inviting rows (role-play for Ana/Marko/Ivo; Priča uz kavu for Baka; the three correction tools for Kovač). Each launches its existing screen unchanged.

Greeting + recommended-mode pattern matches Grad's place interiors.

---

## Section 4 — Data model, no-orphan, testing
**`src/components/razgovor/partners.ts`:**
```ts
export type PartnerId = 'ana' | 'marko' | 'baka' | 'kovac' | 'ivo';
export interface ConvoMode {
  id: string; label: string; icon: string;
  launch: 'persona' | 'scr';   // 'persona' opens the persona chat preselected to the partner
  scr?: string; curEx?: string;
}
export interface Partner {
  id: PartnerId; host: CharacterName; name: string; role: string; tint: string;
  greeting: (ctx: GreetCtx) => { hr: string; en: string };
  modes: ConvoMode[];          // modes[0] = primary "Počni razgovor"
}
export const PARTNERS: Partner[];                                   // 5
export const ALATI: Array<{ id: string; label: string; icon: string; scr: string; curEx?: string }>; // 4
```
- **`recommendedChat(ctx)`** → `{ partnerId, host, hr, en, launch }` via host-of-day rotation (`dayOfYear()%5`); prefers a "continue last conversation" signal if one is read from existing state.
- **Persona preselect:** the plan verifies how `PersonaScreen` selects a persona (e.g. a localStorage key analogous to slang's `slangInitSection`) and a partner's `launch:'persona'` sets it before `setScr`. **Add an Ivo persona** to the persona system (none exists).
- **Components:** `RazgovorTab.tsx` (replaces `AITab`, mounted at `tab==='ai'`), `PartnerScreen.tsx`. Reused untouched: all conversation/tool screens. Props mirror AITab's (`setScr`, `sCurEx`). Retire `AITab.tsx`.

**No-orphan gate — `razgovor.test.ts`:** the union of every partner mode's launch target (incl. the persona launch) ∪ `ALATI` covers the 10 must-not-orphan ids; no stale ids; each `host` is a valid `CharacterName`; `recommendedChat` always returns a launchable partner.

**Component tests:** RazgovorTab renders Today + 5 partner rows + Alati shelf (collapsed); PartnerScreen renders greeting + primary CTA + modes; Kovač renders the 3 correction tools.

**E2E:** new `e2e/razgovor.spec.js` (open `/ai` → Today card + partners → tap partner → interior → launch a mode → no console error → back). Audit `e2e/` for any AI-tab-surface assertions (`/ai`, old card labels) and migrate. Rebuild dist before running; full desktop run before PR.

## Non-goals / open items
- No change to AI conversation/tool behaviour, prompts, or scoring.
- No new adaptive logic — `recommendedChat` is a rotation, not SRS.
- The Ivo persona's prompt/voice is authored minimally (street register) — content polish is a follow-up.
- Hrvatska (Phase 7b) is a separate spec.
- Exact persona-preselect mechanism + AITab prop names reconciled at implementation by reading `PersonaScreen`/`AppRouter`.
