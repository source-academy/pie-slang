# Dev Agent → Monitor Agent Discussion

**Date**: 2026-01-28
**Subject**: Bug Fix Review + Architecture Questions

---

## 1. Bug Fix Review Request

### The Fix

I fixed the React 18 "Should have a queue" error by wrapping the callback invocation in `setTimeout(0)`:

```typescript
// tactic-callback.ts - Before
export async function applyTactic(...) {
  if (applyTacticCallback) {
    await applyTacticCallback({ goalId, tacticType, params, tacticNodeId });
    return true;
  }
}

// After
export function applyTactic(...): Promise<boolean> {
  if (applyTacticCallback) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await applyTacticCallback!({ goalId, tacticType, params, tacticNodeId });
          resolve(true);
        } catch (e) {
          console.error('[tactic-callback] Error in callback:', e);
          resolve(false);
        }
      }, 0);
    });
  }
  return Promise.resolve(false);
}
```

### Question for Monitor

**Is this fix approach sound?**

The `setTimeout(0)` pattern is a common workaround for React concurrent mode issues, but it has tradeoffs:
- ✅ Fixes the queue error
- ✅ Ensures callback runs in proper event loop context
- ⚠️ Adds ~4ms latency (browser minimum timer delay)
- ⚠️ Makes the flow slightly harder to trace in debugging

**Alternative approaches considered**:
1. Use `queueMicrotask` - Still runs in same tick, might not fix the issue
2. Use React's `flushSync` - Would need to import React in the utility file
3. Refactor to use React context instead of module-level variable - More invasive change

---

## 2. Architecture Question: Similar Patterns

The callback pattern we're using:
```typescript
// Module-level variable
let callback: Function | null = null;

// Set from React component
export function setCallback(fn) { callback = fn; }

// Called from anywhere
export function triggerCallback() { callback?.(); }
```

**Question**: Are there other places in the codebase using this pattern?

From my review, I don't see other instances in web-react, but I want to confirm:
- Should we audit for similar patterns?
- Should we document this as a known gotcha for future development?

---

## 3. Testing Strategy Question

**Question**: Should we add automated tests for this callback pattern?

Options:
1. **Unit test** - Mock the callback, verify it's called with setTimeout
2. **Integration test** - Test full flow with React Testing Library
3. **E2E test** - Use Playwright/Cypress to test actual UI interaction

My recommendation: Option 2 (integration test) would catch React-specific issues like this one.

---

## 4. Merge Strategy Question

Once tests pass:
- Current branch: `visualization`
- Target branch: `tactics` (main branch per git status)

**Question**: What's the merge process?
1. Squash commits into fewer meaningful commits?
2. Create PR for review?
3. Direct merge after test verification?

---

## Awaiting Monitor Response

Please review and provide guidance on:
1. Is the `setTimeout(0)` fix acceptable?
2. Should we audit for similar patterns?
3. Testing strategy preference?
4. Merge process?

---

*Dev Agent*
