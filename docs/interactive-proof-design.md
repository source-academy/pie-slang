# Interactive Proof Visualization - Design Document

## Overview

This document describes the design for a node-based interactive proof visualization system. The system allows users to construct proofs by connecting **Goals**, **Theorems**, and **Tactics** in a visual dataflow graph.

## Core Concepts

### The Scope Problem

Free variables introduced by tactics have **lexical scope**. A variable introduced by `intro n` is only available in the subgoals created by that tactic, not globally.

```
Goal: (Π ((n Nat)) (Π ((m Nat)) (= Nat (+ n m) (+ m n))))

After (intro n):
  └─► n : Nat is NOW IN SCOPE
  └─► New goal: (Π ((m Nat)) (= Nat (+ n m) (+ m n)))

      After (intro m):
        └─► m : Nat is NOW IN SCOPE (n still available)
        └─► New goal: (= Nat (+ n m) (+ m n))
            └─► Can use both n and m here
```

### Solution: Context-Embedded Goals + Global Lemmas

Instead of representing all theorems as separate connectable blocks, we distinguish:

1. **Local Context** - Variables/hypotheses scoped to a goal (embedded in goal block)
2. **Global Lemmas** - Proven theorems usable anywhere (separate blocks)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BLOCK TYPES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────┐   ┌──────────────┐   ┌────────────────┐ │
│  │    GOAL                │   │ GLOBAL LEMMA │   │     TACTIC     │ │
│  │                        │   │              │   │                │ │
│  │  Type: (= Nat n m)     │   │ name : Type  │   │  ┌──┐    ┌──┐ │ │
│  │  ────────────────────  │   │              │   │  │in│ ─► │out│ │ │
│  │  Context (scoped):     │   │  [Green]     │   │  └──┘    └──┘ │ │
│  │    • n : Nat           │   │  (no scope   │   │  [Blue]       │ │
│  │    • m : Nat           │   │   limit)     │   │               │ │
│  │    • ih : (P n)        │   │              │   │               │ │
│  │                        │   │              │   │               │ │
│  │  [Orange]              │   └──────────────┘   └────────────────┘ │
│  └────────────────────────┘                                         │
│                                                                      │
│  • Context is EMBEDDED     • Can connect to    • Transforms goals   │
│    in the goal block        ANY tactic          using context       │
│  • Shows what's available   (globally scoped)                       │
│    for THIS goal only                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Three Block Types (Revised)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  1. GOAL BLOCK (with embedded context)                              │
│  ┌────────────────────────────────────┐                             │
│  │  GOAL                              │                             │
│  │  ──────────────────────────────    │                             │
│  │  Type: (= Nat (+ n m) (+ m n))     │                             │
│  │  ──────────────────────────────    │                             │
│  │  Context:                          │  ◄── Scoped to this goal    │
│  │    ○ n : Nat                       │      (selectable for        │
│  │    ○ m : Nat                       │       tactic inputs)        │
│  │    ○ plus-comm : (∀ a b ...)       │                             │
│  │                                    │                             │
│  │            [●]                     │  ◄── Output port            │
│  └────────────────────────────────────┘                             │
│                                                                      │
│  2. GLOBAL LEMMA BLOCK (no scope restriction)                       │
│  ┌────────────────────────────────────┐                             │
│  │  LEMMA                             │                             │
│  │  ──────────────────────────────    │                             │
│  │  plus-zero                         │                             │
│  │  : (Π ((n Nat)) (= Nat (+ n 0) n)) │                             │
│  │                                    │                             │
│  │            [●]                     │  ◄── Can connect anywhere   │
│  └────────────────────────────────────┘                             │
│                                                                      │
│  3. TACTIC BLOCK                                                    │
│  ┌────────────────────────────────────┐                             │
│  │       [●]         [●]              │  ◄── Input: goal + selection│
│  │  ──────────────────────────────    │                             │
│  │  TACTIC: elimNat                   │                             │
│  │  ──────────────────────────────    │                             │
│  │  Target: n (from context)          │  ◄── Selected from goal's   │
│  │                                    │      context                │
│  │       [●]         [●]              │  ◄── Outputs: new goals     │
│  └────────────────────────────────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Block Details

