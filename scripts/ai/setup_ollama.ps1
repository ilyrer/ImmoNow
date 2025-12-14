#!/usr/bin/env pwsh
# ImmoNow - Ollama Setup Script (Windows PowerShell)
# Lädt die benötigten Modelle für das lokale AI-System

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "ImmoNow - Ollama Model Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Konfiguration
$OLLAMA_HOST = "http://localhost:11434"
$MODELS = @("deepseek-r1:8b", "nomic-embed-text")

# Funktion: Prüfe ob Ollama läuft
function Test-OllamaHealth {
    try {
        $response = Invoke-WebRequest -Uri "$OLLAMA_HOST/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

# Funktion: Prüfe ob Model bereits vorhanden ist
function Test-ModelExists {
    param([string]$ModelName)
    
    try {
        $response = Invoke-RestMethod -Uri "$OLLAMA_HOST/api/tags" -Method GET
        $exists = $response.models | Where-Object { $_.name -like "$ModelName*" }
        return $null -ne $exists
    }
    catch {
        return $false
    }
}

# Funktion: Pull Model
function Install-OllamaModel {
    param([string]$ModelName)
    
    Write-Host "→ Pulling model: $ModelName..." -ForegroundColor Yellow
    
    try {
        # Verwende ollama CLI für bessere Progress-Anzeige
        if (Get-Command ollama -ErrorAction SilentlyContinue) {
            $process = Start-Process -FilePath "ollama" -ArgumentList "pull", $ModelName -NoNewWindow -PassThru -Wait
            if ($process.ExitCode -eq 0) {
                Write-Host "✓ Model $ModelName erfolgreich geladen" -ForegroundColor Green
                return $true
            }
            else {
                Write-Host "✗ Fehler beim Laden von $ModelName (Exit Code: $($process.ExitCode))" -ForegroundColor Red
                return $false
            }
        }
        else {
            # Fallback: Verwende API
            $body = @{ name = $ModelName } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$OLLAMA_HOST/api/pull" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 600
            Write-Host "✓ Model $ModelName erfolgreich geladen" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "✗ Fehler beim Laden von $ModelName`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main Script
Write-Host "1. Prüfe Ollama-Verbindung..." -ForegroundColor Cyan
if (-not (Test-OllamaHealth)) {
    Write-Host "✗ Ollama ist nicht erreichbar unter $OLLAMA_HOST" -ForegroundColor Red
    Write-Host "  Starte Ollama mit: docker-compose -f deployment/docker-compose.ai.yml up -d ollama" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Ollama ist erreichbar" -ForegroundColor Green
Write-Host ""

Write-Host "2. Prüfe und lade Modelle..." -ForegroundColor Cyan
$allSuccess = $true

foreach ($model in $MODELS) {
    Write-Host ""
    Write-Host "Verarbeite: $model" -ForegroundColor White
    
    if (Test-ModelExists -ModelName $model) {
        Write-Host "  → Model bereits vorhanden, überspringe..." -ForegroundColor Gray
    }
    else {
        $success = Install-OllamaModel -ModelName $model
        if (-not $success) {
            $allSuccess = $false
        }
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
if ($allSuccess) {
    Write-Host "✓ Setup erfolgreich abgeschlossen!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Geladene Modelle:" -ForegroundColor Cyan
    try {
        $tags = Invoke-RestMethod -Uri "$OLLAMA_HOST/api/tags" -Method GET
        foreach ($model in $tags.models) {
            Write-Host "  • $($model.name)" -ForegroundColor White
        }
    }
    catch {
        Write-Host "  Konnte Liste nicht abrufen" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠ Setup mit Fehlern abgeschlossen" -ForegroundColor Yellow
    Write-Host "  Einige Modelle konnten nicht geladen werden." -ForegroundColor Yellow
    exit 1
}
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nächster Schritt: Backend starten und /api/v1/ai/health aufrufen" -ForegroundColor Cyan
