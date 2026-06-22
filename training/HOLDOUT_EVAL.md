# Holdout Evaluation Results

**Date:** 2026-06-22
**Model:** qwen2.5-coder-7b-instruct (LoRA adapter, PEFT 4-bit)
**Adapter:** `training/output/adapter/`
**Script:** `training/eval-holdout.ts`

## Test Set

10 novel theorems (not in training data) across 5 proof pattern sections, totalling 62 tactic steps. All theorems use the standard Even/Odd preamble.

| Section | Theorems | Steps | Description |
|---------|----------|-------|-------------|
| intro+exact | even-succ-succ-zero, odd-one | 3 | Basic function-level proofs |
| constructor-choice | zero-either-even-odd, one-either-even-odd | 5 | Choosing go-Left / go-Right on Either |
| nat-induction | every-nat-has-even-succ-succ, succ-parity-flip | 12 | Induction on Nat, helper composition |
| either-elimination | either-even-odd-to-nat, either-swap | 16 | Case-splitting on Either values |
| compound-induction | every-nat-odd-or-even, every-nat-succ-has-parity | 26 | Full elim-Nat + elim-Either + go-Left/go-Right |

## Step-level Accuracy

| Metric | Score |
|--------|-------|
| Exact-match | 41/62 (66.1%) |
| Tactic-head | 56/62 (90.3%) |
| Category | 61/62 (98.4%) |

## Per-section Breakdown

| Section | Steps | Exact | Head |
|---------|-------|-------|------|
| intro+exact | 3 | 33.3% | 100.0% |
| constructor-choice | 5 | 40.0% | 60.0% |
| nat-induction | 12 | 75.0% | 100.0% |
| either-elimination | 16 | 50.0% | 100.0% |
| compound-induction | 26 | 80.8% | 84.6% |

## Per-tactic Breakdown

| Tactic | Count | Exact | Head |
|--------|-------|-------|------|
| intro | 26 | 53.8% | 100.0% |
| exact | 17 | 76.5% | 94.1% |
| go-Right | 7 | 57.1% | 57.1% |
| go-Left | 5 | 60.0% | 60.0% |
| elim-Either | 5 | 100.0% | 100.0% |
| elim-Nat | 2 | 100.0% | 100.0% |

## Proof Completion (all steps exact-match)

| Theorem | Steps | Result |
|---------|-------|--------|
| every-nat-has-even-succ-succ | 3/3 | OK |
| every-nat-odd-or-even | 11/13 | FAIL |
| every-nat-succ-has-parity | 10/13 | FAIL |
| succ-parity-flip | 6/9 | FAIL |
| either-swap | 6/9 | FAIL |
| either-even-odd-to-nat | 2/7 | FAIL |
| one-either-even-odd | 1/3 | FAIL |
| odd-one | 1/2 | FAIL |
| zero-either-even-odd | 1/2 | FAIL |
| even-succ-succ-zero | 0/1 | FAIL |

**Proofs completed: 1/10 (10.0%)**

## Analysis

### Strengths

- **Elimination strategy selection (100%):** The model always picks the correct elimination tactic (`elim-Nat`, `elim-Either`) and applies it to the right variable.
- **Complex exact terms (76.5%):** Correctly constructs multi-argument helper applications like `exact (add1-even->odd n-1 en)` with the right variable names from context.
- **Category accuracy (98.4%):** Nearly always picks the right *kind* of tactic (introduction, constructor, elimination). Only 1/62 steps had a category mismatch (`exists` instead of `exact`).

### Weaknesses

1. **Variable naming in `intro` (53.8% exact, 100% head):** The model has memorized training-set variable names rather than generalizing. For example:
   - gold=`intro h` -> pred=`intro p`
   - gold=`intro ek` -> pred=`intro en`
   - gold=`intro ok` -> pred=`intro on`

   These are **semantically equivalent** — the proof would succeed with either name. The 90.3% tactic-head accuracy is more representative of real proof-driving ability.

2. **go-Left vs go-Right on swapped Either (6 failures):** When the Either order is `(Either (Odd n) (Even n))` instead of the training-set `(Either (Even n) (Odd n))`, the model often picks the wrong side. This is the same precision issue documented for GGUF quantization — the model struggles with subtle type-level distinctions that determine which constructor to use.

3. **Concrete vs symbolic Nat:** The model outputs `1` instead of `(add1 0)`, which is semantically identical but textually different (`exact (add1-odd->even 1 ...)` vs `exact (add1-odd->even (add1 0) ...)`).

### Recommendations

- **Variable naming:** Not a real issue for proof completion — the interpreter accepts any valid name. Consider scoring `intro` with name-insensitive matching.
- **go-Left/go-Right:** Add more training examples with swapped Either argument order to teach the model to read the type structure rather than relying on positional heuristics.
- **Concrete Nat literals:** Normalize `1` to `(add1 0)` etc. in the prediction post-processing, or add training examples with concrete numbers.

## Reproduction

```bash
# Start the LoRA server
./training/launch.sh

# Run the evaluation
npx tsx training/eval-holdout.ts --verbose
```
