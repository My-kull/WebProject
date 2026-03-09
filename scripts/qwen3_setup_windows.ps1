param(
  [string]$Model = "qwen3.5:2b",
  [switch]$NoRun
)

$ErrorActionPreference = "Stop"

function Test-OllamaReady {
  try {
    ollama list | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Install-OllamaIfMissing {
  if (Get-Command ollama -ErrorAction SilentlyContinue) {
    return
  }

  Write-Host "Ollama not found. Attempting install with winget..."
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Write-Error "winget is required for automatic install. Install Ollama manually: https://ollama.com/download/windows"
  }

  winget install -e --id Ollama.Ollama --accept-source-agreements --accept-package-agreements

  if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    $possiblePath = Join-Path $env:LOCALAPPDATA "Programs\Ollama"
    if (Test-Path $possiblePath) {
      $env:Path = "$possiblePath;$env:Path"
    }
  }

  if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Error "Ollama install completed but 'ollama' is not available in PATH yet. Open a new terminal and rerun."
  }
}

function Start-OllamaIfNeeded {
  if (Test-OllamaReady) {
    return
  }

  Write-Host "Starting Ollama service..."
  try {
    Start-Service -Name "ollama" -ErrorAction SilentlyContinue
  } catch {}

  if (-not (Test-OllamaReady)) {
    Start-Process -WindowStyle Hidden -FilePath "ollama" -ArgumentList "serve"
  }

  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-OllamaReady) {
      return
    }
  }

  Write-Error "Ollama did not become ready in time. Start Ollama manually and rerun."
}

Install-OllamaIfMissing
Start-OllamaIfNeeded

Write-Host "Pulling model $Model..."
ollama pull $Model

if ($NoRun) {
  Write-Host "Setup complete (-NoRun)."
  exit 0
}

Write-Host "Launching model $Model..."
ollama run $Model
