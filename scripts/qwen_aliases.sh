#!/usr/bin/env bash
# Source this file from your shell startup file to enable qwen3 aliases.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

alias qwen3pull='ollama pull qwen3:2b'
alias qwen3run='ollama run qwen3:2b'
alias qwen3speak="bash \"$PROJECT_DIR/scripts/qwen3_tts.sh\""
alias qwen3setup="bash \"$PROJECT_DIR/scripts/qwen3_setup.sh\""
