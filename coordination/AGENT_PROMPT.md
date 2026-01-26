# Implementation Agent Instructions

You are tasked with re-implementing the frontend for the pie-slang interactive proof system using React. You are being monitored by another Claude Code session that will review your plans before you execute them.

## Your Task

Re-implement the frontend following the specifications in:
- `docs/react-frontend-architecture.md` - Technical architecture, directory structure, types, and implementation details
- `docs/interactive-proof-design.md` - Conceptual design for the proof visualization system

The new frontend should be placed in `web-react/` directory.

## Coordination Protocol (MANDATORY)

You MUST follow this protocol for every significant change:

### Before Making Changes

1. **Write your plan** to `coordination/agent-plan.md`:
   ```markdown
   ## Current Task
   [What you're trying to accomplish]

   ## Proposed Changes
   [Files to create/modify and how]

   ## Rationale
   [Why this approach fits the specifications]

   ## Questions (if any)
   [Any uncertainties]
   ```

2. **Update status**: Write `awaiting_review` to `coordination/status.txt`

3. **Wait for approval**: Poll `coordination/status.txt` until it changes to:
   - `approved` - Proceed with your plan
   - `revision_needed` - Check `coordination/monitor-review.md` for feedback, revise your plan, and submit again

### After Completing Changes

1. Update `coordination/status.txt` to `completed`
2. Summarize what you did in `coordination/agent-plan.md`
3. Wait for next task or monitor instructions

## Key Specifications to Follow

### Technology Stack
- React 18+ with TypeScript
- Vite for build tooling
- React Flow (@xyflow/react) for node-based visualization
- Zustand with Immer for state management
- TanStack Query for async state
- Comlink for web worker communication
- shadcn/ui + Tailwind CSS for styling
- Framer Motion for animations

### Directory Structure
```
web-react/
├── src/
│   ├── app/                    # Application shell
│   ├── features/               # Feature modules
│   │   ├── proof-editor/       # Main proof visualization
│   │   │   ├── components/     # React components
│   │   │   │   ├── nodes/      # GoalNode, TacticNode, LemmaNode
│   │   │   │   ├── edges/      # ProofEdge
│   │   │   │   └── panels/     # TacticPalette, ContextPanel
│   │   │   ├── hooks/          # useProofStore, useTacticDrag
│   │   │   ├── store/          # Zustand store
│   │   │   └── utils/          # Layout algorithms
│   │   └── code-editor/        # Monaco editor feature
│   ├── shared/                 # Shared utilities
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # Shared hooks
│   │   └── lib/                # Worker client, types
│   ├── workers/                # Web workers
│   └── main.tsx                # Entry point
```

### Core Architecture Points

1. **Session-based worker communication** - Worker maintains proof state, frontend syncs from it
2. **Worker is source of truth** - UI state syncs from worker after each tactic application
3. **Context is scoped to goals** - Each goal has its own context that inherits from parent
4. **Three block types**: Goal (orange/green), Lemma (green), Tactic (blue)
5. **Drag-and-drop tactics** - Users drag tactics from palette onto goals

### Implementation Order (Suggested)

1. Project setup (Vite, dependencies, config files)
2. Basic types and interfaces
3. Zustand store skeleton
4. React Flow canvas with custom nodes
5. Tactic palette component
6. Worker communication layer
7. Tactic application flow
8. Auto-layout utility

## Quality Criteria (What Monitor Checks)

1. **Specification Compliance** - Does the implementation match the docs?
2. **Type Safety** - Are TypeScript types properly defined and used?
3. **Architecture Consistency** - Does it follow the prescribed patterns?
4. **Code Quality** - Clean, readable, well-structured code?
5. **Completeness** - Are edge cases handled? Error states?

## Commands for Checking Status

```bash
# Check current status
cat coordination/status.txt

# Read monitor feedback
cat coordination/monitor-review.md

# Update your plan
# (edit coordination/agent-plan.md)

# Signal ready for review
echo "awaiting_review" > coordination/status.txt
```

## Important Notes

- Do NOT proceed with significant changes without approval
- Small fixes (typos, formatting) don't need review
- If you're unsure whether something needs review, submit it for review
- Ask questions in your plan if specifications are unclear
- The monitor may provide guidance or suggest improvements

---

Start by reading the specification docs thoroughly, then submit your first plan for the initial project setup.
