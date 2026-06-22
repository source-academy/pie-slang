# Setup Guide

## Requirements

| Component | Version |
|-----------|---------|
| Node.js | 18+ |
| Yarn | 1.x |
| Docker | 20+ (for Docker-based model serving) |
| **OR** Conda + NVIDIA GPU | CUDA 12.1+, 12 GB VRAM (for native model serving) |
| Gemini API key | Optional — for hint explanations and goal translation |

**Platform notes:**
- The **Docker image** (`timthedev07/trypieagain`) is `linux/amd64` only. It works on Linux, macOS (via Rosetta/emulation), and Windows with Docker Desktop + WSL2.
- **Native PEFT serving** (`training/serve.py`) requires an NVIDIA GPU with CUDA. On Windows with NVIDIA driver >= 580, use Windows-native conda — **not** Docker/WSL2 CUDA (the `cuInit` bridge is broken on those drivers).

---

## 1. Install & Build the Interpreter

```bash
yarn install
yarn build          # rollup build to /dist
yarn test           # verify everything passes
```

## 2. Run the Frontend

```bash
cd web-react
yarn install        # first time only
yarn dev            # starts Vite dev server at http://localhost:5173
```

The proof editor works without any AI model — you can construct proofs manually. The AI features (hints, goal translation) require additional setup below.

---

## 3. Set Up the Tactic Prediction Model

The fine-tuned LoRA model predicts the next tactic given a proof goal and context. Two ways to run it:

### Option A: Docker (recommended for evaluation, no GPU setup needed)

The image `timthedev07/trypieagain` bundles the base model (Qwen2.5-Coder-7B-Instruct, 4-bit), the LoRA adapter, and evaluation scripts. **~3.8 GB compressed, ~8 GB uncompressed.** Requires NVIDIA Container Toolkit for GPU inference.

```bash
# Pull the image
docker pull timthedev07/trypieagain:latest

# Run the bundled evaluation (default CMD)
docker run --gpus all timthedev07/trypieagain:latest
# Runs: python evaluate_offline.py --adapter /app/adapter --test-proofs /app/test-even-or-odd-holdout.jsonl

# Run with verbose evaluation output
docker run --gpus all timthedev07/trypieagain:latest \
  python evaluate_offline.py --adapter /app/adapter \
    --test-proofs /app/test-even-or-odd-holdout.jsonl --verbose
```

**Image contents:**
- Base: Ubuntu 22.04 + CUDA 12.4.1 + PyTorch 2.5.1 (conda)
- `/app/evaluate_offline.py` — offline step-level evaluation script
- `/app/adapter/` — PEFT LoRA adapter weights (~320 MB)
- `/app/test-even-or-odd-holdout.jsonl` — 13-step holdout test
- `/app/hf_cache/` — pre-cached base model weights

> **Note:** The image bundles `evaluate_offline.py` only — `serve.py` is **not** included. To use it as a prediction server for the frontend, mount `serve.py` from the repo:

```bash
docker run --gpus all -p 8000:8000 \
  -v $(pwd)/training/serve.py:/app/serve.py \
  -v $(pwd)/training/evaluate_offline.py:/app/evaluate_offline.py \
  timthedev07/trypieagain:latest \
  python serve.py --adapter /app/adapter --port 8000
```

**Limitations:**
- `linux/amd64` only — no native ARM support
- Requires NVIDIA Container Toolkit (`nvidia-docker2`) for GPU passthrough
- First prediction is slow (~30s, CUDA warmup); subsequent ~1-2s/step

### Option B: Native PEFT (Windows/Linux with NVIDIA GPU)

Serves the adapter directly via conda. This is the primary development setup.

**One-time environment setup:**

```bash
# Create conda env with PyTorch + CUDA
conda create -n pie-train python=3.11 pytorch pytorch-cuda=12.1 -c pytorch -c nvidia -y

# Install dependencies
conda run -n pie-train pip install -r training/requirements.txt
```

`training/requirements.txt`:
```
unsloth, unsloth_zoo, trl==0.24.0, datasets==4.3.0, accelerate,
bitsandbytes, peft, safetensors, sentencepiece, protobuf,
torchao==0.7.0, torchvision, triton-windows, pillow, tyro
```

Additionally, `serve.py` needs: `fastapi`, `uvicorn`.

```bash
conda run -n pie-train pip install fastapi uvicorn
```

**Start the prediction server:**

