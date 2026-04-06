# Known Workarounds

Type-safety holes introduced during the Phase 1 structured `AppliedTactic` migration. None are runtime bugs today, but all bypass the compiler and should be resolved.

---

## 1. ThenTactic.tacticType silently falls back to "exact"

**File:** `src/pie-interpreter/tactics/tactics.ts` (ThenTactic class)

```ts
get tacticType(): TacticType { return this.tactics[0]?.tacticType ?? "exact"; }
get tacticParams(): TacticParams { return this.tactics[0]?.tacticParams ?? {}; }
```

**Problem:** `ThenTactic` is a container for sequencing tactics in the textual DSL — it is not a user-facing tactic and does not belong in the `TacticType` union. But because `Tactic` declares `tacticType` as abstract, `ThenTactic` must implement it. The current implementation delegates to the first inner tactic, with a silent `?? "exact"` fallback if the tactics array is empty.

This is misleading: an `elimNat` inside a `then` block labels the *then block itself* as `elimNat`. And if `this.tactics` is ever empty, it silently reports `"exact"` instead of failing.

**Fix options:**
- (a) Remove `tacticType`/`tacticParams` from the abstract `Tactic` class. Make `toAppliedTactic()` concrete only on the subclasses that need it (everything except `ThenTactic`). Have `proof-manager.ts` check `!(tactic instanceof ThenTactic)` before calling `toAppliedTactic()`.
- (b) Add `"then"` to the `TacticType` union in protocol.ts so ThenTactic can honestly report its type. The frontend already ignores unknown tactic types gracefully.

---

## 2. `as AppliedTactic` cast on untyped worker data

**File:** `web-react/src/workers/proof-worker.ts` (transformGoalNode)

```ts
appliedTactic: node.appliedTactic as AppliedTactic | undefined,
completedBy: node.completedBy as AppliedTactic | undefined,
```

**Problem:** The raw data from `ProofManager.getProofTreeData()` flows through `any`-typed `node` (because the worker dynamically imports interpreter modules). The `as` cast trusts that the runtime shape matches `AppliedTactic`. If it doesn't (e.g. stale session, serialization edge case), the frontend silently gets garbage with no runtime validation.

**Fix:** Add a runtime guard or validator:
```ts
function isAppliedTactic(x: unknown): x is AppliedTactic {
  return typeof x === 'object' && x !== null
    && 'tacticType' in x && 'displayString' in x;
}

appliedTactic: isAppliedTactic(node.appliedTactic) ? node.appliedTactic : undefined,
```

---

## 3. `as TacticParameters` cast for protocol→frontend type widening

**File:** `web-react/src/features/proof-editor/utils/convert-proof-tree.ts`

```ts
parameters: node.appliedTactic.params as TacticParameters,
```

**Problem:** `TacticParams` (protocol) has `{ variableName?: string; expression?: string }`. `TacticParameters` (frontend) extends it with `targetContextId?`, `lemmaId?`, and `[key: string]: unknown`. TypeScript won't widen a narrow type to a wider one, so the cast is needed. It is safe at runtime but papers over the structural mismatch.

**Fix:** Change `TacticNodeData.parameters` from `TacticParameters` to `TacticParams` (the protocol type). The extra frontend-only fields (`targetContextId`, `lemmaId`) are only set during drag-and-drop interactions, not during `syncFromWorker`. So the node data type should accept either:
```ts
parameters: TacticParams | TacticParameters;
```
Or make `TacticParameters` compatible by removing the strict index signature requirement.
