# Pie Tactic Proof Assistant — LoRA Fine-Tuning Pipeline

## Overview

This pipeline fine-tunes a language model to predict the next tactic in a
dependently-typed proof for the Pie language (from *The Little Typer*).
Given a proof goal and context, the model outputs a tactic string like
`intro n`, `exact (same 5)`, or `ind-nat n`.

## Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| GPU | RTX 3060 (12 GB) | RTX 4080 Laptop (12 GB) |
| RAM | 16 GB | 32 GB |
| Disk | 20 GB free | 30 GB free |
| CUDA | 12.1+ | 12.1+ |
| Python | 3.10+ | 3.10+ |

## Model

**Qwen/Qwen2.5-Coder-7B-Instruct** with 4-bit QLoRA

- 7B parameters, ~4.5 GB quantized
- Code-specialized: handles S-expressions and formal syntax well
- Fits in 12 GB VRAM with batch size 4 + gradient checkpointing

## Dataset

| File | Entries | Format | Purpose |
|------|---------|--------|---------|
| `training-data.jsonl` | 10,598 | Raw extracted | Archive only |
| `training-data-clean.jsonl` | 3,215 | Normalized JSONL | Reference / debugging |
| `training-data-lora-single.jsonl` | 3,215 | Chat (system/user/assistant) | **Training input** |
| `training-data-lora-multi.jsonl` | 704 | Multi-turn chat | Optional second-stage |

### Data Cleanup Applied

1. **Schema normalized** — old flat `context` migrated to `globalContext`/`localContext`
2. **Types normalized** — multiline S-expressions collapsed to single-line
3. **Deduplicated** — 10,598 → 4,028 (parametric test instances collapsed)
4. **Trivial proofs filtered** — 833 single-step `exact (same N)` → 20 kept
5. **Final**: 3,215 clean training examples across 704 theorems

### Sequence Length Profile

| Metric | Tokens (approx) |
|--------|-----------------|
| Average input+output | 128 |
| P95 | 297 |
| Max | 1,000 |
| Average output (tactic) | 4 |
| `max_seq_length` used | 1,024 |

## Exact Commands (copy-paste ready)

All commands below use the **exact paths** on this machine. Conda is at
`D:\Tools\Conda\Scripts\conda.exe`, the conda env is `pie-train`, and the
project root is `C:\Users\fzjjs\IdeaProjects\pie-slang`.

> **IMPORTANT for agents/automation**: `conda run` buffers all stdout/stderr
> until the process exits. Training takes ~90 minutes and you will see NO
> output until it finishes. Check `nvidia-smi` or `tasklist | grep python`
> to confirm the process is alive.

### Step 0: Environment Setup (one-time)

```bash
# Create conda env with PyTorch + CUDA
/d/Tools/Conda/Scripts/conda.exe create -n pie-train python=3.11 pytorch pytorch-cuda=12.1 -c pytorch -c nvidia -y

# Install deps
/d/Tools/Conda/Scripts/conda.exe run -n pie-train pip install -r training/requirements.txt
```

Key packages: `unsloth` (QLoRA), `trl` (SFTTrainer), `datasets`, `bitsandbytes`.

### Step 1: Extract & Clean Training Data

Run this whenever test cases under `tactics-math/` have changed:

```bash
# 1a. Extract raw training data by running all tactic tests with instrumentation
COLLECT_TRAINING_DATA=training-data.jsonl npx jest --testPathPatterns="tactics-math" --runInBand --no-coverage

# 1b. Clean, deduplicate, and format for LoRA
npx tsx src/pie-interpreter/scripts/clean-training-data.ts
```

Outputs:
- `training-data.jsonl` — raw extracted entries
- `training-data-clean.jsonl` — deduplicated, normalized
- `training-data-lora-single.jsonl` — **training input** (chat format)
- `training-data-lora-multi.jsonl` — multi-turn conversations

### Step 2: Train

```bash
/d/Tools/Conda/Scripts/conda.exe run -n pie-train python training/train.py --batch 1 --grad-accum 16
```

| Parameter | Value | Flag |
|-----------|-------|------|
| Base model | Qwen2.5-Coder-7B-Instruct | `--model` |
| Epochs | 5 | `--epochs` |
| Learning rate | 2e-4 | `--lr` |
| Batch size | 1 | `--batch` |
| Gradient accumulation | 16 (effective batch = 16) | `--grad-accum` |
| LoRA rank | 32 | `--lora-r` |
| LoRA alpha | 64 | `--lora-alpha` |
| Eval split | 10% | `--eval-split` |
| Output | `training/output/` | `--output` |

