# Development Plan

## CURRENT STATUS
- Task: TASK-001
- Status: DRAFT
- Created: 2026-01-28 21:00

---

## Task
**Manual edge-drawing tactic application** - Enable tactic application when user draws an edge between a goal node and a tactic node (instead of only via drag-drop onto goal).

## Analysis

### Current Architecture

**Working flow (drag-onto-goal):**
1. User drags tactic from TacticPalette → drops onto GoalNode
2. GoalNode's `handleDrop` extracts tactic type from dataTransfer
3. For simple tactics: calls `globalApplyTacticCallback(goalId, tacticType)`
4. For parameterized tactics: shows inline modal, then calls callback with params
5. App.tsx's `handleApplyTactic` calls `proofWorker.applyTactic()`
6. Worker returns new proof tree → store syncs via `syncFromWorker()`

**Current edge-drawing flow (incomplete):**
1. User drags tactic from TacticPalette → drops onto canvas (not on goal)
2. ProofCanvas's `onDrop` creates a TacticNode at drop position
3. User draws edge from GoalNode to TacticNode using React Flow handles
4. proof-store's `onConnect` creates visual edge **but does NOT call applyTactic**

### Key Discovery

The `onConnect` handler in `proof-store.ts` (lines 253-264) currently:
- Finds source and target nodes
- Determines edge type via `getConnectionData()`
- Calls `connectNodes()` to add the edge visually
- **Missing**: Does not trigger tactic application

The challenge is that `globalApplyTacticCallback` is set in GoalNode.tsx and used there, but the store's `onConnect` doesn't have access to it.

### Solution Approach

**Option chosen: Handle edge-triggered tactic application in ProofCanvas.tsx**

Rationale:
- ProofCanvas already receives `onConnect` from the store
- We can wrap it with additional logic before/after
- Keep architecture consistent - tactic application flows through App.tsx callback
- Avoid circular dependencies between store and GoalNode

## Files to Modify

1. **`web-react/src/features/proof-editor/components/ProofCanvas.tsx`**
   - Add custom `onConnect` wrapper that detects goal↔tactic connections
   - When detected, extract goal ID and tactic type
   - Call the apply tactic callback (need to pass it down or import)

2. **`web-react/src/features/proof-editor/components/nodes/GoalNode.tsx`**
   - Export the `globalApplyTacticCallback` getter for use by ProofCanvas
   - OR: Move callback registration to a shared module

3. **`web-react/src/app/App.tsx`**
   - May need to pass `handleApplyTactic` to ProofCanvas as prop
   - OR: Create a shared callback registration module

4. **`web-react/src/features/proof-editor/store/proof-store.ts`**
   - Potentially add a method to get tactic data from a tactic node

## Implementation Steps

### Step 1: Create shared callback module
Create a new file `web-react/src/features/proof-editor/utils/tactic-callback.ts` to hold the apply tactic callback. This avoids the current pattern of having it in GoalNode.tsx.

**Changes:**
- New file with `setApplyTacticCallback` and `getApplyTacticCallback` functions
- Update GoalNode.tsx to import from this module
- Update App.tsx to use this module

### Step 2: Modify ProofCanvas.tsx to handle edge-triggered tactic application
Wrap the `onConnect` handler to detect goal↔tactic connections and trigger tactic application.

**Changes:**
- Import the callback getter
- Create `handleConnect` wrapper that:
  1. Calls the store's `onConnect` to create the visual edge
  2. Checks if connection is goal→tactic or tactic→goal
  3. If yes, extracts goalId and tacticType from nodes
  4. Checks if tactic needs parameters
  5. For simple tactics: calls applyTactic immediately
  6. For parameterized tactics: needs parameter input (see Step 3)

### Step 3: Handle parameterized tactics via edge connection
When a parameterized tactic (exact, exists, elimNat, etc.) is connected via edge, we need to prompt for parameters.

**Approach:**
- Add state in ProofCanvas for pending edge-triggered tactic
- Show a modal/dialog when parameters are needed
- On submit, call applyTactic with params
- On cancel, remove the edge

**Changes:**
- Add state: `pendingEdgeTactic: { goalId, tacticNodeId, tacticType } | null`
- Add parameter input modal (can reuse pattern from GoalNode)
- Handle submit/cancel

### Step 4: Update goal node status on edge connection
When edge is drawn and tactic is being applied, the goal should show "in-progress" status.

**Changes:**
- Update goal node data when tactic application starts
- Handle success/failure states

### Step 5: Error handling
If tactic application fails, show error and potentially remove the invalid edge.

**Changes:**
- On applyTactic error, update tactic node to show error
- Optionally remove the edge or mark it as invalid

## Testing Notes

For Test Agent to verify:

1. **Basic edge drawing works:**
   - Drag `intro` tactic to canvas → creates tactic node
   - Draw edge from goal to tactic → tactic applies, new goals appear

2. **Parameterized tactics prompt for input:**
   - Drag `exact` tactic to canvas
   - Draw edge from goal to tactic → modal appears asking for expression
   - Enter expression, submit → tactic applies

3. **Error handling:**
   - Draw edge with invalid tactic (e.g., `split` on non-Pair goal)
   - Error should display on tactic node

4. **Existing drag-drop still works:**
   - Drag tactic directly onto goal → should still work as before

5. **Both directions work:**
   - Goal → Tactic edge
   - Tactic → Goal edge (if allowed by `isValidConnection`)

## Risks/Concerns

1. **Modal/dialog placement**: Need to decide where parameter input modal appears when triggered by edge connection (not inside a node like current GoalNode approach).

2. **Race conditions**: If user draws edge while another tactic is being applied, need to handle gracefully.

3. **Undo behavior**: Should undo remove the edge AND revert the tactic application? Current history system may need verification.

## Questions for User

1. **Parameter input UX**: When drawing an edge to a parameterized tactic, should the modal appear:
   - (A) As a floating dialog near the tactic node (recommended)
   - (B) In a fixed position panel
   - (C) Inline in the tactic node itself

2. **Edge direction**: Should we allow both goal→tactic AND tactic→goal edges, or enforce one direction?

3. **Immediate application**: Should tactic apply immediately when edge is drawn (for simple tactics), or should there be a "confirm" step?
