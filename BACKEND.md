# ImmoNow Backend

## 📋 Übersicht

Das ImmoNow Backend ist eine **Multi-Tenant Real Estate Management Platform** mit einer hybriden Architektur, die **FastAPI** für die API-Schicht und **Django ORM** für die Datenpersistenz kombiniert.

### Kernfeatures

- 🏢 **Multi-Tenancy**: Vollständige Mandantentrennung mit Tenant-ID-basierter Datenisolierung
- 🔐 **JWT Authentication**: Token-basierte Authentifizierung mit Scopes und Rollen
- 💳 **Billing System**: Subscription Management mit Plan-basierten Limits
- 🤖 **AI Integration**: Dual AI System (Cloud LLM + Local Ollama/RAG)
- 📊 **Property Management**: Umfassende Immobilienverwaltung
- 👥 **Contact & CRM**: Kontaktverwaltung mit Lead-Scoring
- 📄 **Document Management**: Dokumentenablage mit Versionierung
- 📅 **Task & Project Management**: Kanban-Boards, Tasks, Subtasks
- 💰 **AVM (Automated Valuation Model)**: KI-gestützte Immobilienbewertung
- 🔗 **Publishing Integration**: ImmoScout24, Immowelt, eBay Kleinanzeigen
- 📱 **Social Media Hub**: Facebook, Instagram, LinkedIn Integration

---

## 🏗️ Architektur

### Tech Stack

| Komponente | Technologie | Version |
|------------|------------|---------|
| **Web Framework** | FastAPI | 0.104+ |
| **ORM** | Django | 4.2+ |
| **Python** | Python | 3.11+ |
| **Database** | PostgreSQL / SQLite | 14+ / 3.x |
| **Cache** | Redis | 7.0+ |
| **AI (Cloud)** | OpenRouter | API |
| **AI (Local)** | Ollama + Qdrant | Latest |
| **Task Queue** | Celery (optional) | 5.3+ |

### Hybrid Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                        FastAPI Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Routes     │→ │   Services   │→ │  Django ORM  │      │
│  │  (HTTP/API)  │  │ (Business    │  │  (Database)  │      │
│  └──────────────┘  │  Logic)      │  └──────────────┘      │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

**KRITISCH**: Django muss vor allen Django-Imports konfiguriert werden. `app/main.py` ruft `django.conf.settings.configure()` beim Start auf.

### Projektstruktur

```
backend/
├── app/
│   ├── main.py                 # FastAPI App + Django Setup (Einstiegspunkt)
│   ├── admin.py                # Django Admin Configuration
│   ├── manage.py               # Django Management CLI
│   ├── api/
│   │   ├── deps.py             # Shared Dependencies (Auth, Scopes)
│   │   └── v1/                 # API v1 Routes
│   │       ├── router.py       # Route Aggregator
│   │       ├── auth.py         # Authentication
│   │       ├── profile.py      # User Profile Management
│   │       ├── properties.py   # Property Management
│   │       ├── contacts.py     # Contact Management
│   │       ├── tasks.py        # Task Management
│   │       ├── documents.py    # Document Management
│   │       ├── llm.py          # Cloud LLM API
│   │       ├── ai_chat.py      # Local AI/RAG API
│   │       ├── avm.py          # Property Valuation
│   │       └── ...             # Weitere Domain-Router
│   ├── core/
│   │   ├── security.py         # JWT, Hashing, Token Management
│   │   ├── tenancy.py          # Multi-Tenant Logic
│   │   ├── billing_guard.py    # Subscription Limit Enforcement
│   │   ├── billing_config.py   # Plan Definitions
│   │   ├── ai_config.py        # AI System Configuration
│   │   └── errors.py           # Custom Exceptions
│   ├── db/
│   │   └── models/             # Django Models
│   │       ├── __init__.py     # Main Models Export
│   │       ├── investor.py     # Investor Models
│   │       └── ...
│   ├── schemas/                # Pydantic v2 Models
│   │   ├── auth.py
│   │   ├── property.py
│   │   ├── task.py
│   │   └── ...
│   ├── services/               # Business Logic Layer
│   │   ├── auth_service.py
│   │   ├── llm_service.py      # OpenRouter LLM Service
│   │   ├── tasks_service.py
│   │   ├── usage_service.py
│   │   └── ai/                 # Local AI Services
│   │       ├── ollama_client.py    # Ollama REST Client
│   │       ├── rag_service.py      # RAG Engine (Qdrant)
│   │       ├── orchestrator.py     # AI Chat Orchestrator
│   │       └── tools/              # Tool Calling System
│   │           ├── registry.py
│   │           ├── task_tools.py
│   │           └── ...
│   ├── migrations/             # Django Database Migrations
│   └── uploads/                # File Uploads Storage
├── backend/                    # Django Settings Package
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── tests/                      # Pytest Tests
├── requirements.txt            # Python Dependencies
├── pytest.ini                  # Pytest Configuration
├── env.example                 # Environment Variables Template
└── README.md                   # Dokumentation
```

