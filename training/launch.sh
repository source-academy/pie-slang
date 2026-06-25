#!/usr/bin/env bash
#
# Launch the Pie tactic prediction server (PEFT adapter).
#
# Starts serve.py on port 8000, which the frontend connects to.
# Requires conda env pie-train.
#
# Usage:
#   ./training/launch.sh
#   PORT=9000 ./training/launch.sh
#
# Press Ctrl+C to stop.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONDA_BIN="${CONDA_EXE:-conda}"
CONDA_ENV="${CONDA_ENV:-pie-train}"
PORT="${PORT:-8000}"
ADAPTER="$SCRIPT_DIR/output/adapter"

if [ ! -f "$ADAPTER/adapter_config.json" ]; then
  echo "ERROR: Adapter not found at $ADAPTER"
  exit 1
fi

echo "Starting serve.py with PEFT adapter..."
echo "Frontend should connect to http://localhost:$PORT"
"$CONDA_BIN" run -n "$CONDA_ENV" --no-capture-output \
  python "$SCRIPT_DIR/serve.py" \
    --adapter "$ADAPTER" \
    --port "$PORT"
