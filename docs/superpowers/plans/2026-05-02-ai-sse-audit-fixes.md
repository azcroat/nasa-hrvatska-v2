# AI SSE & Error Handling Audit Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 bugs found in an expert analysis of the AI layer: one P0 (SSE stream errors silently dropped → infinite loading) and three P1s (missing error mappings and a missing timeout).

**Architecture:** The Croatian learning app's AI conversation uses SSE streaming (`conversation.js` → `callMaja()` in `AIConversation.tsx`). A code audit revealed that when the server sends `event: error` mid-stream, the frontend SSE parser skips it entirely (only processes `data:` lines), leaving the UI frozen. Additionally `conversational-tutor.js` uses a non-standard error code, `callMaja()` lacks parity with `callAI()` on error mapping, and the SSE reader loop has no timeout guard.

**Tech Stack:** TypeScript/React (frontend), Cloudflare Pages Functions (backend JS), Anthropic Claude API (SSE streaming).

---

## File Map

- Modify: `src/components/croatia/AIConversation.tsx` — three fixes: SSE error event handling, SSE stream timeout, `callMaja()` `server_misconfigured` mapping
- Modify: `functions/api/conversational-tutor.js` — fix `not_configured` → `AI_KEY_MISSING` at 503

---

### Task 1: Fix conversational-tutor.js — Wrong error code for missing ANTHROPIC_KEY

**Files:**
- Modify: `functions/api/conversational-tutor.js`

**Context:** `conversational-tutor.js` returns `{ error: 'not_configured' }` at HTTP 500 when `ANTHROPIC_API_KEY` is missing. The correct code is `AI_KEY_MISSING` at HTTP 503, matching every other AI endpoint. The frontend checks for `AI_KEY_MISSING` to surface an actionable error message. `not_configured` is not checked anywhere and falls through to a generic raw error string shown to users.

- [ ] **Step 1: Read the auth/key blocks**

Read `functions/api/conversational-tutor.js` lines 1–60 to understand the helper functions available (`err()`, `corsHeaders()`, etc.) and the exact current error code block.

- [ ] **Step 2: Replace the error code**

Find the line that contains `not_configured` and:

If the file has an `err()` helper:
```javascript
if (!ANTHROPIC_KEY) return err(503, 'AI_KEY_MISSING', origin);
```

If the file uses inline `new Response(...)`:
```javascript
if (!ANTHROPIC_KEY) {
  return new Response(JSON.stringify({ error: 'AI_KEY_MISSING' }), {
    status: 503,
    headers: corsHeaders(origin),
  });
}
```

Use whichever pattern is consistent with the rest of the file.

- [ ] **Step 3: Verify**

```
grep -n "not_configured" functions/api/conversational-tutor.js
```
Expected: NO matches.

```
grep -n "AI_KEY_MISSING" functions/api/conversational-tutor.js
```
Expected: 1 match (the new line).

- [ ] **Step 4: Lint check**

```
npm run lint 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add functions/api/conversational-tutor.js
git commit -m "fix(conversational-tutor): return AI_KEY_MISSING at 503 when ANTHROPIC_KEY absent

Frontend checks for AI_KEY_MISSING to surface an actionable setup error.
The previous 'not_configured' at 500 was not recognized and showed users
a raw error string. Aligns with all other AI endpoints in the layer.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Fix callMaja() — Add server_misconfigured error mapping

**Files:**
- Modify: `src/components/croatia/AIConversation.tsx`

**Context:** `callMaja()` and `callAI()` are the two frontend AI call paths. In Task 2 of the previous plan, `callAI()` was updated to map `server_misconfigured` to a user-friendly `setup_error:` message. `callMaja()` was not updated at the same time. When `conversation.js` or another endpoint returns `server_misconfigured`, `callMaja()` falls through to `throw new Error(errData.error)` which surfaces the raw string to users.

- [ ] **Step 1: Read the current callMaja() error handler**

Read `src/components/croatia/AIConversation.tsx` lines 485–520 to confirm the exact structure of the non-200 error handling block inside `callMaja()`.

- [ ] **Step 2: Add server_misconfigured case**

In the `if (!res.ok)` block inside `callMaja()`, add a `server_misconfigured` check AFTER the `AI_KEY_MISSING` check and BEFORE the final `throw new Error(...)`. The new block:

```typescript
      if (errData.error === 'server_misconfigured') {
        throw new Error(
          'setup_error:The server is missing required configuration. Please contact support.',
        );
      }
