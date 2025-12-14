#!/bin/bash
# ImmoNow - Ollama Setup Script (Linux/Mac)
# Lädt die benötigten Modelle für das lokale AI-System

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Konfiguration
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
MODELS=("deepseek-r1:8b" "nomic-embed-text")

# Funktion: Prüfe ob Ollama läuft
check_ollama_health() {
    if curl -sf "${OLLAMA_HOST}/api/tags" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Funktion: Prüfe ob Model bereits vorhanden ist
check_model_exists() {
    local model_name="$1"
    local response=$(curl -s "${OLLAMA_HOST}/api/tags")
    
    if echo "$response" | grep -q "\"name\":\"${model_name}"; then
        return 0
    else
        return 1
    fi
}

# Funktion: Pull Model
pull_model() {
    local model_name="$1"
    
    echo -e "${YELLOW}→ Pulling model: ${model_name}...${NC}"
    
    # Verwende ollama CLI wenn verfügbar
    if command -v ollama &> /dev/null; then
        if ollama pull "$model_name"; then
            echo -e "${GREEN}✓ Model ${model_name} erfolgreich geladen${NC}"
            return 0
        else
            echo -e "${RED}✗ Fehler beim Laden von ${model_name}${NC}"
            return 1
        fi
    else
        # Fallback: Verwende API
        local response=$(curl -s -X POST "${OLLAMA_HOST}/api/pull" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"${model_name}\"}" \
            --max-time 600)
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Model ${model_name} erfolgreich geladen${NC}"
            return 0
        else
            echo -e "${RED}✗ Fehler beim Laden von ${model_name}${NC}"
            return 1
        fi
    fi
}

# Main Script
echo -e "${CYAN}=====================================${NC}"
echo -e "${CYAN}ImmoNow - Ollama Model Setup${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""

echo -e "${CYAN}1. Prüfe Ollama-Verbindung...${NC}"
if ! check_ollama_health; then
    echo -e "${RED}✗ Ollama ist nicht erreichbar unter ${OLLAMA_HOST}${NC}"
    echo -e "${YELLOW}  Starte Ollama mit: docker-compose -f deployment/docker-compose.ai.yml up -d ollama${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Ollama ist erreichbar${NC}"
echo ""

echo -e "${CYAN}2. Prüfe und lade Modelle...${NC}"
all_success=true

for model in "${MODELS[@]}"; do
    echo ""
    echo -e "${WHITE}Verarbeite: ${model}${NC}"
    
    if check_model_exists "$model"; then
        echo -e "${GRAY}  → Model bereits vorhanden, überspringe...${NC}"
    else
        if ! pull_model "$model"; then
            all_success=false
        fi
    fi
done

echo ""
echo -e "${CYAN}=====================================${NC}"
if [ "$all_success" = true ]; then
    echo -e "${GREEN}✓ Setup erfolgreich abgeschlossen!${NC}"
    echo ""
    echo -e "${CYAN}Geladene Modelle:${NC}"
    curl -s "${OLLAMA_HOST}/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read -r model; do
        echo -e "  ${WHITE}• ${model}${NC}"
    done
else
    echo -e "${YELLOW}⚠ Setup mit Fehlern abgeschlossen${NC}"
    echo -e "${YELLOW}  Einige Modelle konnten nicht geladen werden.${NC}"
    exit 1
fi
echo -e "${CYAN}=====================================${NC}"
echo ""
echo -e "${CYAN}Nächster Schritt: Backend starten und /api/v1/ai/health aufrufen${NC}"