---

## 🚀 Installation & Setup

### Voraussetzungen

- **Python 3.11+** installiert
- **PostgreSQL 14+** oder SQLite für Development
- **Redis 7.0+** für Caching (optional)
- **Ollama** für lokale AI (optional)
- **Qdrant** für RAG Vector DB (optional)

### 1. Repository Klonen

```bash
cd backend
```

### 2. Virtual Environment Erstellen

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Dependencies Installieren

```bash
pip install -r requirements.txt
```

### 4. Umgebungsvariablen Konfigurieren

Kopiere `env.example` zu `.env` und konfiguriere:

```bash
cp env.example .env
```

**Wichtige Environment Variables:**

```env
# Django Settings
SECRET_KEY=dein-geheimer-schluessel-hier
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/immonow
# Oder SQLite für Dev
DATABASE_URL=sqlite:///db.sqlite3

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=dein-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI - Cloud LLM (OpenRouter)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SITE_URL=https://immonow.com
SITE_NAME=ImmoNow

# AI - Local (Ollama + Qdrant)
OLLAMA_HOST=http://localhost:11434
OLLAMA_CHAT_MODEL=deepseek-r1:8b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=deine@email.de
EMAIL_HOST_PASSWORD=dein-passwort

# File Uploads
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=.pdf,.doc,.docx,.jpg,.png

# External APIs (optional)
IMMOSCOUT24_API_KEY=...
IMMOWELT_API_KEY=...
GOOGLE_MAPS_API_KEY=...
```

### 5. Datenbank Migrationen

```bash
# Django Migrationen erstellen
python manage.py makemigrations

# Migrationen anwenden
python manage.py migrate

# Superuser erstellen
python manage.py createsuperuser
```

### 6. Server Starten

#### FastAPI Server (API - Port 8000)

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Django Admin Server (Port 8001)

```bash
python manage.py runserver 0.0.0.0:8001
```

**URLs:**
- FastAPI API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc
- Django Admin: http://localhost:8001/admin

---

## 🤖 AI System Setup

### Cloud LLM (OpenRouter)

1. Account erstellen: https://openrouter.ai/
2. API Key generieren
3. In `.env` setzen:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

**Verfügbare Modelle:**
- `deepseek/deepseek-chat-v3.1:free` ✅ (kostenlos, empfohlen)
- `google/gemini-2.0-flash-exp:free`
- `qwen/qwen-2.5-72b-instruct:free`

### Local AI (Ollama + Qdrant)

#### 1. Ollama Installieren

```bash
# Windows
winget install Ollama.Ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Mac
brew install ollama
```

#### 2. Modelle Herunterladen

```bash
# Chat Model (8GB)
ollama pull deepseek-r1:8b

# Embedding Model (274MB)
ollama pull nomic-embed-text
```

#### 3. Qdrant Starten (Vector Database)