```bash
# Using the launch script
./training/launch.sh

# Or directly
conda run -n pie-train --no-capture-output \
  python training/serve.py --adapter training/output/adapter --port 8000
```

The server exposes:
- `GET /health` — check if model is loaded
- `POST /predict` — predict next tactic given `{goal, globalContext, localContext}`

**Verify the model:**

```bash
conda run -n pie-train --no-capture-output \
  python training/evaluate_offline.py \
    --adapter training/output/adapter \
    --test-proofs training/test-even-or-odd-holdout.jsonl --verbose
# Expected: 13/13 exact-match (100%)
```

---

## 4. Set Up Gemini API (Optional)

Gemini provides two features:
1. **Hint explanations** — when the LoRA model predicts a tactic, Gemini explains *why* it's the right move at progressive detail levels (category -> tactic name -> full tactic with arguments).
2. **Goal translation** — translates Pie type expressions (e.g. `(Π ((n Nat)) (Either (Even n) (Odd n)))`) into plain English.

Both features work without the LoRA model (Gemini-only mode), but accuracy is lower.

**Get a key:**
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key (free tier is sufficient)

**Configure in the app:**
- Open the proof editor frontend
- Expand the **AI Hints** panel in the left sidebar
- Paste your Gemini API key in the "Gemini API Key" field
- The key is saved to `localStorage` and persists across sessions

**Alternative — environment variable:**
Create `web-react/.env.local`:
```
VITE_GOOGLE_API_KEY=AIza...your-key-here
```
The app loads this at startup if no key is in localStorage.

---

## 5. Connect the Frontend to the Model

Once the prediction server is running (Docker or native):

1. Open the frontend at `http://localhost:5173`
2. Expand **AI Hints** in the left sidebar
3. Set **Local Model Server** URL to `http://localhost:8000`
4. The health indicator turns green when the server is reachable

**Hint priority chain:** LoRA prediction -> Gemini explanation -> rule-based fallback. If LoRA is unavailable, Gemini handles both prediction and explanation. If neither is configured, simple pattern-matching rules are used.

---

## Training Data Metadata

| File | Entries | Size | Format |
|------|---------|------|--------|
| `training-data-clean.jsonl` | 3,794 steps / 948 theorems | 2.5 MB | Normalized JSONL (theoremName, goal, tactic, context) |
| `training-data-lora-single.jsonl` | 3,794 | 2.1 MB | Chat format (system/user/assistant) — **training input** |
| `training-data-lora-multi.jsonl` | 948 conversations | 2.8 MB | Multi-turn chat — optional second-stage |
| `training/output/adapter/` | — | 320 MB | PEFT LoRA adapter weights |

### Tactic Distribution (training set)

| Tactic | Count | % |
|--------|-------|---|
| intro | 1,555 | 41.0% |
| exact | 1,227 | 32.3% |
| exists | 519 | 13.7% |
| elim-Either | 140 | 3.7% |
| go-Left | 103 | 2.7% |
| go-Right | 95 | 2.5% |
| split-Pair | 71 | 1.9% |
| elim-Nat | 41 | 1.1% |
| apply | 18 | 0.5% |
| elim-Absurd | 15 | 0.4% |
| elim-List | 9 | 0.2% |

### Model

- **Base:** Qwen2.5-Coder-7B-Instruct (4-bit QLoRA, NormalFloat quantization)
- **LoRA config:** rank 32, alpha 64, dropout 0.05, target modules: q/k/v/o/gate/up/down_proj
- **Training:** 5 epochs, lr 2e-4, effective batch 16, ~90 min on RTX 4080 Laptop
- **Serving:** PEFT 4-bit inference (~1-2s/step after warmup)

### Holdout Evaluation (706 steps, 157 novel theorems)

| Metric | Score |
|--------|-------|
| Exact-match | 72.9% |
| Tactic-head | 92.8% |
| Category | 95.6% |
| Proof completion | 40.1% |

Full results in `training/HOLDOUT_EVAL.md`.

---

## Quick Reference

```bash
# Terminal 1: prediction server
./training/launch.sh                    # native
# or
docker run --gpus all -p 8000:8000 \    # docker
  timthedev07/trypieagain:latest \
  python serve.py --adapter /app/adapter --port 8000

# Terminal 2: frontend
cd web-react && yarn dev

# Then open http://localhost:5173, configure AI Hints panel
```