#### Goal Block (with Embedded Context)
```
┌─────────────────────────────────┐
│  GOAL                    [?]    │  ◄── Status: unsolved
│  ───────────────────────────    │
│  Type: (= Nat (+ n m) (+ m n))  │
│  ───────────────────────────    │
│  Context (scoped):              │
│    ◉ n : Nat                    │  ◄── Selectable items
│    ○ m : Nat                    │      (◉ = selected)
│    ○ ih : (P k)                 │
│                                 │
│            [●]                  │  ◄── output port
└─────────────────────────────────┘
```

- **Color**: Orange (unsolved), Green (solved)
- **Content**:
  - Goal type to prove
  - **Embedded context** - all variables/hypotheses in scope
- **Ports**: One output port (bottom)
- **Behavior**:
  - Cannot be dragged
  - Context items are **selectable** for tactic inputs
  - Created by system (root) or by tactics (subgoals)
- **Context Inheritance**:
  - Child goals inherit parent's context
  - Plus any new variables introduced by the tactic

#### Global Lemma Block
```
┌─────────────────────────────────┐
│  LEMMA                   [✓]    │  ◄── Proven/available
│  ───────────────────────────    │
│  plus-comm                      │
│  : (Π ((n Nat) (m Nat))         │
│      (= Nat (+ n m) (+ m n)))   │
│                                 │
│            [●]                  │  ◄── output port
└─────────────────────────────────┘
```

- **Color**: Green
- **Content**: Lemma name and type
- **Ports**: One output port (bottom)
- **Behavior**:
  - Cannot be dragged (fixed in lemma panel)
  - Can connect to ANY tactic (no scope restriction)
- **Sources**:
  - Definitions from source code (`define`, `claim`)
  - Previously proven theorems

#### Tactic Block
```
┌─────────────────────────────────────────┐
│       [●]                               │  ◄── Goal input port
│  ───────────────────────────────────    │
│  TACTIC: elimNat                        │
│  ───────────────────────────────────    │
│  Target: [n ▼] (select from context)    │  ◄── Dropdown selector
│  ───────────────────────────────────    │
│    [●]              [●]                 │  ◄── Output: 2 new goals
│  (base case)    (step case)             │
└─────────────────────────────────────────┘
```

- **Color**: Blue
- **Content**: Tactic name, parameter selectors
- **Ports**:
  - Input port (top): Accepts ONE goal
  - Output ports (bottom): Produces new goals with extended context
- **Behavior**:
  - **Draggable** from palette
  - Parameters selected from connected goal's context
  - Validates that selected items have correct types
- **Context Flow**:
  - Reads context from input goal
  - Extends context for output goals (adds new variables)

## Scope and Context Inheritance

### How Context Flows Through the Proof

