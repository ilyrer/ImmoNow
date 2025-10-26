# ImmoNow Docker Deployment

Vollständiges Docker & Docker Compose Setup für das ImmoNow-Projekt (Backend + Frontend).

## 🚀 Schnellstart

### Voraussetzungen
- Docker Desktop oder Docker Engine
- Docker Compose (in Docker Desktop enthalten)
- Mindestens 4GB freier RAM
- Ports 80, 3000, 5432, 6379, 8000, 9000, 9001 verfügbar

### Ein-Befehl-Start

```bash
# 1. In den deployment Ordner wechseln
cd deployment

# 2. Environment konfigurieren
cp env.example .env
# Bearbeiten Sie .env mit Ihren Einstellungen

# 3. Alles starten
docker compose up -d --build
```

**Das war's!** 🎉

## 📋 Services

| Service | Port | Beschreibung |
|---------|------|--------------|
| **Frontend** | 80 | React App (über Nginx) |
| **Backend API** | 80/api | FastAPI Backend |
| **Django Admin** | 80/admin | Django Admin Interface |
| **PostgreSQL** | 5432 | Datenbank |
| **Redis** | 6379 | Cache & Sessions |
| **MinIO** | 9000 | Object Storage |
| **MinIO Console** | 9001 | Storage Management |

## 🛠️ Management-Skripte

### Starten
```bash
./up.sh
```
- Baut alle Images
- Startet alle Services
- Zeigt Status und URLs

### Stoppen
```bash
./down.sh
```
- Stoppt alle Services
- Optionen für Volume-Cleanup

### Datenbank-Migrationen
```bash
./migrate.sh
```
- Führt Django-Migrationen aus
- Sammelt statische Dateien

## 🔧 Konfiguration

### Environment-Variablen (.env)
```bash
# Datenbank
POSTGRES_DB=immonow_db
POSTGRES_USER=immonow_user
POSTGRES_PASSWORD=your-secure-password

# Backend
SECRET_KEY=your-super-secret-key
DEBUG=False

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

### Wichtige URLs
- **Frontend**: http://localhost:80
- **API**: http://localhost:80/api/
- **Admin**: http://localhost:80/admin/
- **Health Check**: http://localhost:80/healthz
- **MinIO Console**: http://localhost:9001

## 📊 Monitoring & Debugging

### Logs anzeigen
```bash
# Alle Services
docker compose logs -f

# Einzelner Service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Service-Status
```bash
docker compose ps
```

### Container-Shell
```bash
# Backend
docker compose exec backend bash

# Frontend
docker compose exec frontend sh
```

## 🔒 Sicherheit

### Produktions-Deployment
1. **Passwörter ändern**: Alle Default-Passwörter in `.env` ändern
2. **SECRET_KEY**: Einen starken, einzigartigen Schlüssel generieren
3. **HTTPS**: SSL-Zertifikate für Produktionsumgebung konfigurieren
4. **Firewall**: Nur notwendige Ports freigeben
5. **Updates**: Regelmäßig Docker Images aktualisieren

### Beispiel-Produktions-.env
```bash
DEBUG=False
SECRET_KEY=your-production-secret-key-here
POSTGRES_PASSWORD=very-secure-database-password
MINIO_ROOT_PASSWORD=very-secure-minio-password
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

## 🗂️ Daten-Persistierung

### Volumes
- `postgres_data`: Datenbank-Daten
- `redis_data`: Redis-Cache
- `minio_data`: Object Storage
- `backend_media`: Upload-Dateien
- `backend_static`: Statische Dateien
- `backend_logs`: Anwendungs-Logs

### Backup
```bash
# Datenbank-Backup
docker compose exec postgres pg_dump -U immonow_user immonow_db > backup.sql

# Volumes-Backup
docker run --rm -v immonow_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## 🚨 Troubleshooting

### Häufige Probleme

**Port bereits belegt**
```bash
# Prüfen welche Ports verwendet werden
netstat -tulpn | grep :80
# Port in .env ändern oder anderen Service stoppen
```

**Services starten nicht**
```bash
# Logs prüfen
docker compose logs

# Images neu bauen
docker compose build --no-cache
```

**Datenbank-Verbindungsfehler**
```bash
# PostgreSQL-Container prüfen
docker compose logs postgres

# Netzwerk-Verbindung testen
docker compose exec backend ping postgres
```

**Frontend lädt nicht**
```bash
# Build-Prozess prüfen
docker compose logs frontend

# Node-Modules neu installieren
docker compose exec frontend npm install
```

### Performance-Optimierung

**RAM-Usage reduzieren**
```bash
# In .env
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
```

**Build-Zeit verkürzen**
```bash
# Multi-stage Build für Frontend verwenden
# Docker Layer Caching aktivieren
```

## 📚 Erweiterte Konfiguration

### SSL/HTTPS Setup
```bash
# SSL-Zertifikate in nginx.conf konfigurieren
# Let's Encrypt mit Certbot verwenden
```

### Load Balancing
```bash
# Mehrere Backend-Instanzen
# Nginx Upstream-Konfiguration erweitern
```

### Monitoring
```bash
# Prometheus + Grafana hinzufügen
# Health Checks erweitern
```

## 🤝 Support

Bei Problemen:
1. Logs prüfen: `docker compose logs`
2. Service-Status: `docker compose ps`
3. Health Check: http://localhost:80/healthz
4. GitHub Issues erstellen

---

**Happy Deploying!** 🚀