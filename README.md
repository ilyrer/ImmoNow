# 🏢 ImmoNow - Enterprise Real Estate Management Platform

> Die modernste Multi-Tenant SaaS-Plattform für Immobilienverwaltung in der DACH-Region

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd ImmoNow

# Backend Setup
cd backend
pip install -r requirements.txt
cp env.example env.local
python manage.py migrate
python manage.py createsuperuser
uvicorn app.main:app --reload

# Frontend Setup (neue Terminal-Session)
cd frontend
npm install
npm start
```

**URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🎯 Projekt-Übersicht

### Was ist ImmoNow?

ImmoNow ist eine **Enterprise-Level SaaS-Plattform** für moderne Immobilienverwaltung. Wir kombinieren **AI-First-Ansätze** mit **erstklassiger UX** und **robuster Multi-Tenant-Architektur**, um die beste Lösung am Markt zu schaffen.

### Für wen?

- 🏢 **Maklerbüros**: Immobilien-, Kontakt- und Dokumentenverwaltung
- 💼 **Immobilienverwalter**: Portfolio-Management und Reporting
- 🏗️ **Projektentwickler**: Baufortschritt und Investor Relations
- 💰 **Investoren**: Portfolio-Übersicht und Performance-Tracking

---

## ✨ Key Features

### Core Features (✅ Live)

#### 🏠 Property Management
- Vollständige Immobilienverwaltung (CRUD)
- Bildergalerien mit Drag & Drop
- Dokumente und Anhänge
- Status-Tracking (Verfügbar, Verkauft, Vermietet, etc.)
- Erweiterte Filter und Suche

#### 👥 CRM & Contacts
- Kontaktverwaltung (Käufer, Verkäufer, Mieter)
- Contact-Property Matching
- Aktivitäts-Historie
- Notizen und Tags

#### 📄 Document Management
- Ordnerstruktur
- Multi-File-Upload
- Versioning (geplant)
- OCR für PDF-Extraktion (geplant)

#### 📊 Analytics & Dashboards
- Rollenbasierte Dashboards
- KPI-Tracking (Properties, Deals, Revenue)
- Team-Performance
- Interaktive Charts (Recharts)

#### 💰 Billing & Subscriptions
- Stripe-Integration
- 4 Pläne (Free, Starter, Pro, Enterprise)
- Usage-based Features
- Subscription Management

#### 🤖 AI Features
- AI Chatbot (Assistant)
- Property Description Generation
- Document Analysis (in Progress)
- Smart Matching (in Progress)

### Advanced Features (🔄 In Development)

#### 📍 AVM (Automated Valuation Model)
- Automatische Wertermittlung
- Vergleichsobjekt-Analyse
- Marktdaten-Integration
- Confidence Scores

#### 📱 Social Media Hub
- Multi-Channel Publishing (Facebook, Instagram, LinkedIn)
- Auto-Posting mit AI-generierten Texten
- Analytics pro Kanal
- OAuth-Integration

#### 💼 Investor Portal
- Portfolio-Übersicht
- Performance-Reports
- Document Vault
- Communication Center

#### 🗺️ Location Intelligence
- Google Maps / OpenStreetMap
- Heatmaps für Immobilienpreise
- POI-Analyse (Schulen, Transport, Shopping)
- Neighborhood Scoring

---

## 🏗️ Technologie-Stack

### Backend

```yaml
Framework: FastAPI 0.104
ORM: Django 4.2 (Models + Migrations)
Database: SQLite (Dev), PostgreSQL (Prod)
Auth: JWT + OAuth2
AI/LLM: OpenRouter (DeepSeek R1), OpenAI, Azure
Storage: AWS S3 (Prod), Local (Dev)
Cache: Redis
Queue: Celery
Payments: Stripe
Testing: Pytest
```

**Warum dieser Stack?**
- ⚡ **FastAPI**: Modernste async APIs, Auto-Dokumentation
- 🛡️ **Django ORM**: Robuste Datenmodelle, bewährte Migrations
- 🤖 **OpenRouter**: Zugang zu 60+ LLM-Modellen, kosteneffizient
- 💳 **Stripe**: Marktführer für Payments, EU-Tax-Compliance

### Frontend

```yaml
Framework: React 18 (TypeScript)
Styling: Tailwind CSS 3.4
State: React Query 5 (Server State), Context (Client State)
Routing: React Router v6
UI Library: Custom Design System (Apple-inspired)
Maps: Google Maps API, React Leaflet
Charts: Recharts
Forms: Native + Validation
Notifications: React Hot Toast
```

**Warum dieser Stack?**
- ⚛️ **React 18**: Concurrent Features, Suspense
- 🎨 **Tailwind CSS**: Utility-First, extrem produktiv
- 🔄 **React Query**: Simplifies Server State, Caching, Optimistic Updates
- 🎭 **TypeScript**: Type Safety, bessere DX

---

## 📁 Projekt-Struktur

```
ImmoNow/
├── .cursorrules              # 🤖 AI Coding Standards & Guidelines
├── .cursorignore             # 🚫 Ignoriere irrelevante Dateien
├── DEVELOPMENT_GUIDE.md      # 📖 Praktische Entwickler-Anleitungen
├── PROJECT_CONTEXT.md        # 🧠 Architektur-Entscheidungen & Context
├── CONTRIBUTING.md           # 🤝 Contribution Guidelines
├── README.md                 # 📄 Dieses Dokument
│
├── backend/                  # 🐍 Python Backend
│   ├── app/
│   │   ├── api/v1/          # FastAPI Routes (34 Module)
│   │   ├── core/            # Settings, Auth, Middleware
│   │   ├── db/models/       # Django Models
│   │   ├── schemas/         # Pydantic Schemas
│   │   ├── services/        # Business Logic (43 Services)
│   │   ├── tasks/           # Celery Tasks
│   │   └── tools/           # AI Agent Tools
│   ├── tests/               # Pytest Tests
│   ├── migrations/          # Django Migrations
│   ├── requirements.txt     # Python Dependencies
│   ├── env.example          # Environment Template
│   └── main.py              # Application Entry Point
│
├── frontend/                 # ⚛️ React Frontend
│   ├── src/
│   │   ├── components/      # React Components (200+)
│   │   ├── pages/           # Page Components (24)
│   │   ├── api/             # React Query Hooks
│   │   ├── services/        # API Services (24)
│   │   ├── types/           # TypeScript Types (27)
│   │   ├── hooks/           # Custom Hooks (22)
│   │   └── contexts/        # React Contexts
│   ├── public/              # Static Assets
│   ├── package.json         # NPM Dependencies
│   └── tailwind.config.js   # Tailwind Configuration
│
├── deployment/               # 🐳 Docker & Deployment
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
│
├── DOCS/                     # 📚 Documentation
│   ├── architecture-overview.md
│   ├── ai/                  # AI System Docs
│   └── ...
│
└── scripts/                  # 🔧 Utility Scripts
```

---

## 🎨 Design System

### Design Philosophy

Unser Design-System ist von **Apple** inspiriert:
- ✨ **Minimalistisch**: Fokus auf Content, nicht Dekoration
- 🌓 **Dark Mode Native**: Nicht nachträglich, sondern von Anfang an
- 💎 **Glassmorphism**: Moderne, transparente UI-Elemente
- 🎯 **User-Centric**: Intuitive Navigation, klare Hierarchie
- 📱 **Mobile First**: Responsive für alle Geräte

### Color Palette

```css
/* Primary Colors */
--primary-600: #4f46e5;    /* Indigo - Hauptfarbe */
--accent-600: #10b981;     /* Grün - Erfolg */