```

The insertion point is after:
```typescript
      if (
        errData.error?.includes('AI_KEY_MISSING') ||
        errData.error?.includes('ANTHROPIC_API_KEY')
      ) {
        throw new Error(
          'setup_error:The AI service is not yet configured. The ANTHROPIC_API_KEY needs to be set in Cloudflare Pages → Settings → Environment Variables.',
        );
      }
```

And before:
```typescript
      throw new Error(errData.error || `Server error ${res.status}`);
```

- [ ] **Step 3: Verify the error block order**

After editing, confirm the order inside `callMaja()`'s `if (!res.ok)` block is:
1. `res.status === 401` → sign-in message
2. `res.status === 429` → rate-limit / quota messages
3. `AI_KEY_MISSING` / `ANTHROPIC_API_KEY` → setup error
4. `server_misconfigured` → setup error (NEW)
5. fallthrough `throw new Error(errData.error || ...)`

- [ ] **Step 4: Typecheck**

```
npm run typecheck 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/croatia/AIConversation.tsx
git commit -m "fix(callMaja): add server_misconfigured error mapping

Brings callMaja() to parity with callAI() which already handles
server_misconfigured. Without this, the raw error string was surfaced
to users instead of the friendly setup_error: message.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Fix SSE reader — Handle server-sent error events (P0)

**Files:**
- Modify: `src/components/croatia/AIConversation.tsx`

**Context:** When `conversation.js` encounters a stream error after HTTP 200 is already sent, it writes:
```
event: error
data: {"error": "Stream interrupted"}
```
The SSE parser in `callMaja()` only processes lines starting with `data:`. It processes `data: {"error": "Stream interrupted"}` but then only checks `parsed.error === 'timeout'` — a non-timeout error falls through silently. The `done` event never comes. `result` stays `null`. After the while loop, the check `if (!result || !result.croatian)` throws `'The AI returned an empty response'` — a misleading message for what is actually a stream interruption. Worse, if the SSE connection drops entirely (reader returns `done: true` immediately), `result` is also `null` and the same misleading error fires.

The fix: check `parsed.error` for ALL non-falsy values after the timeout check, and throw a user-facing error immediately.

- [ ] **Step 1: Read the SSE reader loop**

Read `src/components/croatia/AIConversation.tsx` lines 525–560 to see the exact current `while (true)` loop, the line parsing, and the `parsed.error`/`parsed.type` checks.

- [ ] **Step 2: Add handler for non-timeout server errors**

In the `for (const line of lines)` loop, find the block:
```typescript
          if (parsed.error === 'timeout')
            throw new Error('The AI took too long to respond. Please try again.');
          if (parsed.type === 'done' && parsed.result) result = parsed.result as MajaResult;
```

Replace with:
```typescript
          if (parsed.error === 'timeout')
            throw new Error('The AI took too long to respond. Please try again.');
          if (parsed.error)
            throw new Error('The AI conversation was interrupted. Please try again.');
          if (parsed.type === 'done' && parsed.result) result = parsed.result as MajaResult;
```

The only addition is the two-line `if (parsed.error)` block between the timeout check and the done check. This ensures ANY `parsed.error` value (including `'Stream interrupted'`, `'rate_limit_exceeded'`, or anything new added server-side) throws immediately rather than being silently dropped.

- [ ] **Step 3: Verify**

Read the section back and confirm the three-check sequence is:
1. `if (parsed.error === 'timeout')` → specific timeout message
2. `if (parsed.error)` → generic interruption message  
3. `if (parsed.type === 'done' && parsed.result)` → success path

- [ ] **Step 4: Typecheck and lint**

```
npm run typecheck 2>&1 | head -20
npm run lint 2>&1 | head -20
```
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add src/components/croatia/AIConversation.tsx
git commit -m "fix(callMaja): handle server-sent error events in SSE stream

When conversation.js sends 'event: error' mid-stream, the data was
silently dropped because the parser only acted on parsed.error === 'timeout'.
Any other error value (e.g. 'Stream interrupted') left result as null and
eventually surfaced as 'AI returned an empty response' — wrong and confusing.
Now any non-falsy parsed.error throws immediately with a clear message.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Fix SSE reader — Add stream timeout guard (P1)

**Files:**
- Modify: `src/components/croatia/AIConversation.tsx`

**Context:** The `callMaja()` SSE reader loop has no timeout. If the server returns HTTP 200 (streaming started) but then never sends a `done` event — due to Cloudflare Worker CPU limit exhaustion, upstream Anthropic timeout, or any silent failure — the `while (true) { await reader.read() }` loop runs until the browser closes the connection. Depending on the browser and network, this can take 30–90+ seconds. The user sees a frozen loading screen with no error and no recovery path.