**Duration**: ~195 steps, ~33s/step, **~90 minutes total**.

**How to verify it's running** (since conda buffers output):
```bash
nvidia-smi                          # GPU memory should show ~11-12 GB used
tasklist.exe | grep python          # look for a python.exe using ~5-7 GB RAM
```

**How to check results after completion**:
```bash
# Read training metrics from latest checkpoint
python -c "
import json
with open('training/output/checkpoint-195/trainer_state.json') as f:
    d = json.load(f)
for e in d['log_history'][-5:]: print(e)
"
```

#### LoRA Configuration

- **Quantization**: 4-bit NormalFloat (bnb-nf4)
- **Target modules**: q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
- **Dropout**: 0.05
- **Gradient checkpointing**: unsloth (60% VRAM reduction)
- **Packing**: enabled (short examples packed into single sequences)

#### Outputs

```
training/output/
├── adapter/              # LoRA adapter weights
│   ├── adapter_config.json
│   ├── adapter_model.safetensors
│   └── tokenizer files
```

### Step 3: Launch prediction server

The PEFT adapter is served via `serve.py` which loads the adapter directly
on the GPU (RTX 4080 Laptop, ~1s/step in batch, ~30s/step via HTTP due to
per-request overhead). This gives 13/13 exact-match on the holdout — GGUF
quantization loses precision on subtle context distinctions.

```bash
./training/launch.sh
# or equivalently:
conda run -n pie-train --no-capture-output python training/serve.py \
    --adapter training/output/adapter --port 8000
```

#### Cloud serving — Runpod serverless (scale-to-zero)

To serve the same adapter in the cloud instead of on this laptop, deploy the
**flash** serverless endpoint in `training/runpod/` (cheapest 16 GB GPU pool,
`workers=(0,1)` so it costs ~$0 when idle). The worker reuses the exact
`LocalPredictor` load path (transformers + PEFT + bitsandbytes NF4) — not GGUF —
so it reproduces the same predictions. Full walkthrough:
[`training/runpod/README.md`](runpod/README.md). In short:

```bash
cd training/runpod
flash login                          # Runpod browser OAuth (saves a key, unlocks flash+runpodctl)
hf auth login                        # HF token (write, to push the adapter)
./push-adapter.sh <hf-username>      # adapter → private HF repo
cp .env.example .env                 # set PIE_ADAPTER_REF + HF_TOKEN, then: set -a; source .env; set +a
flash deploy                         # → prints the endpoint id
```

Then point the frontend's **AI Settings → Local Model Server** at
`https://api.runpod.ai/v2/<endpoint-id>` and paste your Runpod API key in the
**Runpod API Key** field that appears (the worker bridge auto-switches to the
serverless protocol for `runpod.ai` hosts).

### Step 4: Verify — Even-or-Odd Agent Test (REQUIRED)

**Every new model MUST pass this test.** It proves the theorem
`(Π ((n Nat)) (Either (Even n) (Odd n)))` interactively — the model must
pick `elim-Nat` at step 1 (induction), then `elim-Either` on the IH, then
correct `go-Left`/`go-Right` + `exact` calls with helper lemmas.

```bash
# 4a. Sanity check — gold tactics (hardcoded correct sequence, tests infrastructure)
npx tsx training/agent-test-even-odd/test-agent.ts --gold

# 4b. LLM test — the model drives the proof (requires Ollama running with pie-tactic)
npx tsx training/agent-test-even-odd/test-agent.ts --llm
```

**Expected output for success:**
```
✓ even-or-odd proved successfully (llm mode, XXXXms)
```

**What the test checks:**
1. Does the model use `elim-Nat` for induction? (not `exists` or `go-Left`)
2. Does it `elim-Either` on the inductive hypothesis in the step case?
3. Does it choose `go-Right` for even→odd and `go-Left` for odd→even?
4. Does it construct correct `exact` terms with `add1-even->odd`/`add1-odd->even`?

**Environment variables for the LLM test:**
```bash
OLLAMA_URL=http://localhost:11434   # default
OLLAMA_MODEL=pie-tactic:latest      # default
```

