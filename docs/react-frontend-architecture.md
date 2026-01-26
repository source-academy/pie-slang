# React Frontend Architecture for Interactive Proof System

## Overview

This document describes the architecture for rebuilding the pie-slang frontend using React and React Flow. The system enables visual proof construction through a node-based interface where users drag tactics onto goals to build proofs.

---

## Architecture Diagrams

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REACT FRONTEND                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │  ProofCanvas    │    │  Zustand Store  │    │  TanStack Query         │ │
│  │  (React Flow)   │◄──►│  (UI State)     │◄──►│  (Async State)          │ │
│  └─────────────────┘    └────────┬────────┘    └───────────┬─────────────┘ │
│                                  │                         │               │
│                                  │    Comlink Proxy        │               │
│                                  └─────────────┬───────────┘               │
└────────────────────────────────────────────────┼───────────────────────────┘
                                                 │
                                    ┌────────────▼────────────┐
                                    │     Web Worker          │
                                    │  ┌──────────────────┐   │
                                    │  │ ProofSession     │   │
                                    │  │ ├─ ProofManager  │   │
                                    │  │ ├─ ProofState    │   │
                                    │  │ └─ Context       │   │
                                    │  └──────────────────┘   │
                                    │           │             │
                                    │  ┌────────▼─────────┐   │
                                    │  │ Pie Typechecker  │   │
                                    │  │ ├─ Synthesizer   │   │
                                    │  │ ├─ Evaluator     │   │
                                    │  │ └─ Tactics       │   │
                                    │  └──────────────────┘   │
                                    └─────────────────────────┘
