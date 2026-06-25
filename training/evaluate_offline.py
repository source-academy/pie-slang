"""
Offline proof completion evaluation — no Node.js / npm required.

Reads pre-decomposed test proofs (JSONL with gold states per step),
runs the model on each step's context+goal, and measures:

  1. Step-level accuracy:
     - Exact-match: predicted tactic == gold tactic
     - Tactic-head: correct tactic name (ignoring arguments)
     - Category: correct tactic category

  2. Simulated proof completion:
     - A proof is "completed" if ALL steps are exact-match correct
     - This is a pessimistic lower bound (the real interpreter might
       accept equivalent tactics the model predicts differently)

  3. Breakdown by difficulty (easy/medium/hard) and per-tactic

Usage:
    # With local PEFT adapter
    python training/evaluate_offline.py --adapter training/output/adapter \
        --test-proofs training/test-proofs-even-odd.jsonl

    # With OpenAI-compatible API (Ollama, vLLM, etc.)
    python training/evaluate_offline.py --api-url http://localhost:11434/v1 \
        --test-proofs training/test-proofs-even-odd.jsonl

    # Limit to N proofs
    python training/evaluate_offline.py --adapter training/output/adapter \
        --test-proofs training/test-proofs-even-odd.jsonl --max-examples 10 --verbose
"""

from __future__ import annotations

import abc
import argparse
import json
import sys
import time
from collections import defaultdict
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

SYSTEM_PROMPT = (
    "You are a tactic proof assistant for Pie, a dependently-typed language "
    'based on "The Little Typer". Given a proof goal and context, suggest the '
    "next tactic to apply."
)

# Category mapping (same as evaluate.py)
TACTIC_CATEGORIES = {
    "intro": "introduction",
    "exact": "introduction",
    "exists": "constructor",
    "split": "constructor",
    "go-Left": "constructor",
    "go-Right": "constructor",
    "left": "constructor",
    "right": "constructor",
    "ind-nat": "elimination",
    "elim-Nat": "elimination",
    "ind-list": "elimination",
    "elim-List": "elimination",
    "ind-Vec": "elimination",
    "elim-Vec": "elimination",
    "ind-Either": "elimination",
    "elim-Either": "elimination",
    "ind-equal": "elimination",
    "elim-Equal": "elimination",
    "ind-Absurd": "elimination",
    "elim-Absurd": "elimination",
    "apply": "application",
    "then": "composition",
}


def parse_args():
    p = argparse.ArgumentParser(
        description="Offline proof completion evaluation (no npm required)"
    )
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--adapter", type=str, help="Path to local PEFT adapter")
    src.add_argument("--api-url", type=str,
                     help="OpenAI-compatible API base URL (e.g. http://localhost:11434/v1)")
    p.add_argument("--api-model", type=str, default="",
                   help="Model name for the API (auto-detected if omitted)")
    p.add_argument("--test-proofs", type=str,
                   default=str(PROJECT_ROOT / "training" / "test-proofs-even-odd.jsonl"),
                   help="Path to test proofs JSONL")
    p.add_argument("--max-examples", type=int, default=0,
                   help="Limit number of test proofs (0 = all)")
    p.add_argument("--output", type=str, default="",
                   help="Write detailed results to JSON")
    p.add_argument("--verbose", action="store_true",
                   help="Print each step prediction")
    return p.parse_args()


# ── Formatting (matches training data format) ────────────────────────────────

def format_proof_state(goal: str, global_ctx: list, local_ctx: list) -> str:
    parts = []
    if global_ctx:
        parts.append("Definitions:")
        for e in global_ctx:
            parts.append(f"  {e['name']} : {e['type']}")
    if local_ctx:
        parts.append("Local variables:")
        for e in local_ctx:
            parts.append(f"  {e['name']} : {e['type']}")
    parts.append(f"Goal: {goal}")
    return "\n".join(parts)


# ── Tactic scoring ───────────────────────────────────────────────────────────