```
┌─────────────────────────────────────────────────────────────────────┐
│  SCOPE INHERITANCE DIAGRAM                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┐                                    │
│  │ GOAL (root)                 │                                    │
│  │ Type: Π(n:Nat).Π(m:Nat).P   │                                    │
│  │ Context: (empty)            │                                    │
│  └──────────────┬──────────────┘                                    │
│                 │                                                    │
│                 ▼                                                    │
│  ┌─────────────────────────────┐                                    │
│  │ TACTIC: intro               │                                    │
│  │ Parameter: n                │                                    │
│  └──────────────┬──────────────┘                                    │
│                 │                                                    │
│                 │  ADDS: n : Nat to context                         │
│                 ▼                                                    │
│  ┌─────────────────────────────┐                                    │
│  │ GOAL                        │                                    │
│  │ Type: Π(m:Nat).P            │                                    │
│  │ Context:                    │                                    │
│  │   • n : Nat  ◄── inherited  │                                    │
│  └──────────────┬──────────────┘                                    │
│                 │                                                    │
│                 ▼                                                    │
│  ┌─────────────────────────────┐                                    │
│  │ TACTIC: intro               │                                    │
│  │ Parameter: m                │                                    │
│  └──────────────┬──────────────┘                                    │
│                 │                                                    │
│                 │  ADDS: m : Nat to context                         │
│                 ▼                                                    │
│  ┌─────────────────────────────┐                                    │
│  │ GOAL                        │                                    │
│  │ Type: P                     │                                    │
│  │ Context:                    │                                    │
│  │   • n : Nat  ◄── inherited  │                                    │
│  │   • m : Nat  ◄── new        │                                    │
│  └─────────────────────────────┘                                    │
│                                                                      │
│  n and m are ONLY available in this subtree!                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Branching and Scope Isolation

When a tactic creates multiple subgoals (like `split` or `elimNat`), each branch has its own scope:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────────────────┐                                    │
│  │ GOAL                        │                                    │
│  │ Type: (Pair A B)            │                                    │
│  │ Context: x : Nat            │                                    │
│  └──────────────┬──────────────┘                                    │
│                 │                                                    │
│                 ▼                                                    │
│  ┌─────────────────────────────┐                                    │
│  │ TACTIC: split               │                                    │
│  └──────────┬─────────┬────────┘                                    │
│             │         │                                              │
│    ┌────────┘         └────────┐                                    │
│    ▼                           ▼                                    │
│  ┌─────────────────┐   ┌─────────────────┐                          │
│  │ GOAL (left)     │   │ GOAL (right)    │                          │
│  │ Type: A         │   │ Type: B         │                          │
│  │ Context:        │   │ Context:        │                          │
│  │   • x : Nat     │   │   • x : Nat     │  ◄── Both inherit x      │
│  └─────────────────┘   └─────────────────┘                          │
│                                                                      │
│  Both branches see x, but they are INDEPENDENT scopes.              │
│  Variables added in left branch are NOT visible in right branch.    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Elimination Tactics Add Multiple Variables

```
┌─────────────────────────────────────────────────────────────────────┐
│  elimNat SCOPE EXAMPLE                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┐                                    │
│  │ GOAL                        │                                    │
│  │ Type: (P n)                 │                                    │
│  │ Context:                    │                                    │
│  │   • n : Nat                 │                                    │
│  └──────────────┬──────────────┘                                    │
│                 │                                                    │
│                 ▼                                                    │
│  ┌─────────────────────────────┐                                    │
│  │ TACTIC: elimNat             │                                    │
│  │ Target: n                   │                                    │
│  └──────────┬─────────┬────────┘                                    │
│             │         │                                              │
│    ┌────────┘         └────────┐                                    │
│    ▼                           ▼                                    │
│  ┌─────────────────┐   ┌─────────────────────────┐                  │
│  │ GOAL (base)     │   │ GOAL (step)             │                  │
│  │ Type: (P zero)  │   │ Type: (P (add1 k))      │                  │
│  │ Context:        │   │ Context:                │                  │
│  │   (no n here!)  │   │   • k : Nat      ◄─ NEW │                  │
│  └─────────────────┘   │   • ih : (P k)   ◄─ NEW │                  │
│                        └─────────────────────────┘                  │
│                                                                      │
│  Note: n is REPLACED, not inherited. k and ih are fresh variables.  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Scoping Rules

| Rule | Description |
|------|-------------|
| **Inheritance** | Child goals inherit all context from parent |
| **Addition** | Tactics can add new variables to child context |
| **Replacement** | Elim tactics may replace the eliminated variable |
| **Isolation** | Sibling branches have independent scopes |
| **No leaking** | Variables cannot escape their subtree |

## Tactic Specifications

Each tactic has a fixed structure defining its inputs and outputs:

### Tactic: `intro`
```
Input:  1 Goal (Π type or → type)
Output: 1 Goal (body with variable in context)
        1 Theorem (the introduced variable)

Example:
  Goal: (Π ((n Nat)) (= Nat n n))
  Parameter: n
  ───────────────────────────────
  New Goal: (= Nat n n)
  New Theorem: n : Nat
```

### Tactic: `exact`
```
Input:  1 Goal
        1 Theorem (matching type)
Output: (none - goal is solved)

Example:
  Goal: Nat
  Theorem: n : Nat
  ───────────────────────────────
  Goal solved!
```

