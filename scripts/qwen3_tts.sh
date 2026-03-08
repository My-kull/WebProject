#!/usr/bin/env bash
set -euo pipefail

MODEL="qwen3.5:2b"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT_FILE="${PROMPT_FILE:-$SCRIPT_DIR/prompts/qwen3_predefined_prompt.txt}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Error: ollama is not installed or not in PATH."
  echo "Install from: https://ollama.com/download"
  exit 1
fi

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Error: prompt file not found: $PROMPT_FILE"
  exit 1
fi

echo "Pulling model $MODEL (if needed)..."
ollama pull "$MODEL" >/dev/null

PROMPT_CONTENT="$(cat "$PROMPT_FILE")"
if [[ -z "${PROMPT_CONTENT// }" ]]; then
  echo "Error: prompt file is empty: $PROMPT_FILE"
  exit 1
fi

echo "Running model with predefined prompt..."
RESPONSE="$(ollama run "$MODEL" "$PROMPT_CONTENT")"

echo
echo "Model response:"
echo "$RESPONSE"
echo

speak() {
  local text="$1"

  if command -v espeak-ng >/dev/null 2>&1; then
    espeak-ng "$text"
    return
  fi

  if command -v espeak >/dev/null 2>&1; then
    espeak "$text"
    return
  fi

  if command -v spd-say >/dev/null 2>&1; then
    spd-say "$text"
    return
  fi

  if command -v say >/dev/null 2>&1; then
    say "$text"
    return
  fi

  echo "No supported TTS engine found. Install one of: espeak-ng, espeak, speech-dispatcher (spd-say), or use macOS 'say'."
  return 1
}

echo "Speaking response..."
speak "$RESPONSE"
