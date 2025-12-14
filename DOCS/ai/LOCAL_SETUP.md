# ImmoNow - Lokales AI-System: Setup-Anleitung

**Version**: 1.0  
**Datum**: 13.12.2025

---

## Voraussetzungen

### Hardware (Minimum)
- **RAM**: 16GB+ (8GB Model, 4GB Qdrant, 4GB App)
- **CPU**: 8 Cores+
- **Disk**: 20GB+ (Models ~5GB, Vectors ~5GB)
- **Performance**: ~10-15s Response-Zeit

### Hardware (Empfohlen - mit GPU)
- **GPU**: NVIDIA RTX 3060+ (8GB VRAM)
- **RAM**: 16GB+
- **CUDA**: 11.8+
- **Performance**: ~1-2s Response-Zeit

### Software
- **Docker**: 20.10+ & Docker Compose 1.29+
- **Git**: Für Repository-Checkout
- **Windows**: PowerShell 5.1+ / **Linux/Mac**: Bash 4.0+

---

## Installation (One-Command)

### Windows (PowerShell)

```powershell
# 1. Repository klonen (falls noch nicht geschehen)
cd C:\Users\<username>\Documents\apps
git clone <repo-url> ImmoNow
cd ImmoNow

# 2. Environment Variables kopieren
cp backend\env.example backend\.env
# Editiere .env mit deinen Werten (optional, Defaults funktionieren lokal)

# 3. Starte Dev Environment
.\scripts\dev_up.ps1
```

### Linux/Mac (Bash)

```bash
# 1. Repository klonen
cd ~/projects
git clone <repo-url> ImmoNow
cd ImmoNow

# 2. Environment Variables kopieren
cp backend/env.example backend/.env
# Editiere .env (optional)

# 3. Script ausführbar machen
chmod +x scripts/dev_up.sh scripts/ai/setup_ollama.sh

# 4. Starte Dev Environment
./scripts/dev_up.sh
```

---

## Setup-Schritte (Manuell)

### 1. Docker Containers starten

```bash
# Main Stack (Postgres, Redis, Backend, Frontend)
cd deployment
docker-compose up -d

# AI Stack (Ollama + Qdrant)
docker-compose -f docker-compose.ai.yml up -d
```

### 2. Ollama Models laden

**Windows**:
```powershell
.\scripts\ai\setup_ollama.ps1
```

**Linux/Mac**:
```bash
./scripts/ai/setup_ollama.sh
```

**Manuell** (falls Scripts nicht funktionieren):
```bash
# Container betreten
docker exec -it immonow_ollama bash

# Models pullen
ollama pull deepseek-r1:8b
ollama pull nomic-embed-text

# Testen
ollama list
```

### 3. Backend Migrations (Auto bei Container-Start)

Falls nicht automatisch ausgeführt:
```bash
docker exec -it immonow_backend python manage.py migrate
```

### 4. Default-Dokumente ingestieren (Optional)

**Via API** (nach Backend-Start):
```bash
# Health Check
curl http://localhost:8000/api/v1/ai/health

# Ingest VISION.md
curl -X POST http://localhost:8000/api/v1/ai/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "source": "VISION.md",
    "content": "...",  # File content
    "source_type": "docs"
  }'
```

---

## Konfiguration

### Environment Variables (.env)

**Kritische Settings**:
```env
# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_MODEL=deepseek-r1:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Qdrant
QDRANT_HOST=localhost
QDRANT_PORT=6333

# RAG
RAG_CHUNK_SIZE=600
RAG_TOP_K=5

# Tool Calling
TOOL_CALLING_ENABLED=True
```

Vollständige Liste: Siehe [backend/env.example](../../backend/env.example)

### GPU-Support aktivieren (Optional)

**docker-compose.ai.yml** editieren:
```yaml
services:
  ollama:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

**Voraussetzung**: NVIDIA Container Toolkit installiert
```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

---

## Verifikation

### 1. Services Health-Check

```bash
# Frontend
curl http://localhost:3000

# Backend API
curl http://localhost:8000/docs

# Ollama
curl http://localhost:11434/api/tags

# Qdrant
curl http://localhost:6333/health

# AI System
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/ai/health
```

