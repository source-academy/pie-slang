# Current Task

## CURRENT STATUS
- Task ID: TASK-001
- Status: PLANNING
- Assigned To: Dev Agent
- Created: 2026-01-28 22:30
- Updated: 2026-01-28 22:30

---

## Task ID: TASK-001
## Priority: HIGH

## Description

Implement proper tactic application flow with manual edge-drawing support and correct goal generation logic.

### Core Requirements

**1. Manual Edge-Drawing Tactic Application**

Users should be able to:
- Drag a tactic node onto the canvas (creates standalone tactic node)
- Draw an edge connecting goal ↔ tactic
- Have tactic application triggered when connection is valid

**2. Proper Goal Creation Logic (IMPORTANT)**

New goals should ONLY be created when:
- All required parameters for the tactic are provided
  - For `intro`: variable name (can be from edge connection OR text input)
  - For `exact`/`exists`: expression (text input required)
  - For `elimNat`: target variable (from context, via edge or selection)
  - For parameterless tactics (`split`, `left`, `right`): immediately
- The tactic typechecks successfully against the goal
- The proof engine returns new subgoals

**Do NOT create goal nodes optimistically before validation.**

**3. Context Separation**

| Location | What to Show |
|----------|--------------|
| Goal Node Context | LOCAL variables only (introduced by intro, induction hypotheses, etc.) |
| Right Sidebar | Global definitions + proved theorems from source code |

Currently the goal node shows everything. Need to separate:
- `n : Nat` (from intro) → stays in goal context
- `my-claim : (Π ...)` (from source) → moves to sidebar
- `plus : (→ Nat Nat Nat)` (defined function) → sidebar
- `lemma1 : ...` (proved theorem) → sidebar

---

## Acceptance Criteria

### Edge-Drawing Flow
- [ ] User can drag tactic to canvas (creates tactic node)
- [ ] User can draw edge from goal handle to tactic node
- [ ] User can draw edge from tactic node to goal handle
- [ ] Edge creation triggers tactic validation (not immediate goal creation)
- [ ] If tactic needs parameters, prompt for them
- [ ] Only after all params + validation → create new goal nodes
- [ ] Error shown if tactic invalid for goal type

### Goal Creation Logic
- [ ] `intro` waits for variable name before creating child goal
- [ ] `exact`/`exists` waits for expression before attempting
- [ ] `elimNat`/`elimVec`/`elimEqual` waits for target selection
- [ ] `split`/`left`/`right` can apply immediately (no params)
- [ ] Failed tactic shows error, does NOT create partial goals
- [ ] Successful tactic creates all resulting subgoals at once

### Context Separation
- [ ] Goal node context shows ONLY local variables
- [ ] Right sidebar has "Definitions" section with global defs
- [ ] Right sidebar has "Theorems" section with proved claims
- [ ] Clicking sidebar item shows its type
- [ ] Can reference sidebar items in `exact` expressions

---

## Technical Design

### 1. Node Types

```typescript
// Goal Node - with connectable variable handles
interface GoalNodeData {
  goalId: string;
  type: string;           // The goal type to prove
  localContext: Array<{   // ONLY local bindings - each becomes a connectable handle
    id: string;           // Unique ID for edge connections
    name: string;
    type: string;
  }>;
  status: 'current' | 'pending' | 'completed';
}

// Tactic Node
interface TacticNodeData {
  tacticType: TacticType;
  parameters: {
    variableName?: string;    // For intro (text input)
    expression?: string;      // For exact, exists (text input)
    targetVariable?: string;  // For elimNat/elimVec/elimEqual (from edge connection)
    targetGoalId?: string;    // Which goal this applies to (from edge connection)
  };
  status: 'incomplete' | 'ready' | 'applied' | 'error';
  error?: string;
}

// Edge Types
type EdgeType =
  | 'goal-to-tactic'      // Goal → Tactic (apply tactic to goal)
  | 'variable-to-tactic'  // Context variable → Tactic (target for elimination)
```
```

### 2. Connection Flow

```
User draws edge (goal → tactic OR tactic → goal)
    │
    ▼
