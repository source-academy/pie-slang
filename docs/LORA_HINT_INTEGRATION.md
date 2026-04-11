# LoRA + Gemini Hint Integration

## Overview

Enhance the existing progressive hint system by combining two models:

- **LoRA adapter** (fine-tuned `qwen2.5-coder-7b-instruct`) — predicts the correct tactic with high accuracy (100% exact-match on holdout)
- **Gemini** (`gemini-2.5-flash`) — generates educational natural-language explanations of the predicted tactic

The LoRA model predicts; Gemini explains. Each model does what it does best.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│                                                         │
│  GoalNode ──click──▶ useHintSystem ──▶ proof-worker     │
│                                          │              │
│  GhostTacticNode ◀── hint-store ◀────────┘              │
└──────────────────────────┬──────────────────────────────┘
                           │ (Comlink RPC)
┌──────────────────────────▼──────────────────────────────┐
│  proof-worker (Web Worker)                              │
│                                                         │
│  getHint(request)                                       │
│    │                                                    │
│    ├─ 1. Call local LoRA server (/predict)              │
│    │     POST http://localhost:8000/predict              │
│    │     Body: { goal, globalContext, localContext }     │
│    │     Response: { tactic: "elim-Nat n" }             │
│    │                                                    │
│    ├─ 2. Validate prediction                            │
│    │     Parse tactic string → Tactic AST               │
│    │     Dry-run against proof state (typecheck)        │
│    │     If invalid → fall back to Gemini-only          │
│    │                                                    │
│    ├─ 3. Cache validated prediction for this goalId     │
│    │                                                    │
│    └─ 4. Call Gemini to explain at requested level      │
│          Prompt includes: full tactic + goal + context  │
│          Restricted to reveal only current level        │
│          Response: HintResponse                         │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
┌─────────────────────┐     ┌──────────────────────────┐
│  Local LoRA Server  │     │  Gemini API              │
│  (training/serve.py)│     │  (gemini-2.5-flash)      │
│                     │     │                          │
│  FastAPI on :8000   │     │  Explain the tactic at   │
│  Loads LoRA adapter │     │  the requested level     │
│  Greedy decode      │     │  (category/tactic/full)  │
│  ~0.6s per predict  │     │                          │
└─────────────────────┘     └──────────────────────────┘
```

## Data Flow: User clicks lightbulb

### Step 1 — First click (level: category)

```
useHintSystem.requestHint(goalId)
  → proof-worker.getHint({ goalId, currentLevel: "category", ... })
    → POST localhost:8000/predict  →  "elim-Nat n"
    → validate: parse + dry-run tactic against proof state
    → cache: predictions[goalId] = { tacticType: "elim-Nat", params: { variable: "n" } }
    → Gemini prompt (see below)
    → return HintResponse { level: "category", category: "elimination", explanation: "..." }
```

### Step 2 — "More detail" (level: tactic)

```
useHintSystem.getMoreDetail(goalId)
  → proof-worker.getHint({ goalId, currentLevel: "tactic", previousHint })
    → use cached prediction (no LoRA call)
    → Gemini prompt at tactic level
    → return HintResponse { level: "tactic", tacticType: "elim-Nat", explanation: "..." }
```

### Step 3 — "More detail" (level: full)

```
useHintSystem.getMoreDetail(goalId)
  → proof-worker.getHint({ goalId, currentLevel: "full", previousHint })
    → use cached prediction (no LoRA call)
    → Gemini prompt at full level
    → return HintResponse { level: "full", tacticType: "elim-Nat", parameters: { variable: "n" }, explanation: "..." }
```

## LoRA Inference Server

### API

```
POST /predict
Content-Type: application/json

{
  "goal": "(= Nat (plus n 0) n)",
  "globalContext": [
    { "name": "plus", "type": "(Π ((x Nat)) (Π ((x₁ Nat)) Nat))" }
  ],
  "localContext": [
    { "name": "n", "type": "Nat" }
  ]
}

