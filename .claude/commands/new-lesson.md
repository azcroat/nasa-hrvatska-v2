# Add a New Lesson to the Learn Path

Scaffold a new lesson screen end-to-end with all required wiring.

## Usage
Provide: screen name, screen key (camelCase), lesson type (lc = cultural/informational, gc = grammar), and LEARN_PATH stage (1–5).

## Steps

1. **Create the screen component** in the appropriate directory:
   - Cultural/informational → `src/components/learn/`
   - Grammar → `src/components/learn/`
   - Minimum: renders lesson content, calls `dispatch({ type: 'VISIT_SCREEN', payload: { key: 'screenKey' } })` on mount or after dwell

2. **Register in useScreenLauncher.js** (`BLACK_HOLE_SCREENS`):
   ```javascript
   screenKey: 'lc',  // or 'gc' for grammar
   ```
   This enables the 20-second dwell timer that awards 15 XP and marks the screen as visited.

3. **Add to LEARN_PATH in content.jsx**:
   ```javascript
   {
     id: 'lpNN',
     key: 'screenKey',
     title: 'Lesson Title',
     desc: 'Short description',
     stage: N,  // 1–5
     ck: function(s) { return (s.vs && s.vs.includes('screenKey')) || s.lc >= N; }
   }
   ```
   - `ck` must use `vs.includes('screenKey')` as the primary check
   - The `lc >= N` fallback supports users who visited before the vs system existed

4. **Register the screen in AppRouter.jsx** so it's reachable via `setScr('screenKey')`.

5. **Test the completion flow**:
   - Navigate to the screen
   - Wait 20 seconds (or trigger via dev tools by dispatching VISIT_SCREEN)
   - Confirm the LEARN_PATH entry shows as completed (checkmark in LearnTab)
   - Confirm XP was awarded

6. Commit: `Add [LessonName] screen — stage N, [lc/gc] credit`
