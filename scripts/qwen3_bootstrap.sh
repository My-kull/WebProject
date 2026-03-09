#!/usr/bin/env bash
set -euo pipefail

MODEL="${QWEN_MODEL:-qwen3.5:2b}"
LOG_FILE="${OLLAMA_LOG_FILE:-/tmp/ai-shell-ollama.log}"

install_ollama_if_missing() {
  if command -v ollama >/dev/null 2>&1; then
    return 0
  fi

  echo "Ollama not found. Installing..."
  if ! command -v curl >/dev/null 2>&1; then
    echo "Error: curl is required to install Ollama."
    exit 1
  fi

  if [[ "$(uname -s)" != "Linux" && "$(uname -s)" != "Darwin" ]]; then
    echo "Unsupported OS for automatic install. Install manually: https://ollama.com/download"
    exit 1
  fi

  curl -fsSL https://ollama.com/install.sh | sh
}

start_ollama_if_needed() {
  if ollama list >/dev/null 2>&1; then
    return 0
  fi

  echo "Starting Ollama service..."
  nohup ollama serve >"$LOG_FILE" 2>&1 &

  for _ in {1..20}; do
    if ollama list >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Error: Ollama service did not become ready."
  echo "Check logs: $LOG_FILE"
  exit 1
}

pull_model() {
  if [[ "${QWEN_SKIP_PULL:-0}" == "1" ]]; then
    return 0
  fi

  if ollama list | awk 'NR>1 {print $1}' | grep -Fx "$MODEL" >/dev/null 2>&1; then
    return 0
  fi

  echo "Ensuring model is available: $MODEL"
  ollama pull "$MODEL" >/dev/null
}

install_ollama_if_missing
start_ollama_if_needed
pull_model