### Tactic: `split`
```
Input:  1 Goal (Pair or Σ type)
Output: 2 Goals (left and right components)

Example:
  Goal: (Pair Nat Nat)
  ───────────────────────────────
  New Goal 1: Nat (first)
  New Goal 2: Nat (second)
```

### Tactic: `left` / `right`
```
Input:  1 Goal (Either type)
Output: 1 Goal (chosen side)

Example:
  Goal: (Either Nat Atom)
  Tactic: left
  ───────────────────────────────
  New Goal: Nat
```

### Tactic: `elimNat`
```
Input:  1 Goal
        1 Theorem (n : Nat to eliminate)
Output: 2 Goals (base case, step case)
        2 Theorems (in step: n-1, inductive hypothesis)

Example:
  Goal: (P n)
  Theorem: n : Nat
  ───────────────────────────────
  New Goal 1: (P zero)           [base case]
  New Goal 2: (P (add1 n-1))     [step case]
  New Theorem (in step): n-1 : Nat
  New Theorem (in step): ih : (P n-1)
```

### Tactic: `elimList`
```
Input:  1 Goal
        1 Theorem (xs : List E)
Output: 2 Goals (nil case, cons case)
        3 Theorems (in cons: head, tail, IH)
```

### Tactic: `elimEither`
```
Input:  1 Goal
        1 Theorem (e : Either A B)
Output: 2 Goals (left case, right case)
        2 Theorems (one in each branch)
```

### Tactic: `elimEqual`
```
Input:  1 Goal
        1 Theorem (eq : (= T a b))
Output: 1 Goal (with b replaced by a)
```

### Tactic: `elimAbsurd`
```
Input:  1 Goal (any type)
        1 Theorem (x : Absurd)
Output: (none - goal is solved)
```

### Tactic: `apply`
```
Input:  1 Goal
        1 Theorem (function type that returns goal type)
Output: N Goals (one for each argument needed)

Example:
  Goal: (= Nat n n)
  Theorem: same : (Π ((A U) (a A)) (= A a a))
  ───────────────────────────────
  New Goal 1: U        (for A)
  New Goal 2: ?A       (for a, where ?A is solved)
```

## Visual Layout

### Proof Tree Structure

```
                    ┌─────────────────┐
                    │   MAIN GOAL     │
                    │   (Π (n Nat)    │
                    │     (P n))      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  TACTIC: intro  │
                    │  param: n       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              │
        ┌──────────┐  ┌──────────┐         │
        │  GOAL    │  │ THEOREM  │         │
        │  (P n)   │  │ n : Nat  │         │
        └────┬─────┘  └────┬─────┘         │
             │              │              │
             └──────┬───────┘              │
                    │                      │
           ┌────────▼────────┐             │
           │ TACTIC: elimNat │◄────────────┘
           │ target: n       │
           └────────┬────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
   ┌──────────┐         ┌──────────┐
   │  GOAL    │         │  GOAL    │
   │ (P zero) │         │(P (add1  │
   │          │         │   n-1)) │
   └──────────┘         └────┬─────┘
                             │
                    (+ theorems n-1, ih)
```

### Connection Rules

1. **Goal → Tactic**: Goal output connects to tactic's goal input
2. **Theorem → Tactic**: Theorem output connects to tactic's theorem input
3. **Tactic → Goal**: Tactic produces new goals at output ports
4. **Tactic → Theorem**: Tactic produces new theorems at output ports

### Port Types

```
Port Colors:
  ○ Orange = Goal port
  ○ Green  = Theorem port
  ○ Blue   = Any (accepts both)

Connection Validation:
  - Goal ports only accept goals
  - Theorem ports only accept theorems
  - Type checking validates compatibility
```

## User Interaction

### Workflow (Revised for Scoping)

1. **Start**: System creates main goal from claim (empty context)
2. **Select goal**: Click on an unsolved goal to work on
3. **Drag tactic**: Drag tactic from palette onto the goal
4. **Configure tactic**:
   - For `intro`: Enter variable name
   - For `elimNat/elimList/etc`: Select target from goal's context dropdown
   - For `exact`: Select term from context or enter expression
   - For `apply`: Select lemma from global lemmas panel
