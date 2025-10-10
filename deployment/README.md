# ImmoNow Docker Deployment

Dieses Verzeichnis enthält alle Dateien, die für das Deployment der ImmoNow-Anwendung mit Docker Compose benötigt werden.

## 🚀 Quick Start

### Voraussetzungen
- Docker Desktop installiert
- Docker Compose verfügbar
- Mindestens 4GB freier RAM

### Starten der Entwicklungsumgebung

**Für Windows:**
```bash
cd deployment
start-dev.bat
```

**Für Linux/macOS:**
```bash
cd deployment
chmod +x start-dev.sh
./start-dev.sh
```

**Manuell:**
```bash
cd deployment
cp .env.example .env
docker-compose up --build
```

## 📋 Services

### 1. PostgreSQL Database (`postgres`)
- **Port:** 5432
- **Database:** immonow_db
- **User:** immonow_user
- **Password:** immonow_password
- **Volume:** postgres_data

### 2. Redis Cache (`redis`)
- **Port:** 6379
- **Volume:** redis_data

### 3. FastAPI Backend (`backend`)
- **Port:** 8000
- **Start:** `python main.py` (FastAPI direkt)
- **Features:**
  - FastAPI mit automatischer API-Dokumentation
  - Automatische Migrationen
  - Vorkonfigurierte Benutzer
  - CORS-Unterstützung
  - Async/Await Support

### 4. Django Admin (`django-admin`)
- **Port:** 8001
- **Start:** `python manage.py runserver 0.0.0.0:8001`
- **Features:**
  - Django Admin Interface
  - Benutzer- und Datenverwaltung
  - Separate Instanz für bessere Performance

### 5. React Frontend (`frontend`)
- **Port:** 3000
- **Features:**
  - Hot reload development
  - Proxy zu Backend APIs
  - Environment variables

### 6. Nginx Reverse Proxy (`nginx`)
- **Port:** 80 (HTTP), 443 (HTTPS)
- **Features:**
  - Load balancing
  - Static file serving
  - API proxy für FastAPI und Django
  - Security headers

## 👤 Vorkonfigurierte Benutzer

Nach dem ersten Start sind folgende Benutzer verfügbar:

### Admin User
- **Username:** admin
- **Password:** admin123
- **Email:** admin@immonow.com
- **Berechtigung:** Superuser (Django Admin Zugang)

### Demo User
- **Username:** demo
- **Password:** demo123
- **Email:** demo@immonow.com
- **Berechtigung:** Normaler Benutzer

## 🌐 URLs

- **Frontend:** http://localhost:3000
- **FastAPI Backend:** http://localhost:8000
- **FastAPI Dokumentation:** http://localhost:8000/docs
- **Django Admin:** http://localhost:8001/admin
- **Nginx Proxy:** http://localhost

## ⚙️ Backend-Architektur

Das Backend läuft in zwei separaten Services:

1. **FastAPI Service (Port 8000)**
   - Startet über: `python main.py`
   - Hauptanwendung mit FastAPI
   - API-Dokumentation: `/docs` und `/redoc`

2. **Django Admin Service (Port 8001)**  
   - Startet über: `python manage.py runserver 0.0.0.0:8001`
   - Nur für Django Admin Interface
   - Zugang: `http://localhost:8001/admin`

## 🛠️ Nützliche Kommandos

```bash
# Alle Services starten
docker-compose up -d

# Services mit neuem Build starten
docker-compose up --build

# Logs anzeigen
docker-compose logs -f

# Logs eines spezifischen Services
docker-compose logs -f backend

# Service neustarten
docker-compose restart backend

# In Container einsteigen
docker exec -it immonow_backend bash
docker exec -it immonow_frontend sh

# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen
docker-compose down -v

# Status anzeigen
docker-compose ps

# Ressourcenverbrauch anzeigen
docker stats
```

## 🗄️ Datenbank-Management

### Django-Migrationen
```bash
# In Backend Container
docker exec -it immonow_backend python manage.py makemigrations
docker exec -it immonow_backend python manage.py migrate

# Neuen Superuser erstellen
docker exec -it immonow_backend python manage.py createsuperuser
```

### Direkte Datenbankverbindung
```bash
# PostgreSQL CLI
docker exec -it immonow_postgres psql -U immonow_user -d immonow_db

# Datenbank-Backup
docker exec -it immonow_postgres pg_dump -U immonow_user immonow_db > backup.sql

# Datenbank wiederherstellen
docker exec -i immonow_postgres psql -U immonow_user -d immonow_db < backup.sql
```

## 📁 Datei-Struktur

```
deployment/
├── docker-compose.yml      # Hauptkonfiguration
├── Dockerfile.backend      # Backend Docker Image
├── Dockerfile.frontend     # Frontend Docker Image
├── nginx.conf              # Nginx Konfiguration
├── init.sql               # Datenbank Initialisierung
├── .env.example           # Umgebungsvariablen Vorlage
├── start-dev.sh           # Linux/macOS Start-Script
├── start-dev.bat          # Windows Start-Script
└── README.md              # Diese Datei
```

## 🔧 Konfiguration

### Umgebungsvariablen
Kopieren Sie `.env.example` zu `.env` und passen Sie die Werte an:

```bash
cp .env.example .env
```

### Wichtige Einstellungen
- `SECRET_KEY`: Django Secret Key (in Produktion ändern!)
- `DEBUG`: Debug-Modus (in Produktion auf False setzen)
- `POSTGRES_PASSWORD`: Datenbank-Passwort
- `ALLOWED_HOSTS`: Erlaubte Hosts für Django

## 🚨 Troubleshooting

### Port bereits belegt
```bash
# Prüfen welcher Prozess den Port verwendet
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

### Container startet nicht
```bash
# Container-Logs prüfen
docker-compose logs [service_name]

# Container-Status prüfen
docker-compose ps

# Neustart mit clean build
docker-compose down
docker system prune -f
docker-compose up --build
```

### Datenbank-Probleme
```bash
# Datenbank-Container neustarten
docker-compose restart postgres

# Datenbank-Logs prüfen
docker-compose logs postgres

# Volume zurücksetzen (ACHTUNG: Löscht alle Daten!)
docker-compose down -v
```

### Frontend Build-Fehler
```bash
# Node modules neu installieren
docker exec -it immonow_frontend npm install

# Cache löschen
docker exec -it immonow_frontend npm start
```

## 📈 Performance-Optimierung

### Produktions-Setup
1. `DEBUG=False` in der .env Datei setzen
2. `SECRET_KEY` durch sicheren Schlüssel ersetzen
3. `ALLOWED_HOSTS` auf produktive Domains beschränken
4. SSL-Zertifikate für Nginx hinzufügen
5. Datenbank-Backups einrichten

### Monitoring
```bash
# Ressourcenverbrauch
docker stats

# Disk-Usage
docker system df

# Log-Größen prüfen
docker-compose logs --tail=100
```

## 🔒 Sicherheit

- Ändern Sie alle Standard-Passwörter vor dem Produktiveinsatz
- Verwenden Sie sichere SECRET_KEYs
- Aktivieren Sie HTTPS in der Produktion
- Regelmäßige Updates der Docker Images
- Implementieren Sie Backup-Strategien

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Logs: `docker-compose logs -f`
2. Überprüfen Sie die Service-Status: `docker-compose ps`
3. Starten Sie die Services neu: `docker-compose restart`
4. Bei größeren Problemen: `docker-compose down && docker-compose up --build`