/* Apple Colors */
--apple-blue: #0A84FF;     /* Actions */
--apple-green: #32D74B;    /* Success */
--apple-red: #FF453A;      /* Errors */
--apple-orange: #FF9F0A;   /* Warnings */

/* Neutrals */
--neutral-900: #111827;    /* Text Dark */
--neutral-50: #f9fafb;     /* Background Light */

/* Dark Mode */
--dark-300: #1C1C1E;       /* Surface */
--dark-600: #0A0A0C;       /* Background */
```

### Typography

```css
/* Font Families */
--font-sans: Inter, ui-sans-serif, system-ui;
--font-heading: Manrope, ui-sans-serif;
--font-display: Poppins, ui-sans-serif;
```

---

## 🔐 Security & Compliance

### Security Features

- 🔒 **JWT Authentication**: Access + Refresh Tokens
- 🛡️ **Multi-Tenant Isolation**: Row-Level Security
- 🔐 **Password Hashing**: Bcrypt
- 🚦 **Rate Limiting**: 100 req/min pro User
- 🔍 **Input Validation**: Pydantic Schemas
- 📝 **Audit Logging**: Alle kritischen Aktionen
- 🌐 **CORS**: Konfiguriert für Prod/Dev

### DSGVO-Compliance

- ✅ **Data Storage**: EU-Region (Frankfurt)
- ✅ **Right to Access**: JSON Export
- ✅ **Right to Deletion**: Soft Delete + Anonymization
- ✅ **Data Retention**: Konfigurierbar (default: 30 Tage nach Löschung)
- ✅ **Audit Trail**: Vollständig nachvollziehbar
- 🔄 **Consent Management**: (geplant Phase 2)

---

## 💰 Pricing & Plans

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|------------|
| **Preis** | €0 | €29/mo | €99/mo | €299/mo |
| **Properties** | 5 | 50 | 500 | Unlimited |
| **Users** | 1 | 3 | 10 | Unlimited |
| **Storage** | 1 GB | 10 GB | 100 GB | 1 TB |
| **AI Requests** | 100/mo | 1,000/mo | 10,000/mo | 100,000/mo |
| **Support** | Community | Email | Priority | Dedicated |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **SLA** | - | - | 99.5% | 99.9% |

---

## 🚀 Roadmap

### Phase 1: Foundation (✅ DONE)
- Multi-Tenant-Architektur
- Auth System (JWT + OAuth)
- Basic CRUD (Properties, Contacts, Documents)
- Billing Integration (Stripe)
- Admin Console

### Phase 2: AI & Automation (🔄 IN PROGRESS)
- AI Assistant
- AVM (Automated Valuation)
- Document Analysis (OCR)
- Smart Matching

### Phase 3: Advanced Features (📅 Q1 2025)
- Advanced Analytics
- Social Media Hub
- Investor Portal
- Mobile App (PWA)

### Phase 4: Scale (🚀 Q2 2025)
- API Marketplace
- White Label Solution
- International Expansion
- Blockchain für Verträge

---

## 🧪 Testing

### Run Tests

**Backend**:
```bash
cd backend
pytest                          # Alle Tests
pytest -v                       # Verbose
pytest tests/test_properties.py # Spezifische Datei
pytest -k "test_auth"          # Nur Auth Tests
pytest --cov                    # Mit Coverage
```

**Frontend**:
```bash
cd frontend
npm test                        # Alle Tests
npm test -- --coverage         # Mit Coverage
npm test -- PropertyCard       # Spezifische Suite
```

### Test Coverage

**Ziele**:
- Critical Paths (Auth, Billing, Multi-Tenant): **100%**
- Features: **80%+**
- Overall: **80%+**

**Current Status**:
- Backend: ~75% (Target: 80%)
- Frontend: ~65% (Target: 80%)

---

## 📚 Dokumentation

### Für Entwickler

1. **[.cursorrules](.cursorrules)**: Vollständige Coding Standards & Guidelines
2. **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)**: Praktische Schritt-für-Schritt-Anleitungen
3. **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)**: Architektur-Entscheidungen & Kontext
4. **[CONTRIBUTING.md](CONTRIBUTING.md)**: Contribution Guidelines

### API Dokumentation

- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc (Alternative UI)
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Architecture Docs

- [Architecture Overview](DOCS/architecture-overview.md)
- [AI System Architecture](DOCS/ai/ARCHITECTURE.md)
- [AVM Implementation](DOCS/AVM_PREMIUM_IMPLEMENTATION.md)
- [Location Management](DOCS/LOCATION_MANAGEMENT.md)

---

## 🤝 Contributing

Wir freuen uns über Contributions! Bitte lies [CONTRIBUTING.md](CONTRIBUTING.md) für Details.

### Quick Start für Contributors

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/amazing-feature`
3. **Changes** committen: `git commit -m 'feat(scope): Add amazing feature'`
4. **Push** to Branch: `git push origin feature/amazing-feature`
5. **Pull Request** öffnen

