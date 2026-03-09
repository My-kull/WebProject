#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NO_RUN="${QWEN_NO_RUN:-0}"

if [[ "${1:-}" == "--no-run" ]]; then
  NO_RUN="1"
fi

run_windows_setup() {
  local no_run_arg=""
  if [[ "$NO_RUN" == "1" ]]; then
    no_run_arg="-NoRun"
  fi

  if command -v powershell >/dev/null 2>&1; then
    exec powershell -ExecutionPolicy Bypass -File "$SCRIPT_DIR/qwen3_setup_windows.ps1" $no_run_arg
  fi

  if command -v pwsh >/dev/null 2>&1; then
    exec pwsh -ExecutionPolicy Bypass -File "$SCRIPT_DIR/qwen3_setup_windows.ps1" $no_run_arg
  fi

  echo "Detected Windows, but PowerShell was not found in PATH."
  echo "Run manually:"
  echo "  powershell -ExecutionPolicy Bypass -File scripts/qwen3_setup_windows.ps1"
  exit 1
}

case "$(uname -s)" in
  Linux)
    echo "Detected Linux. Running Linux setup..."
    QWEN_NO_RUN="$NO_RUN" exec bash "$SCRIPT_DIR/qwen3_setup.sh"
    ;;
  Darwin)
    echo "Detected macOS. Running macOS setup..."
    QWEN_NO_RUN="$NO_RUN" exec bash "$SCRIPT_DIR/qwen3_setup_mac.sh"
    ;;
  CYGWIN*|MINGW*|MSYS*)
    echo "Detected Windows-compatible shell. Running Windows setup..."
    run_windows_setup
    ;;
  *)
    if [[ -n "${WINDIR:-}" ]] || [[ "${OS:-}" == "Windows_NT" ]]; then
      echo "Detected Windows environment. Running Windows setup..."
      run_windows_setup
    fi

    echo "Unsupported or unknown operating system: $(uname -s)"
    echo "Use one of:"
    echo "  bash scripts/qwen3_setup.sh"
    echo "  bash scripts/qwen3_setup_mac.sh"
    echo "  powershell -ExecutionPolicy Bypass -File scripts/qwen3_setup_windows.ps1"
    exit 1
    ;;
esac
