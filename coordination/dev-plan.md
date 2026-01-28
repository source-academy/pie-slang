# Development Plan

## CURRENT STATUS
- Task: TASK-001
- Status: **APPROVED** ✅
- Created: 2026-01-28 22:45
- Updated: 2026-01-28 23:00
- Approved by: Monitor Agent

---

## Task

**Proper tactic application + context separation** - Three core requirements:
1. Manual edge-drawing tactic application
2. Validated goal creation (only after worker confirmation)
3. Context separation (local vars in goal, globals in sidebar)

## Analysis

### Current Architecture Issues

**Issue 1: Optimistic goal creation**
- Current drag-drop flow creates tactic nodes and can show temporary state before validation
- Need to wait for worker response before creating child goal nodes

**Issue 2: No edge-triggered tactic application**
- `onConnect` in proof-store creates visual edges but doesn't trigger applyTactic
- Need to detect goal↔tactic connections and initiate the application flow

**Issue 3: Context mixed together**
- GoalNode shows all context entries (local + global)
- Need to separate: local variables in goal node, global definitions in sidebar

### Key Files Analysis

| File | Current State | Needed Changes |
|------|---------------|----------------|
| `proof-store.ts` | `onConnect` creates edges only | Add tactic application trigger |
| `GoalNode.tsx` | Shows all context, has drop handler | Show local context only |
| `TacticNode.tsx` | Basic display | Add parameter inputs, status indicator |
| `ProofCanvas.tsx` | Wraps React Flow, handles drops | Handle edge-triggered tactic flow |
| `proof-worker.ts` | Returns full context | Separate local vs global context |
| (new) `DefinitionsPanel.tsx` | N/A | New sidebar component for globals |

### Connection Flow Design

```
User draws edge (goal → tactic OR tactic → goal)
    │
    ▼
onConnect callback in ProofCanvas
    │
    ▼
Identify goal node and tactic node from connection
    │
    ▼
Check: does tactic have all required parameters?
    │
    ├─ NO → Mark tactic as 'incomplete'
    │        Show parameter input UI on tactic node
    │        Wait for user input
    │
    └─ YES → Call proofWorker.applyTactic()
                │
                ├─ SUCCESS → Create child goal nodes
                │             Update parent goal status = 'completed'
                │             Tactic status = 'applied'
                │
                └─ FAILURE → Show error on tactic node
                             Tactic status = 'error'
                             Do NOT create any goals
```

## Files to Modify

### Phase A: Core Tactic Flow

1. **`web-react/src/features/proof-editor/store/types.ts`**
   - Add `status` field to TacticNodeData: `'incomplete' | 'ready' | 'applied' | 'error'`
   - Add `connectedGoalId` to track which goal the tactic is connected to
   - Add `error` field to TacticNodeData

2. **`web-react/src/features/proof-editor/components/nodes/TacticNode.tsx`**
   - Add parameter input fields (variableName, expression)
   - Add status indicator (incomplete/ready/applied/error)
   - Add error display
   - Handle parameter submission

3. **`web-react/src/features/proof-editor/components/ProofCanvas.tsx`**
   - Create custom `handleConnect` that wraps store's onConnect
   - Detect goal↔tactic connections
   - Trigger tactic application flow
   - Handle parameter-required cases

4. **`web-react/src/features/proof-editor/store/proof-store.ts`**
   - Add action to update tactic node status
   - Add action to handle validated tactic application (create goals only on success)

### Phase B: Context Separation

5. **`web-react/src/workers/proof-worker.ts`**
   - Modify `startSession` to return separate `globalContext`
   - Modify goal serialization to include only local context

6. **`web-react/src/features/proof-editor/components/nodes/GoalNode.tsx`**
   - Filter context to show only local variables (origin: 'introduced')
   - Remove global definitions from display

7. **`web-react/src/features/proof-editor/components/panels/DefinitionsPanel.tsx`** (NEW)
   - Create new sidebar component
   - Display global definitions grouped by type
   - Display proved theorems
   - Make items clickable to copy name for expressions
   - **Show full type signature on click/hover** (per acceptance criteria)

