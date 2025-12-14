#!/bin/bash
# ImmoNow - Dev Environment Startup Script (Linux/Mac)
# Startet den gesamten Stack: Postgres, Redis, Ollama, Qdrant, Backend, Frontend

set -e

# Parse arguments
SKIP_OLLAMA=false
SKIP_INGESTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-ollama)
            SKIP_OLLAMA=true
            shift
            ;;
        --skip-ingestion)
            SKIP_INGESTION=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}ImmoNow - Dev Environment Startup${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""

# Check Docker
echo -e "${CYAN}1. Prüfe Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker nicht gefunden! Bitte installiere Docker.${NC}"
    exit 1
fi
DOCKER_VERSION=$(docker --version)
echo -e "${GREEN}✓ Docker gefunden: ${DOCKER_VERSION}${NC}"
echo ""

# Start Docker Compose
echo -e "${CYAN}2. Starte Docker Services...${NC}"
echo -e "${GRAY}   → Postgres, Redis, Backend, Frontend, Nginx...${NC}"

cd "$(dirname "$0")/.."
if docker-compose -f deployment/docker-compose.yml up -d; then
    echo -e "${GREEN}✓ Main services gestartet${NC}"
else
    echo -e "${RED}✗ Fehler beim Starten der Main Services${NC}"
    exit 1
fi
echo ""

# Start AI Stack
echo -e "${CYAN}3. Starte AI Stack (Ollama + Qdrant)...${NC}"
if docker-compose -f deployment/docker-compose.ai.yml up -d; then
    echo -e "${GREEN}✓ AI services gestartet${NC}"
else
    echo -e "${RED}✗ Fehler beim Starten des AI Stacks${NC}"
    exit 1
fi
echo ""

# Wait for services
echo -e "${CYAN}4. Warte auf Services...${NC}"
echo -e "${GRAY}   (Dies kann 30-60 Sekunden dauern...)${NC}"

MAX_WAIT=60
WAITED=0

# Wait for Ollama
echo -e "${GRAY}   → Warte auf Ollama...${NC}"
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Ollama ist bereit${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}   ⚠ Ollama Health-Check Timeout (aber möglicherweise OK)${NC}"
fi

# Wait for Qdrant
echo -e "${GRAY}   → Warte auf Qdrant...${NC}"
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:6333/health > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Qdrant ist bereit${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}   ⚠ Qdrant Health-Check Timeout${NC}"
fi

# Wait for Backend
echo -e "${GRAY}   → Warte auf Backend...${NC}"
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:8000/docs > /dev/null 2>&1; then
        echo -e "${GREEN}   ✓ Backend ist bereit${NC}"
        break
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}   ⚠ Backend Health-Check Timeout${NC}"
fi

echo ""

# Setup Ollama Models
if [ "$SKIP_OLLAMA" = false ]; then
    echo -e "${CYAN}5. Setup Ollama Models...${NC}"
    if bash "$(dirname "$0")/ai/setup_ollama.sh"; then
        :  # Success
    else
        echo -e "${YELLOW}   ⚠ Ollama Setup fehlgeschlagen${NC}"
        echo -e "${YELLOW}   Führe manuell aus: ./scripts/ai/setup_ollama.sh${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}5. Ollama Setup übersprungen (--skip-ollama)${NC}"
    echo ""
fi

# Ingest Default Docs
if [ "$SKIP_INGESTION" = false ]; then
    echo -e "${CYAN}6. Ingestiere Default-Dokumente...${NC}"
    echo -e "${GRAY}   → VISION.md, DASHBOARD_DOCUMENTATION.md, docs/*.md${NC}"
    
    # TODO: Implement ingestion script or use API
    echo -e "${YELLOW}   ⚠ Automatische Ingestion noch nicht implementiert${NC}"
    echo -e "${GRAY}   Verwende die API: POST /api/v1/ai/ingest${NC}"
    echo ""
else
    echo -e "${YELLOW}6. Dokument-Ingestion übersprungen (--skip-ingestion)${NC}"
    echo ""
fi

# Summary
echo -e "${CYAN}=============================================${NC}"
echo -e "${GREEN}✓ Dev Environment gestartet!${NC}"
echo -e "${CYAN}=============================================${NC}"
echo ""
echo -e "${CYAN}Services:${NC}"
echo -e "${WHITE}  • Frontend:      http://localhost:3000${NC}"
echo -e "${WHITE}  • Backend API:   http://localhost:8000${NC}"
echo -e "${WHITE}  • API Docs:      http://localhost:8000/docs${NC}"
echo -e "${WHITE}  • Django Admin:  http://localhost:8001/admin${NC}"
echo -e "${WHITE}  • Ollama:        http://localhost:11434${NC}"
echo -e "${WHITE}  • Qdrant:        http://localhost:6333${NC}"
echo ""
echo -e "${CYAN}Nächste Schritte:${NC}"
echo -e "${GRAY}  1. Öffne http://localhost:3000${NC}"
echo -e "${GRAY}  2. Login: admin@immonow.com / admin123${NC}"
echo -e "${GRAY}  3. Teste AI Chat: /api/v1/ai/health${NC}"
echo ""
echo -e "${YELLOW}Zum Stoppen: docker-compose -f deployment/docker-compose.yml down${NC}"
echo -e "${YELLOW}             docker-compose -f deployment/docker-compose.ai.yml down${NC}"
echo ""
