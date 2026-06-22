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
| **Kernel-valid** | **647/706 (91.6%)** |

## Kernel-Validated Accuracy

Kernel validation asks: does the predicted tactic actually *work* when applied through the Pie interpreter? A predicted tactic is "kernel-valid" if it parses successfully and the proof engine accepts it (closes the goal or produces well-typed subgoals), even if it differs from the gold tactic.

**Gold sanity check:** 706/706 gold tactics passed kernel validation (100%).

| Metric | Score |
|--------|-------|
| **Kernel-valid** | **647/706 (91.6%)** |
| **Exact-match** | **515/706 (72.9%)** |
| **Valid but not exact** | **132/706 (18.7%)** |
| **Lift over exact** | **+18.7 pp** |

The kernel-valid rate is 18.7 percentage points higher than exact-match, confirming that the model frequently produces correct but differently-phrased tactics. The most dramatic lifts are on `go-Right` (+53.8pp) and `apply` (+50.0pp), where the model's predictions are structurally valid even when they differ from the gold.

### Per-tactic Kernel Validity

| Tactic | Count | Exact | Kernel | Lift |
|--------|-------|-------|--------|------|
| intro | 286 | 81.8% | 100.0% | +18.2pp |
| exact | 218 | 61.0% | 75.2% | +14.2pp |
| exists | 61 | 68.9% | 98.4% | +29.5pp |
| elim-Either | 41 | 97.6% | 97.6% | +0.0pp |
| go-Left | 28 | 75.0% | 100.0% | +25.0pp |
| go-Right | 26 | 46.2% | 100.0% | +53.8pp |
| apply | 14 | 35.7% | 85.7% | +50.0pp |
| elim-Nat | 13 | 76.9% | 92.3% | +15.4pp |
| split-Pair | 8 | 100.0% | 100.0% | +0.0pp |
| elim-Absurd | 6 | 100.0% | 100.0% | +0.0pp |
| elim-List | 5 | 80.0% | 100.0% | +20.0pp |

Key observations:
- **`intro` is 100% kernel-valid.** Every `intro` prediction is accepted — name differences (`h` vs `p`, `on` vs `or`) are cosmetic.
- **`go-Left`/`go-Right` are 100% kernel-valid** despite only 75%/46% exact-match. Both constructors are always type-valid for Either goals; the kernel accepts either direction. The wrong *choice* only surfaces when the subgoal can't be closed later.
- **`exists` jumps from 69% to 98%.** The model often uses `exact (add1-even->odd ...)` chains instead of `exists N half`, but the kernel accepts both.
- **`apply` jumps from 36% to 86%.** The model sometimes uses `exact (f (g x))` instead of backward `apply` chains — different proof strategy, same result.

### Per-section Kernel Validity

| Section | Steps | Exact | Head | Kernel |
|---------|-------|-------|------|--------|
| intro+exact | 90 | 87.8% | 97.8% | 95.6% |
| exists | 88 | 72.7% | 92.0% | 97.7% |
| go-Left/go-Right | 60 | 80.0% | 80.0% | 100.0% |
| elim-Either | 100 | 68.0% | 95.0% | 94.0% |
| compound | 78 | 87.2% | 92.3% | 100.0% |
| elim-Nat | 48 | 72.9% | 89.6% | 89.6% |
| bool-single | 54 | 55.6% | 100.0% | 66.7% |
| bool-double | 75 | 53.3% | 100.0% | 73.3% |
| split-Pair | 25 | 64.0% | 100.0% | 92.0% |
| apply | 40 | 70.0% | 77.5% | 95.0% |
| elim-Absurd | 12 | 100.0% | 100.0% | 100.0% |
| elim-List | 36 | 75.0% | 86.1% | 100.0% |

## Free-Running Proof Completion

The model drives proofs end-to-end: starting from the initial goal, it predicts a tactic, the kernel applies it, and the model sees the updated state. This repeats until the proof closes, the kernel rejects a prediction, or a step cap (2x gold length) is reached.

**Proofs completed: 98/157 (62.4%)**

This is the strongest metric — the model actually *proved* these theorems from scratch through the real interpreter. Compare with 40.1% proof completion by exact-match (which undercounts due to cosmetic differences).

## Per-section Breakdown (string-match)

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
| elim-List | 36 | 75.0% | 86.1% |

## Per-tactic Breakdown (string-match)

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

Note: many "failures" are due to the model choosing equally-valid alternative tactics (e.g. `exact` instead of `exists` for the same Sigma goal, or `intro en` instead of `intro h`). The free-running completion rate (62.4%) is the more accurate measure.

