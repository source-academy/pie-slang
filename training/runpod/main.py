"""
Runpod Serverless endpoint for the Pie tactic-prediction LoRA model (flash lane).

Deploys the SAME load + greedy-decode path as `training/evaluate_offline.py`
`LocalPredictor` (transformers + PEFT + bitsandbytes NF4) — the only path that
reproduces 13/13 exact-match on the holdout. GGUF/quantized-vLLM is intentionally
NOT used (see CLAUDE.md — Q4_K_M loses the go-Left vs go-Right distinction).

Serving shape: a scale-to-zero, queue-based flash endpoint on the cheapest 16 GB
GPU pool (AMPERE_16 = RTX A4000 / 4000-Ada class). 7B in 4-bit ≈ 6 GB, so 16 GB
is comfortable.

Contract (matches the frontend LoRA request):
    input : { "goal": str, "globalContext": [{name,type}], "localContext": [{name,type}] }
    output: { "tactic", "raw_output", "tactic_head", "category", "elapsed_ms" }

flash rules honoured here (see the flash SKILL gotchas):
  * Only the function BODY ships to the worker under `flash dev` — so every import,
    constant, and helper the handler needs lives INSIDE the function.
  * The model is loaded ONCE per worker into a module global, reused across calls.
  * The queue worker calls `handler(**job_input)`, so the handler takes `**kwargs`
    and reads goal/globalContext/localContext out of it. Callers must send a
    non-empty `input`.

Deploy:  cd training/runpod && flash deploy
Iterate: cd training/runpod && flash dev            (runs the fn on a real GPU worker)

Adapter + base are pulled from wherever ADAPTER_REF / BASE_MODEL point (an HF repo
id, or a /runpod-volume/... path). Set them in the `env=` block below.
"""

import os

from runpod_flash import Endpoint, GpuGroup

# Where the worker gets the weights. Overridable without editing code by exporting
# these before `flash deploy`. Defaults:
#   BASE_MODEL  — public/ungated 4-bit base, no HF token needed.
#   ADAPTER_REF — set to your HF repo id (e.g. "youruser/pie-tactic-lora") OR a
#                 network-volume path ("/runpod-volume/pie-tactic-lora").
BASE_MODEL = os.environ.get("PIE_BASE_MODEL", "unsloth/qwen2.5-coder-7b-instruct-bnb-4bit")
ADAPTER_REF = os.environ.get("PIE_ADAPTER_REF", "REPLACE_ME_ADAPTER_REF")


@Endpoint(
    name="pie-tactic-lora",
    gpu=GpuGroup.AMPERE_16,          # cheapest 16 GB pool — ample for 7B-4bit
    workers=(0, 1),                  # scale-to-zero: ~$0 when idle
    idle_timeout=120,                # stay warm 2 min between hints in a session
    flashboot=True,                  # snapshot-restore for faster cold starts
    env={
        "PIE_BASE_MODEL": BASE_MODEL,
        "PIE_ADAPTER_REF": ADAPTER_REF,
        # HF_TOKEN is only needed if ADAPTER_REF is a PRIVATE HF repo; injected by
        # `flash deploy` from the environment if present.
        **({"HF_TOKEN": os.environ["HF_TOKEN"]} if os.environ.get("HF_TOKEN") else {}),
    },
    dependencies=[
        # NOTE: bitsandbytes is deliberately NOT listed here. flash bundles the
        # LOCALLY-installed wheels into the artifact, and this project is built
        # on Windows — the Windows bitsandbytes wheel is a native CUDA extension
        # that fails on the Linux GPU worker ("CUDA Setup failed"). The other
        # deps are pure-Python and bundle cross-platform fine; torch is already
        # on the worker base image. So we install the correct Linux bitsandbytes
        # ONCE per worker at startup, below, before peft imports it.
        "torch",
        "transformers",
        "peft",
        "accelerate",
        "sentencepiece",
    ],
)
async def predict(**kwargs) -> dict:
    import json
    import subprocess
    import sys
    import time

    # Ensure a Linux-native bitsandbytes is present before peft imports it.
    # Runs once per worker (guarded by a module global); ~10-15s on cold start,
    # skipped on every subsequent call. This sidesteps the Windows-vs-Linux
    # native-wheel mismatch from flash's local bundling.
    global _BNB_READY
    try:
        _BNB_READY
    except NameError:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-q", "--no-cache-dir",
            "bitsandbytes>=0.43",
        ])
        _BNB_READY = True

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import PeftModel

    # ── constants inlined (module globals don't ship to the worker) ──────────
    SYSTEM_PROMPT = (
        "You are a tactic proof assistant for Pie, a dependently-typed language "
        'based on "The Little Typer". Given a proof goal and context, suggest the '
        "next tactic to apply."
    )
    TACTIC_CATEGORIES = {
        "intro": "introduction", "exact": "introduction",
        "exists": "constructor", "split": "constructor",
        "go-Left": "constructor", "go-Right": "constructor",
        "left": "constructor", "right": "constructor",
        "ind-nat": "elimination", "elim-Nat": "elimination",
        "ind-list": "elimination", "elim-List": "elimination",
        "ind-Vec": "elimination", "elim-Vec": "elimination",
        "ind-Either": "elimination", "elim-Either": "elimination",
        "ind-equal": "elimination", "elim-Equal": "elimination",
        "ind-Absurd": "elimination", "elim-Absurd": "elimination",
        "apply": "application", "then": "composition",
    }

    def format_proof_state(goal, global_ctx, local_ctx):
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

    def tactic_head(t):
        return t.strip().split()[0] if t.strip() else ""

    # ── load base + adapter ONCE per worker (reused across calls) ────────────
    global _MODEL, _TOK
    try:
        _MODEL
    except NameError:
        base_model_name = os.environ.get("PIE_BASE_MODEL", "unsloth/qwen2.5-coder-7b-instruct-bnb-4bit")
        adapter_ref = os.environ["PIE_ADAPTER_REF"]
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
        _MODEL = PeftModel.from_pretrained(base_model, adapter_ref)
        _MODEL.eval()
        _TOK = AutoTokenizer.from_pretrained(adapter_ref)

    # ── build prompt & generate (greedy, matches LocalPredictor exactly) ─────
    t0 = time.time()
    goal = kwargs.get("goal", "")
    global_ctx = kwargs.get("globalContext", []) or []
    local_ctx = kwargs.get("localContext", []) or []
    user_content = format_proof_state(goal, global_ctx, local_ctx)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
    input_text = _TOK.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = _TOK(input_text, return_tensors="pt").to(_MODEL.device)

    with torch.no_grad():
        output_ids = _MODEL.generate(
            **inputs,
            max_new_tokens=128,
            temperature=0.0,
            do_sample=False,
            pad_token_id=_TOK.pad_token_id or _TOK.eos_token_id,
        )

    raw = _TOK.decode(
        output_ids[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True,
    ).strip()

    head = tactic_head(raw)
    return {
        "tactic": raw,
        "raw_output": raw,
        "tactic_head": head,
        "category": TACTIC_CATEGORIES.get(head, "unknown"),
        "elapsed_ms": (time.time() - t0) * 1000.0,
    }
