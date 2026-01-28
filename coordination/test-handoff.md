# Test → Dev Handoff

## Handoff: Test Agent → Dev Agent
**Time**: 2026-01-28 21:20
**Task**: TASK-001 Phase A Bug Fix

---

## What I Tested

### TC1: Edge-Drawing Flow
1. **Drag intro to canvas** → ✅ WORKS
   - Tactic node created at drop location
   - Shows "needs config" status badge (yellow)
   - Parameter input UI visible ("variable name" field + "Apply" button)
   - Tactic Details panel updates on right side

2. **Enter parameter and Apply** → ❌ FAILS
   - Entered "m" in variable name field
   - Clicked "Apply" button
   - **RESULT**: React error thrown, no tactic applied

### TC4: Existing Drag-Drop
- Dragged `intro` directly onto pending goal (Pi type)
- **RESULT**: No visible effect - tactic not applied

---

## The Bug

### Error Message
```
Error: Should have a queue. This is likely a bug in React. Please file an issue.
```

### Stack Trace (Key Parts)
```
at updateReducer (chunk-FAWBQZYC.js:11778)
at updateState (chunk-FAWBQZYC.js:12069)
at useState (chunk-FAWBQZYC.js:12801)
at useProofSession (useProofSession.ts:9)    ← YOUR CODE
at AppContent (App.tsx:29)                    ← YOUR CODE
```

### Trigger
The error occurs when:
1. A tactic node exists on canvas
2. User clicks "Apply" button
3. (Possibly also when drag-onto-goal triggers apply)

### What This Error Usually Means
"Should have a queue" typically indicates:
- State update happening during render phase
- Hook called in wrong order or conditionally
- Missing/stale closure capturing old state
- Concurrent state updates without batching

---

## Files to Investigate

### Primary: `useProofSession.ts`
Line 9 is where the error originates. Check:
- How is `useState` being used?
- Is there a state update in the render path?
- Are there multiple rapid state updates that need batching?

### Secondary: `App.tsx`
Line 29 calls `useProofSession`. Check:
- Is the hook being called conditionally?
- Are there any effects that update state synchronously?

### Related: Tactic Application Flow
- `ProofCanvas.tsx` - handles Apply button click
- `proof-store.ts` - manages tactic state
- `tactic-callback.ts` - shared callback module

---

## What's Working (Don't Break These)

1. **Tactic drag to canvas**
   - Creates standalone tactic node
   - Shows "needs config" status
   - Parameter input UI renders

2. **UI Rendering**
   - Proof tree displays correctly
   - Goal nodes show "Local Context" label
   - Tactic palette renders all tactics
   - Details panel updates on selection

3. **HMR/Dev Server**
   - Hot reload working
   - No build errors

---

## Suggested Fix Approach

1. **Read `useProofSession.ts`** - understand current implementation
2. **Check for state updates in render** - wrap in useEffect if needed
3. **Check for conditional hooks** - hooks must be called unconditionally
4. **Add console.log** before the useState to trace when error occurs
5. **Test the Apply button** after fix

---

## Re-Testing Plan

Once bug is fixed, I will:

1. **Hard refresh** the page
2. **Test TC1 full flow**:
   - Drag intro to canvas
   - Connect to goal via edge (or via Apply)
   - Enter parameter
   - Click Apply
   - Verify child goal created OR error displayed

3. **Test TC4**:
   - Drag intro onto Pi-type goal
   - Verify modal/parameter input appears
   - Complete tactic application

4. **Test TC3 (Error handling)**:
   - Apply wrong tactic to goal
   - Verify error shown on tactic node
   - Verify no partial goals created

---

## Communication

When you've fixed the bug:
1. Update `CURRENT_STATE.md`:
   - Phase: `TESTING`
   - Dev Agent: "Bug fixed, ready for re-test"
2. Commit with message: `fix: React state error in useProofSession`
3. I will automatically detect the change and re-test

---

## Questions for Dev

1. Is `useProofSession` a new hook added in Phase A?
2. Does the Apply button call a function that updates state synchronously?
3. Is there shared state between multiple components that might race?

---

**Test Agent Status**: Waiting for bug fix, monitoring CURRENT_STATE.md
