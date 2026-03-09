#!/usr/bin/env bash
set -euo pipefail

MODEL="qwen3.5:2b"
NO_RUN="${QWEN_NO_RUN:-0}"

install_ollama_if_missing() {
  if command -v ollama >/dev/null 2>&1; then
    return 0
  fi

  echo "Ollama not found. Attempting installation..."

  if [[ "$(uname -s)" == "Darwin" || "$(uname -s)" == "Linux" ]]; then
    if ! command -v curl >/dev/null 2>&1; then
      echo "Error: curl is required to install Ollama automatically."
      return 1
    fi

    curl -fsSL https://ollama.com/install.sh | sh
  else
    echo "Unsupported OS for automatic install. Install manually: https://ollama.com/download"
    return 1
  fi

  if ! command -v ollama >/dev/null 2>&1; then
    echo "Ollama installation did not complete successfully."
    return 1
  fi
}

start_ollama_if_needed() {
  if ollama list >/dev/null 2>&1; then
    return 0
  fi

  echo "Starting Ollama service..."
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl start ollama || true
  fi

  if ! ollama list >/dev/null 2>&1; then
    echo "Note: Ollama service may still be starting."
  fi
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