5. **Apply**: Tactic creates new goals with extended context
6. **Repeat**: Continue until all goals are solved

### Selecting from Context

When a tactic needs a context item (like `elimNat` needs a Nat to eliminate):

```
┌─────────────────────────────────────────────────────────────────────┐
│  CONTEXT SELECTION UI                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────┐                                    │
│  │ GOAL                        │                                    │
│  │ Type: (P n)                 │                                    │
│  │ Context:                    │                                    │
│  │   • n : Nat     [Select]    │  ◄── Clickable/selectable          │
│  │   • m : Nat     [Select]    │                                    │
│  │   • h : (Q m)   [Select]    │                                    │
│  └──────────────┬──────────────┘                                    │
│                 │                                                    │
│                 ▼                                                    │
│  ┌─────────────────────────────┐                                    │
│  │ TACTIC: elimNat             │                                    │
│  │ ─────────────────────────── │                                    │
│  │ Target: [n ▼]               │  ◄── Dropdown populated from       │
│  │         ┌─────────┐         │      goal's context (Nat only)     │
│  │         │ n : Nat │         │                                    │
│  │         │ m : Nat │         │                                    │
│  │         └─────────┘         │                                    │
│  └─────────────────────────────┘                                    │
│                                                                      │
│  The dropdown ONLY shows items from the connected goal's context    │
│  that match the required type (Nat for elimNat).                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Interaction Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CANVAS                                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │     [Goals and Theorems are FIXED in position]              │    │
│  │     [Tactics can be DRAGGED and DROPPED]                    │    │
│  │                                                              │    │
│  │     Connection: Click output port → Click input port         │    │
│  │                 OR drag from port to port                    │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────┐                                               │
│  │  TACTIC PALETTE  │  ◄── Drag tactics from here                   │
│  │  ──────────────  │                                               │
│  │  • intro         │                                               │
│  │  • exact         │                                               │
│  │  • split         │                                               │
│  │  • left/right    │                                               │
│  │  • elimNat       │                                               │
│  │  • elimList      │                                               │
│  │  • ...           │                                               │
│  └──────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Add tactic | Drag from palette | Creates tactic node on canvas |
| Connect | Click port → click port | Creates edge between blocks |
| Disconnect | Click edge + delete | Removes connection |
| Configure | Double-click tactic | Opens parameter dialog |
| Delete tactic | Select + delete key | Removes tactic and its outputs |
| Pan canvas | Middle-drag or space+drag | Moves view |
| Zoom | Scroll wheel | Zooms in/out |

## Data Model

### TypeScript Interfaces

```typescript
// Block types (revised for scoping)
type BlockKind = 'goal' | 'lemma' | 'tactic';

interface Position {
  x: number;
  y: number;
}

// Context entry (scoped to a goal)
interface ContextEntry {
  id: string;
  name: string;           // Variable name (e.g., "n")
  type: string;           // Type (e.g., "Nat")
  origin: 'inherited' | 'introduced';  // How it entered scope
  introducedBy?: string;  // Tactic ID that introduced it
}

// Goal block - contains its own scoped context
interface GoalBlock {
  kind: 'goal';
  id: string;
  type: string;              // The type to prove
  context: ContextEntry[];   // SCOPED context - only for this goal
  parentGoalId?: string;     // For scope inheritance tracking
  isSolved: boolean;
  position: Position;
  outputPort: PortId;
}

// Global lemma block - no scope restriction
interface LemmaBlock {
  kind: 'lemma';
  id: string;
  name: string;           // Lemma name (e.g., "plus-comm")
  type: string;           // The type/statement
  source: 'definition' | 'claim' | 'proven';
  position: Position;
  outputPort: PortId;
}

// Tactic block - transforms goals
interface TacticBlock {
  kind: 'tactic';
  id: string;
  tacticType: TacticType;
  // Parameters reference context entries by ID
  parameters: {
    name?: string;                    // For intro: variable name
    targetContextId?: string;         // For elim: which context entry
    expression?: string;              // For exact: the term
    lemmaId?: string;                 // For apply: which lemma
  };
  position: Position;
  inputPort: PortId;       // Single goal input
  outputPorts: PortId[];   // Multiple goal outputs
}

