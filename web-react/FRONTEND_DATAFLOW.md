# Pie Proof Editor — Frontend Data Flow (Runtime Rendering Order)

> For the high-level architecture overview, see [ARCHITECTURE.md](./ARCHITECTURE.md).
> For the original Chinese version of this document, see [FRONTEND_DATAFLOW_zh.md](./FRONTEND_DATAFLOW_zh.md).

## Table of Contents

- [Stage 0: Module Loading](#stage-0-module-loading)
- [Stage 1: React Tree Initial Render](#stage-1-react-tree-initial-render)
- [Stage 2: AppContent Initialization](#stage-2-appcontent-initialization)
- [Stage 3: User Selects Example](#stage-3-user-selects-example)
- [Stage 4: Start Proof Session](#stage-4-start-proof-session)
- [Stage 5: syncFromWorker — ProofTree to React Flow](#stage-5-syncfromworker)
- [Stage 6: React Flow Rendering](#stage-6-react-flow-rendering)
- [Stage 7: Drag & Drop Tactic](#stage-7-drag--drop-tactic)
- [Stage 8: triggerApplyTactic Callback](#stage-8-triggerapplytactic-callback)
- [Stage 9: Wire Connection (onConnect)](#stage-9-wire-connection)
- [Stage 10: AI Hint Flow](#stage-10-ai-hint-flow)
- [Stage 11: Undo/Redo](#stage-11-undoredo)
- [Stage 12: Subtree Collapse](#stage-12-subtree-collapse)
- [Stage 13: Proof Script Generation](#stage-13-proof-script-generation)

---

## Stage 0: Module Loading

```
Vite bundle loads
  ├── worker-client.ts executes immediately:
  │     ├── new ProofWorkerConstructor() → creates Web Worker thread
  │     └── Comlink.wrap<ProofWorkerAPI>() → creates typed proxy
  ├── Zustand stores created (proof-store, ui-store, hint-store, etc.)
  └── React.createRoot(document.getElementById('root'))
```

The worker starts in its own thread. All interpreter code (parser, typechecker, evaluator, ProofManager) is loaded inside the worker via dynamic `import()`.

## Stage 1: React Tree Initial Render

```
<StrictMode>
  <QueryClientProvider>           // react-query (5min staleTime)
    <TooltipProvider>             // Radix tooltip context
      <App>
        <AppContent>              // Main orchestration component
```

## Stage 2: AppContent Initialization

AppContent is the central coordinator:
- Holds `useProofSession()` hook (manages worker communication)
- Renders `ProofPicker` (example/claim selector) and `ProofCanvas` (graph editor)
- Passes `triggerApplyTactic` callback down to canvas components

## Stage 3: User Selects Example

1. User picks an example from `ProofPicker`
2. `example-store` updates with `{ sourceCode, claimName }`
3. `useProofSession().startSession(sourceCode, claimName)` is called

## Stage 4: Start Proof Session

```
startSession(sourceCode, claimName)
  → proofWorker.startSession(sourceCode, claimName)     // Comlink RPC
  → Worker: parse source → build Context → ProofManager.startProof()
  → Returns StartSessionResponse { sessionId, proofTree, globalContext, claimType }
  → proof-store.syncFromWorker(proofTree, sessionId, claimName, theorems)
  → metadata-store: setGlobalContext(), setClaimName(), setSourceCode()
```

## Stage 5: syncFromWorker

The pure function `convertProofTreeToReactFlow(proofTree)` transforms the protocol's `ProofTree` into React Flow nodes and edges:

1. **Calculate tree layout** — Compute subtree widths, assign (x, y) positions
2. **Traverse tree** — For each `GoalNode`:
   - Create a `GoalNode` (React Flow node) with status derived from `AppliedTactic.tacticType`
   - If `appliedTactic` exists → create `TacticNode` + edges to children
   - If `completedBy` exists → create completing `TacticNode`
3. **Merge with existing state** — Preserve manual positions, lemma nodes, custom edges
4. **Auto-collapse** — Collapse completed subtrees (if enabled)

## Stage 6: React Flow Rendering

React Flow renders three custom node types:
- **GoalNode** — Shows goal type, context variables, status badge (pending/in-progress/completed/todo)
- **TacticNode** — Shows tactic type and display name, delete button
- **GhostTacticNode** — Semi-transparent hint preview, clickable to apply

Edges connect goals → tactics → subgoals in a tree layout.

## Stage 7: Drag & Drop Tactic

1. User drags tactic from `LeftSidebar` palette
2. `ui-store.setDraggingTactic(tacticType)` highlights valid drop targets
3. User drops on a `GoalNode`
4. If tactic needs parameters → show parameter dialog
5. Call `triggerApplyTactic(goalId, tacticType, params)`

## Stage 8: triggerApplyTactic Callback

```
triggerApplyTactic(goalId, tacticType, params)
  → proofWorker.applyTactic(sessionId, goalId, tacticType, params)
  → Worker: create Tactic instance → ProofManager.applyTactic()
  → Returns ApplyTacticResponse { success, proofTree, error? }
  → If success: proof-store.syncFromWorker(proofTree, sessionId)
  → If error: display error toast
```

## Stage 9: Wire Connection

Users can also apply tactics by connecting nodes via drag-wires:
- **Goal → Tactic** — `goal-to-tactic` edge
- **Tactic → Goal** — `tactic-to-goal` edge (subgoal)
- **Lemma → Tactic** — `lemma-to-tactic` edge (for `apply`)
- **Context var → Tactic** — `context-to-tactic` edge (for elimination)

## Stage 10: AI Hint Flow

```
User clicks "Hint" on a GoalNode
  → hint-store.requestHint(goalId, level)
  → proofWorker.getHint({ sessionId, goalId, currentLevel, apiKey? })
  → Worker: rule-based analysis or Gemini API call
  → Returns HintResponse { level, tacticType?, parameters?, explanation }
  → hint-store creates ghost tactic node on canvas
  → User clicks ghost node → triggers applyTactic
```

Progressive levels: category → tactic → full (with params)

## Stage 11: Undo/Redo

- `saveSnapshot()` — Captures current `{ nodes, edges }` before mutations
- `undo()` / `redo()` — Navigate snapshot history
- `deleteTacticCascade()` auto-saves before deleting
- Keyboard: Ctrl+Z / Ctrl+Shift+Z

## Stage 12: Subtree Collapse

Completed subtrees auto-collapse to reduce visual clutter:
- `collapsedBranches: Set<string>` in proof-store tracks collapsed goal IDs
- `syncFromWorker` finds collapsible nodes (subtree complete + has descendants)
- Users can toggle collapse via goal node controls
- `expandAllBranches()` resets all collapse state

## Stage 13: Proof Script Generation

```
generateProofScript(proofTree, claimName)
  → Traverses tree depth-first
  → Emits (define-tactically claimName ...)
  → Multi-child nodes get (then ...) blocks
  → Uses AppliedTactic.displayString for tactic text
```

Available via `useGeneratedProofScript()` selector on proof-store.

---

## Data Flow Summary

```
 ┌──────────────┐     Comlink RPC      ┌──────────────────┐
 │   Frontend   │ ◄──────────────────► │   Proof Worker   │
 │  (React +    │                      │  (ProofManager)  │
 │   Zustand)   │                      └──────────────────┘
 └──────┬───────┘                              │
        │                                      │ protocol types
        │ syncFromWorker                       │ (ProofTree,
        │                                      │  AppliedTactic,
        ▼                                      │  TacticType)
 ┌──────────────┐                              │
 │  proof-store │ ◄────────────────────────────┘
 │  (nodes,     │
 │   edges)     │
 └──────┬───────┘
        │
        ▼
 ┌──────────────┐
 │  React Flow  │
 │  (canvas)    │
 └──────────────┘
```

## Core Design Decisions

1. **Worker isolation** — The interpreter runs in a Web Worker to keep the UI responsive. All `@pie/*` modules are dynamically imported inside the worker.

2. **Protocol-first** — All worker↔frontend communication uses serializable types from `@pie/protocol`. The frontend never touches `Value`, `Core`, or `Context` objects.

3. **Worker is truth** — The proof-store doesn't compute proof correctness. It trusts `isComplete`, `isSubtreeComplete`, and `AppliedTactic` from the worker. The next `syncFromWorker()` call always re-establishes truth.

4. **Structured tactics** — `AppliedTactic` carries `tacticType`, `params`, and `displayString`, eliminating the need for fragile string parsing in the frontend.

5. **Immer for immutability** — All Zustand stores use Immer middleware for safe, mutable-style updates to deeply nested state.