**If the test fails**, add `--verbose` or `-v` to see each step:
```bash
npx tsx training/agent-test-even-odd/test-agent.ts --llm --verbose
```

The log is also written to `training/agent-test-even-odd/log.md`.

### Step 5: Evaluate — Offline Metrics

```bash
conda run -n pie-train --no-capture-output python training/evaluate_offline.py \
  --adapter training/output/adapter \
  --test-proofs training/test-even-or-odd-holdout.jsonl
```

`evaluate_offline.py` auto-detects chat-format (`{"messages":[...]}`) vs the structured per-proof format, so it works on both `test-even-or-odd-holdout.jsonl` and `test-proofs-even-odd.jsonl`. The base model (`unsloth/qwen2.5-coder-7b-instruct-bnb-4bit`, ~4 GB) is downloaded on first run into `~\.cache\huggingface\`.

| Metric | What it measures | Target |
|--------|-----------------|--------|
| **Exact-match** | Predicted tactic == ground truth | ≥ 60% |
| **Tactic-head** | Correct tactic name, ignoring args | ≥ 80% |
| **Category** | Correct category (intro/elim/constructor) | ≥ 90% |

**Last verified (RTX 4080 Laptop, Windows-native, holdout = even-or-odd):** 13/13 exact-match, 0.62 s/step, 8.1 s total.

> **Do NOT attempt this via Docker on Windows with NVIDIA driver ≥ 580.xx** — the WSL2 libcuda bridge is broken at the `cuInit` level on that driver family. Even a raw `ctypes` load of the real WSL driver `.so.1.1` returns Error 500. Run Windows-native via the `pie-train` conda env; it uses `nvcuda.dll` directly and is unaffected.

### Step 6: Evaluate — Full Proof Completion (TODO — needs rewrite)

> **Currently unavailable.** The previous `test_proof_completion.py` + `proof-server.ts` + `serve.py` chain was removed during a cleanup and needs to be rewritten. A replacement should:
>
> - Run the fine-tuned model (via PEFT or Ollama-served GGUF) as a tactic oracle
> - Drive the Pie interpreter interactively, feeding each generated tactic through `ProofState` and the real tactic pipeline (see `src/pie-interpreter/tactics/`)
> - Capture per-proof success, per-step validity, and error reasons when a tactic fails to apply
> - Support both the `test-proofs-even-odd.jsonl` and `test-proofs.jsonl` structured datasets
> - Avoid the old HTTP-server split if possible — a single-process Node bridge from Python (or a pure-TS runner using `node-llama-cpp`) is easier to maintain
>
> Until it exists, use Step 5 (offline per-step metrics) + Step 4 (end-to-end even-or-odd agent test via Ollama) as the validation gate.

## Quick Reference: Full Retrain Cycle

Copy-paste this block to retrain after adding new test cases:

```bash
# 1. Extract training data
COLLECT_TRAINING_DATA=training-data.jsonl npx jest --testPathPatterns="tactics-math" --runInBand --no-coverage

# 2. Clean and format
npx tsx src/pie-interpreter/scripts/clean-training-data.ts

# 3. Train (~90 min, output is buffered — check nvidia-smi to confirm it's running)
/d/Tools/Conda/Scripts/conda.exe run -n pie-train python training/train.py --batch 1 --grad-accum 16

# 4. Verify (REQUIRED — must pass before considering the model ready)
conda run -n pie-train --no-capture-output python training/evaluate_offline.py \
    --adapter training/output/adapter --test-proofs training/test-even-or-odd-holdout.jsonl --verbose

# 5. Launch prediction server
./training/launch.sh
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `conda: command not found` | Use full path: `/d/Tools/Conda/Scripts/conda.exe` |
| `No module named 'unsloth'` | Must use conda env: `/d/Tools/Conda/Scripts/conda.exe run -n pie-train ...` |
| Training output is empty | `conda run` buffers output. Check `nvidia-smi` — GPU should show ~11 GB used |
| CUDA out of memory | Reduce `--batch` to 1 (already default) |
| Slow training | Ensure `unsloth` installed correctly (should show "Unsloth" banner) |
| Poor eval accuracy | Try `--epochs 8 --lr 1e-4` (more epochs, lower LR) |
| Eval loss increasing | Overfitting — reduce epochs or increase `--lora-r` to 64 |
| Even-or-odd test fails | Check `training/agent-test-even-odd/log.md` for which step broke |
