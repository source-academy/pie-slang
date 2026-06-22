# Holdout Evaluation Results

**Date:** 2026-06-22
**Model:** qwen2.5-coder-7b-instruct (LoRA adapter, PEFT 4-bit)
**Adapter:** `training/output/adapter/`
**Script:** `training/eval-holdout.ts`

## Test Set

157 novel theorems (not in training data) across 12 proof pattern sections, totalling 706 tactic steps. Covers all tactic types present in the training data: intro, exact, exists, go-Left/go-Right, elim-Either, elim-Nat, split-Pair, apply, elim-Absurd, and elim-List.

Five preamble groups provide different definition contexts:
- **Even/Odd** — 71 theorems: +, double, Even, Odd, zero-is-even, add1-even->odd, add1-odd->even
- **Arithmetic** — 29 theorems: adds *, n+0=n, +add1, +-comm, n*0=0; divisibility proofs
- **Bool** — 14 theorems: Bool = Either Trivial Trivial, not/and/or/xor/implies
- **Generic** — 38 theorems: polymorphic logic, pairs, apply, absurd, nested Either
- **List** — 5 theorems: elim-List fold patterns

## Step-level Accuracy

| Metric | Score |
|--------|-------|
| **Exact-match** | **515/706 (72.9%)** |
| **Tactic-head** | **655/706 (92.8%)** |
| **Category** | **675/706 (95.6%)** |

## Per-section Breakdown

| Section | Steps | Exact | Head |
|---------|-------|-------|------|
| intro+exact | 90 | 87.8% | 97.8% |
| exists (Sigma witnesses) | 88 | 72.7% | 92.0% |
| go-Left/go-Right | 60 | 80.0% | 80.0% |
| elim-Either (case split) | 100 | 68.0% | 95.0% |
| compound (Nat+Either) | 78 | 87.2% | 92.3% |
| elim-Nat (induction) | 48 | 72.9% | 89.6% |
| bool-single (1 case split) | 54 | 55.6% | 100.0% |
| bool-double (2 case splits) | 75 | 53.3% | 100.0% |
| split-Pair | 25 | 64.0% | 100.0% |
| apply | 40 | 70.0% | 77.5% |
| elim-Absurd | 12 | 100.0% | 100.0% |
| elim-List | 36 | 80.6% | 94.4% |

## Per-tactic Breakdown

| Tactic | Count | Exact | Head |
|--------|-------|-------|------|
| intro | 286 | 81.8% | 100.0% |
| exact | 218 | 61.0% | 96.8% |
| exists | 61 | 68.9% | 85.2% |
| elim-Either | 41 | 97.6% | 97.6% |
| go-Left | 28 | 75.0% | 75.0% |
| go-Right | 26 | 46.2% | 46.2% |
| apply | 14 | 35.7% | 35.7% |
| elim-Nat | 13 | 76.9% | 76.9% |
| split-Pair | 8 | 100.0% | 100.0% |
| elim-Absurd | 6 | 100.0% | 100.0% |
| elim-List | 5 | 80.0% | 80.0% |

## Proof Completion (all steps exact-match)

**Proofs completed: 63/157 (40.1%)**

Note: many "failures" are due to the model choosing equally-valid alternative tactics (e.g. `exact` instead of `exists` for the same Sigma goal, or `intro en` instead of `intro h`). The proof-completion rate with semantic equivalence would be significantly higher.

## Analysis

### Strengths

- **Strategy selection is excellent (92.8% head, 95.6% category).** The model almost always picks the right *kind* of tactic. Even when exact arguments differ, the proof structure is correct.
- **Elimination tactics near-perfect:** elim-Either 97.6%, elim-Absurd 100%, split-Pair 100%. The model correctly identifies when to case-split and on which variable.
- **Compound induction proofs (87.2% exact):** Full elim-Nat + elim-Either + helper lemma chains are handled well.
- **Intro naming (100% head):** The model always uses `intro` when appropriate. Name mismatches are cosmetic.

### Weaknesses

1. **go-Right accuracy is low (46.2%):** The model has a strong bias toward `go-Left`. For `(Either (Even n) (Odd n))` with odd `n`, or `(Either (Odd n) (Even n))` with even `n`, the model often picks the wrong constructor. This is the most impactful failure mode since it derails the entire proof branch.

2. **Bool proofs (53-56% exact, 100% head):** The model always picks the right tactic type but struggles with the exact `(same (left sole))` vs `(same (right sole))` arguments in boolean equality proofs. This is another manifestation of the go-Left/go-Right confusion — the model must determine which boolean constructor the normalized expression equals.

3. **`exact` vs `exists` confusion (exact tactic: 61% exact, 97% head):** For concrete Even/Odd goals like `(Even 4)`, the model sometimes uses `exact` with a long chain of helper lemma applications instead of the simpler `exists 2 half; exact (same 4)` approach. Both are valid, but they don't match the gold tactic.

4. **`apply` tactic (35.7%):** The model struggles with backward reasoning through function types, especially multi-step `apply` chains. This category has the least training data (~0.5% of training steps).

5. **Variable naming in `intro`:** 81.8% exact (100% head). The model has strong preferences for certain names (`en`, `on`, `t`, `p`) that sometimes differ from the gold. These are semantically equivalent.

### Comparison with Training Data Distribution

| Tactic | Training % | Holdout % | Exact Accuracy |
|--------|-----------|-----------|----------------|
| intro | 41.0% | 40.5% | 81.8% |
| exact | 32.3% | 30.9% | 61.0% |
| exists | 13.7% | 8.6% | 68.9% |
| elim-Either | 3.7% | 5.8% | 97.6% |
| go-Left | 2.7% | 4.0% | 75.0% |
| go-Right | 2.5% | 3.7% | 46.2% |
| split-Pair | 1.9% | 1.1% | 100.0% |
| elim-Nat | 1.1% | 1.8% | 76.9% |
| apply | 0.5% | 2.0% | 35.7% |
| elim-Absurd | 0.4% | 0.8% | 100.0% |
| elim-List | 0.2% | 0.7% | 80.0% |

Low-frequency tactics (split-Pair, elim-Absurd, elim-List) generalize well due to their simple, consistent patterns. The model struggles most with `apply` (least training data) and `go-Right` (requires reading subtle type differences).

### Recommendations

1. **go-Left/go-Right:** Add more training examples with varied Either argument orders (swapped, nested, different inner types). The model needs to learn to read the type structure rather than relying on positional bias.
2. **`apply` tactic:** Add more training proofs that use backward reasoning through function types, especially multi-step apply chains.
3. **Bool equality:** Add boolean truth table proofs to training set with both orderings.
4. **Semantic evaluation:** Implement a "soft match" scorer that checks whether the predicted tactic is valid for the current goal (even if different from gold). This would give a more accurate picture of real proof-driving ability.

## Reproduction

```bash
# Verify theorems without server
npx tsx training/eval-holdout.ts --extract-only

# Start the LoRA server
./training/launch.sh

# Run the full evaluation
npx tsx training/eval-holdout.ts          # summary mode
npx tsx training/eval-holdout.ts --verbose # step-by-step detail
```

## Runtime

- 706 steps at 0.68s/step = ~8 minutes total
- RTX 4080 Laptop, Windows-native, PEFT 4-bit inference
