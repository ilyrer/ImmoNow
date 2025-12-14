#!/usr/bin/env pwsh
# ImmoNow - Dev Environment Startup Script (Windows PowerShell)
# Startet den gesamten Stack: Postgres, Redis, Ollama, Qdrant, Backend, Frontend

param(
    [switch]$SkipOllama = $false,
    [switch]$SkipIngestion = $false
)

$ErrorActionPreference = "Stop"

# Colors
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "=============================================" "Cyan"
Write-ColorOutput "ImmoNow - Dev Environment Startup" "Cyan"
Write-ColorOutput "=============================================" "Cyan"
Write-Host ""

# Check Docker
Write-ColorOutput "1. Prüfe Docker..." "Cyan"
try {
    $dockerVersion = docker --version
    Write-ColorOutput "✓ Docker gefunden: $dockerVersion" "Green"
}
catch {
    Write-ColorOutput "✗ Docker nicht gefunden! Bitte installiere Docker Desktop." "Red"
    exit 1
}
Write-Host ""

# Start Docker Compose
Write-ColorOutput "2. Starte Docker Services..." "Cyan"
Write-ColorOutput "   → Postgres, Redis, Backend, Frontend, Nginx..." "Gray"

try {
    Set-Location -Path "$PSScriptRoot/.."
    docker-compose -f deployment/docker-compose.yml up -d
    Write-ColorOutput "✓ Main services gestartet" "Green"
}
catch {
    Write-ColorOutput "✗ Fehler beim Starten der Main Services: $_" "Red"
    exit 1
}
Write-Host ""

# Start AI Stack
Write-ColorOutput "3. Starte AI Stack (Ollama + Qdrant)..." "Cyan"
try {
    docker-compose -f deployment/docker-compose.ai.yml up -d
    Write-ColorOutput "✓ AI services gestartet" "Green"
}
catch {
    Write-ColorOutput "✗ Fehler beim Starten des AI Stacks: $_" "Red"
    exit 1
}
Write-Host ""

# Wait for services to be healthy
Write-ColorOutput "4. Warte auf Services..." "Cyan"
Write-ColorOutput "   (Dies kann 30-60 Sekunden dauern...)" "Gray"

$maxWait = 60
$waited = 0

# Wait for Ollama
Write-ColorOutput "   → Warte auf Ollama..." "Gray"
while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "   ✓ Ollama ist bereit" "Green"
            break
        }
    }
    catch {
        Start-Sleep -Seconds 2
        $waited += 2
    }
}

if ($waited -ge $maxWait) {
    Write-ColorOutput "   ⚠ Ollama Health-Check Timeout (aber möglicherweise OK)" "Yellow"
}

# Wait for Qdrant
Write-ColorOutput "   → Warte auf Qdrant..." "Gray"
$waited = 0
while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:6333/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "   ✓ Qdrant ist bereit" "Green"
            break
        }
    }
    catch {
        Start-Sleep -Seconds 2
        $waited += 2
    }
}

if ($waited -ge $maxWait) {
    Write-ColorOutput "   ⚠ Qdrant Health-Check Timeout" "Yellow"
}

# Wait for Backend
Write-ColorOutput "   → Warte auf Backend..." "Gray"
$waited = 0
while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "   ✓ Backend ist bereit" "Green"
            break
        }
    }
    catch {
        Start-Sleep -Seconds 2
        $waited += 2
    }
}

if ($waited -ge $maxWait) {
    Write-ColorOutput "   ⚠ Backend Health-Check Timeout" "Yellow"
}

Write-Host ""

# Setup Ollama Models
if (-not $SkipOllama) {
    Write-ColorOutput "5. Setup Ollama Models..." "Cyan"
    try {
        & "$PSScriptRoot/ai/setup_ollama.ps1"
    }
    catch {
        Write-ColorOutput "   ⚠ Ollama Setup fehlgeschlagen: $_" "Yellow"
        Write-ColorOutput "   Führe manuell aus: ./scripts/ai/setup_ollama.ps1" "Yellow"
    }
    Write-Host ""
}
else {
    Write-ColorOutput "5. Ollama Setup übersprungen (--SkipOllama)" "Yellow"
    Write-Host ""
}

# Ingest Default Docs
if (-not $SkipIngestion) {
    Write-ColorOutput "6. Ingestiere Default-Dokumente..." "Cyan"
    Write-ColorOutput "   → VISION.md, DASHBOARD_DOCUMENTATION.md, docs/*.md" "Gray"
    
    try {
        # TODO: Implement ingestion script or use API
        Write-ColorOutput "   ⚠ Automatische Ingestion noch nicht implementiert" "Yellow"
        Write-ColorOutput "   Verwende die API: POST /api/v1/ai/ingest" "Gray"
    }
    catch {
        Write-ColorOutput "   ⚠ Ingestion fehlgeschlagen: $_" "Yellow"
    }
    Write-Host ""
}
else {
    Write-ColorOutput "6. Dokument-Ingestion übersprungen (--SkipIngestion)" "Yellow"
    Write-Host ""
}

# Summary
Write-ColorOutput "=============================================" "Cyan"
Write-ColorOutput "✓ Dev Environment gestartet!" "Green"
Write-ColorOutput "=============================================" "Cyan"
Write-Host ""
Write-ColorOutput "Services:" "Cyan"
Write-ColorOutput "  • Frontend:      http://localhost:3000" "White"
Write-ColorOutput "  • Backend API:   http://localhost:8000" "White"
Write-ColorOutput "  • API Docs:      http://localhost:8000/docs" "White"
Write-ColorOutput "  • Django Admin:  http://localhost:8001/admin" "White"
Write-ColorOutput "  • Ollama:        http://localhost:11434" "White"
Write-ColorOutput "  • Qdrant:        http://localhost:6333" "White"
Write-Host ""
Write-ColorOutput "Nächste Schritte:" "Cyan"
Write-ColorOutput "  1. Öffne http://localhost:3000" "Gray"
Write-ColorOutput "  2. Login: admin@immonow.com / admin123" "Gray"
Write-ColorOutput "  3. Teste AI Chat: /api/v1/ai/health" "Gray"
Write-Host ""
Write-ColorOutput "Zum Stoppen: docker-compose -f deployment/docker-compose.yml down" "Yellow"
Write-ColorOutput "             docker-compose -f deployment/docker-compose.ai.yml down" "Yellow"
Write-Host ""