## Analysis

### Strengths

- **Kernel-valid rate is 91.6%.** The model produces a tactic the interpreter actually accepts in 9 out of 10 steps. The gap between exact-match (72.9%) and kernel-valid (91.6%) shows that string comparison severely undercounts real ability.
- **Free-running completion is 62.4%.** The model proved 98 out of 157 novel theorems end-to-end through the real interpreter, with no human intervention.
- **Strategy selection is excellent (92.8% head, 95.6% category).** The model almost always picks the right *kind* of tactic.
- **Elimination tactics near-perfect:** elim-Either 97.6%, elim-Absurd 100%, split-Pair 100%.
- **Compound induction proofs (87.2% exact, 100% kernel-valid):** Full elim-Nat + elim-Either + helper lemma chains are handled correctly.
- **Intro is 100% kernel-valid.** Name differences are purely cosmetic.

### Weaknesses

1. **go-Right exact-match is low (46.2%, but 100% kernel-valid):** The model has a strong bias toward `go-Left`. Both directions are type-valid, but choosing the wrong one leads to unprovable subgoals. The kernel-valid metric can't catch this since it only checks the immediate step.

2. **Bool proofs (53-56% exact, 67-73% kernel-valid):** The model produces `(same (left Sole))` instead of `(same (left sole))` — a capitalization error (`Sole` vs `sole`). The kernel rejects `Sole` since Pie uses lowercase `sole`.

3. **`exact` arguments (61% exact, 75% kernel-valid):** For concrete Even/Odd goals, the model sometimes builds long helper-lemma chains instead of the simpler `exists` approach. Both are valid.

4. **`apply` tactic (36% exact, 86% kernel-valid):** The model often prefers `exact (f (g x))` over backward `apply` chains. The kernel accepts both, but exact-match penalizes this.

5. **Free-running failures concentrate in:** Bool proofs (Sole/sole capitalization), go-Right confusion in Either goals, and apply chains where one rejected step derails the rest.

### Comparison with Training Data Distribution

| Tactic | Training % | Holdout % | Exact | Kernel |
|--------|-----------|-----------|-------|--------|
| intro | 41.0% | 40.5% | 81.8% | 100.0% |
| exact | 32.3% | 30.9% | 61.0% | 75.2% |
| exists | 13.7% | 8.6% | 68.9% | 98.4% |
| elim-Either | 3.7% | 5.8% | 97.6% | 97.6% |
| go-Left | 2.7% | 4.0% | 75.0% | 100.0% |
| go-Right | 2.5% | 3.7% | 46.2% | 100.0% |
| split-Pair | 1.9% | 1.1% | 100.0% | 100.0% |
| elim-Nat | 1.1% | 1.8% | 76.9% | 92.3% |
| apply | 0.5% | 2.0% | 35.7% | 85.7% |
| elim-Absurd | 0.4% | 0.8% | 100.0% | 100.0% |
| elim-List | 0.2% | 0.7% | 80.0% | 100.0% |

### Recommendations

1. **Bool/sole capitalization:** The model outputs `Sole` instead of `sole` in boolean proofs. Add training examples or a post-processing normalization step.
2. **go-Left/go-Right:** The model needs to learn to read type structure (which branch of Either to inject into) rather than defaulting to go-Left. More training examples with varied Either argument orders would help.
3. **`apply` tactic:** Add more training proofs with multi-step backward reasoning. The model understands function application but prefers direct `exact` terms.
4. **`exact` argument diversity:** The model's alternative proof terms are usually valid — consider normalizing `exact`/`exists` equivalences in evaluation.

## Reproduction

```bash
# Verify theorems without server
npx tsx training/eval-holdout.ts --extract-only

# Start the LoRA server
./training/launch.sh

# Run string-match evaluation
npx tsx training/eval-holdout.ts          # summary mode
npx tsx training/eval-holdout.ts --verbose # step-by-step detail

# Run with kernel validation + free-running completion
npx tsx training/eval-holdout.ts --kernel-validate
npx tsx training/eval-holdout.ts --kernel-validate --verbose
```

## Runtime

- 706 steps at 0.68s/step = ~8 minutes for predictions
- Kernel validation adds ~2 minutes (replays gold tactics per step)
- Free-running adds ~5 minutes (157 theorems x model queries)
- Total with `--kernel-validate`: ~15 minutes
- RTX 4080 Laptop, Windows-native, PEFT 4-bit inference