def tactic_head(tactic: str) -> str:
    return tactic.strip().split()[0] if tactic.strip() else ""


def tactic_category(tactic: str) -> str:
    head = tactic_head(tactic)
    return TACTIC_CATEGORIES.get(head, "unknown")


# ── Model inference ──────────────────────────────────────────────────────────

class TacticPredictor(abc.ABC):
    @abc.abstractmethod
    def predict(self, goal: str, global_ctx: list, local_ctx: list) -> str: ...

    @abc.abstractmethod
    def predict_raw(self, user_content: str) -> str: ...


class LocalPredictor(TacticPredictor):
    def __init__(self, adapter_path: str):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
        from peft import PeftModel

        adapter_config_path = Path(adapter_path) / "adapter_config.json"
        with open(adapter_config_path) as f:
            adapter_cfg = json.load(f)
        base_model_name = adapter_cfg["base_model_name_or_path"]

        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            quantization_config=bnb_config,
            device_map="auto",
        )
        self.model = PeftModel.from_pretrained(base_model, adapter_path)
        self.model.eval()
        self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)
        self._torch = torch

    def predict(self, goal, global_ctx, local_ctx):
        return self.predict_raw(format_proof_state(goal, global_ctx, local_ctx))

    def predict_raw(self, user_content: str) -> str:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
        input_text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self.tokenizer(input_text, return_tensors="pt").to(self.model.device)

        with self._torch.no_grad():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=128,
                temperature=0.0,
                do_sample=False,
                pad_token_id=self.tokenizer.pad_token_id or self.tokenizer.eos_token_id,
            )

        return self.tokenizer.decode(
            output_ids[0][inputs["input_ids"].shape[1]:],
            skip_special_tokens=True,
        ).strip()