**Docker:**
```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

**Oder mit docker-compose** (siehe `deployment/docker-compose.ai.yml`)

#### 4. Test

```bash
# Health Check
curl http://localhost:8000/api/v1/ai/health
```

**Erwartete Response:**
```json
{
  "qdrant": true,
  "ollama": true,
  "collection_exists": true,
  "tenant_chunk_count": 0
}
```

---

## 📚 API Dokumentation

### Base URL

```
http://localhost:8000/api/v1
```

### Authentication

Alle geschützten Endpoints benötigen einen JWT Token im Authorization Header:

```http
Authorization: Bearer <access_token>
```

### Token Erhalten

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": { ... },
  "tenant": { ... }
}
```

### Wichtige Endpoints

#### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Registration
- `GET /auth/me` - Current User
- `POST /auth/logout` - Logout

#### Profile Management
- `GET /me/profile` - Get User Profile
- `PATCH /me/profile` - Update Profile
- `PATCH /me/preferences` - Update Preferences
- `PATCH /me/notifications` - Update Notification Settings
- `POST /me/change-password` - Change Password
- `POST /me/avatar` - Upload Avatar

#### Properties
- `GET /properties` - List Properties
- `POST /properties` - Create Property
- `GET /properties/{id}` - Get Property Details
- `PUT /properties/{id}` - Update Property
- `DELETE /properties/{id}` - Delete Property

#### Tasks
- `GET /tasks` - List Tasks
- `POST /tasks` - Create Task
- `GET /tasks/{id}` - Get Task
- `PUT /tasks/{id}` - Update Task
- `DELETE /tasks/{id}` - Delete Task

#### AI Services
- `POST /llm/ask` - General Q&A (Cloud LLM)
- `POST /ai/chat` - Chat with RAG (Local AI)
- `POST /ai/ingest` - Ingest Document to RAG
- `POST /ai/upload` - Upload File to RAG
- `GET /ai/health` - AI System Health

#### AVM (Property Valuation)
- `POST /avm/valuate` - Property Valuation

#### Documents
- `GET /documents` - List Documents
- `POST /documents` - Upload Document
- `GET /documents/{id}` - Get Document
- `DELETE /documents/{id}` - Delete Document

**Vollständige API-Dokumentation:** http://localhost:8000/docs

---

## 🧪 Testing

### Unit Tests

```bash
pytest
```

### Mit Coverage

```bash
pytest --cov=app --cov-report=html
```

### Spezifische Tests

```bash
# Einzelne Datei
pytest tests/test_auth.py

# Einzelner Test
pytest tests/test_auth.py::test_login

# Mit Verbose Output
pytest -v
```

### Test Configuration

`pytest.ini`:
```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

---

## 🔐 Multi-Tenancy & Security

### Tenant Isolation

Jede Anfrage benötigt:
1. **JWT Token** mit `tenant_id` im Payload
2. **Alle DB-Queries** filtern nach `tenant_id`

**Beispiel Service:**
```python
class PropertyService:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_properties(self):
        return await sync_to_async(list)(
            Property.objects.filter(tenant_id=self.tenant_id)
        )
```

### Scopes & Permissions

**Verfügbare Scopes:**
- `read` - Lesezugriff
- `write` - Schreibzugriff
- `admin` - Administrative Rechte

**Scope Guards:**
```python
from app.api.deps import require_write_scope

@router.post("/properties")
async def create_property(
    data: PropertyCreate,
    current_user: TokenData = Depends(require_write_scope)
):
    ...
```

---

## 💳 Billing & Subscription System

### Plan-basierte Limits

**Verfügbare Pläne:**
- **Starter** (kostenlos)
- **Professional** (€49/Monat)
- **Enterprise** (€199/Monat)

**Limits pro Plan:**

| Resource | Starter | Professional | Enterprise |
|----------|---------|--------------|------------|
| Properties | 10 | 100 | Unlimited |
| Users | 2 | 10 | Unlimited |
| Storage | 1 GB | 50 GB | 500 GB |
| Documents | 100 | 5000 | Unlimited |

### Limit Enforcement

```python
from app.core.billing_guard import BillingGuard

# Check vor teurer Operation
await BillingGuard.check_subscription_status(tenant_id)

