"""
LoRA tactic prediction server.

Loads the fine-tuned LoRA adapter and serves tactic predictions over HTTP.
Reuses model loading and prompt formatting from evaluate_offline.py.

Usage:
    conda run -n pie-train --no-capture-output python training/serve.py \
        --adapter <path-to-adapter-dir> \
        --port 8000

    # Or with an OpenAI-compatible backend (Ollama, vLLM)
    conda run -n pie-train --no-capture-output python training/serve.py \
        --api-url http://localhost:11434/v1 \
        --port 8000
"""

from __future__ import annotations

import argparse
import json
import logging
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Reuse from evaluate_offline
from evaluate_offline import (
    SYSTEM_PROMPT,
    TACTIC_CATEGORIES,
    LocalPredictor,
    APIPredictor,
    TacticPredictor,
    format_proof_state,
    tactic_head,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Request / Response models ────────────────────────────────────────────────

class ContextEntry(BaseModel):
    name: str
    type: str

class PredictRequest(BaseModel):
    goal: str
    globalContext: list[ContextEntry] = []
    localContext: list[ContextEntry] = []

class PredictResponse(BaseModel):
    tactic: str
    raw_output: str
    tactic_head: str
    category: str
    elapsed_ms: float

class HealthResponse(BaseModel):
    status: str
    model: str
    adapter: str

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Pie Tactic Prediction Server")

# Allow all localhost origins for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global predictor — set during startup
predictor: TacticPredictor | None = None
model_info: dict = {"model": "unknown", "adapter": "none"}


@app.get("/health", response_model=HealthResponse)
def health():
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return HealthResponse(
        status="ok",
        model=model_info["model"],
        adapter=model_info["adapter"],
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    global_ctx = [{"name": e.name, "type": e.type} for e in req.globalContext]
    local_ctx = [{"name": e.name, "type": e.type} for e in req.localContext]

    t0 = time.time()
    raw = predictor.predict(req.goal, global_ctx, local_ctx)
    elapsed_ms = (time.time() - t0) * 1000

    head = tactic_head(raw)
    category = TACTIC_CATEGORIES.get(head, "unknown")

    logger.info(
        "predict: goal=%s → %s (%.0fms)",
        req.goal[:80],
        raw,
        elapsed_ms,
    )

    return PredictResponse(
        tactic=raw,
        raw_output=raw,
        tactic_head=head,
        category=category,
        elapsed_ms=elapsed_ms,
    )


# ── CLI ──────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="LoRA tactic prediction server")
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--adapter", type=str, help="Path to local PEFT adapter")
    src.add_argument(
        "--api-url",
        type=str,
        help="OpenAI-compatible API base URL (e.g. http://localhost:11434/v1)",
    )
    p.add_argument("--api-model", type=str, default="", help="Model name for API")
    p.add_argument("--port", type=int, default=8000, help="Server port")
    p.add_argument("--host", type=str, default="0.0.0.0", help="Server host")
    return p.parse_args()


def main():
    global predictor, model_info

    args = parse_args()

    if args.adapter:
        logger.info("Loading local adapter from %s ...", args.adapter)
        predictor = LocalPredictor(args.adapter)
        model_info = {"model": "qwen2.5-coder-7b-instruct (LoRA)", "adapter": args.adapter}
    else:
        logger.info("Using API at %s ...", args.api_url)
        predictor = APIPredictor(args.api_url, args.api_model)
        model_info = {"model": predictor.model_name, "adapter": "api"}

    logger.info("Model ready. Starting server on %s:%d", args.host, args.port)

    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