```

### Tactic Application Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TACTIC APPLICATION FLOW                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User drags tactic onto goal                                         │
│     │                                                                    │
│     ▼                                                                    │
│  2. TacticPalette.onDragEnd()                                           │
│     │                                                                    │
│     ▼                                                                    │
│  3. useApplyTactic.mutate({ goalId, tactic, params })                   │
│     │                                                                    │
│     ├──► 3a. onMutate: Optimistic update (status: 'in-progress')        │
│     │                                                                    │
│     ▼                                                                    │
│  4. proofWorker.applyTactic() ──────────────────────────────────────┐   │
│                                                                      │   │
│     ┌────────────────── WORKER ─────────────────────────────────────┐│   │
│     │                                                                ││   │
│     │  5. Lookup session from sessions Map                          ││   │
│     │     │                                                          ││   │
│     │     ▼                                                          ││   │
│     │  6. createTactic(type, params, goal)                          ││   │
│     │     │                                                          ││   │
│     │     ▼                                                          ││   │
│     │  7. proofManager.applyTactic(tactic)                          ││   │
│     │     │                                                          ││   │
│     │     ├──► 7a. tactic.apply(proofState)                         ││   │
│     │     │        │                                                 ││   │
│     │     │        ├──► Validate goal type                          ││   │
│     │     │        │                                                 ││   │
│     │     │        ├──► Create new GoalNode(s) with extended context││   │
│     │     │        │                                                 ││   │
│     │     │        └──► Update ProofState.currentGoal               ││   │
│     │     │                                                          ││   │
│     │     ▼                                                          ││   │
│     │  8. serializeProofTree(state) ──► ProofTreeData               ││   │
│     │                                                                ││   │
│     └────────────────────────────────────────────────────────────────┘│   │
│                                                                       │   │
│  9. ◄─────────────────────────────── TacticAppliedResponse ──────────┘   │
│     │                                                                    │
│     ▼                                                                    │
│  10. onSuccess: syncFromWorker(proofTree)                               │
│      │                                                                   │
│      ├──► convertProofTreeToReactFlow()                                 │
│      │    │                                                              │
│      │    ├──► Create GoalNode for each SerializableGoalNode            │
│      │    │                                                              │
│      │    ├──► Create TacticNode for each appliedTactic                 │
│      │    │                                                              │
│      │    └──► Create edges connecting Goal → Tactic → Goal             │
│      │                                                                   │
│      ▼                                                                   │
│  11. React Flow re-renders with new nodes/edges                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Worker Communication Strategies

#### Strategy A: Source-Based (Simple)

```
Frontend                           Worker
   │                                  │
   │ ──── startProof(source) ───────► │
   │                                  │  Parse source
   │                                  │  Build Context
   │                                  │  Find claim
   │ ◄─── ProofTreeData ───────────── │
   │                                  │
   │ ──── applyTactic(source') ─────► │  source' = source + "(intro n)"
   │                                  │  Re-parse everything
   │                                  │  Re-apply all tactics
   │ ◄─── ProofTreeData ───────────── │
```

**Pros**: Simpler, always consistent with source code
**Cons**: Slower for large proofs, redundant work

#### Strategy B: Session-Based (Recommended)

```
Frontend                           Worker
   │                                  │
   │ ──── startSession(source) ─────► │
   │                                  │  Parse source, build Context
   │                                  │  Create ProofSession
   │                                  │  Store: sessions[sessionId] = session
   │ ◄─── { sessionId, proofTree } ── │
   │                                  │
   │ ──── applyTactic(sessionId, ───► │
   │        goalId, tactic, params)   │  Lookup session
   │                                  │  Apply tactic incrementally
   │                                  │  Update ProofState
   │ ◄─── { proofTree, newGoals } ─── │
   │                                  │
   │ ──── undo(sessionId) ──────────► │
   │                                  │  Restore previous ProofState
   │ ◄─── { proofTree } ───────────── │
```

**Pros**: Fast incremental updates, supports undo/redo natively
**Cons**: More complex, session state management

### Directory Structure

```
web-react/
├── src/
│   ├── app/                          # Application shell
│   │   ├── App.tsx                   # Root component
│   │   ├── providers.tsx             # Context providers wrapper
│   │   └── routes.tsx                # Route definitions (if needed)
│   │
│   ├── features/                     # Feature modules (vertical slices)
│   │   ├── proof-editor/             # Main proof visualization
│   │   │   ├── components/           # React components
│   │   │   │   ├── ProofCanvas.tsx   # React Flow wrapper
│   │   │   │   ├── nodes/            # Custom node components
│   │   │   │   │   ├── GoalNode.tsx
│   │   │   │   │   ├── TacticNode.tsx
│   │   │   │   │   └── LemmaNode.tsx
│   │   │   │   ├── edges/            # Custom edge components
│   │   │   │   │   └── ProofEdge.tsx
│   │   │   │   ├── panels/           # Side panels
│   │   │   │   │   ├── TacticPalette.tsx
│   │   │   │   │   ├── ContextPanel.tsx
│   │   │   │   │   └── GoalDetails.tsx
│   │   │   │   └── dialogs/          # Modal dialogs
│   │   │   │       ├── TacticConfigDialog.tsx
│   │   │   │       └── VariableNameDialog.tsx
│   │   │   ├── hooks/                # Feature-specific hooks
│   │   │   │   ├── useProofStore.ts
│   │   │   │   ├── useTacticDrag.ts
│   │   │   │   └── useProofValidation.ts
│   │   │   ├── store/                # Zustand store slices
│   │   │   │   ├── proof-store.ts
│   │   │   │   ├── ui-store.ts
│   │   │   │   └── types.ts
│   │   │   ├── utils/                # Feature utilities
│   │   │   │   ├── layout.ts         # Auto-layout algorithms
│   │   │   │   └── validation.ts     # Tactic validation
│   │   │   └── index.ts              # Public API
│   │   │
│   │   └── code-editor/              # Monaco editor feature
│   │       ├── components/
│   │       │   └── CodeEditor.tsx
│   │       ├── hooks/
│   │       │   └── useEditorSync.ts
│   │       └── store/
│   │           └── editor-store.ts
│   │
│   ├── shared/                       # Shared utilities
│   │   ├── components/               # Reusable UI components
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   └── layout/               # Layout components
│   │   ├── hooks/                    # Shared hooks
│   │   │   └── useWorker.ts
│   │   ├── lib/                      # Utility libraries
│   │   │   ├── worker-client.ts      # Comlink worker setup
│   │   │   └── pie-types.ts          # Shared Pie types
│   │   └── styles/                   # Global styles
│   │       └── globals.css
│   │
│   ├── workers/                      # Web workers
│   │   ├── proof-worker.ts           # Main proof evaluation worker
│   │   └── diagnostics-worker.ts     # Code diagnostics worker
│   │
│   └── main.tsx                      # Entry point
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Technology Stack

### Core Framework
| Technology | Purpose | Why |
|------------|---------|-----|
| **React 18+** | UI Framework | Component model, hooks, concurrent features |
| **TypeScript** | Type Safety | Already used in project, essential for complex state |
| **Vite** | Build Tool | Fast HMR, native ESM, simpler than Rollup for React |

### State Management
| Technology | Purpose | Why |
|------------|---------|-----|
| **Zustand** | Global State | Recommended by React Flow, minimal boilerplate, works with immer |
| **Immer** | Immutable Updates | Clean state mutations, integrates with Zustand |

### UI Components
| Technology | Purpose | Why |
|------------|---------|-----|
| **React Flow** | Node Graph | Best-in-class node editor, excellent TypeScript support |
| **shadcn/ui** | UI Primitives | Accessible, customizable, copy-paste components |
| **Tailwind CSS** | Styling | Utility-first, works great with shadcn/ui |
| **Framer Motion** | Animations | Declarative animations, drag gestures |

### Editor Integration
| Technology | Purpose | Why |
|------------|---------|-----|
| **Monaco React** | Code Editor | React wrapper for Monaco, already familiar |

### Async & Communication
| Technology | Purpose | Why |
|------------|---------|-----|
| **Comlink** | Worker Communication | Proxy-based API for web workers, cleaner than postMessage |
| **TanStack Query** | Async State | Caching, loading states, error handling for worker calls |

---

## Summary

### Architecture Patterns Used

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Feature-Sliced Design** | Directory structure | Scalable module organization |
| **Flux/Unidirectional Flow** | Zustand store | Predictable state updates |
| **Immutable State** | Immer middleware | Safe mutations, easy undo/redo |
| **Command Pattern** | `applyTactic` action | Encapsulated, reversible operations |
| **Observer Pattern** | Zustand subscriptions | Reactive UI updates |
| **Composition** | Custom nodes | Reusable, testable components |

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Zustand over Redux** | Simpler, less boilerplate, React Flow recommends it |
| **Comlink for workers** | Cleaner async API than raw postMessage |
| **shadcn/ui** | Accessible, customizable, no vendor lock-in |
| **Vite over Rollup** | Better DX for React development |
| **Feature folders** | Co-locate related code, easier to maintain |
| **Session-based communication** | Enables incremental updates without re-parsing source |
| **Worker as source of truth** | Typechecker state is authoritative; UI syncs from it |
| **Optimistic updates** | Better UX - show immediate feedback while worker processes |
| **TanStack Query for caching** | Handles loading/error states, caches context queries |
| **Bidirectional sync** | UI → Worker (apply tactic), Worker → UI (sync state) |

### Dynamic Block Support

The architecture handles dynamic blocks through:
- `applyTactic` action creates new goal nodes based on tactic output
- Zustand's immer middleware makes nested updates clean
- Auto-layout utility repositions tree after changes
- React Flow's built-in change handlers manage node/edge lifecycle

### Error Handling Strategy

```typescript
// Types of errors and how they're handled:

// 1. Validation errors (before applying)
//    → Show inline on tactic palette, prevent drop

// 2. Type errors (during application)
//    → Worker returns success: false
//    → UI shows error on tactic node
//    → Goal reverts to 'pending' status

// 3. Session errors (session not found)
//    → UI prompts to restart session

// 4. Worker crash
//    → TanStack Query retry mechanism
//    → After max retries, show error banner
```

---

## Core Data Types

### Node Types (React Flow)

```typescript
// src/features/proof-editor/store/types.ts

import { Node, Edge } from '@xyflow/react';

// ============================================
// Context & Scope Types
// ============================================

export interface ContextEntry {
  id: string;
  name: string;           // Variable name (e.g., "n")
  type: string;           // Type expression (e.g., "Nat")
  origin: 'inherited' | 'introduced';
  introducedBy?: string;  // Tactic node ID that introduced this
}

// ============================================
// Node Data Types
// ============================================

export interface GoalNodeData {
  kind: 'goal';
  goalType: string;           // The type to prove
  context: ContextEntry[];    // Scoped context for this goal
  status: 'pending' | 'in-progress' | 'completed';
  parentGoalId?: string;      // For scope inheritance
  completedBy?: string;       // Tactic that solved this goal
}

export interface TacticNodeData {
  kind: 'tactic';
  tacticType: TacticType;
  displayName: string;
  parameters: TacticParameters;
  isConfigured: boolean;      // All required params filled
  isValid: boolean;           // Type-checks against input goal
  errorMessage?: string;
}

export interface LemmaNodeData {
  kind: 'lemma';
  name: string;
  type: string;
  source: 'definition' | 'claim' | 'proven';
}

// ============================================
// Tactic Types
// ============================================

export type TacticType =
  | 'intro'
  | 'exact'
  | 'split'
  | 'left'
  | 'right'
  | 'elimNat'
  | 'elimList'
  | 'elimVec'
  | 'elimEither'
  | 'elimEqual'
  | 'elimAbsurd'
  | 'apply';

export interface TacticParameters {
  variableName?: string;      // For intro
  targetContextId?: string;   // For elim tactics
  expression?: string;        // For exact
  lemmaId?: string;           // For apply
}

// ============================================
// React Flow Node Union Types
// ============================================

export type GoalNode = Node<GoalNodeData, 'goal'>;
export type TacticNode = Node<TacticNodeData, 'tactic'>;
export type LemmaNode = Node<LemmaNodeData, 'lemma'>;

export type ProofNode = GoalNode | TacticNode | LemmaNode;

// ============================================
// Edge Types
// ============================================

export interface ProofEdgeData {
  kind: 'goal-to-tactic' | 'tactic-to-goal' | 'lemma-to-tactic';
  outputIndex?: number;       // Which output port of tactic
}

export type ProofEdge = Edge<ProofEdgeData>;

// ============================================
// Handle (Port) Types
// ============================================

export type HandleType = 'goal-input' | 'goal-output' | 'theorem-input' | 'theorem-output';
```

### Store Types

```typescript
// src/features/proof-editor/store/types.ts (continued)

export interface ProofState {
  // React Flow state
  nodes: ProofNode[];
  edges: ProofEdge[];

  // Proof metadata
  rootGoalId: string | null;
  selectedNodeId: string | null;
  isProofComplete: boolean;

  // History for undo/redo
  history: ProofSnapshot[];
  historyIndex: number;

  // UI state
  draggingTactic: TacticType | null;
  hoveredNodeId: string | null;
  validDropTargets: string[];       // Goal IDs that accept current drag
}

export interface ProofSnapshot {
  nodes: ProofNode[];
  edges: ProofEdge[];
  timestamp: number;
}

// Actions
export interface ProofActions {
  // Node operations
  addGoalNode: (goal: GoalNodeData, position: { x: number; y: number }) => string;
  addTacticNode: (tactic: TacticNodeData, position: { x: number; y: number }) => string;
  updateNode: <T extends ProofNode>(id: string, data: Partial<T['data']>) => void;
  removeNode: (id: string) => void;

  // Edge operations
  connectNodes: (sourceId: string, targetId: string, data: ProofEdgeData) => void;

  // Tactic application (main operation)
  applyTactic: (goalId: string, tacticType: TacticType, params: TacticParameters) => Promise<void>;

  // History
  undo: () => void;
  redo: () => void;

  // Selection
  selectNode: (id: string | null) => void;

  // Drag state
  setDraggingTactic: (type: TacticType | null) => void;
  setValidDropTargets: (goalIds: string[]) => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}
```

---

## Worker API Types

```typescript
// src/shared/lib/proof-worker-api.ts

import type { TacticType, TacticParameters } from '@/features/proof-editor/store/types';

// ============================================
// Session Types
// ============================================

export interface ProofSession {
  id: string;
  claimName: string;
  sourceCode: string;
  proofManager: ProofManager;      // From Pie interpreter
  context: Context;                 // Global definitions context
  history: ProofStateSnapshot[];    // For undo/redo
  historyIndex: number;
}

// ============================================
// Request Types (Frontend → Worker)
// ============================================

export interface StartSessionRequest {
  type: 'startSession';
  sourceCode: string;
  claimName: string;
}

export interface ApplyTacticRequest {
  type: 'applyTactic';
  sessionId: string;
  goalId: string;
  tactic: TacticType;
  parameters: TacticParameters;
}

export interface UndoRequest {
  type: 'undo';
  sessionId: string;
}

export interface RedoRequest {
  type: 'redo';
  sessionId: string;
}

export interface ValidateTacticRequest {
  type: 'validateTactic';
  sessionId: string;
  goalId: string;
  tactic: TacticType;
}

export interface GetContextEntriesRequest {
  type: 'getContextEntries';
  sessionId: string;
  goalId: string;
  filterType?: string;  // e.g., "Nat" to get only Nat-typed entries
}

export interface CloseSessionRequest {
  type: 'closeSession';
  sessionId: string;
}

export type WorkerRequest =
  | StartSessionRequest
  | ApplyTacticRequest
  | UndoRequest
  | RedoRequest
  | ValidateTacticRequest
  | GetContextEntriesRequest
  | CloseSessionRequest;

// ============================================
// Response Types (Worker → Frontend)
// ============================================

export interface SerializableContextEntry {
  id: string;
  name: string;
  type: string;              // Pretty-printed type
  binderKind: 'free' | 'claim' | 'define';
  introducedBy?: string;     // Tactic that introduced this
}

export interface SerializableGoal {
  id: string;
  type: string;              // Pretty-printed goal type
  context: SerializableContextEntry[];
  isComplete: boolean;
  isCurrent: boolean;
  parentId?: string;
}

export interface SerializableGoalNode {
  goal: SerializableGoal;
  children: SerializableGoalNode[];
  appliedTactic?: string;    // Tactic name that created children
  completedBy?: string;      // Tactic name that solved this leaf
}

export interface ProofTreeData {
  root: SerializableGoalNode;
  isComplete: boolean;
  currentGoalId: string | null;
  pendingGoalIds: string[];  // All unsolved goal IDs
}

export interface StartSessionResponse {
  type: 'sessionStarted';
  sessionId: string;
  proofTree: ProofTreeData;
  claimType: string;
  availableLemmas: SerializableLemma[];
}

export interface TacticAppliedResponse {
  type: 'tacticApplied';
  success: boolean;
  proofTree: ProofTreeData;
  newGoals: SerializableGoal[];      // Goals created by tactic
  removedGoalId: string;              // Goal that was solved/transformed
  message?: string;                   // User-facing message
  error?: string;                     // Error if success=false
  generatedCode?: string;             // Tactic code to insert in source
}

export interface ValidationResponse {
  type: 'validationResult';
  valid: boolean;
  reason?: string;
  suggestedParams?: TacticParameters;  // Auto-fill suggestions
}

export interface ContextEntriesResponse {
  type: 'contextEntries';
  entries: SerializableContextEntry[];
}

export interface ErrorResponse {
  type: 'error';
  message: string;
  details?: string;
}

export type WorkerResponse =
  | StartSessionResponse
  | TacticAppliedResponse
  | ValidationResponse
  | ContextEntriesResponse
  | ErrorResponse;

// ============================================
// Lemma Types (for global theorems panel)
// ============================================

export interface SerializableLemma {
  name: string;
  type: string;
  source: 'definition' | 'claim' | 'proven';
  category?: string;  // e.g., "Nat", "List", "Equality"
}
```

---

## Implementation Details

### Zustand Store Implementation

```typescript
// src/features/proof-editor/store/proof-store.ts

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Connection
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import type {
  ProofState,
  ProofActions,
  ProofNode,
  GoalNode,
  TacticNode,
  TacticParameters,
  TacticType,
  ContextEntry
} from './types';
import { proofWorker } from '@/shared/lib/worker-client';

type ProofStore = ProofState & ProofActions;

// Selector for React Flow integration
export const useProofNodes = () => useProofStore((s) => s.nodes);
export const useProofEdges = () => useProofStore((s) => s.edges);

export const useProofStore = create<ProofStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      rootGoalId: null,
      selectedNodeId: null,
      isProofComplete: false,
      history: [],
      historyIndex: -1,
      draggingTactic: null,
      hoveredNodeId: null,
      validDropTargets: [],

      // ================================================
      // Node Operations
      // ================================================

      addGoalNode: (data, position) => {
        const id = `goal-${nanoid(8)}`;
        set((state) => {
          const node: GoalNode = {
            id,
            type: 'goal',
            position,
            data,
          };
          state.nodes.push(node);
          if (!state.rootGoalId) {
            state.rootGoalId = id;
          }
        });
        return id;
      },

      addTacticNode: (data, position) => {
        const id = `tactic-${nanoid(8)}`;
        set((state) => {
          const node: TacticNode = {
            id,
            type: 'tactic',
            position,
            data,
          };
          state.nodes.push(node);
        });
        return id;
      },

      updateNode: (id, data) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id);
          if (node) {
            Object.assign(node.data, data);
          }
        });
      },

      removeNode: (id) => {
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== id);
          state.edges = state.edges.filter(
            (e) => e.source !== id && e.target !== id
          );
        });
      },

      // ================================================
      // Edge Operations
      // ================================================

      connectNodes: (sourceId, targetId, data) => {
        set((state) => {
          state.edges.push({
            id: `edge-${nanoid(8)}`,
            source: sourceId,
            target: targetId,
            data,
          });
        });
      },

      // ================================================
      // Main Tactic Application Logic
      // ================================================

      applyTactic: async (goalId, tacticType, params) => {
        const state = get();
        const goalNode = state.nodes.find(
          (n): n is GoalNode => n.id === goalId && n.type === 'goal'
        );

        if (!goalNode) {
          throw new Error(`Goal node ${goalId} not found`);
        }

        // Save snapshot for undo
        get().saveSnapshot();

        // Get tactic position (below the goal)
        const tacticPosition = {
          x: goalNode.position.x,
          y: goalNode.position.y + 150,
        };

        // Create tactic node
        const tacticId = get().addTacticNode(
          {
            kind: 'tactic',
            tacticType,
            displayName: tacticType,
            parameters: params,
            isConfigured: true,
            isValid: true,
          },
          tacticPosition
        );

        // Connect goal to tactic
        get().connectNodes(goalId, tacticId, { kind: 'goal-to-tactic' });

        // Mark goal as in-progress
        get().updateNode(goalId, { status: 'in-progress' });

        try {
          // Call worker to apply tactic
          const result = await proofWorker.applyTactic({
            goalType: goalNode.data.goalType,
            context: goalNode.data.context,
            tactic: tacticType,
            parameters: params,
          });

          if (result.success) {
            // Mark original goal as completed
            get().updateNode(goalId, {
              status: 'completed',
              completedBy: tacticId
            });

            // Create new goal nodes for each subgoal
            result.newGoals.forEach((newGoal, index) => {
              const newGoalPosition = {
                x: goalNode.position.x + (index - (result.newGoals.length - 1) / 2) * 250,
                y: tacticPosition.y + 150,
              };

              const newGoalId = get().addGoalNode(
                {
                  kind: 'goal',
                  goalType: newGoal.type,
                  context: [
                    ...goalNode.data.context.map(c => ({ ...c, origin: 'inherited' as const })),
                    ...newGoal.newContextEntries,
                  ],
                  status: 'pending',
                  parentGoalId: goalId,
                },
                newGoalPosition
              );

              // Connect tactic to new goal
              get().connectNodes(tacticId, newGoalId, {
                kind: 'tactic-to-goal',
                outputIndex: index
              });
            });

            // Check if proof is complete
            get().checkProofComplete();
          } else {
            // Mark tactic as invalid
            get().updateNode(tacticId, {
              isValid: false,
              errorMessage: result.error
            });
            get().updateNode(goalId, { status: 'pending' });
          }
        } catch (error) {
          get().updateNode(tacticId, {
            isValid: false,
            errorMessage: String(error)
          });
          get().updateNode(goalId, { status: 'pending' });
        }
      },

      // ================================================
      // History (Undo/Redo)
      // ================================================

      saveSnapshot: () => {
        set((state) => {
          const snapshot = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
            timestamp: Date.now(),
          };
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(snapshot);
          state.historyIndex = state.history.length - 1;
        });
      },

      undo: () => {
        set((state) => {
          if (state.historyIndex > 0) {
            state.historyIndex -= 1;
            const snapshot = state.history[state.historyIndex];
            state.nodes = snapshot.nodes;
            state.edges = snapshot.edges;
          }
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex < state.history.length - 1) {
            state.historyIndex += 1;
            const snapshot = state.history[state.historyIndex];
            state.nodes = snapshot.nodes;
            state.edges = snapshot.edges;
          }
        });
      },

      // ================================================
      // Sync from Worker
      // ================================================

      syncFromWorker: (proofTree, sessionId) => {
        set((state) => {
          const { nodes, edges } = convertProofTreeToReactFlow(proofTree);
          state.nodes = nodes;
          state.edges = edges;
          state.sessionId = sessionId;
          state.rootGoalId = proofTree.root.goal.id;
          state.isProofComplete = proofTree.isComplete;
          state.lastSyncedState = { nodes, edges };
        });
      },

      // ================================================
      // Selection & Drag State
      // ================================================

      selectNode: (id) => set((state) => { state.selectedNodeId = id; }),
      setDraggingTactic: (type) => set((state) => { state.draggingTactic = type; }),
      setValidDropTargets: (goalIds) => set((state) => { state.validDropTargets = goalIds; }),

      // ================================================
      // React Flow Handlers
      // ================================================

      onNodesChange: (changes) => {
        set((state) => {
          state.nodes = applyNodeChanges(changes, state.nodes) as ProofNode[];
        });
      },

      onEdgesChange: (changes) => {
        set((state) => {
          state.edges = applyEdgeChanges(changes, state.edges);
        });
      },

      onConnect: (connection) => {
        const state = get();
        const sourceNode = state.nodes.find((n) => n.id === connection.source);
        const targetNode = state.nodes.find((n) => n.id === connection.target);
        if (sourceNode && targetNode && isValidConnection(sourceNode, targetNode)) {
          get().connectNodes(connection.source!, connection.target!, {
            kind: getConnectionKind(sourceNode, targetNode),
          });
        }
      },

      checkProofComplete: () => {
        set((state) => {
          const pendingGoals = state.nodes.filter(
            (n): n is GoalNode => n.type === 'goal' && n.data.status === 'pending'
          );
          state.isProofComplete = pendingGoals.length === 0;
        });
      },
    }))
  )
);
```

### Frontend Hooks (TanStack Query Integration)

```typescript
// src/features/proof-editor/hooks/useProofSession.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { proofWorker } from '@/shared/lib/worker-client';
import { useProofStore } from '../store/proof-store';
import type { TacticType, TacticParameters } from '../store/types';

export function useProofSession() {
  const queryClient = useQueryClient();
  const syncFromWorker = useProofStore((s) => s.syncFromWorker);

  const startSession = useMutation({
    mutationFn: async ({ sourceCode, claimName }: {
      sourceCode: string;
      claimName: string;
    }) => {
      return proofWorker.startSession(sourceCode, claimName);
    },
    onSuccess: (response) => {
      syncFromWorker(response.proofTree, response.sessionId);
      queryClient.setQueryData(['lemmas', response.sessionId], response.availableLemmas);
    },
  });

  return { startSession };
}

export function useApplyTactic(sessionId: string) {
  const { updateNodeOptimistic, revertOptimisticUpdate, syncFromWorker } = useProofStore();

  return useMutation({
    mutationFn: async ({ goalId, tactic, parameters }: {
      goalId: string;
      tactic: TacticType;
      parameters: TacticParameters;
    }) => {
      return proofWorker.applyTactic(sessionId, goalId, tactic, parameters);
    },
    onMutate: async ({ goalId }) => {
      const previousState = useProofStore.getState();
      updateNodeOptimistic(goalId, { status: 'in-progress' });
      return { previousState };
    },
    onSuccess: (response) => {
      if (response.success) {
        syncFromWorker(response.proofTree, sessionId);
      } else {
        revertOptimisticUpdate();
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousState) {
        useProofStore.setState(context.previousState);
      }
    },
  });
}

export function useGoalContext(sessionId: string, goalId: string, filterType?: string) {
  return useQuery({
    queryKey: ['goalContext', sessionId, goalId, filterType],
    queryFn: () => proofWorker.getContextEntries(sessionId, goalId, filterType),
    enabled: !!sessionId && !!goalId,
    staleTime: Infinity,
  });
}
```

### Auto-Layout Utility

```typescript
// src/features/proof-editor/utils/layout.ts

import type { ProofNode, ProofEdge } from '../store/types';

interface LayoutOptions {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalSpacing: 50,
  verticalSpacing: 100,
};

export function calculateTreeLayout(
  nodes: ProofNode[],
  edges: ProofEdge[],
  rootId: string,
  options: Partial<LayoutOptions> = {}
): Map<string, { x: number; y: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const positions = new Map<string, { x: number; y: number }>();

  const children = new Map<string, string[]>();
  edges.forEach((edge) => {
    const existing = children.get(edge.source) || [];
    existing.push(edge.target);
    children.set(edge.source, existing);
  });

  interface TreeNode {
    id: string;
    children: TreeNode[];
    width: number;
    x: number;
    y: number;
  }

  function buildTree(nodeId: string, depth: number): TreeNode {
    const childIds = children.get(nodeId) || [];
    const childTrees = childIds.map((id) => buildTree(id, depth + 1));
    const childrenWidth = childTrees.reduce(
      (sum, child) => sum + child.width + opts.horizontalSpacing,
      -opts.horizontalSpacing
    );
    return {
      id: nodeId,
      children: childTrees,
      width: Math.max(opts.nodeWidth, childrenWidth),
      x: 0,
      y: depth * (opts.nodeHeight + opts.verticalSpacing),
    };
  }

  function positionTree(tree: TreeNode, leftBound: number): void {
    if (tree.children.length === 0) {
      tree.x = leftBound + tree.width / 2;
    } else {
      let currentLeft = leftBound;
      tree.children.forEach((child) => {
        positionTree(child, currentLeft);
        currentLeft += child.width + opts.horizontalSpacing;
      });
      const firstChild = tree.children[0];
      const lastChild = tree.children[tree.children.length - 1];
      tree.x = (firstChild.x + lastChild.x) / 2;
    }
    positions.set(tree.id, { x: tree.x, y: tree.y });
  }

  const tree = buildTree(rootId, 0);
  positionTree(tree, 0);
  return positions;
}
```

---

## Recommended Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@xyflow/react": "^12.0.0",
    "zustand": "^4.5.0",
    "immer": "^10.0.0",
    "comlink": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "framer-motion": "^11.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0",
    "@monaco-editor/react": "^4.6.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```