# Check Limit vor Erstellung
await BillingGuard.check_limit(tenant_id, 'properties', additional_count=1)
```

**Raises:** `HTTPException(402)` wenn Limit erreicht

---

## 📝 Development Best Practices

### Code Style

```bash
# Format Code
black app/

# Lint
flake8 app/

# Type Checking
mypy app/
```

### Git Workflow

```bash
# Feature Branch
git checkout -b feature/neue-funktion

# Commit
git add .
git commit -m "feat: Neue Funktion hinzugefügt"

# Push
git push origin feature/neue-funktion
```

### Commit Message Format

```
feat: Neue Funktion
fix: Bug Fix
docs: Dokumentation
refactor: Code Refactoring
test: Tests hinzugefügt
chore: Wartung
```

---

## 🐳 Docker Deployment

### Docker Compose (Full Stack)

```bash
cd deployment
docker-compose up -d
```

**Services:**
- Backend (FastAPI): Port 8000
- Django Admin: Port 8001
- PostgreSQL: Port 5432
- Redis: Port 6379
- Ollama: Port 11434
- Qdrant: Port 6333

### Production Build

```bash
# Build Image
docker build -f deployment/Dockerfile.backend -t immonow-backend .

# Run Container
docker run -d \
  -p 8000:8000 \
  --env-file .env \
  --name immonow-backend \
  immonow-backend
```

---

## 🔧 Troubleshooting

### Häufige Probleme

#### 1. Django Settings nicht konfiguriert

**Error:** `django.core.exceptions.ImproperlyConfigured`

**Lösung:** Stelle sicher, dass `app/main.py` vor allen Django-Imports geladen wird.

#### 2. Migrations Konflikt

```bash
# Reset Migrations
python manage.py migrate --fake-initial
python manage.py migrate
```

#### 3. Ollama Connection Error

```bash
# Check Ollama Status
ollama list

# Restart Ollama
# Windows: Restart Ollama Desktop App
# Linux: sudo systemctl restart ollama
```

#### 4. Qdrant Connection Error

```bash
# Check Qdrant
docker ps | grep qdrant

# Restart Qdrant
docker restart qdrant
```

#### 5. Storage Calculation Error

**Error:** Missing file sizes in database

**Lösung:** File sizes werden beim Upload berechnet. Alte Dokumente:
```python
# Migration erstellen für fehlende Größen
python manage.py makemigrations --empty yourapp
```

---

## 📊 Monitoring & Logging

### Logs

```bash
# FastAPI Logs
uvicorn app.main:app --log-level info

# Django Logs (settings.py)
LOGGING = {
    'version': 1,
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

### Performance Monitoring

```bash
# Install
pip install fastapi-profiler

# Add to main.py
from fastapi_profiler import PyInstrumentProfilerMiddleware
app.add_middleware(PyInstrumentProfilerMiddleware)
```

---

## 🚀 Production Checklist

- [ ] `DEBUG=False` in `.env`
- [ ] Starke `SECRET_KEY` generieren
- [ ] PostgreSQL statt SQLite
- [ ] Redis für Caching aktivieren
- [ ] HTTPS aktivieren
- [ ] CORS richtig konfigurieren
- [ ] Rate Limiting aktivieren
- [ ] Backup-Strategie implementieren
- [ ] Monitoring Setup (Sentry, etc.)
- [ ] Logs auf Server konfigurieren

---

## 📞 Support & Contributing

### Bugs Melden

GitHub Issues: [Link zum Repository]

### Contributing

1. Fork das Repository
2. Feature Branch erstellen
3. Tests schreiben
4. Pull Request erstellen

---

## 📄 Lizenz

[Deine Lizenz hier]

---

## 🎯 Roadmap

- [ ] GraphQL API
- [ ] WebSocket Real-time Updates
- [ ] Mobile App Backend
- [ ] Advanced Analytics
- [ ] Blockchain Integration (NFT für Properties)
- [ ] IoT Device Integration

---

**Version:** 1.0.0  
**Letztes Update:** Dezember 2025  
**Python:** 3.11+  
**FastAPI:** 0.104+  
**Django:** 4.2+
