# CIM Backend API

Ein produktionsreifes Backend für das Central Information Model (CIM) mit FastAPI und Django-ORM.

## Features

- **FastAPI** mit automatischer OpenAPI-Dokumentation
- **Django-ORM** für Datenbankoperationen
- **JWT-Authentifizierung** mit Rollen und Scopes
- **Multi-Tenancy** für Mandantenisolation
- **Pydantic v2** für Datenvalidierung
- **S3/MinIO** für Datei-Uploads
- **Rate Limiting** für API-Schutz
- **Audit Logging** für alle Aktionen
- **Comprehensive API** für alle Frontend-Seiten

## Installation

### Voraussetzungen

- Python 3.11+
- PostgreSQL 13+
- Redis (optional, für Caching)

### Setup

1. **Repository klonen und Abhängigkeiten installieren:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Umgebungsvariablen konfigurieren:**
```bash
cp env.example .env
# Bearbeite .env mit deinen Werten
```

3. **Datenbank einrichten:**
```bash
# Django-Migrationen ausführen
python manage.py makemigrations
python manage.py migrate

# Superuser erstellen
python manage.py createsuperuser
```

4. **Anwendung starten:**
```bash
# Development Server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production Server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API-Dokumentation

Nach dem Start der Anwendung ist die API-Dokumentation verfügbar unter:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Projektstruktur

```
backend/
├── app/
│   ├── main.py                 # FastAPI App Entry Point
│   ├── core/                   # Core Module
│   │   ├── settings.py         # Konfiguration
│   │   ├── security.py         # JWT & Auth
│   │   ├── auth.py            # Auth Schemas
│   │   ├── tenancy.py         # Multi-Tenancy
│   │   ├── pagination.py      # Pagination Utils
│   │   ├── errors.py          # Error Handling
│   │   └── rate_limit.py      # Rate Limiting
│   ├── db/                    # Django Integration
│   │   ├── django_settings.py # Django Config
│   │   ├── models/            # Django Models
│   │   └── urls.py           # Django URLs
│   ├── api/                   # FastAPI Routes
│   │   ├── deps.py           # Dependencies
│   │   └── v1/               # API v1
│   │       ├── router.py     # Main Router
│   │       ├── documents.py  # Documents API
│   │       ├── tasks.py      # Tasks API
│   │       ├── employees.py  # Employees API
│   │       ├── investor.py   # Investor API
│   │       ├── cim.py        # CIM API
│   │       ├── avm.py        # AVM API
│   │       ├── appointments.py # Appointments API
│   │       ├── properties.py # Properties API
│   │       ├── contacts.py   # Contacts API
│   │       └── analytics.py  # Analytics API
│   ├── schemas/               # Pydantic Models
│   │   ├── common.py         # Common Schemas
│   │   ├── documents.py      # Document Schemas
│   │   ├── tasks.py          # Task Schemas
│   │   ├── investor.py       # Investor Schemas
│   │   ├── cim.py           # CIM Schemas
│   │   ├── avm.py           # AVM Schemas
│   │   ├── appointments.py  # Appointment Schemas
│   │   ├── properties.py    # Property Schemas
│   │   └── contacts.py      # Contact Schemas
│   └── services/             # Business Logic
│       ├── storage_s3.py     # File Storage
│       ├── audit.py         # Audit Logging
│       ├── documents_service.py # Documents Logic
│       ├── tasks_service.py  # Tasks Logic
│       ├── employees_service.py # Employees Logic
│       ├── investor_service.py # Investor Logic
│       ├── cim_service.py    # CIM Logic
│       ├── avm_service.py    # AVM Logic
│       ├── appointments_service.py # Appointments Logic
│       ├── properties_service.py # Properties Logic
│       ├── contacts_service.py # Contacts Logic
│       └── analytics_service.py # Analytics Logic
├── tests/                    # Tests
├── requirements.txt         # Python Dependencies
├── env.example             # Environment Template
└── README.md              # This File
```

## API-Endpunkte

### Authentifizierung
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Token Refresh
- `POST /api/v1/auth/logout` - Logout

### Dokumente
- `GET /api/v1/documents` - Dokumente auflisten
- `POST /api/v1/documents/upload` - Dokument hochladen
- `PUT /api/v1/documents/{id}/favorite` - Favorit togglen
- `DELETE /api/v1/documents/{id}` - Dokument löschen
- `GET /api/v1/documents/folders` - Ordner auflisten
- `POST /api/v1/documents/folders` - Ordner erstellen
- `DELETE /api/v1/documents/folders/{id}` - Ordner löschen
- `GET /api/v1/documents/analytics` - Dokument-Analytics

### Tasks
- `GET /api/v1/tasks` - Tasks auflisten
- `POST /api/v1/tasks` - Task erstellen
- `GET /api/v1/tasks/{id}` - Task abrufen
- `PUT /api/v1/tasks/{id}` - Task aktualisieren
- `PATCH /api/v1/tasks/{id}/move` - Task verschieben
- `DELETE /api/v1/tasks/{id}` - Task löschen
- `GET /api/v1/tasks/statistics` - Task-Statistiken

### Mitarbeiter
- `GET /api/v1/employees` - Mitarbeiter auflisten
- `GET /api/v1/employees/{id}` - Mitarbeiter abrufen

### Investor
- `GET /api/v1/investor/portfolio` - Portfolio-Daten

### CIM
- `GET /api/v1/cim/overview` - CIM Dashboard-Übersicht

### AVM
- `POST /api/v1/avm/valuate` - Immobilie bewerten

### Termine
- `GET /api/v1/appointments` - Termine auflisten
- `POST /api/v1/appointments` - Termin erstellen
- `GET /api/v1/appointments/{id}` - Termin abrufen
- `PUT /api/v1/appointments/{id}` - Termin aktualisieren
- `DELETE /api/v1/appointments/{id}` - Termin löschen

### Immobilien
- `GET /api/v1/properties` - Immobilien auflisten
- `POST /api/v1/properties` - Immobilie erstellen
- `GET /api/v1/properties/{id}` - Immobilie abrufen
- `PUT /api/v1/properties/{id}` - Immobilie aktualisieren
- `DELETE /api/v1/properties/{id}` - Immobilie löschen

### Kontakte
- `GET /api/v1/contacts` - Kontakte auflisten
- `POST /api/v1/contacts` - Kontakt erstellen
- `GET /api/v1/contacts/{id}` - Kontakt abrufen
- `PUT /api/v1/contacts/{id}` - Kontakt aktualisieren
- `DELETE /api/v1/contacts/{id}` - Kontakt löschen

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard-Analytics
- `GET /api/v1/analytics/properties` - Property-Analytics
- `GET /api/v1/analytics/contacts` - Contact-Analytics
- `GET /api/v1/analytics/tasks` - Task-Analytics

## Authentifizierung

Alle API-Endpunkte erfordern JWT-Authentifizierung:

```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     -H "X-Tenant-ID: <tenant-id>" \
     http://localhost:8000/api/v1/documents
```

## Rollen und Berechtigungen

- **Admin**: Vollzugriff auf alle Ressourcen
- **Employee**: CRUD-Zugriff auf alle Ressourcen
- **Customer**: Lesezugriff auf eigene Ressourcen

## Multi-Tenancy

Alle Daten sind nach Tenant isoliert. Der `X-Tenant-ID` Header oder die Tenant-ID aus dem JWT-Token wird verwendet.

## Entwicklung

### Tests ausführen
```bash
pytest tests/
```

### Code-Formatierung
```bash
black app/
isort app/
```

### Linting
```bash
flake8 app/
mypy app/
```

## Deployment

### Docker
```bash
docker build -t cim-backend .
docker run -p 8000:8000 cim-backend
```

### Production
- Verwende einen WSGI-Server wie Gunicorn
- Konfiguriere Reverse Proxy (Nginx)
- Setze `DEBUG=false` in der Produktion
- Verwende starke JWT-Secrets
- Konfiguriere HTTPS

## Lizenz

Proprietär - Alle Rechte vorbehalten.