The fix: add a single `setTimeout` before the reader loop that cancels the stream after 60 seconds. Because `reader.cancel()` causes the next `reader.read()` to resolve with `{ done: true }`, use a `streamTimedOut` flag to detect this condition after the loop exits.

- [ ] **Step 1: Read the full SSE reader block**

Read `src/components/croatia/AIConversation.tsx` lines 518–570 to confirm the exact current structure: the `res.body.getReader()` assignment, the `try/finally` block, and the position of `reader.cancel()` in the `finally`.

- [ ] **Step 2: Add the timeout guard**

The current code structure is approximately:
```typescript
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: MajaResult | null = null;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // ... parsing ...
      }
    } finally {
      try { reader.cancel(); } catch { /* ignore cancel errors */ }
    }
    if (!result || !result.croatian)
      throw new Error('The AI returned an empty response. Please try again.');
    return result;
```

Replace with:
```typescript
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result: MajaResult | null = null;
    let streamTimedOut = false;
    const STREAM_TIMEOUT_MS = 60_000;
    const streamTimeoutId = setTimeout(() => {
      streamTimedOut = true;
      reader.cancel().catch(() => {});
    }, STREAM_TIMEOUT_MS);
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // ... existing parsing code unchanged ...
      }
    } finally {
      clearTimeout(streamTimeoutId);
      try { reader.cancel(); } catch { /* ignore cancel errors */ }
    }
    if (streamTimedOut) {
      throw new Error('The AI took too long to respond. Please try again.');
    }
    if (!result || !result.croatian)
      throw new Error('The AI returned an empty response. Please try again.');
    return result;
```

Key details:
- `streamTimedOut` flag is set before `reader.cancel()` so the post-loop check can distinguish a timeout-induced `done` from a normal stream end
- `clearTimeout(streamTimeoutId)` in `finally` prevents the timer firing if the stream completes normally before 60s
- The `if (streamTimedOut)` check runs AFTER the `finally` block, so it correctly catches the case where the stream was cancelled by the timer
- 60 seconds is a conservative timeout — Cloudflare Workers have a 30s CPU limit, so a real conversation should always finish before this fires under normal conditions

- [ ] **Step 3: Verify the structure**

Read the modified block back. Confirm:
- `streamTimedOut = false` declared alongside `result = null`
- `setTimeout` appears BEFORE the `try` block
- `clearTimeout` appears INSIDE the `finally` block
- `if (streamTimedOut)` check appears AFTER the `finally` block and BEFORE the existing `if (!result || !result.croatian)` check
- The inner loop body (parsing code) is UNCHANGED

- [ ] **Step 4: Typecheck and lint**

```
npm run typecheck 2>&1 | head -20
npm run lint 2>&1 | head -20
```
Expected: 0 errors each.

- [ ] **Step 5: Commit**

```bash
git add src/components/croatia/AIConversation.tsx
git commit -m "fix(callMaja): add 60s timeout guard on SSE stream reader

The while(true) reader loop had no timeout. If the server sends HTTP 200
but never sends 'done' (Worker timeout, upstream failure), the UI would
freeze indefinitely. The timeout fires reader.cancel(), the loop exits
via done:true, and a streamTimedOut flag triggers a clear error message.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Push and verify

**Files:** None (git / deployment)

- [ ] **Step 1: Push to master**

```
git push origin master
```
Expected: success.

- [ ] **Step 2: Full test suite**

```
npm test 2>&1 | tail -15
```
Expected: 0 failures.

- [ ] **Step 3: Audit checks**

```
echo "=== not_configured should be gone ===" && grep -rn "not_configured" functions/api/

echo "=== callMaja server_misconfigured handler ===" && grep -n "server_misconfigured" src/components/croatia/AIConversation.tsx

echo "=== SSE error handler present ===" && grep -n "parsed.error" src/components/croatia/AIConversation.tsx

echo "=== Stream timeout present ===" && grep -n "streamTimedOut\|STREAM_TIMEOUT_MS\|streamTimeoutId" src/components/croatia/AIConversation.tsx
```

Expected:
- `not_configured`: no matches anywhere
- `server_misconfigured`: 2 matches (one in `callAI()`, one in `callMaja()`)
- `parsed.error`: at least 2 matches (the timeout check and the new generic check)
- `streamTimedOut`: 3 matches (declaration, setter, post-loop check), `STREAM_TIMEOUT_MS`: 1 match, `streamTimeoutId`: 2 matches (set + clearTimeout)
