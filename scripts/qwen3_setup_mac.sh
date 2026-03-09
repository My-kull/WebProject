#!/usr/bin/env bash
set -euo pipefail

MODEL="${1:-qwen3.5:2b}"
NO_RUN="${QWEN_NO_RUN:-0}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script is for macOS only."
  exit 1
fi

install_ollama_if_missing() {
  if command -v ollama >/dev/null 2>&1; then
    return 0
  fi

  echo "Ollama not found. Installing with the official installer..."
  if ! command -v curl >/dev/null 2>&1; then
    echo "Error: curl is required for automatic install."
    exit 1
  fi

  curl -fsSL https://ollama.com/install.sh | sh

  if ! command -v ollama >/dev/null 2>&1; then
    echo "Install finished but 'ollama' is still not in PATH."
    echo "Open a new terminal and run this script again."
    exit 1
  fi
}

start_ollama_if_needed() {
  if ollama list >/dev/null 2>&1; then
    return 0
  fi

  echo "Starting Ollama app..."
  open -a Ollama || true

  for _ in {1..20}; do
    if ollama list >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Ollama service did not become ready in time."
  echo "Try launching the Ollama app manually, then rerun this script."
  exit 1
}

install_ollama_if_missing
start_ollama_if_needed

echo "Pulling model $MODEL..."
ollama pull "$MODEL"

if [[ "$NO_RUN" == "1" ]]; then
  echo "Setup complete (QWEN_NO_RUN=1)."
  exit 0
fi

echo "Launching model $MODEL..."
exec ollama run "$MODEL"