### 2. Login & Test Chat

1. Öffne http://localhost:3000
2. Login: `admin@immonow.com` / `admin123`
3. Navigiere zu Chatbot
4. Test: "Erstelle einen Test-Task für morgen"

### 3. RAG Test

```bash
# Ingest Test-Dokument
curl -X POST http://localhost:8000/api/v1/ai/ingest \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "test.md",
    "content": "ImmoNow ist eine Immobilien-Management-Plattform.",
    "source_type": "docs"
  }'

# Chat mit RAG
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Was ist ImmoNow?"
  }'
```

---

## Troubleshooting

### Ollama startet nicht

**Symptom**: `Connection refused` bei Health-Check

**Lösung**:
```bash
# Logs prüfen
docker logs immonow_ollama

# Neustart
docker-compose -f deployment/docker-compose.ai.yml restart ollama

# Falls GPU-Fehler: GPU-Support deaktivieren
# docker-compose.ai.yml → deploy.resources Section entfernen
```

### Qdrant Collection-Fehler

**Symptom**: `Collection 'immonow_docs' does not exist`

**Lösung**:
```bash
# Auto-create via erstes Ingest
curl -X POST http://localhost:8000/api/v1/ai/ingest ...

# Oder via Reindex
curl -X POST http://localhost:8000/api/v1/ai/reindex \
  -H "Authorization: Bearer <admin-token>"
```

### Backend kann nicht zu Ollama/Qdrant connecten

**Symptom**: `ExternalServiceError: Ollama is not reachable`

**Ursache**: Docker Network-Probleme

**Lösung**:
```bash
# Network existiert?
docker network ls | grep immonow_network

# Erstellen falls nicht vorhanden
docker network create immonow_network

# Containers zum Network hinzufügen
docker network connect immonow_network immonow_backend
docker network connect immonow_network immonow_ollama
docker network connect immonow_network immonow_qdrant
```

### Models laden sehr langsam

**deepseek-r1:8b** ist ~4.5GB groß

**Lösung**: Geduld (5-15 Minuten je nach Internet)

**Alternativen** (kleinere Modelle):
```bash
ollama pull phi3:mini      # 2.3GB, schneller auf CPU
ollama pull llama3.1:8b    # 4.7GB, bessere Qualität
```

`.env` anpassen:
```env
OLLAMA_CHAT_MODEL=phi3:mini
```

---

## Stoppen & Cleanup

### Services stoppen

```bash
# Main Stack
docker-compose -f deployment/docker-compose.yml down

# AI Stack
docker-compose -f deployment/docker-compose.ai.yml down
```

### Daten behalten (Volumes nicht löschen)

Standard-Verhalten: Volumes bleiben erhalten

### Komplett Reset (Alle Daten löschen)

```bash
docker-compose -f deployment/docker-compose.yml down -v
docker-compose -f deployment/docker-compose.ai.yml down -v
```

**Warnung**: Löscht Postgres DB, Qdrant Vectors, Ollama Models!

---

## Production Deployment

### 1. Environment anpassen

```env
DEBUG=False
SECRET_KEY=<secure-random-key>
JWT_SECRET_KEY=<secure-random-key>
ALLOWED_HOSTS=yourdomain.com

# Postgres statt SQLite
USE_POSTGRES=True
DB_HOST=postgres
DB_PASSWORD=<secure-password>
```

### 2. HTTPS mit Nginx

`deployment/nginx.conf`:
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location /api/ {
        proxy_pass http://backend:8000;
    }
}
```

### 3. Backup-Strategy

**Postgres Backup**:
```bash
docker exec immonow_postgres pg_dump -U immonow_user immonow_db > backup.sql
```

**Qdrant Backup** (Volume kopieren):
```bash
docker run --rm -v qdrant_storage:/data -v $(pwd):/backup \
  alpine tar czf /backup/qdrant_backup.tar.gz /data
```

---

## Next Steps

- Lies [ARCHITECTURE.md](ARCHITECTURE.md) für System-Details
- Lies [TOOLS.md](TOOLS.md) für Tool-Entwicklung
- Ingestiere deine Docs via `/api/v1/ai/ingest`
- Entwickle Custom Tools in `backend/app/tools/`
