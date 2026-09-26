#!/usr/bin/env bash
#
# Push the local LoRA adapter to a PRIVATE HuggingFace repo so Runpod serverless
# workers can pull it at cold start. Run AFTER `hf auth login`.
#
# Usage:
#   ./push-adapter.sh <hf-username>            # repo = <hf-username>/pie-tactic-lora
#   ./push-adapter.sh <hf-username> <repo>     # custom repo name
#
set -euo pipefail

USER="${1:?usage: push-adapter.sh <hf-username> [repo-name]}"
NAME="${2:-pie-tactic-lora}"
REPO="$USER/$NAME"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADAPTER="$SCRIPT_DIR/../output/adapter"

if [ ! -f "$ADAPTER/adapter_config.json" ]; then
  echo "ERROR: adapter not found at $ADAPTER" >&2
  exit 1
fi

echo "Creating private repo $REPO (idempotent) ..."
hf repo create "$REPO" --repo-type model --private || true

echo "Uploading adapter from $ADAPTER ..."
hf upload "$REPO" "$ADAPTER" . --repo-type model

echo
echo "Done. Set this in training/runpod/.env:"
echo "  PIE_ADAPTER_REF=$REPO"
