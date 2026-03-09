#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Select your operating system:"
echo "1) Linux"
echo "2) macOS"
echo "3) Windows"
printf "Enter choice (1-3): "
read -r choice

case "$choice" in
  1)
    echo "Running Linux setup..."
    exec bash "$SCRIPT_DIR/qwen3_setup.sh"
    ;;
  2)
    echo "Running macOS setup..."
    exec bash "$SCRIPT_DIR/qwen3_setup_mac.sh"
    ;;
  3)
    echo "Running Windows setup..."
    if command -v powershell >/dev/null 2>&1; then
      exec powershell -ExecutionPolicy Bypass -File "$SCRIPT_DIR/qwen3_setup_windows.ps1"
    elif command -v pwsh >/dev/null 2>&1; then
      exec pwsh -ExecutionPolicy Bypass -File "$SCRIPT_DIR/qwen3_setup_windows.ps1"
    else
      echo "PowerShell was not found in PATH."
      echo "Run this on Windows with:"
      echo "  powershell -ExecutionPolicy Bypass -File scripts/qwen3_setup_windows.ps1"
      exit 1
    fi
    ;;
  *)
    echo "Invalid selection. Please run again and choose 1, 2, or 3."
    exit 1
    ;;
esac