Response:
{
  "tactic": "elim-Nat n",
  "raw_output": "elim-Nat n"
}
```

```
GET /health

Response:
{ "status": "ok", "model": "qwen2.5-coder-7b-instruct", "adapter": "..." }
```

### Implementation (`training/serve.py`)

- FastAPI app with CORS enabled (allow `localhost:*`)
- On startup: load base model + LoRA adapter (same as `evaluate_offline.py`)
- Format prompt using `format_proof_state()` (reuse from evaluate script)
- System prompt: same as training (`SYSTEM_PROMPT` in evaluate_offline.py)
- Greedy decoding, `max_new_tokens=128`, `temperature=0.0`
- Single endpoint, stateless

### Prompt Format (must match training data exactly)

```
System: You are a tactic proof assistant for Pie, a dependently-typed language
        based on "The Little Typer". Given a proof goal and context, suggest
        the next tactic to apply.

User:   Definitions:
          plus : (Π ((x Nat)) (Π ((x₁ Nat)) Nat))
        Local variables:
          n : Nat
        Goal: (= Nat (plus n 0) n)
Assistant → elim-Nat n
```

**Critical: type serialization format.** All types in the prompt MUST use
`sugarType(core, ctx)` — NOT `core.prettyPrint()`. The differences:

| | `sugarType` (correct) | `prettyPrint` (wrong) |
|-|----------------------|-----------------------|
| Binder syntax | `(Π ((x Nat)) ...)` double parens | `(Π (x Nat) ...)` single parens |
| Type aliases | `(Even 0)` | `(Σ (half Nat) (= Nat 0 (iter-Nat ...)))` |

The LoRA model was trained on `sugarType` output. Sending `prettyPrint` output
causes wrong predictions because the model has never seen that format.

**Context separation rules:**
- `Definitions:` = `Define` binders from the session context (global defs + proved theorems)
- `Local variables:` = `Free` binders from the goal context that are NOT in the session context (variables introduced by tactics like intro, elim)
- The claim being proved must NOT appear in either section

## Gemini Explanation Prompts

Gemini sees the **full LoRA prediction** at every level. The prompt restricts what it reveals.

### Category Level Prompt

```
You are an educational proof assistant for Pie (from "The Little Typer").

A student is working on a proof and needs a hint. You know the correct next
tactic is: {tactic} (applied to goal: {goalType})

Context variables:
{context}

Your job: explain only the CATEGORY of approach needed. Do NOT reveal the
specific tactic name or parameters. Categories:
- introduction: introducing a variable or providing a direct value
- elimination: performing case analysis or induction on a value
- constructor: building a pair, sigma, or either value
- application: applying a function or lemma

Write 1-2 sentences explaining WHY this category of approach is appropriate
for this goal. Be Socratic — guide the student's thinking.

Respond with JSON:
{"category": "<category>", "explanation": "<1-2 educational sentences>", "confidence": <0.0-1.0>}
```

### Tactic Level Prompt

```
You are an educational proof assistant for Pie.

The student's goal is: {goalType}
Context: {context}
The correct tactic is: {tactic}
You previously hinted the category: {category}

Now reveal the specific tactic type (e.g. "elim-Nat", "intro", "exact") but
do NOT reveal the parameters. Explain why this particular tactic is the right
tool. Be educational — connect it to the goal structure.

Respond with JSON:
{"tacticType": "<tactic-name>", "explanation": "<1-2 educational sentences>", "confidence": <0.0-1.0>}
```

### Full Level Prompt

```
You are an educational proof assistant for Pie.

The student's goal is: {goalType}
Context: {context}
The correct tactic with parameters is: {tactic}

Now reveal the complete tactic including parameters. Explain what each
parameter means and what subgoals this tactic will produce. Help the student
understand not just WHAT to do but WHY it works.