8. **`web-react/src/app/App.tsx`**
   - Add DefinitionsPanel to right side or integrate into DetailPanel
   - Pass global context data

## Implementation Steps

### Step 1: Update Type Definitions
Add necessary fields to TacticNodeData for tracking status and parameters.

**Files**: `store/types.ts`
**Testable**: TypeScript compiles without errors

### Step 2: Implement TacticNode Parameter UI
Add input fields and status display to TacticNode component.

**Files**: `components/nodes/TacticNode.tsx`
**Testable**: Tactic nodes show input fields when dropped on canvas

### Step 3: Implement onConnect Handler for Edge-Drawing
Detect goal↔tactic connections and initiate tactic flow.

**Files**: `components/ProofCanvas.tsx`, `store/proof-store.ts`
**Testable**: Drawing edge from goal to tactic triggers parameter prompt or application

### Step 4: Implement Validated Goal Creation
Only create child goals after worker returns success.

**Files**: `store/proof-store.ts`, `hooks/useProofSession.ts`
**Testable**: Goals only appear after successful tactic application; errors show on tactic node

### Step 5: Implement Context Separation in Worker
Modify worker to separate local vs global context.

**Files**: `workers/proof-worker.ts`
**Testable**: Worker returns separate `globalContext` in session response

### Step 6: Create DefinitionsPanel Component
New sidebar component showing global definitions and theorems.

**Files**: `components/panels/DefinitionsPanel.tsx`, `App.tsx`
**Testable**: Sidebar shows definitions from source code

### Step 7: Update GoalNode Context Display
Filter to show only local variables.

**Files**: `components/nodes/GoalNode.tsx`
**Testable**: Goal nodes show only variables introduced by tactics, not globals

### Step 8: Ensure Existing Flow Still Works
Verify drag-onto-goal still works correctly with new validation logic.

**Files**: `components/nodes/GoalNode.tsx`
**Testable**: Dragging tactic onto goal still applies it correctly

## Testing Notes

### For Test Agent to Verify

**Edge-Drawing Flow:**
1. Drag `intro` tactic to canvas → tactic node appears with "incomplete" status
2. Draw edge from goal to tactic → parameter input appears
3. Enter variable name → tactic applies, child goal created
4. Verify parent goal shows "completed"

**Parameterless Tactics:**
1. Drag `split` tactic to canvas
2. Connect to a Pair-type goal
3. Should apply immediately → two child goals created

**Error Handling:**
1. Connect `split` to non-Pair goal
2. Error should display on tactic node
3. No child goals should be created

**Context Separation:**
1. Start proof session with source code containing definitions
2. Apply `intro` tactic
3. Goal node should show only introduced variable (e.g., `n : Nat`)
4. Sidebar should show global definitions (e.g., `plus : → Nat Nat Nat`)

**Existing Drag-Drop:**
1. Drag tactic directly onto goal (not canvas)
2. Should still work as before

## Risks/Concerns

1. **State Complexity**: Tactic nodes now have multiple status states that must stay in sync with worker responses.

2. **Race Conditions**: User might draw multiple edges quickly; need to handle gracefully.

3. **UI Layout**: Adding parameter inputs to TacticNode increases node size; may need layout adjustments.

4. **Worker Changes**: Separating context requires modifying the serialization logic in proof-worker.

## Questions Answered (from current-task.md)

1. **Target Selection for elimNat**: Edge drawing - user draws edge from variable handle to tactic
2. **Sidebar Collapsible**: Yes
3. **Proved Theorems**: Immediately usable in same session

## Estimated Complexity

| Step | Complexity | Notes |
|------|------------|-------|
| 1 | Low | Type changes only |
| 2 | Medium | UI work, state management |
| 3 | Medium-High | Core logic change |
| 4 | Medium | Refactor existing flow |
| 5 | Medium | Worker modification |
| 6 | Medium | New component |
| 7 | Low | Filter existing data |
| 8 | Low | Regression testing |

Total: 8 steps across 2 phases
