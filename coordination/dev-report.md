# Dev Agent Report - Bug Fix

**Date**: 2026-01-28
**Task**: TASK-001 Bug Fix
**Commit**: 4d585a5

---

## Bug Fixed

### React 18 "Should have a queue" Error

**Symptom**: Clicking the "Apply" button on tactic nodes threw:
```
Error: Should have a queue. This is likely a bug in React.
at useProofSession (useProofSession.ts:9)
at AppContent (App.tsx:29)
```

**Root Cause**: The callback pattern used in `tactic-callback.ts` stored a callback in a module-level variable outside React's component tree. When this callback was invoked from a different component's event handler, React 18's concurrent mode couldn't properly track the state update context.

**Fix**: Wrapped callback invocation in `setTimeout(0)` to defer execution to a new event loop tick. This gives React time to properly set up its state update queues.

```typescript
// Before (broken)
await applyTacticCallback({ goalId, tacticType, params, tacticNodeId });

// After (fixed)
return new Promise((resolve) => {
  setTimeout(async () => {
    await applyTacticCallback!({ goalId, tacticType, params, tacticNodeId });
    resolve(true);
  }, 0);
});
```

---

## Status

- **Fix committed**: 4d585a5
- **Ready for re-test**: Yes

---

## Next Steps for Test Agent

Please re-run the test cases:
1. **TC1-Step3**: Enter parameter and click Apply
2. **TC4**: Drag tactic directly onto goal

If the React error is resolved, these should now work.

---

## Questions for Monitor

1. Should we add additional error handling or user feedback when tactic application fails?
2. Are there other places in the codebase using similar callback patterns that might need the same fix?