class APIPredictor(TacticPredictor):
    def __init__(self, api_url: str, model_name: str = ""):
        import requests as _requests
        self._requests = _requests
        self.api_url = api_url.rstrip("/")
        self.model_name = model_name or self._detect_model()

    def _detect_model(self) -> str:
        resp = self._requests.get(f"{self.api_url}/models", timeout=10)
        resp.raise_for_status()
        models = resp.json().get("data", [])
        if not models:
            raise RuntimeError(
                f"No models found at {self.api_url}/models — pass --api-model explicitly"
            )
        return models[0]["id"]

    def predict(self, goal, global_ctx, local_ctx):
        return self.predict_raw(format_proof_state(goal, global_ctx, local_ctx))

    def predict_raw(self, user_content: str) -> str:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]
        resp = self._requests.post(
            f"{self.api_url}/chat/completions",
            json={
                "model": self.model_name,
                "messages": messages,
                "max_tokens": 128,
                "temperature": 0.0,
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


# ── Chat-format eval (each line = one independent step) ─────────────────────

def run_chat_format_eval(test_cases, predictor, args):
    """Evaluate a JSONL where each line is a chat-format training example
    ({"messages": [system, user, assistant]}). Each line is treated as one
    independent step — no proof grouping, no completion metric.
    """
    print(f"Evaluating {len(test_cases)} independent steps (chat format)\n")
    t0 = time.time()

    total = 0
    exact = 0
    head = 0
    cat = 0
    per_tactic = defaultdict(lambda: {"total": 0, "exact": 0, "head": 0})
    failures = []

    for i, tc in enumerate(test_cases):
        msgs = tc["messages"]
        user_content = next(m["content"] for m in msgs if m["role"] == "user")
        gold = next(m["content"] for m in msgs if m["role"] == "assistant").strip()

        predicted = predictor.predict_raw(user_content).strip()

        is_exact = predicted == gold
        is_head = tactic_head(predicted) == tactic_head(gold)
        is_cat = tactic_category(predicted) == tactic_category(gold)

        total += 1
        exact += is_exact
        head += is_head
        cat += is_cat

        gold_head = tactic_head(gold)
        per_tactic[gold_head]["total"] += 1
        if is_exact:
            per_tactic[gold_head]["exact"] += 1
        if is_head:
            per_tactic[gold_head]["head"] += 1

        if not is_exact and len(failures) < 20:
            failures.append((i, gold, predicted, user_content))

        if args.verbose:
            status = "OK" if is_exact else ("~" if is_head else "X")
            print(f"  [{i+1}/{len(test_cases)}] [{status}] gold={gold}  pred={predicted}")
        else:
            status = "OK" if is_exact else ("~" if is_head else "X")
            print(f"[{i+1}/{len(test_cases)}] [{status}] gold={gold}  pred={predicted}")

    elapsed = time.time() - t0

    print(f"\n{'=' * 60}")
    print(f"  Offline Step Evaluation (chat format)")
    print(f"{'=' * 60}")
    print(f"\n── Step-level accuracy ──")
    print(f"  Total steps:  {total}")
    if total:
        print(f"  Exact-match:  {exact}/{total} ({exact/total:.1%})")
        print(f"  Tactic-head:  {head}/{total} ({head/total:.1%})")
        print(f"  Category:     {cat}/{total} ({cat/total:.1%})")

    print(f"\n── Per-tactic breakdown ──")
    for tac in sorted(per_tactic, key=lambda t: per_tactic[t]["total"], reverse=True):
        s = per_tactic[tac]
        ex_pct = s["exact"] / s["total"] * 100 if s["total"] else 0
        hd_pct = s["head"] / s["total"] * 100 if s["total"] else 0
        print(f"  {tac:16s}  n={s['total']:4d}  exact={ex_pct:5.1f}%  head={hd_pct:5.1f}%")

    if failures:
        print(f"\n── Sample failures ({min(10, len(failures))}/{len(failures)}) ──")
        for idx, g, p, _uc in failures[:10]:
            print(f"  [{idx+1}] gold={g}")
            print(f"       pred={p}")

    print(f"\n  Time: {elapsed:.1f}s ({elapsed/max(total,1):.2f}s/step)")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump({
                "format": "chat",
                "total_steps": total,
                "exact_match_steps": exact,
                "head_match_steps": head,
                "category_match_steps": cat,
                "exact_match_pct": exact / total if total else 0,
                "head_match_pct": head / total if total else 0,
                "category_match_pct": cat / total if total else 0,
                "per_tactic": {k: dict(v) for k, v in per_tactic.items()},
                "elapsed_seconds": elapsed,
            }, f, indent=2, ensure_ascii=False)
        print(f"\nDetailed results written to {args.output}")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    # Load model
    if args.adapter:
        print(f"Loading local adapter from {args.adapter} ...")
        predictor = LocalPredictor(args.adapter)
    else:
        print(f"Using API at {args.api_url} ...")
        predictor = APIPredictor(args.api_url, args.api_model)
        print(f"  model: {predictor.model_name}")
    print("Model ready.\n")

    # Load test proofs
    test_path = Path(args.test_proofs)
    if not test_path.exists():
        print(f"Test proofs not found: {test_path}")
        sys.exit(1)

    with open(test_path, "r", encoding="utf-8") as f:
        test_cases = [json.loads(line) for line in f if line.strip()]

    # Detect chat-format (training-data style: each line = {"messages": [...]})
    # vs per-proof eval format (each line has theoremName + steps).
    is_chat_format = bool(test_cases) and "messages" in test_cases[0]

    if args.max_examples > 0:
        test_cases = test_cases[:args.max_examples]

    if is_chat_format:
        run_chat_format_eval(test_cases, predictor, args)
        return

    print(f"Evaluating {len(test_cases)} proofs "
          f"({sum(len(tc.get('steps', [])) for tc in test_cases)} total steps)\n")

    # ── Run evaluation ────────────────────────────────────────────────────
    t0 = time.time()

    # Accumulators
    total_steps = 0
    exact_match_steps = 0
    head_match_steps = 0
    category_match_steps = 0

    proofs_total = 0
    proofs_completed = 0  # all steps exact-match

    per_difficulty = defaultdict(lambda: {
        "total": 0, "completed": 0,
        "steps_total": 0, "steps_exact": 0, "steps_head": 0,
    })
    per_tactic = defaultdict(lambda: {"total": 0, "exact": 0, "head": 0})
    per_step_depth = defaultdict(lambda: {"total": 0, "exact": 0, "head": 0})

    proof_results = []

    for i, tc in enumerate(test_cases):
        name = tc["theoremName"]
        steps = tc.get("steps", [])
        num_steps = tc.get("numSteps", len(steps))
        difficulty = (
            "easy" if num_steps <= 2
            else "medium" if num_steps <= 5
            else "hard"
        )

        proofs_total += 1
        all_correct = True
        step_details = []

        if args.verbose:
            print(f"\n[{i+1}/{len(test_cases)}] {name} ({num_steps} steps, {difficulty})")

        for step in steps:
            gold = step["goldTactic"]
            goal = step["goal"]
            global_ctx = step.get("globalContext", [])
            local_ctx = step.get("localContext", [])
            step_idx = step["stepIndex"]

            predicted = predictor.predict(goal, global_ctx, local_ctx)

            is_exact = predicted == gold
            is_head = tactic_head(predicted) == tactic_head(gold)
            is_cat = tactic_category(predicted) == tactic_category(gold)

            total_steps += 1
            exact_match_steps += is_exact
            head_match_steps += is_head
            category_match_steps += is_cat

            if not is_exact:
                all_correct = False

            # Per-tactic
            gold_head = tactic_head(gold)
            per_tactic[gold_head]["total"] += 1
            if is_exact:
                per_tactic[gold_head]["exact"] += 1
            if is_head:
                per_tactic[gold_head]["head"] += 1

            # Per-depth
            per_step_depth[step_idx]["total"] += 1
            if is_exact:
                per_step_depth[step_idx]["exact"] += 1
            if is_head:
                per_step_depth[step_idx]["head"] += 1

            # Per-difficulty step stats
            per_difficulty[difficulty]["steps_total"] += 1
            if is_exact:
                per_difficulty[difficulty]["steps_exact"] += 1
            if is_head:
                per_difficulty[difficulty]["steps_head"] += 1

            step_details.append({
                "stepIndex": step_idx,
                "goal": goal[:100],
                "gold": gold,
                "predicted": predicted,
                "exact_match": is_exact,
                "head_match": is_head,
                "category_match": is_cat,
            })

            if args.verbose:
                status = "OK" if is_exact else ("~" if is_head else "X")
                print(f"  step {step_idx}: [{status}] gold={gold}  pred={predicted}")

        if all_correct:
            proofs_completed += 1

        per_difficulty[difficulty]["total"] += 1
        if all_correct:
            per_difficulty[difficulty]["completed"] += 1

        proof_results.append({
            "theoremName": name,
            "numSteps": num_steps,
            "difficulty": difficulty,
            "allCorrect": all_correct,
            "steps": step_details,
        })

        if not args.verbose:
            status = "OK" if all_correct else "FAIL"
            correct_steps = sum(1 for s in step_details if s["exact_match"])
            print(f"[{i+1}/{len(test_cases)}] {name} ({num_steps} steps, {difficulty}) "
                  f"... {status} ({correct_steps}/{len(steps)} steps exact)")

    elapsed = time.time() - t0

    # ── Summary ───────────────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print(f"  Offline Proof Evaluation Results")
    print(f"{'=' * 60}")

    print(f"\n── Step-level accuracy ──")
    print(f"  Total steps:       {total_steps}")
    print(f"  Exact-match:       {exact_match_steps}/{total_steps} "
          f"({exact_match_steps/total_steps:.1%})" if total_steps else "")
    print(f"  Tactic-head:       {head_match_steps}/{total_steps} "
          f"({head_match_steps/total_steps:.1%})" if total_steps else "")
    print(f"  Category:          {category_match_steps}/{total_steps} "
          f"({category_match_steps/total_steps:.1%})" if total_steps else "")

    print(f"\n── Simulated proof completion (all steps exact-match) ──")
    print(f"  Total proofs:      {proofs_total}")
    print(f"  Completed:         {proofs_completed}/{proofs_total} "
          f"({proofs_completed/proofs_total:.1%})" if proofs_total else "")

    print(f"\n── By difficulty ──")
    for diff in ["easy", "medium", "hard"]:
        s = per_difficulty[diff]
        if s["total"] > 0:
            comp_pct = s["completed"] / s["total"]
            step_pct = s["steps_exact"] / s["steps_total"] if s["steps_total"] else 0
            head_pct = s["steps_head"] / s["steps_total"] if s["steps_total"] else 0
            print(f"  {diff:8s}: proofs={s['completed']}/{s['total']} ({comp_pct:.1%})  "
                  f"steps: exact={step_pct:.1%} head={head_pct:.1%}")

    print(f"\n── Per-tactic breakdown ──")
    for tac in sorted(per_tactic, key=lambda t: per_tactic[t]["total"], reverse=True):
        s = per_tactic[tac]
        exact_pct = s["exact"] / s["total"] * 100 if s["total"] else 0
        head_pct = s["head"] / s["total"] * 100 if s["total"] else 0
        print(f"  {tac:16s}  n={s['total']:4d}  exact={exact_pct:5.1f}%  head={head_pct:5.1f}%")

    print(f"\n── Per step-depth ──")
    for depth in sorted(per_step_depth):
        s = per_step_depth[depth]
        exact_pct = s["exact"] / s["total"] * 100 if s["total"] else 0
        head_pct = s["head"] / s["total"] * 100 if s["total"] else 0
        print(f"  step {depth:2d}:  n={s['total']:4d}  exact={exact_pct:5.1f}%  head={head_pct:5.1f}%")

    # Show sample failures
    failures = [r for r in proof_results if not r["allCorrect"]]
    if failures:
        print(f"\n── Sample failures ({min(10, len(failures))}/{len(failures)}) ──")
        for r in failures[:10]:
            gold_seq = " -> ".join(s["gold"] for s in r["steps"])
            pred_seq = " -> ".join(s["predicted"] for s in r["steps"])
            wrong = [s for s in r["steps"] if not s["exact_match"]]
            print(f"  {r['theoremName']} ({r['numSteps']} steps)")
            print(f"    gold: {gold_seq[:120]}")
            print(f"    pred: {pred_seq[:120]}")
            if wrong:
                w = wrong[0]
                print(f"    first wrong at step {w['stepIndex']}: "
                      f"gold={w['gold']}  pred={w['predicted']}")
            print()

    print(f"\n  Time: {elapsed:.1f}s ({elapsed/max(proofs_total,1):.1f}s/proof)")

    # ── Write output ──────────────────────────────────────────────────────
    if args.output:
        output_data = {
            "total_proofs": proofs_total,
            "completed_proofs": proofs_completed,
            "completion_rate": proofs_completed / proofs_total if proofs_total else 0,
            "total_steps": total_steps,
            "exact_match_steps": exact_match_steps,
            "head_match_steps": head_match_steps,
            "category_match_steps": category_match_steps,
            "exact_match_pct": exact_match_steps / total_steps if total_steps else 0,
            "head_match_pct": head_match_steps / total_steps if total_steps else 0,
            "category_match_pct": category_match_steps / total_steps if total_steps else 0,
            "elapsed_seconds": elapsed,
            "per_difficulty": {k: dict(v) for k, v in per_difficulty.items()},
            "per_tactic": {k: dict(v) for k, v in per_tactic.items()},
            "per_step_depth": {str(k): dict(v) for k, v in per_step_depth.items()},
            "results": proof_results,
        }
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f"\nDetailed results written to {args.output}")


if __name__ == "__main__":
    main()