type Block = GoalBlock | LemmaBlock | TacticBlock;

// Port for connections
interface Port {
  id: PortId;
  blockId: string;
  kind: 'input' | 'output';
  accepts: 'goal' | 'theorem' | 'any';
  position: 'top' | 'bottom';
  index: number;  // Position among ports of same kind
}

// Edge connecting two ports
interface Edge {
  id: string;
  sourcePort: PortId;  // Output port (goal/theorem)
  targetPort: PortId;  // Input port (tactic)
}

// Full proof graph
interface ProofGraph {
  blocks: Map<string, Block>;
  ports: Map<PortId, Port>;
  edges: Edge[];
  rootGoalId: string;
}

// Tactic specification
interface TacticSpec {
  type: TacticType;
  displayName: string;
  description: string;
  inputs: {
    goals: number | 'any';     // Number of goal inputs
    theorems: number | 'any';  // Number of theorem inputs
  };
  outputs: {
    goals: number | 'dynamic';     // Number of goal outputs
    theorems: number | 'dynamic';  // Number of theorem outputs
  };
  parameters: ParameterSpec[];
}
```

### Tactic Specifications

```typescript
const TACTIC_SPECS: Record<TacticType, TacticSpec> = {
  intro: {
    type: 'intro',
    displayName: 'intro',
    description: 'Introduce a variable from Π/→ type',
    inputs: { goals: 1, theorems: 0 },
    outputs: { goals: 1, theorems: 1 },
    parameters: [{ name: 'varName', type: 'identifier', required: true }]
  },
  exact: {
    type: 'exact',
    displayName: 'exact',
    description: 'Solve goal with exact term',
    inputs: { goals: 1, theorems: 1 },
    outputs: { goals: 0, theorems: 0 },
    parameters: []
  },
  split: {
    type: 'split',
    displayName: 'split',
    description: 'Split Pair/Σ into two goals',
    inputs: { goals: 1, theorems: 0 },
    outputs: { goals: 2, theorems: 0 },
    parameters: []
  },
  // ... etc
};
```

## Implementation Plan

### Phase 1: Core Data Model
- [ ] Define TypeScript interfaces for blocks, ports, edges
- [ ] Implement ProofGraph class with CRUD operations
- [ ] Add validation for connections

### Phase 2: Rendering
- [ ] Create SVG-based block renderers (Goal, Theorem, Tactic)
- [ ] Implement port rendering with hit detection
- [ ] Add edge rendering with bezier curves

### Phase 3: Interaction
- [ ] Implement drag-and-drop for tactics
- [ ] Add port-to-port connection via click or drag
- [ ] Create tactic parameter dialogs

### Phase 4: Tactic Execution
- [ ] Implement tactic application logic
- [ ] Generate new blocks from tactic outputs
- [ ] Update proof graph after tactic execution

### Phase 5: Integration
- [ ] Connect to Pie type checker for validation
- [ ] Generate proof terms from completed graphs
- [ ] Sync with source code editor

## Visual Design

### Color Scheme

```
Goals (unsolved):  #f59e0b (amber)
Goals (solved):    #22c55e (green)
Theorems:          #10b981 (emerald)
Tactics:           #3b82f6 (blue)
Edges:             #64748b (slate)
Invalid:           #ef4444 (red)
Canvas:            #1e293b (slate-800)
```

### Block Dimensions

```
Goal/Theorem blocks:
  - Width: 180px
  - Height: auto (based on content)
  - Corner radius: 8px
  - Port size: 12px

Tactic blocks:
  - Width: 200px
  - Height: auto
  - Corner radius: 8px
  - Port size: 12px
  - Port spacing: 24px
```

## Future Enhancements

1. **Undo/Redo**: Full history of proof construction
2. **Auto-layout**: Automatic positioning of blocks
3. **Proof search**: Suggest tactics that could apply
4. **Export**: Generate Pie source code from proof
5. **Templates**: Save/load partial proofs
6. **Collaboration**: Real-time multi-user editing