onConnect callback fires
    │
    ▼
Identify: which is goal, which is tactic?
    │
    ▼
Check: does tactic have all required params?
    │
    ├─ NO → Show param input UI, tactic status = 'incomplete'
    │
    └─ YES → Call proofWorker.applyTactic()
                │
                ├─ SUCCESS → Create child goal nodes
                │             Update parent goal status
                │             Tactic status = 'applied'
                │
                └─ FAILURE → Show error on tactic node
                             Tactic status = 'error'
                             Do NOT create any goals
```

### 3. Sidebar Component

```typescript
// New component: DefinitionsPanel.tsx
interface DefinitionsPanelProps {
  definitions: Array<{
    name: string;
    type: string;
    kind: 'definition' | 'theorem' | 'claim';
  }>;
  onSelect: (name: string) => void;  // For inserting into expressions
}
```

### 4. Worker API Changes

Current `startSession` returns `availableLemmas`. Enhance to:

```typescript
interface StartSessionResponse {
  sessionId: string;
  proofTree: SerializedProofTree;
  globalContext: {
    definitions: Array<{ name: string; type: string }>;
    theorems: Array<{ name: string; type: string }>;
  };
  claimType: string;
}
```

---

## Implementation Steps

### Step 1: Refactor Node Data Structures
- Update GoalNodeData to have `localContext` (not full context)
- Update TacticNodeData to track parameters and status
- Update store types

### Step 2: Implement Tactic Node Parameter UI
- TacticNode shows input field for variableName
- TacticNode shows input field for expression (exact/exists)
- Status indicator (incomplete/ready/applied/error)

### Step 3: Implement onConnect Handler
- Detect goal↔tactic connections
- Extract goal ID and tactic type
- Check parameter completeness
- Call worker or prompt for params

### Step 4: Implement Validated Goal Creation
- Only create goals on successful applyTactic
- Handle error responses gracefully
- Update all node statuses atomically

### Step 5: Implement Context Separation
- Modify worker to separate local vs global context
- Create DefinitionsPanel component
- Wire up sidebar display
- Allow clicking to insert into expressions

### Step 6: Update Existing Drag-Drop Flow
- Ensure drag-onto-goal still works
- Use same validation logic
- Consistent behavior between both flows

---

## Files to Modify

| File | Changes |
|------|---------|
| `web-react/src/features/proof-editor/store/types.ts` | Update node data types |
| `web-react/src/features/proof-editor/store/index.ts` | Update store logic |
| `web-react/src/features/proof-editor/components/nodes/GoalNode.tsx` | Local context only |
| `web-react/src/features/proof-editor/components/nodes/TacticNode.tsx` | Add param inputs, status |
| `web-react/src/features/proof-editor/components/ProofCanvas.tsx` | Add onConnect handler |
| `web-react/src/features/proof-editor/components/panels/DefinitionsPanel.tsx` | NEW: sidebar component |
| `web-react/src/workers/proof-worker.ts` | Separate local/global context |
| `web-react/src/app/App.tsx` | Wire up sidebar |

---

## Out of Scope

- Undo/redo functionality
- Proof persistence/saving
- New tactic types
- Proof search/automation

---

## User Decisions (Answered 2026-01-28)

1. **Target Selection**: Edge drawing - local variables in goal block are connectable handles. User draws edge from variable handle to tactic node.
2. **Sidebar**: Collapsible (can toggle open/closed)
3. **Proved Theorems**: Yes, immediately usable in subsequent proofs within same session

---

## Risks

1. **Complex state management**: Multiple node types with interdependent state
2. **Edge direction ambiguity**: Need clear visual indication of goal→tactic relationship
3. **Error recovery**: If tactic fails mid-way, ensure clean state