Respond with JSON:
{"tacticType": "<name>", "parameters": {<params>}, "explanation": "<2-3 educational sentences>", "confidence": <0.0-1.0>}
```

## Validation: Dry-Run Tactic Before Showing Hint

Before caching the LoRA prediction and sending it to Gemini, the proof-worker
validates it by attempting to apply the tactic to the proof state:

1. Parse the tactic string using `schemeParse` + `Parser.parseToTactics`
   (reuse the `ind-*` → `elim-*` normalization already in the parser)
2. Clone the proof state (or use a trial-apply API)
3. Attempt `proofManager.applyTactic(tactic)`
4. If it succeeds → prediction is valid, cache it
5. If it fails → discard prediction, fall back to Gemini-only hint generation

This ensures the user never sees a hint for an invalid tactic.

## Protocol Changes

### `HintRequest` — add optional `loraServerUrl`

```typescript
export interface HintRequest {
  sessionId: string;
  goalId: string;
  currentLevel: HintLevel;
  previousHint?: HintResponse;
  apiKey?: string;          // Gemini API key
  loraServerUrl?: string;   // e.g. "http://localhost:8000"
}
```

### `HintResponse` — add `source` field

```typescript
export interface HintResponse {
  level: HintLevel;
  category?: TacticCategory;
  tacticType?: string;
  parameters?: Record<string, string>;
  explanation: string;
  confidence: number;
  /** Where the tactic prediction came from */
  source?: "lora" | "gemini" | "rule-based";
}
```

### New: `LoraPrediction` (internal to proof-worker, not in protocol)

```typescript
interface LoraPrediction {
  tacticType: string;
  params: Record<string, string>;
  rawOutput: string;
  validated: boolean;
}

// Cache: Map<goalId, LoraPrediction>
```

## Frontend Changes

### AI Settings Panel

Add a new field: **Local Model URL** (default: `http://localhost:8000`)
- Text input for URL
- Health check indicator (green dot / red dot)
- Hint source shown on GhostTacticNode (LoRA icon vs Gemini icon)

### hint-store

Add `loraServerUrl: string | null` to state, alongside existing `apiKey`.

### GhostTacticNode

Show hint source badge:
- "AI-powered" (Gemini only, existing)
- "Local model + AI" (LoRA prediction + Gemini explanation)
- "Rule-based" (no API key, no local model)

## Implementation Status

All phases are implemented. Files changed:

### Phase 1: LoRA Inference Server — DONE
- `training/serve.py` — FastAPI server with `/predict` and `/health` endpoints

### Phase 2: Protocol + proof-worker Integration — DONE
- `src/pie-interpreter/protocol.ts` — added `loraServerUrl` to `HintRequest`, `source` to `HintResponse`
- `web-react/src/workers/proof-worker.ts` — LoRA prediction cache, `fetchAndValidateLoraPrediction()`, updated `getHint()` with LoRA→validate→cache→Gemini flow

### Phase 3: Gemini Explanation Prompts — DONE
- `src/pie-interpreter/solver/hint-generator.ts` — added `explainTactic()`, `buildFallbackExplanation()`, tactic name normalization (`TACTIC_NAME_TO_PROTOCOL`)

### Phase 4: Frontend UI — DONE
- `web-react/src/features/proof-editor/store/hint-store.ts` — added `loraServerUrl` state + `setLoraServerUrl` action
- `web-react/src/features/proof-editor/hooks/useHintSystem.ts` — passes `loraServerUrl` to worker
- `web-react/src/features/proof-editor/components/panels/AISettingsPanel.tsx` — local model URL input + health check indicator
- `web-react/src/features/proof-editor/components/nodes/GhostTacticNode.tsx` — hint source badge (Local AI / AI / Rule)

### Phase 5: Testing — TODO
- Unit test: `serve.py` with holdout data via curl
- Integration test: proof-worker with mock LoRA server
- E2E: full flow with real LoRA server running

### Known Limitations
- Validation is parse-only (not type-checked against proof state) because ProofManager lacks undo/clone support
- LoRA server must be started manually before using hints
- Global context is not yet populated in LoRA requests (TODO in fetchAndValidateLoraPrediction)