### Code Standards

- ✅ Folge `.cursorrules`
- ✅ Tests schreiben (min. 80% Coverage)
- ✅ Dokumentation aktualisieren
- ✅ Conventional Commits nutzen
- ✅ Code Review durchlaufen

---

## 📞 Support & Community

### Getting Help

- 📖 **Documentation**: Siehe [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
- 🐛 **Bug Reports**: [GitHub Issues](../../issues)
- 💡 **Feature Requests**: [GitHub Discussions](../../discussions)
- 💬 **Chat**: Slack #dev-questions (internes Team)

### Contact

- **Website**: https://immonow.com (geplant)
- **Email**: support@immonow.com (geplant)
- **Twitter**: @ImmoNowApp (geplant)

---

## 📝 License

**Proprietary** - © 2024 ImmoNow. All rights reserved.

Dieses Projekt ist closed-source und proprietär. Keine Lizenz für Nutzung, Modifikation oder Verteilung ohne explizite Genehmigung.

---

## 🙏 Acknowledgments

### Technologies

Vielen Dank an die Open-Source-Community für diese fantastischen Tools:
- [FastAPI](https://fastapi.tiangolo.com/) - Modernes Python Web Framework
- [React](https://react.dev/) - UI Library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS
- [React Query](https://tanstack.com/query/latest) - Server State Management
- [Stripe](https://stripe.com/) - Payment Infrastructure

### Inspiration

- Apple Design Guidelines
- Vercel Design System
- Linear App (Project Management UI)
- Notion (Document Management)

---

## 🎯 Vision

> "Wir bauen die beste Immobilien-Management-Plattform Europas."

Unser Ziel ist es, nicht nur Features zu liefern, sondern eine **Enterprise-Level-Lösung** zu schaffen, die:
- 🚀 **Performance**: Sub-200ms Response-Zeiten
- 💎 **UX**: Intuitive, freudvolle Nutzererfahrung
- 🤖 **AI-First**: Intelligente Automatisierung überall
- 🔒 **Security**: Bank-Level Security Standards
- 📈 **Scalability**: Skaliert auf Millionen von Properties

**Wir sind hier, um zu gewinnen. 🏆**

---

<div align="center">

**[⬆ Back to Top](#-immonow---enterprise-real-estate-management-platform)**

Made with ❤️ and ☕ by the ImmoNow Team

**Version**: 1.0.0 | **Last Updated**: 2024-12-29

</div>

