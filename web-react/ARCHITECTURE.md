# Frontend Architecture

The Pie proof editor frontend is a React + Vite application that provides a visual, graph-based interface for constructing proofs in Pie's tactic system.

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **@xyflow/react (React Flow) v12** — Graph-based canvas for proof tree visualization
- **Zustand 5** + **Immer** — State management (7 stores)
- **Comlink** — Web Worker RPC (interpreter runs off-main-thread)
- **Vite 6** — Build tool with custom alias plugin for `@pie/*` imports
- **Vitest** — Test runner (extends Vite config)

## Store Architecture

All stores are in `src/features/proof-editor/store/`:

| Store | Responsibility |
|-------|---------------|
| **proof-store** | Proof canvas state: React Flow nodes/edges, positions, branch collapse, undo/redo snapshots. The single source of truth for what's displayed on canvas. |
| **hint-store** | Progressive hint system: manages hint requests, ghost tactic nodes, hint level progression (category → tactic → full). |
| **metadata-store** | Session metadata: global context (definitions, theorems), claim name, source code. Shared across all hook instances. |
| **ui-store** | Transient UI state: selected node, drag state, hover targets, delete confirmation dialog. |
| **goal-description-store** | Cached AI-generated goal descriptions with loading/error states per goal ID. |
| **example-store** | Selected example proof data (source code, claim name) for the proof picker. |
| **history-store** | (Undo/redo is integrated into proof-store via `saveSnapshot`/`undo`/`redo`.) |

### Data Flow: Worker → Store → Canvas

```
User applies tactic
  → useProofSession.applyTactic()
  → Comlink RPC to proof-worker.ts
  → ProofManager.applyTactic() (interpreter)
  → Returns ProofTree (protocol types)
  → proof-store.syncFromWorker()
  → convertProofTreeToReactFlow() (pure transform)
  → React Flow renders nodes/edges
```

Key principle: **the worker is the source of truth** for proof state. The frontend never mutates proof logic — it only transforms worker output into visual representation.

## Worker Bridge

The interpreter runs in a Web Worker (`src/workers/proof-worker.ts`) exposed via Comlink:

- **`startSession(sourceCode, claimName)`** — Parse source, build context, initialize ProofManager
- **`applyTactic(sessionId, goalId, tacticType, params)`** — Apply tactic, return updated ProofTree
- **`getHint(request)`** — Generate progressive hint (rule-based or AI-powered)
- **`scanFile(sourceCode)`** — Scan for claims, theorems, definitions (multi-proof support)

The worker dynamically imports `@pie/*` modules to keep the main thread free. Session state is stored in a `Map<string, ProofSession>` inside the worker.

## Protocol Contract

All communication between worker and frontend uses types from `@pie/protocol` (`src/pie-interpreter/protocol.ts`). Key types:

- **`ProofTree`** — Complete proof tree with `GoalNode` hierarchy
- **`AppliedTactic`** — Structured tactic info (`tacticType`, `params`, `displayString`)
- **`TacticType`** — Union of all supported tactic identifiers
- **`TACTIC_REQUIREMENTS`** — Which parameters each tactic requires

Frontend code **must not** import interpreter internals (`@pie/evaluator/*`, `@pie/types/value`, etc.). This is enforced by ESLint rules and architecture tests.

## Hint System

The hint system provides progressive assistance:

1. **Category hint** — "Try an elimination tactic" (cheapest)
2. **Tactic hint** — "Try elimNat" (reveals specific tactic)
3. **Full hint** — "elimNat n" with parameters (most specific)

Implementation:
- `useHintSystem` hook manages the hint lifecycle
- `hint-store` tracks current hint level, ghost nodes, and loading state
- Ghost nodes are semi-transparent tactic nodes rendered on the canvas
- Two backends: rule-based (pattern matching on goal type) and AI-powered (Google Gemini API)

## React Flow Node Types

Three custom node types registered with React Flow:

- **GoalNode** — Proof obligation with type, context, status badge
- **TacticNode** — Applied tactic with type label and parameters
- **GhostTacticNode** — Transparent hint preview (clickable to apply)
- **LemmaNode** — Available theorem/definition for `apply` tactic

## Testing

```bash
cd web-react && npx vitest run     # Run all frontend tests
```

Test categories:
- **Unit tests** — Pure function tests for `convert-proof-tree.ts`, `generate-proof-script.ts`
- **Store tests** — Zustand store behavior (sync, delete cascade, undo/redo)
- **Architecture tests** — Enforce no banned imports, tactic list completeness

## Directory Structure

```
web-react/src/
├── app/                    # App shell, routing
├── features/
│   └── proof-editor/
│       ├── components/     # React components (canvas, nodes, panels)
│       │   ├── nodes/      # GoalNode, TacticNode, GhostTacticNode
│       │   └── panels/     # LeftSidebar, DefinitionsPanel
│       ├── data/           # Static tactic catalog
│       ├── hooks/          # useProofSession, useHintSystem
│       ├── store/          # Zustand stores
│       └── utils/          # Pure transforms (convert-proof-tree, generate-proof-script)
├── shared/lib/             # Worker client setup
└── workers/                # Web Workers (proof, diagnostics)
```
