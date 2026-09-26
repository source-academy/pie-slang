# Runpod Serverless — Pie tactic LoRA endpoint

Serve the fine-tuned tactic model on Runpod **serverless** (scale-to-zero, ~$0 idle)
using **flash** (code-first — no Docker, no registry). This is the cloud twin of
`training/launch.sh`; the frontend can point at it instead of `localhost:8000`.

- **GPU:** `GpuGroup.AMPERE_16` — the cheapest 16 GB pool (RTX A4000 / 4000-Ada class).
  7B in 4-bit ≈ 6 GB, so 16 GB is comfortable.
- **Load path:** transformers + PEFT + bitsandbytes NF4, greedy decode — byte-for-byte
  the `LocalPredictor` path from `evaluate_offline.py` (the one that gives 13/13). GGUF /
  quantized-vLLM is deliberately avoided (see CLAUDE.md).
- **Weights:** base `unsloth/qwen2.5-coder-7b-instruct-bnb-4bit` (public, no token) +
  the LoRA adapter from a **private HF repo** (pushed by `push-adapter.sh`).

## One-time prerequisites (installed already this session)

- `uv` (`~/.local/bin/uv`), `flash` (`~/.local/bin/flash`, v1.19.0), `hf` (v1.32.0).
- Add `~/.local/bin` to PATH if a new shell can't find `flash`/`hf`.

## Deploy (5 steps)

```bash
cd training/runpod

# 1. Auth (both are browser OAuth / token — no key pasted into files).
flash login                      # saves a Runpod key to ~/.runpod/config.toml (unlocks all lanes)
hf auth login                    # HF token with WRITE (to push) — read is enough for the workers

# 2. Push the adapter to a private HF repo (replace <hf-username>).
./push-adapter.sh <hf-username>  # → PIE_ADAPTER_REF=<hf-username>/pie-tactic-lora

# 3. Point the endpoint at that repo + your HF (read) token.
cp .env.example .env
#   edit .env: PIE_ADAPTER_REF=<hf-username>/pie-tactic-lora, HF_TOKEN=hf_...
set -a; source .env; set +a          # export them for `flash deploy`

# 4. Ship it.
flash deploy                     # builds + provisions; prints the endpoint id + URL

# 5. Verify with a real request (cold start ~30-60s; use /run + poll, then /runsync when warm).
EP=<endpoint-id>
curl -s "https://api.runpod.ai/v2/$EP/runsync" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" -H 'Content-Type: application/json' \
  -d '{"input":{"goal":"(Either (Even n) (Odd n))","globalContext":[],"localContext":[{"name":"n","type":"Nat"}]}}'
# → {"status":"COMPLETED","output":{"tactic":"...","tactic_head":"...","category":"...","elapsed_ms":...}}
```

## Iterate before deploying

`flash dev` runs the handler on a real GPU worker with hot-reload + live logs:

```bash
set -a; source .env; set +a
flash dev > /tmp/flash-dev.log 2>&1 &        # background; read the URL/port from the log
# QB endpoint: POST http://localhost:8888/main/runsync with a DOUBLE-wrapped body:
curl -s http://localhost:8888/main/runsync \
  -d '{"input":{"goal":"Nat","globalContext":[],"localContext":[]}}'
```

## Request / response contract

The endpoint is queue-based; the worker calls `handler(**job_input)`, so `input` keys
map to the handler's fields. `runsync`/`run` wrap the body in `input`:

```jsonc
// request
{ "input": { "goal": "<sugared type>",
             "globalContext": [{"name":"plus","type":"..."}],
             "localContext":  [{"name":"n","type":"Nat"}] } }
// response.output
{ "tactic": "elim-Nat n", "raw_output": "elim-Nat n",
  "tactic_head": "elim-Nat", "category": "elimination", "elapsed_ms": 812.3 }
```

## Frontend wiring

Set the endpoint in the app's **AI Settings** panel:
- **LoRA server URL:** `https://api.runpod.ai/v2/<endpoint-id>` (or `.../runsync`)
- **LoRA API key:** your `RUNPOD_API_KEY`

When the URL is a `runpod.ai` host, the worker bridge switches to the serverless
protocol automatically: `POST .../runsync`, `Authorization: Bearer <key>`, body wrapped
in `input`, and it reads the tactic out of `response.output`. See
`web-react/src/workers/proof-worker.ts` (`fetchAndValidateLoraPrediction`).

> **Cold start:** after idle scale-to-zero, the first hint reloads the 7B model
> (~30-60s). `idle_timeout=120` keeps a worker warm for 2 min of active proving.
> `runsync` has a ~60s ceiling; the bridge falls back to `/run` + poll on cold calls.

## Windows deploy gotchas (both already handled here)

1. **`flash deploy` crashes with `UnicodeEncodeError: 'gbk' codec`.** flash's output
   library (`rich`) can't encode its ✓/✗ glyphs under a GBK console codepage. Fix:
   run with UTF-8 forced —
   `PYTHONUTF8=1 PYTHONIOENCODING=utf-8 NO_COLOR=1 TERM=dumb flash deploy`.
2. **Worker dies with `CUDA Setup failed` / old bitsandbytes.** flash bundles the
   **locally-installed** wheels; the Windows `bitsandbytes` is a native CUDA extension
   that doesn't run on the Linux worker. So `bitsandbytes` is intentionally left out of
   `dependencies=[...]` in `main.py`, and the handler `pip install`s the Linux build once
   per worker at startup (before `peft` imports it). Pure-Python deps
   (transformers/peft/accelerate) bundle cross-platform fine; torch is on the worker base.

   (Building from WSL/Linux would also produce correct wheels, but flash's 600 s pip-install
   cap trips on the transitive torch download there — the runtime-install approach is faster.)

## Cost & cleanup

Scale-to-zero (`workers=(0,1)`) is ~$0 when idle. To tear down completely:

```bash
flash app delete pie-tactic-lora        # or: runpodctl serverless delete <endpoint-id>
```

The private HF adapter repo costs nothing; delete it from the HF UI if you no longer
need cloud serving.
